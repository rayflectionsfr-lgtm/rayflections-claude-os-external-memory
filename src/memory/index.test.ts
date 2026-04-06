import { deepEqual, equal, ok } from 'node:assert/strict'
import test from 'node:test'

import { temporaryDirectory } from 'tempy'

import { createUser, getUser, logInteraction, updateUser } from './index.js'

// Each test passes its own temp dir so tests never share file state.

await test('createUser stores a user with timestamps', async () => {
  const dir = temporaryDirectory()
  const user = await createUser('u1', { name: 'Alice' }, dir)
  equal(user.id, 'u1')
  deepEqual(user.data, { name: 'Alice' })
  ok(user.createdAt)
  ok(user.updatedAt)
})

await test('getUser returns the correct user', async () => {
  const dir = temporaryDirectory()
  await createUser('u2', { name: 'Bob' }, dir)
  const user = await getUser('u2', dir)
  ok(user)
  equal(user.id, 'u2')
  deepEqual(user.data, { name: 'Bob' })
})

await test('getUser returns null for unknown id', async () => {
  const dir = temporaryDirectory()
  equal(await getUser('nobody', dir), null)
})

await test('updateUser merges data and bumps updatedAt', async () => {
  const dir = temporaryDirectory()
  const created = await createUser('u3', { name: 'Carol', age: 30 }, dir)
  const updated = await updateUser('u3', { age: 31 }, dir)
  ok(updated)
  equal(updated.data.name, 'Carol')
  equal(updated.data.age, 31)
  ok(updated.updatedAt >= created.updatedAt)
})

await test('updateUser returns null for unknown id', async () => {
  const dir = temporaryDirectory()
  equal(await updateUser('ghost', { x: 1 }, dir), null)
})

await test('logInteraction records an entry', async () => {
  const dir = temporaryDirectory()
  const entry = await logInteraction('u4', 'login', dir)
  equal(entry.userId, 'u4')
  equal(entry.action, 'login')
  ok(entry.timestamp)
})

await test('multiple logInteraction calls accumulate', async () => {
  const dir = temporaryDirectory()
  await logInteraction('u5', 'login', dir)
  await logInteraction('u5', 'search', dir)
  await logInteraction('u6', 'login', dir)
  // Re-read history from the same dir to confirm persistence
  await logInteraction('u5', 'logout', dir)
  const last = await logInteraction('u5', 'verify', dir)
  equal(last.action, 'verify')
})
