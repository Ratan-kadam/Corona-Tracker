import {
  API,
  COLORS,
  COLORS_CSS_CLASS
} from './constants.js';
import {
  FetchApisModule,
  removeLoader
} from './utils.js';
import {
  INDIA_STATES_CORDINATES
} from './static_data/static_data.js';

export const loadIndiaStats = function(myMap, spinnerComponent) {
  FetchApisModule().fetchApi(API.INDIA_DATA, 'usa_states')
    .then(json => {
      circleLayerIndia(myMap, json);
      circleLayerPopupIndia(myMap);
      setTimeout(() => {
        removeLoader();
      }, 5000);
    })
}

const circleLayerIndia = function(myMap, json) {
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
    'circle-radius': {
      stops: [
      [5, 25],
      [10, 40]
    ],
      base: 2
    },
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

var getColorForIndiaStates = function(deathCount) {
  let color, colorName;
  if (deathCount > 15000) {
    color = COLORS.RED;
    colorName = COLORS_CSS_CLASS.RED;
  } else if (deathCount < 15000 && deathCount > 10000) {
    color = COLORS.ORANGE;
    colorName = COLORS_CSS_CLASS.ORANGE;
  } else if (deathCount < 10000 && deathCount > 5000) {
    color = COLORS.YELLOW;
    colorName = COLORS_CSS_CLASS.YELLOW;
  } else {
    color = COLORS.GREEN;
    colorName = COLORS_CSS_CLASS.GREEN;
  }

  return {
    color,
    colorName
  };
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
