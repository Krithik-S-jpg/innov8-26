-- Paper Presentation teams must submit an abstract of no more than 150 words.
alter table public.teams
  add column if not exists abstract text;

alter table public.teams
  drop constraint if exists teams_abstract_word_limit;

alter table public.teams
  add constraint teams_abstract_word_limit check (
    abstract is null
    or cardinality(regexp_split_to_array(trim(abstract), E'\\s+')) <= 150
  );

create or replace function public.create_event_team(
  p_player_id uuid,
  p_challenge_name text,
  p_team_name text,
  p_leader jsonb,
  p_members jsonb,
  p_abstract text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_abstract text := nullif(trim(p_abstract), '');
  v_word_count integer := 0;
begin
  perform verify_player_identity(p_player_id);

  if upper(trim(p_challenge_name)) = 'PAPER PRESENTATION' then
    if v_abstract is null then
      raise exception 'Enter the paper presentation abstract';
    end if;

    v_word_count := cardinality(regexp_split_to_array(v_abstract, E'\\s+'));
    if v_word_count > 150 then
      raise exception 'The paper presentation abstract must be within 150 words';
    end if;
  else
    v_abstract := null;
  end if;

  v_result := create_event_team_internal(
    p_player_id,
    p_challenge_name,
    p_team_name,
    p_leader,
    p_members
  );

  update public.teams
  set abstract = v_abstract
  where id = (v_result->>'team_id')::uuid;

  return v_result;
end;
$$;

revoke all on function public.create_event_team(uuid,text,text,jsonb,jsonb,text)
  from public, anon;
grant execute on function public.create_event_team(uuid,text,text,jsonb,jsonb,text)
  to authenticated;
