// Adds demo workspaces (docs, a flowchart, an architecture diagram, an ERD and an org chart).
// Sign in to the app once first, then:
//
//   npm run seed -- you@email.com            your personal workspaces
//   npm run seed -- you@email.com org_123    an organization's workspaces
//
// Workspaces that already exist (by name) are skipped.
import { randomUUID } from "node:crypto";
import { createTLSchema, defaultBindingSchemas, defaultShapeSchemas } from "@tldraw/tlschema";
import { entityTableProps } from "@/components/EntityTable/EntityTableShape";
import { prisma } from "@/lib/prisma";
import type { WorkspaceStatus } from "@/lib/generated/prisma/enums";

// ---------- Canvas: a tldraw snapshot, built shape by shape ----------

type Box = { id: string; x: number; y: number; w: number; h: number };
type Table = Box & { columns: string[] };

const schema = createTLSchema({
  shapes: { ...defaultShapeSchemas, "entity-table": { props: entityTableProps } },
  bindings: defaultBindingSchemas,
}).serialize();

const tlId = (prefix: string) => `${prefix}:${randomUUID()}`;
const richText = (text: string) => ({
  type: "doc",
  content: text.split("\n").map((line) => ({ type: "paragraph", content: line ? [{ type: "text", text: line }] : [] })),
});

function canvas() {
  const records: Record<string, unknown>[] = [];
  let shapeCount = 0;

  const shape = (type: string, x: number, y: number, props: object) => {
    const id = tlId("shape");
    // tldraw's ordering keys: a1, a2 ... aZ, aa ... az.
    const index = `a${"123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"[shapeCount++]}`;
    records.push({ id, typeName: "shape", type, x, y, props, index, parentId: "page:page", rotation: 0, opacity: 1, isLocked: false, meta: {} });
    return id;
  };

  const box = (x: number, y: number, w: number, h: number, label: string, color = "black", geo = "rectangle"): Box => ({
    id: shape("geo", x, y, {
      geo, w, h, color, richText: richText(label), labelColor: "black", fill: "semi", dash: "draw", size: "m", font: "draw",
      align: "middle", verticalAlign: "middle", url: "", growY: 0, scale: 1, flipX: false, flipY: false,
    }),
    x, y, w, h,
  });

  const title = (x: number, y: number, text: string) =>
    shape("text", x, y, { richText: richText(text), size: "l", color: "black", w: 800, autoSize: true, font: "draw", textAlign: "start", scale: 1 });

  const table = (x: number, y: number, tableName: string, cols: [string, string, ("PK" | "FK")?][]): Table => {
    const rows = cols.map(([name, dataType, key]) => ({ id: randomUUID(), name, dataType, isPK: key === "PK", isFK: key === "FK" }));
    const h = 36 + rows.length * 28;
    return { id: shape("entity-table", x, y, { w: 260, h, tableName, rows }), x, y, w: 260, h, columns: cols.map(([name]) => name) };
  };

  // Bound to both shapes, so it follows them when moved. anchorY pins each end to a height fraction.
  const arrow = (from: Box, to: Box, label = "", anchorY?: [number, number]) => {
    const id = shape("arrow", 0, 0, {
      start: { x: from.x + from.w / 2, y: from.y + from.h / 2 }, end: { x: to.x + to.w / 2, y: to.y + to.h / 2 },
      richText: richText(label), color: "grey", labelColor: "black", kind: "arc", bend: 0, arrowheadStart: "none",
      arrowheadEnd: "arrow", dash: "draw", fill: "none", font: "draw", size: "m", scale: 1, labelPosition: 0.5, elbowMidPoint: 0.5,
    });
    [from, to].forEach((target, i) =>
      records.push({
        id: tlId("binding"), typeName: "binding", type: "arrow", fromId: id, toId: target.id, meta: {},
        props: { terminal: i ? "end" : "start", normalizedAnchor: { x: 0.5, y: anchorY?.[i] ?? 0.5 }, isPrecise: !!anchorY, isExact: false, snap: "none" },
      })
    );
  };

  // A foreign-key arrow pinned to the two columns' rows.
  const relation = (from: Table, fromCol: string, to: Table, toCol: string) => {
    const rowY = (t: Table, col: string) => (36 + t.columns.indexOf(col) * 28 + 14) / t.h;
    arrow(from, to, "", [rowY(from, fromCol), rowY(to, toCol)]);
  };

  const snapshot = () => {
    const store = [
      { id: "document:document", typeName: "document", gridSize: 10, name: "", meta: {} },
      { id: "page:page", typeName: "page", name: "Page 1", index: "a1", meta: {} },
      ...records,
    ];
    return { document: { schema, store: Object.fromEntries(store.map((r) => [r.id, r])) } };
  };

  return { box, title, table, arrow, relation, snapshot };
}

// ---------- Doc: BlockNote blocks (imported into the live doc when first opened) ----------

const block = (type: string, text: string, props = {}) => ({
  id: randomUUID(), type, props, children: [], content: [{ type: "text", text, styles: {} }],
});
const h1 = (t: string) => block("heading", t, { level: 1 });
const h2 = (t: string) => block("heading", t, { level: 2 });
const p = (t: string) => block("paragraph", t);
const bullet = (t: string) => block("bulletListItem", t);
const numbered = (t: string) => block("numberedListItem", t);
const todo = (t: string, checked = false) => block("checkListItem", t, { checked });

// ---------- Canvases ----------

function onboardingFlow() {
  const c = canvas();
  c.title(90, -60, "New user onboarding");
  const signUp = c.box(180, 100, 240, 80, "Sign up", "blue");
  const verify = c.box(180, 280, 240, 80, "Verify email", "blue");
  const invite = c.box(170, 460, 260, 150, "Has an org\ninvite?", "violet", "diamond");
  const join = c.box(-180, 720, 240, 80, "Join the org", "green");
  const create = c.box(540, 720, 240, 80, "Create first\nworkspace", "green");
  const dashboard = c.box(180, 920, 240, 80, "Dashboard", "orange");
  c.arrow(signUp, verify);
  c.arrow(verify, invite);
  c.arrow(invite, join, "Yes");
  c.arrow(invite, create, "No");
  c.arrow(join, dashboard);
  c.arrow(create, dashboard);
  return c.snapshot();
}

function paymentsArchitecture() {
  const c = canvas();
  c.title(40, -60, "Payments service architecture");
  const web = c.box(0, 100, 240, 90, "Web app\n(Next.js)", "blue");
  const mobile = c.box(360, 100, 240, 90, "Mobile app\n(React Native)", "blue");
  const gateway = c.box(180, 300, 240, 90, "API gateway", "violet");
  const auth = c.box(-180, 500, 240, 90, "Auth service", "green");
  const payments = c.box(180, 500, 240, 90, "Payments service", "green");
  const ledger = c.box(540, 500, 240, 90, "Ledger service", "green");
  const usersDb = c.box(-180, 700, 240, 90, "Users DB\n(Postgres)", "orange", "ellipse");
  const stripe = c.box(180, 700, 240, 90, "Stripe", "orange");
  const queue = c.box(540, 700, 240, 90, "Event queue\n(Kafka)", "orange");
  const notifications = c.box(540, 900, 240, 90, "Notifications", "green");
  c.arrow(web, gateway);
  c.arrow(mobile, gateway);
  c.arrow(gateway, auth);
  c.arrow(gateway, payments, "charge");
  c.arrow(auth, usersDb);
  c.arrow(payments, stripe, "intents");
  c.arrow(payments, ledger, "record");
  c.arrow(ledger, queue);
  c.arrow(queue, notifications, "receipt");
  return c.snapshot();
}

function blogSchema() {
  const c = canvas();
  c.title(300, -60, "Blog platform schema");
  const users = c.table(0, 100, "users", [["id", "uuid", "PK"], ["username", "varchar"], ["email", "varchar"], ["created_at", "timestamptz"]]);
  const posts = c.table(420, 100, "posts", [["id", "uuid", "PK"], ["author_id", "uuid", "FK"], ["title", "varchar"], ["body", "text"], ["published_at", "timestamptz"]]);
  const comments = c.table(840, 100, "comments", [["id", "uuid", "PK"], ["post_id", "uuid", "FK"], ["author_id", "uuid", "FK"], ["body", "text"]]);
  const tags = c.table(0, 440, "tags", [["id", "uuid", "PK"], ["name", "varchar"]]);
  const postTags = c.table(420, 440, "post_tags", [["post_id", "uuid", "FK"], ["tag_id", "uuid", "FK"]]);
  c.relation(users, "id", posts, "author_id");
  c.relation(posts, "id", comments, "post_id");
  c.relation(tags, "id", postTags, "tag_id");
  c.relation(posts, "id", postTags, "post_id");
  return c.snapshot();
}

function engineeringOrgChart() {
  const c = canvas();
  c.title(430, -60, "Engineering org chart");
  const vp = c.box(580, 100, 240, 80, "Maya Chen\nVP Engineering", "violet");
  const teams = [
    { x: 200, manager: "Arjun Mehta\nEM, Platform", lead: "Sofia Rossi\nTech lead", engineers: ["Liam Park", "Noah Kim"] },
    { x: 700, manager: "Priya Nair\nEM, Product", lead: "Daniel Okafor\nTech lead", engineers: ["Emma Wilson", "Ravi Das"] },
    { x: 1200, manager: "Lucas Silva\nEM, Mobile", lead: "Hana Sato\nTech lead", engineers: ["Omar Haddad", "Zoe Martin"] },
  ];
  for (const team of teams) {
    const manager = c.box(team.x - 120, 300, 240, 80, team.manager, "blue");
    const lead = c.box(team.x - 120, 480, 240, 80, team.lead, "green");
    c.arrow(vp, manager);
    c.arrow(manager, lead);
    team.engineers.forEach((name, i) => c.arrow(lead, c.box(team.x - 220 + i * 240, 660, 200, 70, `${name}\nEngineer`)));
  }
  return c.snapshot();
}

// ---------- Workspaces, in board order ----------

const WORKSPACES: {
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  hoursAgo: number;
  doc: ReturnType<typeof block>[];
  canvas?: object;
}[] = [
  {
    name: "Q4 product roadmap",
    description: "Themes and priorities for the quarter",
    status: "PLANNING",
    hoursAgo: 30,
    doc: [
      h1("Q4 product roadmap"),
      p("Themes for the quarter, in priority order."),
      h2("1. Agent quality"),
      bullet("Cleaner diagram layouts with no overlapping shapes"),
      bullet("Follow-up edits that keep the doc and canvas in sync"),
      h2("2. Team features"),
      bullet("Workspace activity feed"),
      bullet("Mention teammates in the doc"),
      h2("3. Growth"),
      bullet("Self-serve team upgrades from the dashboard"),
    ],
  },
  {
    name: "Onboarding flow redesign",
    description: "Get new users to their first prompt faster",
    status: "PLANNING",
    hoursAgo: 5,
    canvas: onboardingFlow(),
    doc: [
      h1("Onboarding flow redesign"),
      p("Goal: get a new user to their first agent prompt in under two minutes."),
      h2("Changes"),
      numbered("Skip the welcome tour; go straight to the dashboard prompt"),
      numbered("Invited users land inside their org, not a personal space"),
      numbered("Suggest three example prompts on an empty dashboard"),
      h2("Success metrics"),
      bullet("Time to first prompt"),
      bullet("Day 7 retention for new sign-ups"),
    ],
  },
  {
    name: "Marketing site refresh",
    description: null,
    status: "PLANNING",
    hoursAgo: 170,
    doc: [
      h1("Marketing site refresh"),
      p("New landing page, pricing section and product video."),
      h2("What changes"),
      bullet("Hero rebuilt around the product walkthrough video"),
      bullet("Pricing pulled live from Clerk Billing"),
      bullet("Page weight down 40% after image cleanup"),
    ],
  },
  {
    name: "Payments service architecture",
    description: "Charges, ledger and receipts across services",
    status: "IN_PROGRESS",
    hoursAgo: 1,
    canvas: paymentsArchitecture(),
    doc: [
      h1("Payments service architecture"),
      p("How a charge moves from the client to Stripe and back, and which service owns each step."),
      h2("Services"),
      bullet("API gateway: auth checks, rate limits and routing for every client request"),
      bullet("Payments service: creates Stripe payment intents and handles webhooks"),
      bullet("Ledger service: the source of truth for balances, written once per settled charge"),
      bullet("Notifications: sends receipts and failed-payment emails from queue events"),
      h2("Open questions"),
      todo("Idempotency keys on every write to the ledger", true),
      todo("Retry policy for Stripe webhook failures"),
      todo("Decide on Kafka vs. SQS for the event queue"),
    ],
  },
  {
    name: "Blog platform database",
    description: "Schema for posts, comments and tags",
    status: "IN_PROGRESS",
    hoursAgo: 48,
    canvas: blogSchema(),
    doc: [
      h1("Blog platform database"),
      p("Postgres schema for posts, comments and tags. Every id is a uuid; timestamps are UTC."),
      h2("Tables"),
      bullet("users: authors and commenters"),
      bullet("posts: belong to an author; published_at is null for drafts"),
      bullet("comments: belong to a post and an author"),
      bullet("tags and post_tags: many-to-many between posts and tags"),
      h2("Indexes"),
      todo("posts (author_id, published_at)", true),
      todo("comments (post_id, created_at)", true),
      todo("Unique tags (name)"),
    ],
  },
  {
    name: "Engineering org chart",
    description: "Teams and reporting lines after the Q3 reorg",
    status: "IN_REVIEW",
    hoursAgo: 3,
    canvas: engineeringOrgChart(),
    doc: [
      h1("Engineering org chart"),
      p("Three product-aligned teams reporting to the VP of Engineering. Updated after the Q3 reorg."),
      h2("Teams"),
      bullet("Platform: infrastructure, CI/CD, observability and developer tooling"),
      bullet("Product: web app features, billing and the agent experience"),
      bullet("Mobile: iOS and Android apps, shared React Native components"),
      h2("Hiring"),
      todo("Senior engineer, Platform", true),
      todo("Two engineers, Mobile"),
    ],
  },
  {
    name: "Mobile app launch plan",
    description: "Public beta checklist for iOS and Android",
    status: "DONE",
    hoursAgo: 20,
    doc: [
      h1("Mobile app launch plan"),
      p("Target: public beta on iOS and Android by the end of the month."),
      h2("Launch checklist"),
      todo("App Store and Play Store listings", true),
      todo("Crash reporting and analytics", true),
      todo("Push notifications for mentions"),
      todo("Beta invite emails to the waitlist"),
      todo("Launch post and demo video"),
    ],
  },
];

async function main() {
  const [email, orgId] = process.argv.slice(2);
  if (!email) throw new Error("Usage: npm run seed -- you@email.com [org_id]");

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const scope = orgId ? { clerkOrgId: orgId } : { clerkOrgId: null, creatorId: user.id };

  for (const [position, w] of WORKSPACES.entries()) {
    if (await prisma.workspace.findFirst({ where: { ...scope, name: w.name } })) {
      console.log(`Skipped: ${w.name}`);
      continue;
    }
    const at = new Date(Date.now() - w.hoursAgo * 3_600_000);
    await prisma.workspace.create({
      data: {
        name: w.name,
        description: w.description,
        status: w.status,
        position,
        clerkOrgId: orgId ?? null,
        creatorId: user.id,
        createdAt: at,
        updatedAt: at,
        doc: { create: { content: w.doc, createdAt: at, updatedAt: at } },
        canvas: { create: { content: w.canvas, createdAt: at, updatedAt: at } },
      },
    });
    console.log(`Created: ${w.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
