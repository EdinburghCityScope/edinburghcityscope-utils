var http = require('https')
var urllib = require('url')
var Converter = require("csvtojson").Converter;


module.exports = {

/**
*  Gets an associated Loopback model from a mediaType
* @param {mediaType} Media type to check
* @return Model name as String
*
*/
getLoopbackModelFromMediaType(mediaType)
{
  if (mediaType=='application/vnd.geo+json')
  {
    return 'GeoJSONFeature';
  }
  else {
    throw new Error('Model not found for media type');
  }
},
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
 featureArrayToLoopbackJson(featureArray)
 {
   var jsonEmpty='{"ids": {"User": 1,"AccessToken": 1,"ACL": 1,"RoleMapping": 1,"Role": 1,"GeoJSONFeature": 2},"models": {"User": {},"AccessToken": {},"ACL": {},"RoleMapping": {},"Role": {},"GeoJSONFeature": {}}}';
   var loopbackJson = JSON.parse(jsonEmpty);
   for (var i=0;i<featureArray.length;i++)
   {
     featureArray[i].id=i;
   }
   loopbackJson.models.GeoJSONFeature=featureArray;
   return loopbackJson;
 },

/**
* Get data from a url
* @param {url} The URL to get the data from
* @param {callback} The callback which contains the Data
*/
 getDataFromURL(url,callback)
 {

   var checkUrl = urllib.parse(url);


   return http.get(url, function(response) {
       // Continuously update stream with data
       var body = '';
       response.on('data', function(d) {
           body += d;
       });
       response.on('end', function() {

           // Data reception is done, do whatever with it!
           callback(body);
       });
   }).on('error',function(e){
     throw e;
   });
 },

 /**
 * @param {dcatData} The data packed containing the DCAT information
 * @param {callback} The callback containing the model and dataset url
 *
 */
 getModelUrlFromDcatInfo(dcatData,callback)
 {
   var edinburghcityscopeUtils = require('./index');
   var getLoopbackModelFromMediaType = edinburghcityscopeUtils.getLoopbackModelFromMediaType;
   var modelAndUrl= JSON.parse('{"model": "","datasetUrl": ""}');
   var dcatJson = JSON.parse(dcatData);
   try{

     for (var i=0;i<dcatJson.distribution.length;i++)
     {
       try {
         modelAndUrl.model=getLoopbackModelFromMediaType(dcatJson.distribution[i].mediaType);
         modelAndUrl.datasetUrl=dcatJson.distribution[i].downloadURL;
         //Immediately break iteration if valid model/url is found
         break;
       } catch (e) {
         // Do nothing as it's likely just a mediaType that Loopback can't handle
       }

     }

   }
   catch(err)
   {
     throw new Error('Invalid DCAT JSON');
   }
   callback(modelAndUrl);
 },

/**
* convert CSV data to JSON array
* @param csvData
* @param callback containing the JSON array
*/
 convertCsvDataToJson(csvData, callback)
 {

   var converter = new Converter({});
   converter.fromString(csvData, function(err,result){
     if (err)
     {
       throw err;
     }
     else {
       return (callback(result));
     }

   });

 },

};
