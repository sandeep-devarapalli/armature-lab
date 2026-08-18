const legacyCacheNames = ["armature-v16"];
const chunkReloadKey = "armature:chunk-reload";

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
  reload: () => void = () => window.location.reload()
) {
  if (!storage) return;

  try {
    if (storage.getItem(chunkReloadKey)) return;
    storage.setItem(chunkReloadKey, "1");
  } catch {
    return;
  }

  event.preventDefault();
  reload();
}

export function installChunkRecovery(
  target: Pick<Window, "addEventListener"> = window
) {
  target.addEventListener("vite:preloadError", recoverFromStaleChunk);
}
