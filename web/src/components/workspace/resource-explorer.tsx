'use client';
import Link from 'next/link';
import { useHydrated } from '@/lib/use-hydrated';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Braces,
  CheckCheck,
  ChevronRight,
  FileText,
  Link2,
  Search,
  X,
} from 'lucide-react';
import { examples, type ResourceExample } from '@/lib/examples';

export function ResourceDetail({
  example,
  onClose,
  onSelect,
}: {
  example: ResourceExample;
  onClose: () => void;
  onSelect: (example: ResourceExample) => void;
}) {
  const [json, setJson] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);
  const references: string[] = [];
  function collect(value: unknown) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'reference' && typeof child === 'string') references.push(child);
      else collect(child);
    }
  }
  collect(example.resource);
  return (
    <section
      id="resource-detail"
      ref={panelRef}
      tabIndex={-1}
      className="resource-detail panel"
      aria-label={`${example.type} details`}
    >
      <div className="section-heading">
        <span className="eyebrow">RESOURCE INSPECTOR</span>
        <button className="icon-button" onClick={onClose} aria-label="Close resource details">
          <X size={18} />
        </button>
      </div>
      <span className="resource-type">{example.type}</span>
      <h3>{example.title}</h3>
      <p className="text-muted">{example.description}</p>
      <div className="learning-note">
        <Link2 size={18} />
        <p>{example.lesson}</p>
      </div>
      {references.length > 0 && (
        <div className="related">
          <h4>Connected records</h4>
          {Array.from(new Set(references)).map((ref) => {
            const match = examples.find((e) => `${e.type}/${String(e.resource.id)}` === ref);
            return match ? (
              <button
                key={ref}
                onClick={() => {
                  setJson(false);
                  onSelect(match);
                }}
              >
                <span>
                  {match.type}
                  <small>{match.title}</small>
                </span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <p key={ref}>{ref}</p>
            );
          })}
        </div>
      )}
      <div className="detail-actions">
        <button className="button secondary" aria-expanded={json} onClick={() => setJson(!json)}>
          <Braces size={16} />
          {json ? 'Hide JSON' : 'View FHIR JSON'}
        </button>
        <Link className="button primary" href={`/validate?resource=${example.type}`}>
          <CheckCheck size={16} />
          Validate
        </Link>
      </div>
      {json && (
        <pre className="json-preview" tabIndex={0} aria-label="Resource JSON">
          {JSON.stringify(example.resource, null, 2)}
        </pre>
      )}
    </section>
  );
}

export function ResourceExplorer({
  types,
  compact = false,
}: {
  types?: string[];
  compact?: boolean;
}) {
  const hydrated = useHydrated();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ResourceExample | null>(null);
  const filtered = examples.filter(
    (example) =>
      (!types || types.includes(example.type)) &&
      `${example.type} ${example.title} ${example.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className={`explorer-layout ${selected ? 'has-detail' : ''}`}>
      <section className="resource-list panel">
        <div className="section-heading">
          <div>
            <h2>{compact ? 'The records behind the story' : 'Explore the connected records'}</h2>
            <p className="text-muted">
              {compact
                ? 'Select a record to understand its role in this visit.'
                : 'Nine resource types. One fictional episode of care.'}
            </p>
          </div>
          {compact && (
            <Link className="text-link" href="/resources">
              View all <ArrowRight size={15} />
            </Link>
          )}
        </div>
        {!compact && (
          <label className="search-box">
            <Search size={18} />
            <input
              disabled={!hydrated}
              aria-label="Search resources"
              placeholder="Search by resource, person, or purpose…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        )}
        <div className="resource-table" role="list" aria-label="Synthetic resources">
          <div className="table-heading" aria-hidden="true">
            <span>RESOURCE / RECORD</span>
            <span>WHAT IT CONNECTS</span>
            <span />
          </div>
          {filtered.map((example) => (
            <div key={example.type} role="listitem">
              <button
                disabled={!hydrated}
                className={`resource-row ${selected?.type === example.type ? 'selected' : ''}`}
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setSelected(example);
                }}
                aria-controls={selected?.type === example.type ? 'resource-detail' : undefined}
                aria-expanded={selected?.type === example.type}
                aria-label={`Inspect ${example.type}: ${example.title}`}
                aria-pressed={selected?.type === example.type}
              >
                <span className="resource-name">
                  <span className="file-icon">
                    <FileText size={18} />
                  </span>
                  <span>
                    {example.title}
                    <small>{example.type}</small>
                  </span>
                </span>
                <span className="resource-description">{example.description}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" role="listitem">
              <Search size={24} />
              <h3>No matching records</h3>
              <p>Try “Patient”, “visit”, or “measurement”.</p>
              <button className="button secondary" onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>
          )}
        </div>
        <div className="list-footer">
          <span>{filtered.length} synthetic records</span>
          <span>FHIR R4 · Teaching subset</span>
        </div>
      </section>
      {selected && (
        <ResourceDetail
          key={selected.type}
          example={selected}
          onClose={() => {
            setSelected(null);
            triggerRef.current?.focus();
          }}
          onSelect={setSelected}
        />
      )}
    </div>
  );
}
