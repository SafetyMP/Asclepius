"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invokeCds } from "@/lib/api";

const sampleContext = {
  hook: "patient-view",
  hookInstance: "demo",
  context: { patientId: "example" },
  prefetch: {},
};

export default function CdsPage() {
  const [serviceId, setServiceId] = useState("patient-view");
  const [body, setBody] = useState(JSON.stringify(sampleContext, null, 2));
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
    const res = await invokeCds(serviceId, parsed);
    setLoading(false);
    if (!res.ok) {
      setError(`${res.status}: ${res.error}`);
      return;
    }
    setResult(JSON.stringify(res.data, null, 2));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="CDS Hooks" title="Clinical decision support" description="Invoke CDS services and review returned cards." />

      <Card>
        <CardHeader>
          <CardTitle>Service invocation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-id">Service ID</Label>
              <Input id="service-id" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required />
            </div>
            <textarea
              aria-label="CDS request JSON"
              className="min-h-48 w-full rounded-md border-2 border-border bg-card p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Invoking…" : "Invoke CDS service"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <div role="alert" className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div> : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>CDS cards</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{result}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
