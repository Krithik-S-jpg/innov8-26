-- Restricted administrator dashboard. Create admin@saranathan.ac.in once in
-- Authentication > Users with "Auto Confirm User" enabled.

create or replace function public.handle_new_innov8_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_email text := lower(trim(new.email));
begin
  if v_email = 'admin@saranathan.ac.in' then return new; end if;
  if v_email !~ '^[a-z0-9._%+\-]+@saranathan\.ac\.in$' then
    raise exception 'Only @saranathan.ac.in college accounts are allowed';
  end if;
  update players set auth_user_id=new.id where email=v_email and auth_user_id is null;
  if found then return new; end if;
  insert into players(auth_user_id,full_name,email,phone,register_number,department,year_of_study)
  values(new.id,trim(new.raw_user_meta_data->>'full_name'),v_email,trim(new.raw_user_meta_data->>'phone'),nullif(trim(new.raw_user_meta_data->>'register_number'),''),(new.raw_user_meta_data->>'department')::innov8_department,(new.raw_user_meta_data->>'year_of_study')::innov8_year);
  return new;
end $$;

create or replace function public.get_admin_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_result jsonb;
begin
  if lower(coalesce(auth.jwt()->>'email','')) <> 'admin@saranathan.ac.in' then
    raise exception 'Administrator access required';
  end if;

  select jsonb_build_object(
    'summary', jsonb_build_object(
      'total_players',(select count(*) from players),
      'total_teams',(select count(*) from teams),
      'team_members',(select count(*) from team_members),
      'individual_entries',(select count(*) from individual_registrations)
    ),
    'events', coalesce((select jsonb_agg(jsonb_build_object(
      'name',c.name,'registration_type',c.registration_type,'team_size',c.team_size,
      'capacity',c.capacity,'registration_count',case when c.registration_type='team' then (select count(*) from teams t where t.challenge_id=c.id) else (select count(*) from individual_registrations i where i.challenge_id=c.id) end,
      'remaining',greatest(0,c.capacity-case when c.registration_type='team' then (select count(*) from teams t where t.challenge_id=c.id) else (select count(*) from individual_registrations i where i.challenge_id=c.id) end)
    ) order by c.created_at) from challenges c),'[]'::jsonb),
    'players', coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at desc) from players p),'[]'::jsonb),
    'teams', coalesce((select jsonb_agg(jsonb_build_object(
      'id',t.id,'name',t.name,'code',t.code,'challenge',c.name,'team_size',c.team_size,
      'abstract',t.abstract,'created_at',t.created_at,
      'joined_count',(select count(*) from team_members tm where tm.team_id=t.id and tm.joined_at is not null),
      'members',coalesce((select jsonb_agg(jsonb_build_object('id',tm.id,'full_name',tm.full_name,'register_number',tm.register_number,'department',tm.department,'year_of_study',tm.year_of_study,'phone',tm.phone,'email',tm.email,'role',tm.role,'joined',tm.joined_at is not null) order by case when tm.role='leader' then 0 else 1 end,tm.created_at) from team_members tm where tm.team_id=t.id),'[]'::jsonb)
    ) order by t.created_at desc) from teams t join challenges c on c.id=t.challenge_id),'[]'::jsonb),
    'individual_registrations', coalesce((select jsonb_agg(jsonb_build_object(
      'id',i.id,'challenge',c.name,'created_at',i.created_at,'participant',i.participant,
      'player_name',p.full_name,'register_number',p.register_number,'email',p.email
    ) order by i.created_at desc)
    from individual_registrations i
    join challenges c on c.id=i.challenge_id
    join players p on p.id=i.player_id),'[]'::jsonb)
  ) into v_result;
  return v_result;
end $$;

revoke all on function public.get_admin_dashboard() from public,anon;
grant execute on function public.get_admin_dashboard() to authenticated;
