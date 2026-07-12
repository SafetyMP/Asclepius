"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readPatient, searchPatients } from "@/lib/api";

export default function PatientsPage() {
  const [name, setName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await searchPatients(name || undefined);
    setLoading(false);
    if (!res.ok) {
      setError(`${res.status}: ${res.error}`);
      return;
    }
    setResult(JSON.stringify(res.data, null, 2));
  }

  async function onRead(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await readPatient(patientId);
    setLoading(false);
    if (!res.ok) {
      setError(`${res.status}: ${res.error}`);
      return;
    }
    setResult(JSON.stringify(res.data, null, 2));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="FHIR R4" title="Patients" description="Search or read Patient resources. Requires a dev bearer token with appropriate scopes." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSearch} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="search-name">Name (optional)</Label>
                <Input id="search-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading}>
                Search patients
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Read by ID</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onRead} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="read-id">Patient ID</Label>
                <Input id="read-id" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading}>
                Read patient
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {error ? <div role="alert" className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div> : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{result}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
