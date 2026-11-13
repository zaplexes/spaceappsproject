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
}: {
  entries: readonly CatalogEntry[];
  base: BasePosition | null;
  onSelect: (entry: CatalogEntry) => void;
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
          entries.filter((entry) => type === 'all' || entry.typeCode === type),
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
      className="feature-calculator"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Calculate best destinations · Top 10</summary>
      {open && (
        <>
          <p>
            Rank named feature centres from your simulated base by study
            interest, distance and terrain. The highest earned score comes
            first.
          </p>
          <p className="quiet">
            Goal: investigate ancient water. Study interest is an editable
            feature-type heuristic; it does not establish water, minerals or
            scientific findings at a destination.
          </p>
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
              Starting type interests express questions to investigate: valleys
              100, chaos 90, chasms 80, craters 70, plains/cavities/labyrinths
              60; all others 40. They are model choices, not scientific
              measurements.
            </p>
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
          {base && !calculation.error && (
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
                {top.map((result) => (
                  <li key={result.entry.id}>
                    <button onClick={() => onSelect(result.entry)}>
                      <strong>{result.entry.name}</strong> ↗
                    </button>
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
                    <dl>
                      <div>
                        <dt>Study potential</dt>
                        <dd>
                          {points(result.studyPoints)} / {weights.study} · type
                          interest {result.studyInterest}%
                        </dd>
                      </div>
                      <div>
                        <dt>Distance</dt>
                        <dd>
                          {points(result.distancePoints)} / {weights.distance} ·{' '}
                          {points(result.distanceKm)} km one way
                        </dd>
                      </div>
                      <div>
                        <dt>Terrain</dt>
                        <dd>Unknown · 0–{weights.terrain} points unresolved</dd>
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
                  </li>
                ))}
              </ol>
            </>
          )}
          <p className="quiet">
            Distances use a 3,396.19 km Mars sphere and catalogue centres, not
            observation sites or traversable paths. Search radius is a discovery
            filter, not vehicle range. No travel time, safety or excursion
            feasibility is inferred.
          </p>
          <p className="quiet">
            Model {MODEL_VERSION} · catalogue{' '}
            {catalogReview.sourceSha256.slice(0, 12)} ·{' '}
            <a href={catalogReview.sourcePage} target="_blank" rel="noreferrer">
              IAU/USGS source
            </a>
            . Base and preferences last for this page session.
          </p>
        </>
      )}
    </details>
  );
}
