import { useId } from "react";

/**
 * Small decorative sparkline (matches the reference dashboard cards).
 * Purely ornamental — it conveys "trend" styling, not real per-card data.
 */
export function Sparkline({
  color = "currentColor",
  className,
}: {
  color?: string;
  className?: string;
}) {
  // useId, not Math.random(): the gradient needs a unique id, and a random
  // one differs between the server and client renders — which is a hydration
  // mismatch, not just a lint complaint.
  const id = `spark-${useId().replace(/:/g, "")}`;
  // A gentle fixed wave, normalised to a 100x32 viewbox.
  const path = "M0,24 C10,24 14,10 22,12 C30,14 34,26 44,22 C54,18 58,6 68,9 C78,12 82,22 92,16 L100,14";
  return (
    <svg
      viewBox="0 0 100 32"
      className={className}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${path} L100,32 L0,32 Z`} fill={`url(#${id})`} />
      <path d={path} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
