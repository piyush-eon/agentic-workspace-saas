import { createClient } from "@supabase/supabase-js";

// Browser client, used only for Realtime channels — all data access still goes through Prisma.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
