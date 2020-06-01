// Coordinates of PRISMA scene
// PRS_L2C_STD_20200413023942_20200413023947_0001.he5
var polygon = ee.Geometry.Polygon([
  [[116.774994,-8.544648], [116.71955, -8.809741], [116.98615, -8.864849], [117.041466, -8.599752]]
]);
Map.centerObject(polygon,11);
Map.addLayer(polygon, {color: '000000'}, 'AOI');

// Function to cloud mask from the pixel_qa band of Landsat 8 SR data.
function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = 1 << 3;
  var cloudsBitMask = 1 << 5;

  // Get the pixel QA band.
  var qa = image.select('pixel_qa');

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
      .and(qa.bitwiseAnd(cloudsBitMask).eq(0));

  // Return the masked image, scaled to reflectance, without the QA bands.
  return image.updateMask(mask).divide(10000)
      .select("B[0-9]*")
      .copyProperties(image, ["system:time_start"]);
}

var wavelength = [(435+451)/2, (452+512)/2, (533+590)/2, (636+673)/2, (851+879)/2, (1566+1651)/2,
                  (2107+2294)/2, (10600+11190)/2, (11500+12510)/2];

// Load USGS Landsat 8 Surface Reflectance Tier 1 data
// https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC08_C01_T1_SR
var collection = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
                  .filterDate('2016-01-01', '2020-12-31')
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUD_COVER', 20))
                  .map(maskL8sr)
                  .filterBounds(polygon.buffer(1000))
                  .map(function(image) { return image.clip(polygon.buffer(1000)); });
print ("count", collection.size());

var composite = collection.median();
print (composite);

var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 0.3,
  gamma: 1.4,
};
Map.addLayer(composite, visParams, 'RGB');

// exclude quality mask band
var databands = composite.bandNames().filter(ee.Filter.stringStartsWith('item','B'));

// WGS84
Export.image.toDrive({
  image: composite.select(databands),
  description: 'LANDSAT_LC08_C01_T1_SR_2016_2020',
  region: polygon,
  crs: 'EPSG:4326',
  scale: 30,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});
