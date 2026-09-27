export { cn } from "cn"

const CURSOR_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#ef4444"]

// Same user always gets the same cursor color, across tabs, sessions, the doc and the canvas.
export function colorForUser(userId: string) {
  let hash = 0
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

const TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
]

// "5 minutes ago", "yesterday", "just now".
export function timeAgo(date: Date) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  for (const [unit, size] of TIME_UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return "just now"
}
