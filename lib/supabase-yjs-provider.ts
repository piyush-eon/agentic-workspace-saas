import * as Y from "yjs";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { fromBase64, toBase64 } from "@/lib/base64";

const PEER_SYNC_WAIT_MS = 500;

// Syncs a Yjs document between everyone viewing the same doc, over a Supabase Realtime channel.
// Three broadcast events: "update" (doc changes), "awareness" (cursors/names) and "sync-request"
// (a newcomer asking peers for their full state, to catch up on unsaved edits).
//
// Tutorial scope: this is a public channel, so anyone with the anon key and the doc id could join.
// For production, use a private channel with Supabase Realtime Authorization (RLS on
// realtime.messages) and sign clients in with their Clerk session token.
export class SupabaseYjsProvider {
  readonly awareness: Awareness;
  private channel: RealtimeChannel;
  private subscribed = false;
  private isReady = false;
  private readyTimeout?: ReturnType<typeof setTimeout>;

  // onReady fires once, shortly after joining (giving peers a moment to send unsaved edits),
  // or right away if Realtime can't connect, so the editor still opens with the saved state.
  constructor(
    private doc: Y.Doc,
    roomId: string,
    private onReady: () => void
  ) {
    this.awareness = new Awareness(doc);
    this.channel = supabase.channel(`doc:${roomId}`, { config: { broadcast: { self: false } } });

    this.channel
      .on("broadcast", { event: "update" }, ({ payload }) => {
        Y.applyUpdate(this.doc, fromBase64(payload.update), this);
      })
      .on("broadcast", { event: "awareness" }, ({ payload }) => {
        applyAwarenessUpdate(this.awareness, fromBase64(payload.update), this);
      })
      .on("broadcast", { event: "sync-request" }, () => {
        this.sendFullState();
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          this.subscribed = false;
          this.markReady();
          return;
        }
        this.subscribed = true;
        // Share anything we already have, then ask peers for what we're missing.
        this.sendFullState();
        this.send("sync-request", {});
        this.readyTimeout ??= setTimeout(this.markReady, PEER_SYNC_WAIT_MS);
      });

    this.doc.on("update", this.handleDocUpdate);
    this.awareness.on("update", this.handleAwarenessUpdate);
  }

  // Remote updates are applied with `this` as the origin, so they aren't echoed back out.
  private handleDocUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin !== this) this.send("update", { update: toBase64(update) });
  };

  private handleAwarenessUpdate = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ) => {
    if (origin === this) return;
    const changed = [...added, ...updated, ...removed];
    this.send("awareness", { update: toBase64(encodeAwarenessUpdate(this.awareness, changed)) });
  };

  private markReady = () => {
    clearTimeout(this.readyTimeout);
    if (this.isReady) return;
    this.isReady = true;
    this.onReady();
  };

  private sendFullState() {
    this.send("update", { update: toBase64(Y.encodeStateAsUpdate(this.doc)) });
    this.send("awareness", {
      update: toBase64(encodeAwarenessUpdate(this.awareness, [this.doc.clientID])),
    });
  }

  private send(event: string, payload: Record<string, unknown>) {
    if (!this.subscribed) return;
    this.channel.send({ type: "broadcast", event, payload });
  }

  destroy() {
    clearTimeout(this.readyTimeout);
    this.isReady = true;
    // Tell peers our cursor is gone before leaving.
    removeAwarenessStates(this.awareness, [this.doc.clientID], "destroy");
    this.doc.off("update", this.handleDocUpdate);
    this.awareness.off("update", this.handleAwarenessUpdate);
    this.awareness.destroy();
    supabase.removeChannel(this.channel);
  }
}
