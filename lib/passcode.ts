import { createHash, timingSafeEqual } from "node:crypto";

// The app has no login, so anything that writes to Notion or spends LLM quota
// is gated by a shared passcode. Returns an error message, or null when OK.
export function passcodeError(given: string): string | null {
  const expected = process.env.LOG_PASSCODE;
  if (!expected) return "LOG_PASSCODE is not set on the server. Add it in Vercel and redeploy.";
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b) ? null : "Wrong passcode.";
}
