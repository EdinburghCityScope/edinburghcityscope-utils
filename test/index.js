var should = require('chai').should();
var expect = require('chai').expect();
var assert = require('chai').assert;

var edinburghcityscopeUtils = require('../index');
var featureCollectionToFeatureArray = edinburghcityscopeUtils.featureCollectionToFeatureArray;

var testFeatureCollection='{"type": "FeatureCollection","features": [{"type": "Feature","properties": {"name": "Test Name"},"geometry": {"type": "Point","coordinates": [-3.1952404975891113,55.94966839561511]}}]}';
var testEmptyFeatureCollection='{"type": "FeatureCollection","features": []}';
var expectedFeatureArray= [JSON.parse('{"type": "Feature","properties": {"name": "Test Name"},"geometry": {"type": "Point","coordinates": [-3.1952404975891113,55.94966839561511]}}')];
var testBadArray='{"type": "FeatureCollection","features": [ bad ]}';
var emptyArray=[];
var testInvalidJson='{ "bad": "value"}';
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
   assert.throws(function(){featureCollectionToFeatureArray(testInvalidJson)},Error,'Empty feature Collection or invalid GeoJSON');
 });

});