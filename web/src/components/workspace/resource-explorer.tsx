'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
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
import { recordConnections, recordFacts } from '@/lib/record-context';
import { useHydrated } from '@/lib/use-hydrated';

type ExplorerContext = 'journey' | 'explorer';

export function ResourceDetail({
  example,
  onClose,
  onSelect,
  previous,
  onPrevious,
  context = 'explorer',
  stage,
}: {
  example: ResourceExample;
  onClose: () => void;
  onSelect: (example: ResourceExample) => void;
  previous?: ResourceExample;
  onPrevious?: () => void;
  context?: ExplorerContext;
  stage?: number;
}) {
  const [json, setJson] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);
  const facts = recordFacts(example);
  const connections = recordConnections(example);
  const validationHref = `/validate?resource=${example.type}&from=${context}${context === 'journey' && stage !== undefined ? `&stage=${stage}` : ''}`;
  return (
    <section
      id="resource-detail"
      ref={panelRef}
      tabIndex={-1}
      className="resource-detail panel"
      aria-label={`${example.type} details`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="section-heading">
        <span className="eyebrow">RECORD DETAILS</span>
        <button className="icon-button" onClick={onClose} aria-label="Close resource details">
          <X size={18} />
        </button>
      </div>
      {previous && onPrevious && (
        <button className="text-link inspector-back" onClick={onPrevious}>
          <ArrowLeft size={16} />
          Back to {previous.title}
        </button>
      )}
      <span className="resource-type">{example.type}</span>
      <h3>{example.title}</h3>
      <p className="text-muted">{example.description}</p>
      <div className="record-status">Fictional record · Alex’s teaching scenario</div>
      <h4>At a glance</h4>
      <dl className="record-facts">
        {facts.map((fact) => (
          <div className="record-fact" key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="learning-note">
        <Link2 size={18} />
        <p>{example.lesson}</p>
      </div>
      {connections.length > 0 && (
        <div className="related">
          <h4>Connected records</h4>
          <p className="text-muted relationship-explainer">
            Explore links from this record and records that point back to it.
          </p>
          {connections.map(({ example: related, relationship }) => (
            <button
              key={related.type}
              aria-label={`${related.type} ${related.title}`}
              onClick={() => onSelect(related)}
            >
              <span>
                {related.title}
                <small>{related.type}</small>
                <span className="relationship-label">{relationship}</span>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}
      <div className="detail-actions">
        <button className="button secondary" aria-expanded={json} onClick={() => setJson(!json)}>
          <Braces size={16} />
          {json ? 'Hide JSON' : 'View FHIR JSON'}
        </button>
        <Link className="button primary" href={validationHref}>
          <CheckCheck size={16} />
          Check record structure
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
  context,
  initialType,
  onSelectionChange,
  initialQuery = '',
  onQueryChange,
  stage,
}: {
  types?: string[];
  compact?: boolean;
  context?: ExplorerContext;
  initialType?: string;
  onSelectionChange?: (type: string | null) => void;
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  stage?: number;
}) {
  const hydrated = useHydrated();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<ResourceExample | null>(
    () => examples.find((example) => example.type === initialType) ?? null,
  );
  const [history, setHistory] = useState<ResourceExample[]>([]);
  const effectiveContext = context ?? (compact ? 'journey' : 'explorer');
  const filtered = examples.filter(
    (example) =>
      (!types || types.includes(example.type)) &&
      `${example.type} ${example.title} ${example.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function changeQuery(value: string) {
    setQuery(value);
    onQueryChange?.(value);
  }
  function select(example: ResourceExample, followReference: boolean) {
    setHistory((previous) => (followReference && selected ? [...previous, selected] : []));
    setSelected(example);
    onSelectionChange?.(example.type);
  }
  function goBack() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory(history.slice(0, -1));
    setSelected(previous);
    onSelectionChange?.(previous.type);
  }
  function close() {
    const fallback = selected ? rowRefs.current.get(selected.type) : undefined;
    const target = triggerRef.current?.isConnected
      ? triggerRef.current
      : (fallback ?? searchRef.current ?? listRef.current);
    setSelected(null);
    setHistory([]);
    onSelectionChange?.(null);
    target?.focus();
  }
  return (
    <div className={`explorer-layout ${selected ? 'has-detail' : ''}`}>
      <section className="resource-list panel" ref={listRef} tabIndex={-1} aria-label="Record list">
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
              ref={searchRef}
              disabled={!hydrated}
              aria-label="Search resources"
              placeholder="Search by resource, person, or purpose…"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
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
                ref={(node) => {
                  if (node) rowRefs.current.set(example.type, node);
                  else rowRefs.current.delete(example.type);
                }}
                className={`resource-row ${selected?.type === example.type ? 'selected' : ''}`}
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  select(example, false);
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
              <button className="button secondary" onClick={() => changeQuery('')}>
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
          onClose={close}
          onSelect={(example) => select(example, true)}
          previous={history[history.length - 1]}
          onPrevious={goBack}
          context={effectiveContext}
          stage={stage}
        />
      )}
    </div>
  );
}
