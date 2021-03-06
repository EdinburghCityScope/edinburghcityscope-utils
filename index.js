var https = require('https')
var http = require('http')
var urllib = require('url')
var csv2geojson = require("csv2geojson");
var path = require('path');
var fs = require('fs');

module.exports = {

    /**
     *  Gets an associated Loopback model from a mediaType
     * @param {mediaType} Media type to check
     * @return Model name as String
     *
     */
    getLoopbackModelFromMediaType(mediaType)
    {
        if (mediaType == 'application/vnd.geo+json') {
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
        try {
            var featureCollection = JSON.parse(featureCollection);
        }
        catch (err) {
            throw new Error('Unable to parse FeatureCollection');
        }

        var features = [];
        features = featureCollection.features;

        if (features == null || featureCollection.features == null) {
            throw new Error('Empty feature Collection or invalid GeoJSON');
        }

        return features;
    },

    /**
     * Convert a GeoJSON Feature Array into an Loopback json object
     *
     * @param {array} featureArray
     * @param {string} model name
     * @param {string} loopBackJson an existing data file to add data into.
     */
    featureArrayToLoopbackJson(featureArray, model = "GeoJSONFeature", loopbackJson = null)
    {
        loopbackJson = loopbackJson || { ids: {}, models: {} };
        loopbackJson.models[model] = loopbackJson.models[model] || {};
        var maxId = 0;
        var offset = loopbackJson.ids[model] || 0;

        for (var i = 0; i < featureArray.length; i++) {
            if (typeof featureArray[i].id === "undefined") {
                featureArray[i].id = i + offset;
            }
            loopbackJson.models[model][featureArray[i].id.toString()] = JSON.stringify(featureArray[i])
            maxId = Math.max(maxId, featureArray[i].id);
        }

        loopbackJson.ids[model] = maxId + 1

        return loopbackJson;
    },

    /**
     * Get data from a url.  This is an asynchronous function that will return any error object to the callback.
     *
     * @param {url} The URL to get the data from
     * @param {callback} The callback function, parameters used are (error, data, c)
     * @param {c} An object returned to the callback function to provide contextual information
     */
    getDataFromURL(url, callback, c)
    {
        try {
            var urlObject = urllib.parse(url);
            var protocol = (urlObject.protocol == "https:") ? https : http

            protocol.get(url, function (response) {
                if (response.statusCode !== 200) {
                    // consume response data to free up memory
                    response.resume()
                    callback(new Error('Data not found (' + response.statusCode + '): ' + response.statusMessage + " [" + response.req.path + "]"));
                    return
                }

                // Continuously update stream with data
                var body = '';
                response.on('data', function (d) {
                    body += d;
                });
                response.on('end', function () {
                    // Callback body now data is finished reception
                    callback(null, body, c);
                });
            }).on('error', function (e) {
                callback(e);
            });
        }
        catch (e) {
            callback(e)
        }
    },

    /**
     * @param {dcatData} The data packed containing the DCAT information
     * @param {callback} The callback containing the model and dataset url
     */
    getModelUrlFromDcatInfo(dcatData, callback)
    {
        var edinburghcityscopeUtils = require('./index');
        var getLoopbackModelFromMediaType = edinburghcityscopeUtils.getLoopbackModelFromMediaType;
        var modelAndUrl = JSON.parse('{"model": "","datasetUrl": ""}');
        var dcatJson = JSON.parse(dcatData);
        try {

            for (var i = 0; i < dcatJson.distribution.length; i++) {
                try {
                    modelAndUrl.model = getLoopbackModelFromMediaType(dcatJson.distribution[i].mediaType);
                    modelAndUrl.datasetUrl = dcatJson.distribution[i].downloadURL;
                    //Immediately break iteration if valid model/url is found
                    break;
                } catch (e) {
                    // Do nothing as it's likely just a mediaType that Loopback can't handle
                }

            }

        }
        catch (err) {
            throw new Error('Invalid DCAT JSON');
        }
        callback(modelAndUrl);
    },

    /**
     * convert CSV data to JSON array
     * @param csvData
     * @return GeoJSON array
     */
    convertCsvDataToGeoJson(csvData, callback)
    {

        csv2geojson.csv2geojson(csvData, {
            latfield: 'latitude',
            lonfield: 'longitude',
            delimiter: ','
        }, function (err, data) {
            if (err) {
                throw err;
            }

            callback(data);
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
            if (!cKanApiResponseJson.success) {
                throw new Error('Query failed: ' + cKanApiResponseJson.error);
            }
            else if (cKanApiResponseJson.result.total == '0') {
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
            if (!cKanApiResponseJson.success) {
                throw new Error('Query failed: ' + cKanApiResponseJson.error);
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
        cKanApiResponseFields.forEach(function (obj) {
            if (obj.id == "Longitude") {
                obj.id = "longitude";
            }
            else if (obj.id == "Latitude") {
                obj.id = "latitude";
            }
            else if (obj.id == "BankTypeNa") {
                obj.id = "type";
            }
            else if (obj.id == "Site_Name") {
                obj.id = "name";
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
        cKanApiResult.forEach(function (obj) {
            newObj = {};
            for (var key in obj) {
                var attrName = key;
                if (attrName == "Longitude") {
                    attrName = "longitude";
                }
                else if (attrName == "Latitude") {
                    attrName = "latitude";
                }
                else if (attrName == "BankTypeNa") {
                    attrName = "type";
                }
                else if (attrName == "Site_Name") {
                    attrName = "name";
                }

                var attrValue = obj[key];

                newObj[attrName] = attrValue;
            }
            parsedCkanResult.push(newObj)
        });

        return parsedCkanResult;
    },

    /**
     * Fetch area geometry from MapIt and return a GeoJSON feature collection.
     *
     * @param {areas} Array of area refs.
     * @param {callback} Callback to return the GeoJSON feature collection to.
     */
    fetchMapItAreas(areas, callback) {
        var edinburghcityscopeUtils = require('./index');
        var getDataFromURL = edinburghcityscopeUtils.getDataFromURL;
        var completed_requests = 0;
        var features = []
        var url, geometry, area, feature_collection
        var hasError = false

        if (!areas || areas.constructor !== Array || !areas.length) {
            callback(new Error("Invalid list of area IDs supplied"))
            return
        }

        for (var i in areas) {
            url = "https://mapit.mysociety.org/area/" + areas[i]

            getDataFromURL(url, (err, data) => {
                if (hasError) {
                    return
                }

                if (err) {
                    hasError = true
                    callback(err)
                    return;
                }

                area = JSON.parse(data)
                console.log("Fetching boundary for " + area.type_name + " " + area.name)
                url = "https://mapit.mysociety.org/area/" + area.id + ".geojson"

                getDataFromURL(url, (err, data, area) => {
                    if (hasError) {
                        return
                    }

                    if (err) {
                        hasError = true
                        callback(err)
                        return;
                    }

                    geometry = JSON.parse(data);
                    features.push({
                        type: "Feature",
                        id: area.id,
                        properties: {name: area.name},
                        geometry: geometry,
                    })

                    if (++completed_requests == areas.length) {
                        feature_collection = {
                            type: "FeatureCollection",
                            features: features,
                        }

                        callback(null, feature_collection)
                    }
                }, area);
            });
        }
    },

    /**
     * Update the modification date in data.json.
     *
     * @param {dir} Directory path for data.json file that needs updating.
     */
    updateDataModificationDate(dir) {
        var file = path.join(dir, 'data.json');
        var data = JSON.parse(fs.readFileSync(file, 'utf8'));
        var now = new Date()
        data.modified = now.toISOString().substring(0, 10)

        console.log("Setting data modification date to " + data.modified)
        fs.writeFileSync(file, JSON.stringify(data, null, 4), 'utf8');
    },

    /**
     * Fetch all boundaries in an area collection from the Scottish Governments statistics site.
     *
     * @param (collection) The collection id used to build the URI.
     * @param (callback) Callback to return the GeoJSON to.
     *                   First parameter is an error object, or null on success.
     *                   Second is the GeoJSON object
     *                   Third is a list of zones
     */
    fetchGovBoundaries(collection, callback, limit=1000) {
        const edinburghcityscopeUtils = require('./index');
        const getDataFromURL = edinburghcityscopeUtils.getDataFromURL;
        const querystring = require('querystring');
        const queue = require('queue');

        // We make paged requests to statistics.gov.uk to avoid time-outs, even though we set the page size to be large
        // enough to retrieve all records in one request.
        const areaEndpoint = "http://statistics.gov.scot/area_collection.pagedjson?"
        const qs = {
            "in_collection": "http://statistics.gov.scot/def/geography/collection/" + collection,
            "within_area": "http://statistics.gov.scot/id/statistical-geography/S12000036",
            "page": 1,
            "per_page": limit,
        }
        const boundaryPath = "http://statistics.gov.scot/boundaries/"

        var boundaries = []

        getDataFromURL(areaEndpoint + querystring.stringify(qs), (err, zones, c) => {
            if (err) {
                callback(err);
                return;
            }

            // We only make one request at a time to statistics.gov.scot to avoid breaking it.
            var tasks = queue({concurrency: 1});

            zones = JSON.parse(zones)
            var zone_list = [];
            var zone, id;
            var j = 0;
            for (var i in zones.rows) {
                tasks.push(function(done) {
                    zone = zones.rows[j++][0]
                    id = zone.link.substring(zone.link.lastIndexOf('/') + 1);
                    zone_uri = zone.link.substring(zone.link.indexOf('http://'));
                    zone_list.push(zone_uri)

                    getDataFromURL(boundaryPath + id + ".json", (err, boundary, ctx) => {
                        if (err) {
                            console.log("ERRORING: " + ctx)
                            callback(err);
                            return;
                        }

                        boundary = JSON.parse(boundary)
                        boundary.id = ctx.id
                        boundary.properties.collection = ctx.collection
                        boundaries.push(boundary)

                        done()
                    }, {id: id, collection: c});
                });

            }

            tasks.start(function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, boundaries, zone_list);
                }
            });

        }, collection);

    },

    /**
     * Fetch all boundaries in an area collection from the Scottish Governments statistics site.
     *
     * @param (query)    A string for the SPARQL query
     * @param (callback) Callback to return the result object to.
     *                   First parameter is an error object, or null on success.
     *                   Second is the result object as received from the SPARQL API.
     * @param (limit)    Optionally override the pagination size if row size is too large.  If not provided, the
     *                   function will chunk the query using limit and offset to try and avoid timeouts on the API.
     */
    getScotGovSPARQL(query, callback, limit=null) {
        const queue = require('queue');
        const {SparqlClient, SPARQL} = require('sparql-client-2');
        const SparqlParser = require('sparqljs').Parser;
        const parser = new SparqlParser();
        const SparqlGenerator = require('sparqljs').Generator;
        const generator = new SparqlGenerator();
        // Add to this list if we encounter other numeric datatypes.
        const numericDatatypes = [
            'http://www.w3.org/2001/XMLSchema#integer',
            'http://www.w3.org/2001/XMLSchema#decimal',
        ];
        var row = {}, rows = [], columns = []

        // We update the SPARQL query to include limits, unless a limit has been explicitly set in which case we use that.
        try {
            var parsedQuery = parser.parse(query);
            parsedQuery.offset = 0;
            parsedQuery.limit = (limit == null) ? 5000 : limit;
        }
        catch (err) {
            callback(err);
            return;
        }

        // Change the SPARQL client defaults to match requirements for statistics.gov.scot
        var client = new SparqlClient('http://statistics.gov.scot/sparql', {
            defaultParameters: {
                format: 'json'
            }
        });

        // Tasks have to be run sequentially.
        var tasks = queue({concurrency: 1});

        var fetchChunk = function(done) {
            var generatedQuery = generator.stringify(parsedQuery).replace(/\\n/g, ' ');

            client.query(generatedQuery)
                .execute()
                .then(function (response) {
                    if (!response) {
                        throw new Error ("No response received from statistics.gov.uk!");
                    }

                    if (response.results.bindings.length) {
                        columns = response.head.vars;

                        for (var i = 0; i < response.results.bindings.length; i++) {
                            row = {}
                            response.head.vars.forEach(field => {
                                if (response.results.bindings[i][field].type != 'literal') {
                                    throw new Error(`Non-literal returned for variable ?${field}.  Currently only literals can be handled.`);
                                }

                                row[field] = response.results.bindings[i][field].value;

                                // If explicitly declared as a number, store it as such.
                                if (response.results.bindings[i][field].datatype && ~numericDatatypes.indexOf(response.results.bindings[i][field].datatype)) {
                                    row[field] = Number(row[field]);
                                }
                            });
                            rows.push(row)
                        }

                        // Update the offset on the parsed query and push another task to the queue to continue
                        // fetching results, unless we received less than the limit.
                        if (response.results.bindings.length == parsedQuery.limit) {
                            parsedQuery.offset += parsedQuery.limit;
                            tasks.push(fetchChunk);
                        }
                    }

                    done();
                })
                .catch(err => {
                    console.log(err);
                    done(err);
                })
        };

        // Initialise the task queue with the first job.
        tasks.push(fetchChunk);

        tasks.on('timeout', function(next, job) {
            console.log('Fetch from SPARQL timed out!');
            next();
        });

        tasks.start(function(err) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, rows, columns);
            }
        });
    }

};
