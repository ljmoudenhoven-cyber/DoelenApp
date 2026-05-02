import localforage from 'localforage'
import { pushItem, pushDelete } from './sync'

const stores = {
  settings: localforage.createInstance({ name: 'DoelenApp', storeName: 'settings' }),
  metingen: localforage.createInstance({ name: 'DoelenApp', storeName: 'metingen' }),
  sport: localforage.createInstance({ name: 'DoelenApp', storeName: 'sport' }),
  lezen: localforage.createInstance({ name: 'DoelenApp', storeName: 'lezen' }),
  taken: localforage.createInstance({ name: 'DoelenApp', storeName: 'taken' }),
  healthcheck: localforage.createInstance({ name: 'DoelenApp', storeName: 'healthcheck' }),
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
  await stores[store].setItem(key, value)
  pushItem(store, key, value)
  return value
}

export async function removeItem(store, key) {
  await stores[store].removeItem(key)
  pushDelete(store, key)
}

export async function getSetting(key) {
  return stores.settings.getItem(key)
}

export async function setSetting(key, value) {
  await stores.settings.setItem(key, value)
  pushItem('settings', key, value)
  return value
}
