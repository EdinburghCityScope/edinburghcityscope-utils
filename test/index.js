var should = require('chai').should();
var expect = require('chai').expect;
var assert = require('chai').assert;

var path = require('path');
var fs = require('fs');
var edinburghcityscopeUtils = require('../index');
var featureCollectionToFeatureArray = edinburghcityscopeUtils.featureCollectionToFeatureArray;
var featureArrayToLoopbackJson = edinburghcityscopeUtils.featureArrayToLoopbackJson;
var getDataFromURL = edinburghcityscopeUtils.getDataFromURL;
var convertCsvDataToGeoJson = edinburghcityscopeUtils.convertCsvDataToGeoJson;
var getModelUrlFromDcatInfo = edinburghcityscopeUtils.getModelUrlFromDcatInfo;
var getLoopbackModelFromMediaType = edinburghcityscopeUtils.getLoopbackModelFromMediaType;
var convertCkanAPIResultsToCityScopeJson = edinburghcityscopeUtils.convertCkanAPIResultsToCityScopeJson;
var getCkanApiResponseFields = edinburghcityscopeUtils.getCkanApiResponseFields;
var parseCkanApiResponseFields = edinburghcityscopeUtils.parseCkanApiResponseFields;
var parseCkanApiResult = edinburghcityscopeUtils.parseCkanApiResult;
var fetchMapItAreas = edinburghcityscopeUtils.fetchMapItAreas;
var updateDataModificationDate = edinburghcityscopeUtils.updateDataModificationDate;
var fetchGovBoundaries = edinburghcityscopeUtils.fetchGovBoundaries;
var getScotGovSPARQL = edinburghcityscopeUtils.getScotGovSPARQL;

var testFeatureCollection = '{"type": "FeatureCollection","features": [{"type": "Feature","properties": {"name": "Test Name"},"geometry": {"type": "Point","coordinates": [-3.1952404975891113,55.94966839561511]}}]}';
var testEmptyFeatureCollection = '{"type": "FeatureCollection","features": []}';
var expectedFeatureArray = [JSON.parse('{"type": "Feature","properties": {"name": "Test Name"},"geometry": {"type": "Point","coordinates": [-3.1952404975891113,55.94966839561511]}}')];
var testBadArray = '{"type": "FeatureCollection","features": [ bad ]}';
var emptyArray = [];
var testInvalidJson = '{ bad :, value}';
var testInvalidGeoJson = '{ "bad": "value"}';
var testCsv = 'ebid,name,stub,area,type,longitude,latitude,function,url,address1,address2,city,postcode,timestamp\n,"Psychology Building",psychology-building,central,building,-3.1886053385096600,55.9444754372987800,NULL,,"7 George Square",,Edinburgh,"EH8 9JZ","2016-01-19 11:05:17"';
var testBadCsv = 'this is not a csv';
var testDcatData = '{"id": "test","title": "test dcat","description": "A test dcat","landingPage" : "","issued": "2016-04-03","modified": "2016-04-03","language": ["en"],"publisher": {"name": "University of Edinburgh","mbox": ""},"spatial": "http://www.geonames.org/maps/google_55.944_-3.188.html","keyword": ["test", "uoe","University of Edinburgh"],"distribution": [{"title": "Test CSV","description": "CSV  test dataset","mediaType": "text/csv","downloadURL": "https://test.com/test.csv","license": "https://test.com/LICENSE"},{"title": "Campus Maps GeoJSON file","description": "GeoJSON representation of the campus maps data","mediaType": "application/vnd.geo+json","downloadURL": "https://test.com/test.geojson","license": "https://test.com/LICENSE"}]}';

var cKanAPIBadResult = '{ "success" : false, "error" : "error text"}';
var cKanAPIZeroResults = '{ "success" : true, "result" : { "total" : 0 }}';
var cKanAPIResult = '{ "success" : true, "result" : { "fields" : [{ "type" : "text", "id" : "test" }],"total" : 1, "records" : [ { "test" : "value"}] }}';
var cKanConvertedResult = [JSON.parse('{ "test" : "value", "Latitude" : "0", "Longitude" : "0", "BankTypeNa" : "site" , "Site_Name" : "name"}')];
var cKanFields = JSON.parse('[{ "type" : "text", "id" : "test" },{"type" : "text", "id" : "Latitude"},{"type" : "text", "id" : "Longitude"},{"type" : "text", "id" : "BankTypeNa"},{"type" : "text", "id" : "Site_Name"}]');

const osAreaIds = [20718, 20719]
const osAreaNames = ["Almond", "Pentland Hills"]
const osBadAreaIds = ["X"]

describe('#featureCollectionToFeatureArray', function () {

    it('converts empty featureCollection to empty FeatureArray', function () {
        featureCollectionToFeatureArray(testEmptyFeatureCollection).should.equal.empty;
    });

    it('converts FeatureCollection to FeatureArray', function () {
        featureCollectionToFeatureArray(testFeatureCollection).should.have.length(1);
        featureCollectionToFeatureArray(testFeatureCollection).should.deep.equal(expectedFeatureArray);
    });

    it('throws error when unable to parse', function () {
        assert.throws(function () {
            featureCollectionToFeatureArray(testBadArray)
        }, Error, 'Unable to parse FeatureCollection');
    });

    it('throws invalid GeoJSON error when fails to validate FeatureCollection or Features', function () {
        assert.throws(function () {
            featureCollectionToFeatureArray(testInvalidGeoJson)
        }, Error, 'Empty feature Collection or invalid GeoJSON');
    });

});

describe('#featureArrayToLoopbackJson', function () {

    it('converts an empty FeatureArray to Empty LoopBackJson', function () {
        featureArrayToLoopbackJson(emptyArray).models.GeoJSONFeature.should.equal.empty;
    });

    it('converts FeatureArray to LoopbackJson', function () {
        Object.keys(featureArrayToLoopbackJson(expectedFeatureArray).models.GeoJSONFeature).should.have.length(1);

        var json = featureArrayToLoopbackJson(expectedFeatureArray).models.GeoJSONFeature[0];
        JSON.parse(json).properties.name.should.equal('Test Name');
    });

});

describe('#getDataFromURL', function () {
    it('returns data via a valid url', function (done) {
        this.timeout(1000);
        getDataFromURL('https://raw.githubusercontent.com/EdinburghCityScope/uoe-campus-maps/master/data/campus-maps.csv', function (err, data) {
            expect(err).to.be.null
            expect(data).to.be.a('string');
            expect(data).to.contain('Psychology Building');
            done();
        });
    });

    it('returns an error when url is not found', function (done) {
        getDataFromURL('http://not-found.example.com/', function (err, data) {
            expect(err).to.not.be.null
            done();
        });
    });

    it('returns an error when url is invalid', function (done) {
        getDataFromURL('bad:url', function (err, data) {
            expect(err).to.not.be.null
            done();
        });
    });
});

describe('#convertCsvDataToGeoJson', function () {
    it('converts csv data to GeoJson', function (done) {
        result = convertCsvDataToGeoJson(testCsv, function (callback) {
            expect(callback.features[0].properties.name).to.equal('Psychology Building');
            done();
        });

    });

    it('throws an error when invalid csv data', function () {
        assert.throws(function () {
            convertCsvDataToJson()
        }, Error);
    });
});

describe('#getModelUrlFromDcatInfo', function () {

    it('throws error when json data is invalid', function (done) {
        assert.throws(function () {
            getModelUrlFromDcatInfo(testInvalidJson, callback)
        });
        done();
    });

    it('returns model and url in callback given valid dcat data', function (done) {
        getModelUrlFromDcatInfo(testDcatData, function (callback) {
            expect(callback.model).to.equal('GeoJSONFeature');
            expect(callback.datasetUrl).to.equal('https://test.com/test.geojson');
            done();
        });
    });


});

describe('#getLoopbackModelFromMediaType', function () {
    it('throws error when mediaType not recognised', function () {
        assert.throws(function () {
            getLoopbackModelFromMediaType('application/jwt')
        }, Error, 'Model not found for media type');
    });

    it('returns Model for a recongised mediaType', function () {
        getLoopbackModelFromMediaType('application/vnd.geo+json').should.equal('GeoJSONFeature');
    });


});

describe('#convertCkanAPIResultsToCityScopeJson', function () {

    it('throws error when json is invalid', function () {
        assert.throws(function () {
            convertCkanAPIResultsToCityScopeJson(testInvalidJson)
        }, Error, 'Invalid JSON data');
    });

    it('throws error when result has error', function () {
        assert.throws(function () {
            convertCkanAPIResultsToCityScopeJson(cKanAPIBadResult)
        }, Error, 'Query failed: error text');
    });

    it('throws an error when zero query results are returned', function () {
        assert.throws(function () {
            convertCkanAPIResultsToCityScopeJson(cKanAPIZeroResults);
        }, Error, 'API call returned zero records');

    });

    it('converts CKAN API call to results array', function () {
        convertCkanAPIResultsToCityScopeJson(cKanAPIResult)[0].test.should.equal(cKanConvertedResult[0].test);
    });

});

describe('#getCkanApiResponseFields', function () {

    it('throws error when json is invalid', function () {
        assert.throws(function () {
            getCkanApiResponseFields(testInvalidJson)
        }, Error, 'Invalid JSON data');
    });

    it('throws error when result has error', function () {
        assert.throws(function () {
            getCkanApiResponseFields(cKanAPIBadResult)
        }, Error, 'Query failed: error text');
    });

    it('returns fields array', function () {
        getCkanApiResponseFields(cKanAPIResult)[0].id.should.equal(cKanFields[0].id);
        getCkanApiResponseFields(cKanAPIResult)[0].type.should.equal(cKanFields[0].type);
    });

});

describe('#parseCkanApiResponseFields', function () {

    it('parses fields correctly', function () {
        result = parseCkanApiResponseFields(cKanFields);
        result[1].id.should.equal("latitude");
        result[2].id.should.equal("longitude");
        result[3].id.should.equal("type");
        result[4].id.should.equal("name");

    });

});

describe('#parseCkanApiResult', function () {

    it('parses fields correctly', function () {
        result = parseCkanApiResult(cKanConvertedResult);
        result[0].latitude.should.equal("0");
        result[0].longitude.should.equal("0");
        result[0].type.should.equal("site");
        result[0].name.should.equal("name");
    });

});

describe('#fetchMapItAreas', function () {

    it('returns feature collection of areas correctly', function (done) {
        fetchMapItAreas(osAreaIds, function (error, result) {
            expect(error).to.be.null;
            expect(result).to.be.a('object');
            expect(result.type).to.equal("FeatureCollection");
            expect(result.features.length).to.equal(2)
            expect([result.features[0].id, result.features[1].id])
                .to.have.members(osAreaIds);
            expect([result.features[0].properties.name, result.features[1].properties.name])
                .to.have.members(osAreaNames);

            if (result.features[0].properties.name == 'Almond') {
                multi = 0;
                single = 1;
            }
            else {
                multi = 1;
                single = 0;
            }
            expect(result.features[multi].geometry.type).to.equal("MultiPolygon")
            expect(result.features[multi].geometry.coordinates.length).to.equal(3)
            expect(result.features[multi].geometry.coordinates[2][0].length).to.be.greaterThan(1000)
            expect(result.features[multi].geometry.coordinates[0][0][10].length).to.equal(2)
            expect(result.features[single].geometry.type).to.equal("Polygon")
            expect(result.features[single].geometry.coordinates.length).to.equal(1)
            expect(result.features[single].geometry.coordinates[0].length).to.be.greaterThan(1000)
            expect(result.features[single].geometry.coordinates[0][10].length).to.equal(2)
            done();
        });
    });

    it('returns error when bad area ID passed', function (done) {
        fetchMapItAreas(['X'], function (error, result) {
            expect(error).to.not.be.null;
            done();
        });
    });

    it('returns error when no area IDs supplied', function (done) {
        fetchMapItAreas([], function (error, result) {
            expect(error).to.not.be.null
            expect(error.message).to.equal('Invalid list of area IDs supplied')
            done();
        });
    });

});

describe('#updateDataModification', function () {

    it('updates modification date in data.json correctly', function () {
        var file = path.join(__dirname, 'data.json');
        fs.writeFileSync(file, '{}', 'utf8');
        updateDataModificationDate(__dirname)

        var now = new Date()
        var today = now.toISOString().substring(0, 10)

        var data = JSON.parse(fs.readFileSync(file, 'utf8'));
        expect(data).to.deep.equal({modified: today})
        fs.unlinkSync(file)
    });

});

describe('#fetchGovBoundaries', function () {

    it('returns feature collection of areas correctly', function (done) {
        this.timeout(60000);

        fetchGovBoundaries('dz-2001', (err, features, zones) => {
            expect(err).to.be.null;

            expect(features.length).to.equal(3)
            expect(zones.length).to.equal(3)

            // Calls for boundary data are queued, so we should be OK to test a specific list index being a known value.
            expect(zones[1]).to.equal('http://statistics.gov.scot/id/statistical-geography/S01001791')

            expect(features[0].type).to.equal("Feature")
            expect(features[0].properties.DZ_CODE).to.equal("S01001790")
            expect(features[0].properties.collection).to.equal("dz-2001")
            expect(features[0].id).to.equal("S01001790")
            expect(features[0].geometry.type).to.equal("Polygon")
            expect(features[0].geometry.coordinates.length).to.equal(1)
            expect(features[0].geometry.coordinates[0].length).to.be.greaterThan(10)
            expect(features[0].geometry.coordinates[0][10].length).to.equal(2)

            expect(features[2].type).to.equal("Feature")
            expect(features[2].properties.DZ_CODE).to.equal("S01001792")
            expect(features[2].properties.collection).to.equal("dz-2001")
            expect(features[2].id).to.equal("S01001792")
            expect(features[2].geometry.type).to.equal("Polygon")
            expect(features[2].geometry.coordinates.length).to.equal(1)
            expect(features[2].geometry.coordinates[0].length).to.be.greaterThan(10)
            expect(features[2].geometry.coordinates[0][10].length).to.equal(2)

            done();
        }, 3);

    });
});

describe('#getScotGovSPARQL', function () {

    it('returns nodeified results from the statistics.gov.scot API', function (done) {
        this.timeout(5000);

        query = `
            PREFIX qb: <http://purl.org/linked-data/cube#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX ldim: <http://purl.org/linked-data/sdmx/2009/dimension#>
            PREFIX dim: <http://statistics.gov.scot/def/dimension/>
            PREFIX simd: <http://statistics.gov.scot/def/concept/simd-domain/>
            PREFIX area: <http://statistics.gov.scot/id/statistical-geography/>
            PREFIX data: <http://statistics.gov.scot/data/>
            PREFIX prop: <http://statistics.gov.scot/def/measure-properties/>
            PREFIX year: <http://reference.data.gov.uk/id/year/>

            SELECT ?zone ?rank
                WHERE {
                ?s qb:dataSet data:scottish-index-of-multiple-deprivation-2016 ;
                   qb:measureType prop:rank ;
                   prop:rank ?rank ;
                   dim:simdDomain simd:crime ;
                   ldim:refArea ?z ;
                   ldim:refPeriod year:2016 .
                ?z rdfs:label ?zone .
                FILTER (
                    ?z = <http://statistics.gov.scot/id/statistical-geography/S01008701>
                )
            }`;

        getScotGovSPARQL(query, (err, rows, columns) => {
            expect(err).to.be.null;

            expect(columns.toString()).to.equal(['zone', 'rank'].toString());
            expect(rows.length).to.equal(1);
            expect(rows[0].zone).to.equal('S01008701');
            expect(rows[0].rank).to.be.a('number');

            done();
        });

    });

    it('returns error with invalid query', function (done) {
        this.timeout(5000);

        query = `
            SELECT ?zone ?rank
                WHERE {
                ?s qb:dataSet data:scottish-index-of-multiple-deprivation-2016 ;
                   qb:measureType prop:rank ;
                   prop:rank ?rank ;
                   dim:simdDomain simd:crime ;
                   ldim:refArea ?z ;
                   ldim:refPeriod year:2016 .
                ?z rdfs:label ?zone .
                FILTER (
                    ?z = <http://statistics.gov.scot/id/statistical-geography/S01008701>
                )
            }`;

        getScotGovSPARQL(query, (err, rows, columns) => {
            expect(err).not.to.be.null;

            done();
        });

    });


});
