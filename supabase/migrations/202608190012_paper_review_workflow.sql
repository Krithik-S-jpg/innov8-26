-- Paper Presentation domain selection and reviewer approval workflow.

alter table public.teams add column if not exists paper_domain text;
alter table public.teams add column if not exists paper_review_status text not null default 'pending';
alter table public.teams add column if not exists paper_reviewed_at timestamptz;
alter table public.teams add column if not exists paper_reviewed_by text;

alter table public.teams drop constraint if exists teams_paper_domain_valid;
alter table public.teams add constraint teams_paper_domain_valid check (
  paper_domain is null or paper_domain in (
    'AI for Smart Business Solutions',
    'FinTech and Digital Banking',
    'Smart and Sustainable Communities',
    'Cybersecurity and Digital Trust'
  )
);
alter table public.teams drop constraint if exists teams_paper_review_status_valid;
alter table public.teams add constraint teams_paper_review_status_valid
  check (paper_review_status in ('pending','approved','rejected'));

create or replace function public.handle_new_innov8_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_email text := lower(trim(new.email));
begin
  if v_email in ('admin@saranathan.ac.in','arunadevipp@saranathan.ac.in') then return new; end if;
  if v_email !~ '^[a-z0-9._%+\-]+@saranathan\.ac\.in$' then
    raise exception 'Only @saranathan.ac.in college accounts are allowed';
  end if;
  update players set auth_user_id=new.id where email=v_email and auth_user_id is null;
  if found then return new; end if;
  insert into players(auth_user_id,full_name,email,phone,register_number,department,year_of_study)
  values(new.id,trim(new.raw_user_meta_data->>'full_name'),v_email,trim(new.raw_user_meta_data->>'phone'),nullif(trim(new.raw_user_meta_data->>'register_number'),''),(new.raw_user_meta_data->>'department')::innov8_department,(new.raw_user_meta_data->>'year_of_study')::innov8_year);
  return new;
end $$;

create or replace function public.enforce_authenticated_player_write()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_player_id uuid; v_email text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if v_email in ('admin@saranathan.ac.in','arunadevipp@saranathan.ac.in') then return new; end if;
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

create or replace function public.create_event_team(
  p_player_id uuid,p_challenge_name text,p_team_name text,p_leader jsonb,
  p_members jsonb,p_abstract text,p_domain text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb; v_abstract text:=nullif(trim(p_abstract),''); v_domain text:=nullif(trim(p_domain),''); v_words integer;
begin
  perform verify_player_identity(p_player_id);
  if upper(trim(p_challenge_name)) <> 'PAPER PRESENTATION' then
    raise exception 'Paper details are only accepted for Paper Presentation';
  end if;
  if v_abstract is null then raise exception 'Enter the paper presentation abstract'; end if;
  v_words:=cardinality(regexp_split_to_array(v_abstract,E'\\s+'));
  if v_words>150 then raise exception 'The paper presentation abstract must be within 150 words'; end if;
  if v_domain is null or v_domain not in ('AI for Smart Business Solutions','FinTech and Digital Banking','Smart and Sustainable Communities','Cybersecurity and Digital Trust') then
    raise exception 'Select a valid paper presentation domain';
  end if;
  v_result:=create_event_team_internal(p_player_id,p_challenge_name,p_team_name,p_leader,p_members);
  update teams set abstract=v_abstract,paper_domain=v_domain,paper_review_status='pending' where id=(v_result->>'team_id')::uuid;
  return v_result;
end $$;

create or replace function public.get_paper_review_submissions()
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if lower(coalesce(auth.jwt()->>'email','')) <> 'arunadevipp@saranathan.ac.in' then
    raise exception 'Paper reviewer access required';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'team_id',t.id,'team_name',t.name,'team_code',t.code,'domain',coalesce(t.paper_domain,'Not selected'),
    'abstract',t.abstract,'word_count',case when nullif(trim(t.abstract),'') is null then 0 else cardinality(regexp_split_to_array(trim(t.abstract),E'\\s+')) end,
    'review_status',t.paper_review_status,'reviewed_at',t.paper_reviewed_at,'created_at',t.created_at,
    'members',coalesce((select jsonb_agg(jsonb_build_object('id',tm.id,'full_name',tm.full_name,'register_number',tm.register_number,'department',tm.department,'year_of_study',tm.year_of_study,'email',tm.email,'role',tm.role) order by case when tm.role='leader' then 0 else 1 end) from team_members tm where tm.team_id=t.id),'[]'::jsonb)
  ) order by case t.paper_review_status when 'pending' then 0 when 'approved' then 1 else 2 end,t.created_at desc)
  from teams t join challenges c on c.id=t.challenge_id where c.name='PAPER PRESENTATION'),'[]'::jsonb);
end $$;

create or replace function public.review_paper_submission(p_team_id uuid,p_decision text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_team teams;
begin
  if lower(coalesce(auth.jwt()->>'email','')) <> 'arunadevipp@saranathan.ac.in' then raise exception 'Paper reviewer access required'; end if;
  if lower(trim(p_decision)) not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
  update teams t set paper_review_status=lower(trim(p_decision)),paper_reviewed_at=now(),paper_reviewed_by=lower(auth.jwt()->>'email')
  from challenges c where t.id=p_team_id and c.id=t.challenge_id and c.name='PAPER PRESENTATION' returning t.* into v_team;
  if not found then raise exception 'Paper Presentation submission not found'; end if;
  return jsonb_build_object('updated',true,'team_id',v_team.id,'status',v_team.paper_review_status);
end $$;

create or replace function public.get_event_registration_status(p_player_id uuid,p_challenge_name text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb; v_team teams;
begin
  perform verify_player_identity(p_player_id);
  v_result:=get_event_registration_status_internal(p_player_id,p_challenge_name);
  if coalesce(v_result->>'type','')='team' and upper(trim(p_challenge_name))='PAPER PRESENTATION' then
    select * into v_team from teams where id=(v_result->>'team_id')::uuid;
    v_result:=v_result||jsonb_build_object('paper_domain',v_team.paper_domain,'paper_review_status',v_team.paper_review_status,'paper_reviewed_at',v_team.paper_reviewed_at);
  end if;
  return v_result;
end $$;

revoke all on function public.create_event_team(uuid,text,text,jsonb,jsonb,text,text) from public,anon;
grant execute on function public.create_event_team(uuid,text,text,jsonb,jsonb,text,text) to authenticated;
revoke all on function public.get_paper_review_submissions() from public,anon;
grant execute on function public.get_paper_review_submissions() to authenticated;
revoke all on function public.review_paper_submission(uuid,text) from public,anon;
grant execute on function public.review_paper_submission(uuid,text) to authenticated;
