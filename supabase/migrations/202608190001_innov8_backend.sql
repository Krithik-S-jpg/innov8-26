create extension if not exists pgcrypto;

create type public.innov8_department as enum ('CSBS','AIDS','CSE','AIML','IT');
create type public.innov8_year as enum ('First year','Second year','Third year','Final year');
create type public.registration_kind as enum ('team','individual');

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  registration_type public.registration_kind not null,
  team_size smallint not null check (team_size between 1 and 4),
  capacity integer,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.challenges (name, slug, registration_type, team_size, capacity) values
  ('BUG HUNT','bug-hunt','team',2,100),
  ('PROMPT2PRODUCT','prompt2product','team',2,100),
  ('PAPER PRESENTATION','paper-presentation','team',2,30),
  ('IPL AUCTION','ipl-auction','team',4,80),
  ('SHARK TANK','shark-tank','individual',1,100),
  ('CRIME MYSTERY','crime-mystery','team',4,100);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  player_number bigint generated always as identity (start with 826),
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  email text not null,
  phone text not null,
  register_number text,
  department public.innov8_department not null,
  year_of_study public.innov8_year not null,
  created_at timestamptz not null default now(),
  constraint players_email_unique unique (email),
  constraint players_register_number_unique unique (register_number)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id),
  name text not null check (char_length(trim(name)) between 2 and 80),
  code text not null unique check (code ~ '^IN8[A-Z0-9]{6}$'),
  leader_player_id uuid not null references public.players(id),
  created_at timestamptz not null default now(),
  unique (challenge_id, name),
  unique (challenge_id, leader_player_id)
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid references public.players(id),
  full_name text not null,
  register_number text not null,
  department public.innov8_department not null,
  year_of_study public.innov8_year not null,
  phone text not null,
  email text not null,
  role text not null check (role in ('leader','member')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (team_id, email),
  unique (team_id, register_number)
);

create table public.individual_registrations (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id),
  player_id uuid not null references public.players(id),
  participant jsonb not null,
  created_at timestamptz not null default now(),
  unique (challenge_id, player_id)
);

alter table public.challenges enable row level security;
alter table public.players enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.individual_registrations enable row level security;

create policy "Public can view challenge availability" on public.challenges for select to anon, authenticated using (true);

create or replace function public.register_player(
  p_full_name text, p_email text, p_phone text, p_department text,
  p_year_of_study text, p_register_number text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_player players;
begin
  if p_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'Enter a valid college email address'; end if;
  if regexp_replace(p_phone, '\D', '', 'g') !~ '^[0-9]{10,13}$' then raise exception 'Enter a valid contact number'; end if;
  insert into players(full_name,email,phone,department,year_of_study,register_number)
  values(trim(p_full_name),lower(trim(p_email)),trim(p_phone),p_department::innov8_department,p_year_of_study::innov8_year,nullif(trim(p_register_number),''))
  returning * into v_player;
  return jsonb_build_object('player_id',v_player.id,'player_number',v_player.player_number);
exception
  when unique_violation then raise exception 'This email or register number is already registered';
end $$;

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
  insert into teams(challenge_id,name,code,leader_player_id) values(v_challenge.id,trim(p_team_name),v_code,p_player_id) returning * into v_team;
  insert into team_members(team_id,player_id,full_name,register_number,department,year_of_study,phone,email,role,joined_at)
  values(v_team.id,p_player_id,trim(p_leader->>'name'),trim(p_leader->>'registerNumber'),(p_leader->>'department')::innov8_department,(p_leader->>'year')::innov8_year,trim(p_leader->>'contact'),lower(trim(p_leader->>'email')),'leader',now());
  for v_member in select * from jsonb_array_elements(p_members) loop
    insert into team_members(team_id,full_name,register_number,department,year_of_study,phone,email,role)
    values(v_team.id,trim(v_member->>'name'),trim(v_member->>'registerNumber'),(v_member->>'department')::innov8_department,(v_member->>'year')::innov8_year,trim(v_member->>'contact'),lower(trim(v_member->>'email')),'member');
  end loop;
  return jsonb_build_object('team_id',v_team.id,'team_code',v_code,'team_name',v_team.name,'challenge',v_challenge.name);
end $$;

create or replace function public.join_event_team(p_player_id uuid,p_challenge_name text,p_team_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_team teams; v_challenge challenges; v_player players; v_slot team_members; v_joined int;
begin
  select * into v_player from players where id=p_player_id;
  if not found then raise exception 'Register as a player first'; end if;
  select t,c into v_team,v_challenge from teams t join challenges c on c.id=t.challenge_id where t.code=upper(trim(p_team_code)) and c.name=upper(trim(p_challenge_name));
  if not found then raise exception 'Team code not found for this challenge'; end if;
  if exists(select 1 from team_members where team_id=v_team.id and player_id=p_player_id) then return jsonb_build_object('joined',true,'team_name',v_team.name,'team_code',v_team.code); end if;
  select * into v_slot from team_members where team_id=v_team.id and joined_at is null and (lower(email)=lower(v_player.email) or register_number=v_player.register_number) order by created_at limit 1 for update;
  if not found then raise exception 'Your email or register number is not on this team roster'; end if;
  update team_members set player_id=p_player_id,joined_at=now() where id=v_slot.id;
  select count(*) into v_joined from team_members where team_id=v_team.id and joined_at is not null;
  return jsonb_build_object('joined',true,'team_name',v_team.name,'team_code',v_team.code,'joined_members',v_joined,'team_size',v_challenge.team_size);
end $$;

create or replace function public.register_individual_event(p_player_id uuid,p_challenge_name text,p_participant jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_challenge challenges; v_registration individual_registrations;
begin
  select * into v_challenge from challenges where name=upper(trim(p_challenge_name)) and registration_type='individual' and is_open;
  if not found then raise exception 'Individual registration is unavailable for this challenge'; end if;
  if not exists(select 1 from players where id=p_player_id) then raise exception 'Register as a player first'; end if;
  insert into individual_registrations(challenge_id,player_id,participant) values(v_challenge.id,p_player_id,p_participant)
  on conflict(challenge_id,player_id) do update set participant=excluded.participant returning * into v_registration;
  return jsonb_build_object('registered',true,'registration_id',v_registration.id,'challenge',v_challenge.name);
end $$;

revoke all on public.players,public.teams,public.team_members,public.individual_registrations from anon,authenticated;
grant select on public.challenges to anon,authenticated;
grant execute on function public.register_player(text,text,text,text,text,text) to anon,authenticated;
grant execute on function public.create_event_team(uuid,text,text,jsonb,jsonb) to anon,authenticated;
grant execute on function public.join_event_team(uuid,text,text) to anon,authenticated;
grant execute on function public.register_individual_event(uuid,text,jsonb) to anon,authenticated;
