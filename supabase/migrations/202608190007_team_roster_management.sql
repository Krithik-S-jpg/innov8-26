-- Team leaders can manage non-leader roster slots after team creation.

create or replace function public.add_team_member(
  p_player_id uuid,
  p_team_id uuid,
  p_member jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team teams;
  v_challenge challenges;
  v_member team_members;
  v_count integer;
begin
  select * into v_team from teams where id=p_team_id for update;
  if not found then raise exception 'Team not found'; end if;
  if v_team.leader_player_id <> p_player_id then raise exception 'Only the team leader can add members'; end if;

  select * into v_challenge from challenges where id=v_team.challenge_id;
  select count(*) into v_count from team_members where team_id=v_team.id;
  if v_count >= v_challenge.team_size then
    raise exception 'Team roster is full. Maximum: % players',v_challenge.team_size;
  end if;
  if coalesce(trim(p_member->>'name'),'')='' or coalesce(trim(p_member->>'registerNumber'),'')='' or coalesce(trim(p_member->>'email'),'')='' then
    raise exception 'Complete all member details';
  end if;

  insert into team_members(team_id,full_name,register_number,department,year_of_study,phone,email,role)
  values(v_team.id,trim(p_member->>'name'),trim(p_member->>'registerNumber'),(p_member->>'department')::innov8_department,(p_member->>'year')::innov8_year,trim(p_member->>'contact'),lower(trim(p_member->>'email')),'member')
  returning * into v_member;

  return jsonb_build_object('added',true,'member_id',v_member.id,'name',v_member.full_name);
exception
  when unique_violation then raise exception 'This email or register number is already on the team';
end $$;

create or replace function public.remove_team_member(
  p_player_id uuid,
  p_team_id uuid,
  p_member_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team teams;
  v_member team_members;
begin
  select * into v_team from teams where id=p_team_id for update;
  if not found then raise exception 'Team not found'; end if;
  if v_team.leader_player_id <> p_player_id then raise exception 'Only the team leader can remove members'; end if;

  select * into v_member from team_members where id=p_member_id and team_id=v_team.id for update;
  if not found then raise exception 'Team member not found'; end if;
  if v_member.role='leader' then raise exception 'The team leader cannot be removed'; end if;

  delete from team_members where id=v_member.id;
  return jsonb_build_object('removed',true,'member_id',v_member.id,'name',v_member.full_name);
end $$;

create or replace function public.get_event_registration_status(
  p_player_id uuid,
  p_challenge_name text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge challenges;
  v_team teams;
  v_members jsonb;
  v_role text;
  v_individual individual_registrations;
begin
  if p_player_id is null or not exists(select 1 from players where id=p_player_id) then
    return jsonb_build_object('registered',false);
  end if;
  select * into v_challenge from challenges where name=upper(trim(p_challenge_name));
  if not found then raise exception 'Challenge not found'; end if;

  if v_challenge.registration_type='individual' then
    select * into v_individual from individual_registrations where challenge_id=v_challenge.id and player_id=p_player_id;
    if not found then return jsonb_build_object('registered',false); end if;
    return jsonb_build_object('registered',true,'type','individual','challenge',v_challenge.name,'registered_at',v_individual.created_at);
  end if;

  select t,case when t.leader_player_id=p_player_id then 'leader' else 'member' end
  into v_team,v_role
  from teams t
  where t.challenge_id=v_challenge.id and (
    t.leader_player_id=p_player_id or
    exists(select 1 from team_members tm where tm.team_id=t.id and tm.player_id=p_player_id)
  ) limit 1;
  if not found then return jsonb_build_object('registered',false); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id',tm.id,
    'name',tm.full_name,
    'role',tm.role,
    'joined',tm.joined_at is not null,
    'joined_at',tm.joined_at
  ) order by case when tm.role='leader' then 0 else 1 end,tm.created_at),'[]'::jsonb)
  into v_members from team_members tm where tm.team_id=v_team.id;

  return jsonb_build_object(
    'registered',true,'type','team','role',v_role,'challenge',v_challenge.name,
    'team_id',v_team.id,'team_name',v_team.name,'team_code',v_team.code,
    'team_size',v_challenge.team_size,
    'joined_count',(select count(*) from team_members where team_id=v_team.id and joined_at is not null),
    'members',v_members,'created_at',v_team.created_at
  );
end $$;

grant execute on function public.add_team_member(uuid,uuid,jsonb) to anon,authenticated;
grant execute on function public.remove_team_member(uuid,uuid,uuid) to anon,authenticated;
grant execute on function public.get_event_registration_status(uuid,text) to anon,authenticated;

