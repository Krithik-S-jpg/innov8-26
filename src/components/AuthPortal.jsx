import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  X,
} from "lucide-react";
import {
  requestPasswordReset,
  signInAdmin,
  signInPaperReviewer,
  signInPlayer,
  signUpPlayer,
  updatePlayerPassword,
} from "../services/innov8Api";

const departments = ["CSBS", "AIDS", "CSE", "AIML", "IT"];
const years = ["First year", "Second year", "Third year", "Final year"];
const emptyPlayer = {
  name: "",
  email: "",
  contact: "",
  registerNumber: "",
  department: "",
  year: "First year",
};

export default function AuthPortal({
  onClose,
  onAuthenticated,
  initialMode = "choice",
}) {
  const [mode, setMode] = useState(initialMode);
  const [player, setPlayer] = useState(emptyPlayer);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [resetSent, setResetSent] = useState("");
  const [resetComplete, setResetComplete] = useState(false);
  const [resetAttempted, setResetAttempted] = useState(false);
  const update = (field, value) =>
    setPlayer((current) => ({ ...current, [field]: value }));
  const changeMode = (next) => {
    setMode(next);
    setError("");
    setConfirmation("");
    setResetSent("");
    setResetAttempted(false);
    setPassword("");
    setConfirmPassword("");
  };
  const forgotPassword = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setResetAttempted(true);
    setError("");
    try {
      setResetSent(await requestPasswordReset(email));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const resetPassword = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await updatePlayerPassword({ password, confirmPassword });
      setResetComplete(true);
      window.history.replaceState({}, "", window.location.pathname);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const login = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (email.trim().toLowerCase() === "admin@saranathan.ac.in") {
        await signInAdmin({ email, password });
        window.location.hash = "admin";
        return;
      }
      if (email.trim().toLowerCase() === "arunadevipp@saranathan.ac.in") {
        await signInPaperReviewer({ email, password });
        window.location.hash = "paper-review";
        return;
      }
      const profile = await signInPlayer({ email, password });
      onAuthenticated(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const register = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await signUpPlayer({ player, password, confirmPassword });
      if (result.confirmationRequired) setConfirmation(result.email);
      else onAuthenticated(result.player);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="auth-close" onClick={onClose}>
        <X />
      </button>
      <div className="auth-visual">
        <div className="auth-brand">
          △○□ INNOV<span>8</span>'26
        </div>
        <div className="auth-copy">
          <small>SECURE PLAYER TERMINAL</small>
          <h2>
            ENTER THE
            <br />
            <span>GAME.</span>
          </h2>
          <p>
            Player identity is protected through the official Saranathan College
            access network.
          </p>
        </div>
        <div className="auth-scan">● IDENTITY SCAN ACTIVE</div>
      </div>
      <div className="auth-panel">
        {mode !== "choice" && (
          <button className="auth-back" onClick={() => changeMode("choice")}>
            <ArrowLeft /> BACK
          </button>
        )}
        {mode === "choice" && (
          <div className="auth-choice">
            <small>PLAYER ACCESS / SELECT PROTOCOL</small>
            <h1>
              IDENTIFY
              <br />
              YOURSELF.
            </h1>
            <p>
              New players must create an identity. Existing players can return
              using their credentials.
            </p>
            <div className="auth-options">
              <button onClick={() => changeMode("register")}>
                <UserPlus />
                <span>
                  <small>NEW PLAYER</small>
                  <strong>REGISTER</strong>
                </span>
                <ArrowRight />
              </button>
              <button onClick={() => changeMode("login")}>
                <LogIn />
                <span>
                  <small>RETURNING PLAYER</small>
                  <strong>LOGIN</strong>
                </span>
                <ArrowRight />
              </button>
            </div>
          </div>
        )}
        {mode === "login" && (
          <form className="auth-form login" onSubmit={login}>
            <small>RETURNING PLAYER / ACCESS LOGIN</small>
            <h1>
              WELCOME
              <br />
              <span>BACK.</span>
            </h1>
            <label>
              COLLEGE EMAIL
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="register@saranathan.ac.in"
                pattern="[-A-Za-z0-9._%+]+@saranathan[.]ac[.]in"
                required
              />
            </label>
            <label>
              PASSWORD
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>
            <button
              className="forgot-password-link"
              type="button"
              onClick={() => changeMode("forgot")}
            >
              FORGOT PASSWORD?
            </button>
            {error && (
              <div className="auth-error">
                <X />
                {error}
              </div>
            )}
            <button className="auth-submit" disabled={busy}>
              {busy ? "VERIFYING PLAYER..." : "LOGIN TO THE GAME"}{" "}
              <ArrowRight />
            </button>
          </form>
        )}
        {mode === "forgot" &&
          (resetSent ? (
            <div className="auth-confirmed">
              <Check />
              <small>RECOVERY LINK TRANSMITTED</small>
              <h1>
                CHECK YOUR
                <br />
                <span>EMAIL.</span>
              </h1>
              <p>
                A secure password-reset link was sent to{" "}
                <strong>{resetSent}</strong>. Open the link to create a new
                password.
              </p>
              <button onClick={() => changeMode("login")}>
                RETURN TO LOGIN <ArrowRight />
              </button>
            </div>
          ) : (
            <form className="auth-form login" onSubmit={forgotPassword}>
              <small>ACCOUNT RECOVERY / COLLEGE IDENTITY</small>
              <h1>
                RESET
                <br />
                <span>ACCESS.</span>
              </h1>
              <p className="auth-form-copy">
                Enter the college email connected to your player account.
              </p>
              <label>
                COLLEGE EMAIL
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="register@saranathan.ac.in"
                  pattern="[-A-Za-z0-9._%+]+@saranathan[.]ac[.]in"
                  required
                />
              </label>
              {error && (
                <div className="auth-error">
                  <X />
                  {error}
                </div>
              )}
              <button className="auth-submit" disabled={busy || resetAttempted}>
                {busy ? "SENDING RECOVERY LINK..." : "SEND RESET LINK"}{" "}
                <ArrowRight />
              </button>
              {resetAttempted && error && (
                <button
                  className="recovery-retry"
                  type="button"
                  onClick={() => {
                    setResetAttempted(false);
                    setError("");
                  }}
                >
                  ENABLE RETRY
                </button>
              )}
            </form>
          ))}
        {mode === "reset" &&
          (resetComplete ? (
            <div className="auth-confirmed">
              <Check />
              <small>PLAYER ACCESS RESTORED</small>
              <h1>
                PASSWORD
                <br />
                <span>UPDATED.</span>
              </h1>
              <p>
                Your new password is active. Return to login using your college
                email.
              </p>
              <button onClick={() => changeMode("login")}>
                GO TO LOGIN <ArrowRight />
              </button>
            </div>
          ) : (
            <form className="auth-form login" onSubmit={resetPassword}>
              <small>RECOVERY VERIFIED / NEW CREDENTIAL</small>
              <h1>
                NEW
                <br />
                <span>PASSWORD.</span>
              </h1>
              <label>
                PASSWORD
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength="8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </label>
              <label>
                CONFIRM PASSWORD
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength="8"
                  required
                />
              </label>
              {error && (
                <div className="auth-error">
                  <X />
                  {error}
                </div>
              )}
              <button className="auth-submit" disabled={busy}>
                {busy ? "UPDATING PASSWORD..." : "UPDATE PASSWORD"}{" "}
                <ArrowRight />
              </button>
            </form>
          ))}
        {mode === "register" &&
          (confirmation ? (
            <div className="auth-confirmed">
              <Check />
              <small>VERIFY YOUR COLLEGE EMAIL</small>
              <h1>
                ONE STEP
                <br />
                <span>REMAINS.</span>
              </h1>
              <p>
                We sent a confirmation link to <strong>{confirmation}</strong>.
                Open it, then return here and log in.
              </p>
              <button onClick={() => changeMode("login")}>
                GO TO LOGIN <ArrowRight />
              </button>
            </div>
          ) : (
            <form className="auth-form register" onSubmit={register}>
              <small>NEW PLAYER / CREATE IDENTITY</small>
              <h1>
                PLAYER
                <br />
                <span>REGISTRATION.</span>
              </h1>
              <div className="auth-grid">
                <label>
                  FULL NAME
                  <input
                    value={player.name}
                    onChange={(e) => update("name", e.target.value)}
                    minLength="2"
                    required
                  />
                </label>
                <label>
                  COLLEGE EMAIL
                  <input
                    type="email"
                    value={player.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="register@saranathan.ac.in"
                    pattern="[-A-Za-z0-9._%+]+@saranathan[.]ac[.]in"
                    required
                  />
                </label>
                <label>
                  REGISTER NUMBER
                  <input
                    value={player.registerNumber}
                    onChange={(e) => update("registerNumber", e.target.value)}
                    required
                  />
                </label>
                <label>
                  PHONE NUMBER
                  <input
                    type="tel"
                    value={player.contact}
                    onChange={(e) => update("contact", e.target.value)}
                    required
                  />
                </label>
                <label>
                  DEPARTMENT
                  <select
                    value={player.department}
                    onChange={(e) => update("department", e.target.value)}
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  YEAR
                  <select
                    value={player.year}
                    onChange={(e) => update("year", e.target.value)}
                  >
                    {years.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  PASSWORD
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength="8"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>
                <label>
                  CONFIRM PASSWORD
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength="8"
                    required
                  />
                </label>
              </div>
              {error && (
                <div className="auth-error">
                  <X />
                  {error}
                </div>
              )}
              <button className="auth-submit" disabled={busy}>
                {busy ? "CREATING PLAYER ID..." : "CREATE PLAYER ACCOUNT"}{" "}
                <ArrowRight />
              </button>
            </form>
          ))}
      </div>
    </div>
  );
}
