-- A player may participate in no more than four distinct challenges.

create or replace function public.player_event_count(p_player_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from (
    select ir.challenge_id
    from individual_registrations ir
    where ir.player_id = p_player_id
    union
    select t.challenge_id
    from team_members tm
    join teams t on t.id = tm.team_id
    where tm.player_id = p_player_id and tm.joined_at is not null
  ) registered_events;
$$;

revoke all on function public.player_event_count(uuid) from public, anon, authenticated;

create or replace function public.create_event_team(
  p_player_id uuid, p_challenge_name text, p_team_name text, p_leader jsonb, p_members jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_challenge challenges; v_team teams; v_code text; v_member jsonb; v_expected int; v_event_count int;
begin
  select * into v_challenge from challenges where name=upper(trim(p_challenge_name)) and is_open;
  if not found then raise exception 'Challenge is unavailable'; end if;
  if v_challenge.registration_type <> 'team' then raise exception 'This challenge accepts individual entries'; end if;
  perform 1 from players where id=p_player_id for update;
  if not found then raise exception 'Register as a player first'; end if;
  if exists(select 1 from teams where challenge_id=v_challenge.id and leader_player_id=p_player_id)
     or exists(select 1 from team_members tm join teams t on t.id=tm.team_id where t.challenge_id=v_challenge.id and tm.player_id=p_player_id) then
    raise exception 'You have already registered for this event';
  end if;
  v_event_count := public.player_event_count(p_player_id);
  if v_event_count >= 4 then raise exception 'A player can register for a maximum of four events'; end if;
  v_expected := jsonb_array_length(p_members)+1;
  if v_expected <> v_challenge.team_size then raise exception 'This challenge requires exactly % players',v_challenge.team_size; end if;

  loop
    v_code := 'IN8'||upper(substr(md5(random()::text||clock_timestamp()::text||p_player_id::text),1,6));
    exit when not exists(select 1 from teams where code=v_code);
  end loop;

  insert into teams(challenge_id,name,code,leader_player_id)
  values(v_challenge.id,trim(p_team_name),v_code,p_player_id)
  returning * into v_team;

  insert into team_members(team_id,player_id,full_name,register_number,department,year_of_study,phone,email,role,joined_at)
  values(v_team.id,p_player_id,trim(p_leader->>'name'),trim(p_leader->>'registerNumber'),(p_leader->>'department')::innov8_department,(p_leader->>'year')::innov8_year,trim(p_leader->>'contact'),lower(trim(p_leader->>'email')),'leader',now());

  for v_member in select * from jsonb_array_elements(p_members) loop
    insert into team_members(team_id,full_name,register_number,department,year_of_study,phone,email,role)
    values(v_team.id,trim(v_member->>'name'),trim(v_member->>'registerNumber'),(v_member->>'department')::innov8_department,(v_member->>'year')::innov8_year,trim(v_member->>'contact'),lower(trim(v_member->>'email')),'member');
  end loop;

  return jsonb_build_object('team_id',v_team.id,'team_code',v_code,'team_name',v_team.name,'challenge',v_challenge.name,'registered_events',v_event_count+1,'event_limit',4);
end $$;

create or replace function public.join_event_team(p_player_id uuid,p_challenge_name text,p_team_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_team teams; v_challenge challenges; v_player players; v_slot team_members; v_joined int; v_event_count int;
begin
  select * into v_player from players where id=p_player_id for update;
  if not found then raise exception 'Register as a player first'; end if;
  select t,c into v_team,v_challenge from teams t join challenges c on c.id=t.challenge_id where t.code=upper(trim(p_team_code)) and c.name=upper(trim(p_challenge_name));
  if not found then raise exception 'Team code not found for this challenge'; end if;
  if exists(select 1 from team_members where team_id=v_team.id and player_id=p_player_id) then
    return jsonb_build_object('joined',true,'team_name',v_team.name,'team_code',v_team.code,'already_registered',true);
  end if;
  if exists(select 1 from team_members tm join teams t on t.id=tm.team_id where t.challenge_id=v_challenge.id and tm.player_id=p_player_id) then
    raise exception 'You have already registered for this event with another team';
  end if;
  v_event_count := public.player_event_count(p_player_id);
  if v_event_count >= 4 then raise exception 'A player can register for a maximum of four events'; end if;
  select * into v_slot from team_members where team_id=v_team.id and joined_at is null and (lower(email)=lower(v_player.email) or register_number=v_player.register_number) order by created_at limit 1 for update;
  if not found then raise exception 'Your email or register number is not on this team roster'; end if;
  update team_members set player_id=p_player_id,joined_at=now() where id=v_slot.id;
  select count(*) into v_joined from team_members where team_id=v_team.id and joined_at is not null;
  return jsonb_build_object('joined',true,'team_name',v_team.name,'team_code',v_team.code,'joined_members',v_joined,'team_size',v_challenge.team_size,'registered_events',v_event_count+1,'event_limit',4);
end $$;

create or replace function public.register_individual_event(p_player_id uuid,p_challenge_name text,p_participant jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_challenge challenges; v_registration individual_registrations; v_event_count int;
begin
  select * into v_challenge from challenges where name=upper(trim(p_challenge_name)) and registration_type='individual' and is_open;
  if not found then raise exception 'Individual registration is unavailable for this challenge'; end if;
  perform 1 from players where id=p_player_id for update;
  if not found then raise exception 'Register as a player first'; end if;
  select * into v_registration from individual_registrations where challenge_id=v_challenge.id and player_id=p_player_id;
  if found then
    return jsonb_build_object('registered',true,'registration_id',v_registration.id,'challenge',v_challenge.name,'already_registered',true);
  end if;
  v_event_count := public.player_event_count(p_player_id);
  if v_event_count >= 4 then raise exception 'A player can register for a maximum of four events'; end if;
  insert into individual_registrations(challenge_id,player_id,participant)
  values(v_challenge.id,p_player_id,p_participant)
  returning * into v_registration;
  return jsonb_build_object('registered',true,'registration_id',v_registration.id,'challenge',v_challenge.name,'registered_events',v_event_count+1,'event_limit',4);
end $$;

grant execute on function public.create_event_team(uuid,text,text,jsonb,jsonb) to anon,authenticated;
grant execute on function public.join_event_team(uuid,text,text) to anon,authenticated;
grant execute on function public.register_individual_event(uuid,text,jsonb) to anon,authenticated;
