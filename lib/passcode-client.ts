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
