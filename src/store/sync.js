import { supabase } from './supabase'
import localforage from 'localforage'

const STORES = ['settings', 'metingen', 'sport', 'lezen', 'taken']

const queueStore = localforage.createInstance({ name: 'DoelenApp', storeName: '_pendingSync' })

function rawStore(store) {
  return localforage.createInstance({ name: 'DoelenApp', storeName: store })
}

async function huidigeUserId() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

export async function pullAll() {
  const userId = await huidigeUserId()
  if (!userId) return

  const { data, error } = await supabase
    .from('user_data')
    .select('store, key, value, deleted')
    .eq('user_id', userId)

  if (error) {
    console.error('pullAll error', error)
    return
  }

  const remoteByStore = {}
  for (const store of STORES) remoteByStore[store] = new Map()
  for (const rij of data || []) {
    if (!remoteByStore[rij.store]) continue
    remoteByStore[rij.store].set(rij.key, rij)
  }

  for (const store of STORES) {
    const lokaal = rawStore(store)
    const lokalKeys = await lokaal.keys()
    const remote = remoteByStore[store]

    for (const [key, rij] of remote) {
      if (rij.deleted) {
        await lokaal.removeItem(key)
      } else {
        await lokaal.setItem(key, rij.value)
      }
    }

    for (const key of lokalKeys) {
      if (!remote.has(key)) {
        const value = await lokaal.getItem(key)
        if (value != null) {
          await enqueue({ store, key, value, deleted: false })
        }
      }
    }
  }

  await flushQueue()
}

async function enqueue(job) {
  const id = `${job.store}:${job.key}:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await queueStore.setItem(id, { ...job, ts: new Date().toISOString() })
}

async function flushQueue() {
  const userId = await huidigeUserId()
  if (!userId || !navigator.onLine) return

  const ids = await queueStore.keys()
  for (const id of ids) {
    const job = await queueStore.getItem(id)
    if (!job) continue
    const ok = await pushDirect(userId, job)
    if (ok) await queueStore.removeItem(id)
  }
}

async function pushDirect(userId, job) {
  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        store: job.store,
        key: job.key,
        value: job.value,
        deleted: job.deleted ?? false,
        bewerkt_op: new Date().toISOString(),
      }, { onConflict: 'user_id,store,key' })
    if (error) {
      console.error('pushDirect error', error)
      return false
    }
    return true
  } catch (e) {
    console.error('pushDirect exception', e)
    return false
  }
}

export async function pushItem(store, key, value) {
  const userId = await huidigeUserId()
  if (!userId) return
  const job = { store, key, value, deleted: false }
  if (navigator.onLine) {
    const ok = await pushDirect(userId, job)
    if (!ok) await enqueue(job)
  } else {
    await enqueue(job)
  }
}

export async function pushDelete(store, key) {
  const userId = await huidigeUserId()
  if (!userId) return
  const job = { store, key, value: null, deleted: true }
  if (navigator.onLine) {
    const ok = await pushDirect(userId, job)
    if (!ok) await enqueue(job)
  } else {
    await enqueue(job)
  }
}

export async function clearLocalData() {
  for (const store of STORES) {
    await rawStore(store).clear()
  }
  await queueStore.clear()
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushQueue() })
}
