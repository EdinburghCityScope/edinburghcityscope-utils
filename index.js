module.exports = {

 /**
 * Convert a GeoJSON FeatureCollection into an array of Features
 *
 * @param {String} featureCollection
 *
 */
 featureCollectionToFeatureArray(featureCollection){

    try
    {
      var featureCollection = JSON.parse(featureCollection);
    }
    catch(err)
    {
      throw new Error('Unable to parse FeatureCollection');
    }

    var features = [];
    features = featureCollection.features;

    if (features == null || featureCollection.features == null)
    {
      throw new Error('Empty feature Collection or invalid GeoJSON');
    }

    return features;
 }

};
