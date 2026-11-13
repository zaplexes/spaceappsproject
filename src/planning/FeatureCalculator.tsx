import { useMemo, useState } from 'react';
import { catalogReview, type CatalogEntry } from '../catalog/catalog';
import type { BasePosition } from './BasePoint';
import {
  defaultStudyInterest,
  initialStudyInterest,
  initialWeights,
  MODEL_VERSION,
  rankFeatures,
} from './ranking';

const points = (value: number) => value.toFixed(1);

export function FeatureCalculator({
  entries,
  base,
  onSelect,
  loading,
  failed,
  onRetry,
  onOpenChange,
}: {
  entries: readonly CatalogEntry[] | null;
  base: BasePosition | null;
  onSelect: (entry: CatalogEntry) => void;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [radius, setRadius] = useState('100');
  const [weights, setWeights] = useState({
    study: '50',
    distance: '30',
    terrain: '20',
  });
  const [interest, setInterest] = useState<Record<string, string>>({});
  const [type, setType] = useState('all');
  const [open, setOpen] = useState(false);
  const calculation = useMemo(() => {
    if (!base) return { results: [], error: null };
    try {
      if (
        !radius.trim() ||
        Object.values(weights).some((value) => !value.trim()) ||
        Object.values(interest).some((value) => !value.trim())
      )
        throw new Error(
          'Complete the radius, weights and study-interest values.',
        );
      return {
        results: rankFeatures(
          (entries ?? []).filter(
            (entry) => type === 'all' || entry.typeCode === type,
          ),
          base,
          Number(radius),
          {
            study: Number(weights.study),
            distance: Number(weights.distance),
            terrain: Number(weights.terrain),
          },
          {
            ...initialStudyInterest,
            ...Object.fromEntries(
              Object.entries(interest).map(([key, value]) => [
                key,
                Number(value),
              ]),
            ),
          },
        ),
        error: null,
      };
    } catch (error) {
      return { results: [], error: (error as Error).message };
    }
  }, [entries, base, radius, weights, interest, type]);
  const top = calculation.results.slice(0, 10);
  const first = top[0];
  const uncertainOrder =
    first &&
    calculation.results
      .slice(1)
      .some((item) => item.maximumPoints > first.minimumPoints);
  return (
    <details
      id="destination-calculator"
      className="feature-calculator"
      onToggle={(event) => {
        if (event.target !== event.currentTarget) return;
        setOpen(event.currentTarget.open);
        onOpenChange(event.currentTarget.open);
      }}
    >
      <summary>
        <span className="step-number">2</span> Calculate best destinations · Top
        10
      </summary>
      {open && (
        <>
          <p>Find places worth investigating from your base.</p>
          <p className="quiet">
            Your exploration priorities · equal starting interests · terrain
            unknown
          </p>
          {loading && <p role="status">Loading destinations…</p>}
          {failed && (
            <div role="alert">
              <p>Destinations could not load.</p>
              <button onClick={onRetry}>Retry destinations</button>
            </div>
          )}
          <div className="destination-filters">
            <label>
              Search radius from base (km)
              <input
                type="number"
                min="0.001"
                step="any"
                value={radius}
                onChange={(event) => setRadius(event.target.value)}
              />
            </label>
            <label>
              Rank feature types
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="all">All named feature types</option>
                {catalogReview.types.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <details>
            <summary>Scoring rules & preferences</summary>
            <p>
              Weights must total 100. These are simulation preferences, separate
              from equipment capabilities or travel limits.
            </p>
            {(['study', 'distance', 'terrain'] as const).map((key) => (
              <label key={key}>
                {key === 'study'
                  ? 'Study potential'
                  : key === 'distance'
                    ? 'Distance'
                    : 'Terrain'}{' '}
                weight
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={weights[key]}
                  onChange={(event) =>
                    setWeights((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
            <p>
              Study points = weight × type interest / 100. Distance points =
              weight × (1 − one-way distance / search radius). Terrain points
              remain unknown because no reviewed analysis-ready terrain is
              available.
            </p>
            <p>
              Every feature type starts with 50% study interest. Adjust these
              interests for your expedition. Equal interests leave distance to
              distinguish candidates; they do not establish equal scientific
              value or terrain suitability.
            </p>
            <details className="type-preferences">
              <summary>Study interest by feature type</summary>
              {catalogReview.types.map((item) => (
                <label key={item.code}>
                  {item.name} study interest (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={
                      interest[item.code] ??
                      String(
                        initialStudyInterest[item.code] ?? defaultStudyInterest,
                      )
                    }
                    onChange={(event) =>
                      setInterest((previous) => ({
                        ...previous,
                        [item.code]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </details>
            <button
              onClick={() => {
                setWeights(
                  Object.fromEntries(
                    Object.entries(initialWeights).map(([key, value]) => [
                      key,
                      String(value),
                    ]),
                  ) as typeof weights,
                );
                setInterest({});
              }}
            >
              Reset scoring preferences
            </button>
          </details>
          {!base && (
            <p role="status">Set your base to calculate recommendations.</p>
          )}
          {calculation.error && <p role="alert">{calculation.error}</p>}
          {base && entries && !calculation.error && (
            <>
              <p role="status">
                {calculation.results.length} destinations within radius ·
                showing {top.length} of up to 10.
              </p>
              {first ? (
                <div className="evidence-note">
                  <strong>
                    Provisional recommendation: {first.entry.name}
                  </strong>
                  <p>
                    {points(first.minimumPoints)} earned points:{' '}
                    {points(first.studyPoints)} study +{' '}
                    {points(first.distancePoints)} distance. Highest score under
                    your preferences; terrain is unknown.
                  </p>
                  {uncertainOrder && (
                    <p>
                      Score ranges overlap. Terrain evidence could change the
                      recommendation.
                    </p>
                  )}
                </div>
              ) : (
                <p>
                  No named feature centres match. Increase the radius or change
                  feature type.
                </p>
              )}
              <ol
                className="destination-results"
                tabIndex={0}
                aria-label="Top destinations with criterion scores"
              >
                {top.map((result, index) => (
                  <li
                    key={result.entry.id}
                    className={
                      index === 0 ? 'recommended-destination' : undefined
                    }
                  >
                    <div className="destination-card-heading">
                      <span className="destination-rank">{index + 1}</span>
                      <button onClick={() => onSelect(result.entry)}>
                        <strong>{result.entry.name}</strong> ↗
                      </button>
                    </div>
                    <p className="quiet">
                      {
                        catalogReview.types.find(
                          (item) => item.code === result.entry.typeCode,
                        )?.name
                      }{' '}
                      · {result.entry.regionId.toUpperCase()}
                    </p>
                    <strong>
                      {points(result.minimumPoints)}–
                      {points(result.maximumPoints)} / 100 points
                    </strong>
                    <div
                      className="score-bar"
                      role="img"
                      aria-label={`${points(result.studyPoints)} study points, ${points(result.distancePoints)} distance points; terrain unknown`}
                    >
                      <span
                        className="study-score"
                        style={{ width: `${result.studyPoints}%` }}
                      />
                      <span
                        className="distance-score"
                        style={{ width: `${result.distancePoints}%` }}
                      />
                      <span
                        className="unknown-score"
                        style={{ width: `${Number(weights.terrain)}%` }}
                      />
                    </div>
                    <p className="destination-distance">
                      {points(result.distanceKm)} km from base{' '}
                      <span>· Terrain unknown</span>
                    </p>
                    <details className="score-explanation">
                      <summary>Why this score?</summary>
                      <dl>
                        <div>
                          <dt>Study potential</dt>
                          <dd>
                            {points(result.studyPoints)} / {weights.study} ·
                            type interest {result.studyInterest}%
                          </dd>
                        </div>
                        <div>
                          <dt>Distance</dt>
                          <dd>
                            {points(result.distancePoints)} / {weights.distance}{' '}
                            · {points(result.distanceKm)} km one way
                          </dd>
                        </div>
                        <div>
                          <dt>Terrain</dt>
                          <dd>
                            Unknown · 0–{weights.terrain} points unresolved
                          </dd>
                        </div>
                      </dl>
                      <p className="quiet">
                        {points(result.distanceKm * 2)} km out-and-back
                        surface-distance lower bound; actual route and access
                        unknown.
                      </p>
                      <a
                        className="text-link"
                        href={`https://planetarynames.wr.usgs.gov/Feature/${result.entry.id.slice(4)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Feature data & source ↗
                      </a>
                    </details>
                  </li>
                ))}
              </ol>
            </>
          )}
          <details className="calculator-method">
            <summary>How suggestions work & data sources</summary>
            <p className="quiet">
              Study potential uses an editable feature-type heuristic. It does
              not establish water, minerals or scientific findings at a
              destination. Terrain is unknown and contributes no earned points.
            </p>
            <p className="quiet">
              Distances use a 3,396.19 km Mars sphere and catalogue centres, not
              observation sites or traversable paths. Search radius is a
              discovery filter, not vehicle range. No travel time, safety or
              excursion feasibility is inferred.
            </p>
            <p className="quiet">
              Model {MODEL_VERSION} · catalogue{' '}
              {catalogReview.sourceSha256.slice(0, 12)} ·{' '}
              <a
                href={catalogReview.sourcePage}
                target="_blank"
                rel="noreferrer"
              >
                IAU/USGS source
              </a>
              . Base and preferences last for this page session.
            </p>
          </details>
        </>
      )}
    </details>
  );
}
