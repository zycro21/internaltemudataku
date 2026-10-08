"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "erd-theme";

// Sumber kebenaran tema = atribut data-theme di <html>.
// useSyncExternalStore membuat tombol ini selalu sinkron dengannya
// tanpa perlu setState di dalam useEffect.
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function choose(next: Theme) {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage bisa diblokir (mode private) -- tema tetap berubah,
      // hanya tidak tersimpan untuk kunjungan berikutnya.
    }
  }

  const base =
    "flex h-6 w-7 items-center justify-center rounded text-[13px] leading-none transition-colors";
  const active = "bg-erd-bg text-erd-accent shadow-sm";
  const idle = "text-erd-faint hover:text-erd-text";

  return (
    <div
      role="group"
      aria-label="Pilih tema"
      className="flex flex-shrink-0 items-center gap-0.5 rounded-md border border-erd-border bg-erd-panel p-0.5"
    >
      <button
        type="button"
        onClick={() => choose("light")}
        aria-pressed={theme === "light"}
        title="Tema terang"
        className={`${base} ${theme === "light" ? active : idle}`}
      >
        ☀
      </button>
      <button
        type="button"
        onClick={() => choose("dark")}
        aria-pressed={theme === "dark"}
        title="Tema gelap"
        className={`${base} ${theme === "dark" ? active : idle}`}
      >
        ☾
      </button>
    </div>
  );
}
