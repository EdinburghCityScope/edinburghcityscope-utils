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
 },

/**
* Convert a GeoJSON Feature Array into an Loopback json object
*
* @param {array} featureArray
*
*/
 featureArrayToLoopbackArray(featureArray)
 {
   var jsonEmpty='{"ids": {"User": 1,"AccessToken": 1,"ACL": 1,"RoleMapping": 1,"Role": 1,"GeoJSONFeature": 2},"models": {"User": {},"AccessToken": {},"ACL": {},"RoleMapping": {},"Role": {},"GeoJSONFeature": {}}}';
   var loopbackJson = JSON.parse(jsonEmpty);
   for (var i=0;i<featureArray.length;i++)
   {
     featureArray[i].id=i;
   }
   loopbackJson.models.GeoJSONFeature=featureArray;
   return loopbackJson;
 }

};
