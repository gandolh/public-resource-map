/**
 * The mark is a pin cut out of a filled square — the two things the product is,
 * a map and a public register, in one shape. Authored rather than borrowed so
 * it matches the icon set's stroke and grid.
 */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--accent)" />
      <path
        d="M12 18.2s4.6-3.7 4.6-7.1a4.6 4.6 0 1 0-9.2 0c0 3.4 4.6 7.1 4.6 7.1z"
        fill="none"
        stroke="var(--fg-on-accent)"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.7" r="1.7" fill="var(--fg-on-accent)" />
    </svg>
  );
}
