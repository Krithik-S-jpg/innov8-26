import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({
  value,
  label = "COPY",
  copiedLabel = "COPIED",
  iconSize = 14,
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className={copied ? "copy-feedback is-copied" : "copy-feedback"}
      onClick={copy}
      aria-live="polite"
    >
      {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      {copied ? copiedLabel : label}
    </button>
  );
}
