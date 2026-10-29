"use client";

import { Check } from "lucide-react";
import { create } from "zustand";

interface ToastItem {
  id: number;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push(message: string): void;
  dismiss(id: number): void;
}

let nextId = 1;

const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push(message) {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, message }] });
    setTimeout(() => get().dismiss(id), 2600);
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export function toast(message: string) {
  useToastStore.getState().push(message);
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-lg"
          role="status"
        >
          <Check className="size-4 text-emerald-300" aria-hidden />
          {t.message}
        </div>
      ))}
    </div>
  );
}
