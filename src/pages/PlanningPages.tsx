import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calculator,
  Camera,
  CheckCircle2,
  Cpu,
  ExternalLink,
  HardDrive,
  ShieldAlert
} from "lucide-react";
import { Link } from "react-router-dom";
import { Field, Metric, PageHeader, Section, Status } from "../components/Primitives";
import {
  componentOffers,
  components,
  isOfferStale,
  procurementGroups
} from "../data/components";
import type { ComponentOffer, ComponentOfferStockState } from "../types/domain";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const procurementIcons = {
  storage: HardDrive,
  compute: Cpu,
  camera: Camera,
  safety: ShieldAlert
};

const auditedOffersByVendor = Array.from(
  new Set(componentOffers.map((offer) => offer.vendor))
).map((vendor) => ({
  vendor,
  offers: componentOffers.filter((offer) => offer.vendor === vendor)
}));

export function FinancialsPage() {
  const [capexPhase, setCapexPhase] = useState<50 | 75>(50);
  const [rent, setRent] = useState(300000);
  const [starters, setStarters] = useState(10);
  const [starterFee, setStarterFee] = useState(4000);
  const [builders, setBuilders] = useState(12);
  const [builderFee, setBuilderFee] = useState(12000);
  const [companies, setCompanies] = useState(3);
  const [companyFee, setCompanyFee] = useState(150000);
  const [workshops, setWorkshops] = useState(2);
  const [workshopFee, setWorkshopFee] = useState(80000);
  const [services, setServices] = useState(0);
  const [serviceFee, setServiceFee] = useState(75000);
  const [dataCentreBuilds, setDataCentreBuilds] = useState(1);
  const [dataCentreMargin, setDataCentreMargin] = useState(400000);
  const [programs, setPrograms] = useState(1);
  const [programFee, setProgramFee] = useState(150000);
  const [hourlyEvents, setHourlyEvents] = useState(100000);
  const figures = useMemo(() => {
    const streams = [
      { label: "Starters", value: starters * starterFee, color: "#D6BF92" },
      { label: "Serious builders", value: builders * builderFee, color: "#F4C56E" },
      { label: "Companies", value: companies * companyFee, color: "#E89A2C" },
      { label: "Services", value: services * serviceFee, color: "#7A9460" },
      { label: "Workshops", value: workshops * workshopFee, color: "#B97516" },
      { label: "Data-centre builds", value: Math.round((dataCentreBuilds * dataCentreMargin) / 3), color: "#E8D7B3" },
      { label: "Programs", value: programs * programFee, color: "#3F5430" },
      { label: "Hourly + events", value: hourlyEvents, color: "#6B7585" }
    ];
    const revenue = streams.reduce((sum, stream) => sum + stream.value, 0);
    const opex = rent + 465000;
    const cash = revenue - opex;
    const depreciation = Math.round((capexPhase * 100000) / 48);
    const full = cash - depreciation;
    return { streams, revenue, opex, cash, depreciation, full };
  }, [
    capexPhase,
    rent,
    starters,
    starterFee,
    builders,
    builderFee,
    companies,
    companyFee,
    workshops,
    workshopFee,
    services,
    serviceFee,
    dataCentreBuilds,
    dataCentreMargin,
    programs,
    programFee,
    hourlyEvents
  ]);

  return (
    <>
      <PageHeader
        meta="Financial model · planning estimates"
        title="The lab as a business."
        description="Move the controls and see the operating shape change. These are planning estimates, not vendor quotes, financial advice, or a substitute for an accountant."
      />
      <Section number="01" title="Configure the lab">
        <div className="calculator-layout">
          <form className="controls-panel" onSubmit={(event) => event.preventDefault()}>
            <div className="panel-title"><Calculator aria-hidden="true" /><h3>Monthly assumptions</h3></div>
            <div className="financial-controls-grid">
              <div className="financial-control-group">
                <span className="mono">Floor and capex</span>
                <Field label="Capex phase">
                  <select
                    value={capexPhase}
                    onChange={(event) => setCapexPhase(Number(event.target.value) as 50 | 75)}
                  >
                    <option value={50}>Phase 1 · lean launch (~Rs 50 L)</option>
                    <option value={75}>Phase 2 · full build (~Rs 75 L)</option>
                  </select>
                </Field>
                <RangeField label="Monthly rent" min={150000} max={500000} step={25000} value={rent} setValue={setRent} format={inr.format} />
                <RangeField label="Hourly usage + events" min={0} max={300000} step={10000} value={hourlyEvents} setValue={setHourlyEvents} format={inr.format} />
              </div>
              <div className="financial-control-group">
                <span className="mono">Members</span>
                <RangeField label="Individual starters" min={0} max={30} step={1} value={starters} setValue={setStarters} />
                <RangeField label="Starter fee / month" min={2000} max={8000} step={500} value={starterFee} setValue={setStarterFee} format={inr.format} />
                <RangeField label="Serious builders" min={0} max={25} step={1} value={builders} setValue={setBuilders} />
                <RangeField label="Serious fee / month" min={8000} max={20000} step={1000} value={builderFee} setValue={setBuilderFee} format={inr.format} />
              </div>
              <div className="financial-control-group">
                <span className="mono">Companies and services</span>
                <RangeField label="Company tenants" min={0} max={8} step={1} value={companies} setValue={setCompanies} />
                <RangeField label="Company package / month" min={100000} max={400000} step={25000} value={companyFee} setValue={setCompanyFee} format={inr.format} />
                <RangeField label="Physical AI service sites" min={0} max={10} step={1} value={services} setValue={setServices} />
                <RangeField label="Service fee / site / month" min={40000} max={150000} step={5000} value={serviceFee} setValue={setServiceFee} format={inr.format} />
              </div>
              <div className="financial-control-group">
                <span className="mono">Programs and builds</span>
                <RangeField label="Workshops / month" min={0} max={8} step={1} value={workshops} setValue={setWorkshops} />
                <RangeField label="Gross / workshop" min={40000} max={150000} step={10000} value={workshopFee} setValue={setWorkshopFee} format={inr.format} />
                <RangeField label="Data-centre builds / quarter" min={0} max={8} step={1} value={dataCentreBuilds} setValue={setDataCentreBuilds} />
                <RangeField label="Margin / data-centre build" min={100000} max={1500000} step={50000} value={dataCentreMargin} setValue={setDataCentreMargin} format={inr.format} />
                <RangeField label="Programs / month" min={0} max={6} step={1} value={programs} setValue={setPrograms} />
                <RangeField label="Value / program" min={50000} max={500000} step={25000} value={programFee} setValue={setProgramFee} format={inr.format} />
              </div>
            </div>
          </form>
          <div className="results-panel" aria-live="polite">
            <div className="panel-title"><CheckCircle2 aria-hidden="true" /><h3>Monthly result</h3></div>
            <div className="metric-grid">
              <Metric label="Revenue" value={inr.format(figures.revenue)} note="Across active streams" />
              <Metric label="Cash opex" value={inr.format(figures.opex)} note="Rent plus baseline operations" />
              <Metric label="Cash result" value={inr.format(figures.cash)} note="Before equipment depreciation" />
              <Metric label="Incl. depreciation" value={inr.format(figures.full)} note={`${inr.format(figures.depreciation)} / month over four years`} />
            </div>
            <div className="revenue-bar" aria-label="Revenue mix">
              {figures.streams.map(({ label, value, color }) => (
                <i
                  key={label}
                  title={`${label}: ${inr.format(value)}`}
                  style={{
                    width: `${figures.revenue ? (value / figures.revenue) * 100 : 0}%`,
                    background: color
                  }}
                />
              ))}
            </div>
            <div className="revenue-legend mono">
              {figures.streams.map((stream) => (
                <span key={stream.label}><i style={{ background: stream.color }} />{stream.label}</span>
              ))}
            </div>
            <p className="estimate-note">
              {figures.full >= 0
                ? `This scenario covers cash opex and ${capexPhase === 50 ? "Phase 1" : "the full build"} depreciation.`
                : figures.cash >= 0
                  ? "This scenario clears cash break-even but does not yet cover equipment depreciation."
                  : `Cash break-even gap: ${inr.format(Math.abs(figures.cash))} per month.`}
            </p>
          </div>
        </div>
      </Section>
      <Section number="02" title="The fixed operating floor" dark>
        <div className="metric-grid four">
          <Metric label="Phase 1 capex" value="~Rs 50 L" />
          <Metric label="Full build capex" value="~Rs 75 L" />
          <Metric label="Cash opex" value="~Rs 7.65 L / mo" />
          <Metric label="Tenant anchor" value="2-3 companies" />
        </div>
      </Section>
      <Section
        number="03"
        title="What the capex buys"
        lede="Phase 1 opens a complete working lab. Phase 2 expands capacity only after utilization and tenant demand justify it."
      >
        <div className="table-wrap">
          <table>
            <thead><tr><th>Category</th><th>Phase 1 · lean (~Rs 50 L)</th><th>Phase 2 adds (~Rs 25 L)</th></tr></thead>
            <tbody>
              <tr><th>Compute and AI</th><td>DGX Spark, RTX workstation, six Jetson kits, ten Pi-class controllers, NAS, and networking.</td><td>Second RTX workstation and capacity upgrades.</td></tr>
              <tr><th>3D printing</th><td>Three complementary FDM printers, resin workflow, wash/cure, and material stock.</td><td>Industrial FDM capacity and laser cutting.</td></tr>
              <tr><th>Machine shop</th><td>Drill press, grinder, hand tools, power tools, and metrology.</td><td>Benchtop CNC and upgraded extraction.</td></tr>
              <tr><th>Electronics + PCB</th><td>Four ESD benches, soldering stations, scope, supplies, and stocked components.</td><td>Reflow, pick-and-place, another scope, and deeper stock.</td></tr>
              <tr><th>Sensors</th><td>Depth cameras, 2D LiDAR, IMUs, calibration targets, and camera rigs.</td><td>3D LiDAR, RTK GNSS, force/torque, and tactile equipment.</td></tr>
              <tr><th>Robotics</th><td>Collaborative arm, drone cage, starter drones, and low-cost training arms.</td><td>Additional arms, an AMR, and larger autonomy rigs.</td></tr>
              <tr><th>Fit-out</th><td>Five boards, three-phase service, UPS, HVAC, extraction, nine cameras, access control, fire safety, and furniture.</td><td>More lockers, AV, and operating capacity.</td></tr>
            </tbody>
          </table>
        </div>
      </Section>
      <Section
        number="04"
        title="Where the monthly money goes"
        lede="The baseline remains about Rs 7.65 lakh per month at the default rent assumption."
        dark
      >
        <div className="table-wrap">
          <table>
            <thead><tr><th>Line item</th><th>Monthly</th><th>Planning note</th></tr></thead>
            <tbody>
              <tr><th>Rent</th><td>{inr.format(rent)}</td><td>Controlled in the calculator.</td></tr>
              <tr><th>Electricity</th><td>Rs 1,00,000</td><td>Commercial power with HVAC as the dominant load.</td></tr>
              <tr><th>Staff</th><td>Rs 1,50,000</td><td>Lab manager, technician, and front-desk/community coverage.</td></tr>
              <tr><th>Internet</th><td>Rs 20,000</td><td>Business fibre plus backup.</td></tr>
              <tr><th>Consumables</th><td>Rs 50,000</td><td>Filament, resin, solder, components, PPE, and wear parts.</td></tr>
              <tr><th>Software and cloud</th><td>Rs 25,000</td><td>CAD, simulation, licenses, and backup.</td></tr>
              <tr><th>Insurance</th><td>Rs 20,000</td><td>Equipment and public liability.</td></tr>
              <tr><th>Maintenance / AMC</th><td>Rs 30,000</td><td>Servicing, calibration, and repairs.</td></tr>
              <tr><th>Marketing and events</th><td>Rs 40,000</td><td>Workshops, launches, and community programming.</td></tr>
              <tr><th>Admin and misc.</th><td>Rs 30,000</td><td>Operating reserve for routine administration.</td></tr>
            </tbody>
          </table>
        </div>
      </Section>
      <Section
        number="05"
        title="Every revenue stream has a home"
        lede="The calculator mirrors the full operating model rather than treating membership as the only business."
      >
        <div className="table-wrap">
          <table>
            <thead><tr><th>Revenue stream</th><th>Where it lives</th><th>Planning anchor</th></tr></thead>
            <tbody>
              <tr><th>Starters + serious builders</th><td>Membership · shared workstations</td><td>Rs 3.5k-15k / month</td></tr>
              <tr><th>Dedicated pods</th><td>Membership · sixteen builder pods</td><td>Rs [rate] / month</td></tr>
              <tr><th>Company tenants</th><td>Membership + Join</td><td>Rs 1.5L-4L / month per team</td></tr>
              <tr><th>Physical AI service sites</th><td>Services · on-prem deployments</td><td>Rs 40k-1.5L / site / month</td></tr>
              <tr><th>Workshops</th><td>Membership + Services · talent</td><td>Rs 5k-10k / seat</td></tr>
              <tr><th>Data-centre builds</th><td>Services · local AI infrastructure</td><td>20-30% planning margin on hardware</td></tr>
              <tr><th>Programs</th><td>Services · training, research, prototyping, and datasets</td><td>Rs 50k-5L per program</td></tr>
              <tr><th>Hourly + events</th><td>Membership bookings + venue/equipment rental</td><td>Per booking</td></tr>
            </tbody>
          </table>
        </div>
        <p className="estimate-note">
          These figures are planning estimates, not quotes or financial advice. Confirm equipment, tariffs, tax, and funding assumptions before committing capital.
        </p>
      </Section>
    </>
  );
}

function RangeField({
  label,
  min,
  max,
  step,
  value,
  setValue,
  format = String
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  setValue: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <Field label={`${label} · ${format(value)}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
    </Field>
  );
}

export function ProcurementPage() {
  return (
    <>
      <PageHeader
        meta="Procurement board · indicative INR planning bands"
        title="Buy for ten builders, not ten isolated labs."
        description="Five paired build stations share serious compute, storage, sensors, cameras, mobile robot bays, and stocked bench tooling. Prices are INR-first planning bands and must be refreshed before purchase."
        actions={
          <>
            <a className="button button-primary" href="#must-buy">
              Start with must-buy parts <ArrowRight aria-hidden="true" />
            </a>
            <Link className="button button-quiet" to="/components">Component catalog</Link>
            <Link className="button button-quiet" to="/projects">Project roadmap</Link>
          </>
        }
      />
      <section className="procurement-summary">
        <div className="wrap metrics-strip">
          <Metric label="Builder target" value="10 active builders" />
          <Metric label="Default layout" value="5 paired stations" />
          <Metric label="Shared compute" value="GPU + DGX + Jetson" />
          <Metric label="Rule" value="Spare motion parts" />
        </div>
      </section>
      <Section
        number="01"
        title="Five shared build stations"
        lede="Ten builders work in pairs around purpose-built cells while storage, compute, and expensive sensors remain shared."
      >
        <div className="station-grid">
          {[
            ["Station 01", "SO-ARM cell", "Leader/follower pair, two cameras, and a Jetson or workstation lane."],
            ["Station 02", "SO-ARM cell", "A second teleoperation cell for LeRobot collection and calibration practice."],
            ["Station 03", "Vision bench", "OAK-D, USB cameras, calibration boards, tags, and edge deployment."],
            ["Station 04", "Mobile robot bay", "Rovers, robot vacuums, LiDAR, RTK, motor drivers, and safety tests."],
            ["Station 05", "Infrastructure bench", "NAS, GPU queue, inventory, network, BMC, and reproducible data pipelines."]
          ].map(([number, title, copy]) => (
            <article key={number}>
              <span className="mono">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <p className="estimate-note">
          Readiness rule: establish storage, tools, cameras, and the first SO-ARM cells before advanced hands, larger drones, or rack-scale infrastructure.
        </p>
      </Section>
      <Section number="02" title="Must-buy list" lede="Storage and safe working capacity land before ambitious robotics purchases." id="must-buy">
        {procurementGroups.map((group) => {
          const Icon = procurementIcons[group.icon];
          return (
            <div className="procurement-group" key={group.title}>
              <div className="procurement-title"><Icon aria-hidden="true" /><h3>{group.title}</h3></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Item</th><th>Qty</th><th>Indicative INR</th><th>Supports</th><th>Order / source</th><th>Status</th></tr></thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.item}>
                        <th>{row.item}</th><td>{row.quantity}</td><td>{row.indicativeInr}</td><td>{row.supports}</td>
                        <td><a href={row.sourceUrl} target="_blank" rel="noreferrer">{row.sourceLabel} <ExternalLink aria-hidden="true" /></a></td>
                        <td><Status tone={row.state === "buy_first" ? "good" : "warn"}>{row.state === "buy_first" ? "Buy first" : "Validate"}</Status></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </Section>
      <Section
        number="03"
        title="Audited SKU offers"
        lede="Variants remain separate. Prices and stock were checked on 26 July 2026 and automatically flag for rechecking after 30 days."
      >
        {auditedOffersByVendor.map(({ vendor, offers }) => (
          <div className="procurement-group" key={vendor}>
            <div className="procurement-title"><ExternalLink aria-hidden="true" /><h3>{vendor}</h3></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Variant / SKU</th>
                    <th>Target</th>
                    <th>GST-inclusive</th>
                    <th>Ex-GST</th>
                    <th>Rating</th>
                    <th>Stock</th>
                    <th>Checked</th>
                    <th>Order</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => {
                    const component = components.find((item) => item.slug === offer.componentSlug);
                    const stale = isOfferStale(offer.checkedAt);
                    return (
                      <tr key={offer.id}>
                        <th>
                          <Link to={`/components/${offer.componentSlug}`}>{component?.name ?? offer.componentSlug}</Link>
                          {offer.validationNotes[0] && <><br /><small>{offer.validationNotes[0]}</small></>}
                        </th>
                        <td>
                          {offer.variant}
                          {(offer.sku || offer.mpn) && <><br /><span className="mono">{[offer.sku, offer.mpn].filter(Boolean).join(" · ")}</span></>}
                        </td>
                        <td>{component ? `${component.quantityTarget} ${component.quantityUnit}` : "—"}</td>
                        <td>{formatOfferPrice(offer.gstInclusivePriceInr)}</td>
                        <td>{formatOfferPrice(offer.exGstPriceInr)}</td>
                        <td>{formatOfferRating(offer)}</td>
                        <td><Status tone={offerStockTone(offer.stockState)}>{offerStockLabel(offer.stockState)}</Status></td>
                        <td>
                          {offer.checkedAt}
                          {stale && <><br /><Status tone="warn">Recheck price</Status></>}
                        </td>
                        <td>
                          <a href={offer.directUrl} target="_blank" rel="noreferrer">
                            Direct link <ExternalLink aria-hidden="true" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <p className="estimate-note">
          GetSet ex-GST values are derived at 18% and must be confirmed on the invoice. Thingbits rows preserve the vendor-displayed GST-inclusive and ex-GST values. Amazon ratings and review counts are listing-specific snapshots, not lab endorsements.
        </p>
      </Section>
      <Section number="04" title="GPU Autonomous Computer" dark>
        <div className="gpu-comparison">
          <article>
            <span className="mono">Recommended baseline</span>
            <h3>2 × GeForce RTX 5090 32GB</h3>
            <p>Strong CUDA throughput for robotics vision, simulation, inference, and practical fine-tuning. The chassis, PCIe lanes, thermals, and power delivery must be designed around both cards.</p>
            <strong>Buy two only after board and airflow validation.</strong>
          </article>
          <article>
            <span className="mono">High-VRAM option</span>
            <h3>1 × RTX PRO 6000 Blackwell 96GB</h3>
            <p>Use when funded workloads need much larger models, batches, or professional support. Start with a quoted single card unless a resident team pays for dedicated capacity.</p>
            <strong>Quote before purchase.</strong>
          </article>
          <article>
            <span className="mono">Shared desktop AI</span>
            <h3>1 × NVIDIA DGX Spark</h3>
            <p>A separate 128GB unified-memory desktop lane for local model work and agent experiments outside the main GPU queue.</p>
            <strong>Rs 4.5L-6L landed estimate.</strong>
          </article>
        </div>
      </Section>
      <Section number="05" title="Source discipline">
        <div className="source-grid">
          <a href="https://www.nvidia.com/en-us/products/workstations/dgx-spark/" target="_blank" rel="noreferrer"><HardDrive aria-hidden="true" /><span>NVIDIA · DGX Spark</span><ExternalLink aria-hidden="true" /></a>
          <a href="https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/nano-super-developer-kit/" target="_blank" rel="noreferrer"><Camera aria-hidden="true" /><span>NVIDIA · Jetson Orin Nano Super</span><ExternalLink aria-hidden="true" /></a>
          <a href="https://github.com/TheRobotStudio/SO-ARM100" target="_blank" rel="noreferrer"><ShieldAlert aria-hidden="true" /><span>SO-ARM · official BOM</span><ExternalLink aria-hidden="true" /></a>
          <a href="https://www.shikhar.gg/blog/gpu-pc-build" target="_blank" rel="noreferrer"><HardDrive aria-hidden="true" /><span>Local GPU rig build notes</span><ExternalLink aria-hidden="true" /></a>
        </div>
        <p className="estimate-note">Reconfirm stock, GST, landed price, warranty, and electrical requirements before issuing any purchase order.</p>
      </Section>
    </>
  );
}

function formatOfferPrice(value?: number) {
  return value === undefined ? "Quote / unavailable" : inr.format(value);
}

function formatOfferRating(offer: ComponentOffer) {
  return offer.customerRating === undefined
    ? "Not captured"
    : `${offer.customerRating.toFixed(1)} / 5 · ${offer.customerRatingCount ?? 0} ratings`;
}

function offerStockTone(stock: ComponentOfferStockState) {
  return stock === "in_stock" ? "good" : stock === "limited" ? "warn" : stock === "out_of_stock" ? "bad" : "neutral";
}

function offerStockLabel(stock: ComponentOfferStockState) {
  return {
    in_stock: "In stock",
    limited: "Limited",
    out_of_stock: "Out of stock",
    quote_required: "Quote required",
    unknown: "Unconfirmed"
  }[stock];
}
