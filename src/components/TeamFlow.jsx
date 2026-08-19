import { useEffect, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import {
  createTeam as createTeamRequest,
  getEventRegistrationStatus,
  getStoredPlayer,
  joinTeam as joinTeamRequest,
  registerIndividual,
} from "../services/innov8Api";
import EventStatusPanel from "./EventStatusPanel";
import CopyButton from "./CopyButton";

const departments = ["CSBS", "AIDS", "CSE", "AIML", "IT"];
const years = ["First year", "Second year", "Third year", "Final year"];
const paperDomains = [
  "AI for Smart Business Solutions",
  "FinTech and Digital Banking",
  "Smart and Sustainable Communities",
  "Cybersecurity and Digital Trust",
];
const emptyPlayer = () => ({
  name: "",
  registerNumber: "",
  department: "",
  year: "",
  contact: "",
  email: "",
});

function PlayerFields({ title, value, onChange }) {
  const update = (field, next) => onChange({ ...value, [field]: next });
  return (
    <fieldset className="member-fields">
      <legend>{title}</legend>
      <div className="team-form-grid">
        <label>
          FULL NAME
          <input
            value={value.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Player name"
            required
          />
        </label>
        <label>
          REGISTER NUMBER
          <input
            value={value.registerNumber}
            onChange={(e) => update("registerNumber", e.target.value)}
            placeholder="Registration number"
            required
          />
        </label>
        <label>
          DEPARTMENT
          <select
            value={value.department}
            onChange={(e) => update("department", e.target.value)}
            required
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          YEAR OF STUDY
          <select
            value={value.year}
            onChange={(e) => update("year", e.target.value)}
            required
          >
            <option value="">Select year</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <label>
          CONTACT NUMBER
          <input
            type="tel"
            value={value.contact}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="+91 00000 00000"
            required
          />
        </label>
        <label>
          EMAIL
          <input
            type="email"
            value={value.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="player@college.edu"
            required
          />
        </label>
      </div>
    </fieldset>
  );
}

export default function TeamFlow({ mode, challenge, onClose, onJoined }) {
  const savedPlayer = getStoredPlayer();
  const savedPlayerDetails = () => ({
    ...emptyPlayer(),
    ...(savedPlayer || {}),
  });
  const teamSize =
    {
      "BUG HUNT": 2,
      PROMPT2PRODUCT: 2,
      "PAPER PRESENTATION": 2,
      "IPL AUCTION": 4,
      "CRIME MYSTERY": 4,
    }[challenge?.name] || 2;
  const [teamName, setTeamName] = useState("");
  const [abstract, setAbstract] = useState("");
  const [paperDomain, setPaperDomain] = useState("");
  const [leader, setLeader] = useState(savedPlayerDetails);
  const [members, setMembers] = useState(() =>
    Array.from({ length: teamSize - 1 }, emptyPlayer),
  );
  const [generatedCode, setGeneratedCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinStatus, setJoinStatus] = useState(null);
  const [soloPlayer, setSoloPlayer] = useState(savedPlayerDetails);
  const [soloComplete, setSoloComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [liveStatus, setLiveStatus] = useState(null);
  const challengeName = challenge?.name || "SELECTED CHALLENGE";
  const needsAbstract = challengeName === "PAPER PRESENTATION";
  const abstractWordCount = abstract.trim()
    ? abstract.trim().split(/\s+/).length
    : 0;

  useEffect(() => {
    if (!generatedCode) return;
    let active = true;
    let statusAvailable = true;
    const load = async () => {
      if (!statusAvailable) return;
      try {
        const result = await getEventRegistrationStatus(challengeName);
        if (active) setLiveStatus(result);
      } catch {
        statusAvailable = false;
      }
    };
    load();
    const timer = window.setInterval(load, 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [generatedCode, challengeName]);

  const createTeam = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      const result = await createTeamRequest({
        challengeName,
        teamName,
        leader,
        members,
        abstract: needsAbstract ? abstract : null,
        domain: needsAbstract ? paperDomain : null,
      });
      setGeneratedCode(result.team_code);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  };
  const joinTeam = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setJoinStatus(null);
    try {
      const result = await joinTeamRequest({ challengeName, code: joinCode });
      setJoinStatus({
        ok: true,
        message: `ACCESS GRANTED / ${result.team_name}`,
        team: result,
      });
      window.setTimeout(() => onJoined?.(), 700);
    } catch (error) {
      setJoinStatus({ ok: false, message: error.message.toUpperCase() });
    } finally {
      setBusy(false);
    }
  };
  const registerSolo = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      await registerIndividual({ challengeName, player: soloPlayer });
      setSoloComplete(true);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (mode === "individual")
    return (
      <div className="overlay team-flow">
        <button className="close" onClick={onClose}>
          <X />
        </button>
        {soloComplete ? (
          <div className="team-code-result">
            <div className="result-mark">
              <Check />
            </div>
            <small>INDIVIDUAL ENTRY VERIFIED</small>
            <h2>
              PLAYER
              <br />
              <span>ACCEPTED.</span>
            </h2>
            <p>
              {soloPlayer.name} is registered as a solo participant for{" "}
              {challengeName}.
            </p>
            <div className="solo-access">
              <small>ENTRY TYPE</small>
              <strong>INDIVIDUAL PLAYER</strong>
            </div>
            <button className="secondary" onClick={onClose}>
              RETURN TO CHALLENGES
            </button>
          </div>
        ) : (
          <form
            className="team-create-form solo-registration"
            onSubmit={registerSolo}
          >
            <div className="team-flow-head">
              <small>○ INDIVIDUAL REGISTRATION / {challengeName}</small>
              <h2>
                ENTER
                <br />
                <span>THE TANK.</span>
              </h2>
              <p>
                This is a solo challenge. Register one participant to continue.
              </p>
            </div>
            <PlayerFields
              title="PARTICIPANT DETAILS"
              value={soloPlayer}
              onChange={setSoloPlayer}
            />
            {formError && (
              <div className="join-message error">
                <X size={18} /> {formError}
              </div>
            )}
            <button
              className="primary team-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? "REGISTERING..." : "CONFIRM SOLO ENTRY"}{" "}
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    );

  return (
    <div className="overlay team-flow">
      <button className="close" onClick={onClose}>
        <X />
      </button>
      {mode === "create" ? (
        generatedCode ? (
          <div className="team-code-result">
            <div className="result-mark">
              <Check />
            </div>
            <small>TEAM CREATION COMPLETE</small>
            <h2>
              SQUAD
              <br />
              <span>ASSEMBLED.</span>
            </h2>
            <p>
              {teamName} is registered for {challengeName}.
            </p>
            <div className="generated-code">
              <small>TEAM ACCESS CODE</small>
              <strong>{generatedCode}</strong>
              <CopyButton
                value={generatedCode}
                label="COPY CODE"
                copiedLabel="CODE COPIED"
                iconSize={15}
              />
            </div>
            <p className="code-warning">
              Share this alphanumeric code with your team members. Their
              approval status updates automatically after they join.
            </p>
            <EventStatusPanel
              status={liveStatus}
              onRefresh={async () =>
                setLiveStatus(await getEventRegistrationStatus(challengeName))
              }
              compact
            />
            <button className="secondary" onClick={onClose}>
              RETURN TO CHALLENGES
            </button>
          </div>
        ) : (
          <form className="team-create-form" onSubmit={createTeam}>
            <div className="team-flow-head">
              <small>○ CREATE TEAM / {challengeName}</small>
              <h2>
                ASSEMBLE
                <br />
                <span>YOUR SQUAD.</span>
              </h2>
              <p>
                Register the team leader and{" "}
                {teamSize - 1 === 1
                  ? "one team member"
                  : `${teamSize - 1} team members`}
                . Team size: {teamSize} players.
              </p>
            </div>
            <label className="team-name-field">
              TEAM NAME
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter squad name"
                required
              />
            </label>
            {needsAbstract && (
              <div className="paper-submission-fields">
                <label>
                  PAPER DOMAIN
                  <select
                    value={paperDomain}
                    onChange={(event) => setPaperDomain(event.target.value)}
                    required
                  >
                    <option value="">Select presentation domain</option>
                    {paperDomains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="paper-abstract-field">
                  PAPER PRESENTATION ABSTRACT
                  <textarea
                    value={abstract}
                    onChange={(event) => {
                      const next = event.target.value;
                      const words = next.trim()
                        ? next.trim().split(/\s+/).length
                        : 0;
                      if (words <= 150) setAbstract(next);
                    }}
                    placeholder="Enter your paper abstract in no more than 150 words"
                    rows={8}
                    required
                  />
                  <span className={abstractWordCount === 150 ? "at-limit" : ""}>
                    {abstractWordCount} / 150 WORDS
                  </span>
                </label>
              </div>
            )}
            <PlayerFields
              title="TEAM LEADER"
              value={leader}
              onChange={setLeader}
            />
            {members.map((member, index) => (
              <PlayerFields
                key={index}
                title={`TEAM MEMBER ${index + 1}`}
                value={member}
                onChange={(next) =>
                  setMembers((current) =>
                    current.map((item, i) => (i === index ? next : item)),
                  )
                }
              />
            ))}
            {formError && (
              <div className="join-message error">
                <X size={18} /> {formError}
              </div>
            )}
            <button
              className="primary team-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? "CREATING SQUAD..." : "GENERATE TEAM CODE"}{" "}
              <ArrowRight size={16} />
            </button>
          </form>
        )
      ) : (
        <form className="team-join-form" onSubmit={joinTeam}>
          <div className="join-emblem">✕</div>
          <small>TEAM ACCESS TERMINAL / {challengeName}</small>
          <h2>
            JOIN
            <br />
            <span>THE SQUAD.</span>
          </h2>
          <p>Enter the alphanumeric access code shared by your team leader.</p>
          <label>
            TEAM ACCESS CODE
            <input
              value={joinCode}
              onChange={(e) => {
                setJoinCode(
                  e.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase(),
                );
                setJoinStatus(null);
              }}
              placeholder="IN8XXXXXX"
              minLength="9"
              maxLength="9"
              required
            />
          </label>
          {joinStatus && (
            <div
              className={
                joinStatus.ok ? "join-message success" : "join-message error"
              }
            >
              {joinStatus.ok ? <Check size={18} /> : <X size={18} />}{" "}
              {joinStatus.message}
            </div>
          )}
          <button className="primary" type="submit" disabled={busy}>
            {busy ? "VERIFYING..." : "VERIFY & JOIN TEAM"}{" "}
            <ArrowRight size={16} />
          </button>
          <small className="join-hint">
            Your registered email or register number must match a member on the
            team roster.
          </small>
        </form>
      )}
    </div>
  );
}
