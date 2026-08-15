import { useMemo, useState } from "react";
import { PageHeader, Section } from "../components/Primitives";
import {
  buildingVisionItems,
  type BuildingVisionFloor
} from "../data/buildingVision";
import "./BuildingVisionPage.css";

const filters: Array<"All" | BuildingVisionFloor> = [
  "All",
  "Frontage",
  "Ground floor",
  "First floor",
  "Second floor",
  "Circulation"
];

const buildingVisionAgentPrompt = `Please propose a revision to the Building Vision page.

View: [exact card title]
Requested change: [one clear change]
Reason: [what this improves]
Must preserve: [walls, doors, windows, stairs, floor levels, trees, gate and drainage]
Allowed work: paint, floor repair or finish, lighting, removable signage and movable furniture only.

Before doing any work, read AGENTS.md and DESIGN.md.
First describe the proposed change in words. Do not edit files until I approve.
After approval, keep the original before image unchanged, update the relevant after image and website note, and add or update the focused test.
Show me the revised local /building-vision page before committing or publishing.
Run npm test, npm run build and the building-vision browser test.`;

const buildingVisionResources = [
  {
    label: "GitHub repository",
    detail: "Browse or clone the public Armature Lab project.",
    href: "https://github.com/sandeep-devarapalli/armature-lab"
  },
  {
    label: "Agent instructions",
    detail: "Read the project scope, constraints and validation rules.",
    href: "https://github.com/sandeep-devarapalli/armature-lab/blob/main/AGENTS.md"
  },
  {
    label: "Design system",
    detail: "Check the palette, typography and layout rules before editing.",
    href: "https://github.com/sandeep-devarapalli/armature-lab/blob/main/DESIGN.md"
  }
] as const;

export function BuildingVisionPage() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const visibleItems = useMemo(
    () => activeFilter === "All"
      ? buildingVisionItems
      : buildingVisionItems.filter((item) => item.floor === activeFilter),
    [activeFilter]
  );

  async function copyAgentPrompt() {
    try {
      await navigator.clipboard.writeText(buildingVisionAgentPrompt);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <div className="building-vision-page">
      <PageHeader
        meta="1426, 20th Main Road · HSR Layout"
        title="The building, without rebuilding it."
        description="A finish-only vision for the street arrival, ground-floor reception, store and café, plus two floors of Armature Lab: new flooring, paint, lighting, removable signage and movable furniture, while the walls, doors, windows, stairs and levels stay where they are."
      >
        <div className="building-vision-summary" aria-label="Concept summary">
          <div><strong>{buildingVisionItems.length}</strong><span className="mono">Building views</span></div>
          <div><strong>0</strong><span className="mono">Structural changes proposed</span></div>
          <div><strong>4</strong><span className="mono">Fit-out layers</span></div>
        </div>
      </PageHeader>

      <div className="building-vision-guardrail">
        <div className="wrap">
          <span className="mono">Non-negotiable scope</span>
          <p>No wall demolition, new openings, stair changes or major remodelling. Every “after” is a visual concept, not a measured construction drawing.</p>
        </div>
      </div>

      <Section
        number="01"
        title="One palette, four practical fit-out layers."
        lede="A co-working atmosphere can come from consistency and useful furniture—not from erasing the character of the house."
      >
        <div className="building-vision-principles">
          <article>
            <span className="mono">Flooring</span>
            <h3>Commercial LVT and outdoor tile</h3>
            <p>Warm oak in café and meeting areas; soft grey in harder-working lab rooms and circulation.</p>
          </article>
          <article>
            <span className="mono">Painting</span>
            <h3>Warm white, ink and a little saffron</h3>
            <p>A calm base, darker work surfaces and small colour signals for floor and room identity.</p>
          </article>
          <article>
            <span className="mono">Furniture</span>
            <h3>Movable by default</h3>
            <p>Tables on castors, freestanding storage, stackable chairs and mobile screens let rooms change over time.</p>
          </article>
          <article>
            <span className="mono">Lighting</span>
            <h3>Surface-mounted and task-led</h3>
            <p>Track, pendants and task lights improve usability without rebuilding ceilings or hiding the existing structure.</p>
          </article>
        </div>
      </Section>

      <Section
        number="02"
        title="Every in-scope building view, before and after."
        lede="Filter by area, then use the notes below each pair as a practical first-pass fit-out brief."
        id="comparisons"
      >
        <div className="building-vision-filters" role="toolbar" aria-label="Filter building views">
          {filters.map((filter) => (
            <button
              className={filter === activeFilter ? "is-active" : undefined}
              type="button"
              aria-pressed={filter === activeFilter}
              onClick={() => setActiveFilter(filter)}
              key={filter}
            >
              {filter}
            </button>
          ))}
        </div>
        <p className="building-vision-count mono" aria-live="polite">
          Showing {visibleItems.length} of {buildingVisionItems.length} views
        </p>

        <div className="building-vision-list">
          {visibleItems.map((item) => (
            <article className="building-vision-room" id={item.id} key={item.id}>
              <header>
                <div>
                  <span className="mono">{item.floor}</span>
                  <h3>{item.title}</h3>
                </div>
                <p>{item.proposedUse}</p>
              </header>

              <div className="building-vision-comparison">
                <figure>
                  <div className="building-vision-image-frame">
                    <img
                      src={item.before}
                      alt={item.beforeAlt ?? `${item.title} before the proposed finish-only fit-out`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <figcaption><span className="mono">Before</span> {item.beforeCaption ?? "Existing photograph"}</figcaption>
                </figure>
                <figure>
                  <div className="building-vision-image-frame">
                    <img
                      src={item.after}
                      alt={item.afterAlt ?? `${item.title} visual concept with new finishes and movable furniture`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <figcaption><span className="mono">After</span> {item.afterCaption ?? "Finish-only visual concept"}</figcaption>
                </figure>
              </div>

              <div className="building-vision-spec">
                <div><span className="mono">Flooring</span><p>{item.flooring}</p></div>
                <div><span className="mono">Paint</span><p>{item.paint}</p></div>
                <div><span className="mono">Furniture</span><p>{item.furniture}</p></div>
                <div><span className="mono">Lighting</span><p>{item.lighting}</p></div>
                <div className="building-vision-preserve"><span className="mono">Must remain</span><p>{item.preserve}</p></div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        number="03"
        title="Use Codex or Claude to propose a revision."
        lede="A useful request names one view, one change and the parts of the building that must remain. The agent should propose first and edit only after approval."
        id="suggest-a-change"
      >
        <div className="building-vision-agent-resources">
          <header>
            <div>
              <span className="mono">Project access</span>
              <h3>Repository and working references.</h3>
            </div>
            <p>The repository is public. Open it in Codex or Claude, then use the two project guides before proposing changes.</p>
          </header>
          <div className="building-vision-agent-links">
            {buildingVisionResources.map((resource) => (
              <a href={resource.href} target="_blank" rel="noreferrer" key={resource.label}>
                <span className="mono">{resource.label}</span>
                <p>{resource.detail}</p>
                <strong aria-hidden="true">Open ↗</strong>
              </a>
            ))}
          </div>
          <p className="building-vision-agent-paths">
            <span className="mono">Building Vision files</span>
            <code>src/pages/BuildingVisionPage.tsx</code>
            <code>src/data/buildingVision.ts</code>
            <code>public/building-vision/</code>
          </p>
        </div>

        <div className="building-vision-agent-grid">
          <article>
            <span className="mono">01 · Give context</span>
            <h3>Start the agent in this project.</h3>
            <ol>
              <li>Open the Armature Lab project in Codex or Claude and ask it to read <code>AGENTS.md</code> and <code>DESIGN.md</code>.</li>
              <li>Name the exact Building Vision card and attach the relevant screenshot or concept image.</li>
              <li>Describe one requested change and list every wall, opening, stair, tree or circulation route that must remain.</li>
            </ol>
          </article>
          <article>
            <span className="mono">02 · Review safely</span>
            <h3>Keep every proposal reversible.</h3>
            <ol>
              <li>Ask for a written proposal before allowing file edits or image generation.</li>
              <li>Keep the original before image unchanged; revise only the corresponding after concept and its note.</li>
              <li>Review the local page on desktop and mobile, then approve any commit or publication separately.</li>
            </ol>
          </article>
        </div>

        <div className="building-vision-agent-prompt" aria-label="Prompt template for Codex or Claude">
          <header>
            <div>
              <span className="mono">Ready-to-paste prompt</span>
              <p>Replace the bracketed fields, then paste this into Codex or Claude.</p>
            </div>
            <button
              className="building-vision-copy-button"
              type="button"
              aria-live="polite"
              onClick={() => void copyAgentPrompt()}
            >
              {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy prompt"}
            </button>
          </header>
          <pre><code>{buildingVisionAgentPrompt}</code></pre>
        </div>
      </Section>

      <section className="building-vision-note">
        <div className="wrap">
          <span className="mono">Before procurement</span>
          <p>Confirm the remaining floor labels and all dimensions against a measured survey; check landlord permissions, waterproofing, electrical capacity, fire egress and accessibility with qualified local professionals. The concepts intentionally do not resolve those technical checks.</p>
        </div>
      </section>
    </div>
  );
}
