const legacyCacheNames = ["armature-v16"];
const chunkReloadKey = "armature:chunk-reload-at";
const chunkReloadWindowMs = 60_000;

export async function removeLegacyPwaCaches(
  cacheStorage: Pick<CacheStorage, "delete"> | undefined =
    typeof caches === "undefined" ? undefined : caches
) {
  if (!cacheStorage) return;

  await Promise.allSettled(
    legacyCacheNames.map((cacheName) => cacheStorage.delete(cacheName))
  );
}

export function recoverFromStaleChunk(
  event: Event,
  storage: Pick<Storage, "getItem" | "setItem"> | null | undefined =
    typeof sessionStorage === "undefined" ? undefined : sessionStorage,
  reload: () => void = () => window.location.reload(),
  now = Date.now()
) {
  event.preventDefault();
  if (!storage) return;

  try {
    const lastReload = Number(storage.getItem(chunkReloadKey) ?? 0);
    if (lastReload > 0 && now - lastReload < chunkReloadWindowMs) return;
    storage.setItem(chunkReloadKey, String(now));
  } catch {
    return;
  }

  reload();
}

export function installChunkRecovery(
  target: Pick<Window, "addEventListener"> = window
) {
  target.addEventListener("vite:preloadError", recoverFromStaleChunk);
}
