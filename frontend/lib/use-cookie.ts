"use client";

import { useState, useEffect } from "react";

export function useCookie(name: string, fallback = ""): string {
  const [value, setValue] = useState<string>(fallback);

  useEffect(() => {
    let ignore = false;
    const checkCookie = () => {
      if (ignore) return;
      if (typeof document === "undefined") return;
      const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
      const current = match ? decodeURIComponent(match[2]) : fallback;
      setValue((prev) => (current !== prev ? current : prev));
    };

    checkCookie();
    const interval = setInterval(checkCookie, 1000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [name, fallback]);

  return value;
}
