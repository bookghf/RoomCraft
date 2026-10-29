import { BRAND, LOGO_SHAPES, LOGO_TRANSFORM } from "./brand";

export default function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill={BRAND.green} />
      <g transform={LOGO_TRANSFORM}>
        {LOGO_SHAPES.map((s) => (
          <path key={s.d} d={s.d} fill={s.fill} />
        ))}
      </g>
    </svg>
  );
}
