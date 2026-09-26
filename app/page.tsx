import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LayoutGrid, FileText, KanbanSquare, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentCanvasDemo } from "@/components/AgentCanvasDemo";
import { CanvasMock, DocsMock, BoardMock } from "@/components/SurfaceVisuals";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero — the glow + grain give the flat dark bg some depth without a busy illustration */}
      <section className="relative overflow-hidden px-6 pt-10 pb-24 md:px-10 md:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-140 w-225 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(closest-side, oklch(0.74 0.16 55 / 0.55), transparent)" }}
        />

        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <Badge variant="outline" className="gap-1.5 border-white/15 bg-white/3 px-3 py-1 text-xs font-normal text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Now in early access
          </Badge>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            An{" "}
            <span className="bg-linear-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
              outpost
            </span>{" "}
            for whatever you&apos;re building
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Chat with an AI agent that draws on your canvas and writes your docs, while
            your whole team works alongside it in real time.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2 text-base">
              <Link href="/sign-up">
                Start building free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>

        {/* Product demo — this is the whole pitch: the agent visibly acting, not a chat log */}
        <div className="mx-auto mt-16 max-w-4xl">
          <AgentCanvasDemo />
        </div>
      </section>

      {/* Social proof — short and factual since there's no real customer logos yet at early access */}
      <section className="border-t border-white/10 px-6 py-10 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-muted-foreground">
            Built for teams who sketch first and write specs second
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted-foreground/70">
            <span>Product teams</span>
            <span>Founders</span>
            <span>Solo builders</span>
            <span>Design agencies</span>
            <span>Consultants</span>
          </div>
        </div>
      </section>

      {/* Canvas + docs + team — the proof that this is a "workspace," not just a canvas app.
          Each row alternates image side so the section doesn't read as a flat repeating grid. */}
      <section id="product" className="border-t border-white/10 px-6 py-24 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              One agent, one workspace, your whole team
            </h2>
            <p className="mt-4 text-muted-foreground">
              Outpost isn&apos;t another AI diagram generator. The same agent reasons across
              your canvas and your docs, turning a rough sketch into a written spec without
              you copying anything by hand. And your team is right there with you.
            </p>
          </div>

          <div className="mt-16 flex flex-col gap-20">
            <SurfaceRow
              reverse={false}
              icon={<LayoutGrid className="size-5" />}
              title="Canvas"
              description="An infinite whiteboard where the agent drafts flowcharts, architecture diagrams, and journeys shape by shape, instead of hiding it all behind a black-box generate button."
              bullets={[
                "Templates for flowcharts, ERDs, architecture, and org charts",
                "Follow-up edits: ask for changes and it edits shapes in place",
                "A self-critique pass catches overlaps and missing links",
              ]}
              visual={<CanvasMock />}
            />
            <SurfaceRow
              reverse
              icon={<FileText className="size-5" />}
              title="Docs"
              description="Turn any diagram into a written spec. The agent drafts, rewrites, and summarizes in a block-based editor, pulling structure straight from what's on the canvas."
              bullets={[
                "Block-based editor: headings, lists, quotes, callouts",
                "\"Write this diagram up as a spec\" pulls structure automatically",
                "Rewrite or summarize any section on command",
              ]}
              visual={<DocsMock />}
            />
            <SurfaceRow
              reverse={false}
              icon={<KanbanSquare className="size-5" />}
              title="Team board"
              description="Every workspace in your organization lives on one shared board. Drag it from planning to done, and jump in with teammates, with live cursors on the canvas and in the doc."
              bullets={[
                "One kanban board for every workspace in your org",
                "Live cursors and edits on the canvas and in docs",
                "Anyone in your org can join any workspace instantly",
              ]}
              visual={<BoardMock />}
            />
          </div>
        </div>
      </section>

      {/* How it works — sets expectations for the shape-by-shape drawing before the CTA */}
      <section id="how-it-works" className="border-t border-white/10 px-6 py-24 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Watch it think, not just the result
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <Step number="01" title="Describe what you need">
              Just say &ldquo;Map out our onboarding flow.&rdquo; Plain language, no diagramming syntax
              to learn. Or just talk: voice input works too.
            </Step>
            <Step number="02" title="Watch the agent draw">
              Shapes appear one by one as the agent works, the same way a teammate would draw over a call.
            </Step>
            <Step number="03" title="It checks its own work">
              A second pass reviews the diagram for overlaps or missing links and fixes them automatically.
            </Step>
            <Step number="04" title="Keep iterating together">
              Ask for changes, pull it into a doc, or bring in your team. Same agent, same context.
            </Step>
          </div>
        </div>
      </section>

      {/* Testimonial — early-access framing kept honest since there's no real customer base yet */}
      <section className="border-t border-white/10 px-6 py-24 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="mx-auto size-6 text-primary" />
          <blockquote className="mt-6 text-2xl font-medium tracking-tight text-balance md:text-3xl">
            &ldquo;It&apos;s the first AI tool where I actually trust the diagram it gives me,
            because I watched it get built, step by step, instead of guessing what a black box did.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Users className="size-4" />
            </div>
            <div className="text-left text-sm">
              <p className="font-medium">Early access tester</p>
              <p className="text-muted-foreground">Product designer, seed-stage startup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-white/10 px-6 py-24 md:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <Image src="/brand/mascot-dark.png" alt="" width={40} height={40} className="opacity-80" />
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Give your workspace a collaborator
          </h2>
          <Button asChild size="lg" className="gap-2 text-base">
            <Link href="/sign-up">
              Get started free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-muted-foreground md:px-10">
        © {new Date().getFullYear()} Outpost. Built in public.
      </footer>
    </div>
  );
}

function SurfaceRow({
  icon,
  title,
  description,
  bullets,
  reverse,
  visual,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
  reverse: boolean;
  visual: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-10 md:flex-row md:items-center ${reverse ? "md:flex-row-reverse" : ""}`}>
      <div className="flex-1">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </div>
        <h3 className="mt-4 text-xl font-medium">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <ul className="mt-5 space-y-2.5">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      {/* Mock UI screenshot stand-in — swap for a real per-surface screenshot once the app UI exists */}
      <div className="flex-1">{visual}</div>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-sm font-mono text-primary">{number}</span>
      <h3 className="mt-3 font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
