import {
  COLORS,
} from './constants.js';
import {
  searchMyLocationOnMap
} from './utils.js';

export const selfLocate = function(myMap) {
  const myOptions = {
    color: COLORS.RED,
    rotation: 10,
  }
  const myLocationMarker = new mapboxgl.Marker(myOptions)
  const currentLocationService = new getLocation(myMap, myLocationMarker);
  currentLocationService.drawMyLocation();
}

var getLocation = function(myMap, myLocationMarker) {
  var options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  function success(pos) {
    var crd = pos.coords;
    myLocationMarker.setLngLat([crd.longitude, crd.latitude])
    myLocationMarker.addTo(myMap);
    searchMyLocationOnMap([crd.longitude, crd.latitude], myMap, '', 3);
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  function drawMyLocation(myMap) {
    return navigator.geolocation.getCurrentPosition(success, error, options);
  }

  return {
    drawMyLocation,
  }
}
