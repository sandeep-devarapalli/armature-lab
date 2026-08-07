import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Cpu,
  RadioTower,
  ScanLine,
  ShieldCheck,
  Wrench
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { Metric, Section } from "../components/Primitives";

const labRoles = [
  {
    number: "01",
    title: "A workshop",
    copy: "Bench space, tools, and serious equipment to build on. Assemble, break, and iterate without doing it alone in a garage."
  },
  {
    number: "02",
    title: "A showroom",
    copy: "Resident teams keep prototypes and demo material on the floor, so visitors see working physical AI rather than a pitch deck."
  },
  {
    number: "03",
    title: "A room",
    copy: "Founders, engineers, researchers, and backers share the space. Hard questions get answered by people who have built the thing."
  },
  {
    number: "04",
    title: "A training ground",
    copy: "Hands-on workshops, student research with industry, and build days with the communities advancing Indian robotics."
  }
];

export function HomePage() {
  return (
    <>
      <header className="home-hero">
        <div className="hero-grid-field" aria-hidden="true">
          {Array.from({ length: 54 }).map((_, index) => (
            <i key={index} style={{ "--i": index } as React.CSSProperties} />
          ))}
        </div>
        <div className="wrap home-hero-inner">
          <div className="eyebrow mono">
            The Physical AI and Robotics Lab · HSR Layout, Bengaluru
          </div>
          <div className="hero-lockup">
            <BrandMark compact />
            <div>
              <h1>armature</h1>
              <span className="mono">The physical AI and robotics lab</span>
            </div>
          </div>
          <p className="hero-copy">
            The armature is the core of every motor: the part that moves. Ours is
            a 3,500 sq ft lab built for the full path from idea to working machine:
            arms, a netted drone cage, prototyping, ESD-safe benches, and GPU
            compute, all bookable by the hour.
          </p>
          <div className="button-row">
            <Link className="button button-primary" to="/book">
              <CalendarDays aria-hidden="true" />
              Book a workstation
            </Link>
            <Link className="button button-quiet" to="/equipment">
              See the space
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="metrics-strip">
            <Metric label="Footprint" value="3,500 sq ft" />
            <Metric label="Zones" value="10" />
            <Metric label="Builder pods" value="16" />
            <Metric label="Monitoring" value="9 cameras" />
          </div>
        </div>
      </header>

      <Section
        number="01"
        title="A working floor, not a club lounge"
        lede="Every zone is meant to hold a real project in progress."
      >
        <div className="role-list">
          {labRoles.map((role) => (
            <article className="role-row" key={role.number}>
              <span className="mono">→ {role.number}</span>
              <div>
                <h3>{role.title}</h3>
                <p>{role.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        number="02"
        title="The floor at a glance"
        lede="Hazardous motion stays guarded. Clean electronics and compute stay grounded and separated."
        dark
      >
        <div className="floor-map" aria-label="Armature lab zones">
          <div className="floor-zone floor-demo">
            <ScanLine aria-hidden="true" />
            <strong>Demo floor</strong>
            <span>Prototypes · visitor line</span>
          </div>
          <div className="floor-zone floor-pods">
            <Wrench aria-hidden="true" />
            <strong>Builder pods ×16</strong>
            <span>Dedicated desks · project storage</span>
          </div>
          <div className="floor-zone floor-arm">
            <ShieldCheck aria-hidden="true" />
            <strong>Robot arm cell</strong>
            <span>Guarded · interlocked</span>
          </div>
          <div className="floor-zone floor-drone">
            <RadioTower aria-hidden="true" />
            <strong>Drone cage</strong>
            <span>Netted · indoor flight</span>
          </div>
          <div className="floor-zone floor-compute">
            <Cpu aria-hidden="true" />
            <strong>Compute + storage</strong>
            <span>GPU queue · NAS · NVR</span>
          </div>
        </div>
        <div className="legend-row mono">
          <span><i className="legend-brick" /> Hazard / guarded</span>
          <span><i className="legend-saffron" /> Visitor-facing</span>
          <span><i className="legend-moss" /> Builder / safe</span>
        </div>
      </Section>

      <Section
        number="03"
        title="Book, build, and leave a clean trail"
        lede="Accounts, certification gates, reservations, and attendance are one operational path."
      >
        <div className="process-line">
          {[
            ["Apply", "Tell us what you are building."],
            ["Induct", "Complete the lab and equipment safety checks."],
            ["Reserve", "Choose a resource and a live time slot."],
            ["Check in", "Present a one-use QR to the on-site kiosk."],
            ["Build", "Use the floor, log the work, and close the session."]
          ].map(([title, copy], index) => (
            <div className="process-step" key={title}>
              <span className="mono">0{index + 1}</span>
              <CheckCircle2 aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="quote-band">
        <div className="wrap">
          <p>
            Most builders will never own a six-axis arm, a drone cage, and a
            machine shop. <strong>Here you book them by the hour.</strong>
          </p>
          <Link to="/join">
            Join the floor <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
