import { useEffect, useState } from 'react';
import type { BasePosition } from './BasePoint';
import {
  loadTerrainContext,
  summarizeTerrain,
  type TerrainGrid,
} from './terrain-context';
import manifest from '../data/generated/terrain-context.json' with { type: 'json' };
import elevation from '../data/generated/elevation.json' with { type: 'json' };
export function TerrainContext({
  path,
}: {
  path: readonly BasePosition[] | null;
}) {
  const [grid, setGrid] = useState<TerrainGrid | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const enabled = path !== null;
  useEffect(() => {
    if (!enabled || grid) return;
    const abort = new AbortController();
    setFailed(false);
    loadTerrainContext(abort.signal)
      .then((next) => {
        if (!abort.signal.aborted) setGrid(next);
      })
      .catch(() => {
        if (!abort.signal.aborted) setFailed(true);
      });
    return () => abort.abort();
  }, [enabled, grid, attempt]);
  if (!path) return null;
  const summary = grid ? summarizeTerrain(path, grid) : null;
  return (
    <details className="trip-terrain">
      <summary>Sampled terrain context · exploratory</summary>
      <p>
        Nearest retained source samples on shortest-distance arcs. These do not
        check the terrain between samples or around an obstacle.
      </p>
      {!grid && !failed && (
        <p role="status">Loading numerical terrain context…</p>
      )}
      {failed && (
        <p role="alert">
          Terrain context unavailable. Distance estimates still work.{' '}
          <button onClick={() => setAttempt((n) => n + 1)}>
            Retry terrain context
          </button>
        </p>
      )}
      {summary && (
        <>
          <p>
            {summary.heights} of {summary.sampled} arc samples have local
            elevation context. All other samples remain unknown.
          </p>
          {summary.minimum !== null ? (
            <p>
              Sampled elevation: {summary.minimum.toFixed(1)} to{' '}
              {summary.maximum!.toFixed(1)} m relative to the source Mars
              areoid. Maximum sampled exploratory DEM gradient:{' '}
              {summary.maximumGradient?.toFixed(2) ?? 'unknown'}°.
            </p>
          ) : (
            <p>No retained numerical terrain samples cover this trip.</p>
          )}
        </>
      )}
      <p>
        Source pixels: 20 m; retained spacing:{' '}
        {manifest.sampleSpacingMetresInProjection} m in projection. Independent
        alignment and height conversion remain unverified. No ascent total,
        terrain score, obstacle clearance or route eligibility is inferred.
      </p>
      <a href={elevation.sourcePage} target="_blank" rel="noreferrer">
        USGS terrain source ↗
      </a>
    </details>
  );
}
