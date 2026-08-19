import { useState } from "react";
import { Check, Clock3, Plus, RefreshCw, Trash2, Users, X } from "lucide-react";
import { addTeamMember, removeTeamMember } from "../services/innov8Api";
import CopyButton from "./CopyButton";

const departments = ["CSBS", "AIDS", "CSE", "AIML", "IT"];
const years = ["First year", "Second year", "Third year", "Final year"];
const emptyMember = () => ({
  name: "",
  registerNumber: "",
  department: "",
  year: "",
  contact: "",
  email: "",
});

export default function EventStatusPanel({
  status,
  loading,
  onRefresh,
  compact = false,
}) {
  const [adding, setAdding] = useState(false);
  const [member, setMember] = useState(emptyMember);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const update = (field, value) =>
    setMember((current) => ({ ...current, [field]: value }));
  const refresh = async () => {
    await Promise.resolve(onRefresh?.());
  };
  const add = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      await addTeamMember({ teamId: status.team_id, member });
      setMember(emptyMember());
      setAdding(false);
      await refresh();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (item) => {
    if (busy || !window.confirm(`Remove ${item.name} from this team?`)) return;
    setBusy(true);
    setActionError("");
    try {
      await removeTeamMember({
        teamId: status.team_id,
        memberId: item.member_id,
      });
      await refresh();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <div className="event-status loading">
        <RefreshCw className="status-spin" />
        <span>CHECKING PLAYER RECORD...</span>
      </div>
    );
  if (!status?.registered) return null;

  if (status.type === "individual")
    return (
      <div className="event-status individual">
        <div className="status-title">
          <Check />
          <div>
            <small>REGISTRATION CONFIRMED</small>
            <strong>YOU HAVE ALREADY REGISTERED</strong>
          </div>
        </div>
        <span className="status-chip">INDIVIDUAL PLAYER</span>
      </div>
    );

  return (
    <div className={`event-status team ${compact ? "compact" : ""}`}>
      <div className="status-title">
        <Check />
        <div>
          <small>REGISTRATION CONFIRMED / {status.role?.toUpperCase()}</small>
          <strong>YOU HAVE ALREADY REGISTERED</strong>
        </div>
      </div>
      <div className="team-status-head">
        <div>
          <small>TEAM</small>
          <strong>{status.team_name}</strong>
        </div>
        <div>
          <small>ACCESS CODE</small>
          <strong>{status.team_code}</strong>
        </div>
        <CopyButton value={status.team_code} />
        <button type="button" onClick={refresh}>
          <RefreshCw size={14} /> REFRESH
        </button>
      </div>
      <div className="team-progress">
        <span>
          <Users size={15} /> {status.joined_count} / {status.team_size} PLAYERS
          JOINED
        </span>
        <i>
          <b
            style={{
              width: `${Math.min(100, (status.joined_count / status.team_size) * 100)}%`,
            }}
          />
        </i>
      </div>
      {status.challenge === "PAPER PRESENTATION" &&
        status.paper_review_status && (
          <div className={`paper-review-chip ${status.paper_review_status}`}>
            <small>ABSTRACT REVIEW</small>
            <strong>{status.paper_review_status.toUpperCase()}</strong>
            <span>{status.paper_domain}</span>
          </div>
        )}
      <div className="member-status-list">
        {status.members?.map((item, index) => (
          <div
            className={item.joined ? "joined" : "pending"}
            key={item.member_id || `${item.name}-${index}`}
          >
            <span>
              {item.joined ? <Check size={15} /> : <Clock3 size={15} />}
            </span>
            <div>
              <strong>{item.name}</strong>
              <small>{item.role?.toUpperCase()}</small>
            </div>
            <em>{item.joined ? "JOINED" : "AWAITING MEMBER"}</em>
            {status.role === "leader" && item.role !== "leader" && (
              <button
                className="member-remove"
                type="button"
                disabled={busy}
                onClick={() => remove(item)}
              >
                <Trash2 size={13} /> REMOVE
              </button>
            )}
          </div>
        ))}
      </div>
      {status.role === "leader" && (
        <div className="roster-controls">
          <div>
            <small>TEAM LEADER CONTROLS</small>
            <strong>
              {status.members?.length || 0} / {status.team_size} ROSTER SLOTS
              USED
            </strong>
          </div>
          {(status.members?.length || 0) < status.team_size && (
            <button
              type="button"
              onClick={() => {
                setAdding(!adding);
                setActionError("");
              }}
            >
              {adding ? <X size={14} /> : <Plus size={14} />}{" "}
              {adding ? "CANCEL" : "ADD MEMBER"}
            </button>
          )}
        </div>
      )}
      {actionError && (
        <div className="roster-error">
          <X size={15} />
          {actionError}
        </div>
      )}
      {status.role === "leader" && adding && (
        <form className="roster-add-form" onSubmit={add}>
          <label>
            FULL NAME
            <input
              value={member.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </label>
          <label>
            REGISTER NUMBER
            <input
              value={member.registerNumber}
              onChange={(e) => update("registerNumber", e.target.value)}
              required
            />
          </label>
          <label>
            DEPARTMENT
            <select
              value={member.department}
              onChange={(e) => update("department", e.target.value)}
              required
            >
              <option value="">Select</option>
              {departments.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            YEAR
            <select
              value={member.year}
              onChange={(e) => update("year", e.target.value)}
              required
            >
              <option value="">Select</option>
              {years.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            CONTACT NUMBER
            <input
              type="tel"
              value={member.contact}
              onChange={(e) => update("contact", e.target.value)}
              required
            />
          </label>
          <label>
            EMAIL
            <input
              type="email"
              value={member.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "ADDING..." : "ADD TO ROSTER"} <Plus size={14} />
          </button>
        </form>
      )}
    </div>
  );
}
