var https = require('https')
var http = require('http')
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

   if (url.includes("https"))
   {
     https.get(url, function(response) {
       if (response.statusCode=='404')
       {
         throw new Error('Data not found');
       }
         // Continuously update stream with data
         var body = '';
         response.on('data', function(d) {
             body += d;
         });
         response.on('end', function() {
               // Callback body now data is finished reception
               callback(body);

         });
     }).on('error',function(e){
       console.log(' on error here');
       throw e;
     });
   }
   else {
     http.get(url, function(response) {
       if (response.statusCode=='404')
       {
         throw new Error('Data not found');
       }
         // Continuously update stream with data
         var body = '';
         response.on('data', function(d) {
             body += d;
         });
         response.on('end', function() {
               // Callback body now data is finished reception
               callback(body);

         });
     }).on('error',function(e){
       console.log(' on error here');
       throw e;
     });
   }

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

 /**
  * Converts a CKAN API response to a JSON array for CityScope importing
  * @param cKanApiResponse the response from the CKAN API callback
  * @return the converted JSON result array object
 **/
 convertCkanAPIResultsToCityScopeJson(cKanApiResponse)
 {
   try {
     cKanApiResponseJson = JSON.parse(cKanApiResponse);
   } catch (e) {
     throw new Error('Invalid JSON data');
   }

   try {
     if (!cKanApiResponseJson.success)
     {
       throw new Error('Query failed: '+cKanApiResponseJson.error);
     }
     else if (cKanApiResponseJson.result.total=='0'){
       throw new Error('API call returned zero records');
     }
     else {
       return cKanApiResponseJson.result.records;
     }
   } catch (e) {
     throw e;
   }

 },

 /**
 * Gets the result fields from an API response for future parsing
 * @param cKanApiResponse the response from the CKAN API callback
 * @return the fields as a JSON array object
 */
 getCkanApiResponseFields(cKanApiResponse)
 {
   try {
     cKanApiResponseJson = JSON.parse(cKanApiResponse);
   } catch (e) {
     throw new Error('Invalid JSON data');
   }

   try {
     if (!cKanApiResponseJson.success)
     {
       throw new Error('Query failed: '+cKanApiResponseJson.error);
     }
     else {
       return cKanApiResponseJson.result.fields;
     }
   } catch (e) {
     throw e;
   }
 },

 /**
 * Parses CKan API response fields into more generic field names
 * @param cKanApiResponseFields
 * @return the parsed field array
 */
 parseCkanApiResponseFields(cKanApiResponseFields)
 {
   var parsedCkanFields = [];
   cKanApiResponseFields.forEach(function(obj){
     if (obj.id=="Longitude")
     {
       obj.id="longitude";
     }
     else if (obj.id=="Latitude")
     {
       obj.id="latitude";
     }
     else if (obj.id=="BankTypeNa")
     {
       obj.id="type";
     }
     else if (obj.id=="Site_Name")
     {
       obj.id="name";
     }
     parsedCkanFields.push(obj);
   });
   return parsedCkanFields;
 },

 /**
 * Parses CKan API result into more generic field names
 * @param cKanApiResponseFields
 * @return the parsed field array
 */
 parseCkanApiResult(cKanApiResult)
 {
   parsedCkanResult = [];
   cKanApiResult.forEach(function(obj){
     newObj = {};
     for(var key in obj){
              var attrName = key;
              if (attrName=="Longitude")
              {
                attrName="longitude";
              }
              else if (attrName=="Latitude")
              {
                attrName="latitude";
              }
              else if (attrName=="BankTypeNa")
              {
                attrName="type";
              }
              else if (attrName=="Site_Name")
              {
                attrName="name";
              }

              var attrValue = obj[key];

              newObj[attrName]=attrValue;
          }
          parsedCkanResult.push(newObj)
   });

   return parsedCkanResult;
 }

};
