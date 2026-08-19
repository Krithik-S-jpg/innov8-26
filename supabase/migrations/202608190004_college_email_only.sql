create or replace function public.register_player(
  p_full_name text, p_email text, p_phone text, p_department text,
  p_year_of_study text, p_register_number text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_player players;
begin
  if char_length(trim(p_full_name)) < 2 then
    raise exception 'Enter a valid full name';
  end if;
  if lower(trim(p_email)) !~ '^[a-z0-9._%+\-]+@saranathan\.ac\.in$' then
    raise exception 'Use your official @saranathan.ac.in college email address';
  end if;
  if regexp_replace(p_phone, '\D', '', 'g') !~ '^[0-9]{10,13}$' then
    raise exception 'Enter a valid contact number';
  end if;

  insert into players(full_name,email,phone,department,year_of_study,register_number)
  values(trim(p_full_name),lower(trim(p_email)),trim(p_phone),p_department::innov8_department,p_year_of_study::innov8_year,nullif(trim(p_register_number),''))
  returning * into v_player;

  return jsonb_build_object('player_id',v_player.id,'player_number',v_player.player_number);
exception
  when unique_violation then raise exception 'This email or register number is already registered';
end $$;

grant execute on function public.register_player(text,text,text,text,text,text) to anon,authenticated;

