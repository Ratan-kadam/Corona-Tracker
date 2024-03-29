import {
  API,
  COLORS,
  COLORS_CSS_CLASS
} from './constants.js';
import {
  FetchApisModule,
  createLayerGeoData,
  flyMeToLocation,
  searchMyLocationOnMap,
  divOnclick,
  showLoader,
  showError,
  clearError
} from './utils.js';
import {
  store
} from './store.js';
import {
  country
} from '../sample_data/countryapi.js';

export const loadMain = function(myMap) {
  FetchApisModule().fetchApi(API.LIVE_DATA, 'liveData')
    .then(json => {
      const {
        maxcount,
        totalCount,
        cordinatesMapping
      } = plotPinsOnMap(myMap, json);
      loadQuickJump(myMap);
      circleLayer(myMap, json, maxcount);
    })
}

var loadQuickJump = function(myMap) {
  const leftPanel = true;
  let quickJumpComponent = document.getElementById('quickJump');
  quickJump.innerHTML = "";
  const countries = Object.keys(store.cordinatesMapping).sort();
  countries.map(country => {
    const newOptionDiv = document.createElement('div');
    newOptionDiv.classList.add('country');
    const newTextNode = document.createTextNode(country);
    newOptionDiv.appendChild(newTextNode);
    quickJumpComponent.appendChild(newOptionDiv);
    ((country) => {
      newOptionDiv.onclick = divOnclick.bind(this, country, myMap, 'd', leftPanel, 3);
    })(country);
  })
}

var plotPinsOnMap = function(map, json) {
  let {
    data
  } = json || {};
  let maxcount = 0;
  let totalCount = 0;
  const cordinatesMapping = {};

  if (!data) {
    showError(`Error while loading latest data.
      <br>
      Please clear browser cache and try again !!. `);
    data = country.data; //fallback in case of error
  } else {
    clearError();
  }


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

var getColor = function(count, maxcount) {
  const percentage = ((count / maxcount) * 100);
  let color, colorName;
  if (percentage > 50) {
    color = COLORS.RED;
    colorName = COLORS_CSS_CLASS.RED;
  } else if (percentage < 50 && percentage > 10) {
    color = COLORS.ORANGE;
    colorName = COLORS_CSS_CLASS.ORANGE;
  } else if (percentage < 10 && percentage > 1) {
    color = COLORS.YELLOW;
    colorName = COLORS_CSS_CLASS.YELLOW;
  } else {
    color = COLORS.LIGHT_GREEN;
    colorName = COLORS_CSS_CLASS.GREEN;
  }

  return {
    color,
    percentage,
    colorName
  };
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
      'circle-color': COLORS.YELLOW,
      'circle-stroke-color': COLORS.WHITE,
      'circle-stroke-opacity': 0.2,
      'circle-stroke-width': 0.1,
      'circle-opacity': 0.2
    }
  })
}

export const initMaps = function() {
 // mapboxgl.accessToken = 'pk.eyJ1IjoicmF0YW5rYWRhbSIsImEiOiJja2IwNGpjNTAwNTI2MzBwbXZ0azhpeGN1In0.8MUvb6rac9jyNdwwt7064A';
  mapboxgl.accessToken= 'pk.eyJ1IjoicmF0YW5rYWRhbSIsImEiOiJjbGQ0eGp5bjcwMGo2M3BtdjZqNml2dGhuIn0.tOAGq2lfb-6ACrkLJWxCUg'
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    pitch: 0,
    maxZoom: 4,
    zoom: 3,
  });

  var nav = new mapboxgl.NavigationControl();
  map.addControl(nav, 'top-right');

  return map;
}
