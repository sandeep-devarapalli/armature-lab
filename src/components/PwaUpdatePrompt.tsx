import { RefreshCw, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker
  } = useRegisterSW();

  if (!needRefresh && !offlineReady) return null;

  return (
    <aside className="pwa-update" role="status" aria-live="polite">
      <div>
        <strong>{needRefresh ? "New version ready" : "Offline shell ready"}</strong>
        <span>
          {needRefresh
            ? "Refresh when you are clear of any form in progress."
            : "Public pages remain readable offline. Booking and check-in still require a connection."}
        </span>
      </div>
      {needRefresh && (
        <button
          className="icon-button"
          type="button"
          title="Update now"
          onClick={() => void updateServiceWorker(true)}
        >
          <RefreshCw aria-hidden="true" />
          <span className="sr-only">Update now</span>
        </button>
      )}
      <button
        className="icon-button"
        type="button"
        title="Dismiss"
        onClick={() => {
          setNeedRefresh(false);
          setOfflineReady(false);
        }}
      >
        <X aria-hidden="true" />
        <span className="sr-only">Dismiss update notice</span>
      </button>
    </aside>
  );
}
