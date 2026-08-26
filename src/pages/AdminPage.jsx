import { useEffect, useMemo, useState } from "react";
import { Download, LogOut, RefreshCw, Search, ShieldCheck, Users, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "admin@saranathan.ac.in";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("ALL");

  const loadDashboard = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
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
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const allowed = data?.user?.email?.toLowerCase() === ADMIN_EMAIL;
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
    if (!supabase) {
      setError("Supabase connection is not configured.");
      setLoading(false);
      return;
    }
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
    if (supabase) {
      await supabase.auth.signOut();
    }
    setAuthenticated(false);
    setDashboard(null);
    window.location.hash = "home";
  };

  const playersWithEvents = useMemo(() => {
    if (!dashboard?.players) return [];

    const playerEventsMap = new Map();

    (dashboard.individual_registrations || []).forEach((reg) => {
      const email = reg.email?.toLowerCase();
      if (!email) return;
      if (!playerEventsMap.has(email)) {
        playerEventsMap.set(email, new Set());
      }
      playerEventsMap.get(email).add(reg.challenge);
    });

    (dashboard.teams || []).forEach((team) => {
      (team.members || []).forEach((member) => {
        const email = member.email?.toLowerCase();
        if (!email) return;
        if (!playerEventsMap.has(email)) {
          playerEventsMap.set(email, new Set());
        }
        playerEventsMap.get(email).add(team.challenge);
      });
    });

    return dashboard.players.map((player) => {
      const email = player.email?.toLowerCase();
      const eventSet = playerEventsMap.get(email) || new Set();
      const eventsList = Array.from(eventSet);
      return {
        ...player,
        registered_events: eventsList,
        registered_events_text: eventsList.join(", ") || "None",
      };
    });
  }, [dashboard]);

  const availableEvents = useMemo(() => {
    if (!dashboard?.teams) return [];
    const set = new Set(dashboard.teams.map((t) => t.challenge).filter(Boolean));
    return Array.from(set).sort();
  }, [dashboard]);

  const filteredTeams = useMemo(() => {
    if (!dashboard?.teams) return [];
    return dashboard.teams.filter((team) => {
      const matchesEvent =
        selectedEvent === "ALL" ||
        (team.challenge && team.challenge.toUpperCase() === selectedEvent.toUpperCase());
      const term = teamQuery.trim().toLowerCase();
      if (!term) return matchesEvent;
      const matchesSearch = [
        team.name,
        team.code,
        team.challenge,
        team.abstract,
        ...(team.members || []).flatMap((m) => [
          m.full_name,
          m.email,
          m.phone,
          m.register_number,
          m.department,
        ]),
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(term));
      return matchesEvent && matchesSearch;
    });
  }, [dashboard, selectedEvent, teamQuery]);

  const filteredPlayers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return playersWithEvents;
    return playersWithEvents.filter((player) =>
      [
        player.full_name,
        player.email,
        player.register_number,
        player.department,
        player.year_of_study,
        player.phone,
        player.registered_events_text,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [playersWithEvents, query]);

  const exportToCSV = () => {
    if (!filteredPlayers.length) return;

    const headers = [
      "Player Number",
      "Full Name",
      "Register Number",
      "Email",
      "Contact",
      "Department",
      "Year",
      "Registered Events",
    ];

    const rows = filteredPlayers.map((player) => [
      `#${player.player_number}`,
      player.full_name || "",
      player.register_number || "",
      player.email || "",
      player.phone || "",
      player.department || "",
      player.year_of_study || "",
      player.registered_events_text || "None",
    ]);

    const csvContent = [
      headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = query.trim()
      ? `innov8_registered_users_${query.trim().replace(/[^a-z0-9]/gi, "_")}.csv`
      : "innov8_registered_users.csv";
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTeamsToCSV = () => {
    if (!filteredTeams.length) return;

    const headers = [
      "Event Name",
      "Team Name",
      "Team Code",
      "Joined Count",
      "Team Capacity",
      "Member Role",
      "Member Name",
      "Register Number",
      "Email",
      "Contact",
      "Department",
      "Year",
      "Paper Abstract",
    ];

    const rows = [];
    filteredTeams.forEach((team) => {
      if (team.members && team.members.length > 0) {
        team.members.forEach((member) => {
          rows.push([
            team.challenge || "",
            team.name || "",
            team.code || "",
            team.joined_count || 0,
            team.team_size || 0,
            member.role || "",
            member.full_name || "",
            member.register_number || "",
            member.email || "",
            member.phone || "",
            member.department || "",
            member.year_of_study || "",
            team.abstract || "",
          ]);
        });
      } else {
        rows.push([
          team.challenge || "",
          team.name || "",
          team.code || "",
          team.joined_count || 0,
          team.team_size || 0,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          team.abstract || "",
        ]);
      }
    });

    const csvContent = [
      headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `innov8_teams_${selectedEvent.toLowerCase().replace(/[^a-z0-9]/gi, "_")}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
            <h2>REGISTERED USERS ({filteredPlayers.length})</h2>
          </div>
          <div className="admin-search-actions">
            <label>
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, event, register no., email..."
              />
            </label>
            <button
              type="button"
              className="admin-export-btn"
              onClick={exportToCSV}
              disabled={!filteredPlayers.length}
            >
              <Download size={14} /> EXPORT CSV / EXCEL
            </button>
          </div>
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
                <th>REGISTERED EVENTS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr key={player.id}>
                  <td>
                    <b>#{player.player_number}</b> {player.full_name}
                  </td>
                  <td>{player.register_number}</td>
                  <td>{player.email}</td>
                  <td>{player.phone}</td>
                  <td>{player.department}</td>
                  <td>{player.year_of_study}</td>
                  <td>
                    {player.registered_events?.length > 0 ? (
                      <span className="admin-event-tag">
                        {player.registered_events_text}
                      </span>
                    ) : (
                      <span className="admin-no-events">None</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#888", padding: "24px" }}>
                    No registered players found matching "{query}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <small>03 / TEAM DATABASE</small>
            <h2>TEAM ROSTERS ({filteredTeams.length})</h2>
          </div>
          <div className="admin-search-actions">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="admin-event-filter"
            >
              <option value="ALL">ALL EVENTS ({dashboard?.teams?.length || 0})</option>
              {availableEvents.map((evt) => (
                <option key={evt} value={evt}>
                  {evt}
                </option>
              ))}
            </select>
            <label>
              <Search size={14} />
              <input
                value={teamQuery}
                onChange={(event) => setTeamQuery(event.target.value)}
                placeholder="Search team, code, member, event..."
              />
            </label>
            <button
              type="button"
              className="admin-export-btn"
              onClick={exportTeamsToCSV}
              disabled={!filteredTeams.length}
            >
              <Download size={14} /> EXPORT TEAMS CSV
            </button>
          </div>
        </div>
        <div className="admin-team-list">
          {filteredTeams.map((team) => (
            <details key={team.id}>
              <summary>
                <div>
                  <small style={{ color: "#e32748", fontWeight: "700" }}>{team.challenge}</small>
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
          {filteredTeams.length === 0 && (
            <div style={{ textAlign: "center", color: "#888", padding: "32px", border: "1px dashed #ffffff20" }}>
              No teams found matching the selected event or query.
            </div>
          )}
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
