export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup" aria-label="armature">
      <svg
        className="brand-mark"
        viewBox="0 0 32 32"
        role="img"
        aria-label="Exploded A mark"
      >
        <circle cx="16" cy="5.5" r="2.8" />
        <circle className="mark-cutout" cx="16" cy="5.5" r="1" />
        <line x1="14.5" y1="12.5" x2="9.8" y2="27" />
        <line x1="17.5" y1="12.5" x2="22.2" y2="27" />
        <line x1="12.4" y1="20.5" x2="19.6" y2="20.5" />
      </svg>
      {!compact && <span>armature</span>}
    </span>
  );
}
