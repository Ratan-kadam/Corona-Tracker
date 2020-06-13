import {
  API,
  COLORS,
  COLORS_CSS_CLASS
} from './constants.js';
import {
  FetchApisModule,
  showError
} from './utils.js';

export const loadUsaStats = function(myMap) {
  FetchApisModule().fetchApi(API.USA_DATA, 'india_states')
    .then(json => {
      circleLayerUsa(myMap, json);
      circleLayerPopup(myMap);
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
      'circle-stroke-color': COLORS.WHITE,
      'circle-stroke-opacity': 1,
      'circle-stroke-width': 0.2,
      'circle-opacity': 1
    }
  })
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

var createUsaCountyGeoData = function(json) {
  const {
    message
  } = json || {};
  var obj = {};
  const data = message;

  if (!data) {
    showError();
  }

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

var getColorForStatesCounty = function(fatality) {
  const fatality_rate = Number(fatality.split('%')[0]);
  let color, colorName;
  if (fatality_rate > 7) {
    color = COLORS.RED;
    colorName = COLORS_CSS_CLASS.RED;
  } else if (fatality_rate < 7 && fatality_rate > 3) {
    color = COLORS.ORANGE;
    colorName = COLORS_CSS_CLASS.ORANGE;
  } else if (fatality_rate < 3 && fatality_rate > 1) {
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
