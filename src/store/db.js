import localforage from 'localforage'

const stores = {
  settings: localforage.createInstance({ name: 'LevensApp', storeName: 'settings' }),
  metingen: localforage.createInstance({ name: 'LevensApp', storeName: 'metingen' }),
  sport: localforage.createInstance({ name: 'LevensApp', storeName: 'sport' }),
  lezen: localforage.createInstance({ name: 'LevensApp', storeName: 'lezen' }),
  taken: localforage.createInstance({ name: 'LevensApp', storeName: 'taken' }),
}

export async function getAll(store) {
  const result = []
  await stores[store].iterate((value) => { result.push(value) })
  return result
}

export async function getItem(store, key) {
  return stores[store].getItem(key)
}

export async function setItem(store, key, value) {
  return stores[store].setItem(key, value)
}

export async function removeItem(store, key) {
  return stores[store].removeItem(key)
}

export async function getSetting(key) {
  return stores.settings.getItem(key)
}

export async function setSetting(key, value) {
  return stores.settings.setItem(key, value)
}
