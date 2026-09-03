"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useLocalStorage(key: string, fallback = ""): string {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (typeof window === "undefined") return fallback;
      return localStorage.getItem(key) ?? fallback;
    },
    () => fallback
  );
}
