import Link from "next/link";
import { FlaskConical, Pill, ShieldAlert, Stethoscope, UserRound } from "lucide-react";

import { ReferenceBanner, ClinicalStatus } from "@/components/clinical/status";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const workflows = [
  {
    href: "/patients",
    title: "Patient search",
    description: "FHIR Patient read and search against the reference server.",
    icon: UserRound,
  },
  {
    href: "/interactions",
    title: "Drug interactions",
    description: "MedicationRequest interaction check with incomplete demo KB.",
    icon: Pill,
  },
  {
    href: "/cds",
    title: "Clinical decision support",
    description: "CDS Hooks-style cards for allergy and bleeding-risk rules.",
    icon: Stethoscope,
  },
  {
    href: "/validate",
    title: "Resource validation",
    description: "Structural and profile validation via the $validate operation.",
    icon: FlaskConical,
  },
  {
    href: "/auth",
    title: "Dev authentication",
    description: "Issue SMART-style scoped tokens for local API exploration.",
    icon: ShieldAlert,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Clinical reference"
        title="Asclepius FHIR console"
        description="Ports-and-adapters reference platform for FHIR R4, validation, CDS, and DDI demos. Educational use only."
      />

      <ReferenceBanner title="NOT FOR CLINICAL USE">
        Asclepius is a reference implementation with an intentionally incomplete drug-interaction knowledge base. Do not store, process, or base clinical decisions on real patient data.
      </ReferenceBanner>

      <div className="flex flex-wrap gap-2">
        <ClinicalStatus variant="critical">Reference only</ClinicalStatus>
        <ClinicalStatus variant="success">FHIR R4 REST</ClinicalStatus>
        <ClinicalStatus variant="warning">Incomplete DDI KB</ClinicalStatus>
      </div>

      <section aria-labelledby="workflows-heading" className="grid gap-4 sm:grid-cols-2">
        <h2 id="workflows-heading" className="sr-only">
          Workflows
        </h2>
        {workflows.map((item) => (
          <Link key={item.href} href={item.href} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/20">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="mt-2">{item.description}</CardDescription>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Backend integration</CardTitle>
          <CardDescription>
            Run <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">npm run dev</code> in the repo root (port 8787), then start this UI on port 3200. Obtain a dev token from Auth before protected routes.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Gate remains <code className="font-mono text-xs">npm run gate</code> / <code className="font-mono text-xs">./scripts/verify.sh</code> for the API server.
        </CardContent>
      </Card>
    </div>
  );
}
