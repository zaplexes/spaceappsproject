import slope from './data/generated/slope.json' with { type: 'json' };

export function SlopeLegend({
  opacity,
  onOpacity,
}: {
  opacity: number;
  onOpacity: (value: number) => void;
}) {
  return (
    <section className="slope-legend" aria-label="Estimated slope legend">
      <strong>Estimated DEM slope · degrees</strong>
      <div className="slope-ramp" />
      <div className="legend-values">
        <span>0°</span>
        <span>45°</span>
        <span>90°</span>
      </div>
      <p>
        Observed range: {slope.minimumDegrees.toFixed(1)}–
        {slope.maximumDegrees.toFixed(1)}°. Colour shows gradient, with no
        walking limits or risk classes.
      </p>
      <p>
        Horn 3 × 3 gradient of areoid-relative heights. 20 m source cells;
        individual rocks and small obstacles are unresolved.
      </p>
      <p>
        Transparent edges and gaps are unknown. Alignment and physical surface
        inclination remain unverified.
      </p>
      <label>
        Slope opacity
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={Math.round(opacity * 100)}
          onChange={(event) => onOpacity(Number(event.target.value) / 100)}
        />
      </label>
      <a href={slope.sourcePage} target="_blank" rel="noreferrer">
        USGS slope source ↗
      </a>
      <a href={slope.algorithmReference} target="_blank" rel="noreferrer">
        Gradient method reference ↗
      </a>
    </section>
  );
}
