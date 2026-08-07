import { supabase } from "./supabase";

const DB_NAME = "armature-kiosk";
const STORE_NAME = "credentials";
const ACTIVE_KEY = "active-device";

interface StoredKioskCredential {
  deviceId: string;
  privateKey: CryptoKey;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeCredential(credential: StoredKioskCredential) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(credential, ACTIVE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function readCredential() {
  const database = await openDatabase();
  const credential = await new Promise<StoredKioskCredential | undefined>(
    (resolve, reject) => {
      const request = database
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .get(ACTIVE_KEY);
      request.onsuccess = () =>
        resolve(request.result as StoredKioskCredential | undefined);
      request.onerror = () => reject(request.error);
    }
  );
  database.close();
  return credential;
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

async function sha256Hex(value: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function apiConfiguration() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !publishableKey) {
    throw new Error("Supabase kiosk configuration is missing.");
  }
  return { url, publishableKey };
}

export async function hasEnrolledKiosk() {
  return Boolean(await readCredential());
}

export async function enrollKiosk(token: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const generated = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  const publicKey = await crypto.subtle.exportKey("jwk", generated.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", generated.privateKey);
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const { data, error } = await supabase.functions.invoke("kiosk", {
    body: {
      action: "redeem_enrollment",
      token: token.trim(),
      public_key_jwk: publicKey
    }
  });
  if (error) throw error;
  const result = data as { device_id?: string; id?: string };
  const deviceId = result.device_id ?? result.id;
  if (!deviceId) throw new Error("Kiosk enrollment returned no device ID.");
  await storeCredential({ deviceId, privateKey });
  return deviceId;
}

export async function scanMemberToken(token: string) {
  const credential = await readCredential();
  if (!credential) throw new Error("This kiosk has not been enrolled.");
  const { url, publishableKey } = apiConfiguration();
  const body = JSON.stringify({ action: "scan", token });
  const timestamp = String(Date.now());
  const nonce = base64Url(crypto.getRandomValues(new Uint8Array(24)));
  const path = "/functions/v1/kiosk";
  const canonical = [
    timestamp,
    nonce,
    "POST",
    path,
    await sha256Hex(body)
  ].join("\n");
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      credential.privateKey,
      new TextEncoder().encode(canonical)
    )
  );

  const response = await fetch(`${url}${path}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "content-type": "application/json",
      "x-kiosk-device-id": credential.deviceId,
      "x-kiosk-nonce": nonce,
      "x-kiosk-timestamp": timestamp,
      "x-kiosk-signature": base64Url(signature)
    },
    body,
    cache: "no-store"
  });
  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      typeof result.message === "string"
        ? result.message
        : typeof result.error === "string"
          ? result.error
          : "Kiosk scan failed.";
    throw new Error(message);
  }
  return result;
}
