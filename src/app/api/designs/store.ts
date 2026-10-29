import type { Design } from "@/types/planner";

/**
 * In-memory design store for the demo API. Lives in the server process only:
 * it is lost on restart and not shared between serverless instances.
 * Swap for a real database before relying on it.
 */
export const designs = new Map<string, Design>();
