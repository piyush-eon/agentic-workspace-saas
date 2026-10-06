export { cn } from "cn"

// Enter sends, Shift + Enter adds a new line.
export function submitOnEnter(submit: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || e.shiftKey) return
    e.preventDefault()
    submit()
  }
}

const CURSOR_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#ef4444"]

// Same user always gets the same cursor color, across tabs, sessions, the doc and the canvas.
export function colorForUser(userId: string) {
  let hash = 0
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}
