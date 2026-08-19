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
  if p_player_id is null or not exists(select 1 from players where id = p_player_id) then
    return jsonb_build_object('registered', false);
  end if;

  select * into v_challenge
  from challenges
  where name = upper(trim(p_challenge_name));

  if not found then
    raise exception 'Challenge not found';
  end if;

  if v_challenge.registration_type = 'individual' then
    select * into v_individual
    from individual_registrations
    where challenge_id = v_challenge.id and player_id = p_player_id;

    if not found then return jsonb_build_object('registered', false); end if;

    return jsonb_build_object(
      'registered', true,
      'type', 'individual',
      'challenge', v_challenge.name,
      'registered_at', v_individual.created_at
    );
  end if;

  select t,
         case when t.leader_player_id = p_player_id then 'leader' else 'member' end
  into v_team, v_role
  from teams t
  where t.challenge_id = v_challenge.id
    and (
      t.leader_player_id = p_player_id or
      exists(select 1 from team_members tm where tm.team_id = t.id and tm.player_id = p_player_id)
    )
  limit 1;

  if not found then return jsonb_build_object('registered', false); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', tm.full_name,
    'role', tm.role,
    'joined', tm.joined_at is not null,
    'joined_at', tm.joined_at
  ) order by case when tm.role = 'leader' then 0 else 1 end, tm.created_at), '[]'::jsonb)
  into v_members
  from team_members tm
  where tm.team_id = v_team.id;

  return jsonb_build_object(
    'registered', true,
    'type', 'team',
    'role', v_role,
    'challenge', v_challenge.name,
    'team_id', v_team.id,
    'team_name', v_team.name,
    'team_code', v_team.code,
    'team_size', v_challenge.team_size,
    'joined_count', (select count(*) from team_members where team_id = v_team.id and joined_at is not null),
    'members', v_members,
    'created_at', v_team.created_at
  );
end $$;

grant execute on function public.get_event_registration_status(uuid,text) to anon, authenticated;

