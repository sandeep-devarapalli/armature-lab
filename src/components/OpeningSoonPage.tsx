import type { PropsWithChildren } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader, Section } from "./Primitives";

export function OpeningSoonPage() {
  return (
    <>
      <PageHeader
        meta="Public launch · operations staged"
        title="Operational access is opening soon."
        description="The public Armature site is available now. Accounts, reservations, check-in, equipment checkout, and verified component requests will open after their production services complete final validation."
        actions={(
          <>
            <Link className="button button-primary" to="/projects">
              Explore projects <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="button button-quiet" to="/components">
              Browse components
            </Link>
          </>
        )}
      />
      <Section
        number="01"
        title="The public floor stays open"
        lede="Projects, services, procurement, the component catalog, Maker Desk information, and the Bengaluru ecosystem remain available while operational systems are staged."
      />
    </>
  );
}

export function ReleaseGate({
  enabled,
  children
}: PropsWithChildren<{ enabled: boolean }>) {
  return enabled ? children : <OpeningSoonPage />;
}
