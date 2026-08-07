import {
  useEffect,
  useRef,
  useState,
  type FormEvent
} from "react";
import {
  AlertTriangle,
  Archive,
  Boxes,
  Camera,
  Check,
  DoorOpen,
  ExternalLink,
  PackageCheck,
  PackageOpen,
  QrCode,
  Radio,
  RotateCcw,
  ScanLine,
  ThumbsUp
} from "lucide-react";
import type { IScannerControls } from "@zxing/browser";
import { format, parseISO } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";
import {
  EmptyState,
  Metric,
  PageHeader,
  Section,
  Status
} from "../components/Primitives";
import { components, getComponent } from "../data/components";
import { useApp } from "../context/AppContext";
import { useInventory } from "../context/InventoryContext";
import { OperationsHeader } from "./AdminPages";
import type {
  CabinetEvent,
  CheckoutSession,
  ComponentRequestStatus
} from "../types/inventory";

const requestStatuses: ComponentRequestStatus[] = [
  "submitted",
  "under_review",
  "approved",
  "ordered",
  "available",
  "declined"
];

function requestTone(status: ComponentRequestStatus) {
  if (status === "available") return "good";
  if (status === "declined") return "bad";
  if (status === "approved" || status === "ordered") return "accent";
  return "warn";
}

function locationName(
  locations: ReturnType<typeof useInventory>["inventory"]["locations"],
  locationId: string
) {
  return locations.find((location) => location.id === locationId)?.name ?? "Unassigned";
}

function TurnstileField() {
  const { mode } = useApp();
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (mode === "demo" || !siteKey || document.querySelector("#turnstile-script")) {
      return;
    }
    const script = document.createElement("script");
    script.id = "turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [mode, siteKey]);

  if (mode === "demo") {
    return <input type="hidden" name="cf-turnstile-response" value="demo-turnstile-token" />;
  }
  if (!siteKey) {
    return (
      <p className="form-error" role="alert">
        Request verification is not configured. Staff must add the Turnstile site key.
      </p>
    );
  }
  return <div className="cf-turnstile" data-sitekey={siteKey} />;
}

export function PublicComponentRequestPage() {
  const { mode, online } = useApp();
  const { submitPublicRequest, verifyPublicRequest } = useInventory();
  const [searchParams] = useSearchParams();
  const verificationStarted = useRef(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [verification, setVerification] = useState<
    "idle" | "checking" | "verified" | "failed"
  >("idle");

  useEffect(() => {
    const requestId = searchParams.get("request");
    const token = searchParams.get("verify");
    if (!requestId || !token || verificationStarted.current) return;
    verificationStarted.current = true;
    setVerification("checking");
    void verifyPublicRequest(requestId, token)
      .then(() => setVerification("verified"))
      .catch((reason: Error) => {
        setError(reason.message);
        setVerification("failed");
      });
  }, [searchParams, verifyPublicRequest]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitted(false);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await submitPublicRequest({
        componentName: String(data.get("componentName")),
        vendorUrl: String(data.get("vendorUrl")),
        projectUseCase: String(data.get("projectUseCase")),
        quantity: Number(data.get("quantity")),
        urgency: String(data.get("urgency")) as "routine" | "soon" | "blocking",
        budgetBand: String(data.get("budgetBand")),
        notes: String(data.get("notes")),
        email: String(data.get("email")),
        turnstileToken: String(data.get("cf-turnstile-response"))
      });
      setSubmitted(true);
      form.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Request could not be submitted.");
    }
  }

  return (
    <>
      <PageHeader
        meta="Public component request · email verified"
        title="Put a missing component on the lab’s radar."
        description="Tell us what blocks a real build. A verified request can gather member support, but staff makes the purchasing decision."
        actions={<Link className="button button-quiet" to="/components">Browse components</Link>}
      />
      <Section
        number="01"
        title="Request a component"
        lede="Your email is used only to verify this request and is never shown in the public or member request feed."
      >
        {verification === "checking" && <p className="success-message">Verifying your request link…</p>}
        {verification === "verified" && <p className="success-message" role="status">Request verified and published for member review.</p>}
        {verification === "failed" && <p className="form-error" role="alert">{error}</p>}
        <form className="profile-form component-request-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              Component name
              <input name="componentName" required maxLength={160} />
            </label>
            <label>
              Vendor or product URL
              <input name="vendorUrl" type="url" placeholder="https://" />
            </label>
            <label>
              Quantity
              <input name="quantity" type="number" min="1" max="500" defaultValue="1" required />
            </label>
            <label>
              Urgency
              <select name="urgency" defaultValue="routine">
                <option value="routine">Routine</option>
                <option value="soon">Needed soon</option>
                <option value="blocking">Blocking a build</option>
              </select>
            </label>
            <label>
              Budget band
              <select name="budgetBand" defaultValue="Under Rs 10,000">
                <option>Under Rs 10,000</option>
                <option>Rs 10,000 - Rs 50,000</option>
                <option>Rs 50,000 - Rs 1,00,000</option>
                <option>Rs 1,00,000 - Rs 3,00,000</option>
                <option>Above Rs 3,00,000</option>
                <option>Unknown</option>
              </select>
            </label>
            <label>
              Verification email
              <input name="email" type="email" required autoComplete="email" />
            </label>
          </div>
          <label>
            Project or use case
            <textarea name="projectUseCase" rows={4} required maxLength={1200} />
          </label>
          <label>
            Notes
            <textarea name="notes" rows={3} maxLength={1200} />
          </label>
          <TurnstileField />
          <button className="button button-primary" type="submit" disabled={!online}>
            <PackageOpen aria-hidden="true" /> Submit request
          </button>
          {!online && <p className="form-error">Connect to submit a request.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {submitted && (
            <p className="success-message" role="status">
              {mode === "demo"
                ? "Demo verification completed and the request was published locally."
                : "Check your email. The request publishes only after the verification link is opened."}
            </p>
          )}
        </form>
      </Section>
      <Section number="02" title="What happens next" dark>
        <div className="infra-line">
          {[
            ["01", "Verify", "Open the one-use email link before it expires."],
            ["02", "Review", "Staff checks fit, safety, duplicate requests, and sourcing."],
            ["03", "Support", "Members cast one vote per verified request."],
            ["04", "Decide", "Staff records approved, ordered, available, or declined."],
            ["05", "Stock", "Purchased items enter the audited inventory ledger."]
          ].map(([number, title, copy]) => (
            <div key={number}>
              <span className="mono">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

export function ComponentRequestsPage() {
  const { currentMember, online } = useApp();
  const { inventory, voteForRequest } = useInventory();
  const [error, setError] = useState("");

  return (
    <>
      <PageHeader
        meta="Member component requests · one vote each"
        title="Back the parts that unblock useful work."
        description="Votes help staff prioritize shared value. Approval and purchasing remain staff decisions."
        actions={<Link className="button button-primary" to="/components/request">Request a component</Link>}
      />
      <section className="workspace-metrics">
        <div className="wrap metric-grid three">
          <Metric label="Verified requests" value={inventory.requests.length} />
          <Metric label="Approved or ordered" value={inventory.requests.filter((request) => ["approved", "ordered"].includes(request.status)).length} />
          <Metric label="Available" value={inventory.requests.filter((request) => request.status === "available").length} />
        </div>
      </section>
      <Section number="01" title="Request queue">
        <div className="request-list">
          {inventory.requests.map((request) => {
            const voted = Boolean(currentMember && request.voterIds.includes(currentMember.id));
            return (
              <article key={request.id}>
                <div>
                  <span className="mono">{format(parseISO(request.createdAt), "d MMM yyyy")} · {request.urgency}</span>
                  <h3>{request.componentName}</h3>
                  <p>{request.projectUseCase}</p>
                  <div className="resource-meta mono">
                    <span>Qty {request.quantity}</span>
                    <span>{request.budgetBand}</span>
                    <span>{request.voteCount} vote{request.voteCount === 1 ? "" : "s"}</span>
                  </div>
                  {request.vendorUrl && (
                    <a href={request.vendorUrl} target="_blank" rel="noreferrer">
                      Candidate source <ExternalLink aria-hidden="true" />
                    </a>
                  )}
                </div>
                <div className="request-actions">
                  <Status tone={requestTone(request.status)}>{request.status.replace("_", " ")}</Status>
                  <button
                    className="button button-quiet"
                    type="button"
                    disabled={voted || !online}
                    onClick={() => {
                      setError("");
                      void voteForRequest(request.id).catch((reason: Error) => setError(reason.message));
                    }}
                  >
                    {voted ? <Check aria-hidden="true" /> : <ThumbsUp aria-hidden="true" />}
                    {voted ? "Voted" : "Support"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </Section>
    </>
  );
}

function AssetScanner({
  disabled,
  onScan
}: {
  disabled: boolean;
  onScan: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => controlsRef.current?.stop(), []);

  async function start() {
    if (!videoRef.current || disabled) return;
    setError("");
    setScanning(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, reason) => {
          if (result) {
            onScan(result.getText());
            controlsRef.current?.stop();
            setScanning(false);
          }
          if (reason && reason.name !== "NotFoundException") {
            setError("Camera scan interrupted.");
          }
        }
      );
    } catch (reason) {
      setScanning(false);
      setError(reason instanceof Error ? reason.message : "Camera access failed.");
    }
  }

  return (
    <div className="asset-scanner">
      <div className={`camera-frame compact ${scanning ? "scanning" : ""}`}>
        <video ref={videoRef} muted playsInline aria-label="Asset QR and DataMatrix scanner" />
        {!scanning && <div className="camera-idle"><Camera aria-hidden="true" /><span>Scanner ready</span></div>}
      </div>
      <button className="button button-quiet" type="button" onClick={start} disabled={disabled || scanning}>
        <ScanLine aria-hidden="true" /> {scanning ? "Scanning" : "Scan asset"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function CheckoutEditor({ session }: { session: CheckoutSession }) {
  const { online } = useApp();
  const { scanCheckoutItem, completeCheckout } = useInventory();
  const [assetTag, setAssetTag] = useState("");
  const [error, setError] = useState("");

  async function addTag(value = assetTag) {
    setError("");
    try {
      await scanCheckoutItem(session.id, value);
      setAssetTag("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Asset could not be added.");
    }
  }

  return (
    <div className="checkout-editor">
      <AssetScanner disabled={!online} onScan={(value) => void addTag(value)} />
      <label>
        Asset tag fallback
        <div className="inline-field">
          <input value={assetTag} onChange={(event) => setAssetTag(event.target.value)} placeholder="ARM-SEN-000123" />
          <button className="icon-button" type="button" title="Add asset tag" disabled={!assetTag || !online} onClick={() => void addTag()}>
            <PackageCheck aria-hidden="true" />
            <span className="sr-only">Add asset tag</span>
          </button>
        </div>
      </label>
      <div className="checkout-items">
        {session.items.map((item) => (
          <span className="mono" key={item.assetUnitId}>{item.assetTag}</span>
        ))}
      </div>
      <button
        className="button button-primary"
        type="button"
        disabled={!session.items.length || !online}
        onClick={() => void completeCheckout(session.id).catch((reason: Error) => setError(reason.message))}
      >
        <PackageCheck aria-hidden="true" /> Complete checkout
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

export function InventoryPage() {
  const { currentMember, mode, online, state } = useApp();
  const {
    inventory,
    createCheckout,
    returnAsset,
    createCabinetAccessIntent
  } = useInventory();
  const [error, setError] = useState("");
  const [cabinetToken, setCabinetToken] = useState("");
  const activeAttendance = state.attendance.find(
    (session) =>
      session.memberId === currentMember?.id && session.state === "open"
  );
  const memberSessions = inventory.checkoutSessions.filter(
    (session) => session.memberId === currentMember?.id
  );
  const draft = memberSessions.find((session) => session.state === "draft");
  const open = memberSessions.filter((session) => session.state === "open");

  return (
    <>
      <PageHeader
        meta="Member inventory · lab-only loans"
        title="Take a component. Keep the ledger honest."
        description="Scan durable assets before use, record their condition on return, and close every loan before checking out of the lab."
        actions={<Link className="button button-quiet" to="/components">Component catalog</Link>}
      />
      <section className="workspace-metrics">
        <div className="wrap metric-grid four">
          <Metric label="Locations" value={inventory.locations.length} />
          <Metric label="Available asset tags" value={inventory.assets.filter((asset) => asset.state === "available").length} />
          <Metric label="Your open loans" value={open.length} />
          <Metric label="Policy" value="Lab-only" />
        </div>
      </section>
      <Section number="01" title="Checkout">
        {draft ? (
          <CheckoutEditor session={draft} />
        ) : (
          <div className="operations-callout">
            <QrCode aria-hidden="true" />
            <div>
              <h3>Start a one-member checkout.</h3>
              <p>
                Serialized assets can only belong to one open checkout. Fixed
                equipment stays in the booking system.
                {mode === "supabase" && !activeAttendance
                  ? " Check in on site before starting."
                  : ""}
              </p>
              <button
                className="button button-primary"
                type="button"
                disabled={!online || (mode === "supabase" && !activeAttendance)}
                onClick={() => {
                  setError("");
                  void createCheckout("Lab-only member checkout").catch((reason: Error) => setError(reason.message));
                }}
              >
                <PackageOpen aria-hidden="true" /> Start checkout
              </button>
            </div>
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
      </Section>
      <Section number="02" title="Open loans" dark>
        {open.length ? (
          <div className="inventory-session-list">
            {open.map((session) => (
              <article key={session.id}>
                <div className="row-between">
                  <span className="mono">Due {format(parseISO(session.dueAt), "d MMM · HH:mm")}</span>
                  <Status tone="warn">Open</Status>
                </div>
                {session.items.filter((item) => !item.returnedAt).map((item) => (
                  <form
                    key={item.assetUnitId}
                    className="return-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      void returnAsset(
                        session.id,
                        item.assetTag,
                        String(form.get("condition")) as "good" | "attention" | "damaged"
                      ).catch((reason: Error) => setError(reason.message));
                    }}
                  >
                    <span className="mono">{item.assetTag}</span>
                    <span>{getComponent(item.componentSlug)?.name ?? item.componentSlug}</span>
                    <select name="condition" aria-label={`Return condition for ${item.assetTag}`} defaultValue="good">
                      <option value="good">Good</option>
                      <option value="attention">Needs attention</option>
                      <option value="damaged">Damaged</option>
                    </select>
                    <button className="button button-quiet" type="submit" disabled={!online}>
                      <RotateCcw aria-hidden="true" /> Return
                    </button>
                  </form>
                ))}
              </article>
            ))}
          </div>
        ) : <EmptyState title="No open loans">Your lab checkout is clear.</EmptyState>}
      </Section>
      <Section number="03" title="Exact stock">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Component</th><th>Class</th><th>Available / on hand</th><th>Location</th><th>Reorder at</th></tr></thead>
            <tbody>
              {inventory.lots.map((lot) => (
                <tr key={lot.id}>
                  <th><Link to={`/components/${lot.componentSlug}`}>{getComponent(lot.componentSlug)?.name ?? lot.componentSlug}</Link></th>
                  <td>{lot.inventoryClass.replaceAll("_", " ")}</td>
                  <td>{lot.quantityAvailable} / {lot.quantityOnHand} {lot.unit}</td>
                  <td>{locationName(inventory.locations, lot.locationId)}</td>
                  <td>{lot.reorderLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      {inventory.cabinets.length > 0 && (
        <Section number="04" title="Smart cabinet access" dark>
          <div className="operations-callout">
            <QrCode aria-hidden="true" />
            <div>
              <h3>Issue a one-use cabinet code.</h3>
              <p>The code expires in 60 seconds and works only while you are checked in at the cabinet’s location.</p>
              <button
                className="button button-primary"
                type="button"
                disabled={!online || (mode === "supabase" && !activeAttendance)}
                onClick={() => {
                  setError("");
                  void createCabinetAccessIntent(inventory.cabinets[0].id)
                    .then((intent) => setCabinetToken(intent.token))
                    .catch((reason: Error) => setError(reason.message));
                }}
              >
                <QrCode aria-hidden="true" /> Generate access code
              </button>
            </div>
          </div>
          {cabinetToken && <p className="demo-token mono">armature://cabinet?token={cabinetToken}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </Section>
      )}
    </>
  );
}

export function AdminComponentsPage() {
  return (
    <>
      <OperationsHeader>Component catalog</OperationsHeader>
      <Section number="01" title="Catalog records" lede="Each offer is a dated, manually refreshed snapshot. Variants remain separate.">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Component</th><th>Category</th><th>Target</th><th>Availability</th><th>PO state</th></tr></thead>
            <tbody>
              {components.map((component) => (
                <tr key={component.slug}>
                  <th><Link to={`/components/${component.slug}`}>{component.name}</Link></th>
                  <td>{component.category}</td>
                  <td>{component.quantityTarget} {component.quantityUnit}</td>
                  <td><Status tone={component.availability === "available" ? "good" : component.availability === "low_stock" ? "warn" : "bad"}>{component.availability.replace("_", " ")}</Status></td>
                  <td>{component.validationState.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

export function AdminInventoryPage() {
  const { online } = useApp();
  const { inventory, adjustStock } = useInventory();
  const [error, setError] = useState("");

  return (
    <>
      <OperationsHeader>Inventory ledger</OperationsHeader>
      <section className="workspace-metrics">
        <div className="wrap metric-grid three">
          <Metric label="Lots" value={inventory.lots.length} />
          <Metric label="Serialized assets" value={inventory.assets.length} />
          <Metric label="Needs attention" value={inventory.assets.filter((asset) => asset.state === "maintenance").length} />
        </div>
      </section>
      <Section number="01" title="Stock adjustment" lede="Every adjustment needs a reason and becomes an immutable inventory movement.">
        <form
          className="profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            const form = new FormData(event.currentTarget);
            void adjustStock(
              String(form.get("lotId")),
              Number(form.get("delta")),
              String(form.get("reason"))
            ).catch((reason: Error) => setError(reason.message));
          }}
        >
          <div className="form-grid">
            <label>Inventory lot<select name="lotId" required defaultValue=""><option value="" disabled>Select a lot</option>{inventory.lots.map((lot) => <option key={lot.id} value={lot.id}>{getComponent(lot.componentSlug)?.name ?? lot.componentSlug} · {locationName(inventory.locations, lot.locationId)}</option>)}</select></label>
            <label>Quantity change<input name="delta" type="number" required /></label>
            <label>Required reason<input name="reason" required /></label>
          </div>
          <button className="button button-primary" type="submit" disabled={!online}><Boxes aria-hidden="true" /> Record movement</button>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      </Section>
      <Section number="02" title="Serialized assets" dark>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Asset ID</th><th>Component</th><th>State</th><th>Condition</th><th>Location</th></tr></thead>
            <tbody>{inventory.assets.map((asset) => <tr key={asset.id}><th className="mono">{asset.assetTag}</th><td>{getComponent(asset.componentSlug)?.name ?? asset.componentSlug}</td><td>{asset.state.replace("_", " ")}</td><td>{asset.condition}</td><td>{locationName(inventory.locations, asset.locationId)}</td></tr>)}</tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

export function AdminComponentRequestsPage() {
  const { online } = useApp();
  const { inventory, setRequestStatus } = useInventory();
  const [error, setError] = useState("");

  return (
    <>
      <OperationsHeader>Component requests</OperationsHeader>
      <Section number="01" title="Verified request triage" lede="Duplicate requests may be merged, but purchasing authority always remains with staff.">
        <div className="request-list">
          {inventory.requests.map((request) => (
            <article key={request.id}>
              <div>
                <span className="mono">{request.voteCount} votes · {request.urgency}</span>
                <h3>{request.componentName}</h3>
                <p>{request.projectUseCase}</p>
              </div>
              <label>
                Decision status
                <select
                  value={request.status}
                  disabled={!online}
                  onChange={(event) => {
                    setError("");
                    void setRequestStatus(request.id, event.target.value as ComponentRequestStatus)
                      .catch((reason: Error) => setError(reason.message));
                  }}
                >
                  {requestStatuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                </select>
              </label>
            </article>
          ))}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </Section>
    </>
  );
}

const cabinetPilotParts = [
  ["India-compatible UHF EPC Gen2 reader", "1"],
  ["UHF antennas", "2"],
  ["Mixed EPC Gen2 tags", "100"],
  ["Thermal label printer", "1"],
  ["Wired 2D scanner", "1"],
  ["Item-facing cameras", "2"],
  ["Controlled cabinet lighting", "1 set"],
  ["Door sensors", "8"],
  ["Load-cell + HX711 pairs", "8"],
  ["ESP32 gateway", "1"],
  ["PoE power and network", "1 set"],
  ["UPS", "1"]
];

function CabinetPilotHardware() {
  return (
    <Section number="02" title="Pilot hardware" dark>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Component</th><th>Quantity</th><th>Role</th></tr></thead>
          <tbody>{cabinetPilotParts.map(([name, quantity]) => <tr key={name}><th>{name}</th><td>{quantity}</td><td>{name.includes("camera") ? "Private count and condition evidence" : "Transaction authority or reconciliation signal"}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="privacy-note">No facial recognition. Cameras frame hands and components. Routine evidence is retained privately for 30 days; flagged discrepancies for 180 days.</p>
    </Section>
  );
}

export function AdminCabinetsPage() {
  const { mode, online } = useApp();
  const {
    inventory,
    createCabinetAccessIntent,
    simulateCabinetEvent
  } = useInventory();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const cabinet = inventory.cabinets[0];

  if (!cabinet) {
    return (
      <>
        <OperationsHeader>Smart cabinet pilot</OperationsHeader>
        <Section number="01" title="No cabinet enrolled">
          <EmptyState title="Enroll the pilot device first">
            Create the cabinet device record, bind it to an active lab location,
            then use signed hardware events for production reconciliation.
          </EmptyState>
        </Section>
        <CabinetPilotHardware />
      </>
    );
  }

  async function simulate(kind: CabinetEvent["kind"], value: string, flagged = false) {
    setError("");
    try {
      await simulateCabinetEvent(cabinet.id, kind, value, flagged);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Cabinet event failed.");
    }
  }

  return (
    <>
      <OperationsHeader>Smart cabinet pilot</OperationsHeader>
      <section className="workspace-metrics">
        <div className="wrap metric-grid four">
          <Metric label="Pilot" value={cabinet.name} />
          <Metric label="State" value={cabinet.state} />
          <Metric label="Sensors" value="RFID + door + load" />
          <Metric label="Vision" value="Evidence only" />
        </div>
      </section>
      <Section number="01" title="Simulated transaction window" lede="Test reconciliation before any hardware is attached. RFID establishes movement; camera evidence never becomes sole ledger authority.">
        <div className="cabinet-controls">
          <button className="button button-primary" type="button" disabled={!online} onClick={() => void createCabinetAccessIntent(cabinet.id).then((intent) => setToken(intent.token)).catch((reason: Error) => setError(reason.message))}><QrCode aria-hidden="true" /> Issue 60-second access QR</button>
          <button className="button button-quiet" type="button" disabled={!online || mode === "supabase"} onClick={() => void simulate("door", "open")}><DoorOpen aria-hidden="true" /> Door open</button>
          <button className="button button-quiet" type="button" disabled={!online || mode === "supabase"} onClick={() => void simulate("rfid", "ARM-SEN-000123 removed")}><Radio aria-hidden="true" /> RFID movement</button>
          <button className="button button-quiet" type="button" disabled={!online || mode === "supabase"} onClick={() => void simulate("weight", "bin-03 -38g")}><Archive aria-hidden="true" /> Weight delta</button>
          <button className="button button-quiet" type="button" disabled={!online || mode === "supabase"} onClick={() => void simulate("camera", "condition frame captured")}><Camera aria-hidden="true" /> Camera evidence</button>
          <button className="button button-quiet" type="button" disabled={!online || mode === "supabase"} onClick={() => void simulate("reconciliation", "ledger matched")}><Check aria-hidden="true" /> Reconcile</button>
          <button className="button button-quiet" type="button" disabled={!online || mode === "supabase"} onClick={() => void simulate("reconciliation", "RFID and weight mismatch", true)}><AlertTriangle aria-hidden="true" /> Flag mismatch</button>
        </div>
        {token && <p className="demo-token mono">armature://cabinet?token={token}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="cabinet-event-log">
          {inventory.cabinetEvents.slice(0, 12).map((event) => (
            <div key={event.id}>
              <Status tone={event.flagged ? "bad" : "good"}>{event.kind}</Status>
              <span>{event.value}</span>
              <time className="mono">{format(parseISO(event.createdAt), "HH:mm:ss")}</time>
            </div>
          ))}
        </div>
      </Section>
      <CabinetPilotHardware />
    </>
  );
}
