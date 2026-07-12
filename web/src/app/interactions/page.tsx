"use client";

import { useState } from "react";

import { ClinicalStatus } from "@/components/clinical/status";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkInteractions } from "@/lib/api";

const samplePayload = {
  resourceType: "MedicationRequest",
  status: "active",
  intent: "order",
  subject: { reference: "Patient/example" },
  medicationCodeableConcept: {
    coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "855332" }],
  },
};

export default function InteractionsPage() {
  const [body, setBody] = useState(JSON.stringify(samplePayload, null, 2));
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(body) as Record<string, unknown>;
    } catch {
      setLoading(false);
      setError("Invalid JSON body");
      return;
    }
    const res = await checkInteractions(parsed);
    setLoading(false);
    if (!res.ok) {
      setError(`${res.status}: ${res.error}`);
      return;
    }
    setResult(JSON.stringify(res.data, null, 2));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="DDI"
        title="Drug interaction check"
        description="POST MedicationRequest/$check-interactions against the intentionally incomplete reference KB."
      />

      <ClinicalStatus variant="warning">Incomplete interaction data — not for clinical decisions</ClinicalStatus>

      <Card>
        <CardHeader>
          <CardTitle>MedicationRequest payload</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <textarea
              aria-label="MedicationRequest JSON"
              className="min-h-48 w-full rounded-md border-2 border-border bg-card p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Checking…" : "Check interactions"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <div role="alert" className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div> : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{result}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
