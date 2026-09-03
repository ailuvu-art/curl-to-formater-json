import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const cli = new URL('../bin/curllens-agent.js', import.meta.url)

async function getFreePort() {
  const server = createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  await new Promise((resolve) => server.close(resolve))
  return port
}

async function waitForAgent(port, token) {
  const deadline = Date.now() + 5_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/v1/status`, { headers: { Authorization: `Bearer ${token}` } })
      if (response.ok) return
    } catch { /* Retry while the process starts. */ }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('Agent did not start')
}

test('agent authenticates, validates origins, and executes local requests', async (t) => {
  const home = await mkdtemp(join(tmpdir(), 'curllens-agent-test-'))
  const port = await getFreePort()
  const origin = 'http://localhost:5173'
  const target = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end('{"ok":true}')
  })
  await new Promise((resolve) => target.listen(0, '127.0.0.1', resolve))
  const targetPort = target.address().port

  const install = spawn(process.execPath, [cli.pathname, 'install', '--port', String(port)], {
    env: { ...process.env, CURLLENS_AGENT_HOME: home },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  install.stdout.on('data', (chunk) => { output += chunk })
  install.stderr.on('data', (chunk) => { output += chunk })
  assert.equal(await new Promise((resolve) => install.on('exit', resolve)), 0, output)

  const config = JSON.parse(await readFile(join(home, 'config.json'), 'utf8'))
  await waitForAgent(port, config.token)

  t.after(async () => {
    const uninstall = spawn(process.execPath, [cli.pathname, 'uninstall'], { env: { ...process.env, CURLLENS_AGENT_HOME: home } })
    await new Promise((resolve) => uninstall.on('exit', resolve))
    await new Promise((resolve) => target.close(resolve))
    await rm(home, { recursive: true, force: true })
  })

  const unauthorized = await fetch(`http://127.0.0.1:${port}/v1/status`, { headers: { Authorization: 'Bearer wrong', Origin: origin } })
  assert.equal(unauthorized.status, 401)
  assert.equal(unauthorized.headers.get('access-control-allow-origin'), origin)

  const forbiddenOrigin = await fetch(`http://127.0.0.1:${port}/v1/status`, { headers: { Authorization: `Bearer ${config.token}`, Origin: 'https://evil.example' } })
  assert.equal(forbiddenOrigin.status, 403)

  const executed = await fetch(`http://127.0.0.1:${port}/v1/execute`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: `http://127.0.0.1:${targetPort}/data`, method: 'GET' }),
  })
  assert.equal(executed.status, 200)
  const result = await executed.json()
  assert.equal(result.status, 200)
  assert.equal(result.body, '{"ok":true}')

  const invalidScheme = await fetch(`http://127.0.0.1:${port}/v1/execute`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'file:///etc/passwd', method: 'GET' }),
  })
  assert.equal(invalidScheme.status, 400)
})
