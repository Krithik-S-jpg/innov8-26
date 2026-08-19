import { useEffect, useMemo, useState } from "react";
import {
  Check,
  FileText,
  LogOut,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { signInPaperReviewer } from "../services/innov8Api";

const REVIEWER_EMAIL = "arunadevipp@saranathan.ac.in";

export default function PaperReviewPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const { data, error: requestError } = await supabase.rpc(
      "get_paper_review_submissions",
    );
    if (requestError) setError(requestError.message);
    else setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const allowed = data.user?.email?.toLowerCase() === REVIEWER_EMAIL;
      setAuthenticated(allowed);
      if (allowed) load();
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
    try {
      await signInPaperReviewer({ email: REVIEWER_EMAIL, password });
      setAuthenticated(true);
      setPassword("");
      await load();
    } catch (loginError) {
      setError(loginError.message);
      setLoading(false);
    }
  };

  const review = async (teamId, decision) => {
    setWorkingId(teamId);
    setError("");
    const { error: reviewError } = await supabase.rpc(
      "review_paper_submission",
      {
        p_team_id: teamId,
        p_decision: decision,
      },
    );
    if (reviewError) setError(reviewError.message);
    else await load();
    setWorkingId("");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.hash = "home";
  };

  const visible = useMemo(
    () =>
      submissions.filter(
        (item) => filter === "all" || item.review_status === filter,
      ),
    [submissions, filter],
  );
  const counts = useMemo(
    () => ({
      all: submissions.length,
      pending: submissions.filter((item) => item.review_status === "pending")
        .length,
      approved: submissions.filter((item) => item.review_status === "approved")
        .length,
      rejected: submissions.filter((item) => item.review_status === "rejected")
        .length,
    }),
    [submissions],
  );

  if (!authenticated)
    return (
      <main className="review-login">
        <a href="#home" className="review-close">
          <X />
        </a>
        <section>
          <ShieldCheck />
          <small>PAPER PRESENTATION / REVIEW AUTHORITY</small>
          <h1>
            ABSTRACT
            <br />
            <span>CONTROL.</span>
          </h1>
          <p>
            Restricted access for the appointed paper presentation reviewer.
          </p>
        </section>
        <form onSubmit={login}>
          <small>REVIEWER CREDENTIALS</small>
          <h2>
            ENTER
            <br />
            REVIEW ROOM.
          </h2>
          <label>
            REVIEWER EMAIL
            <input value={REVIEWER_EMAIL} readOnly />
          </label>
          <label>
            PASSWORD
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <div className="review-error">{error}</div>}
          <button className="primary" disabled={loading}>
            {loading ? "VERIFYING..." : "OPEN SUBMISSIONS"}
          </button>
        </form>
      </main>
    );

  return (
    <main className="review-dashboard">
      <header>
        <div>
          <small>PAPER PRESENTATION / REVIEW TERMINAL</small>
          <h1>ABSTRACT REVIEW ROOM</h1>
        </div>
        <div>
          <button onClick={load}>
            <RefreshCw size={15} className={loading ? "status-spin" : ""} />{" "}
            REFRESH
          </button>
          <button onClick={logout}>
            <LogOut size={15} /> LOGOUT
          </button>
        </div>
      </header>
      {error && <div className="review-error">{error}</div>}
      <div
        className="review-filters"
        role="tablist"
        aria-label="Submission status"
      >
        {["all", "pending", "approved", "rejected"].map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item.toUpperCase()} <b>{counts[item]}</b>
          </button>
        ))}
      </div>
      <section className="submission-list">
        {visible.map((submission) => (
          <article
            key={submission.team_id}
            className={`submission-card ${submission.review_status}`}
          >
            <header>
              <div>
                <small>TEAM / {submission.team_code}</small>
                <h2>{submission.team_name}</h2>
              </div>
              <span>{submission.review_status.toUpperCase()}</span>
            </header>
            <div className="submission-domain">
              <small>SELECTED DOMAIN</small>
              <strong>{submission.domain}</strong>
            </div>
            <div className="submission-abstract">
              <FileText size={20} />
              <div>
                <small>ABSTRACT · {submission.word_count} WORDS</small>
                <p>{submission.abstract}</p>
              </div>
            </div>
            <div className="submission-members">
              {submission.members?.map((member) => (
                <div key={member.id}>
                  <strong>{member.full_name}</strong>
                  <span>
                    {member.role.toUpperCase()} · {member.register_number}
                  </span>
                  <small>
                    {member.department} · {member.year_of_study} ·{" "}
                    {member.email}
                  </small>
                </div>
              ))}
            </div>
            <footer>
              <time>
                SUBMITTED {new Date(submission.created_at).toLocaleString()}
              </time>
              <div>
                <button
                  className="reject"
                  disabled={workingId === submission.team_id}
                  onClick={() => review(submission.team_id, "rejected")}
                >
                  <X size={15} /> REJECT
                </button>
                <button
                  className="approve"
                  disabled={workingId === submission.team_id}
                  onClick={() => review(submission.team_id, "approved")}
                >
                  <Check size={15} /> APPROVE
                </button>
              </div>
            </footer>
          </article>
        ))}
        {!loading && visible.length === 0 && (
          <div className="review-empty">
            NO {filter === "all" ? "" : filter.toUpperCase()} SUBMISSIONS FOUND
          </div>
        )}
      </section>
    </main>
  );
}
