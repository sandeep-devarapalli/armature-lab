import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const forceDemo = import.meta.env.VITE_DEMO_MODE === "true";
const url = forceDemo ? undefined : import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = forceDemo
  ? undefined
  : (
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )?.trim();

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase: SupabaseClient<Database> | null =
  url && publishableKey
    ? createClient<Database>(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

export const dataMode = isSupabaseConfigured ? "supabase" : "demo";

export const googleAuthEnabled =
  dataMode === "demo" || import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true";
