import { useState } from 'react';
import history from '../data/manifests/meda-history.json' with { type: 'json' };
export function HistoricalEnvironment() {
  const [period, setPeriod] = useState('first-report');
  const observation = history.observations.find((item) => item.id === period)!;
  return (
    <section
      id="historical-environment"
      className="historical-environment"
      aria-label="Historical MEDA observations"
    >
      <p className="eyebrow">PERSEVERANCE / MEDA / HISTORICAL</p>
      <h2>Jezero environment observations</h2>
      <p>
        Historical readings at the rover, not current weather or a global
        forecast. These observations do not change your trip score or budget.
      </p>
      <label>
        Observation period
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          {history.observations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.dateLabel}
            </option>
          ))}
        </select>
      </label>
      <div aria-live="polite">
        <p>{observation.dateLabel}</p>
        <dl>
          {observation.temperatureStartC !== null && (
            <div>
              <dt>Temperature during first session</dt>
              <dd>
                Just below {observation.temperatureStartC}°C →{' '}
                {observation.temperatureEndC}°C
              </dd>
            </div>
          )}
          {observation.temperatureLowC !== null && (
            <div>
              <dt>Reported temperature range</dt>
              <dd>
                {observation.temperatureLowC} to {observation.temperatureHighC}
                °C
              </dd>
            </div>
          )}
          <div>
            <dt>Pressure</dt>
            <dd>
              {observation.pressurePa === null
                ? 'Not reported for this window'
                : `${observation.pressurePa} Pa`}
            </dd>
          </div>
          <div>
            <dt>Wind gusts</dt>
            <dd>
              {observation.gustMetresPerSecond === null
                ? 'Not reported for this window'
                : `About ${observation.gustMetresPerSecond} m/s`}
            </dd>
          </div>
        </dl>
      </div>
      <p>{history.location}</p>
      <a href={history.sourceUrl} target="_blank" rel="noreferrer">
        NASA/JPL report · published {history.publicationDate} ↗
      </a>
      <details>
        <summary>Observation provenance and limitations</summary>
        <p>
          {history.citation} · {history.productId} · reviewed{' '}
          {history.reviewDate}
        </p>
        <ul>
          {history.limitations.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        <p>{history.snapshotNote}</p>
      </details>
    </section>
  );
}
