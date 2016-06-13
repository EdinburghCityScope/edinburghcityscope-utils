var should = require('chai').should();
var expect = require('chai').expect;
var assert = require('chai').assert;

var edinburghcityscopeUtils = require('../index');
var featureCollectionToFeatureArray = edinburghcityscopeUtils.featureCollectionToFeatureArray;
var featureArrayToLoopbackJson = edinburghcityscopeUtils.featureArrayToLoopbackJson;
var getDataFromURL = edinburghcityscopeUtils.getDataFromURL;
var convertCsvDataToJson = edinburghcityscopeUtils.convertCsvDataToJson;
var getModelUrlFromDcatInfo = edinburghcityscopeUtils.getModelUrlFromDcatInfo;
var getLoopbackModelFromMediaType = edinburghcityscopeUtils.getLoopbackModelFromMediaType;
var convertCkanAPIResultsToCityScopeJson = edinburghcityscopeUtils.convertCkanAPIResultsToCityScopeJson;
var getCkanApiResponseFields = edinburghcityscopeUtils.getCkanApiResponseFields;
var parseCkanApiResponseFields = edinburghcityscopeUtils.parseCkanApiResponseFields;
var parseCkanApiResult = edinburghcityscopeUtils.parseCkanApiResult;

var testFeatureCollection='{"type": "FeatureCollection","features": [{"type": "Feature","properties": {"name": "Test Name"},"geometry": {"type": "Point","coordinates": [-3.1952404975891113,55.94966839561511]}}]}';
var testEmptyFeatureCollection='{"type": "FeatureCollection","features": []}';
var expectedFeatureArray= [JSON.parse('{"type": "Feature","properties": {"name": "Test Name"},"geometry": {"type": "Point","coordinates": [-3.1952404975891113,55.94966839561511]}}')];
var testBadArray='{"type": "FeatureCollection","features": [ bad ]}';
var emptyArray=[];
var testInvalidJson='{ bad :, value}';
var testInvalidGeoJson='{ "bad": "value"}';
var testCsv = 'ebid,name,stub,area,type,longitude,latitude,function,url,address1,address2,city,postcode,timestamp\n,"Psychology Building",psychology-building,central,building,-3.1886053385096600,55.9444754372987800,NULL,,"7 George Square",,Edinburgh,"EH8 9JZ","2016-01-19 11:05:17"';
var testBadCsv = 'this is not a csv';
var testDcatData= '{"id": "test","title": "test dcat","description": "A test dcat","landingPage" : "","issued": "2016-04-03","modified": "2016-04-03","language": ["en"],"publisher": {"name": "University of Edinburgh","mbox": ""},"spatial": "http://www.geonames.org/maps/google_55.944_-3.188.html","keyword": ["test", "uoe","University of Edinburgh"],"distribution": [{"title": "Test CSV","description": "CSV  test dataset","mediaType": "text/csv","downloadURL": "https://test.com/test.csv","license": "https://test.com/LICENSE"},{"title": "Campus Maps GeoJSON file","description": "GeoJSON representation of the campus maps data","mediaType": "application/vnd.geo+json","downloadURL": "https://test.com/test.geojson","license": "https://test.com/LICENSE"}]}';

var cKanAPIBadResult = '{ "success" : false, "error" : "error text"}';
var cKanAPIZeroResults = '{ "success" : true, "result" : { "total" : 0 }}';
var cKanAPIResult = '{ "success" : true, "result" : { "fields" : [{ "type" : "text", "id" : "test" }],"total" : 1, "records" : [ { "test" : "value"}] }}';
var cKanConvertedResult = [JSON.parse('{ "test" : "value", "Latitude" : "0", "Longitude" : "0", "BankTypeNa" : "site" , "Site_Name" : "name"}')];
var cKanFields = JSON.parse('[{ "type" : "text", "id" : "test" },{"type" : "text", "id" : "Latitude"},{"type" : "text", "id" : "Longitude"},{"type" : "text", "id" : "BankTypeNa"},{"type" : "text", "id" : "Site_Name"}]');

describe('#featureCollectionToFeatureArray', function(){

 it('converts empty featureCollection to empty FeatureArray',function(){
  featureCollectionToFeatureArray(testEmptyFeatureCollection).should.equal.empty;
 });

 it('converts FeatureCollection to FeatureArray', function(){
   featureCollectionToFeatureArray(testFeatureCollection).should.have.length(1);
   featureCollectionToFeatureArray(testFeatureCollection).should.deep.equal(expectedFeatureArray);
 });

 it('throws error when unable to parse', function(){
   assert.throws(function(){featureCollectionToFeatureArray(testBadArray)},Error,'Unable to parse FeatureCollection');
 });

 it('throws invalid GeoJSON error when fails to validate FeatureCollection or Features', function(){
   assert.throws(function(){featureCollectionToFeatureArray(testInvalidGeoJson)},Error,'Empty feature Collection or invalid GeoJSON');
 });

});

describe('#featureArrayToLoopbackJson',function(){

  it('converts an empty FeatureArray to Empty LoopBackJson',function(){
    featureArrayToLoopbackJson(emptyArray).models.GeoJSONFeature.should.have.length(0);
  });

  it ('converts FeatureArray to LoopbackJson',function(){
    featureArrayToLoopbackJson(expectedFeatureArray).models.GeoJSONFeature.should.have.length(1);
    featureArrayToLoopbackJson(expectedFeatureArray).models.GeoJSONFeature[0].properties.name.should.equal('Test Name');
  });

});

describe('#getDataFromURL',function(){
  it('returns data via a valid url',function(done){
    this.timeout(1000);
     getDataFromURL('https://raw.githubusercontent.com/EdinburghCityScope/uoe-campus-maps/master/data/campus-maps.csv',function(callback){
      expect(callback).to.be.a('string');
      expect(callback).to.contain('Psychology Building');
      done();
    });
  });

  it('throws an error when url is invalid',function(done){
    assert.throws(function(){  getCsvDataFromURL('bad:url',function(callback){
        done();
      });});
      done();
  });
});

describe('#convertCsvDataToJson',function(){
  it('converts csv data to json',function(done){
    convertCsvDataToJson(testCsv,function(callback){
      expect(callback[0].name).to.equal('Psychology Building');
      done();
    });

  });

  it('throws an error when invalid csv data',function(){
    assert.throws(function(){convertCsvDataToJson()},Error);
  });
});

describe('#getModelUrlFromDcatInfo',function(){

  it('throws error when json data is invalid',function(done){
    assert.throws(function(){getModelUrlFromDcatInfo(testInvalidJson,callback)});
    done();
  });

  it('returns model and url in callback given valid dcat data',function(done){
    getModelUrlFromDcatInfo(testDcatData,function(callback){
      expect(callback.model).to.equal('GeoJSONFeature');
      expect(callback.datasetUrl).to.equal('https://test.com/test.geojson');
      done();
    });
  });


});

describe('#getLoopbackModelFromMediaType',function(){
  it ('throws error when mediaType not recognised',function(){
    assert.throws(function(){
      getLoopbackModelFromMediaType('application/jwt')
    },Error,'Model not found for media type');
  });

  it ('returns Model for a recongised mediaType',function(){
    getLoopbackModelFromMediaType('application/vnd.geo+json').should.equal('GeoJSONFeature');
  });




});

describe('#convertCkanAPIResultsToCityScopeJson',function(){

  it ('throws error when json is invalid',function(){
    assert.throws(function(){
      convertCkanAPIResultsToCityScopeJson(testInvalidJson)
    },Error,'Invalid JSON data');
  });

  it ('throws error when result has error',function(){
    assert.throws(function(){
      convertCkanAPIResultsToCityScopeJson(cKanAPIBadResult)
    },Error,'Query failed: error text');
  });

  it ('throws an error when zero query results are returned',function(){
    assert.throws(function(){
       convertCkanAPIResultsToCityScopeJson(cKanAPIZeroResults);
    },Error,'API call returned zero records');

  });

  it ('converts CKAN API call to results array',function(){
    convertCkanAPIResultsToCityScopeJson(cKanAPIResult)[0].test.should.equal(cKanConvertedResult[0].test);
  });

});

describe('#getCkanApiResponseFields',function(){

  it ('throws error when json is invalid',function(){
    assert.throws(function(){
      getCkanApiResponseFields(testInvalidJson)
    },Error,'Invalid JSON data');
  });

  it ('throws error when result has error',function(){
    assert.throws(function(){
      getCkanApiResponseFields(cKanAPIBadResult)
    },Error,'Query failed: error text');
  });

  it ('returns fields array',function(){
    getCkanApiResponseFields(cKanAPIResult)[0].id.should.equal(cKanFields[0].id);
    getCkanApiResponseFields(cKanAPIResult)[0].type.should.equal(cKanFields[0].type);
  });

});

describe('#parseCkanApiResponseFields',function(){

  it ('parses fields correctly',function(){
    result = parseCkanApiResponseFields(cKanFields);
    result[1].id.should.equal("latitude");
    result[2].id.should.equal("longitude");
    result[3].id.should.equal("type");
    result[4].id.should.equal("name");

  });

});

describe('#parseCkanApiResult',function(){

  it ('parses fields correctly',function(){
    result = parseCkanApiResult(cKanConvertedResult);
    result[0].latitude.should.equal("0");
    result[0].longitude.should.equal("0");
    result[0].type.should.equal("site");
    result[0].name.should.equal("name");
  });

});
