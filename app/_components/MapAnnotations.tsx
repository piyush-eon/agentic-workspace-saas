// Corner labels in the style of a printed survey map, layered over a `topo-bg` section.
// Purely decorative, so hidden from screen readers and on small screens.
export function MapAnnotations() {
  const label = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-6 hidden md:block">
      <span className={`absolute top-0 left-0 ${label}`}>N 47°36′ · W 122°19′</span>

      <span className={`absolute top-0 right-0 flex items-center gap-2 ${label}`}>
        <span className="size-1.5 rotate-45 border border-primary/70" />
        EL. 2,418 M
      </span>

      <span className={`absolute bottom-0 left-0 flex items-center gap-2 ${label}`}>
        <span className="relative flex size-3 items-center justify-center rounded-full border border-primary/70">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/40 motion-reduce:hidden" />
          <span className="size-1 rounded-full bg-primary" />
        </span>
        You are here
      </span>

      <span className={`absolute right-0 bottom-0 flex items-center gap-2 ${label}`}>
        0
        <span className="flex h-1.5 w-16 border-x border-b border-muted-foreground/50">
          <span className="w-1/2 border-r border-muted-foreground/50" />
        </span>
        500 M
      </span>
    </div>
  );
}
