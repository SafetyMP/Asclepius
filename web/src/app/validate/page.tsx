"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateResource } from "@/lib/api";

const samplePatient = {
  resourceType: "Patient",
  name: [{ family: "Demo", given: ["Synthetic"] }],
  gender: "unknown",
};

export default function ValidatePage() {
  const [type, setType] = useState("Patient");
  const [body, setBody] = useState(JSON.stringify(samplePatient, null, 2));
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
    const res = await validateResource(type, parsed);
    setLoading(false);
    if (!res.ok) {
      setError(`${res.status}: ${res.error}`);
      return;
    }
    setResult(JSON.stringify(res.data, null, 2));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Validation" title="Validate resource" description="Run structural and profile validation via POST /{Type}/$validate." />

      <Card>
        <CardHeader>
          <CardTitle>Resource payload</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="resource-type">Resource type</Label>
              <Input id="resource-type" value={type} onChange={(e) => setType(e.target.value)} required />
            </div>
            <textarea
              aria-label="FHIR resource JSON"
              className="min-h-48 w-full rounded-md border-2 border-border bg-card p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Validating…" : "Validate resource"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <div role="alert" className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div> : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>OperationOutcome</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{result}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
