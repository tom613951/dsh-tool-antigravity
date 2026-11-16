import fs from 'node:fs'
import path from 'node:path'
import {
  ANTIGRAVITY_STREAM_ENDPOINT,
  buildAntigravityGeneratePayload,
} from '../lib/index.js'
import { ANTIGRAVITY_CLIENT_ID, ANTIGRAVITY_CLIENT_SECRET } from '@cortexkit/antigravity-auth-core'

const optionsData = JSON.parse(fs.readFileSync('./scripts/exact-options.json', 'utf8'))
const accountsPath = path.join(process.env.LOCALAPPDATA, 'dsh-tool-antigravity', 'accounts.json')
const pool = JSON.parse(fs.readFileSync(accountsPath, 'utf8'))

const getAccessToken = async (acc) => {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: ANTIGRAVITY_CLIENT_ID,
      client_secret: ANTIGRAVITY_CLIENT_SECRET,
      refresh_token: acc.refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const tokenJson = await tokenRes.json()
  return tokenJson.access_token
}

const sendReq = async (name, acc, token, options) => {
  const payload = buildAntigravityGeneratePayload(
    options,
    { projectId: acc.projectId, lineage: acc.lineage }
  )
  console.log(`[${name}] Sending on account ${acc.email}...`)
  const start = Date.now()
  const res = await fetch(ANTIGRAVITY_STREAM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'antigravity/cli/1.1.24 (windows; x64)',
    },
    body: JSON.stringify(payload),
  })
  console.log(`[${name}] status: ${res.status} (${Date.now() - start}ms)`)
  const text = await res.text()
  console.log(`[${name}] body snippet:`, text.slice(0, 300))
  return res.status
}

const titleOptions = {
  model: 'antigravity-gemini-3.8-flash',
  messages: [{ role: 'user', content: [{ type: 'text', text: 'Generate session title from: 你目前环境调用的是pw7还是pw5' }] }],
}

const mainOptions = {
  model: 'antigravity-gemini-3.8-flash',
  reasoningEffort: 'high',
  messages: optionsData.messages,
  tools: optionsData.tools,
}

// Test concurrent on SAME account (Account 0)
const token0 = await getAccessToken(pool.accounts[0])
console.log('--- Test 1: Title and Turn on SAME account (Account 0) ---')
await Promise.all([
  sendReq('Title-Same', pool.accounts[0], token0, titleOptions),
  sendReq('Turn-Same', pool.accounts[0], token0, mainOptions),
])
