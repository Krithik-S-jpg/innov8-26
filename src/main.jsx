import { createRoot } from "react-dom/client";
import "./index.css";
import "./blood-register.css";
import "./about-section.css";
import "./challenge-detail.css";
import "./auth.css";
import "./admin.css";
import "./paper-review.css";
import "./responsive.css";
import App from "./App.jsx";

if (!globalThis.global) {
  globalThis.global = globalThis;
}

createRoot(document.getElementById("root")).render(<App />);
