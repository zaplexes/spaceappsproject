import { sourceRecords } from './data/sources';

export function SourceRegistry() {
  return (
    <div className="source-registry">
      <p>
        Orbital images show regional context. Rover images show local surface
        observations. Elevation and slope colours are derived from a DEM;
        geological units are mapped interpretations. Direct mineral measurements
        remain unavailable. The IAU/USGS feature catalogue provides names and
        discovery centres; it does not supply verified observation sites. Global
        colour hillshade provides relief context without numeric heights.
      </p>
      <details>
        <summary>
          Review sources and limitations ({sourceRecords.length})
        </summary>
        <div className="source-records">
          {sourceRecords.map((source) => (
            <article key={source.id}>
              <span className="record-tag">{source.kind}</span>
              <h3>
                <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                  {source.title} ↗
                </a>
              </h3>
              <p>{source.mission}</p>
              <p>{source.citation}</p>
              <dl>
                <div>
                  <dt>Detail</dt>
                  <dd>{source.resolution}</dd>
                </div>
                <div>
                  <dt>Observation date</dt>
                  <dd>{source.observationDate ?? 'Not established'}</dd>
                </div>
                <div>
                  <dt>Publication date</dt>
                  <dd>{source.publicationDate ?? 'Not established'}</dd>
                </div>
                <div>
                  <dt>Date context</dt>
                  <dd>{source.dateNote}</dd>
                </div>
                <div>
                  <dt>Coverage</dt>
                  <dd>
                    {source.bounds
                      ? `W/S/E/N: ${source.bounds.join(', ')} degrees. Envelope only; valid data may have gaps.`
                      : 'Geographic footprint not verified'}
                  </dd>
                </div>
                <div>
                  <dt>Coordinates</dt>
                  <dd>{source.coordinateNote}</dd>
                </div>
                {source.verticalDatum && (
                  <div>
                    <dt>Height reference</dt>
                    <dd>{source.verticalDatum}</dd>
                  </div>
                )}
                <div>
                  <dt>Product</dt>
                  <dd>{source.productId}</dd>
                </div>
                <div>
                  <dt>Source version</dt>
                  <dd>{source.version ?? 'Not established'}</dd>
                </div>
                <div>
                  <dt>Reviewed</dt>
                  <dd>{source.reviewedDate}</dd>
                </div>
                <div>
                  <dt>Usage</dt>
                  <dd>{source.rights}</dd>
                </div>
              </dl>
              <p className="source-eligibility">
                Analysis eligibility:{' '}
                {source.analysisEligible ? 'verified' : 'unverified'}
              </p>
              <ul>
                {source.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
              <details className="source-checksums">
                <summary>Checksum records (SHA-256)</summary>
                <p>
                  Checksums identify reviewed bytes; they do not certify
                  accuracy.
                </p>
                <ul>
                  {source.checksums.map((checksum) => (
                    <li key={checksum.sha256}>
                      {checksum.scope}: <code>{checksum.sha256}</code>
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </div>
      </details>
      <a
        className="text-link"
        href="https://www.nasa.gov/nasa-brand-center/images-and-media/"
        target="_blank"
        rel="noreferrer"
      >
        NASA media usage guidelines ↗
      </a>
      <a
        className="text-link"
        href="https://www.jpl.nasa.gov/jpl-image-use-policy/"
        target="_blank"
        rel="noreferrer"
      >
        JPL image use policy ↗
      </a>
    </div>
  );
}
