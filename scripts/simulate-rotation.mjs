import { createAntigravityAuthService } from '../lib/index.js'
import fs from 'node:fs'
import path from 'node:path'

const p = path.join(process.env.LOCALAPPDATA, 'dsh-tool-antigravity', 'accounts.json')
const data = JSON.parse(fs.readFileSync(p, 'utf8'))

const service = createAntigravityAuthService()

console.log('--- Initial State ---')
console.log('Pool active index:', data.activeIndex)
console.log('Gemini active index:', data.activeIndexByFamily?.gemini)

// Account 0
const lineage0 = data.accounts[0].lineage
const lineage1 = data.accounts[1].lineage
const lineage2 = data.accounts[2].lineage

console.log('\n--- Step 1: Rotate Account 0 ---')
const res0 = await service.rotateOnFailure({ status: 429, family: 'gemini', message: 'rate-limited', lineage: lineage0 })
console.log('Rotate 0 result:', res0)

const after0 = JSON.parse(fs.readFileSync(p, 'utf8'))
console.log('After 0, cooling:', after0.accounts.map(a => Boolean(a.cooldownUntil && a.cooldownUntil > Date.now())))
console.log('After 0, gemini index:', after0.activeIndexByFamily?.gemini)

console.log('\n--- Step 2: Rotate Account 1 ---')
const res1 = await service.rotateOnFailure({ status: 429, family: 'gemini', message: 'rate-limited', lineage: lineage1 })
console.log('Rotate 1 result:', res1)

const after1 = JSON.parse(fs.readFileSync(p, 'utf8'))
console.log('After 1, cooling:', after1.accounts.map(a => Boolean(a.cooldownUntil && a.cooldownUntil > Date.now())))
console.log('After 1, gemini index:', after1.activeIndexByFamily?.gemini)

console.log('\n--- Step 3: Rotate Account 2 ---')
const res2 = await service.rotateOnFailure({ status: 429, family: 'gemini', message: 'rate-limited', lineage: lineage2 })
console.log('Rotate 2 result:', res2)

const after2 = JSON.parse(fs.readFileSync(p, 'utf8'))
console.log('After 2, cooling:', after2.accounts.map(a => Boolean(a.cooldownUntil && a.cooldownUntil > Date.now())))
console.log('After 2, gemini index:', after2.activeIndexByFamily?.gemini)

// Restore
for (const acc of data.accounts) {
  delete acc.cooldownUntil
  delete acc.consecutiveFailures
  delete acc.lastFailureAt
}
fs.writeFileSync(p, JSON.stringify(data, null, 2))
console.log('\nRestored accounts.json')
