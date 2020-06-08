import {
  FetchApisModule
} from './utils.js';
import {
  API,
  COLORS,
  markersHtml,
} from './constants.js';
import {
  store
} from './store.js';


document.addEventListener("DOMContentLoaded", function() {
  const myMap = initMaps();
  const myOptions = {
    color: COLORS.RED,
    rotation: 10,
  }
  const myLocationMarker = new mapboxgl.Marker(myOptions)
  const currentLocationService = new getLocation(myMap, myLocationMarker);
  currentLocationService.drawMyLocation();

  FetchApisModule().fetchApi(API.LIVE_DATA, 'liveData')
    .then(json => {
      var geoLayerData = createLayerGeoData(json);
      myMap.addSource('places', {
        type: 'geojson',
        data: geoLayerData
      })

      myMap.addLayer({
        id: 'places',
        type: 'circle',
        source: 'places',
        paint: {
          'circle-radius': 10,
          'circle-color': '#8B0000',
          'circle-stroke-color': 'white',
          'circle-stroke-width': 4,
          'circle-opacity': 1
        }
      })

      var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });
      plotPinsOnMap(myMap, json);
    })
});

var createLayerGeoData = function(json) {
  const {
    data
  } = json || {};

  var obj = {};
  obj.type = 'geojson';
  obj.data = {};
  obj.data.type = 'FeatureCollection';
  obj.data.features = [];

  for (var i = 0; i < data.length; i++) {
    var currentDataObj = data[i];

    var dataObj = {};

    dataObj.type = 'Feature';
    dataObj.properties = {};
    dataObj.properties.description = 'sample';
    dataObj.properties.icon = 'theatre';

    dataObj.geometry = {};
    dataObj.geometry.type = 'Point';
    dataObj.geometry.coordinates = [];

    dataObj.geometry.coordinates.push(currentDataObj.longitude);
    dataObj.geometry.coordinates.push(currentDataObj.latitude);

    obj.data.features.push(dataObj)
  }

  return obj.data;
}


var initMaps = function() {
  mapboxgl.accessToken = '';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    zoom: 3,
  });

  var nav = new mapboxgl.NavigationControl();
  map.addControl(nav, 'top-left');

  return map;
}

var plotPinsOnMap = function(map, json) {
  const {
    data
  } = json || {};
  for (var i = 0; i < data.length; i++) {
    var m = new mapboxgl.Marker()
      .setLngLat([data[i].longitude, data[i].latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`Confirmed: ${data[i].confirmed} <br> Deaths: ${data[i].dead} <br> Recovered: ${data[i].recovered}`))
      .addTo(map);
    markersHtml.push(m);
  }

    for (var i = 0; i < data.length; i++) {
      var marketElement = markersHtml[i];
      (function (marketElement) {
        marketElement.getElement().addEventListener('mouseenter', () => {
            marketElement.togglePopup()
          })

          marketElement.getElement().addEventListener('mouseleave', () => {
              marketElement.togglePopup()
            })
        })(marketElement);
    }
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
    myMap.setCenter([crd.longitude, crd.latitude]);
    myLocationMarker.addTo(myMap);

  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  function drawMyLocation() {
    return navigator.geolocation.getCurrentPosition(success, error, options);
  }

  return {
    drawMyLocation,
  }
}

function openPopupOnClick(myMap) {
  myMap.on('mouseenter', 'places', function(e) {
    myMap.getCanvas().style.cursor = 'pointer';

    var coordinates = e.features[0].geometry.coordinates.slice();
    var description = e.features[0].properties.description;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    popup
      .setLngLat(coordinates)
      .setHTML(description)
      .addTo(myMap);
  });

  myMap.on('mouseleave', 'places', function() {
    myMap.getCanvas().style.cursor = '';
    popup.remove();
  });
  plotPinsOnMap(myMap, json);
}
