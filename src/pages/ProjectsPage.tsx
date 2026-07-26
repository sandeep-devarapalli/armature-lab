import { useMemo, useState } from "react";
import { ArrowUpRight, Filter, Search } from "lucide-react";
import { PageHeader, Section, Status } from "../components/Primitives";
import { projects } from "../data/projects";

const priorities = ["All", "P0", "P1", "P2"] as const;

export function ProjectsPage() {
  const [priority, setPriority] = useState<(typeof priorities)[number]>("All");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return projects.filter((project) => {
      const matchesPriority = priority === "All" || project.priority === priority;
      const haystack = `${project.title} ${project.category} ${project.description} ${project.tags.join(" ")}`.toLowerCase();
      return matchesPriority && (!needle || haystack.includes(needle));
    });
  }, [priority, query]);

  return (
    <>
      <PageHeader
        meta="Open projects · living build roadmap"
        title="Build what the lab needs next."
        description="A working roadmap of open hardware, robot learning, tactile sensing, mobile autonomy, and the infrastructure that keeps every experiment reproducible."
      />
      <Section number="01" title="Project grid" lede={`${filtered.length} of ${projects.length} project tracks shown.`}>
        <div className="filter-bar">
          <label className="search-box">
            <Search aria-hidden="true" />
            <span className="sr-only">Search projects</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" />
          </label>
          <div className="segmented" role="group" aria-label="Filter by priority">
            <Filter aria-hidden="true" />
            {priorities.map((item) => (
              <button key={item} className={priority === item ? "active" : ""} onClick={() => setPriority(item)} type="button">
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="project-grid">
          {filtered.map((project) => (
            <article className="project-card" key={project.slug}>
              {project.image && <img src={project.image} alt={`${project.title} project`} loading="lazy" />}
              <div className="project-card-body">
                <div className="row-between">
                  <span className="mono">{project.category}</span>
                  <div className="status-row">
                    <Status tone={project.priority === "P0" ? "bad" : project.priority === "P1" ? "accent" : "neutral"}>{project.priority}</Status>
                    <Status tone={project.status === "Build Now" ? "good" : "neutral"}>{project.status}</Status>
                  </div>
                </div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="tag-row">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <a href={project.sourceUrl} target="_blank" rel="noreferrer">
                  Project source <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </Section>
      <Section number="02" title="Infrastructure comes first" dark>
        <div className="infra-line">
          {[
            ["01", "Storage", "TrueNAS or OpenZFS for durable data."],
            ["02", "Compute", "A two-GPU local node before a rack."],
            ["03", "Versioning", "DVC remotes for datasets and models."],
            ["04", "Object layer", "S3 semantics only when projects need them."],
            ["05", "Operations", "NetBox, BMC, and networking as nodes multiply."]
          ].map(([number, title, copy]) => (
            <div key={number}><span className="mono">{number}</span><h3>{title}</h3><p>{copy}</p></div>
          ))}
        </div>
      </Section>
    </>
  );
}
