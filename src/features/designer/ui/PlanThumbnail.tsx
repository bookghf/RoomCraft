import { colorOf, getCatalogItem } from "@/features/designer/data/catalog";
import { WALL_T, wallGeom } from "@/features/designer/lib/geometry";
import { planFor } from "@/features/designer/store";
import type { DesignDoc, ZoneKind } from "@/features/designer/types";

const zoneFill: Record<ZoneKind, string> = { room: "#efe7da", kitchen: "#ece6dc", bath: "#dfe6ea", balcony: "#e2e0dc" };

/** Top-down drawing of a plan and its furniture. */
export default function PlanThumbnail({ doc, className = "" }: { doc: Pick<DesignDoc, "planId" | "size" | "items">; className?: string }) {
  const plan = planFor(doc);
  if (!plan) return null;
  const pad = 0.4;
  const { minX, maxX, minZ, maxZ } = plan.bounds;
  const vb = `${minX - pad} ${minZ - pad} ${maxX - minX + pad * 2} ${maxZ - minZ + pad * 2}`;
  return (
    <svg viewBox={vb} className={className} aria-hidden preserveAspectRatio="xMidYMid meet">
      {plan.zones.map((z) => (
        <polygon key={z.id} points={z.polygon.map((p) => p.join(",")).join(" ")} fill={zoneFill[z.kind]} />
      ))}
      {plan.fixtures.map((f) => (
        <rect key={f.id} x={-f.w / 2} y={-f.d / 2} width={f.w} height={f.d} fill="#c9c4bc" transform={`translate(${f.x} ${f.z}) rotate(${(-f.rot * 180) / Math.PI})`} />
      ))}
      {doc.items
        .filter((it) => getCatalogItem(it.itemId)?.mount !== "ceiling")
        .sort((a, b) => a.y - b.y)
        .map((it) => {
          const cat = getCatalogItem(it.itemId);
          const w = cat?.size.w ?? 0.4;
          const d = cat?.size.d ?? 0.4;
          return (
            <rect
              key={it.uid}
              x={-w / 2}
              y={-d / 2}
              width={w}
              height={d}
              rx={0.03}
              fill={colorOf(cat, it.colorId)}
              stroke="#57534e"
              strokeWidth={0.02}
              opacity={cat?.flat ? 0.6 : 1}
              transform={`translate(${it.x} ${it.z}) rotate(${(-it.rot * 180) / Math.PI})`}
            />
          );
        })}
      {plan.walls.map((w) => {
        const g = wallGeom(w);
        const railing = w.kind === "railing";
        const pieces: [number, number][] = [];
        let cursor = 0;
        for (const o of [...w.openings].sort((a, b) => a.offset - b.offset)) {
          if (o.offset > cursor) pieces.push([cursor, o.offset]);
          cursor = o.offset + o.width;
        }
        if (cursor < g.length) pieces.push([cursor, g.length]);
        return (
          <g key={w.id}>
            {pieces.map(([u0, u1], i) => (
              <line
                key={i}
                x1={w.a[0] + g.dir[0] * u0}
                y1={w.a[1] + g.dir[1] * u0}
                x2={w.a[0] + g.dir[0] * u1}
                y2={w.a[1] + g.dir[1] * u1}
                stroke={railing ? "#8a8f96" : "#44403c"}
                strokeWidth={railing ? WALL_T / 2 : WALL_T}
                strokeLinecap="square"
              />
            ))}
            {w.openings
              .filter((o) => o.type !== "door")
              .map((o, i) => (
                <line key={`o${i}`} x1={w.a[0] + g.dir[0] * o.offset} y1={w.a[1] + g.dir[1] * o.offset} x2={w.a[0] + g.dir[0] * (o.offset + o.width)} y2={w.a[1] + g.dir[1] * (o.offset + o.width)} stroke="#7fb2d6" strokeWidth={WALL_T / 3} />
              ))}
          </g>
        );
      })}
    </svg>
  );
}
