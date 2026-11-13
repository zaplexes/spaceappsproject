import { useState } from 'react';

export interface BasePosition {
  latitude: number;
  longitude: number;
}

export function BasePoint({
  base,
  placing,
  onPlacingChange,
  onChange,
}: {
  base: BasePosition | null;
  placing: boolean;
  onPlacingChange: (placing: boolean) => void;
  onChange: (base: BasePosition | null) => void;
}) {
  const [latitude, setLatitude] = useState(base ? String(base.latitude) : '');
  const [longitude, setLongitude] = useState(
    base ? String(base.longitude) : '',
  );
  return (
    <section
      id="expedition-base"
      className="base-point"
      aria-label="Simulated astronaut base"
    >
      <div className="planner-heading">
        <span className="step-number">1</span>
        <h3>Set your base</h3>
        {base && <span className="status-pill">Base set</span>}
      </div>
      <p className="quiet">Where will your exploration begin?</p>
      <button
        type="button"
        className="primary-action"
        aria-pressed={placing}
        onClick={() => onPlacingChange(!placing)}
      >
        {placing ? 'Cancel base placement' : 'Place base on map'}
      </button>
      {placing && (
        <p role="status">
          Click the Mars surface to set your base. You can also enter
          coordinates below.
        </p>
      )}
      <details className="coordinate-entry">
        <summary>
          {base ? 'Edit base coordinates' : 'Enter coordinates instead'}
        </summary>
        <p className="quiet">
          Planetocentric latitude and east-positive longitude.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onChange({
              latitude: Number(latitude),
              longitude: Number(longitude),
            });
            onPlacingChange(false);
          }}
        >
          <label>
            Base latitude (° N)
            <input
              type="number"
              min="-90"
              max="90"
              step="any"
              required
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
            />
          </label>
          <label>
            Base longitude (° E, −180 to 180)
            <input
              type="number"
              min="-180"
              max="180"
              step="any"
              required
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
            />
          </label>
          <button type="submit">Set base coordinates</button>
        </form>
      </details>
      <p role="status">
        {base
          ? `Simulated base: ${base.latitude.toFixed(5)}° N, ${base.longitude.toFixed(5)}° E`
          : 'No base set.'}
      </p>
      {base && (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            onPlacingChange(false);
          }}
        >
          Clear base
        </button>
      )}
      <p className="quiet">Simulated base · saved for this session.</p>
      <details className="base-limitations">
        <summary>About base placement</summary>
        <p className="quiet">
          A selected base does not establish landing suitability or terrain
          access.
        </p>
      </details>
    </section>
  );
}
