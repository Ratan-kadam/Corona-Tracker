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

export const flyMeToLocation = function (location, myMap) {
  const targetLocationArray = store.cordinatesMapping[location.toLowerCase()];
  const markerRetrived = store.pins[(location).toLowerCase()];
  if (targetLocationArray) {
    searchMyLocationOnMap(targetLocationArray, myMap, markerRetrived);
  }
}

export const addEventListeners = function(myMap) {
  const myinput = document.getElementById('input_box');
  myinput.addEventListener('keyup', debounce((e) => {
    populateDatalistOptions(e.target.value, myMap);
    flyMeToLocation(e.target.value, myMap);
  }, 500));
}


export const divOnclick = function(location, myMap, d ,leftPanel, zoom) {
  let inputBox = document.getElementById('input_box')
  let datalistComponent = document.getElementById('dropdownBox');
  datalistComponent.innerHTML = ''; // selection done clearing out displays
  if (leftPanel) {
    inputBox.value = "";
  } else {
    inputBox.value  = location;
  }
  const targetLocationArray = store.cordinatesMapping[(location).toLowerCase()];
  const markerRetrived = store.pins[(location).toLowerCase()];
  if (targetLocationArray) {
    searchMyLocationOnMap(targetLocationArray, myMap, markerRetrived, zoom);
  }
}

var populateDatalistOptions = function (inputString, map) {
  let datalistComponent = document.getElementById('dropdownBox');
  datalistComponent.innerHTML = ''; // clearing out the old list
  if (!inputString) {
    return;
  }
  const regex = new RegExp(`^${inputString}`, 'ig');
  const fitlteredArray = Object.keys(store.cordinatesMapping).filter(country => {
    return country.match(regex);
  });

  if (fitlteredArray.length == 1 && inputString == fitlteredArray[0]) {
    return;
  }

  for (var i=0; i < fitlteredArray.length; i++) {
    const newOptionDiv = document.createElement('div');
    newOptionDiv.classList.add('country');
      const newTextNode = document.createTextNode(fitlteredArray[i]);
      newOptionDiv.appendChild(newTextNode);
      datalistComponent.appendChild(newOptionDiv);
      newOptionDiv.onclick = divOnclick.bind(this, fitlteredArray[i], map);
  }
}
