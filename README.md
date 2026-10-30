# RoomCraft — 3D room planner demo

A browser-based 3D room planner built with Next.js. Pick a room type, choose a styled showroom,
explore it in 3D and edit the furniture: add, move, rotate, duplicate, swap and delete items,
restyle walls and floor, and watch a priced shopping list update as you go. Designs can be saved
and shared by URL.

All rooms, products, names and prices are fictional. Furniture is built from three.js primitives
at runtime, so no third-party models, photos or brand assets are bundled (see `public/models/LICENSES.md`).

## Stack

- Next.js 16 (App Router) + TypeScript, Tailwind CSS v4
- three.js, @react-three/fiber, @react-three/drei
- zustand + zundo (undo/redo of the design only)
- zod (design validation), lz-string (share links), nanoid
- lucide-react icons, Vitest for logic tests

## Scripts

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run lint
```

## Configuration

The catalog, floor plans, showrooms and room types come from the RoomCraft API (`../roomcraft-api`).
Pages load them on the server and cache them for a few minutes, so the browser never calls the API.

| Variable | Default | Notes |
|---|---|---|
| `API_URL` | `http://localhost:8080` | Server-side only. Copy `.env.example` to `.env.local`; on Vercel, set it in the project settings |

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing page with room-type cards |
| `/rooms/[roomType]` | Showroom gallery (`bedroom`, `living-room`, `dining`, `home-office`, `kids`) |
| `/planner/[roomId]` | 3D planner. `?d=<designId>` loads a saved design, `?s=<encoded>` a shared one |
| `GET /api/products` | Catalog, filters `?category=&q=&maxPrice=` |
| `POST /api/designs` | Save a design (in-memory, demo only) → `{ id }` |
| `GET /api/designs/[id]` | Load a saved design, 404 if unknown |

Design load order in the planner: `?s=` → `?d=` → last design for that room in localStorage → room preset.

## Folder layout

```
src/
├─ app/                     routes, layout, API route handlers
├─ data/
│  ├─ products.ts           product catalog + filters
│  └─ rooms.ts              room types, room shells, preset designs
├─ features/planner/
│  ├─ Planner.tsx           planner layout (canvas + panels)
│  ├─ scene/                R3F scene: room shell, furniture, camera, dragging
│  ├─ ui/                   top bar, catalog, toolbar, style panel, shopping list
│  ├─ store/                zustand store with zundo history
│  └─ lib/                  placement (clamp, wall snap, OBB collision), pricing, serialize, styles
└─ types/planner.ts         shared data model
```

## Controls

| Action | Input |
|---|---|
| Orbit / zoom / pan | Left drag / wheel or pinch / right drag |
| Select item | Click it |
| Move item | Drag it (snaps to walls within 10 cm; red = overlapping, can't drop) |
| Rotate 90° | `R` |
| Duplicate | `D` |
| Delete | `Delete` / `Backspace` |
| Nudge | Arrow keys (1 cm, `Shift` = 10 cm) |
| Deselect | `Esc` |
| Undo / redo | `Ctrl/Cmd+Z` / `Shift+Ctrl/Cmd+Z` |

## Coordinate conventions

Metres, Y up, floor at y = 0. Walls run clockwise; each wall's interior surface lies on its
`start → end` line. Products face +Z locally; an item's `position` is its bottom-centre.
Wall items sit `depth / 2` off the wall surface. See the header of `src/features/planner/lib/placement.ts`.

## Adding content

- **Product**: add an entry to `products` in `src/data/products.ts`. Choose a `shape` (procedural model),
  real-world `dimensions` in metres, a `mount` (`floor`, `wall`, `ceiling`) and at least one colour
  (the first is the default). Wall items need a `mountHeight`.
- **Room**: add a `rectRoom({...})` entry to `rooms` in `src/data/rooms.ts` with size, wall colour,
  floor material and door/window openings per wall (`offset` is measured from the wall's start),
  then add a matching preset to `presetDesigns` with `id === room.presetDesignId`.
- Run `npm test`: `src/data/presets.test.ts` checks every preset references real products,
  stays inside its room, keeps wall items on walls clear of openings, and has no overlapping furniture.
