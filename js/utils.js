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
