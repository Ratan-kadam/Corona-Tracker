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
  const myOptions = {
    color: COLORS.RED,
    rotation: 10,
  }
  const myLocationMarker = new mapboxgl.Marker(myOptions)
  const myMap = initMaps();
  const currentLocationService = new getLocation(myMap, myLocationMarker);
  currentLocationService.drawMyLocation();
  loadMain(myMap)

});

var loadMain = function (myMap) {
  FetchApisModule().fetchApi(API.LIVE_DATA, 'liveData')
    .then(json => {
      const { maxcount, totalCount } = plotPinsOnMap(myMap, json);
      circleLayer(myMap, json, maxcount);
      // circleLayerPopup(myMap);
    })
}

var circleLayer = function (myMap, json, maxcount) {
  var geoLayerData = createLayerGeoData(json, maxcount);
  myMap.addSource('places', {
    type: 'geojson',
    data: geoLayerData
  })

  myMap.addLayer({
    id: 'places',
    type: 'circle',
    source: 'places',
    paint: {
      'circle-radius': ['get', 'percentOfOverallCases'],
      'circle-color': '#701d07',
      'circle-stroke-color': '#886308',
      'circle-stroke-opacity': 0.2,
      'circle-stroke-width': 0.1,
      'circle-opacity': 0.2
    }
  })
}

var getColor = function (count, maxcount) {
  const percentage = ((count/maxcount) * 100);
  let color, colorName;
  if (percentage > 50) {
    color = '#701d07' ; // red
    colorName = 'red';
  } else if (percentage < 50 && percentage > 10) {
    color = '#bb2124' // ornage
    colorName = 'orange';
  } else if (percentage < 10 && percentage > 1){
    color = '#886308' //'yellow'
    colorName = 'yellow';
  } else {
    color = '#001e00' // green
    colorName = 'green';
  }

  return { color, percentage, colorName};
}

var createLayerGeoData = function(json, maxcount) {
  const {
    data
  } = json || {};

  let maxPercent = 0;

  var obj = {};
  obj.type = 'geojson';
  obj.data = {};
  obj.data.type = 'FeatureCollection';
  obj.data.features = [];

  for (var i = 0; i < data.length; i++) {
    var currentDataObj = data[i];

    const percentOfCases =  (data[i].confirmed/maxcount) * 100;

    if ( maxPercent < percentOfCases ) {
      maxPercent = percentOfCases;
    }


    var dataObj = {};

    dataObj.type = 'Feature';
    dataObj.properties = {};
    dataObj.properties.description = 'sample';
    dataObj.properties.icon = 'theatre';
    dataObj.properties.percentOfOverallCases = percentOfCases/2; // max radius 50

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
  let maxcount = 0;
  let totalCount = 0;

  for (var i = 0; i < data.length; i++) {
    if (data[i].confirmed > maxcount) {
      maxcount = data[i].confirmed;
      totalCount = totalCount + data[i].confirmed;
    }
  }

  for (var i = 0; i < data.length; i++) {
    const { color, percentage, colorName } = getColor(data[i].confirmed, totalCount);
    const options = {
      color: color,
    }

    var m = new mapboxgl.Marker(options)
      .setLngLat([data[i].longitude, data[i].latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`<div class="tooltip-${colorName}"><strong><span class="push-5-l push-5">${data[i].location}</span></strong> <br> <span class="push-5-l push-5">Cases ${percentage.toFixed(2)} % </span><br> <span class="push-5-l push-5"> Confirmed: ${data[i].confirmed} </span> <br><span class="push-5-l push-5"> Deaths: ${data[i].dead} </span><br> <span class="push-5-l push-5"> Recovered: ${data[i].recovered}</span></div>`))

      if ((data[i].location).toLowerCase() !== "togo" ) {
          m.addTo(map); /* api have wrong location for togo */
      }


      (function (marketElement) {
        marketElement.getElement().addEventListener('mouseenter', () => {
            marketElement.togglePopup()
          })

          marketElement.getElement().addEventListener('mouseleave', () => {
              marketElement.togglePopup()
            })
        })(m);
  }
    return { maxcount, totalCount };
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

function circleLayerPopup(myMap) {
  var popup = new mapboxgl.Popup();
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
}
