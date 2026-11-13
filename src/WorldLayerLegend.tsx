import review from '../data/manifests/world-layers-review.json' with { type: 'json' };

export function WorldLayerLegend({
  geology,
  opacity,
  onOpacity,
}: {
  geology: boolean;
  opacity: number;
  onOpacity: (opacity: number) => void;
}) {
  return (
    <section
      className="world-layer-legend"
      aria-label={
        geology ? 'Global geology legend' : 'Global elevation context legend'
      }
    >
      <strong>
        {geology
          ? 'Geological interpretation · 1:20,000,000'
          : 'MOLA / HRSC colour hillshade'}
      </strong>
      <p>
        {geology
          ? 'Broad regional units. Zooming in does not create site-scale geological evidence. No unit is assigned to a stop.'
          : 'Colour and artificial shading show regional relief. The product name describes a 200 m grid; a numeric colour-to-height legend is not established here. No height readout, slope calculation or 3D displacement.'}
      </p>
      <label>
        Global context opacity
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={Math.round(opacity * 100)}
          onChange={(event) => onOpacity(Number(event.target.value) / 100)}
        />
      </label>
      {geology && (
        <details>
          <summary>
            Global geological units ({review.geologyLegend.length})
          </summary>
          <ul className="geology-units">
            {review.geologyLegend.map((unit) => (
              <li key={unit.label}>
                <img
                  src={`data:image/png;base64,${unit.imageData}`}
                  alt=""
                  width={unit.width}
                  height={unit.height}
                />
                <span>{unit.label}</span>
              </li>
            ))}
          </ul>
          <p>
            Swatches and labels retained from the NASA-hosted map-service
            legend.
          </p>
        </details>
      )}
      <p>
        Extent indicates a service envelope. Valid pixels, source alignment and
        suitability for routing remain unverified.
      </p>
      <a
        href={
          geology
            ? 'https://pubs.usgs.gov/sim/3292/'
            : 'https://astrogeology.usgs.gov/search/map/mars_mgs_mola_mex_hrsc_blended_shaded_relief_200m'
        }
        target="_blank"
        rel="noreferrer"
      >
        {geology
          ? 'USGS SIM 3292 · Tanaka et al. (2014)'
          : 'USGS blended relief source'}{' '}
        ↗
      </a>
    </section>
  );
}
