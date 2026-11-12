Geologic Map of Jezero Crater and the Nili Planum Region, Mars
GIS version
---------------

Rationale and Intent:
This geologic map was authored by Vivian Sun and Kathryn Stack in 2020, and has been digitized as a GIS product for public release.  Please use the original citation:

Sun, V., and Stack, K., 2020, Geologic map of Jezero crater and the Nili Planum region, Mars: U.S. Geological Survey Scientific Investigations Map 3464, pamphlet 14 p., 1 sheet, scale 1:75,000, https://doi.org/10.3133/sim3464.

This map was created on a semi-controlled CTX mosaic prior to the release of the controlled CTX mosaic (https://doi.org/10.5066/P9GV1ND3) released in July 2020 as created for surface operations for the Mars 2020 mission. Thus, this map and included semi-controlled CTX mosaic, will have random offsets of about 100-200 meters from the surface operations CTX mosaic.

---------------

Project specific datasets are projected (meters).
Projection: Mars Transverse Mercator
            Central meridian: 77.5E
using the geographic coordinate system "Mars 2000"
Major and minor axes are 3396190.0 m
Also included is the *.prj file for the Mars 2000 Sphere GCS.  They are all located in ...\CoordinateSystems.

----------------

File geodatabase contains one feature dataset:
1.) Mars2000Sphere_MTM_Clon77_5E
    a) Anno_68_69 (relationship file)
    b) CrossSections (polyline file)
    c) Figures (polygon file)
    d) FiguresAnno (annotation file)
    e) GeoContacts (polyline file)
    f) GeoUnits_v1 (polygon file)
    g) GeoUnitsAnno (annotation file)
    h) LandingEllipse (polygon file)
    i) LinearFeatures (polyline file)
    j) LocationFeatures (point file)
    k) MapBoundary (polygon file)
    l) megabreccia_fig2 (point file)
    m) Nomenclature (annotation file)
    n) SurfaceFeatures (polygon file)


These feature classes are grouped into "Mapping Layers" in the ArcMap project.  They are projected as MTM and should house all digitized map information.

----------------

Raster layers are included in the folder ...\Rasters\, and include:
1.) Caltech_CTX_mosaic_feb2018
    a) Nili_CTX_Mosaic_Beta01_Feb2018_MTM.tif
2.) HRSC
    a) h0988_0000.da4.53.tif
    b) nili_h0988_0000_da4_clip.tif
    c) nili_h0988_0000_hillshade_clip.tif
3.) USGS_CTX_Stereo_DTMs
    a) B17_016219_1978_XN_17N282W_6m_ORTHO.tif
    b) B18_016575_1978_B17_016219_1978_20m_DTM.tif
    c) J03_045994_1986_J03_046060_1986_20m_DTM.tif
    d) J03_045994_1986_XN_18N282W_6m_ORTHO.tif
4.) USGS_THEMIS_IR_controlled_mosaic_oct2018
    a) nili_THEMIS_DayIR_Controlled_oct2018.tif
    b) nili_THEMIS_NightIR_Controlled_oct2018.tif

These feature classes are grouped into "Rasters" in the ArcMap project. They are projected as MTM.

----------------
Symbols are applied to each of the included feature classes. These symbols are adapted from U.S.Geological Survey Open-File Report 99-430 (Digital Cartographic Standard for Geologic Map Symbolization). These can be viewed and downloaded at http://pubs.usgs.gov/of/1999/of99-430/

---------------

To add/remove symbols, open ArcMap project, right-click the feature class of interest, click "Properties", and click "Symbology" tab. Highlight the symbol to alter and then click "Remove" or double-click to alter.  Each feature class has an associated *.lyr file that houses the symbologies.  Click "import" on the "Symbology" tab and navigate to the appropriate *.lyr to return to the full symbol list.

----------------

We suggest that all work is contained within the *\Geodatabase. Create sub-folders as necessary to house relevant GIS data and map data.
----------------

Comments are encouraged in order to assimilate beneficial GIS-based tools, datasets, and mapping approaches for future mappers.

GIS contact:

Trent Hare
thare@usgs.gov

Jim Skinner
jskinner@usgs.gov

Corey Fortezzo
cfortezzo@usgs.gov

Marc Hunter
mahunter@usgs.gov

Anderson Moyers
amoyers@usgs.gov