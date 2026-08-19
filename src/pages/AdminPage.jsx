import { useEffect, useMemo, useState } from "react";
import { LogOut, RefreshCw, Search, ShieldCheck, Users, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "admin@saranathan.ac.in";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    const { data, error: requestError } = await supabase.rpc(
      "get_admin_dashboard",
    );
    if (requestError) setError(requestError.message);
    else setDashboard(data);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const allowed = data.user?.email?.toLowerCase() === ADMIN_EMAIL;
      setAuthenticated(allowed);
      if (allowed) loadDashboard();
      else setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });
    if (loginError) {
      setError("Invalid administrator credentials.");
      setLoading(false);
      return;
    }
    setAuthenticated(true);
    setPassword("");
    await loadDashboard();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthenticated(false);
    setDashboard(null);
    window.location.hash = "home";
  };

  const players = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return dashboard?.players || [];
    return (dashboard?.players || []).filter((player) =>
      [
        player.full_name,
        player.email,
        player.register_number,
        player.department,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [dashboard, query]);

  if (!authenticated) {
    return (
      <main className="admin-login">
        <a className="admin-exit" href="#home" aria-label="Return to website">
          <X />
        </a>
        <section>
          <div className="admin-symbol">
            <ShieldCheck />
          </div>
          <small>INNOV8'26 / RESTRICTED NETWORK</small>
          <h1>
            ADMIN
            <br />
            <span>CONTROL.</span>
          </h1>
          <p>Authorised symposium coordinators only.</p>
        </section>
        <form onSubmit={login}>
          <small>SECURE ADMINISTRATOR LOGIN</small>
          <h2>
            VERIFY
            <br />
            CLEARANCE.
          </h2>
          <label>
            ADMIN EMAIL
            <input value={ADMIN_EMAIL} readOnly />
          </label>
          <label>
            PASSWORD
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <div className="admin-error">{error}</div>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "VERIFYING..." : "ENTER CONTROL ROOM"}
          </button>
        </form>
      </main>
    );
  }

  const summary = dashboard?.summary || {};
  return (
    <main className="admin-dashboard">
      <header>
        <div>
          <small>INNOV8'26 / ADMIN NETWORK</small>
          <h1>CONTROL ROOM</h1>
        </div>
        <div className="admin-actions">
          <button onClick={loadDashboard} disabled={loading}>
            <RefreshCw className={loading ? "status-spin" : ""} size={15} />{" "}
            REFRESH DATA
          </button>
          <button onClick={logout}>
            <LogOut size={15} /> LOGOUT
          </button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}
      <section className="admin-metrics">
        <article>
          <small>REGISTERED PLAYERS</small>
          <strong>{summary.total_players ?? "—"}</strong>
        </article>
        <article>
          <small>TOTAL TEAMS</small>
          <strong>{summary.total_teams ?? "—"}</strong>
        </article>
        <article>
          <small>TEAM PARTICIPANTS</small>
          <strong>{summary.team_members ?? "—"}</strong>
        </article>
        <article>
          <small>INDIVIDUAL ENTRIES</small>
          <strong>{summary.individual_entries ?? "—"}</strong>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <small>01 / EVENT CAPACITY</small>
            <h2>REGISTRATION OVERVIEW</h2>
          </div>
        </div>
        <div className="admin-event-grid">
          {(dashboard?.events || []).map((event) => (
            <article key={event.name}>
              <div>
                <small>
                  {event.registration_type === "team" ? "TEAMS" : "PLAYERS"}
                </small>
                <strong>{event.name}</strong>
              </div>
              <b>
                {event.registration_count} / {event.capacity}
              </b>
              <i>
                <span
                  style={{
                    width: `${Math.min(100, (event.registration_count / event.capacity) * 100)}%`,
                  }}
                />
              </i>
              <em>{event.remaining} SLOTS REMAINING</em>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <small>02 / PLAYER DATABASE</small>
            <h2>REGISTERED USERS</h2>
          </div>
          <label>
            <Search size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, register no., email..."
            />
          </label>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>PLAYER</th>
                <th>REGISTER NO.</th>
                <th>EMAIL</th>
                <th>CONTACT</th>
                <th>DEPARTMENT</th>
                <th>YEAR</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>
                    <b>#{player.player_number}</b> {player.full_name}
                  </td>
                  <td>{player.register_number}</td>
                  <td>{player.email}</td>
                  <td>{player.phone}</td>
                  <td>{player.department}</td>
                  <td>{player.year_of_study}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <small>03 / TEAM DATABASE</small>
            <h2>TEAM ROSTERS</h2>
          </div>
          <span>
            <Users size={14} /> {dashboard?.teams?.length || 0} TEAMS
          </span>
        </div>
        <div className="admin-team-list">
          {(dashboard?.teams || []).map((team) => (
            <details key={team.id}>
              <summary>
                <div>
                  <small>{team.challenge}</small>
                  <strong>{team.name}</strong>
                </div>
                <code>{team.code}</code>
                <span>
                  {team.joined_count} / {team.team_size} JOINED
                </span>
              </summary>
              <div className="admin-roster">
                {team.abstract && (
                  <p>
                    <b>PAPER ABSTRACT</b>
                    {team.abstract}
                  </p>
                )}
                {team.members?.map((member) => (
                  <article key={member.id}>
                    <strong>{member.full_name}</strong>
                    <small>
                      {member.role} · {member.joined ? "JOINED" : "PENDING"}
                    </small>
                    <span>
                      {member.register_number} · {member.department} ·{" "}
                      {member.year_of_study}
                    </span>
                    <span>
                      {member.email} · {member.phone}
                    </span>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <small>04 / INDIVIDUAL DATABASE</small>
            <h2>SOLO REGISTRATIONS</h2>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>EVENT</th>
                <th>PLAYER</th>
                <th>REGISTER NO.</th>
                <th>EMAIL</th>
                <th>REGISTERED AT</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.individual_registrations || []).map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.challenge}</td>
                  <td>{entry.player_name}</td>
                  <td>{entry.register_number}</td>
                  <td>{entry.email}</td>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
