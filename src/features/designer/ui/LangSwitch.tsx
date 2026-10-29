"use client";

import { Languages } from "lucide-react";
import { langLabels, useLangStore, useT } from "@/features/designer/i18n";
import type { Lang } from "@/features/designer/types";

export default function LangSwitch() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  return (
    <label className="relative inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white py-1.5 pl-2.5 pr-2 text-sm text-stone-700 hover:bg-stone-50">
      <Languages className="size-4 text-stone-500" aria-hidden />
      <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label={t("language")} className="cursor-pointer appearance-none bg-transparent pr-1 outline-none">
        {(Object.keys(langLabels) as Lang[]).map((l) => (
          <option key={l} value={l}>
            {langLabels[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
