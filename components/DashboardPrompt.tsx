"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { createWorkspace } from "@/actions/workspace";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { MicButton } from "@/components/MicButton";

const MAX_NAME_LENGTH = 48;

const EXAMPLE_PROMPTS = [
  "Design a blog database and document each table",
  "Map out a user onboarding flow",
  "Plan the architecture for a chat app",
];

// "design a blog schema: users, posts..." -> "Design a blog schema: users, posts", cut on a word.
function nameFromPrompt(prompt: string) {
  const firstLine = prompt.trim().split("\n")[0];
  const name =
    firstLine.length <= MAX_NAME_LENGTH
      ? firstLine
      : firstLine.slice(0, MAX_NAME_LENGTH).replace(/\s+\S*$/, "");
  const clean = name.replace(/[\s.,:;!?-]+$/, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// Creates a workspace from the prompt and opens it; the workspace's agent sends the prompt
// as its first message (see AgentToggleButton).
export function DashboardPrompt() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();
  const { fn: createWorkspaceFn, loading } = useFetch(createWorkspace);
  const busy = loading ?? false;

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    const workspace = await createWorkspaceFn(nameFromPrompt(trimmed), trimmed);
    if (workspace) router.push(`/workspace/${workspace.id}?prompt=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="topo-bg mx-auto mb-14 w-full max-w-4xl px-6 py-10 text-center">

      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">What are we planning today?</h2>
      <p className="mt-2 text-muted-foreground">Describe it, and the agent drafts the doc and the canvas for you.</p>

      <div className="mx-auto mt-7 max-w-3xl rounded-3xl border border-white/12 bg-card/80 p-3 text-left shadow-2xl shadow-black/40 backdrop-blur transition focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="e.g. Design the database for a food delivery app and document it"
          rows={2}
          disabled={busy}
          autoFocus
          className="field-sizing-content max-h-60 min-h-14 w-full resize-none bg-transparent px-2 pt-1 text-base leading-6 outline-none placeholder:text-muted-foreground/70"
        />
        <div className="mt-1 flex items-center justify-between gap-2 pl-2">
          <span className="text-xs text-muted-foreground/70">Shift + Enter for a new line</span>
          <div className="flex items-center gap-1.5">
            <MicButton value={prompt} onChange={setPrompt} disabled={busy} className="rounded-full" />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!prompt.trim() || busy}
              aria-label="Create workspace"
              className="rounded-full shadow-lg shadow-primary/25"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setPrompt(example)}
            disabled={busy}
            className="rounded-full border border-white/10 bg-white/3 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  );
}
