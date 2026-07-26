import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calculator,
  Camera,
  CheckCircle2,
  ExternalLink,
  HardDrive,
  ShieldAlert
} from "lucide-react";
import { Link } from "react-router-dom";
import { Field, Metric, PageHeader, Section, Status } from "../components/Primitives";
import { procurementGroups } from "./PublicPages";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export function FinancialsPage() {
  const [rent, setRent] = useState(300000);
  const [builders, setBuilders] = useState(12);
  const [companies, setCompanies] = useState(3);
  const [workshops, setWorkshops] = useState(2);
  const [services, setServices] = useState(0);
  const figures = useMemo(() => {
    const memberRevenue = builders * 12000;
    const companyRevenue = companies * 150000;
    const workshopRevenue = workshops * 80000;
    const serviceRevenue = services * 75000;
    const revenue = memberRevenue + companyRevenue + workshopRevenue + serviceRevenue + 100000;
    const opex = rent + 465000;
    const cash = revenue - opex;
    const full = cash - Math.round(7500000 / 60);
    return { memberRevenue, companyRevenue, workshopRevenue, serviceRevenue, revenue, opex, cash, full };
  }, [rent, builders, companies, workshops, services]);

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
            <RangeField label="Rent" min={150000} max={500000} step={25000} value={rent} setValue={setRent} format={inr.format} />
            <RangeField label="Serious builders" min={0} max={25} step={1} value={builders} setValue={setBuilders} />
            <RangeField label="Company tenants" min={0} max={8} step={1} value={companies} setValue={setCompanies} />
            <RangeField label="Workshops" min={0} max={8} step={1} value={workshops} setValue={setWorkshops} />
            <RangeField label="Managed service sites" min={0} max={10} step={1} value={services} setValue={setServices} />
          </form>
          <div className="results-panel" aria-live="polite">
            <div className="panel-title"><CheckCircle2 aria-hidden="true" /><h3>Monthly result</h3></div>
            <div className="metric-grid">
              <Metric label="Revenue" value={inr.format(figures.revenue)} note="Across active streams" />
              <Metric label="Cash opex" value={inr.format(figures.opex)} note="Rent plus baseline operations" />
              <Metric label="Cash result" value={inr.format(figures.cash)} note="Before equipment depreciation" />
              <Metric label="Incl. depreciation" value={inr.format(figures.full)} note="Full build over five years" />
            </div>
            <div className="revenue-bar" aria-label="Revenue mix">
              {[
                ["members", figures.memberRevenue, "#E89A2C"],
                ["companies", figures.companyRevenue, "#C44A2A"],
                ["workshops", figures.workshopRevenue, "#3F5430"],
                ["services", figures.serviceRevenue, "#6B7585"]
              ].map(([label, value, color]) => (
                <i
                  key={String(label)}
                  title={`${label}: ${inr.format(Number(value))}`}
                  style={{
                    width: `${figures.revenue ? (Number(value) / figures.revenue) * 100 : 0}%`,
                    background: String(color)
                  }}
                />
              ))}
            </div>
            <p className="estimate-note">
              Break-even depends mainly on two to three company tenants plus members,
              pods, workshops, programs, and data-centre builds.
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
      <Section number="01" title="Must-buy list" lede="Storage and safe working capacity land before ambitious robotics purchases." id="must-buy">
        {procurementGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div className="procurement-group" key={group.title}>
              <div className="procurement-title"><Icon aria-hidden="true" /><h3>{group.title}</h3></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Item</th><th>Qty</th><th>Indicative INR</th><th>Supports</th><th>Order / source</th><th>Status</th></tr></thead>
                  <tbody>
                    {group.rows.map((row, index) => (
                      <tr key={row[0]}>
                        <th>{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td>
                        <td><a href={row[5]} target="_blank" rel="noreferrer">{row[4]} <ExternalLink aria-hidden="true" /></a></td>
                        <td><Status tone={index < 4 ? "good" : "warn"}>{index < 4 ? "Buy first" : "Validate"}</Status></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </Section>
      <Section number="02" title="GPU Autonomous Computer" dark>
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
      <Section number="03" title="Source discipline">
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
