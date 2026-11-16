import fs from 'node:fs'
import path from 'node:path'
import {
  createPrivateTransport,
  ANTIGRAVITY_STREAM_ENDPOINT,
  buildAntigravityGeneratePayload,
} from '../lib/index.js'
import { ANTIGRAVITY_CLIENT_ID, ANTIGRAVITY_CLIENT_SECRET } from '@cortexkit/antigravity-auth-core'

const optionsData = JSON.parse(fs.readFileSync('./scripts/exact-options.json', 'utf8'))
const accountsPath = path.join(process.env.LOCALAPPDATA, 'dsh-tool-antigravity', 'accounts.json')
const pool = JSON.parse(fs.readFileSync(accountsPath, 'utf8'))
const acc = pool.accounts[0]

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
const accessToken = tokenJson.access_token

const payload = buildAntigravityGeneratePayload(
  {
    model: optionsData.config.model,
    reasoningEffort: optionsData.config.reasoningEffort,
    messages: optionsData.messages,
    tools: optionsData.tools,
  },
  { projectId: acc.projectId, lineage: acc.lineage }
)

const transport = createPrivateTransport()
console.log('Sending via createPrivateTransport()...')
const res = await transport.request({
  url: ANTIGRAVITY_STREAM_ENDPOINT,
  accessToken,
  body: JSON.stringify(payload),
})

console.log('Status:', res.status)
const text = await res.text()
console.log('Body prefix:', text.slice(0, 300))
