// Static mock UIs for the landing page's "three surfaces" section — not interactive,
// just enough visual detail to read as a real product screen rather than an empty box.

export function CanvasMock() {
  return (
    <Frame>
      <svg viewBox="0 0 100 62.5" className="h-full w-full">
        <defs>
          <marker id="mockArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="oklch(0.74 0.16 55)" />
          </marker>
        </defs>
        <rect x="10" y="14" width="26" height="15" rx="1.5" className="fill-white/6 stroke-white/25" strokeWidth="0.4" />
        <text x="23" y="23" textAnchor="middle" className="fill-foreground text-[3px]">User signs up</text>
        <rect x="62" y="14" width="26" height="15" rx="1.5" className="fill-white/6 stroke-white/25" strokeWidth="0.4" />
        <text x="75" y="21" textAnchor="middle" className="fill-foreground text-[3px]">
          <tspan x="75">Send welcome</tspan>
          <tspan x="75" dy="3.8">email</tspan>
        </text>
        <line x1="36" y1="21.5" x2="61" y2="21.5" stroke="oklch(0.74 0.16 55)" strokeWidth="0.5" markerEnd="url(#mockArrow)" />
        <rect x="36" y="38" width="26" height="15" rx="1.5" className="fill-white/6 stroke-white/25" strokeWidth="0.4" />
        <text x="49" y="45" textAnchor="middle" className="fill-foreground text-[3px]">
          <tspan x="49">Onboarding</tspan>
          <tspan x="49" dy="3.8">checklist</tspan>
        </text>
        <path d="M75 29 Q 75 38 62 44" fill="none" stroke="oklch(0.74 0.16 55)" strokeWidth="0.5" markerEnd="url(#mockArrow)" />
      </svg>
    </Frame>
  );
}

export function DocsMock() {
  return (
    <Frame>
      <div className="flex h-full flex-col gap-2.5 p-5">
        <div className="h-3 w-2/5 rounded bg-white/20" />
        <div className="h-2 w-full rounded bg-white/8" />
        <div className="h-2 w-11/12 rounded bg-white/8" />
        <div className="h-2 w-4/5 rounded bg-white/8" />
        <div className="mt-2 h-2.5 w-1/3 rounded bg-white/15" />
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary" />
          <div className="h-2 w-3/4 rounded bg-white/8" />
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary" />
          <div className="h-2 w-2/3 rounded bg-white/8" />
        </div>
      </div>
    </Frame>
  );
}

// Mirrors the real dashboard board: four status columns of workspace cards, with teammate
// avatars on the cards someone is working in right now.
export function BoardMock() {
  const columns = [
    { title: "Planning", cards: [{ live: null }, { live: null }] },
    { title: "In progress", cards: [{ live: "bg-sky-400" }, { live: null }] },
    { title: "In review", cards: [{ live: "bg-violet-400" }] },
    { title: "Done", cards: [{ live: null }, { live: null }, { live: null }] },
  ];
  return (
    <Frame>
      <div className="grid h-full grid-cols-4 gap-2 p-4">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-2 rounded-lg bg-white/3 p-2">
            <span className="text-[9px] font-medium whitespace-nowrap text-muted-foreground">{col.title}</span>
            {col.cards.map((card, i) => (
              <div key={i} className="flex h-12 flex-col gap-1.5 rounded-md border border-white/10 bg-white/6 p-2">
                <div className="h-1.5 w-3/4 rounded bg-white/20" />
                <div className="h-1 w-full rounded bg-white/8" />
                {card.live && <span className={`mt-auto size-2 self-end rounded-full ${card.live}`} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="aspect-4/3 overflow-hidden rounded-2xl border border-white/10 bg-card/40 shadow-xl shadow-black/30">
      {children}
    </div>
  );
}
