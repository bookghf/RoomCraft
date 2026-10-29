"use client";

import { X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useT } from "@/features/designer/i18n";

/** Floating-control edge; pair with a background (or use `glass`). */
const floating = "shadow-lg ring-1 ring-stone-200 backdrop-blur";
export const glass = `bg-white/95 ${floating}`;

export function RoundButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  danger,
  showLabel,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-stone-900 text-white" : danger ? "bg-white text-red-600 hover:bg-red-50" : "bg-white text-stone-700 hover:bg-stone-100"
      } ${floating} ${className}`}
    >
      <Icon className="size-[18px]" />
      {showLabel && <span className="pr-0.5">{label}</span>}
    </button>
  );
}

export function CloseButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  const t = useT();
  return (
    <button type="button" onClick={onClick} aria-label={t("close")} title={t("close")} className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-800 ${className}`}>
      <X className="size-5" />
    </button>
  );
}

export function PanelHeader({ title, subtitle, onClose, children }: { title: ReactNode; subtitle?: ReactNode; onClose?: () => void; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2 pt-3">
      <div className="min-w-0 flex-1">
        {subtitle && <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{subtitle}</p>}
        <h2 className="truncate text-base font-semibold text-stone-900">{title}</h2>
      </div>
      {children}
      {onClose && <CloseButton onClick={onClose} />}
    </div>
  );
}

export function Swatches({ colors, value, onPick, size = "md" }: { colors: { id: string; hex: string; label: string }[]; value: string; onPick: (id: string) => void; size?: "sm" | "md" }) {
  const s = size === "sm" ? "size-6" : "size-8";
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.label}
          aria-label={c.label}
          aria-pressed={c.id === value}
          onClick={() => onPick(c.id)}
          className={`${s} rounded-full ring-offset-2 transition ${c.id === value ? "ring-2 ring-stone-900" : "ring-1 ring-stone-300 hover:ring-stone-500"}`}
          style={{ background: c.hex }}
        />
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2 text-sm text-stone-800">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-stone-900" : "bg-stone-300"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export function Modal({ title, children, onClose, footer }: { title: string; children?: ReactNode; onClose: () => void; footer: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input, button")?.focus();
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
        {children && <div className="mt-2 text-sm text-stone-600">{children}</div>}
        <div className="mt-5 flex justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}

export function Btn({ children, onClick, kind = "plain", type = "button", disabled }: { children: ReactNode; onClick?: () => void; kind?: "plain" | "primary" | "danger"; type?: "button" | "submit"; disabled?: boolean }) {
  const cls = {
    plain: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
    primary: "bg-stone-900 text-white hover:bg-stone-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[kind];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${cls}`}>
      {children}
    </button>
  );
}
