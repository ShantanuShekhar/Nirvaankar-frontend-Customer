/** Lightweight CSS-only botanical motes near the brand mark. Honors reduced motion. */
export function BotanicalParticles({ className }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute -left-6 -top-8 h-28 w-36 overflow-visible ${className ?? ''}`}
      aria-hidden
    >
      <svg
        className="nv-particle absolute left-0 top-2 h-5 w-5 text-[var(--color-leaf-600)] opacity-80"
        viewBox="0 0 12 12"
        style={{ animation: 'nv-drift 7s ease-in-out infinite' }}
      >
        <ellipse cx="6" cy="6" rx="3.2" ry="5" fill="currentColor" transform="rotate(-28 6 6)" />
      </svg>
      <svg
        className="nv-particle absolute left-10 top-0 h-4 w-4 text-[var(--color-clay-600)] opacity-75"
        viewBox="0 0 12 12"
        style={{ animation: 'nv-drift-slow 9s ease-in-out infinite' }}
      >
        <circle cx="6" cy="6" r="2.4" fill="currentColor" />
      </svg>
      <svg
        className="nv-particle absolute left-4 top-10 h-3.5 w-3.5 text-[var(--color-forest-800)] opacity-70"
        viewBox="0 0 12 12"
        style={{ animation: 'nv-drift 11s ease-in-out infinite 1.2s' }}
      >
        <ellipse cx="6" cy="6" rx="2.4" ry="4" fill="currentColor" transform="rotate(40 6 6)" />
      </svg>
      <svg
        className="nv-particle absolute left-16 top-6 h-3 w-3 text-[var(--color-leaf-600)] opacity-55"
        viewBox="0 0 12 12"
        style={{ animation: 'nv-drift-slow 12s ease-in-out infinite 0.6s' }}
      >
        <ellipse cx="6" cy="6" rx="2.2" ry="3.6" fill="currentColor" transform="rotate(-12 6 6)" />
      </svg>
      <svg
        className="nv-particle absolute left-8 top-14 h-2.5 w-2.5 text-[var(--color-clay-600)] opacity-50"
        viewBox="0 0 12 12"
        style={{ animation: 'nv-drift 10s ease-in-out infinite 1.8s' }}
      >
        <circle cx="6" cy="6" r="2" fill="currentColor" />
      </svg>
      <svg
        className="nv-particle absolute left-20 top-12 h-2 w-2 text-[var(--color-forest-800)] opacity-45"
        viewBox="0 0 12 12"
        style={{ animation: 'nv-drift-slow 14s ease-in-out infinite 2.2s' }}
      >
        <ellipse cx="6" cy="6" rx="2" ry="3.2" fill="currentColor" transform="rotate(25 6 6)" />
      </svg>
    </span>
  )
}
