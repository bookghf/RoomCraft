import { PerspectiveCamera, Vector3 } from "three";
import { polygonBounds } from "@/features/designer/lib/geometry";
import { useDesigner } from "@/features/designer/store";
import { fitDistance } from "./CameraRig";
import { OVERLAY_LAYER, sceneRef } from "./sceneRef";

const LABEL_STYLES: Record<string, { bg: string; fg: string }> = {
  dark: { bg: "rgba(28,25,23,0.85)", fg: "#ffffff" },
  blue: { bg: "#0284c7", fg: "#ffffff" },
  light: { bg: "rgba(255,255,255,0.92)", fg: "#44403c" },
  number: { bg: "#fbbf24", fg: "#1c1917" },
};

function topCamera(aspect: number): PerspectiveCamera {
  const s = useDesigner.getState();
  const zn = s.plan?.zones.find((z) => z.id === s.focusZone);
  const b = zn ? polygonBounds(zn.polygon) : s.plan!.bounds;
  const cam = new PerspectiveCamera(45, aspect, 0.05, 300);
  const target = new Vector3((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2);
  cam.position.copy(target).add(new Vector3(0, fitDistance(cam, Math.hypot(b.maxX - b.minX, b.maxZ - b.minZ) / 2), 0.0001));
  cam.lookAt(target);
  cam.updateMatrixWorld();
  return cam;
}

/**
 * Render the view to an image. A clean picture leaves out size lines, guides, outlines and labels;
 * otherwise the on-screen labels are drawn in and a caption strip is added.
 */
export async function capturePicture(opts: { view: "current" | "top"; clean: boolean; title: string; subtitle: string }): Promise<Blob | null> {
  const { gl, scene, camera } = sceneRef;
  if (!gl || !scene || !camera) return null;
  const canvas = gl.domElement;
  const cam = opts.view === "top" ? topCamera(canvas.width / canvas.height) : camera;
  const mask = cam.layers.mask;
  if (opts.clean) cam.layers.disable(OVERLAY_LAYER);
  else cam.layers.enable(OVERLAY_LAYER);
  gl.render(scene, cam);
  // Read pixels right after rendering, before the drawing buffer is cleared.
  const shot = canvas.toDataURL("image/png");
  cam.layers.mask = mask;

  const img = new Image();
  img.src = shot;
  await img.decode();
  if (opts.clean) return toBlob(drawOnly(img));

  const dpr = canvas.width / canvas.getBoundingClientRect().width;
  const footer = Math.round(64 * dpr);
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height + footer;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  if (opts.view === "current") {
    const rect = canvas.getBoundingClientRect();
    ctx.font = `600 ${Math.round(10 * dpr)}px system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    document.querySelectorAll<HTMLElement>("[data-dsg-label]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right < rect.left || r.left > rect.right || r.bottom < rect.top || r.top > rect.bottom) return;
      const st = LABEL_STYLES[el.dataset.dsgLabel ?? "dark"] ?? LABEL_STYLES.dark;
      const x = (r.left - rect.left) * dpr;
      const y = (r.top - rect.top) * dpr;
      ctx.fillStyle = st.bg;
      ctx.beginPath();
      ctx.roundRect(x, y, r.width * dpr, r.height * dpr, 4 * dpr);
      ctx.fill();
      ctx.fillStyle = st.fg;
      ctx.fillText(el.textContent ?? "", x + (r.width * dpr) / 2, y + (r.height * dpr) / 2 + dpr * 0.5);
    });
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, canvas.height, out.width, footer);
  ctx.fillStyle = "#e7e5e4";
  ctx.fillRect(0, canvas.height, out.width, Math.max(1, dpr));
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#1c1917";
  ctx.font = `600 ${Math.round(16 * dpr)}px system-ui, sans-serif`;
  ctx.fillText(opts.title, 16 * dpr, canvas.height + 28 * dpr);
  ctx.fillStyle = "#78716c";
  ctx.font = `${Math.round(12 * dpr)}px system-ui, sans-serif`;
  ctx.fillText(opts.subtitle, 16 * dpr, canvas.height + 48 * dpr);
  ctx.textAlign = "right";
  ctx.fillStyle = "#2f5d50";
  ctx.font = `600 ${Math.round(13 * dpr)}px system-ui, sans-serif`;
  ctx.fillText("RoomCraft", out.width - 16 * dpr, canvas.height + 38 * dpr);
  return toBlob(out);
}

function drawOnly(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return c;
}

function toBlob(c: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
}

/** Share through the system share sheet where files can be shared (phones), else download. */
export async function sharePicture(blob: Blob, filename: string, title: string): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], filename, { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}
