import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import AdminPage from "./pages/AdminPage";
import PaperReviewPage from "./pages/PaperReviewPage";

function App() {
  const [route, setRoute] = useState(() => window.location.hash);

  useEffect(() => {
    const updateRoute = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  if (route === "#admin") return <AdminPage />;
  if (route === "#paper-review") return <PaperReviewPage />;
  return <LandingPage />;
}

export default App;
