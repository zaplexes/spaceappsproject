import { catalogReview, type CatalogFeature } from './catalog';

export function CatalogFeatureDetails({
  feature,
  added,
  onAdd,
  onRemove,
}: {
  feature: CatalogFeature;
  added: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <section aria-live="polite" aria-label="Catalogue feature details">
      <span className="record-tag">IAU / USGS · CATALOGUE FEATURE</span>
      <h2>{feature.name}</h2>
      <p>
        A named surface feature. Its catalogue centre is a reference for
        discovery; an exact science observation site has not been selected.
      </p>
      <dl className="sample-facts">
        <div>
          <dt>Feature type</dt>
          <dd>{feature.type}</dd>
        </div>
        <div>
          <dt>Map region</dt>
          <dd>{feature.regionName}</dd>
        </div>
        <div>
          <dt>Centre latitude</dt>
          <dd>{feature.latitude}° · planetocentric</dd>
        </div>
        <div>
          <dt>Centre longitude</dt>
          <dd>{feature.longitudeEast}° E</dd>
        </div>
        <div>
          <dt>Approx. diameter / longest dimension</dt>
          <dd>
            {feature.dimensionKm === null
              ? 'Unknown'
              : `${feature.dimensionKm.toLocaleString('en-US', { maximumFractionDigits: 2 })} km`}
          </dd>
        </div>
        <div>
          <dt>Catalogue identifier</dt>
          <dd>{feature.id}</dd>
        </div>
      </dl>
      {feature.nameOrigin && (
        <div className="evidence-note">
          <strong>Name origin</strong>
          <p>{feature.nameOrigin}</p>
          <p>This explains the name, not the feature’s geology.</p>
        </div>
      )}
      <div className="catalog-candidate-actions">
        <button disabled={added} onClick={onAdd}>
          {added ? 'Added to candidate stops' : 'Add candidate science stop'}
        </button>
        {added && <button onClick={onRemove}>Remove candidate stop</button>}
        <p>
          Candidate list changes last for this page session; reloading clears
          them.
        </p>
      </div>
      <div className="evidence-note">
        <strong>
          {added
            ? 'Candidate science stop · review needed'
            : 'Science planning still needed'}
        </strong>
        <p>
          Scientific question, observation site, tasks, instruments and access
          remain undefined. The current ancient-water investigation concerns the
          three Jezero outcrops; it does not assign scientific value to every
          catalogue feature.
        </p>
        <p>
          Global browsing does not establish local terrain coverage or route
          feasibility for walking astronauts, crew vehicles or robotic rovers.
        </p>
      </div>
      <a
        className="text-link"
        href={feature.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        Official feature record ↗
      </a>
      <details className="location-review">
        <summary>Catalogue provenance & limitations</summary>
        <a
          className="text-link"
          href={`${import.meta.env.BASE_URL}${catalogReview.snapshot.assetUrl.slice(1)}`}
          download
        >
          Download retained USGS export
        </a>
        <p>{catalogReview.citation}</p>
        <p>
          Imported {catalogReview.retrievedAt}. Snapshot{' '}
          {catalogReview.sourceSha256.slice(0, 12)}. Source release version and
          publication date are not established.
        </p>
        <p>{catalogReview.coordinateNote}</p>
        <ul>
          {catalogReview.limitations.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
