import { isSupabaseConfigured, supabase } from "../lib/supabase";

const PLAYER_KEY = "innov8-player-id";
const PLAYER_PROFILE_KEY = "innov8-player-profile";
const AUTH_USER_KEY = "innov8-auth-user";

const requireBackend = () => {
  if (!isSupabaseConfigured)
    throw new Error(
      "Supabase is not configured. Add the project URL and anon key to .env.local.",
    );
};

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

const withTimeout = (request, milliseconds = 15000) =>
  Promise.race([
    request,
    new Promise((_, reject) =>
      window.setTimeout(
        () =>
          reject(
            new Error(
              "The registration server took too long to respond. Please try again.",
            ),
          ),
        milliseconds,
      ),
    ),
  ]);

export const getStoredPlayer = () => {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_PROFILE_KEY) || "null");
  } catch {
    return null;
  }
};

export const getStoredPlayerId = () => localStorage.getItem(PLAYER_KEY);
export const isPlayerRegistered = () =>
  Boolean(getStoredPlayerId() && localStorage.getItem(AUTH_USER_KEY));

const storeAuthenticatedPlayer = (user, profile) => {
  const normalized = {
    name: profile.full_name,
    email: profile.email,
    contact: profile.phone,
    registerNumber: profile.register_number,
    department: profile.department,
    year: profile.year_of_study,
    playerNumber: profile.player_number,
  };
  localStorage.setItem(AUTH_USER_KEY, user.id);
  localStorage.setItem(PLAYER_KEY, profile.id);
  localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(normalized));
  localStorage.setItem("innov8-player-registered", "true");
  return normalized;
};

export const getMyPlayer = async () => {
  requireBackend();
  const profile = unwrap(await withTimeout(supabase.rpc("get_my_player")));
  if (!profile?.id) throw new Error("Player profile was not found.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return storeAuthenticatedPlayer(user, profile);
};

export const getMyRegistrations = async () => {
  requireBackend();
  return unwrap(await withTimeout(supabase.rpc("get_my_registrations")));
};

export const signInPlayer = async ({ email, password }) => {
  requireBackend();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.endsWith("@saranathan.ac.in"))
    throw new Error(
      "Use your official @saranathan.ac.in college email address.",
    );
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({ email: normalizedEmail, password }),
  );
  if (error) throw new Error(error.message);
  const profile = unwrap(await withTimeout(supabase.rpc("get_my_player")));
  return storeAuthenticatedPlayer(data.user, profile);
};

export const signInAdmin = async ({ email, password }) => {
  requireBackend();
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== "admin@saranathan.ac.in")
    throw new Error("Administrator account required.");
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({ email: normalizedEmail, password }),
  );
  if (error) throw new Error("Invalid administrator credentials.");
  return data.user;
};

export const signInPaperReviewer = async ({ email, password }) => {
  requireBackend();
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== "arunadevipp@saranathan.ac.in")
    throw new Error("Paper reviewer account required.");
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({ email: normalizedEmail, password }),
  );
  if (error) throw new Error("Invalid reviewer credentials.");
  return data.user;
};

export const signUpPlayer = async ({ player, password, confirmPassword }) => {
  requireBackend();
  const email = player.email.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@saranathan\.ac\.in$/i.test(email))
    throw new Error(
      "Use your official @saranathan.ac.in college email address.",
    );
  if (password.length < 8)
    throw new Error("Password must contain at least 8 characters.");
  if (password !== confirmPassword) throw new Error("Passwords do not match.");
  const { data, error } = await withTimeout(
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: player.name.trim(),
          phone: player.contact.trim(),
          register_number: player.registerNumber.trim(),
          department: player.department,
          year_of_study: player.year,
        },
      },
    }),
  );
  if (error) throw new Error(error.message);
  if (!data.session) return { confirmationRequired: true, email };
  const profile = unwrap(await withTimeout(supabase.rpc("get_my_player")));
  return {
    confirmationRequired: false,
    player: storeAuthenticatedPlayer(data.user, profile),
  };
};

export const restorePlayerSession = async () => {
  requireBackend();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  return getMyPlayer();
};

export const signOutPlayer = async () => {
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(PLAYER_KEY);
  localStorage.removeItem(PLAYER_PROFILE_KEY);
  localStorage.removeItem("innov8-player-registered");
};

export const requestPasswordReset = async (email) => {
  requireBackend();
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@saranathan\.ac\.in$/i.test(normalizedEmail)) {
    throw new Error(
      "Use your official @saranathan.ac.in college email address.",
    );
  }
  const { error } = await withTimeout(
    supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/?reset-password=1`,
    }),
  );
  if (error) {
    if (error.status === 429 || /rate limit/i.test(error.message)) {
      throw new Error(
        "Too many recovery emails were requested. Please wait before trying again, or contact the event administrator.",
      );
    }
    throw new Error(error.message);
  }
  return normalizedEmail;
};

export const updatePlayerPassword = async ({ password, confirmPassword }) => {
  requireBackend();
  if (password.length < 8)
    throw new Error("Password must contain at least 8 characters.");
  if (password !== confirmPassword) throw new Error("Passwords do not match.");
  const { error } = await withTimeout(supabase.auth.updateUser({ password }));
  if (error) throw new Error(error.message);
  await signOutPlayer();
};

export const subscribeToPasswordRecovery = (callback) => {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") callback();
  });
  return () => data.subscription.unsubscribe();
};

export const registerPlayer = async (player) => {
  requireBackend();
  const email = player.email.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@saranathan\.ac\.in$/i.test(email)) {
    throw new Error(
      "Use your official @saranathan.ac.in college email address.",
    );
  }
  const data = unwrap(
    await withTimeout(
      supabase.rpc("register_player", {
        p_full_name: player.name.trim(),
        p_email: email,
        p_phone: player.contact.trim(),
        p_department: player.department,
        p_year_of_study: player.year,
        p_register_number: player.registerNumber?.trim() || null,
      }),
    ),
  );
  localStorage.setItem(PLAYER_KEY, data.player_id);
  localStorage.setItem(
    PLAYER_PROFILE_KEY,
    JSON.stringify({ ...player, playerNumber: data.player_number }),
  );
  localStorage.setItem("innov8-player-registered", "true");
  return data;
};

export const createTeam = async ({
  challengeName,
  teamName,
  leader,
  members,
  abstract = null,
  domain = null,
}) => {
  requireBackend();
  const parameters = {
    p_player_id: getStoredPlayerId(),
    p_challenge_name: challengeName,
    p_team_name: teamName.trim(),
    p_leader: leader,
    p_members: members,
  };
  if (challengeName === "PAPER PRESENTATION") {
    parameters.p_abstract = abstract?.trim() || null;
    parameters.p_domain = domain || null;
  }
  const data = unwrap(
    await withTimeout(supabase.rpc("create_event_team", parameters)),
  );
  return data;
};

export const joinTeam = async ({ challengeName, code }) => {
  requireBackend();
  return unwrap(
    await withTimeout(
      supabase.rpc("join_event_team", {
        p_player_id: getStoredPlayerId(),
        p_challenge_name: challengeName,
        p_team_code: code.trim().toUpperCase(),
      }),
    ),
  );
};

export const registerIndividual = async ({ challengeName, player }) => {
  requireBackend();
  return unwrap(
    await withTimeout(
      supabase.rpc("register_individual_event", {
        p_player_id: getStoredPlayerId(),
        p_challenge_name: challengeName,
        p_participant: player,
      }),
    ),
  );
};

export const getEventRegistrationStatus = async (challengeName) => {
  requireBackend();
  const playerId = getStoredPlayerId();
  if (!playerId) return { registered: false };
  return unwrap(
    await withTimeout(
      supabase.rpc("get_event_registration_status", {
        p_player_id: playerId,
        p_challenge_name: challengeName,
      }),
    ),
  );
};

export const addTeamMember = async ({ teamId, member }) => {
  requireBackend();
  return unwrap(
    await withTimeout(
      supabase.rpc("add_team_member", {
        p_player_id: getStoredPlayerId(),
        p_team_id: teamId,
        p_member: member,
      }),
    ),
  );
};

export const removeTeamMember = async ({ teamId, memberId }) => {
  requireBackend();
  return unwrap(
    await withTimeout(
      supabase.rpc("remove_team_member", {
        p_player_id: getStoredPlayerId(),
        p_team_id: teamId,
        p_member_id: memberId,
      }),
    ),
  );
};
