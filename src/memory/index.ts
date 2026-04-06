import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { JSONFile } from '../adapters/node/JSONFile.js'
import { Low } from '../core/Low.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Default memory folder, two levels up from lib/memory/ (or src/memory/)
export const MEMORY_DIR = path.resolve(__dirname, '../../memory')

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Interaction {
  userId: string
  action: string
  timestamp: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openDb<T>(file: string, defaultData: T): Promise<Low<T>> {
  const db = new Low(new JSONFile<T>(file), defaultData)
  await db.read()
  return db
}

function usersFile(dir: string) {
  return path.join(dir, 'users.json')
}

function historyFile(dir: string) {
  return path.join(dir, 'history.json')
}

// ─── Core functions ───────────────────────────────────────────────────────────

export async function createUser(
  id: string,
  data: Record<string, unknown>,
  dir = MEMORY_DIR,
): Promise<User> {
  const db = await openDb(usersFile(dir), { users: [] as User[] })
  const now = new Date().toISOString()
  const user: User = { id, data, createdAt: now, updatedAt: now }
  await db.update(({ users }) => users.push(user))
  return user
}

export async function getUser(
  id: string,
  dir = MEMORY_DIR,
): Promise<User | null> {
  const db = await openDb(usersFile(dir), { users: [] as User[] })
  return db.data.users.find((u) => u.id === id) ?? null
}

export async function updateUser(
  id: string,
  data: Record<string, unknown>,
  dir = MEMORY_DIR,
): Promise<User | null> {
  const db = await openDb(usersFile(dir), { users: [] as User[] })
  const user = db.data.users.find((u) => u.id === id)
  if (!user) return null
  user.data = { ...user.data, ...data }
  user.updatedAt = new Date().toISOString()
  await db.write()
  return user
}

export async function logInteraction(
  userId: string,
  action: string,
  dir = MEMORY_DIR,
): Promise<Interaction> {
  const db = await openDb(historyFile(dir), {
    interactions: [] as Interaction[],
  })
  const interaction: Interaction = {
    userId,
    action,
    timestamp: new Date().toISOString(),
  }
  await db.update(({ interactions }) => interactions.push(interaction))
  return interaction
}
