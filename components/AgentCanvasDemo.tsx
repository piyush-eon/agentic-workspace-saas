"use client";

import { useEffect, useState } from "react";

// Scripted keyframes: each step is one "tool call" the agent would make on a real canvas.
// Cursor waypoints sit just below-right of each shape's bottom edge, never on top of its label —
// and the cursor must arrive before its shape appears (see PLAN.md agent-cursor notes).
const STEPS = [
  { label: "thinking...", cursor: { x: 14, y: 8 }, shape: null },
  { label: "drawing rectangle...", cursor: { x: 34, y: 27 }, shape: "box-1" },
  { label: "drawing rectangle...", cursor: { x: 86, y: 27 }, shape: "box-2" },
  { label: "connecting shapes...", cursor: { x: 60, y: 19 }, shape: "arrow-1" },
  { label: "adding label...", cursor: { x: 48, y: 57 }, shape: "box-3" },
  { label: "connecting shapes...", cursor: { x: 55, y: 33 }, shape: "arrow-2" },
] as const;

const STEP_DURATION_MS = 1400;
const CURSOR_TRAVEL_MS = 500; // must stay under STEP_DURATION_MS so the shape lands before the next step fires

export function AgentCanvasDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  // Shape reveal lags one beat behind the cursor so it always arrives after the cursor, not alongside it.
  const [revealedCount, setRevealedCount] = useState(1);

  // Loop through the scripted steps so the demo replays for anyone watching the hero.
  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, STEP_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  // Cursor moves the instant stepIndex changes; the shape only fades in once it's had time to get there.
  useEffect(() => {
    const id = setTimeout(() => setRevealedCount(stepIndex + 1), CURSOR_TRAVEL_MS);
    return () => clearTimeout(id);
  }, [stepIndex]);

  const visibleShapes = new Set(
    STEPS.slice(0, stepIndex === 0 ? 1 : revealedCount)
      .map((s) => s.shape)
      .filter(Boolean),
  );
  const current = STEPS[stepIndex];

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-card/60 shadow-2xl shadow-black/40 backdrop-blur">
      {/* faux app chrome so this reads as "inside the product" rather than a floating illustration */}
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/3 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-3 text-xs text-muted-foreground">outpost.app/workspace/demo/canvas</span>
      </div>

      <svg viewBox="0 0 100 62.5" className="absolute inset-0 top-9 h-[calc(100%-2.25rem)] w-full">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="oklch(0.74 0.16 55)" />
          </marker>
        </defs>

        <Shape visible={visibleShapes.has("box-1")}>
          <rect x="12" y="10" width="24" height="14" rx="1.5" className="fill-white/6 stroke-white/25" strokeWidth="0.4" />
          <text x="24" y="18.5" textAnchor="middle" className="fill-foreground text-[3.2px]">Research</text>
        </Shape>

        <Shape visible={visibleShapes.has("box-2")}>
          <rect x="64" y="10" width="24" height="14" rx="1.5" className="fill-white/6 stroke-white/25" strokeWidth="0.4" />
          <text x="76" y="18.5" textAnchor="middle" className="fill-foreground text-[3.2px]">Draft copy</text>
        </Shape>

        <Shape visible={visibleShapes.has("box-3")}>
          <rect x="26" y="40" width="24" height="14" rx="1.5" className="fill-white/6 stroke-white/25" strokeWidth="0.4" />
          <text x="38" y="48.5" textAnchor="middle" className="fill-foreground text-[3.2px]">Publish</text>
        </Shape>

        <Shape visible={visibleShapes.has("arrow-1")}>
          <line x1="36" y1="17" x2="63" y2="17" stroke="oklch(0.74 0.16 55)" strokeWidth="0.5" markerEnd="url(#arrowhead)" />
        </Shape>

        <Shape visible={visibleShapes.has("arrow-2")}>
          <path
            d="M 70 24 Q 55 34 50 40"
            fill="none"
            stroke="oklch(0.74 0.16 55)"
            strokeWidth="0.5"
            markerEnd="url(#arrowhead)"
          />
        </Shape>
      </svg>

      {/* the agent's presence cursor — position interpolates via CSS transition, same trick a real multiplayer cursor uses */}
      <div
        className="absolute z-10 ease-out"
        style={{
          left: `${current.cursor.x}%`,
          top: `calc(2.25rem + ${current.cursor.y}%)`,
          transition: `left ${CURSOR_TRAVEL_MS}ms, top ${CURSOR_TRAVEL_MS}ms`,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
          <path d="M1 1 L1 13 L4.5 10.5 L7 15 L9 14 L6.5 9 L11 9 Z" fill="oklch(0.74 0.16 55)" />
        </svg>
        {/* flip the pill to the left once the cursor is past the midpoint, so it never clips the right edge */}
        <span
          className={`mt-1 block w-max max-w-48 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground shadow-lg ${
            current.cursor.x > 55 ? "-translate-x-full" : ""
          }`}
        >
          Agent · {current.label}
        </span>
      </div>
    </div>
  );
}

function Shape({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <g className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
      {children}
    </g>
  );
}
