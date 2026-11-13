# Scientific source registry and local integrity checks

The current preview has fourteen registered spatial/reference products: five orbital imagery services, DEM-derived elevation and slope displays, regional and global geological interpretations, global colour hillshade, three rover surface photographs and the IAU/USGS Mars named-feature catalogue. Open **Data & provenance → Review sources and limitations (14)** to inspect them. The registry shows source links, credits, dates, detail, coverage, coordinate context, known limitations and scoped SHA-256 records.

`src/data/sources.ts` combines existing reviewed manifests. `src/data/layers.ts` now gets its imagery product IDs, footprints and maximum zoom levels from `data/manifests/imagery-review.json`, so rendering and provenance use the same records.

## Evidence types

| Type | Current products | Meaning |
| --- | --- | --- |
| Orbital image | MGS/MOC, local and global MRO/CTX, controlled Jezero HiRISE and THEMIS daytime infrared | Regional surface observations; delivered detail depends on zoom. |
| Rover image | Swift Run, Hazeltop and Shuyak Navcam references | Local surface observations; their geographic footprints are unverified. |
| Derived elevation | USGS CTX DEM colour overlay | Heights relative to the source Mars areoid, represented as colours on a smooth sphere. |
| Derived slope | Local Horn gradient of the CTX DEM | Exploratory areoid-height gradient in degrees; no walking thresholds. |
| Shaded relief | Global MOLA/HRSC colour hillshade | Visual regional relief; no validated numeric colour scale or height readout. |
| Feature catalogue | IAU/USGS Mars named-feature export | Published feature centres and names; exact observation sites and scientific value remain unverified. |
| Geological interpretation | USGS SIM 3464 | Regional mapped interpretation, with the accepted approximately 100–200 m offset warning. |

All fourteen records remain ineligible for route or stop-ranking analysis. These categories do not introduce direct mineral measurements, exact stop positions or terrain feasibility.

## Retained imagery metadata

Reviewed November 12, 2026. Each imagery service has two exact upstream snapshots under `data/manifests/`: its WMTS capabilities XML and a NASA Trek catalog response restricted to that product. URLs, byte lengths and hashes are recorded in `imagery-review.json`. The catalog responses are excluded from formatting to preserve their original bytes.

Primary sources:

- [HiRISE capabilities](https://trek.nasa.gov/tiles/Mars/EQ/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd/1.0.0/WMTSCapabilities.xml) and [HiRISE catalog record](https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?start=0&rows=1&facetKeys=productLabel&facetValues=JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd).

- [MOC capabilities](https://trek.nasa.gov/tiles/Mars/EQ/msss_atlas_simp_clon/1.0.0/WMTSCapabilities.xml) and [MOC catalog record](https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?start=0&rows=1&facetKeys=productLabel&facetValues=msss_atlas_simp_clon).
- [CTX capabilities](https://trek.nasa.gov/tiles/Mars/EQ/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0/1.0.0/WMTSCapabilities.xml) and [CTX catalog record](https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?start=0&rows=1&facetKeys=productLabel&facetValues=JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0).

Unknowns are explicit:

- The reviewed MOC catalog has a zero `Resolution` field; this is not treated as a measured resolution. The description identifies primarily May–June 1999 source images, without establishing exact acquisition dates for the mosaic.
- CTX's approximately 6 metres/pixel comes from the catalog description. It is not a positioning-accuracy claim.
- The HiRISE product identifier describes a 25 cm orthomosaic, but its catalog resolution field does not establish a unit or ground accuracy. The retained catalog explicitly defines the shared Mars sphere; image/DEM registration remains unverified. The representative tile probe records point-in-time availability rather than preserving the complete source mosaic.
- Catalog `data_created_date`, service protocol `1.0.0`, product-name tokens and catalog-internal versions do not establish source publication dates or formal scientific release versions. Unknown dates/versions remain null.
- The MOC service declares a Mars geographic grid but its catalog lacks the full sphere definition supplied for CTX. MOC's analysis CRS is not independently verified by adopting the common display sphere.
- Bounding envelopes do not establish valid-pixel coverage. The CTX catalog's shape and service envelope also have slightly different eastern edges; no common analysis footprint is inferred.
- Imagery metadata hashes identify the retained metadata only. The remote tiles and original mosaics have not been snapshotted or pinned by those hashes.

The PDS localization/dossier investigation and NASA sample catalog remain separate supporting evidence, linked from each stop. This registry does not complete an archive-wide source inventory or recover missing coordinate definitions.

## Run the integrity gate

With Python 3 available (verified locally with Python 3.14.8), from the repository root:

```sh
npm run check:data
python3 -m unittest discover -s tests/catalog -v
```

The gate uses the Python standard library and performs no network access or writes. Python is only needed for this check and the optional scientific pipelines; it is not required to browse the compiled frontend. The Pages build workflow runs the gate before building the site.

The gate verifies 62 retained metadata/display files against their reviewed hashes, including the imagery snapshots, existing DEM metadata, geology metadata/CRS snapshots, three local overlays and three surface photographs. It checks imagery identity, Mars CRS, bounds, format, style and zoom-matrix dimensions against the rendering configuration; checks the CTX and HiRISE catalogs' sphere definitions; and rejects unsupported analysis/registration flags, invalid planetary bounds and inconsistent pixel accounting in derived manifests.

Failures stop the check with a file or source-contract error. Restore the reviewed file or investigate the changed source. Do not update a hash merely to make the check pass. A legitimate refresh needs source review, relevant pipeline regeneration, renewed limitations/eligibility review and the affected checks before replacing the published artifacts.

Bulk rasters and PDS tables remain outside Git. The small Mars nomenclature KMZ is retained and published with the catalogue. Use the existing [terrain](terrain-processing.md), [geology](geology-processing.md) and [stop-evidence](stop-evidence.md) workflows to reproduce or verify those inputs. This gate does not inspect remote availability, independent spatial registration, scientific correctness or walking suitability.

The [Mars feature catalogue](crater-catalogue.md) adds a retained exact export, a hash-named search index and 31 regional files. The integrity gate rebuilds these from the export and compares their bytes and manifest. It also verifies named-feature filtering, duplicate handling and coordinate consistency through the catalogue tests. Pages refreshes the export before validation/build, and each published release serves its own source export for provenance.

Four [feature map layers](feature-map-layers.md) add eleven exact metadata snapshots and viewport coverage states. The integrity gate checks JPEG/PNG endpoints, 256/512-pixel geographic grids, product identities, envelopes, CTX Mars WKT and the retained 44-unit global geology legend.
