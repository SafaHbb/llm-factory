type P = { className?: string };
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const PlayIcon = ({ className }: P) => (
  <svg {...base} className={className} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
);
export const PauseIcon = ({ className }: P) => (
  <svg {...base} className={className} fill="currentColor" stroke="none"><rect x="6.5" y="5" width="4" height="14" rx="1.2" /><rect x="13.5" y="5" width="4" height="14" rx="1.2" /></svg>
);
export const PrevIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M15 6l-6 6 6 6" /></svg>
);
export const NextIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M9 6l6 6-6 6" /></svg>
);
export const ReplayIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
);
