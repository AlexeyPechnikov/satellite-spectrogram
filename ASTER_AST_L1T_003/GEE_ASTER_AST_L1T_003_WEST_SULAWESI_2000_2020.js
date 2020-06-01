// Coordinates of PRISMA scene
// PRS_L2C_STD_20200413023942_20200413023947_0001.he5
var polygon = ee.Geometry.Polygon([
  [[116.774994,-8.544648], [116.71955, -8.809741], [116.98615, -8.864849], [117.041466, -8.599752]]
]);
Map.centerObject(polygon,11);
Map.addLayer(polygon, {color: '000000'}, 'AOI');

// band-specific scale factors (21 bands and quality band with factor 1)
var scale = [1/255.0, 1/255.0, 1/255.0, 1/255.0, 1/255.0, 1/255.0, 1/255.0, 1/255.0, 1/255.0,
             1/4095.0, 1/4095.0, 1/4095.0, 1/4095.0, 1/4095.0];

var wavelength = [(520+600)/2, (630+690)/2, (780+860)/2, (1600+1700)/2, (2145+2185)/2, (2185+2225)/2, (2235+2285)/2,
                  (2295+2365)/2, (2360+2430)/2, (8125+8475)/2, (8475+8825)/2, (8925+9275)/2, (10250+10950)/2, (10950+11650)/2];

// Load ASTER L1T Radiance data
// https://developers.google.com/earth-engine/datasets/catalog/ASTER_AST_L1T_003
var collection = ee.ImageCollection('ASTER/AST_L1T_003')
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDCOVER', 20))
                  .filterBounds(polygon.buffer(1000))
                  .map(function(image) { return image.clip(polygon.buffer(1000)); });
print ("count", collection.size());
print (collection.first())

// apply band-specific scale factors
var composite = collection.median().multiply(ee.Image(scale));
print (composite);

Map.addLayer(composite, {bands: ['B3N', 'B02', 'B01'], min: 0.0, max: 1.0}, 'RGB');

// WGS84
Export.image.toDrive({
  image: composite,
  description: 'ASTER_AST_L1T_003_WEST_SULAWESI_2000_2020',
  region: polygon,
  crs: 'EPSG:4326',
  scale: 30,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});
