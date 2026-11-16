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

const generateOptions = {
  model: optionsData.config.model,
  reasoningEffort: optionsData.config.reasoningEffort,
  messages: optionsData.messages,
  tools: optionsData.tools,
}

for (let i = 0; i < pool.accounts.length; i++) {
  const acc = pool.accounts[i]
  console.log(`\n================ Testing Account [${i}] ${acc.email} ================`)
  
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
    generateOptions,
    { projectId: acc.projectId, lineage: acc.lineage }
  )

  const bodyStr = JSON.stringify(payload)
  console.log(`Payload string length: ${bodyStr.length} chars, tools in payload: ${payload.request?.tools?.[0]?.functionDeclarations?.length}`)

  const start = Date.now()
  const res = await fetch(ANTIGRAVITY_STREAM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'antigravity/cli/1.1.24 (windows; x64)',
    },
    body: bodyStr,
  })

  console.log(`HTTP status: ${res.status} (${Date.now() - start}ms)`)
  const text = await res.text()
  console.log('Response headers:', Object.fromEntries(res.headers.entries()))
  console.log('Response body prefix:', text.slice(0, 500))
  if (res.status !== 200) {
    console.log('Full response body:', text)
  }
}
