export function ShuttleIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* cork */}
      <path d="M24 42c3.4 0 6-2.6 6-6 0-2.3-1.2-4.2-3-5.2h-6c-1.8 1-3 2.9-3 5.2 0 3.4 2.6 6 6 6Z" />
      {/* skirt */}
      <path d="M21 30.8 12 8m15 22.8L36 8M24 30.8V6" />
      <path d="M12 8 24 3l12 5" />
      <path d="M15.6 17.2h16.8M18.1 24h11.8" />
    </svg>
  );
}
