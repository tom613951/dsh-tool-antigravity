import fs from 'node:fs'
import path from 'node:path'
import {
  createAntigravityAuthService,
  AntigravityAdapter,
} from '../lib/index.js'

const optionsData = JSON.parse(fs.readFileSync('./scripts/exact-options.json', 'utf8'))
const service = createAntigravityAuthService()
const adapter = new AntigravityAdapter({ auth: service })

console.log('Testing adapter.stream() with exact options...')
const stream = adapter.stream({
  provider: 'google-antigravity',
  model: optionsData.config.model,
  reasoningEffort: optionsData.config.reasoningEffort,
  messages: optionsData.messages,
  tools: optionsData.tools,
})

try {
  let count = 0
  for await (const chunk of stream) {
    count++
    if (chunk.type === 'text-delta' || chunk.type === 'reasoning-delta') {
      process.stdout.write(chunk.text || '')
    } else if (chunk.type === 'finish') {
      console.log('\nFinish chunk:', JSON.stringify(chunk))
    }
  }
  console.log(`\nStream completed successfully! Total chunks: ${count}`)
} catch (err) {
  console.error('\nStream threw error:', err)
}
