import { useEffect, useRef, useState } from 'react';
import {
  catalogReview,
  loadCatalogFeature,
  loadCatalogIndex,
  normalizeSearch,
  type CatalogEntry,
  type CatalogFeature,
} from './catalog';
import geology from '../data/generated/geology.json' with { type: 'json' };
import { FeatureCalculator } from '../planning/FeatureCalculator';
import type { BasePosition } from '../planning/BasePoint';

const PAGE_SIZE = 8;

export function CatalogBrowser({
  onSelect,
  selectedId,
  selectionRevision,
  onOpenChange,
  base,
}: {
  onSelect: (feature: CatalogFeature) => void;
  selectedId: string | null;
  selectionRevision: number;
  onOpenChange: (open: boolean) => void;
  base: BasePosition | null;
}) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'failed' | 'ready'>(
    'idle',
  );
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [type, setType] = useState('AA');
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<CatalogEntry | null>(null);
  const [detailError, setDetailError] = useState<CatalogEntry | null>(null);
  const detailRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open || entries) return;
    const abort = new AbortController();
    setStatus('loading');
    loadCatalogIndex(abort.signal)
      .then((next) => {
        if (!abort.signal.aborted) {
          setEntries(next);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!abort.signal.aborted) setStatus('failed');
      });
    return () => abort.abort();
  }, [open, entries, attempt]);
  useEffect(() => () => detailRequest.current?.abort(), []);
  useEffect(() => {
    detailRequest.current?.abort();
    setPending(null);
    setDetailError(null);
  }, [selectionRevision]);

  function cancelDetail() {
    detailRequest.current?.abort();
    setPending(null);
    setDetailError(null);
  }
  async function select(entry: CatalogEntry) {
    cancelDetail();
    const abort = new AbortController();
    detailRequest.current = abort;
    setPending(entry);
    try {
      const feature = await loadCatalogFeature(entry, abort.signal);
      if (!abort.signal.aborted) {
        onSelect(feature);
        setPending(null);
      }
    } catch {
      if (!abort.signal.aborted) {
        setDetailError(entry);
        setPending(null);
      }
    }
  }
  const search = normalizeSearch(query);
  const [west, south, east, north] = geology.bounds;
  const matches = (entries ?? []).filter(
    (entry) =>
      (!search ||
        normalizeSearch(`${entry.name} ${entry.searchName}`).includes(
          search,
        )) &&
      (type === 'all' || entry.typeCode === type) &&
      (region === 'all' ||
        (region === 'jezero'
          ? entry.longitude >= west &&
            entry.longitude <= east &&
            entry.latitude >= south &&
            entry.latitude <= north
          : entry.regionId === region)),
  );
  return (
    <section className="catalog-browser" aria-label="Mars feature catalogue">
      <details
        onToggle={(event) => {
          setOpen(event.currentTarget.open);
          onOpenChange(event.currentTarget.open);
          if (!event.currentTarget.open) cancelDetail();
        }}
      >
        <summary>Discover Mars features</summary>
        <p className="quiet">
          {catalogReview.count.toLocaleString('en-US')} named features ·{' '}
          {catalogReview.craterCount.toLocaleString('en-US')} craters. Named
          features only; smaller and unnamed craters are not comprehensively
          covered.
        </p>
        <p className="quiet">
          USGS snapshot imported {catalogReview.retrievedAt.slice(0, 10)}.
          Refreshed when publishing.
        </p>
        {status === 'loading' && (
          <p role="status">Loading feature catalogue…</p>
        )}
        {status === 'failed' && (
          <div role="alert">
            <p>
              Catalogue unavailable. The Jezero science records remain
              available.
            </p>
            <button onClick={() => setAttempt((value) => value + 1)}>
              Retry catalogue
            </button>
          </div>
        )}
        {entries && (
          <>
            <FeatureCalculator
              entries={entries}
              base={base}
              onSelect={(entry) => void select(entry)}
            />
            <label>
              Search features
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                  cancelDetail();
                }}
              />
            </label>
            <label>
              Catalogue region
              <select
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value);
                  setPage(0);
                  cancelDetail();
                }}
              >
                <option value="all">Across Mars</option>
                <option value="jezero">Jezero geology map extent</option>
                {catalogReview.regions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id === 'unspecified'
                      ? item.name
                      : `${item.id.toUpperCase()} · ${item.name}`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Feature type
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value);
                  setPage(0);
                  cancelDetail();
                }}
              >
                <option value="all">All named feature types</option>
                {catalogReview.types.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="quiet">
              Regions filter catalogue centres, not full feature footprints.
            </p>
            <p role="status" className="catalog-results-count">
              {matches.length} matching features
            </p>
            <ul className="catalog-results">
              {matches
                .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
                .map((entry) => (
                  <li key={entry.id}>
                    <button
                      aria-pressed={selectedId === entry.id}
                      onClick={() => void select(entry)}
                    >
                      <strong>{entry.name}</strong>
                      <small>
                        {
                          catalogReview.types.find(
                            (item) => item.code === entry.typeCode,
                          )?.name
                        }{' '}
                        · {entry.regionId.toUpperCase()}
                      </small>
                    </button>
                  </li>
                ))}
            </ul>
            {!matches.length && (
              <p>
                No matching named features. Try another region, type or name.
              </p>
            )}
            <div className="catalog-pagination">
              <button
                disabled={page === 0}
                onClick={() => {
                  setPage((n) => n - 1);
                  cancelDetail();
                }}
              >
                Previous
              </button>
              <span>
                {matches.length ? page + 1 : 0} /{' '}
                {Math.ceil(matches.length / PAGE_SIZE)}
              </span>
              <button
                disabled={(page + 1) * PAGE_SIZE >= matches.length}
                onClick={() => {
                  setPage((n) => n + 1);
                  cancelDetail();
                }}
              >
                Next
              </button>
            </div>
            {pending && <p role="status">Loading {pending.name} details…</p>}
            {detailError && (
              <div role="alert">
                <p>
                  Could not load {detailError.name}. Select it again or retry.
                </p>
                <button onClick={() => void select(detailError)}>
                  Retry feature details
                </button>
              </div>
            )}
          </>
        )}
        <a
          className="text-link"
          href={catalogReview.sourcePage}
          target="_blank"
          rel="noreferrer"
        >
          USGS catalogue & coverage ↗
        </a>
      </details>
    </section>
  );
}
