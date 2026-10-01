// Routes each canvas to its own room: /connect/<roomId> opens a WebSocket to that room's
// Durable Object, so everyone on the same canvas talks to the same instance.
export { TldrawRoom } from "./TldrawRoom";

export default {
  fetch(request: Request, env: Env) {
    const match = new URL(request.url).pathname.match(/^\/connect\/([\w-]+)$/);
    if (!match) return new Response("Not found", { status: 404 });

    const room = env.TLDRAW_ROOM.get(env.TLDRAW_ROOM.idFromName(match[1]));
    return room.fetch(request);
  },
};
