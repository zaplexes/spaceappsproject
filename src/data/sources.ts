import meda from '../../data/manifests/meda-history.json' with { type: 'json' };
import imageryReview from '../../data/manifests/imagery-review.json' with { type: 'json' };
import surfaceImages from '../../data/manifests/surface-images.json' with { type: 'json' };
import elevation from './generated/elevation.json' with { type: 'json' };
import geology from './generated/geology.json' with { type: 'json' };
import slope from './generated/slope.json' with { type: 'json' };
import { capabilitiesUrl, imagerySources } from './layers';
import nomenclature from '../../data/manifests/nomenclature-review.json' with { type: 'json' };
import worldLayers from '../../data/manifests/world-layers-review.json' with { type: 'json' };

export type EvidenceKind =
  | 'Orbital image'
  | 'Rover image'
  | 'Derived elevation'
  | 'Derived slope'
  | 'Geological interpretation'
  | 'Feature catalogue'
  | 'Shaded relief'
  | 'Historical environment';

export interface SourceRecord {
  id: string;
  title: string;
  kind: EvidenceKind;
  mission: string;
  productId: string;
  sourceUrl: string;
  citation: string;
  rights: string;
  reviewedDate: string;
  publicationDate: string | null;
  observationDate: string | null;
  dateNote: string;
  version: string | null;
  resolution: string;
  bounds: readonly number[] | null;
  coordinateNote: string;
  verticalDatum: string | null;
  checksums: readonly {
    scope: 'Metadata snapshot' | 'Source bytes' | 'Display asset';
    sha256: string;
  }[];
  analysisEligible: boolean;
  limitations: readonly string[];
}

// Reuse reviewed manifests; unknown source values remain explicit.
export const sourceRecords: readonly SourceRecord[] = [
  ...worldLayers.sources.map((source): SourceRecord => ({
    id: source.layerId,
    title: source.name,
    kind: source.kind as EvidenceKind,
    mission: source.mission,
    productId: source.productId,
    sourceUrl: source.sourcePage,
    citation: source.credit,
    rights:
      source.layerId === 'ctx-global'
        ? 'NASA Trek catalogue grants free use of the beta01 mosaic for all purposes with the listed credit.'
        : 'See the credited source page and publisher usage policy; no additional product-specific licence was established in this review.',
    reviewedDate: worldLayers.reviewDateUtc,
    publicationDate: source.publicationDate,
    observationDate: null,
    dateNote:
      'Service catalog timestamps and protocol versions are not observation dates or scientific release versions. Global geology identifies the 2014 published map.',
    version: source.sourceVersion,
    resolution: source.detail,
    bounds: source.extent,
    coordinateNote: worldLayers.coordinateNote,
    verticalDatum: null,
    checksums: source.snapshots.map((snapshot) => ({
      scope: 'Metadata snapshot',
      sha256: snapshot.sha256,
    })),
    analysisEligible: false,
    limitations: [
      ...source.limitations,
      ...(source.layerId === 'relief-global'
        ? [worldLayers.limitations[0]]
        : []),
    ],
  })),
  {
    id: 'mars-nomenclature',
    title: nomenclature.title,
    kind: 'Feature catalogue',
    mission: 'IAU / USGS · multi-source nomenclature',
    productId: 'MARS_nomenclature_center_pts',
    sourceUrl: nomenclature.sourcePage,
    citation: nomenclature.citation,
    rights: nomenclature.rights,
    reviewedDate: nomenclature.retrievedAt.slice(0, 10),
    publicationDate: nomenclature.sourcePublicationDate,
    observationDate: null,
    dateNote:
      'Retrieval time identifies this retained export; source release date/version and observation dates are not established. Legacy archive metadata is disclosed in the limitations.',
    version: nomenclature.sourceVersion,
    resolution:
      'Catalogue feature centres and approximate dimensions; positioning accuracy not established.',
    bounds: [-180, -90, 180, 90],
    coordinateNote: nomenclature.coordinateNote,
    verticalDatum: null,
    checksums: [
      { scope: 'Source bytes', sha256: nomenclature.sourceSha256 },
      { scope: 'Display asset', sha256: nomenclature.index.sha256 },
    ],
    analysisEligible: false,
    limitations: nomenclature.limitations,
  },
  ...imagerySources.map((source): SourceRecord => {
    const review = imageryReview.sources.find(
      (entry) => entry.productId === source.productId,
    );
    if (!review) throw new Error(`Missing imagery review: ${source.productId}`);
    return {
      id: source.id,
      title: source.name,
      kind: 'Orbital image',
      mission: source.mission,
      productId: source.productId,
      sourceUrl: capabilitiesUrl(source),
      citation: source.credit,
      rights: imageryReview.rights,
      reviewedDate: imageryReview.reviewDateUtc,
      publicationDate: review.sourcePublicationDate,
      observationDate: null,
      dateNote: review.dateNote,
      version: review.sourceVersion,
      resolution: review.resolutionNote,
      bounds: source.extent,
      coordinateNote: review.coordinateNote,
      verticalDatum: null,
      checksums: review.snapshots.map((snapshot) => ({
        scope: 'Metadata snapshot',
        sha256: snapshot.sha256,
      })),
      analysisEligible: false,
      limitations: [
        'Footprint is a service envelope, not a guarantee of valid pixels or obstacle detection.',
        'Independent alignment and suitability for route analysis remain unverified.',
        imageryReview.checksumScope,
      ],
    };
  }),
  {
    id: 'elevation',
    title: 'Jezero CTX elevation',
    kind: 'Derived elevation',
    mission: `${elevation.mission} · ${elevation.instrument}`,
    productId: elevation.productId,
    sourceUrl: elevation.sourcePage,
    citation: elevation.citation,
    rights: elevation.rights,
    reviewedDate: elevation.verifiedDate,
    publicationDate: elevation.sourcePublicationDate,
    observationDate: null,
    dateNote:
      'Publication date identifies the released product, not an acquisition date.',
    version: null,
    resolution: `${elevation.sourcePixelSizeMetres.join(' × ')} metres per source pixel; source pixels retained in the colour display.`,
    bounds: elevation.bounds,
    coordinateNote: `${elevation.latitudeType} latitude; ${elevation.longitudeConvention}; ${elevation.referenceSphereRadiusMetres}-metre Mars sphere.`,
    verticalDatum: elevation.verticalDatum,
    checksums: [
      { scope: 'Source bytes', sha256: elevation.sourceSha256 },
      { scope: 'Display asset', sha256: elevation.assetSha256 },
    ],
    analysisEligible: elevation.analysisEligible,
    limitations: elevation.limitations,
  },
  {
    id: 'slope',
    title: 'Jezero estimated slope',
    kind: 'Derived slope',
    mission: `${slope.mission} · ${slope.instrument}`,
    productId: slope.productId,
    sourceUrl: slope.sourcePage,
    citation: slope.citation,
    rights: slope.rights,
    reviewedDate: slope.verifiedDate,
    publicationDate: slope.sourcePublicationDate,
    observationDate: null,
    dateNote:
      'Publication date identifies the source DEM; the slope display is a local derivation.',
    version: `Local derivation ${slope.pipelineVersion}`,
    resolution:
      '20 m source pixels; 3 × 3 neighbourhood. This cannot resolve individual rocks or small obstacles.',
    bounds: slope.bounds,
    coordinateNote: slope.algorithm,
    verticalDatum: slope.verticalDatum,
    checksums: [
      { scope: 'Source bytes', sha256: slope.sourceSha256 },
      { scope: 'Display asset', sha256: slope.assetSha256 },
    ],
    analysisEligible: slope.analysisEligible,
    limitations: slope.limitations,
  },
  {
    id: 'geology',
    title: 'Jezero regional geology',
    kind: 'Geological interpretation',
    mission: 'USGS regional synthesis of orbital observations',
    productId: geology.productId,
    sourceUrl: geology.sourcePage,
    citation: geology.citation,
    rights: geology.rights,
    reviewedDate: geology.reviewDateUtc,
    publicationDate: geology.publicationDate,
    observationDate: null,
    dateNote:
      'Publication date identifies the map release, not an observation date.',
    version: `${geology.sourceLayer} (GIS layer identifier; archive bytes pinned separately)`,
    resolution: `Published scale 1:${geology.mapScaleDenominator.toLocaleString('en-US')}; ${geology.width} × ${geology.height} display grid is not source mapping accuracy.`,
    bounds: geology.bounds,
    coordinateNote: geology.sourceCoordinateDefinition,
    verticalDatum: null,
    checksums: [
      { scope: 'Source bytes', sha256: geology.sourceSha256 },
      { scope: 'Display asset', sha256: geology.assetSha256 },
    ],
    analysisEligible: geology.analysisEligible,
    limitations: geology.limitations,
  },
  ...surfaceImages.images.map((image): SourceRecord => ({
    id: image.stopId,
    title: `${image.sample} surface reference`,
    kind: 'Rover image',
    mission: `Mars 2020 · ${image.camera}`,
    productId: new URL(image.sourceImageUrl).pathname.split('/').pop()!,
    sourceUrl: image.sourceImageUrl,
    citation: `${image.credit} · NASA Mars rock sample catalog`,
    rights: imageryReview.rights,
    reviewedDate: surfaceImages.retrievedDate,
    publicationDate: null,
    observationDate: image.dateAsPublished,
    dateNote: `NASA caption date; image sol ${image.acquisitionSol}. Image capture and sample sealing are separate events.`,
    version: null,
    resolution: `${image.width} × ${image.height} pixels; ground resolution is not established by this reference image.`,
    bounds: null,
    coordinateNote:
      'Image footprint and exact drill coordinates remain unverified.',
    verticalDatum: null,
    checksums: [{ scope: 'Source bytes', sha256: image.sha256 }],
    analysisEligible: false,
    limitations: [
      'Surface reference for the primary sample; it does not locate every sample at the outcrop.',
      'No geographic footprint, distance, mineral abundance or human approach suitability is inferred from the photograph.',
    ],
  })),
  {
    id: 'meda-history',
    title: 'Historical MEDA reports',
    kind: 'Historical environment',
    mission: meda.mission,
    productId: meda.productId,
    sourceUrl: meda.sourceUrl,
    citation: meda.citation,
    rights: meda.rights,
    reviewedDate: meda.reviewDate,
    publicationDate: meda.publicationDate,
    observationDate: null,
    dateNote:
      'Separate report windows: February 19, 2021 and April 3–4, 2021. See the historical environment panel; these are not current conditions.',
    version: null,
    resolution: 'Published report summary, not a calibrated time series',
    bounds: null,
    coordinateNote: meda.location,
    verticalDatum: null,
    checksums: [
      {
        scope: 'Metadata snapshot',
        sha256:
          'cdba954a846163a48e7dd7fe8d7d575a6f4637e67d017065fce38e49f962b46b',
      },
    ],
    analysisEligible: false,
    limitations: [...meda.limitations, meda.snapshotNote],
  },
];
