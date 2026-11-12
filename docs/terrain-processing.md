# Jezero elevation overlay

The local preview now includes a measured elevation **colour overlay**. It remains draped over a smooth reference sphere. This is not a 3D terrain tileset and does not provide slope or route analysis.

## Verified source

USGS [Mars 2020 TRN CTX DTM mosaic](https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_ctx_dtm_mosaic), Fergason et al. (2020), [doi:10.5066/P906QQT8](https://doi.org/10.5066/P906QQT8).

- Product: `JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0`.
- Source: NASA Mars Reconnaissance Orbiter / Context Camera; processed by USGS. Source publication date July 24, 2020.
- 1596 × 1512 Float32 pixels; 20 metres/pixel in both map axes. Raw source 9,662,387 bytes, retained outside Git.
- Planetocentric latitude; east-positive longitude; equirectangular projection with zero standard parallel/central meridian; 3,396,190-metre Mars sphere. GeoTIFF bounds and projection match the accompanying PDS label.
- Heights are relative to the source's Mars areoid (`DeltaGeoid`), **not** heights above the renderer's sphere. No height conversion or 3D displacement is performed. The USGS [mosaic readme](https://astrogeology.usgs.gov/ckan/dataset/5da0038e-df6e-4c12-919f-7219ba8059aa/resource/060bd5aa-cf60-4cbd-9c71-e3a52191b0b7/download/readme.txt) explains the distinction between delta-geoid and delta-radius products.
- The released raster has 2,413,152 valid pixels and zero nodata pixels. This does not establish positional accuracy, obstacle coverage, or suitability for walking. Interpolation/processing artefacts can remain in the scientific source.
- USGS public data, no access constraints; cite authors. Metadata snapshots are in `data/manifests/`. Source and derived-asset checksums, bounds, range, units, citations and limitations are in `src/data/generated/elevation.json`.

The source is associated with the same CTX B / version 008 orthomosaic currently served by NASA Trek. Source metadata establishes common context; independent point-level registration and an aligned multi-mission analysis grid have not been verified. The overlay uses its own exact DEM bounds, rather than borrowing the slightly larger imagery service bounds.

## Display and limitations

Enable **Jezero elevation colours** under Map layers. The legend displays the actual minimum/maximum of valid source values in metres relative to the Mars areoid, rounded only for readability. A linear colour ramp represents elevation, not risk or scientific value. Opacity changes only display blending. Viewport coverage is reported independently from image-loading success. Bounds indicate the raster footprint, not a validated excursion area.

The PNG preserves source pixels without resampling; nodata would have zero alpha and is excluded from colour bounds. Derived imagery is about 944 KiB, stored locally, so this overlay works without an external imagery service after the app has loaded. Internet access is still needed for the underlying NASA MOC/CTX imagery.

A verified areoid-to-radius conversion, height-datum review, and proper terrain tiling are still needed for 3D relief. No DEM values are used for markers, distances, scoring, equipment assumptions, or routing. The official USGS 2025 HiRISE release remains a later candidate; its 5.3 GB mosaic package was not downloaded. The public `mars_v14` terrain endpoint configured by NASA Trek was inspected but not integrated because its metadata did not establish the required source provenance, planetary model and datum compatibility.

## Reproduce locally

The frontend needs only Node; the generated overlay is committed. Rebuilding the scientific display asset is optional. Verified processing runtime: Python **3.14.8**, uv **0.13.1**. All processing dependencies are pinned with hashes, including Rasterio 1.5.2, NumPy 2.5.4, Pillow 13.0.0 and Ruff 0.14.4. Do not modify system Python packages.

From the repository root:

```sh
uv venv .venv-terrain --python python3
uv pip sync --python .venv-terrain/bin/python --require-hashes pipelines/terrain/requirements.txt
.venv-terrain/bin/python pipelines/terrain/build_elevation.py --download
.venv-terrain/bin/python -m unittest discover -s tests/terrain -v
.venv-terrain/bin/ruff check pipelines/terrain tests/terrain
.venv-terrain/bin/ruff format --check pipelines/terrain tests/terrain
npm run format
npm run build
npm test
```

`--download` retrieves the fixed public USGS S3 URL into ignored `data/raw/`, caps download size and verifies the reviewed SHA-256 before processing. To reuse a downloaded source, omit `--download` or use `--dem /absolute/path/to/source.tif`. A changed checksum, unsupported CRS, unsupported band type, missing nodata definition, empty valid-data mask or invalid footprint fails the build; it must not silently become a valid layer. The output is a visualization PNG plus a provenance manifest, not an analysis raster. Pipeline output and source data remain separate.
