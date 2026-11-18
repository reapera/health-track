"use client";

import { useState } from "react";

// The passcode typed on this device, remembered after the server first accepts it.
const KEY = "health-track-passcode";

export function savedPasscode(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberPasscode(value: string): void {
  try {
    localStorage.setItem(KEY, value);
  } catch {}
}

// Passcode state for a client component: `needed` is true when the field should be shown.
export function usePasscode() {
  const [passcode, setPasscode] = useState(savedPasscode);
  const [needed, setNeeded] = useState(() => !savedPasscode());
  return {
    passcode,
    setPasscode,
    needed,
    // Call with the result of a server action to remember or re-ask
    settle(res: { ok: boolean; auth?: boolean }) {
      if (res.ok) {
        rememberPasscode(passcode);
        setNeeded(false);
      } else if (res.auth) {
        setNeeded(true);
      }
    },
    require() {
      setNeeded(true);
    },
  };
}
