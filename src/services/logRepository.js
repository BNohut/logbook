import { openDB } from 'idb'

const DB_NAME = 'logbook-db'
const DB_VERSION = 1
const STORE_NAME = 'entries'

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('date', 'date')
          store.createIndex('createdAt', 'createdAt')
        }
      },
    })
  }
  return dbPromise
}

function monthDateRange(year, month) {
  const mm = String(month).padStart(2, '0')
  const start = `${year}-${mm}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

/**
 * @param {{ text: string, date: string, quantity: number }} entry
 */
export async function addEntry({ text, date, quantity }) {
  const db = await getDb()
  const record = {
    id: crypto.randomUUID(),
    text: text.trim(),
    date,
    quantity,
    createdAt: Date.now(),
  }
  await db.add(STORE_NAME, record)
  return record
}

/**
 * @param {number} year
 * @param {number} month 1-12
 */
export async function getEntriesByMonth(year, month) {
  const db = await getDb()
  const { start, end } = monthDateRange(year, month)
  const tx = db.transaction(STORE_NAME, 'readonly')
  const index = tx.store.index('date')
  const entries = await index.getAll(IDBKeyRange.bound(start, end))
  await tx.done

  return entries.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.createdAt - b.createdAt
  })
}

export async function getAllEntries() {
  const db = await getDb()
  const entries = await db.getAll(STORE_NAME)
  return entries.sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * Unique product names from saved entries, optionally filtered by query.
 * @param {string} [query]
 * @param {number} [limit]
 * @returns {Promise<string[]>}
 */
export async function getProductNameSuggestions(query = '', limit = 20) {
  const db = await getDb()
  const entries = await db.getAll(STORE_NAME)
  const names = new Set()
  const normalizedQuery = query.trim().toLocaleLowerCase('tr')

  for (const entry of entries) {
    const name = entry.text?.trim()
    if (!name) continue
    if (!normalizedQuery || name.toLocaleLowerCase('tr').includes(normalizedQuery)) {
      names.add(name)
    }
  }

  return [...names]
    .sort((a, b) => a.localeCompare(b, 'tr'))
    .slice(0, limit)
}

/**
 * @param {string} dateStr YYYY-MM-DD
 */
export async function getEntriesByDate(dateStr) {
  const db = await getDb()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const index = tx.store.index('date')
  const entries = await index.getAll(dateStr)
  await tx.done
  return entries.sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * @param {number} year
 */
export async function getEntriesByYear(year) {
  const db = await getDb()
  const start = `${year}-01-01`
  const end = `${year}-12-31`
  const tx = db.transaction(STORE_NAME, 'readonly')
  const index = tx.store.index('date')
  const entries = await index.getAll(IDBKeyRange.bound(start, end))
  await tx.done
  return entries.sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * Distinct years from entry dates, newest first.
 * @returns {Promise<number[]>}
 */
export async function getAvailableYears() {
  const db = await getDb()
  const entries = await db.getAll(STORE_NAME)
  const years = new Set()

  for (const entry of entries) {
    const year = Number(entry.date?.slice(0, 4))
    if (!Number.isNaN(year) && year > 0) years.add(year)
  }

  return [...years].sort((a, b) => b - a)
}

/**
 * Entry counts grouped by entry date month (YYYY-MM), newest first.
 * @returns {Promise<Array<{ monthKey: string, year: number, month: number, count: number, totalQuantity: number }>>}
 */
export async function getMonthlyCounts() {
  const db = await getDb()
  const entries = await db.getAll(STORE_NAME)
  const byMonth = new Map()

  for (const entry of entries) {
    const monthKey = entry.date.slice(0, 7)
    const current = byMonth.get(monthKey) ?? {
      year: Number(monthKey.slice(0, 4)),
      month: Number(monthKey.slice(5, 7)),
      count: 0,
      totalQuantity: 0,
    }
    current.count += 1
    current.totalQuantity += entry.quantity
    byMonth.set(monthKey, current)
  }

  return [...byMonth.entries()]
    .map(([monthKey, data]) => ({
      monthKey,
      year: data.year,
      month: data.month,
      count: data.count,
      totalQuantity: data.totalQuantity,
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}

export async function updateEntry(id, { text, date, quantity }) {
  const db = await getDb()
  const existing = await db.get(STORE_NAME, id)
  if (!existing) {
    throw new Error('Entry not found')
  }

  const record = {
    ...existing,
    text: text.trim(),
    date,
    quantity,
  }
  await db.put(STORE_NAME, record)
  return record
}
