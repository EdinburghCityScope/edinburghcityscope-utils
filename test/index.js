var should = require('chai').should();
var edinburghcityscopeUtils = require('../index');
var featureCollectionToFeatureArray = edinburghcityscopeUtils.featureCollectionToFeatureArray;

var testFeatureCollection='{"type": "FeatureCollection","features": [{"type": "Feature","properties": {"name": "Test Name",},"geometry": {"type": "Point","coordinates": [-3.1952404975891113,55.94966839561511]}}]}';
var testEmptyFeatureCollection='{"type": "FeatureCollection","features": []}';

var emptyArray=[];
describe('#featureCollectionToFeatureArray', function(){
 it('converts empty featureCollection to empty FeatureArray',function(){
  featureCollectionToFeatureArray(testEmptyFeatureCollection).should.equal.empty;
 });

});