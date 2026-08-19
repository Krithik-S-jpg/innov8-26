-- Official INNOV8'26 registration capacities.
-- Team challenges count teams; individual challenges count people.

update public.challenges set capacity = 100 where name = 'BUG HUNT';
update public.challenges set capacity = 100 where name = 'CRIME MYSTERY';
update public.challenges set capacity = 100 where name = 'PROMPT2PRODUCT';
update public.challenges set capacity = 100 where name = 'SHARK TANK';
update public.challenges set capacity = 80  where name = 'IPL AUCTION';
update public.challenges set capacity = 30  where name = 'PAPER PRESENTATION';

create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_challenge_name text;
  v_registration_type registration_kind;
  v_current_count integer;
begin
  -- Serializes registrations for the same challenge, preventing two requests
  -- from taking the final slot at the same time.
  select capacity, name, registration_type
  into v_capacity, v_challenge_name, v_registration_type
  from challenges
  where id = new.challenge_id
  for update;

  if v_capacity is null then return new; end if;

  if tg_table_name = 'teams' then
    select count(*) into v_current_count
    from teams
    where challenge_id = new.challenge_id;

    if v_current_count >= v_capacity then
      raise exception '% registration is full. Maximum capacity: % teams', v_challenge_name, v_capacity;
    end if;
  elsif tg_table_name = 'individual_registrations' then
    select count(*) into v_current_count
    from individual_registrations
    where challenge_id = new.challenge_id;

    if v_current_count >= v_capacity then
      raise exception '% registration is full. Maximum capacity: % participants', v_challenge_name, v_capacity;
    end if;
  end if;

  return new;
end $$;

drop trigger if exists enforce_team_event_capacity on public.teams;
create trigger enforce_team_event_capacity
before insert on public.teams
for each row execute function public.enforce_event_capacity();

drop trigger if exists enforce_individual_event_capacity on public.individual_registrations;
create trigger enforce_individual_event_capacity
before insert on public.individual_registrations
for each row execute function public.enforce_event_capacity();

