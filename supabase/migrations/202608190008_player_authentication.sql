-- Supabase email/password authentication linked to INNOV8 player profiles.

alter table public.players add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

create or replace function public.handle_new_innov8_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_email text := lower(trim(new.email));
begin
  if v_email !~ '^[a-z0-9._%+\-]+@saranathan\.ac\.in$' then
    raise exception 'Only @saranathan.ac.in college accounts are allowed';
  end if;

  update players set auth_user_id=new.id
  where email=v_email and auth_user_id is null;
  if found then return new; end if;

  insert into players(auth_user_id,full_name,email,phone,register_number,department,year_of_study)
  values(
    new.id,
    trim(new.raw_user_meta_data->>'full_name'),
    v_email,
    trim(new.raw_user_meta_data->>'phone'),
    nullif(trim(new.raw_user_meta_data->>'register_number'),''),
    (new.raw_user_meta_data->>'department')::innov8_department,
    (new.raw_user_meta_data->>'year_of_study')::innov8_year
  );
  return new;
end $$;

drop trigger if exists on_innov8_auth_user_created on auth.users;
create trigger on_innov8_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_innov8_user();

create or replace function public.get_my_player()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_player players;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select * into v_player from players where auth_user_id=auth.uid();
  if not found then raise exception 'Player profile not found'; end if;
  return jsonb_build_object(
    'id',v_player.id,'player_number',v_player.player_number,'full_name',v_player.full_name,
    'email',v_player.email,'phone',v_player.phone,'register_number',v_player.register_number,
    'department',v_player.department,'year_of_study',v_player.year_of_study
  );
end $$;

create or replace function public.verify_player_identity(p_player_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if not exists(select 1 from players where id=p_player_id and auth_user_id=auth.uid()) then
    raise exception 'Player identity does not match the logged-in account';
  end if;
  return true;
end $$;

create or replace function public.enforce_authenticated_player_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_player_id uuid;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if tg_table_name='teams' then v_player_id:=new.leader_player_id;
  elsif tg_table_name='individual_registrations' then v_player_id:=new.player_id;
  elsif tg_table_name='team_members' and new.player_id is not null then v_player_id:=new.player_id;
  else return new;
  end if;
  if not exists(select 1 from players where id=v_player_id and auth_user_id=auth.uid()) then
    raise exception 'Authenticated player identity mismatch';
  end if;
  return new;
end $$;

drop trigger if exists authenticated_team_write on public.teams;
create trigger authenticated_team_write before insert or update on public.teams
for each row execute function public.enforce_authenticated_player_write();
drop trigger if exists authenticated_individual_write on public.individual_registrations;
create trigger authenticated_individual_write before insert or update on public.individual_registrations
for each row execute function public.enforce_authenticated_player_write();
drop trigger if exists authenticated_member_write on public.team_members;
create trigger authenticated_member_write before insert or update of player_id on public.team_members
for each row execute function public.enforce_authenticated_player_write();

revoke execute on function public.register_player(text,text,text,text,text,text) from anon;
revoke execute on function public.create_event_team(uuid,text,text,jsonb,jsonb) from anon;
revoke execute on function public.join_event_team(uuid,text,text) from anon;
revoke execute on function public.register_individual_event(uuid,text,jsonb) from anon;
revoke execute on function public.get_event_registration_status(uuid,text) from anon;
revoke execute on function public.add_team_member(uuid,uuid,jsonb) from anon;
revoke execute on function public.remove_team_member(uuid,uuid,uuid) from anon;

grant execute on function public.get_my_player() to authenticated;
grant execute on function public.create_event_team(uuid,text,text,jsonb,jsonb) to authenticated;
grant execute on function public.join_event_team(uuid,text,text) to authenticated;
grant execute on function public.register_individual_event(uuid,text,jsonb) to authenticated;
grant execute on function public.get_event_registration_status(uuid,text) to authenticated;
grant execute on function public.add_team_member(uuid,uuid,jsonb) to authenticated;
grant execute on function public.remove_team_member(uuid,uuid,uuid) to authenticated;

-- Wrap all player-scoped RPCs with authenticated identity verification.
alter function public.create_event_team(uuid,text,text,jsonb,jsonb) rename to create_event_team_internal;
alter function public.join_event_team(uuid,text,text) rename to join_event_team_internal;
alter function public.register_individual_event(uuid,text,jsonb) rename to register_individual_event_internal;
alter function public.get_event_registration_status(uuid,text) rename to get_event_registration_status_internal;
alter function public.add_team_member(uuid,uuid,jsonb) rename to add_team_member_internal;
alter function public.remove_team_member(uuid,uuid,uuid) rename to remove_team_member_internal;

revoke all on function public.create_event_team_internal(uuid,text,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.join_event_team_internal(uuid,text,text) from public,anon,authenticated;
revoke all on function public.register_individual_event_internal(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.get_event_registration_status_internal(uuid,text) from public,anon,authenticated;
revoke all on function public.add_team_member_internal(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.remove_team_member_internal(uuid,uuid,uuid) from public,anon,authenticated;

create function public.create_event_team(p_player_id uuid,p_challenge_name text,p_team_name text,p_leader jsonb,p_members jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$ begin perform verify_player_identity(p_player_id); return create_event_team_internal(p_player_id,p_challenge_name,p_team_name,p_leader,p_members); end $$;
create function public.join_event_team(p_player_id uuid,p_challenge_name text,p_team_code text)
returns jsonb language plpgsql security definer set search_path=public as $$ begin perform verify_player_identity(p_player_id); return join_event_team_internal(p_player_id,p_challenge_name,p_team_code); end $$;
create function public.register_individual_event(p_player_id uuid,p_challenge_name text,p_participant jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$ begin perform verify_player_identity(p_player_id); return register_individual_event_internal(p_player_id,p_challenge_name,p_participant); end $$;
create function public.get_event_registration_status(p_player_id uuid,p_challenge_name text)
returns jsonb language plpgsql security definer set search_path=public as $$ begin perform verify_player_identity(p_player_id); return get_event_registration_status_internal(p_player_id,p_challenge_name); end $$;
create function public.add_team_member(p_player_id uuid,p_team_id uuid,p_member jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$ begin perform verify_player_identity(p_player_id); return add_team_member_internal(p_player_id,p_team_id,p_member); end $$;
create function public.remove_team_member(p_player_id uuid,p_team_id uuid,p_member_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$ begin perform verify_player_identity(p_player_id); return remove_team_member_internal(p_player_id,p_team_id,p_member_id); end $$;

grant execute on function public.create_event_team(uuid,text,text,jsonb,jsonb) to authenticated;
grant execute on function public.join_event_team(uuid,text,text) to authenticated;
grant execute on function public.register_individual_event(uuid,text,jsonb) to authenticated;
grant execute on function public.get_event_registration_status(uuid,text) to authenticated;
grant execute on function public.add_team_member(uuid,uuid,jsonb) to authenticated;
grant execute on function public.remove_team_member(uuid,uuid,uuid) to authenticated;
