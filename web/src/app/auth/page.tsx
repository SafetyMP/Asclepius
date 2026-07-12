"use client";

import { useState } from "react";

import { ClinicalStatus } from "@/components/clinical/status";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { issueDevToken, setAccessToken } from "@/lib/api";

export default function AuthPage() {
  const [sub, setSub] = useState("practitioner-demo");
  const [scopes, setScopes] = useState("system/*.*");
  const [role, setRole] = useState("practitioner");
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onIssue(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTokenPreview(null);
    const res = await issueDevToken({ sub, scopes, role });
    setLoading(false);
    if (!res.ok) {
      setError(`${res.status}: ${res.error}`);
      return;
    }
    setAccessToken(res.data.access_token);
    setTokenPreview(`${res.data.access_token.slice(0, 24)}… (${res.data.expires_in}s)`);
  }

  function onClear() {
    setAccessToken(null);
    setTokenPreview(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Development"
        title="Dev authentication"
        description="Issue a local bearer token for SMART-style scoped API calls. Disabled in production builds of the API server."
      />

      <ClinicalStatus variant="warning">Dev-only token issuer</ClinicalStatus>

      <Card>
        <CardHeader>
          <CardTitle>Token request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onIssue} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sub">Subject (sub)</Label>
                <Input id="sub" value={sub} onChange={(e) => setSub(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="scopes">Scopes</Label>
                <Input id="scopes" value={scopes} onChange={(e) => setScopes(e.target.value)} required />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Issuing…" : "Issue token"}
              </Button>
              <Button type="button" variant="outline" onClick={onClear}>
                Clear stored token
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? <div role="alert" className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div> : null}

      {tokenPreview ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Session <ClinicalStatus variant="success">Token stored</ClinicalStatus>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{tokenPreview}</p>
            <p className="mt-2 text-sm text-muted-foreground">Stored in sessionStorage for subsequent API calls from this browser tab.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
