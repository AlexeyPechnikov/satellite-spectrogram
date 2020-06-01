// Coordinates of PRISMA scene
// PRS_L2C_STD_20200413023942_20200413023947_0001.he5
var polygon = ee.Geometry.Polygon([
  [[116.774994,-8.544648], [116.71955, -8.809741], [116.98615, -8.864849], [117.041466, -8.599752]]
]);
Map.centerObject(polygon,11);
Map.addLayer(polygon, {color: '000000'}, 'AOI');

// Function to mask clouds using the Sentinel-2 QA band.
function maskS2clouds(image) {
  var qa = image.select('QA60')

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0))

  // Return the masked and scaled data, without the QA bands.
  return image.updateMask(mask).divide(10000)
      .select("B.*")
      .copyProperties(image, ["system:time_start"])
}

var wavelength = [(443.9 + 442.3)/2, (496.6 + 492.1)/2, (560 + 559)/2, (664.5 + 665)/2,
                  (703.9 + 703.8)/2, (740.2 + 739.1)/2, (782.5 + 779.7)/2, (835.1 + 833)/2,
                  (864.8 + 864)/2, (945 + 943.2)/2, (1613.7 + 1610.4)/2, (2202.4 + 2185.7)/2];

// Load Sentinel-2 surface reflectance data
// https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR
var collection = ee.ImageCollection('COPERNICUS/S2_SR')
                  .filterDate('2017-03-28', '2020-12-31')
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .map(maskS2clouds)
                  .filterBounds(polygon.buffer(1000))
                  .map(function(image) { return image.clip(polygon.buffer(1000)); });
print ("count", collection.size());

var composite = collection.median();
print (composite);

Map.addLayer(composite, {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3}, 'RGB');

// exclude quality mask band
var databands = composite.bandNames().filter(ee.Filter.stringStartsWith('item','B'));

// WGS84
Export.image.toDrive({
  image: composite.select(databands),
  description: 'COPERNICUS_S2_SR_WEST_SULAWESI_2017_2020',
  region: polygon,
  crs: 'EPSG:4326',
  scale: 30,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});
