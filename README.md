# edinburghcityscope-utils
Node utility package for Edinburgh City Scope

## Installation

npm install edinburghcityscope-utils -- save

## Usage

var edinburghcityscopeUtils = require('edinburghcityscope-utils');
var featureCollection='{"type": "FeatureCollection","features": [{"type": "Feature","properties": {"name": "Test Name"},"geometry": {"type": "Point","coordinates": [-3.1952404975891113,55.94966839561511]}}]}';

var featureArray = edinburghcityscopeUtils.featureCollectionToFeatureArray(featureCollection);
var loopbackJson = edinburghcityscopeUtils.featureArrayToLoopbackJson(featureArray);

## Tests

npm test
