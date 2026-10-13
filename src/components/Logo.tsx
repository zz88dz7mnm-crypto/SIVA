/** El logo de SIVA: cuatro tarjetas, una por área de la vida. */
export function Logo({ className = "size-10" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-[28%] bg-acento text-sobre-acento ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-[58%]" fill="currentColor">
        <rect x="3" y="3" width="8" height="10" rx="2.2" />
        <rect x="13" y="3" width="8" height="6" rx="2.2" />
        <rect x="13" y="11" width="8" height="10" rx="2.2" />
        <rect x="3" y="15" width="8" height="6" rx="2.2" />
      </svg>
    </span>
  );
}
