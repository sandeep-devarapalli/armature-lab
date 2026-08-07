import { useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  ArrowRight,
  Boxes,
  Cable,
  Clock3,
  LockKeyhole,
  PackageCheck,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  ShoppingBasket,
  Wrench
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link, NavLink } from "react-router-dom";
import {
  EmptyState,
  Metric,
  PageHeader,
  Section,
  Status
} from "../components/Primitives";
import { OperationsHeader } from "./AdminPages";
import { useApp } from "../context/AppContext";
import { useInventory } from "../context/InventoryContext";
import {
  consumableItems,
  lockerOfferings,
  toolkitTemplates
} from "../data/makerServices";
import type {
  ConsumableOrderLine,
  LockerPlanTerm,
  ServiceAvailability,
  ToolkitRentalPlan
} from "../types/makerServices";

function availabilityTone(value: ServiceAvailability) {
  if (value === "available") return "good" as const;
  if (value === "limited") return "warn" as const;
  return "bad" as const;
}

function consumableName(slug: string) {
  return consumableItems.find((item) => item.slug === slug)?.name ?? slug;
}

function toolkitName(slug: string) {
  return toolkitTemplates.find((toolkit) => toolkit.slug === slug)?.name ?? slug;
}

function MakerDeskMetrics() {
  return (
    <div className="metrics-strip">
      <Metric label="Locker sizes" value={lockerOfferings.length} />
      <Metric label="Bench-stock lines" value={consumableItems.length} />
      <Metric label="Portable toolkit types" value={toolkitTemplates.length} />
      <Metric label="Payment" value="At the tool desk" />
    </div>
  );
}

function MakerDeskNav() {
  return (
    <nav className="maker-desk-nav" aria-label="Maker desk sections">
      <div className="wrap">
        <NavLink to="/lockers"><LockKeyhole aria-hidden="true" /> Lockers</NavLink>
        <NavLink to="/consumables"><ShoppingBasket aria-hidden="true" /> Small parts</NavLink>
        <NavLink to="/toolkits"><Wrench aria-hidden="true" /> Toolkits</NavLink>
      </div>
    </nav>
  );
}

export function MakerDeskPage() {
  const { currentMember } = useApp();
  const { makerAvailability } = useInventory();
  return (
    <>
      <PageHeader
        meta="Maker desk · storage · bench stock · portable tools"
        title="Keep the project moving between bookings."
        description="Store a build securely, buy the handful of small parts it needs, and rent a complete tagged toolkit instead of carrying a workshop in your backpack."
        actions={
          currentMember ? (
            <Link className="button button-primary" to="/lockers">
              Open member maker desk <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <Link className="button button-primary" to="/auth">
              Sign in to use the maker desk <ArrowRight aria-hidden="true" />
            </Link>
          )
        }
      >
        <MakerDeskMetrics />
      </PageHeader>
      {currentMember && <MakerDeskNav />}

      <Section
        number="01"
        title="Lockers that match the build"
        lede="Subscribe for a week, month, or year. Staff assigns the physical unit after checking size and storage safety."
      >
        <div className="maker-offering-grid">
          {lockerOfferings.map((offering) => {
            const availability =
              makerAvailability.lockers[offering.slug] ?? offering.availability;
            return (
            <article key={offering.slug}>
              <div className="row-between">
                <span className="mono">{offering.size} locker</span>
                <Status tone={availabilityTone(availability)}>
                  {availability}
                </Status>
              </div>
              <LockKeyhole aria-hidden="true" />
              <h3>{offering.name}</h3>
              <p>{offering.description}</p>
              <ul className="plain-list">
                {offering.suitedFor.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <div className="plan-chips mono">
                {offering.plans.map((plan) => (
                  <span key={plan.term}>{plan.label} · {plan.rate}</span>
                ))}
              </div>
            </article>
            );
          })}
        </div>
        <div className="section-actions">
          <Link className="button button-quiet" to={currentMember ? "/lockers" : "/auth"}>
            Request secure storage <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </Section>

      <Section
        number="02"
        title="Buy only the small parts you need"
        lede="Common fasteners, wire, connectors, protection, and prototyping stock are available in build-sized quantities for pickup at the tool desk."
        dark
      >
        <div className="maker-stock-board">
          {consumableItems.map((item) => {
            const availability =
              makerAvailability.consumables[item.slug] ?? item.availability;
            return (
            <div key={item.slug}>
              <span className="mono">{item.category}</span>
              <strong>{item.name}</strong>
              <small>{item.purchaseUnit}</small>
              <Status tone={availabilityTone(availability)}>
                {availability}
              </Status>
            </div>
            );
          })}
        </div>
        <div className="section-actions">
          <Link className="button button-primary" to={currentMember ? "/consumables" : "/auth"}>
            Build a pickup order <ShoppingBasket aria-hidden="true" />
          </Link>
        </div>
      </Section>

      <Section
        number="03"
        title="A complete toolbox, checked and ready"
        lede="Each portable kit has a durable asset tag, a contents checklist, a due time, and a condition-controlled return."
      >
        <div className="toolkit-grid">
          {toolkitTemplates.map((toolkit) => {
            const availability =
              makerAvailability.toolkits[toolkit.slug] ?? toolkit.availability;
            return (
            <article key={toolkit.slug}>
              <div className="row-between">
                <span className="mono">{toolkit.rentalPlans.map((plan) => plan.period).join(" · ")}</span>
                <Status tone={availabilityTone(availability)}>
                  {availability}
                </Status>
              </div>
              <Wrench aria-hidden="true" />
              <h3>{toolkit.name}</h3>
              <p>{toolkit.description}</p>
              <ul className="plain-list">
                {toolkit.includedContents.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
              </ul>
              <span className="mono">
                {toolkit.requiredCertification ?? "Standard member access"}
              </span>
            </article>
            );
          })}
        </div>
        <div className="section-actions">
          <Link className="button button-quiet" to={currentMember ? "/toolkits" : "/auth"}>
            Rent a toolkit <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </Section>

      <Section number="04" title="One clean operating path" dark>
        <div className="process-list">
          {[
            ["01", "Choose", "Select a locker term, consumable quantities, or a portable toolkit."],
            ["02", "Confirm", "Staff assigns storage, picks bench stock, or verifies the tagged kit."],
            ["03", "Build", "Use everything inside the lab’s safety and attendance boundary."],
            ["04", "Close", "Collect the order, clear the locker at expiry, and return every toolkit item."],
            ["05", "Audit", "Stock movement, condition evidence, and staff overrides remain traceable."]
          ].map(([number, title, copy]) => (
            <div className="process-row" key={number}>
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

export function LockersPage() {
  const { currentMember, online } = useApp();
  const {
    makerServices,
    makerAvailability,
    requestLocker,
    extendLocker,
    releaseLocker
  } = useInventory();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const assignments = makerServices.lockerAssignments.filter(
    (assignment) => assignment.memberId === currentMember?.id
  );
  const current = assignments.find((assignment) =>
    ["reserved", "active", "expiring"].includes(assignment.state)
  );

  async function request(event: FormEvent<HTMLFormElement>, lockerSlug: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setSaved("");
    try {
      await requestLocker(lockerSlug, String(data.get("term")) as LockerPlanTerm);
      setSaved("Locker request sent to the tool desk.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Locker request failed.");
    }
  }

  return (
    <>
      <PageHeader
        meta="Member maker desk · secure project storage"
        title="Store the build without carrying it home."
        description="Choose a locker size and term. Staff confirms the physical unit, storage rules, and access method before the assignment becomes active."
        actions={<Link className="button button-quiet" to="/maker-desk">Maker desk overview</Link>}
      >
        <div className="metrics-strip">
          <Metric label="Current assignment" value={current ? current.lockerLabel : "None"} />
          <Metric label="Terms" value="Week · month · year" />
          <Metric label="Access" value="Opening hours" />
          <Metric label="Rule" value="No live batteries" />
        </div>
      </PageHeader>
      <MakerDeskNav />

      <Section number="01" title="Your locker">
        {current ? (
          <article className="active-service-panel">
            <div>
              <span className="mono">{current.lockerLabel} · {current.planTerm}</span>
              <h3>{lockerOfferings.find((item) => item.slug === current.lockerSlug)?.name}</h3>
              <p>
                {current.state === "reserved"
                  ? "Awaiting staff assignment and storage review."
                  : `Active through ${format(parseISO(current.endsOn), "d MMM yyyy")}.`}
              </p>
            </div>
            <Status tone={current.state === "active" ? "good" : "warn"}>{current.state}</Status>
            <form
              className="inline-actions"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                setError("");
                void extendLocker(current.id, String(data.get("term")) as LockerPlanTerm)
                  .then(() => setSaved("Locker term extended."))
                  .catch((reason: Error) => setError(reason.message));
              }}
            >
              <label>
                Extend by
                <select name="term" defaultValue="month">
                  <option value="week">One week</option>
                  <option value="month">One month</option>
                  <option value="year">One year</option>
                </select>
              </label>
              <button className="button button-primary" type="submit" disabled={!online || current.state === "reserved"}>
                <Clock3 aria-hidden="true" /> Extend
              </button>
              <button
                className="button button-quiet"
                type="button"
                disabled={!online}
                onClick={() => {
                  setError("");
                  void releaseLocker(current.id)
                    .then(() => setSaved("Locker release recorded."))
                    .catch((reason: Error) => setError(reason.message));
                }}
              >
                <Archive aria-hidden="true" /> Release
              </button>
            </form>
          </article>
        ) : (
          <EmptyState title="No current locker">Choose a size below to request an assignment.</EmptyState>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        {saved && <p className="success-message">{saved}</p>}
      </Section>

      <Section
        number="02"
        title="Choose storage"
        lede="Rates remain placeholders until the lab publishes its operating tariff."
        dark
      >
        <div className="maker-offering-grid">
          {lockerOfferings.map((offering) => {
            const availability =
              makerAvailability.lockers[offering.slug] ?? offering.availability;
            return (
            <article key={offering.slug}>
              <div className="row-between">
                <span className="mono">{offering.size}</span>
                <Status tone={availabilityTone(availability)}>{availability}</Status>
              </div>
              <LockKeyhole aria-hidden="true" />
              <h3>{offering.name}</h3>
              <p>{offering.description}</p>
              <form onSubmit={(event) => void request(event, offering.slug)}>
                <label>
                  Subscription term
                  <select name="term" defaultValue="month">
                    {offering.plans.map((plan) => (
                      <option key={plan.term} value={plan.term}>
                        {plan.label} · {plan.rate}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={!online || Boolean(current) || availability === "unavailable"}
                >
                  Request {offering.size} locker
                </button>
              </form>
            </article>
            );
          })}
        </div>
      </Section>

      <Section number="03" title="Storage boundary">
        <div className="feature-grid">
          <article><ShieldCheck aria-hidden="true" /><h3>Lockable, not anonymous</h3><p>Every locker stays linked to one approved member and one physical label. Access credentials are never shown publicly.</p></article>
          <article><Boxes aria-hidden="true" /><h3>Project hardware only</h3><p>Label every box. No food, powered devices, loose cells, chemicals, or unapproved pressure vessels.</p></article>
          <article><Clock3 aria-hidden="true" /><h3>Expiry is operational</h3><p>Renew before the end date or clear the unit. Staff records every extension, release, and override.</p></article>
        </div>
      </Section>
    </>
  );
}

export function ConsumablesPage() {
  const { currentMember, online } = useApp();
  const { makerServices, makerAvailability, submitConsumableOrder } = useInventory();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const orders = makerServices.consumableOrders.filter(
    (order) => order.memberId === currentMember?.id
  );
  const selectedCount = Object.values(quantities).reduce((sum, value) => sum + value, 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lines: ConsumableOrderLine[] = consumableItems
      .filter((item) => (quantities[item.slug] ?? 0) > 0)
      .map((item) => ({
        consumableSlug: item.slug,
        quantity: quantities[item.slug],
        unit: item.purchaseUnit
      }));
    setError("");
    setSaved("");
    try {
      await submitConsumableOrder(lines);
      setQuantities({});
      setSaved("Pickup order sent to the tool desk.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Order could not be submitted.");
    }
  }

  return (
    <>
      <PageHeader
        meta="Member maker desk · low-cost bench stock"
        title="Buy the handful the prototype needs."
        description="Reserve small quantities of common fasteners, wiring, protection, and prototyping materials. Staff confirms the amount and collects payment at pickup."
        actions={<Link className="button button-quiet" to="/maker-desk">Maker desk overview</Link>}
      >
        <div className="metrics-strip">
          <Metric label="Catalog lines" value={consumableItems.length} />
          <Metric label="Selected units" value={selectedCount} />
          <Metric label="Your orders" value={orders.length} />
          <Metric label="Collection" value="Tool desk" />
        </div>
      </PageHeader>
      <MakerDeskNav />

      <Section number="01" title="Build a pickup order">
        <form onSubmit={submit}>
          <div className="table-wrap">
            <table className="consumable-table">
              <thead>
                <tr><th>Part</th><th>Category</th><th>Purchase unit</th><th>Availability</th><th>Quantity</th></tr>
              </thead>
              <tbody>
                {consumableItems.map((item) => {
                  const availability =
                    makerAvailability.consumables[item.slug] ?? item.availability;
                  return (
                  <tr key={item.slug}>
                    <th><strong>{item.name}</strong><small>{item.description}</small></th>
                    <td>{item.category}</td>
                    <td>{item.purchaseUnit}<small>{item.price}</small></td>
                    <td><Status tone={availabilityTone(availability)}>{availability}</Status></td>
                    <td>
                      <label className="quantity-field">
                        <input
                          aria-label={`Quantity for ${item.name}`}
                          type="number"
                          min="0"
                          max="25"
                          value={quantities[item.slug] ?? 0}
                          onChange={(event) => setQuantities((value) => ({
                            ...value,
                            [item.slug]: Number(event.target.value)
                          }))}
                        />
                      </label>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="order-submit-bar">
            <div><span className="mono">{selectedCount} units selected</span><p>Final quantity and amount are confirmed before desk collection.</p></div>
            <button className="button button-primary" type="submit" disabled={!online || selectedCount === 0}>
              <ShoppingBasket aria-hidden="true" /> Submit pickup order
            </button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {saved && <p className="success-message">{saved}</p>}
        </form>
      </Section>

      <Section number="02" title="Your pickup orders" dark>
        {orders.length ? (
          <div className="request-list">
            {orders.map((order) => (
              <article key={order.id}>
                <div>
                  <span className="mono">{format(parseISO(order.requestedAt), "d MMM · HH:mm")} · {order.collectionPoint}</span>
                  <h3>{order.lines.map((line) => `${line.quantity}× ${consumableName(line.consumableSlug)}`).join(", ")}</h3>
                  <p>Amount: {order.total}. Payment is collected when staff hands over the confirmed order.</p>
                </div>
                <Status tone={order.state === "ready" ? "good" : order.state === "cancelled" ? "bad" : "warn"}>{order.state}</Status>
              </article>
            ))}
          </div>
        ) : <EmptyState title="No pickup orders">Select the small parts your build needs.</EmptyState>}
      </Section>
    </>
  );
}

export function ToolkitsPage() {
  const { currentMember, online } = useApp();
  const {
    makerServices,
    makerAvailability,
    rentToolkit,
    returnToolkit
  } = useInventory();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const rentals = makerServices.toolkitRentals.filter(
    (rental) => rental.memberId === currentMember?.id
  );
  const openRentals = rentals.filter((rental) =>
    ["reserved", "checked_out", "overdue"].includes(rental.state)
  );

  async function rent(
    event: FormEvent<HTMLFormElement>,
    toolkitSlug: string
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setSaved("");
    try {
      await rentToolkit(
        toolkitSlug,
        String(data.get("period")) as ToolkitRentalPlan["period"]
      );
      setSaved("Toolkit checkout opened.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Toolkit rental failed.");
    }
  }

  return (
    <>
      <PageHeader
        meta="Member maker desk · tagged portable toolkits"
        title="Start with a toolbox that is already complete."
        description="Rent a checked, portable kit for the session. Every case has a durable tag, contents list, due time, and condition-controlled return."
        actions={<Link className="button button-quiet" to="/maker-desk">Maker desk overview</Link>}
      >
        <div className="metrics-strip">
          <Metric label="Toolkit types" value={toolkitTemplates.length} />
          <Metric label="Your open rentals" value={openRentals.length} />
          <Metric label="Use boundary" value="Lab-only" />
          <Metric label="Return" value="Before check-out" />
        </div>
      </PageHeader>
      <MakerDeskNav />

      <Section number="01" title="Your open toolkits">
        {openRentals.length ? (
          <div className="inventory-session-list">
            {openRentals.map((rental) => (
              <article key={rental.id}>
                <div className="row-between">
                  <span className="mono">{rental.assetTag} · due {format(parseISO(rental.dueAt), "d MMM · HH:mm")}</span>
                  <Status tone={rental.state === "overdue" ? "bad" : "warn"}>{rental.state}</Status>
                </div>
                <h3>{toolkitName(rental.toolkitSlug)}</h3>
                <form
                  className="return-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    setError("");
                    void returnToolkit(
                      rental.id,
                      String(data.get("condition")) as "good" | "attention" | "damaged"
                    )
                      .then(() => setSaved("Toolkit returned and condition recorded."))
                      .catch((reason: Error) => setError(reason.message));
                  }}
                >
                  <span>Check every listed tool before closing the case.</span>
                  <select name="condition" aria-label={`Return condition for ${rental.assetTag}`} defaultValue="good">
                    <option value="good">Complete and good</option>
                    <option value="attention">Needs attention</option>
                    <option value="damaged">Damaged or incomplete</option>
                  </select>
                  <button className="button button-primary" type="submit" disabled={!online}>
                    <RotateCcw aria-hidden="true" /> Return toolkit
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : <EmptyState title="No open toolkit rental">Choose a complete portable kit below.</EmptyState>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {saved && <p className="success-message">{saved}</p>}
      </Section>

      <Section
        number="02"
        title="Portable kit library"
        lede="Consumables such as solder, wire, and fasteners are ordered separately so every returned case stays complete."
        dark
      >
        <div className="toolkit-grid">
          {toolkitTemplates.map((toolkit) => {
            const availability =
              makerAvailability.toolkits[toolkit.slug] ?? toolkit.availability;
            return (
            <article key={toolkit.slug}>
              <div className="row-between">
                <span className="mono">{toolkit.kind.replaceAll("_", " ")}</span>
                <Status tone={availabilityTone(availability)}>{availability}</Status>
              </div>
              <PackageOpen aria-hidden="true" />
              <h3>{toolkit.name}</h3>
              <p>{toolkit.description}</p>
              <ul className="plain-list">
                {toolkit.includedContents.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <div className="safety-note">
                <ShieldCheck aria-hidden="true" />
                <span>{toolkit.requiredCertification ?? "Standard member access"}</span>
              </div>
              <form onSubmit={(event) => void rent(event, toolkit.slug)}>
                <label>
                  Rental period
                  <select name="period" defaultValue="session">
                    {toolkit.rentalPlans.map((plan) => (
                      <option key={plan.period} value={plan.period}>
                        {plan.period} · {plan.rate}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={!online || availability === "unavailable"}
                >
                  Rent {toolkit.name}
                </button>
              </form>
            </article>
            );
          })}
        </div>
      </Section>
    </>
  );
}

export function AdminMakerServicesPage() {
  const { state } = useApp();
  const {
    makerServices,
    assignLocker,
    setConsumableOrderStatus
  } = useInventory();
  const [error, setError] = useState("");
  const reservedLockers = makerServices.lockerAssignments.filter(
    (assignment) => assignment.state === "reserved"
  );
  const activeToolkits = makerServices.toolkitRentals.filter((rental) =>
    ["reserved", "checked_out", "overdue"].includes(rental.state)
  );
  const openOrders = makerServices.consumableOrders.filter(
    (order) => !["collected", "cancelled"].includes(order.state)
  );
  const memberNames = useMemo(
    () => new Map(state.profiles.map((profile) => [profile.id, profile.name])),
    [state.profiles]
  );

  return (
    <>
      <OperationsHeader>Maker desk</OperationsHeader>
      <Section number="01" title="Locker requests" lede="Assign one labelled physical unit after confirming size, safety, and access method.">
        {reservedLockers.length ? (
          <div className="admin-list">
            {reservedLockers.map((assignment) => (
              <article key={assignment.id}>
                <div>
                  <span className="mono">{assignment.planTerm} · {assignment.memberId}</span>
                  <h3>{lockerOfferings.find((item) => item.slug === assignment.lockerSlug)?.name}</h3>
                  <p>{memberNames.get(assignment.memberId) ?? "Approved member"} · requested through {format(parseISO(assignment.endsOn), "d MMM yyyy")}</p>
                </div>
                <form
                  className="inline-actions"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    setError("");
                    void assignLocker(assignment.id, String(data.get("lockerUnitId")))
                      .catch((reason: Error) => setError(reason.message));
                  }}
                >
                  <label>
                    Locker unit
                    <select name="lockerUnitId" required defaultValue="">
                      <option value="" disabled>Select an available unit</option>
                      {makerServices.lockerUnits
                        .filter((unit) => {
                          const offering = lockerOfferings.find(
                            (item) => item.slug === assignment.lockerSlug
                          );
                          return (
                            unit.state === "available" &&
                            (!offering || unit.size === offering.size)
                          );
                        })
                        .map((unit) => (
                          <option key={unit.id} value={unit.id}>{unit.code}</option>
                        ))}
                    </select>
                  </label>
                  <button className="button button-primary" type="submit"><LockKeyhole aria-hidden="true" /> Assign</button>
                </form>
              </article>
            ))}
          </div>
        ) : <EmptyState title="No locker requests">All current storage requests are assigned.</EmptyState>}
      </Section>

      <Section number="02" title="Consumable pickup queue" dark>
        {openOrders.length ? (
          <div className="request-list">
            {openOrders.map((order) => (
              <article key={order.id}>
                <div>
                  <span className="mono">{order.id} · {order.collectionPoint}</span>
                  <h3>{order.lines.map((line) => `${line.quantity}× ${consumableName(line.consumableSlug)}`).join(", ")}</h3>
                  <p>Confirm stock and desk amount before marking the order ready.</p>
                </div>
                <div className="request-actions">
                  <Status tone={order.state === "ready" ? "good" : "warn"}>{order.state}</Status>
                  <select
                    aria-label={`Status for ${order.id}`}
                    value={order.state}
                    onChange={(event) => {
                      setError("");
                      void setConsumableOrderStatus(
                        order.id,
                        event.target.value as typeof order.state
                      ).catch((reason: Error) => setError(reason.message));
                    }}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="ready">Ready</option>
                    <option value="collected">Collected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyState title="No pickup orders">The consumable desk queue is clear.</EmptyState>}
      </Section>

      <Section number="03" title="Toolkit custody">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Asset</th><th>Toolkit</th><th>Member</th><th>Due</th><th>State</th></tr></thead>
            <tbody>
              {activeToolkits.map((rental) => (
                <tr key={rental.id}>
                  <th className="mono">{rental.assetTag}</th>
                  <td>{toolkitName(rental.toolkitSlug)}</td>
                  <td>{rental.memberId}</td>
                  <td>{format(parseISO(rental.dueAt), "d MMM · HH:mm")}</td>
                  <td><Status tone={rental.state === "overdue" ? "bad" : "warn"}>{rental.state}</Status></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!activeToolkits.length && <EmptyState title="All toolkits accounted for">No tagged case is currently open.</EmptyState>}
        </div>
      </Section>

      <Section number="04" title="Desk controls" dark>
        <div className="feature-grid">
          <article><PackageCheck aria-hidden="true" /><h3>Count before handover</h3><p>Open the case, check every listed tool, and record any exception before the member accepts custody.</p></article>
          <article><Cable aria-hidden="true" /><h3>Sell consumables separately</h3><p>Wire, solder, fasteners, and other expended stock never disappear silently from a reusable toolkit.</p></article>
          <article><Archive aria-hidden="true" /><h3>Close storage visibly</h3><p>Record locker release, clear any abandoned material through the staff process, and retain the audit trail.</p></article>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </Section>
    </>
  );
}
