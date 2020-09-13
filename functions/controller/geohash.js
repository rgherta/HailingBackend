'use strict';

const g_GEOHASH_PRECISION = 8;
const g_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
const g_EARTH_MERI_CIRCUMFERENCE = 40007860;
const g_METERS_PER_DEGREE_LATITUDE = 110574;
const g_BITS_PER_CHAR = 5;
const g_MAXIMUM_BITS_PRECISION = 22*g_BITS_PER_CHAR;
const g_EARTH_EQ_RADIUS = 6378137.0;
const g_E2 = 0.00669447819799;
const g_EPSILON = 1e-12;


  // jsdoc

  const degreesToRadians = (degrees) => {

    if (typeof degrees !== "number" || isNaN(degrees)) {
      throw new Error("Error: degrees must be a number");
    }
  
    return (degrees * Math.PI / 180);

  };

  //jsdoc

  const encodeGeohash = (location, precision) => {

    if (typeof precision !== "undefined") {
      if (typeof precision !== "number" || isNaN(precision)) {
        throw new Error("precision must be a number");
      }
      else if (precision <= 0) {
        throw new Error("precision must be greater than 0");
      }
      else if (precision > 22) {
        throw new Error("precision cannot be greater than 22");
      }
      else if (Math.round(precision) !== precision) {
        throw new Error("precision must be an integer");
      }
    }
  
    precision = precision || g_GEOHASH_PRECISION;
  
    let latitudeRange = {
      min: -90,
      max: 90
    };
    let longitudeRange = {
      min: -180,
      max: 180
    };
    let hash = "";
    let hashVal = 0;
    let bits = 0;
    let even = 1;
  
    while (hash.length < precision) {
      var val = even ? location[1] : location[0];
      var range = even ? longitudeRange : latitudeRange;
      var mid = (range.min + range.max) / 2;
  
      /* jshint -W016 */
      if (val > mid) {
        hashVal = (hashVal << 1) + 1;
        range.min = mid;
      }
      else {
        hashVal = (hashVal << 1) + 0;
        range.max = mid;
      }
      /* jshint +W016 */
  
      even = !even;
      if (bits < 4) {
        bits++;
      }
      else {
        bits = 0;
        hash += g_BASE32[hashVal];
        hashVal = 0;
      }
    }
  
    return hash;
  };

  //jsdoc

  const metersToLongitudeDegrees = (distance, latitude) => {

    let radians = degreesToRadians(latitude);
    let num = Math.cos(radians)*g_EARTH_EQ_RADIUS*Math.PI/180;
    let denom = 1/Math.sqrt(1-g_E2*Math.sin(radians)*Math.sin(radians));
    let deltaDeg = num*denom;
    if (deltaDeg  < g_EPSILON) {
      return distance > 0 ? 360 : 0;
    }
    else {
      return Math.min(360, distance/deltaDeg);
    }
  };

  //jsdoc

  const longitudeBitsForResolution = (resolution, latitude) => {
    let degs = metersToLongitudeDegrees(resolution, latitude);
    return (Math.abs(degs) > 0.000001) ?  Math.max(1, Math.log2(360/degs)) : 1;
  };

 //jsdoc

  const latitudeBitsForResolution = (resolution) => {
    return Math.min(Math.log2(g_EARTH_MERI_CIRCUMFERENCE/2/resolution), g_MAXIMUM_BITS_PRECISION);
  };

  //jsdoc

  const wrapLongitude = (longitude) => {

    if (longitude <= 180 && longitude >= -180) {
      return longitude;
    }
    let adjusted = longitude + 180;
    if (adjusted > 0) {
      return (adjusted % 360) - 180;
    }
    else {
      return 180 - (-adjusted % 360);
    }
  };

  const boundingBoxBits = (coordinate, size) => {

    let latDeltaDegrees = size/g_METERS_PER_DEGREE_LATITUDE;
    let latitudeNorth = Math.min(90, coordinate[0] + latDeltaDegrees);
    let latitudeSouth = Math.max(-90, coordinate[0] - latDeltaDegrees);
    let bitsLat = Math.floor(latitudeBitsForResolution(size))*2;
    let bitsLongNorth = Math.floor(longitudeBitsForResolution(size, latitudeNorth))*2-1;
    let bitsLongSouth = Math.floor(longitudeBitsForResolution(size, latitudeSouth))*2-1;
    return Math.min(bitsLat, bitsLongNorth, bitsLongSouth, g_MAXIMUM_BITS_PRECISION);
  };

  //jsdoc


  const boundingBoxCoordinates = (center, radius) => {

    let latDegrees = radius/g_METERS_PER_DEGREE_LATITUDE;
    let latitudeNorth = Math.min(90, center[0] + latDegrees);
    let latitudeSouth = Math.max(-90, center[0] - latDegrees);
    let longDegsNorth = metersToLongitudeDegrees(radius, latitudeNorth);
    let longDegsSouth = metersToLongitudeDegrees(radius, latitudeSouth);
    let longDegs = Math.max(longDegsNorth, longDegsSouth);
    return [
      [center[0], center[1]],
      [center[0], wrapLongitude(center[1] - longDegs)],
      [center[0], wrapLongitude(center[1] + longDegs)],
      [latitudeNorth, center[1]],
      [latitudeNorth, wrapLongitude(center[1] - longDegs)],
      [latitudeNorth, wrapLongitude(center[1] + longDegs)],
      [latitudeSouth, center[1]],
      [latitudeSouth, wrapLongitude(center[1] - longDegs)],
      [latitudeSouth, wrapLongitude(center[1] + longDegs)]
    ];
  };

  //jsdoc

  const geohashQuery = (geohash, bits) => {

    let precision = Math.ceil(bits/g_BITS_PER_CHAR);
    if (geohash.length < precision) {
      //console.warn("geohash.length < precision: "+geohash.length+" < "+precision+" bits="+bits+" g_BITS_PER_CHAR="+g_BITS_PER_CHAR);
      return [geohash, geohash+"~"];
    }
    geohash = geohash.substring(0, precision);
    let base = geohash.substring(0, geohash.length - 1);
    let lastValue = g_BASE32.indexOf(geohash.charAt(geohash.length - 1));
    let significantBits = bits - (base.length*g_BITS_PER_CHAR);
    let unusedBits = (g_BITS_PER_CHAR - significantBits);
    /*jshint bitwise: false*/
    // delete unused bits
    let startValue = (lastValue >> unusedBits) << unusedBits;
    let endValue = startValue + (1 << unusedBits);
    /*jshint bitwise: true*/
    if (endValue >= g_BASE32.length) {
      //console.warn("endValue > 31: endValue="+endValue+" < "+precision+" bits="+bits+" g_BITS_PER_CHAR="+g_BITS_PER_CHAR);
      return [base+g_BASE32[startValue], base+"~"];
    }
    else {
      return [base+g_BASE32[startValue], base+g_BASE32[endValue]];
    }
  };

  //jsdoc

  exports.proximityHashes = async (center, radius) => {

    let queryBits = Math.max(1, boundingBoxBits(center, radius));
    let geohashPrecision = Math.ceil(queryBits/g_BITS_PER_CHAR);
    let coordinates = boundingBoxCoordinates(center, radius);

    let queries = coordinates.map( (coordinate) => {
        return geohashQuery(encodeGeohash(coordinate, geohashPrecision), queryBits);
        });
    // remove duplicates
    return queries.filter(function(query, index) {
      return !queries.some(function(other, otherIndex) {
        return index > otherIndex && query[0] === other[0] && query[1] === other[1];
      });
    });

  };

  //jsdoc

  exports.distance = (location1, location2) => {
  
    let radius = 6371; // Earth's radius in kilometers
    let latDelta = degreesToRadians(location2[0] - location1[0]);
    let lonDelta = degreesToRadians(location2[1] - location1[1]);
  
    let a = (Math.sin(latDelta / 2) * Math.sin(latDelta / 2)) +
            (Math.cos(degreesToRadians(location1[0])) * Math.cos(degreesToRadians(location2[0])) *
            Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2));
  
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return radius * c;
  };

  //jsdoc




