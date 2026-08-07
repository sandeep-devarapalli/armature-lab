import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BatteryCharging,
  Box,
  Cable,
  Camera,
  CircleDollarSign,
  Cpu,
  ExternalLink,
  Gauge,
  HardDrive,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench
} from "lucide-react";
import { Link } from "react-router-dom";
import { Field, PageHeader, Section, Status } from "../components/Primitives";
import { useApp } from "../context/AppContext";

const equipmentRows = [
  ["Robot arm cell", "6-axis industrial arm, safety PLC, light curtains", "3-phase 415V · interlocked", "Hazard"],
  ["Drone cage", "PX4 flight rigs, nets, spotter station, markers", "Dedicated single-phase", "Hazard"],
  ["Rapid prototyping", "3D printers, laser cutter, hand finishing", "Isolated extraction", "Fabrication"],
  ["Machine shop", "CNC, grinder, drill, metrology", "3-phase 415V", "Hazard"],
  ["Electronics", "ESD benches, scopes, supplies, soldering", "Clean grounded circuits", "Bench"],
  ["Compute", "GPU nodes, DGX Spark, Jetsons, NAS, NVR", "UPS-backed circuits", "Infrastructure"]
];

export function EquipmentPage() {
  const { state } = useApp();
  return (
    <>
      <PageHeader
        meta="Equipment · power · safety"
        title="Every zone, mapped."
        description="Each zone is mapped to its equipment, power requirement, booking rule, and safety boundary. Heavy loads stay isolated from the clean circuits that electronics and compute depend on."
        actions={
          <Link className="button button-primary" to="/book">
            Book live resources <ArrowRight aria-hidden="true" />
          </Link>
        }
      />
      <Section number="01" title="Live resource board" lede="Availability shown here follows the same resource records used by booking.">
        <div className="resource-grid">
          {state.resources.map((resource) => (
            <article className="resource-card" key={resource.id}>
              {resource.image ? (
                <img src={resource.image} alt="" loading="lazy" />
              ) : (
                <div className="resource-placeholder"><Wrench aria-hidden="true" /></div>
              )}
              <div className="resource-card-body">
                <div className="row-between">
                  <span className="mono">{resource.zone}</span>
                  <Status tone={resource.available ? "good" : "bad"}>
                    {resource.available ? "Available" : "Blocked"}
                  </Status>
                </div>
                <h3>{resource.name}</h3>
                <p>{resource.description}</p>
                <div className="resource-meta mono">
                  <span>{resource.durationMinutes} min default</span>
                  <span>{resource.capacity} people</span>
                  <span>{resource.hazardous ? "certified use" : "standard access"}</span>
                </div>
                <Link to={`/book/${resource.slug}`}>View slots <ArrowRight aria-hidden="true" /></Link>
              </div>
            </article>
          ))}
        </div>
      </Section>
      <Section number="02" title="Zone by zone" dark>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Zone</th><th>Key equipment</th><th>Power</th><th>Class</th></tr></thead>
            <tbody>
              {equipmentRows.map((row) => (
                <tr key={row[0]}>
                  <th>{row[0]}</th>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td><Status tone={row[3] === "Hazard" ? "bad" : "neutral"}>{row[3]}</Status></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

export function MembershipPage() {
  return (
    <>
      <PageHeader
        meta="Membership · access · pods"
        title="Choose the amount of floor you need."
        description="Start with shared access, add dedicated space when the build becomes real, and graduate into a company residency without moving the project out of the lab."
        actions={<Link className="button button-primary" to="/join">Apply for membership</Link>}
      />
      <Section number="01" title="Member pathways">
        <div className="plan-list">
          {[
            ["Starter", "Shared floor access, community build days, and bookable workstations.", "Rs [rate] / month", "For learning and early prototypes"],
            ["Serious builder", "More booking access, project storage, and priority workshop registration.", "Rs [rate] / month", "For a build that is moving every week"],
            ["Dedicated pod", "A persistent desk and lockable project footprint inside the working floor.", "Rs [rate] / month", "For hardware that cannot live in a backpack"],
            ["Company residency", "Pods, equipment allocation, hosted demos, and operating support for a small team.", "quoted monthly", "For 2-3 company tenants at a time"]
          ].map(([name, copy, rate, note]) => (
            <article className="plan-row" key={name}>
              <div><span className="mono">{note}</span><h3>{name}</h3></div>
              <p>{copy}</p>
              <strong>{rate}</strong>
            </article>
          ))}
        </div>
      </Section>
      <Section number="02" title="Approval and safe access" dark>
        <div className="feature-grid">
          <article><Users aria-hidden="true" /><h3>Member approval</h3><p>New accounts remain pending until staff review what they intend to build and how they will use the floor.</p></article>
          <article><ShieldCheck aria-hidden="true" /><h3>Equipment certification</h3><p>Hazardous resources unlock only after the relevant induction is issued and remains current.</p></article>
          <article><Gauge aria-hidden="true" /><h3>Usage accountability</h3><p>Every reservation has one responsible member, declared guests, and an attendance trail.</p></article>
        </div>
      </Section>
    </>
  );
}

export function ServicesPage() {
  const services = [
    [Box, "Prototyping as a service", "Brief in, working prototype out: engineering, printers, CNC, electronics, and test equipment.", "Rs 2-15 L per project"],
    [Camera, "Commissioned datasets", "Manipulation, vision, and site-specific datasets collected on lab rigs and annotated to a clear spec.", "per project"],
    [Cpu, "Local AI data centres", "PCIe-rich GPU systems specified, assembled, burn-tested, networked, and installed on your premises.", "hardware + engineering"],
    [Radio, "On-prem physical AI", "Private camera analytics, local assistants, and site-specific models that keep data inside the building.", "assessment + managed service"],
    [Wrench, "Equipment with operator", "The arm, drone cage, or camera rigs with a lab engineer driving the test and safety process.", "day rate"],
    [Sparkles, "Research residencies", "Bench, equipment, and collaboration for research professionals and corporate R&D teams.", "monthly residency"]
  ] as const;
  return (
    <>
      <PageHeader
        meta="Services · deployments · research"
        title="Build here, or bring the lab to the site."
        description="Armature combines a bookable robotics floor with engineering services for organizations that need working hardware, private AI infrastructure, or credible physical datasets."
      />
      <Section number="01" title="Build and research services">
        <div className="service-grid">
          {services.map(([Icon, title, copy, rate]) => (
            <article className="service-card" key={title}>
              <Icon aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
              <span className="mono">{rate}</span>
            </article>
          ))}
        </div>
      </Section>
      <Section number="02" title="A local AI deployment, end to end" dark>
        <div className="process-list">
          {[
            ["01", "Assess", "Cameras, workloads, privacy constraints, network, power, and operating outcomes."],
            ["02", "Pilot", "One bounded use case on-site, with a measurable acceptance test."],
            ["03", "Build", "GPU, storage, networking, models, monitoring, and recovery procedures."],
            ["04", "Operate", "Updates, capacity planning, incident review, and a path back to the working lab."]
          ].map(([number, title, copy]) => (
            <div className="process-row" key={number}><span className="mono">{number}</span><h3>{title}</h3><p>{copy}</p></div>
          ))}
        </div>
      </Section>
    </>
  );
}

export function JoinPage() {
  const { currentMember, submitApplication } = useApp();
  return (
    <>
      <PageHeader
        meta="Membership · partnerships · deployments"
        title="Bring the prototype."
        description="Tell us what you are building, what needs to move, and which part of the floor will unblock it."
      />
      <Section number="01" title="Choose a way in">
        <div className="join-grid">
          <article>
            <Users aria-hidden="true" />
            <span className="mono">Builders</span>
            <h3>Become a member</h3>
            <p>Book arms, benches, the cage, and compute. Complete inductions as the project reaches hazardous equipment.</p>
            {currentMember ? (
              <ApplicationForm onSubmit={submitApplication} />
            ) : (
              <Link className="button button-primary" to="/auth">Sign in to apply</Link>
            )}
          </article>
          <article>
            <CircleDollarSign aria-hidden="true" />
            <span className="mono">Backers</span>
            <h3>Back the lab</h3>
            <p>Sponsor hardware, a zone, or a workshop series and help builders access equipment they would not own alone.</p>
            <button className="text-link" type="button">Partnership contact to be published <ArrowRight aria-hidden="true" /></button>
          </article>
          <article>
            <Cpu aria-hidden="true" />
            <span className="mono">Businesses</span>
            <h3>Deploy physical AI</h3>
            <p>Request an on-prem GPU, camera, or local-LLM assessment backed by the engineering floor.</p>
            <button className="text-link" type="button">Assessment intake to be published <ArrowRight aria-hidden="true" /></button>
          </article>
        </div>
      </Section>
    </>
  );
}

function ApplicationForm({
  onSubmit
}: {
  onSubmit: (summary: string) => Promise<void>;
}) {
  const [working, setWorking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setSent(false);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await onSubmit(String(data.get("summary")));
      setSent(true);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Application failed."
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <form
      className="inline-form"
      onSubmit={submit}
    >
      <Field label="What are you building?">
        <textarea name="summary" required rows={4} placeholder="The prototype, its current state, and the equipment you expect to use." />
      </Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      {sent && <p className="success-message">Application submitted for staff review.</p>}
      <button className="button button-primary" type="submit" disabled={working}>{working ? "Submitting…" : "Submit for review"}</button>
    </form>
  );
}

export function NotFoundPage() {
  return (
    <PageHeader
      meta="404 · route not found"
      title="That bench is not on the floor plan."
      description="The route may have moved. Return to the lab or open the member workspace."
      actions={
        <>
          <Link className="button button-primary" to="/">The lab</Link>
          <Link className="button button-quiet" to="/dashboard">Dashboard</Link>
        </>
      }
    />
  );
}

export const procurementGroups = [
  {
    title: "Shared compute and storage",
    icon: HardDrive,
    rows: [
      ["Primary NAS / ZFS storage node", "1", "Rs 6L-10L", "Datasets, video, CAD, checkpoints, DVC", "TrueNAS", "https://www.truenas.com/"],
      ["Backup NAS / offline set", "1", "Rs 3L-6L", "Dataset survivability and recovery", "OpenZFS", "https://openzfs.org/"],
      ["10GbE switch + NIC links", "1 + 8-12", "Rs 1.5L-4L", "Shared ingest and GPU/NAS traffic", "MikroTik", "https://mikrotik.com/products/group/switches"],
      ["2-GPU autonomous workstation", "1", "Rs 9L-24L", "Training, vision, simulation, local inference", "Build notes", "https://www.shikhar.gg/blog/gpu-pc-build"],
      ["NVIDIA DGX Spark", "1", "Rs 4.5L-6L", "Shared local AI and robotics software", "NVIDIA", "https://www.nvidia.com/en-us/products/workstations/dgx-spark/"],
      ["RTX 5090 32GB", "2", "Rs 3.4L-5L+ each", "Primary CUDA training and inference", "NVIDIA", "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/"],
      ["RTX PRO 6000 Blackwell 96GB", "1 optional", "About Rs 11.9L before landing", "High-VRAM funded workloads", "NVIDIA", "https://www.nvidia.com/en-us/design-visualization/rtx-pro-6000/"]
    ]
  },
  {
    title: "Robot and edge-compute stations",
    icon: Cpu,
    rows: [
      ["Jetson Orin Nano Super", "6", "Rs 25k-45k each", "Edge AI and camera stations", "NVIDIA", "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/nano-super-developer-kit/"],
      ["Jetson AGX Thor", "1 pilot", "Rs 3.2L-4.5L landed", "High-end multi-camera physical AI", "NVIDIA", "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-thor/"],
      ["SO-ARM101 leader/follower sets", "5 + 10 spare servos", "Rs 21k+ per set", "Ten builders working in pairs", "SO-ARM BOM", "https://github.com/TheRobotStudio/SO-ARM100"],
      ["Raspberry Pi 5 kits", "10", "Rs 11k+ board reference", "Rovers, vacuum, logging, controllers", "Raspberry Pi", "https://www.raspberrypi.com/products/raspberry-pi-5/"],
      ["Microcontroller and motor-control drawer", "30 ESP32 + 10 STM32/Arduino", "Rs 75k-1.5L", "Fast controls and sensor work", "Robu", "https://robu.in/"],
      ["Pixhawk 6C-class autopilot sets", "2", "Quote in INR", "Rovers first, drones after cage readiness", "PX4 guide", "https://docs.px4.io/main/en/assembly/quick_start_pixhawk6c.html"]
    ]
  },
  {
    title: "Cameras and navigation sensors",
    icon: Camera,
    rows: [
      ["USB C920 / Brio-class cameras", "20", "Rs 3k-18k each", "Two views per arm station and spares", "Logitech", "https://www.logitech.com/en-in/products/webcams.html"],
      ["Luxonis OAK-D Lite", "6", "About Rs 15k before landing", "Stereo depth and onboard AI", "Luxonis", "https://shop.luxonis.com/products/oak-d-lite-1"],
      ["Luxonis OAK-D Pro", "4", "About Rs 39k before landing", "Active stereo and low-light tests", "Luxonis", "https://shop.luxonis.com/products/oak-d-pro"],
      ["RealSense D455-class pair", "2", "Quote current stock", "RGB-D compatibility for project pipelines", "RealSense", "https://www.realsenseai.com/products/depth-camera-d455/"],
      ["RPLIDAR A1/C1", "4", "Rs 9k-18k each", "Rovers and indoor mapping", "SLAMTEC", "https://www.slamtec.com/en/lidar/a1"],
      ["RTK GNSS base + rover", "2 pairs", "Rs 20k-50k+ per kit", "OpenMower and outdoor autonomy", "ArduSimple", "https://www.ardusimple.com/product/simplertk2b-basic-starter-kit-ip65/"],
      ["AprilTag / Charuco boards", "10 sets", "Rs 20k-60k total", "Calibration, pose, and data collection", "AprilTag", "https://github.com/AprilRobotics/apriltag"]
    ]
  },
  {
    title: "Bench, motion, and safety stock",
    icon: ShieldCheck,
    rows: [
      ["Electronics bench tooling", "10 mats + 5 solder stations", "Rs 3L-6L", "Ten builders without tool bottlenecks", "element14 India", "https://in.element14.com/"],
      ["Force / torque and load-cell starter kits", "2", "Rs 50k-3L", "Gripper force and manipulation safety", "Mouser India", "https://www.mouser.in/"],
      ["LiPo batteries, chargers, safe bags", "Shared safety set", "Rs 1L-2L", "Drones, rovers, and mobile robots", "Robu", "https://robu.in/"],
      ["RC transmitter + receiver", "2", "Rs 15k-45k each", "Manual control and safety fallback", "Holybro", "https://holybro.com/"],
      ["Spare servos, belts, bearings, fasteners", "15% motion spares", "Rs 1L-2L initial", "Keep active builds moving", "Robu", "https://robu.in/"],
      ["Emergency stops, barriers, extinguishers", "Per hazard zone", "Rs 1L-2.5L", "Guarded commissioning and incident response", "Local safety supplier", "https://bis.gov.in/"]
    ]
  }
];
