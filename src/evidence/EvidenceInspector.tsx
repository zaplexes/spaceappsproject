import type { MobilityMode } from '../data/mission';
import { StopEvidence } from '../stops/StopEvidence';
import { StopInvestigation } from '../StopInvestigation';
import {
  evidenceProducts,
  coverageDescription,
  targetPosition,
  type EvidenceProduct,
  type EvidenceTarget,
  type EvidenceCategory,
} from './evidence';

function ProductCard({
  product,
  onViewLayer,
}: {
  product: EvidenceProduct;
  onViewLayer: (id: string) => void;
}) {
  const { source, coverage } = product;
  const mapProduct = !['Rover image', 'Feature catalogue'].includes(
    source.kind,
  );
  return (
    <details className="evidence-product" data-source-id={source.id}>
      <summary>
        <strong>{source.title}</strong>
        <span>{coverageDescription(coverage)}</span>
      </summary>
      <p className="record-tag">{source.kind}</p>
      <p>{source.mission}</p>
      <dl>
        <div>
          <dt>Detail / scale</dt>
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
      </dl>
      <p className="evidence-limit">
        {source.analysisEligible
          ? 'Analysis eligibility recorded in source review.'
          : 'Context evidence · not approved for route or terrain scoring.'}
      </p>
      {coverage === 'envelope' && (
        <p className="quiet">
          An envelope match does not establish valid image pixels, alignment or
          coverage of the entire feature.
        </p>
      )}
      <div className="evidence-actions">
        {mapProduct && coverage === 'envelope' && (
          <button onClick={() => onViewLayer(source.id)}>
            View layer on map
          </button>
        )}
        <a href={source.sourceUrl} target="_blank" rel="noreferrer">
          Open product source ↗
        </a>
      </div>
      <details className="evidence-source-review">
        <summary>Review provenance & limitations</summary>
        <p>{source.citation}</p>
        <dl>
          <div>
            <dt>Product</dt>
            <dd>{source.productId}</dd>
          </div>
          <div>
            <dt>Reviewed</dt>
            <dd>{source.reviewedDate}</dd>
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
        </dl>
        <ul>
          {source.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </details>
    </details>
  );
}

const explanations: Record<EvidenceCategory, string> = {
  Imagery:
    'Use orbital images to inspect regional context. Image detail and alignment limit what can be inferred.',
  Terrain:
    'Relief colours and derived displays provide context. Numeric site height, validated surface slope and approach difficulty are not established.',
  Geology:
    'These maps are published interpretations. A service envelope does not identify the geological unit or minerals at this point.',
  'Rover observations':
    'A surface photograph is linked to a sample record; its footprint and drill position remain unverified.',
  Catalogue:
    'Names, centre coordinates and dimensions are discovery metadata, separate from scientific observations.',
};

export function EvidenceInspector({
  target,
  mode,
  onViewLayer,
}: {
  target: EvidenceTarget | null;
  mode: MobilityMode;
  onViewLayer: (id: string) => void;
}) {
  const name = target
    ? target.kind === 'catalogue'
      ? target.feature.name
      : target.stop.name
    : null;
  const products = target ? evidenceProducts(target) : [];
  const contextual = products.filter(
    (product) => product.coverage !== 'outside',
  );
  const outside = products.filter((product) => product.coverage === 'outside');
  const position = target ? targetPosition(target) : null;
  return (
    <section
      id="evidence-inspector"
      className="evidence-inspector"
      aria-labelledby="evidence-heading"
    >
      <header className="evidence-heading">
        <div>
          <span className="eyebrow">03 / INSPECT THE EVIDENCE</span>
          <h2 id="evidence-heading">
            {name ? `${name} · evidence` : 'Inspect the evidence'}
          </h2>
          <p>
            Review what is documented, explore context products and keep missing
            evidence visible.
          </p>
        </div>
        {target && (
          <a className="evidence-map-link" href="#exploration-map">
            Return to map ↑
          </a>
        )}
      </header>
      {!target ? (
        <div className="evidence-empty">
          <strong>Choose a place to investigate</strong>
          <p>
            Select a catalogue feature, a calculator result or a Jezero science
            stop. Its evidence will appear here.
          </p>
          <div className="evidence-actions">
            <a href="#destination-calculator">Go to destination calculator ↑</a>
            <a href="#science-stops">Choose a Jezero science stop ↑</a>
          </div>
        </div>
      ) : (
        <>
          <div className="evidence-summary" aria-label="Evidence summary">
            <div>
              <strong>
                {
                  contextual.filter(
                    (item) =>
                      item.coverage === 'envelope' &&
                      item.category !== 'Catalogue',
                  ).length
                }
              </strong>
              <span>context products with an envelope match</span>
            </div>
            <div>
              <strong>
                {products.some((product) => product.coverage === 'linked')
                  ? 'Linked reference'
                  : 'Not linked'}
              </strong>
              <span>local rover observations in this app</span>
            </div>
            <div>
              <strong>Unverified</strong>
              <span>exact observation site and terrain access</span>
            </div>
          </div>
          <nav className="evidence-section-nav" aria-label="Evidence sections">
            <a href="#evidence-observations">Documented observations</a>
            <a href="#evidence-context">Imagery & maps</a>
            <a href="#evidence-gaps">Missing evidence</a>
          </nav>
          <div className="evidence-workspace">
            <div id="evidence-observations" className="evidence-observations">
              <section className="evidence-facts">
                <h3>What is documented</h3>
                {target.kind === 'catalogue' ? (
                  <>
                    <p>
                      This catalogue identifies{' '}
                      <strong>{target.feature.name}</strong> as{' '}
                      <strong>{target.feature.type}</strong> in{' '}
                      {target.feature.regionName}.
                    </p>
                    <p>
                      Published approximate dimension:{' '}
                      {target.feature.dimensionKm === null
                        ? 'unknown'
                        : `${target.feature.dimensionKm.toLocaleString('en-US')} km`}
                      .
                    </p>
                    <p>
                      The feature-type study score is a planning preference. No
                      measured scientific value, composition or evidence of
                      water is assigned by this catalogue.
                    </p>
                    <a
                      className="text-link"
                      href={target.feature.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Catalogue evidence for this feature ↗
                    </a>
                  </>
                ) : (
                  <>
                    <p>{target.stop.description}</p>
                    <p>
                      Primary sample: <strong>{target.stop.sample}</strong> ·{' '}
                      {target.stop.rockType}. Sample sealing: sol{' '}
                      {target.stop.solSealed} ({target.stop.dateSealed}).
                    </p>
                    <a
                      className="text-link"
                      href={target.stop.source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Published sample record ↗
                    </a>
                  </>
                )}
                <p className="quiet">
                  {position
                    ? `Display reference: ${position.latitude.toFixed(5)}° N, ${position.longitude.toFixed(5)}° E.`
                    : 'Display reference unknown.'}{' '}
                  {target.kind === 'catalogue'
                    ? 'Catalogue centre; not a selected observation site.'
                    : 'Approximate dossier reference; latitude convention, reference point and precision remain unverified.'}
                </p>
              </section>
              <section id="evidence-gaps" className="evidence-missing">
                <h3>What is still unknown</h3>
                <ul>
                  <li>
                    Verified observation-site coordinates, accuracy and access.
                  </li>
                  <li>
                    Numeric site elevation, validated surface slope and a mapped
                    approach route.
                  </li>
                  <li>Direct mineral measurements in the current app.</li>
                  <li>
                    {target.kind === 'catalogue'
                      ? 'Site-specific scientific observations, a study question and the required instruments.'
                      : 'Equipment capability, task duration and feasible travel for the proposed investigation.'}
                  </li>
                </ul>
                <p>
                  Missing evidence earns no favorable terrain points. These
                  context products do not certify a destination or route as
                  safe.
                </p>
              </section>
              {target.kind === 'sample' ? (
                <>
                  <StopInvestigation
                    key={target.stop.id}
                    stop={target.stop}
                    mode={mode}
                  />
                  <StopEvidence key={target.stop.id} stop={target.stop} />
                </>
              ) : (
                <section className="evidence-facts">
                  <h3>Local surface observations</h3>
                  <p>
                    No rover surface record is linked to this catalogue feature
                    in the app. Nearby Jezero sample photographs are not
                    assigned to it by proximity.
                  </p>
                </section>
              )}
            </div>
            <div id="evidence-context" className="evidence-context">
              <h3>Explore the context products</h3>
              <p className="quiet">
                Coverage is checked at the selected reference point, not the
                camera viewport. Expand a product for detail, source and
                limitations. Map actions open existing layers; they do not make
                a site measurement.
              </p>
              {(
                [
                  'Imagery',
                  'Terrain',
                  'Geology',
                  'Rover observations',
                  'Catalogue',
                ] as const
              ).map((category) => {
                const matches = contextual.filter(
                  (product) => product.category === category,
                );
                if (
                  category === 'Rover observations' &&
                  target.kind !== 'sample'
                )
                  return null;
                return (
                  <section
                    className="evidence-category"
                    key={category}
                    aria-label={`${category} evidence`}
                  >
                    <h4>
                      {category} <span>{matches.length}</span>
                    </h4>
                    <p className="quiet">{explanations[category]}</p>
                    {matches.length ? (
                      matches.map((product) => (
                        <ProductCard
                          key={product.source.id}
                          product={product}
                          onViewLayer={onViewLayer}
                        />
                      ))
                    ) : (
                      <p>
                        No reviewed context product has a matching source
                        envelope here.
                      </p>
                    )}
                  </section>
                );
              })}
              {!!outside.length && (
                <details className="outside-evidence">
                  <summary>
                    Products outside this reference point ({outside.length})
                  </summary>
                  <p className="quiet">
                    These products are retained in the app but their envelopes
                    do not include this reference point.
                  </p>
                  {outside.map((product) => (
                    <ProductCard
                      key={product.source.id}
                      product={product}
                      onViewLayer={onViewLayer}
                    />
                  ))}
                </details>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
