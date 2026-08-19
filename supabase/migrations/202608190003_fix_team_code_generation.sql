-- Fixes: function gen_random_bytes(integer) does not exist
-- The original function uses a restricted search_path, while pgcrypto is
-- installed in the extensions schema. Recreate only the affected function
-- with a dependency-free unique alphanumeric code generator.

create or replace function public.create_event_team(
  p_player_id uuid, p_challenge_name text, p_team_name text, p_leader jsonb, p_members jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_challenge challenges; v_team teams; v_code text; v_member jsonb; v_expected int;
begin
  select * into v_challenge from challenges where name=upper(trim(p_challenge_name)) and is_open;
  if not found then raise exception 'Challenge is unavailable'; end if;
  if v_challenge.registration_type <> 'team' then raise exception 'This challenge accepts individual entries'; end if;
  if not exists(select 1 from players where id=p_player_id) then raise exception 'Register as a player first'; end if;
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

  return jsonb_build_object('team_id',v_team.id,'team_code',v_code,'team_name',v_team.name,'challenge',v_challenge.name);
end $$;

grant execute on function public.create_event_team(uuid,text,text,jsonb,jsonb) to anon,authenticated;

