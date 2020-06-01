// Coordinates of PRISMA scene
// PRS_L2C_STD_20200413023942_20200413023947_0001.he5
var polygon = ee.Geometry.Polygon([
  [[116.774994,-8.544648], [116.71955, -8.809741], [116.98615, -8.864849], [117.041466, -8.599752]]
]);
Map.centerObject(polygon,11);
Map.addLayer(polygon, {color: '000000'}, 'AOI');

// band-specific scale factors (21 bands and quality band with factor 1)
var scale = [0.0139465, 0.0133873, 0.0121481, 0.0115198, 0.0100953, 0.0123538, 0.00879161,
0.00876539, 0.0095103, 0.00773378, 0.00675523, 0.0071996, 0.00749684, 0.0086512,
0.00526779, 0.00530267, 0.00493004, 0.00549962, 0.00502847, 0.00326378, 0.00324118,
1];
var wavelength = [400, 412.5, 442.5, 490, 510, 560, 620,
665, 673.75, 681.25, 708.75, 753.75, 761.25, 764.375,
767.5, 778.75, 865, 885, 900, 940, 1029];
var dataset = ee.ImageCollection('COPERNICUS/S3/OLCI')
                  .filterDate('2016-01-01', '2020-12-31')
                  .filterBounds(polygon.buffer(1000))
                  .map(function(image) { return image.clip(polygon.buffer(1000)); });
print ("count", dataset.size());

// apply band-specific scale factors
var composite = dataset.median().multiply(ee.Image(scale));
print (composite);

var visParams = {
  min: 0.15,
  max: 1,
  gamma: 1.5,
  opacity: 0.8
};

Map.addLayer(composite.select(['Oa08_radiance', 'Oa06_radiance', 'Oa04_radiance']), visParams, 'RGB');
Map.addLayer(composite.select(['quality_flags']), {}, 'Quality');

// exclude quality mask band
var databands = composite.bandNames().filter(ee.Filter.eq('item','quality_flags').not());

// WGS84
Export.image.toDrive({
  image: composite.select(databands),
  description: 'COPERNICUS_S3_OLCI_2016_2020',
  region: polygon,
  crs: 'EPSG:4326',
  scale: 30,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});
