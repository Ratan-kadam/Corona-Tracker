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
import {
  INDIA_STATES_CORDINATES
} from './static_data/static_data.js';


document.addEventListener("DOMContentLoaded", function() {
  const myOptions = {
    color: COLORS.RED,
    rotation: 10,
  }
  const myLocationMarker = new mapboxgl.Marker(myOptions)
  const myMap = initMaps();
  addEventListeners(myMap, store.cordinatesMapping);
  const currentLocationService = new getLocation(myMap, myLocationMarker);
  currentLocationService.drawMyLocation();
  loadMain(myMap);
  loadUsaData(myMap);
  loadIndiaData(myMap);
});

var loadIndiaData = function(myMap) {
  FetchApisModule().fetchApi(API.USA_DATA, 'india_states')
    .then(json => {
      circleLayerUsa(myMap, json);
      circleLayerPopup(myMap);
    })
}

var loadUsaData = function(myMap) {
  FetchApisModule().fetchApi(API.INDIA_DATA, 'usa_states')
    .then(json => {
      circleLayerIndia(myMap, json);
      circleLayerPopupIndia(myMap);
    })
}

var circleLayerUsa = function(myMap, json) {
  var usaGeoLayerData = createUsaCountyGeoData(json);
  myMap.addSource('usaCounty', {
    type: 'geojson',
    data: usaGeoLayerData
  })

  myMap.addLayer({
    id: 'usaCounty',
    type: 'circle',
    source: 'usaCounty',
    paint: {
      'circle-radius': 2,
      'circle-color': ['get', 'color'],
      'circle-stroke-color': 'white',
      'circle-stroke-opacity': 1,
      'circle-stroke-width': 0.2,
      'circle-opacity': 1
    }
  })
}

var circleLayerIndia = function(myMap, json) {
  var indiaGeoLayerData = createIndiaCountyGeoData(json, INDIA_STATES_CORDINATES);
  myMap.addSource('indiaStates', {
    type: 'geojson',
    data: indiaGeoLayerData
  })

  myMap.addLayer({
    id: 'indiaStates',
    type: 'circle',
    source: 'indiaStates',
    paint: {
      'circle-radius': 40,
      'circle-color': ['get', 'color'],
      'circle-stroke-color': 'white',
      'circle-stroke-opacity': 0.5,
      'circle-stroke-width': 0.2,
      'circle-opacity': 0.3
    }
  })

  myMap.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'indiaStates',
    layout: {
      'text-field': ['get', 'total'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 20
    }
  });
}

var createIndiaCountyGeoData = function(json, statesCordinates) {
  const {
    state
  } = json || {};

  const stateMapping = {};

  for (var i = 0; i < statesCordinates.length; i++) {
    stateMapping[statesCordinates[i].state] = statesCordinates[i];
  }

  var obj = {};

  const data = state;

  obj.data = {};
  obj.data.type = 'FeatureCollection';
  obj.data.features = [];
  for (var i = 0; i < data.length; i++) {
    var currentDataObj = data[i];
    var geometryObj = stateMapping[currentDataObj.name] || {};
    var dataObj = {};

    dataObj.type = 'Feature';
    dataObj.properties = {};
    dataObj.properties.name = currentDataObj.name;
    dataObj.properties.total = currentDataObj.total;
    dataObj.properties.active = currentDataObj.active;
    dataObj.properties.cured = currentDataObj.cured;
    dataObj.properties.death = currentDataObj.death;
    dataObj.properties.color = getColorForIndiaStates(currentDataObj.total).colorName;


    dataObj.geometry = {};
    dataObj.geometry.type = 'Point';
    dataObj.geometry.coordinates = [];

    dataObj.geometry.coordinates.push(geometryObj.longitude);
    dataObj.geometry.coordinates.push(geometryObj.latitude);

    obj.data.features.push(dataObj)
  }
  return obj.data;
}

var createUsaCountyGeoData = function(json) {
  const {
    message
  } = json || {};
  var obj = {};
  const data = message;

  obj.data = {};
  obj.data.type = 'FeatureCollection';
  obj.data.features = [];
  for (var i = 0; i < data.length; i++) {
    var currentDataObj = data[i];
    var dataObj = {};

    dataObj.type = 'Feature';
    dataObj.properties = {};
    dataObj.properties.county_name = currentDataObj.county_name;
    dataObj.properties.state_name = currentDataObj.state_name;
    dataObj.properties.confirmed = currentDataObj.confirmed;
    dataObj.properties.death = currentDataObj.death;
    dataObj.properties.fatality_rate = currentDataObj.fatality_rate;
    dataObj.properties.color = getColorForStatesCounty(currentDataObj.fatality_rate).colorName;


    dataObj.geometry = {};
    dataObj.geometry.type = 'Point';
    dataObj.geometry.coordinates = [];

    dataObj.geometry.coordinates.push(currentDataObj.longitude);
    dataObj.geometry.coordinates.push(currentDataObj.latitude);

    obj.data.features.push(dataObj)
  }
  return obj.data;
}

var debounce = function(fn, delay) {
  var timeout;
  return function(args) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn(args);
    }, delay);
  }
}

var searchMyLocationOnMap = function(targetLocation, map, marker, zoom) {
  map.flyTo({
    center: targetLocation,
    zoom: zoom || 5,
    bearing: 0,

    speed: 0.7,
    curve: 1,

    easing: function(t) {
      return t;
    },

    essential: true
  });

  if (marker && marker.togglePopup) {
    setTimeout(() => {
      marker.togglePopup();
    }, 2000)
  }
}

var addEventListeners = function(myMap) {
  const myinput = document.getElementById('input_box');
  myinput.addEventListener('keyup', debounce((e) => {
    const targetLocationArray = store.cordinatesMapping[(e.target.value).toLowerCase()];
    const markerRetrived = store.pins[(e.target.value).toLowerCase()];
    if (targetLocationArray) {
      searchMyLocationOnMap(targetLocationArray, myMap, markerRetrived);
    }
  }, 2000));
}

var loadMain = function(myMap) {
  FetchApisModule().fetchApi(API.LIVE_DATA, 'liveData')
    .then(json => {
      const {
        maxcount,
        totalCount,
        cordinatesMapping
      } = plotPinsOnMap(myMap, json);
      circleLayer(myMap, json, maxcount);
    })
}

var circleLayer = function(myMap, json, maxcount) {
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

var getColor = function(count, maxcount) {
  const percentage = ((count / maxcount) * 100);
  let color, colorName;
  if (percentage > 50) {
    color = '#701d07'; // red
    colorName = 'red';
  } else if (percentage < 50 && percentage > 10) {
    color = '#bb2124' // ornage
    colorName = 'orange';
  } else if (percentage < 10 && percentage > 1) {
    color = '#886308' //'yellow'
    colorName = 'yellow';
  } else {
    color = '#001e00' // green
    colorName = 'green';
  }

  return {
    color,
    percentage,
    colorName
  };
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

    const percentOfCases = (data[i].confirmed / maxcount) * 100;

    if (maxPercent < percentOfCases) {
      maxPercent = percentOfCases;
    }


    var dataObj = {};

    dataObj.type = 'Feature';
    dataObj.properties = {};
    dataObj.properties.description = 'sample';
    dataObj.properties.icon = 'theatre';
    dataObj.properties.percentOfOverallCases = percentOfCases / 2; // max radius 50

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
  mapboxgl.accessToken = 'pk.eyJ1IjoicmF0YW5rYWRhbSIsImEiOiJja2IwNGpjNTAwNTI2MzBwbXZ0azhpeGN1In0.8MUvb6rac9jyNdwwt7064A';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    pitch: 0,
    // bearing: -10,
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
  const cordinatesMapping = {};

  for (var i = 0; i < data.length; i++) {
    if (data[i].confirmed > maxcount) {
      maxcount = data[i].confirmed;
      totalCount = totalCount + data[i].confirmed;
    }
    cordinatesMapping[(data[i].location).toLowerCase()] = [data[i].longitude, data[i].latitude];
  }

  for (var i = 0; i < data.length; i++) {
    const {
      color,
      percentage,
      colorName
    } = getColor(data[i].confirmed, totalCount);
    const options = {
      color: color,
    }

    var m = new mapboxgl.Marker(options)
      .setLngLat([data[i].longitude, data[i].latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`<div class="tooltip-${colorName}"><strong><span class="push-5-l push-5">${data[i].location}</span></strong> <br> <span class="push-5-l push-5">Cases ${percentage.toFixed(2)} % of world wide cases</span><br> <span class="push-5-l push-5"> Confirmed: ${data[i].confirmed} </span> <br><span class="push-5-l push-5"> Deaths: ${data[i].dead} </span><br> <span class="push-5-l push-5"> Recovered: ${data[i].recovered}</span></div>`))

    if ((data[i].location).toLowerCase() !== "togo") {
      m.addTo(map); /* api have wrong location for togo */
      store.pins[(data[i].location).toLowerCase()] = m;
    }


    (function(marketElement) {
      marketElement.getElement().addEventListener('mouseenter', () => {
        marketElement.togglePopup()
      })

      marketElement.getElement().addEventListener('mouseleave', () => {
        marketElement.togglePopup()
      })
    })(m);

  }

  store.cordinatesMapping = cordinatesMapping;

  return {
    maxcount,
    totalCount,
  };
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

var getColorForStatesCounty = function(fatality) {
  const fatality_rate = Number(fatality.split('%')[0]);
  let color, colorName;
  if (fatality_rate > 7) {
    color = '#701d07'; // red
    colorName = 'red';
  } else if (fatality_rate < 7 && fatality_rate > 3) {
    color = '#bb2124' // orange
    colorName = 'orange';
  } else if (fatality_rate < 3 && fatality_rate > 1) {
    color = '#886308' //'yellow'
    colorName = 'yellow';
  } else {
    color = '#001e00' // green
    colorName = 'green';
  }

  return {
    color,
    colorName
  };
}

var getColorForIndiaStates = function(deathCount) {
  let color, colorName;
  if (deathCount > 15000) {
    color = '#701d07'; // red
    colorName = 'red';
  } else if (deathCount < 15000 && deathCount > 10000) {
    color = '#bb2124' // orange
    colorName = 'orange';
  } else if (deathCount < 10000 && deathCount > 5000) {
    color = '#886308' //'yellow'
    colorName = 'yellow';
  } else {
    color = '#001e00' // green
    colorName = 'green';
  }

  return {
    color,
    colorName
  };
}

function circleLayerPopup(myMap) {
  var popup = new mapboxgl.Popup();
  myMap.on('mouseenter', 'usaCounty', function(e) {
    myMap.getCanvas().style.cursor = 'pointer';


    var coordinates = e.features[0].geometry.coordinates.slice();
    var countyName = e.features[0].properties.county_name;
    var stateName = e.features[0].properties.state_name;
    var fatality_rate = e.features[0].properties.fatality_rate;
    var confirmed = e.features[0].properties.confirmed;
    var death = e.features[0].properties.death;



    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const {
      colorName
    } = getColorForStatesCounty(fatality_rate);

    popup
      .setLngLat(coordinates)
      .setHTML(`<div class="tooltip-${colorName}"><strong>${stateName}</strong>
        <br>County: ${countyName}
        <br>cases: ${confirmed}
        <br>deaths: ${death}
        <br>fatality_rate: ${fatality_rate}
        </div>`)
      .addTo(myMap);
  });

  myMap.on('mouseleave', 'usaCounty', function() {
    myMap.getCanvas().style.cursor = '';
    popup.remove();
  });
}

function circleLayerPopupIndia(myMap) {
  var popup = new mapboxgl.Popup();
  myMap.on('mouseenter', 'indiaStates', function(e) {
    myMap.getCanvas().style.cursor = 'pointer';


    var coordinates = e.features[0].geometry.coordinates.slice();
    var stateName = e.features[0].properties.name;
    var total = e.features[0].properties.total;
    var confirmed = e.features[0].properties.confirmed;
    var death = e.features[0].properties.death;



    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const {
      colorName
    } = getColorForIndiaStates(total);

    popup
      .setLngLat(coordinates)
      .setHTML(`<div class="tooltip-${colorName}"><strong>${stateName}</strong>
        <br>cases: ${total}
        <br>deaths: ${death}
        </div>`)
      .addTo(myMap);
  });

  myMap.on('mouseleave', 'indiaStates', function() {
    myMap.getCanvas().style.cursor = '';
    popup.remove();
  });
}
