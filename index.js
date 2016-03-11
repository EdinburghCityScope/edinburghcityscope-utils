module.exports = {

 /**
 * Convert a GeoJSON FeatureCollection into an array of Features
 *
 * @param {String} featureCollection
 *
 */
 featureCollectionToFeatureArray(featureCollection){
   var featureCollection = JSON.parse(featureCollection);
   var features = [];
   features = featureCollection.features;
   return features;
 }

};
