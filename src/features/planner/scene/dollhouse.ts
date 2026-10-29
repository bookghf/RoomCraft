import type { Camera } from "three";
import { roomBounds, roomCenter } from "@/features/planner/lib/placement";
import type { Room } from "@/types/planner";

/**
 * Dollhouse rule: with the camera outside the room, a wall whose interior normal
 * points along the camera→room-centre direction sits between camera and room and is hidden.
 */
export function isWallHidden(room: Room, normal: [number, number], camera: Camera): boolean {
  const b = roomBounds(room);
  const c = roomCenter(room);
  const { x, z } = camera.position;
  if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return false;
  const dx = c[0] - x;
  const dz = c[2] - z;
  const len = Math.hypot(dx, dz) || 1;
  return (normal[0] * dx + normal[1] * dz) / len > 0.3;
}
