import { useEffect } from "react";

export default function CodemerceIntro({ onComplete }) {
  useEffect(() => {
    const handleMessage = (event) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === "codemerceIntroFinished"
      ) {
        onComplete();
      }
    };

    window.addEventListener("message", handleMessage);
    const fallback = window.setTimeout(onComplete, 11000);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.clearTimeout(fallback);
    };
  }, [onComplete]);

  return (
    <div className="codemerce-intro-stage" aria-label="Codemerce introduction">
      <iframe
        src="/codemerce-intro/intro.html"
        title="Codemerce introduction"
        allow="autoplay"
      />
    </div>
  );
}
