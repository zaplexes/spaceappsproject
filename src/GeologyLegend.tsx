import geology from './data/generated/geology.json' with { type: 'json' };
export function GeologyLegend({
  opacity,
  onOpacity,
}: {
  opacity: number;
  onOpacity: (value: number) => void;
}) {
  return (
    <section className="geology-legend" aria-label="Geological unit legend">
      <strong>Geological interpretation · 1:75,000</strong>
      <p className="alignment-warning">
        USGS reports offsets of about 100–200 m from controlled CTX imagery.
        Alignment unverified.
      </p>
      <label>
        Geology opacity
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={Math.round(opacity * 100)}
          onChange={(event) => onOpacity(Number(event.target.value) / 100)}
        />
      </label>
      <details>
        <summary>Geological units ({geology.units.length})</summary>
        <ul className="geology-units">
          {geology.units.map((unit) => (
            <li key={unit.sourceCode}>
              <span
                className="geology-swatch"
                style={{ background: unit.colour }}
                aria-hidden="true"
              />
              <span>
                <b>{unit.symbol}</b> · {unit.name}
              </span>
            </li>
          ))}
        </ul>
        <p>
          Display colours; not the original USGS palette. Unit names follow the
          source map.
        </p>
      </details>
      <p>
        <span className="geology-swatch unclassified" aria-hidden="true" />{' '}
        Transparent areas are unclassified or withheld. The extent indicator
        describes the map boundary, not complete data coverage.
      </p>
      <p>
        Regional context from orbital mapping. Not direct mineral measurements
        or precise stop locations.
      </p>
      <a href={geology.sourcePage} target="_blank" rel="noreferrer">
        USGS SIM 3464 · Sun & Stack (2020) ↗
      </a>
      <a href={geology.sourceReadme} target="_blank" rel="noreferrer">
        USGS data & offset note ↗
      </a>
    </section>
  );
}
