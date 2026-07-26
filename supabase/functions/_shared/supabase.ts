import {
  createClient,
  type SupabaseClient,
} from "npm:@supabase/supabase-js@2.57.4";
import { requiredEnv } from "./env.ts";
import { HttpError } from "./http.ts";

export function adminClient(): SupabaseClient {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication required.", "authentication_required");
  }
  return authorization.slice("Bearer ".length);
}

export interface JwtClaims {
  sub?: string;
  aal?: string;
  exp?: number;
  [key: string]: unknown;
}

export function parseJwtClaims(token: string): JwtClaims {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new HttpError(401, "Invalid access token.", "invalid_access_token");
  }

  try {
    const payload = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as JwtClaims;
  } catch {
    throw new HttpError(401, "Invalid access token.", "invalid_access_token");
  }
}

export async function authenticatedUser(
  request: Request,
): Promise<{ id: string; email: string | undefined; claims: JwtClaims }> {
  const token = bearerToken(request);
  const client = adminClient();
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError(401, "Authentication required.", "authentication_required");
  }

  return {
    id: data.user.id,
    email: data.user.email,
    claims: parseJwtClaims(token),
  };
}

export async function requireStaff(
  userId: string,
  allowedRoles: string[],
): Promise<void> {
  const client = adminClient();
  const { data, error } = await client
    .from("staff_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", allowedRoles)
    .limit(1);

  if (error || !data?.length) {
    throw new HttpError(403, "Required staff role is missing.", "staff_role_required");
  }
}
