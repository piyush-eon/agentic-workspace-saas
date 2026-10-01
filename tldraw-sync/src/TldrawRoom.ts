// One canvas room, adapted from tldraw's official Cloudflare template
// (github.com/tldraw/tldraw-sync-cloudflare). The room is saved to the Durable Object's own
// SQLite storage, and it hibernates when idle while WebSockets stay open.
import {
  DurableObjectSqliteSyncWrapper,
  SQLiteSyncStorage,
  TLSocketRoom,
  type SessionStateSnapshot,
} from "@tldraw/sync-core";
import { createTLSchema, defaultBindingSchemas, defaultShapeSchemas, type TLRecord } from "@tldraw/tlschema";
import { T } from "@tldraw/validate";
import { DurableObject } from "cloudflare:workers";

// The server validates every change, so it needs our custom ERD shape too.
// Keep these props in sync with components/EntityTable/EntityTableShape.ts.
const entityTableProps = {
  w: T.number,
  h: T.number,
  tableName: T.string,
  rows: T.arrayOf(T.object({ id: T.string, name: T.string, dataType: T.string, isPK: T.boolean, isFK: T.boolean })),
};

const schema = createTLSchema({
  shapes: { ...defaultShapeSchemas, "entity-table": { props: entityTableProps } },
  bindings: defaultBindingSchemas,
});

type Attachment = { sessionId: string; snapshot: SessionStateSnapshot | null };

function getAttachment(ws: WebSocket) {
  const attachment = ws.deserializeAttachment() as Attachment | null;
  return attachment?.sessionId ? attachment : null;
}

export class TldrawRoom extends DurableObject {
  private room: TLSocketRoom<TLRecord, void> | null = null;
  private readonly sockets = new Map<string, WebSocket>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Answer the client's keep-alive pings without waking the room.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}'));
  }

  private getRoom() {
    if (this.room) return this.room;

    this.room = new TLSocketRoom<TLRecord, void>({
      schema,
      storage: new SQLiteSyncStorage<TLRecord>({ sql: new DurableObjectSqliteSyncWrapper(this.ctx.storage) }),
      // Cloudflare keeps connections alive with the auto-response above.
      clientTimeout: Infinity,
      onSessionSnapshot: (sessionId, snapshot) => this.sockets.get(sessionId)?.serializeAttachment({ sessionId, snapshot }),
    });

    // Reconnect sessions that stayed open while the room was hibernating.
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = getAttachment(ws);
      if (attachment?.snapshot) {
        this.room.handleSocketResume({ sessionId: attachment.sessionId, socket: ws, snapshot: attachment.snapshot });
      }
    }
    return this.room;
  }

  fetch(request: Request) {
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) return new Response("Missing sessionId", { status: 400 });

    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ sessionId, snapshot: null } satisfies Attachment);
    this.getRoom().handleSocketConnect({ sessionId, socket: server });

    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const attachment = getAttachment(ws);
    if (!attachment) return;
    this.sockets.set(attachment.sessionId, ws);
    this.getRoom().handleSocketMessage(attachment.sessionId, message);
  }

  override async webSocketClose(ws: WebSocket) {
    this.endSession(ws, "handleSocketClose");
  }

  override async webSocketError(ws: WebSocket) {
    this.endSession(ws, "handleSocketError");
  }

  private endSession(ws: WebSocket, method: "handleSocketClose" | "handleSocketError") {
    const attachment = getAttachment(ws);
    if (!attachment) return;
    this.sockets.delete(attachment.sessionId);

    const room = this.getRoom();
    // A session that left while the room slept must rejoin briefly, so others see its cursor go.
    if (attachment.snapshot && !room.getSessionSnapshot(attachment.sessionId)) {
      room.handleSocketResume({ sessionId: attachment.sessionId, socket: ws, snapshot: attachment.snapshot });
    }
    room[method](attachment.sessionId);
  }
}
