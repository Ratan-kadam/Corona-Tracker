import { store } from './store.js';

export function FetchApisModule(moduleName) {
  var name = moduleName || 'myModule';

  function fetchApi(url, storeKey) {
    return fetch(url)
    .then(response => response.json())
    .then(json => {
      if (!store[storeKey]) {
        store[storeKey] = {};
      }
      store[storeKey].values = json;
      return json;
     })
    .catch(err => console.log(err))
  }
  return {
    fetchApi: fetchApi,
  }
};


export const createLayerGeoData = function(json, maxcount) {
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

export const searchMyLocationOnMap = function(targetLocation, map, marker, zoom) {
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

export const debounce = function(fn, delay) {
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

export const addEventListeners = function(myMap) {
  const myinput = document.getElementById('input_box');
  myinput.addEventListener('keyup', debounce((e) => {
    const targetLocationArray = store.cordinatesMapping[(e.target.value).toLowerCase()];
    const markerRetrived = store.pins[(e.target.value).toLowerCase()];
    if (targetLocationArray) {
      searchMyLocationOnMap(targetLocationArray, myMap, markerRetrived);
    }
  }, 2000));
}
