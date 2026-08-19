create or replace function public.get_my_registrations()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_events jsonb;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select id into v_player_id from players where auth_user_id=auth.uid();
  if not found then raise exception 'Player profile not found'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name',registered.name,
    'type',registered.entry_type,
    'team_name',registered.team_name
  ) order by registered.name),'[]'::jsonb)
  into v_events
  from (
    select c.name,'INDIVIDUAL'::text as entry_type,null::text as team_name
    from individual_registrations ir
    join challenges c on c.id=ir.challenge_id
    where ir.player_id=v_player_id
    union
    select c.name,'TEAM'::text,t.name
    from team_members tm
    join teams t on t.id=tm.team_id
    join challenges c on c.id=t.challenge_id
    where tm.player_id=v_player_id and tm.joined_at is not null
  ) registered;

  return v_events;
end $$;

revoke all on function public.get_my_registrations() from public,anon;
grant execute on function public.get_my_registrations() to authenticated;

