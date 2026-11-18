// Date helpers safe for both server and client. Dates are YYYY-MM-DD strings.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "Today", "Yesterday", "Mon, 16 Nov", or "Mon, 16 Nov 2025" for other years
export function dayLabel(date: string, today: string): string {
  if (date === today) return "Today";
  if (date === shiftDate(today, -1)) return "Yesterday";
  const d = new Date(`${date}T00:00:00Z`);
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  });
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
