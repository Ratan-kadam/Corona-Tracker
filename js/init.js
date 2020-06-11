import {
  FetchApisModule,
  searchMyLocationOnMap,
  debounce,
  addEventListeners
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
import {
  selfLocate
} from './selfLocate.js';
import {
  loadMain,
  initMaps
} from './mainLoader.js';
import {
  loadIndiaStats
} from './loadIndiaStats.js';
import {
  loadUsaStats
} from './loadUsaStats.js';

document.addEventListener("DOMContentLoaded", function() {
  const myMap = initMaps();
  selfLocate.bind(this);
  myMap.on('load', function() {
    addEventListeners(myMap, store.cordinatesMapping);
    selfLocate(myMap);
    loadMain(myMap);
    loadUsaStats(myMap);
    loadIndiaStats(myMap);
  });
})
