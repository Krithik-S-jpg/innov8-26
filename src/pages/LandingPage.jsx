import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Check, LogOut, Menu, Phone, X } from "lucide-react";
import ProvidedLoader from "../components/boot/ProvidedLoader";
import CodemerceIntro from "../components/boot/CodemerceIntro";
import TeamFlow from "../components/TeamFlow";
import ChallengeDetail from "../components/ChallengeDetail";
import AuthPortal from "../components/AuthPortal";
import PlayerEvents from "../components/PlayerEvents";
import {
  getEventRegistrationStatus,
  getStoredPlayer,
  isPlayerRegistered,
  registerPlayer,
  signOutPlayer,
  subscribeToPasswordRecovery,
} from "../services/innov8Api";

const challenges = [
  [
    "01",
    "△",
    "BUG HUNT",
    "TECHNICAL",
    "Find the bugs. Fix the flaws.",
    "Identify and repair hidden errors before the system clock reaches zero.",
  ],
  [
    "02",
    "○",
    "PROMPT2PRODUCT",
    "TECHNICAL",
    "Reverse it. Build it better.",
    "Analyse a digital product, prompt with precision, and rebuild a working experience.",
  ],
  [
    "03",
    "□",
    "PAPER PRESENTATION",
    "TECHNICAL",
    "Present ideas. Inspire innovation.",
    "Defend an original emerging-technology idea before the evaluation panel.",
  ],
  [
    "04",
    "△",
    "IPL AUCTION",
    "NON-TECHNICAL",
    "Bid smart. Build strong.",
    "Use strategy and a fixed virtual budget to assemble the strongest cricket squad.",
  ],
  [
    "05",
    "○",
    "SHARK TANK",
    "NON-TECHNICAL",
    "Pitch it. Make them believe.",
    "Sell an original startup vision and survive questions from the judging panel.",
  ],
  [
    "06",
    "□",
    "CRIME MYSTERY",
    "NON-TECHNICAL",
    "Clues. Evidence. Mystery.",
    "Connect evidence, witness statements, and hidden clues to solve the investigation.",
  ],
].map(([n, symbol, name, category, line, detail]) => ({
  n,
  symbol,
  name,
  category,
  line,
  detail,
}));
const schedule = [
  [
    "09:15",
    "OPENING CEREMONY",
    "Inauguration, speeches & participant settling",
  ],
  ["10:00", "SESSION 01", "Paper Presentation · Bug Hunt · Shark Tank"],
  ["12:00", "INTERMISSION", "Lunch, break & venue reset"],
  ["12:30", "SESSION 02", "Prompt2Product · Crime Mystery"],
  ["14:30", "SESSION 03", "IPL Auction"],
  ["16:30", "GAME OVER", "All events completed"],
];

function Boot({ enter }) {
  return <ProvidedLoader onComplete={enter} />;
}

function LandingPage() {
  const storedPlayer = getStoredPlayer();
  const [intro, setIntro] = useState(true),
    [boot, setBoot] = useState(true),
    [menu, setMenu] = useState(false),
    [contactOpen, setContactOpen] = useState(false),
    [selected, setSelected] = useState(null),
    [register, setRegister] = useState(false),
    [registered, setRegistered] = useState(isPlayerRegistered),
    [teamGate, setTeamGate] = useState(false),
    [teamMode, setTeamMode] = useState(""),
    [teamFlow, setTeamFlow] = useState(false),
    [accepted, setAccepted] = useState(false),
    [flipped, setFlipped] = useState(false),
    [player, setPlayer] = useState(
      () =>
        storedPlayer || {
          name: "",
          email: "",
          contact: "",
          department: "",
          year: "First year",
          registerNumber: "",
        },
    ),
    [regError, setRegError] = useState(""),
    [eventStatus, setEventStatus] = useState(null),
    [statusLoading, setStatusLoading] = useState(false),
    [statusRefresh, setStatusRefresh] = useState(0),
    [passwordRecovery, setPasswordRecovery] = useState(() =>
      new URLSearchParams(window.location.search).has("reset-password"),
    ),
    [active, setActive] = useState("home"),
    [disclaimerOpen, setDisclaimerOpen] = useState(false),
    [submitting, setSubmitting] = useState(false);
  const name = player.name;
  useEffect(() => {
    if (passwordRecovery) {
      setIntro(false);
      setBoot(false);
    }
    return subscribeToPasswordRecovery(() => {
      setPasswordRecovery(true);
      setIntro(false);
      setBoot(false);
    });
  }, [passwordRecovery]);
  useEffect(() => {
    if (boot) return;
    const sections = [...document.querySelectorAll("section[id]")];
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: "-35% 0px -55%" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [boot]);
  useEffect(() => {
    if (!selected || !registered || register || teamGate || teamFlow) {
      setEventStatus(null);
      return;
    }
    let active = true;
    let first = true;
    let statusAvailable = true;
    const load = async () => {
      if (!statusAvailable) return;
      if (first) setStatusLoading(true);
      try {
        const result = await getEventRegistrationStatus(selected.name);
        if (active) setEventStatus(result);
      } catch {
        statusAvailable = false;
        if (active) setEventStatus(null);
      } finally {
        if (active) setStatusLoading(false);
        first = false;
      }
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selected, registered, register, teamGate, teamFlow, statusRefresh]);
  const openRegister = (c) => {
    if (c) {
      setSelected(c);
      if (!registered) {
        setAccepted(false);
        setRegister(true);
      } else if (c.name === "SHARK TANK") {
        setTeamMode("individual");
        setTeamFlow(true);
      } else {
        setTeamGate(true);
      }
      return;
    }
    setAccepted(registered);
    setRegister(true);
  };
  const chooseTeam = (mode) => {
    setTeamMode(mode);
    setTeamGate(false);
    setTeamFlow(true);
  };
  const updatePlayer = (field, value) =>
    setPlayer((current) => ({ ...current, [field]: value }));
  const submitPlayer = async (e) => {
    e?.preventDefault?.();
    if (submitting) return;
    setSubmitting(true);
    setRegError("");
    try {
      const result = await registerPlayer(player);
      setPlayer((current) => ({
        ...current,
        playerNumber: result.player_number,
      }));
      setRegistered(true);
      setAccepted(true);
    } catch (error) {
      setRegError(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  if (intro) return <CodemerceIntro onComplete={() => setIntro(false)} />;
  if (boot) return <Boot enter={() => setBoot(false)} />;
  return (
    <main className="site-shell">
      <nav>
        <a className="brand" href="#home">
          <span>△○□</span> INNOV<b>8</b>'26
        </a>
        <div className="nav-channel">
          <i /> CHANNEL{" "}
          {active === "home"
            ? "00"
            : active === "about"
              ? "01"
              : active === "challenges"
                ? "03"
                : "04"}{" "}
          / {active.toUpperCase()}
        </div>
        <div className={menu ? "nav-links open" : "nav-links"}>
          {["ABOUT", "CHALLENGES", "SCHEDULE", "CONTACT"].map((x) => (
            <a
              className={active === x.toLowerCase() ? "active" : ""}
              key={x}
              href={`#${x.toLowerCase()}`}
              onClick={(e) => {
                if (x === "CONTACT") {
                  e.preventDefault();
                  setContactOpen(true);
                }
                setMenu(false);
              }}
            >
              {x}
            </a>
          ))}
          <button
            className="nav-register blood-register"
            onClick={() => openRegister()}
          >
            <span>REGISTER</span>
            <span className="blood-trails" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
        <button className="menu-button" onClick={() => setMenu(!menu)}>
          {menu ? <X /> : <Menu />}
        </button>
      </nav>
      <aside className="journey-rail">
        <small>PLAYER JOURNEY</small>
        {[
          ["home", "DETECTED"],
          ["about", "BRIEFED"],
          ["challenges", "SELECT"],
          ["schedule", "GAME DAY"],
        ].map((j, i) => (
          <a
            href={`#${j[0]}`}
            className={active === j[0] ? "active" : ""}
            key={j[0]}
          >
            <i>{i + 1}</i>
            <span>{j[1]}</span>
          </a>
        ))}
        <button
          className={accepted ? "complete" : ""}
          onClick={() => openRegister()}
        >
          <i>{accepted ? "✓" : "5"}</i>
          <span>{accepted ? "ACCEPTED" : "REGISTER"}</span>
        </button>
      </aside>
      <section className="hero" id="home">
        <div className="hero-image" />
        <div className="hero-grid" />
        <div className="hero-copy">
          <div className="eyebrow">
            <i /> WELCOME TO THE GAME
          </div>
          <h1>
            INNOV<span>8</span>'26
          </h1>
          <h2>THE CSBS SYMPOSIUM</h2>
          <p className="hero-statement">
            8 HOURS. <em>6 CHALLENGES.</em>
            <br />1 CHAMPION.
          </p>
          <div className="hero-meta">
            <span>25 AUGUST 2026</span>
            <span>SARANATHAN COLLEGE OF ENGINEERING</span>
          </div>
          <div className="hero-actions">
            <button className="primary" onClick={() => openRegister()}>
              ENTER THE GAME <ArrowRight size={16} />
            </button>
            <a className="secondary" href="#challenges">
              EXPLORE CHALLENGES <ArrowDown size={16} />
            </a>
          </div>
        </div>
        <div className="hero-index">
          <span>
            PLAYER ROLES <b>01</b>
          </span>
          <span>
            CHALLENGES <b>06</b>
          </span>
          <span>
            GAME DAY <b>25</b>
          </span>
        </div>
      </section>
      <section className="purpose section" id="about">
        <div className="section-kicker">01 / OFFICIAL MISSION BRIEF</div>
        <div className="section-heading">
          <h2>
            ONE DAY.
            <br />
            <span>SIX ARENAS.</span>
          </h2>
          <p>
            INNOV8'26 is a one-day technical and non-technical student symposium
            organized by the Department of Computer Science and Business
            Systems, Saranathan College of Engineering, through Codemerce. It
            brings innovation, entrepreneurship, logical reasoning and strategy
            into one controlled competitive arena.
          </p>
        </div>
        <div className="about-facts">
          <div>
            <strong>600+</strong>
            <span>TARGET PARTICIPANTS</span>
          </div>
          <div>
            <strong>06</strong>
            <span>TECHNICAL & NON-TECHNICAL EVENTS</span>
          </div>
          <div>
            <strong>04</strong>
            <span>MAXIMUM EVENTS PER STUDENT</span>
          </div>
          <div>
            <strong>25.08.26</strong>
            <span>ONE-DAY SYMPOSIUM</span>
          </div>
        </div>
        <div className="objectives">
          {[
            [
              "△",
              "BALANCED COMPETITION",
              "Technical, innovation and strategy-based challenges.",
              "INNOVATION",
            ],
            [
              "○",
              "CONTROLLED ENTRY",
              "Clear capacity limits protect every arena from overcrowding.",
              "CAPACITY",
            ],
            [
              "□",
              "FAIR SELECTION",
              "FCFS, faculty evaluation and performance-based shortlisting.",
              "SELECTION",
            ],
            [
              "＋",
              "STRUCTURED PROGRESS",
              "Registration, qualification, finals and winner selection.",
              "WORKFLOW",
            ],
          ].map((o, i) => (
            <article key={o[1]}>
              <div className="terminal-head">
                <small>OBJECTIVE 0{i + 1}</small>
                <em>● ACTIVE</em>
              </div>
              <b>{o[0]}</b>
              <span className="scan-line" />
              <h3>{o[1]}</h3>
              <p>{o[2]}</p>
              <footer>
                <span>PROTOCOL</span>
                <strong>{o[3]}</strong>
              </footer>
            </article>
          ))}
        </div>
        <div className="official-rules">
          <div className="rules-title">
            <small>02 / PLAYER DIRECTIVE</small>
            <h3>
              OFFICIAL
              <br />
              <span>GAME RULES.</span>
            </h3>
            <p>
              All participants must follow the symposium rules, faculty guidance
              and college regulations.
            </p>
          </div>
          <ol>
            {[
              [
                "FOUR-EVENT LIMIT",
                "Each participant may register for a maximum of four events.",
              ],
              [
                "TEAM & EVENT RULES",
                "Participants must follow the prescribed team sizes and all event-specific rules.",
              ],
              [
                "REPORT ON TIME",
                "Participants must report to their respective event venues on time.",
              ],
              [
                "FOLLOW INSTRUCTIONS",
                "All participants must follow instructions given by faculty members and event coordinators.",
              ],
              [
                "PLAYER CONDUCT",
                "Malpractice, misconduct or any disturbance will not be permitted.",
              ],
              [
                "PROTECT FACILITIES",
                "College facilities and equipment must be handled carefully and responsibly.",
              ],
              [
                "FINAL DECISION",
                "Decisions made by judges and event coordinators under faculty supervision will be final.",
              ],
            ].map((r, i) => (
              <li key={r[0]}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{r[0]}</strong>
                  <p>{r[1]}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="about-venue">
          MULTIPLE EVENTS OPERATE SIMULTANEOUSLY ACROSS CLASSROOMS, JS HALL AND
          COMPUTER LABORATORIES.
        </p>
      </section>
      <section className="briefing">
        <div>
          <div className="section-kicker">02 / GAME PROTOCOL</div>
          <h2>
            THE GAME
            <br />
            BEGINS.
          </h2>
          <p>Every decision counts. Every second matters.</p>
        </div>
        <div className="rules">
          {[
            "THINK FAST",
            "PLAY SMART",
            "SOLVE THE CHALLENGE",
            "PROVE YOURSELF",
          ].map((r, i) => (
            <div key={r}>
              <span>0{i + 1}</span>
              <b>{r}</b>
              <i>→</i>
            </div>
          ))}
        </div>
      </section>
      <section className="sentinel-arena">
        <div className="arena-shade" />
        <div className="arena-copy">
          <div className="section-kicker">SURVEILLANCE FEED / ARENA 01</div>
          <h2>
            MOVE WITH
            <br />
            <span>PRECISION.</span>
          </h2>
          <p>
            The sentinel watches every player. Read the field, control your
            timing, and make every move count.
          </p>
          <div className="prop-list">
            <span>◉ MOTION SENSOR</span>
            <span>◇ PLAYGROUND GRID</span>
            <span>● PLAYER MARBLES</span>
          </div>
        </div>
        <div className="camera-hud">
          <i>REC</i>
          <b>CAM 01</b>
          <span>●</span>
        </div>
      </section>
      <section className="section challenges" id="challenges">
        <div className="challenge-watermark">GAME SELECTION</div>
        <div className="section-kicker">03 / SELECT YOUR ARENA</div>
        <div className="section-heading">
          <h2>
            CHOOSE YOUR
            <br />
            <span>CHALLENGE.</span>
          </h2>
          <p>
            Six challenges. One game. Select the arena that rewards your
            strongest instinct.
          </p>
        </div>
        <div className="challenge-grid">
          {challenges.map((c, i) => (
            <button
              className={`challenge-card game-${i + 1}`}
              key={c.n}
              onClick={() => setSelected(c)}
            >
              <span className="card-feed">● LIVE　CAM 0{i + 1}</span>
              <small>{c.category}</small>
              <span className="challenge-number">{c.n}</span>
              <div className="game-prop" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
              <b className="challenge-symbol">{c.symbol}</b>
              <div className="card-copy">
                <h3>{c.name}</h3>
                <p>{c.line}</p>
                <em>
                  ENTER ARENA <ArrowRight size={15} />
                </em>
              </div>
              <div className="card-brief">
                <div className="brief-top">
                  <span>GAME BRIEFING</span>
                  <b>0{c.n}</b>
                </div>
                <strong>{c.name}</strong>
                <p>{c.detail}</p>
                <dl>
                  <div>
                    <dt>DIVISION</dt>
                    <dd>{c.category}</dd>
                  </div>
                  <div>
                    <dt>STATUS</dt>
                    <dd>REGISTRATION OPEN</dd>
                  </div>
                </dl>
                <em>
                  VIEW FULL BRIEF <ArrowRight size={15} />
                </em>
              </div>
              <span className="player-stamp">
                PLAYER / {String(82 + i).padStart(3, "0")}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="section schedule" id="schedule">
        <div className="control-strip">
          <span>
            <i /> CONTROL ROOM ONLINE
          </span>
          <b>GAME DAY / 25.08.26</b>
          <em>06 SCHEDULED PHASES</em>
        </div>
        <div className="section-kicker">04 / GAME DAY</div>
        <div className="section-heading">
          <h2>
            THE FINAL
            <br />
            <span>TIMELINE.</span>
          </h2>
          <p>
            25 August 2026. One precisely orchestrated day from player entry to
            final outcome.
          </p>
        </div>
        <div className="countdown-panel">
          <small>GAME COMMENCES IN</small>
          <strong>08:00:00</strong>
          <span>FACILITY TIME / IST</span>
        </div>
        <div className="timeline">
          {schedule.map((s, i) => (
            <article key={s[0]} className={i === 0 ? "active" : ""}>
              <span className="node">{i + 1}</span>
              <div className="phase-status">
                {i === 0 ? "● ACTIVE" : "○ LOCKED"}
              </div>
              <time>{s[0]}</time>
              <h3>{s[1]}</h3>
              <p>{s[2]}</p>
              <footer>
                ARENA {String(i + 1).padStart(2, "0")} <b>CAM 0{i + 1}</b>
              </footer>
            </article>
          ))}
        </div>
      </section>
      <section className="final-cta">
        <div className="symbols">△　○　□</div>
        <small>YOUR PLAYER NUMBER IS WAITING</small>
        <h2>
          READY TO
          <br />
          <span>ENTER?</span>
        </h2>
        <button className="primary" onClick={() => openRegister()}>
          REGISTER NOW <ArrowRight size={16} />
        </button>
      </section>
      <footer id="contact">
        <div className="footer-brand-group">
          <a className="brand" href="#home">
            <span>△○□</span> INNOV<b>8</b>'26
          </a>
          <button
            type="button"
            className="disclaimer-trigger"
            aria-expanded={disclaimerOpen}
            aria-controls="copyright-disclaimer"
            onClick={() => setDisclaimerOpen((open) => !open)}
          >
            <span>!</span>
            {disclaimerOpen ? "HIDE DISCLAIMER" : "VIEW DISCLAIMER"}
            <ArrowRight size={13} />
          </button>
        </div>
        <p>
          THE CSBS SYMPOSIUM
          <br />
          Codemerce — The Official Club of CSBS
        </p>
        <p>
          Saranathan College of Engineering
          <br />
          25 August 2026
        </p>
        <p
          id="copyright-disclaimer"
          className={`copyright-disclaimer ${disclaimerOpen ? "is-open" : ""}`}
          aria-hidden={!disclaimerOpen}
        >
          DISCLAIMER — This is an unofficial, Squid Game-inspired student
          symposium website created for event presentation purposes. It is not
          affiliated with, endorsed by, or sponsored by Netflix or the owners of
          the Squid Game franchise. Squid Game names, symbols, characters,
          imagery, and related trademarks remain the property of their
          respective rights holders.
        </p>
      </footer>
      {contactOpen && (
        <div className="overlay contact-modal">
          <button
            className="close"
            onClick={() => setContactOpen(false)}
            aria-label="Close contact details"
          >
            <X />
          </button>
          <div className="contact-card">
            <small>EVENT COORDINATORS / CONTACT</small>
            <h2>
              EVENT
              <br />
              <span>COORDINATORS.</span>
            </h2>
            <p>
              Get in touch with official student coordinators for any event
              inquiries or support.
            </p>
            <div className="contact-list">
              <div className="contact-item">
                <div className="contact-info">
                  <small>OVERALL COORDINATOR</small>
                  <strong>VENKAT</strong>
                </div>
                <a href="tel:8838435611" className="contact-phone">
                  <Phone size={14} />
                  <span>8838435611</span>
                </a>
              </div>
              <div className="contact-item">
                <div className="contact-info">
                  <small>WEBSITE COORDINATOR</small>
                  <strong>KRITHIK</strong>
                </div>
                <a href="tel:9345445729" className="contact-phone">
                  <Phone size={14} />
                  <span>9345445729</span>
                </a>
              </div>
              <div className="contact-item">
                <div className="contact-info">
                  <small>EVENT COORDINATOR</small>
                  <strong>KEYA SHANIKA</strong>
                </div>
                <a href="tel:9487732672" className="contact-phone">
                  <Phone size={14} />
                  <span>9487732672</span>
                </a>
              </div>
              <div className="contact-item">
                <div className="contact-info">
                  <small>BUG HUNT COORDINATOR</small>
                  <strong>MANASA</strong>
                </div>
                <a href="tel:8668160427" className="contact-phone">
                  <Phone size={14} />
                  <span>8668160427</span>
                </a>
              </div>
            </div>
            <button
              className="secondary contact-close-btn"
              onClick={() => setContactOpen(false)}
            >
              CLOSE WINDOW
            </button>
          </div>
        </div>
      )}
      {selected && !register && !teamGate && !teamFlow && (
        <ChallengeDetail
          challenge={selected}
          onClose={() => setSelected(null)}
          onRegister={() => openRegister(selected)}
          registrationStatus={eventStatus}
          statusLoading={statusLoading}
          onRefreshStatus={() => setStatusRefresh((value) => value + 1)}
        />
      )}
      {teamGate && (
        <div className="overlay team-gate">
          <button className="close" onClick={() => setTeamGate(false)}>
            <X />
          </button>
          <div className="vote-head">
            <small>CHALLENGE {selected?.n} / TEAM PROTOCOL</small>
            <h2>
              CHOOSE YOUR
              <br />
              <span>GAME PATH.</span>
            </h2>
            <p>Will you lead a new squad, or enter an existing one?</p>
          </div>
          <div className="vote-options">
            <button
              className="vote-card vote-yes"
              onClick={() => chooseTeam("create")}
            >
              <span className="vote-symbol">○</span>
              <small>TEAM OPTION / 01</small>
              <strong>CREATE TEAM</strong>
              <p>Become the team leader and invite players to your squad.</p>
              <em>PLAYER ACCESS　→</em>
            </button>
            <button
              className="vote-card vote-no"
              onClick={() => chooseTeam("join")}
            >
              <span className="vote-symbol">✕</span>
              <small>TEAM OPTION / 02</small>
              <strong>JOIN TEAM</strong>
              <p>Enter a team code and join an existing squad.</p>
              <em>TEAM ACCESS　→</em>
            </button>
          </div>
          <div className="vote-footer">
            <span>○ CREATE</span>
            <b>{selected?.name}</b>
            <span>✕ JOIN</span>
          </div>
        </div>
      )}
      {teamFlow && (
        <TeamFlow
          mode={teamMode}
          challenge={selected}
          onClose={() => {
            setTeamFlow(false);
            setSelected(null);
          }}
          onJoined={() => {
            setTeamFlow(false);
            setTeamMode("");
            setStatusRefresh((value) => value + 1);
          }}
        />
      )}
      {passwordRecovery && (
        <AuthPortal
          initialMode="reset"
          onClose={() => {
            setPasswordRecovery(false);
            window.history.replaceState({}, "", window.location.pathname);
          }}
          onAuthenticated={(profile) => {
            setPlayer(profile);
            setRegistered(true);
            setAccepted(true);
            setPasswordRecovery(false);
            setRegister(true);
          }}
        />
      )}
      {register && !accepted && (
        <AuthPortal
          onClose={() => setRegister(false)}
          onAuthenticated={(profile) => {
            setPlayer(profile);
            setRegistered(true);
            setAccepted(true);
          }}
        />
      )}
      {register && (
        <div className="overlay registration">
          <button
            className="close"
            onClick={() => {
              setRegister(false);
              setAccepted(false);
              setFlipped(false);
            }}
          >
            <X />
          </button>
          {accepted ? (
            <div className="player-card-wrap">
              <div className="accepted">
                <Check /> PLAYER ACCEPTED <span>· ID VERIFIED</span>
              </div>
              <button
                className={`flip-card ${flipped ? "is-flipped" : ""}`}
                onClick={() => setFlipped(!flipped)}
                aria-label="Flip player card"
              >
                <span className="flip-inner">
                  <span className="invite-face invite-front">
                    <span className="card-corner">
                      INNOV8'26 / PLAYER ACCESS
                    </span>
                    <span className="invite-symbols">
                      <i className="geo circle" />
                      <i className="geo triangle" />
                      <i className="geo square" />
                    </span>
                    <span className="front-sub">THE CSBS SYMPOSIUM</span>
                    <span className="card-hint">FLIP TO REVEAL ACCESS　→</span>
                  </span>
                  <span className="invite-face invite-back">
                    <span className="seal">
                      <span className="mini-symbols">
                        <i className="geo triangle" />
                        <i className="geo circle" />
                        <i className="geo square" />
                      </span>
                      <small>VERIFIED</small>
                    </span>
                    <span className="access-code">
                      #IN8-{String(player.playerNumber || 826).padStart(4, "0")}
                    </span>
                    <span className="back-rule" />
                    <small className="player-label">PLAYER IDENTITY</small>
                    <strong>{name || "PLAYER 0826"}</strong>
                    <p>{selected?.name || "CHALLENGE TO BE ASSIGNED"}</p>
                    <PlayerEvents />
                    <span className="barcode">
                      <i />
                      <small>IN8 0826 2508 2026</small>
                    </span>
                    <footer>
                      <span>25 AUGUST 2026</span>
                      <b>● ACCESS GRANTED</b>
                    </footer>
                  </span>
                </span>
              </button>
              <p className="flip-help">
                CLICK CARD TO FLIP　/　{flipped ? "FRONT VIEW" : "ACCESS VIEW"}
              </p>
              <button
                className="secondary"
                onClick={() => {
                  setRegister(false);
                  setAccepted(false);
                  setFlipped(false);
                }}
              >
                BACK TO GAME
              </button>
            </div>
          ) : submitting ? (
            <div className="verification-sequence">
              <div className="verify-reticle">
                <i />
                <i />
                <i />
              </div>
              <small>PLAYER FILE / IN8</small>
              <h2>
                VERIFYING
                <br />
                <span>IDENTITY.</span>
              </h2>
              <div className="verify-bar">
                <b />
              </div>
              <p>
                ENCRYPTING DATA　·　ASSIGNING PLAYER NUMBER　·　GENERATING
                ACCESS CARD
              </p>
            </div>
          ) : (
            <form onSubmit={submitPlayer}>
              <div className="reg-progress">
                <span className="active">01 IDENTITY</span>
                <span>02 INSTITUTION</span>
                <span>03 REVIEW</span>
                <span>04 VERIFY</span>
              </div>
              <small>SECURE ENROLMENT TERMINAL</small>
              <h2>
                PLAYER
                <br />
                REGISTRATION
              </h2>
              <div className="form-grid">
                <label>
                  FULL NAME
                  <input
                    value={player.name}
                    onChange={(e) => updatePlayer("name", e.target.value)}
                    placeholder="Enter player name"
                    minLength="2"
                    required
                  />
                </label>
                <label>
                  COLLEGE EMAIL
                  <input
                    type="email"
                    value={player.email}
                    onChange={(e) => updatePlayer("email", e.target.value)}
                    placeholder="yourname@saranathan.ac.in"
                    pattern="[-A-Za-z0-9._%+]+@saranathan[.]ac[.]in"
                    title="Use your official @saranathan.ac.in college email address"
                    required
                  />
                  <small className="field-hint">
                    ONLY @SARANATHAN.AC.IN EMAILS ACCEPTED
                  </small>
                </label>
                <label>
                  PHONE NUMBER
                  <input
                    type="tel"
                    value={player.contact}
                    onChange={(e) => updatePlayer("contact", e.target.value)}
                    placeholder="+91 00000 00000"
                    required
                  />
                </label>
                <label>
                  REGISTER NUMBER
                  <input
                    value={player.registerNumber}
                    onChange={(e) =>
                      updatePlayer("registerNumber", e.target.value)
                    }
                    placeholder="College register number"
                    required
                  />
                </label>
                <label>
                  DEPARTMENT
                  <select
                    value={player.department}
                    onChange={(e) => updatePlayer("department", e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select department
                    </option>
                    <option>CSBS</option>
                    <option>AIDS</option>
                    <option>CSE</option>
                    <option>AIML</option>
                    <option>IT</option>
                  </select>
                </label>
                <label>
                  YEAR
                  <select
                    value={player.year}
                    onChange={(e) => updatePlayer("year", e.target.value)}
                    required
                  >
                    <option>First year</option>
                    <option>Second year</option>
                    <option>Third year</option>
                    <option>Final year</option>
                  </select>
                </label>
              </div>
              {regError && (
                <div className="join-message error">
                  <X size={18} /> {regError}
                </div>
              )}
              <button className="primary" type="submit">
                VERIFY PLAYER DATA <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      )}
      {register && accepted && (
        <button
          className="player-logout"
          onClick={async () => {
            await signOutPlayer();
            setRegistered(false);
            setAccepted(false);
            setRegister(false);
            setSelected(null);
            setPlayer({
              name: "",
              email: "",
              contact: "",
              department: "",
              year: "First year",
              registerNumber: "",
            });
          }}
        >
          <LogOut size={16} /> LOGOUT
        </button>
      )}
    </main>
  );
}

export default LandingPage;
