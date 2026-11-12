# Exploratory Jezero DEM slope display

Enable **Jezero estimated slope** in Map layers. The legend shows degrees on a fixed 0–90° scale, the observed range, opacity and source/method links. Elevation, geology and slope colours are viewed one at a time; orbital imagery and the selected approximate stop highlight remain independent.

This is a local derivative of the reviewed [USGS CTX DEM](https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_ctx_dtm_mosaic), Fergason et al. (2020), [doi:10.5066/P906QQT8](https://doi.org/10.5066/P906QQT8). Source bytes, coordinate handling and datum were reviewed for the existing [elevation display](terrain-processing.md). The slope build accepts only that pinned source SHA-256 and reuses its CRS/unit/nodata checks. It does not download another DEM or add dependencies.

## Computation and meaning

The pipeline computes the Horn weighted 3 × 3 gradient. With neighbourhood heights `a b c / d e f / g h i`, east and south derivatives are:

```text
east  = ((c + 2f + i) - (a + 2d + g)) / (8 × dx × cos(latitude))
south = ((g + 2h + i) - (a + 2b + c)) / (8 × dy)
angle = atan(sqrt(east² + south²)), converted to degrees
```

`dx` and `dy` are the source's 20-metre projected grid spacings. For this verified zero-standard-parallel equirectangular Mars sphere, east ground spacing is approximated at each row's pixel-centre planetocentric latitude using `dx × cos(latitude)`; north spacing is `dy`. The radius is 3,396,190 metres. No Earth degree-to-metre factor is used. The local algorithm rejects pole-adjacent grids, unsupported shapes and nonpositive/nonfinite spacings.

The [GDAL slope documentation](https://gdal.org/en/stable/programs/gdaldem.html#slope) describes Horn gradient slopes, degree outputs, horizontal/vertical unit considerations and 3 × 3 missing-data behaviour. This implementation applies an explicit Mars row-spacing correction rather than relying on Earth defaults or an automatically inferred scale. It uses the existing NumPy/Rasterio/Pillow environment and does not invoke a GDAL slope executable.

Source heights remain relative to the Mars areoid. The output represents their gradient with horizontal distances approximated on the source sphere. A verified local height-datum/surface-radius treatment and independent validation are still required before interpreting it as physical surface inclination or using it for route decisions. A constant height offset does not change the computed gradient; a spatially varying datum difference can.

All nine cells must be valid and finite. Missing neighbours, masked pixels and the outer one-pixel border become transparent; values are never filled or interpolated for computation. The fixed sequential colour ramp has no walking thresholds or risk classes. It preserves one output pixel per source cell, but the derivative uses a 3 × 3 neighbourhood rather than independent 20 m measurements. Individual rocks and small obstacles remain unresolved.

## Outputs and checks

- `assets/jezero-slope.png`: display-only RGBA overlay.
- `src/data/generated/slope.json`: algorithm, source identity/hash, geographic bounds, units, grid size, edge policy, observed range, palette, pixel counts, asset hash and limitations.
- No scientific analysis raster, per-stop slope, route cost or eligibility is published. `analysisEligible` remains false.

The reviewed build has 2,406,940 derived pixels and 6,212 transparent edge pixels. The input has no nodata pixels; missing-data handling is exercised using synthetic cases. An independent rebuild produced an equal manifest and byte-identical PNG.

Using the existing pinned terrain environment, from the repository root:

```sh
# Reuse the reviewed DEM from the elevation workflow.
.venv-terrain/bin/python -m pipelines.terrain.build_slope
.venv-terrain/bin/python -m unittest discover -s tests/terrain -v
.venv-terrain/bin/ruff check pipelines/terrain tests/terrain
.venv-terrain/bin/ruff format --check pipelines/terrain tests/terrain
npm run check:data
npm run build
npm test
```

Optional `--dem`, `--image` and `--manifest` arguments support temporary rebuilds without replacing current outputs. See [terrain environment setup](terrain-processing.md) for reproducible dependency installation. Analytic-plane, flat-grid, constant-offset, latitude-correction, missing-neighbour, source-integrity, invalid-input and transparent-edge tests cover the scientific computation and output. Browser checks cover loading, failure/retry, stale results, layer exclusivity, opacity, extent, keyboard controls and mobile/WebGL fallback.

Shared single-image loading/lifecycle handling now lives in `src/map/create-raster-overlay.ts`; both geology and slope use it. Geology retains nearest-neighbour categorical colour sampling. Continuous slope colours are a display interpolation, not additional scientific resolution. Existing geology interaction/failure checks remain part of the full browser suite.
