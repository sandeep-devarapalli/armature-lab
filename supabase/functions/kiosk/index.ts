import { corsHeaders } from "../_shared/cors.ts";
import {
  jwkThumbprint,
  randomToken,
  sha256Hex,
  verifyKioskSignature,
} from "../_shared/crypto.ts";
import { errorResponse, HttpError, json, parseJson } from "../_shared/http.ts";
import {
  adminClient,
  authenticatedUser,
  requireStaff,
} from "../_shared/supabase.ts";

interface CreateEnrollmentRequest {
  action: "create_enrollment";
  location_id: string;
  name: string;
}

interface RedeemEnrollmentRequest {
  action: "redeem_enrollment";
  token: string;
  public_key_jwk: JsonWebKey;
}

interface ScanRequest {
  action: "scan";
  token: string;
}

interface RevokeDeviceRequest {
  action: "revoke_device";
  device_id: string;
  reason: string;
}

type KioskRequest =
  | CreateEnrollmentRequest
  | RedeemEnrollmentRequest
  | ScanRequest
  | RevokeDeviceRequest;

async function createEnrollment(
  request: Request,
  body: CreateEnrollmentRequest,
): Promise<Response> {
  const user = await authenticatedUser(request);
  await requireStaff(user.id, ["operations", "admin", "super_admin"]);

  if (user.claims.aal !== "aal2") {
    throw new HttpError(
      403,
      "MFA assurance level 2 is required to enroll a kiosk.",
      "mfa_required",
    );
  }

  if (!body.location_id || body.name.trim().length < 3) {
    throw new HttpError(
      400,
      "A location and kiosk name are required.",
      "invalid_enrollment",
    );
  }

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const client = adminClient();
  const { data, error } = await client.rpc("create_kiosk_enrollment", {
    p_location_id: body.location_id,
    p_name: body.name.trim(),
    p_created_by: user.id,
    p_token_hash_hex: tokenHash,
    p_expires_at: expiresAt,
  });

  if (error) throw new HttpError(400, error.message, "enrollment_failed");

  return json(request, {
    enrollment_id: data,
    token,
    expires_at: expiresAt,
  });
}

async function redeemEnrollment(
  request: Request,
  body: RedeemEnrollmentRequest,
): Promise<Response> {
  if (!body.token || !body.public_key_jwk) {
    throw new HttpError(
      400,
      "Enrollment token and public key are required.",
      "invalid_enrollment",
    );
  }

  if (
    body.public_key_jwk.d ||
    body.public_key_jwk.kty !== "EC" ||
    body.public_key_jwk.crv !== "P-256" ||
    !body.public_key_jwk.x ||
    !body.public_key_jwk.y
  ) {
    throw new HttpError(
      400,
      "A public P-256 verification key is required.",
      "invalid_key",
    );
  }

  const publicKey: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: body.public_key_jwk.x,
    y: body.public_key_jwk.y,
    ext: true,
    key_ops: ["verify"],
  };
  const tokenHash = await sha256Hex(body.token);
  const thumbprint = await jwkThumbprint(publicKey);
  const client = adminClient();
  const { data, error } = await client.rpc("redeem_kiosk_enrollment", {
    p_token_hash_hex: tokenHash,
    p_public_key_jwk: publicKey,
    p_key_thumbprint: thumbprint,
  });

  if (error) throw new HttpError(400, error.message, "enrollment_failed");
  return json(request, data);
}

async function revokeDevice(
  request: Request,
  body: RevokeDeviceRequest,
): Promise<Response> {
  const user = await authenticatedUser(request);
  await requireStaff(user.id, ["operations", "admin", "super_admin"]);

  if (user.claims.aal !== "aal2") {
    throw new HttpError(
      403,
      "MFA assurance level 2 is required to revoke a kiosk.",
      "mfa_required",
    );
  }
  if (!body.device_id || body.reason.trim().length < 8) {
    throw new HttpError(
      400,
      "A device and detailed revocation reason are required.",
      "invalid_revocation",
    );
  }

  const client = adminClient();
  const { data: device, error } = await client
    .from("kiosk_devices")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: user.id,
    })
    .eq("id", body.device_id)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error || !device) {
    throw new HttpError(
      404,
      "Active kiosk device not found.",
      "kiosk_not_found",
    );
  }

  await Promise.all([
    client.from("access_events").insert({
      device_id: body.device_id,
      event_type: "kiosk_revoked",
      reason: body.reason.trim(),
      metadata: { staff_id: user.id },
    }),
    client.from("audit_events").insert({
      actor_user_id: user.id,
      actor_type: "staff",
      action: "kiosk.revoked",
      entity_type: "kiosk_device",
      entity_id: body.device_id,
      reason: body.reason.trim(),
    }),
  ]);

  return json(request, { device_id: body.device_id, status: "revoked" });
}

async function scan(
  request: Request,
  rawBody: string,
  body: ScanRequest,
): Promise<Response> {
  const deviceId = request.headers.get("x-kiosk-device-id") ?? "";
  const nonce = request.headers.get("x-kiosk-nonce") ?? "";
  const timestamp = request.headers.get("x-kiosk-timestamp") ?? "";
  const signature = request.headers.get("x-kiosk-signature") ?? "";
  const timestampNumber = Number(timestamp);

  if (!deviceId || !nonce || !timestamp || !signature || !body.token) {
    throw new HttpError(
      401,
      "Signed kiosk headers and a member token are required.",
      "invalid_kiosk_request",
    );
  }

  if (
    !Number.isFinite(timestampNumber) ||
    Math.abs(Date.now() - timestampNumber) > 30_000
  ) {
    throw new HttpError(
      401,
      "Kiosk request timestamp is outside the accepted window.",
      "stale_kiosk_request",
    );
  }

  if (!/^[A-Za-z0-9_-]{16,128}$/u.test(nonce)) {
    throw new HttpError(400, "Invalid kiosk nonce.", "invalid_nonce");
  }

  const client = adminClient();
  const { data: device, error: deviceError } = await client
    .from("kiosk_devices")
    .select("id, public_key_jwk, status")
    .eq("id", deviceId)
    .eq("status", "active")
    .maybeSingle();

  if (deviceError || !device?.public_key_jwk) {
    throw new HttpError(401, "Kiosk device is not active.", "unknown_kiosk");
  }

  const bodyHash = await sha256Hex(rawBody);
  const path = new URL(request.url).pathname;
  const canonicalRequest = [
    timestamp,
    nonce,
    request.method.toUpperCase(),
    path,
    bodyHash,
  ].join("\n");
  const verified = await verifyKioskSignature(
    device.public_key_jwk as JsonWebKey,
    signature,
    canonicalRequest,
  );

  if (!verified) {
    throw new HttpError(
      401,
      "Kiosk request signature is invalid.",
      "invalid_kiosk_signature",
    );
  }

  const { error: nonceError } = await client.from("kiosk_request_nonces").insert({
    device_id: deviceId,
    nonce,
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });

  if (nonceError) {
    throw new HttpError(
      409,
      "Kiosk request nonce has already been used.",
      "replayed_kiosk_request",
    );
  }

  const tokenHash = await sha256Hex(body.token);
  const { data, error } = await client.rpc("redeem_checkin_intent", {
    p_token_hash_hex: tokenHash,
    p_device_id: deviceId,
  });

  if (error) {
    await client.from("access_events").insert({
      device_id: deviceId,
      event_type: "denied",
      reason: error.message,
      metadata: { token_hash_prefix: tokenHash.slice(0, 12) },
    });
    throw new HttpError(403, error.message, "checkin_denied");
  }

  return json(request, data);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== "POST") {
    return json(request, { error: "method_not_allowed" }, 405);
  }

  try {
    const rawBody = await request.text();
    const body = await parseJson<KioskRequest>(rawBody);

    switch (body.action) {
      case "create_enrollment":
        return await createEnrollment(request, body);
      case "redeem_enrollment":
        return await redeemEnrollment(request, body);
      case "scan":
        return await scan(request, rawBody, body);
      case "revoke_device":
        return await revokeDevice(request, body);
      default:
        throw new HttpError(400, "Unknown kiosk action.", "invalid_action");
    }
  } catch (error) {
    return errorResponse(request, error);
  }
});
