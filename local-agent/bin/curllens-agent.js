#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, open, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const VERSION = '0.1.0'
const HOST = '127.0.0.1'
const DEFAULT_PORT = 43120
const MAX_REQUEST_BYTES = 2 * 1024 * 1024
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024
const MAX_TIMEOUT_MS = 120_000
const DEFAULT_TIMEOUT_MS = 30_000
const CONFIG_DIR = process.env.CURLLENS_AGENT_HOME || join(homedir(), '.curllens-agent')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')
const PID_PATH = join(CONFIG_DIR, 'agent.pid')
const LOG_PATH = join(CONFIG_DIR, 'agent.log')
const ENTRY_PATH = fileURLToPath(import.meta.url)
const DEFAULT_ORIGINS = [
  'https://www.curljson.help',
  'https://curljson.help',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

function printHelp() {
  console.log(`CurlLens Local Agent v${VERSION}

Usage:
  npx @curllens/local-agent <command> [options]

Commands:
  install      Create local configuration and start the agent
  start        Start the agent in the background
  serve        Run the agent in the foreground
  status       Show whether the agent is running
  stop         Stop the background agent
  uninstall    Stop the agent and remove local configuration
  token        Print the browser connection token

Options:
  --port <n>             Listening port (default: ${DEFAULT_PORT})
  --allow-origin <url>   Add an allowed website origin (repeatable)
  --help                 Show this help
  --version              Print the version

Examples:
  npx @curllens/local-agent install
  npx @curllens/local-agent start
  npx @curllens/local-agent status
  npx @curllens/local-agent stop
  npx @curllens/local-agent uninstall
`)
}

function parseOptions(args) {
  const options = { origins: [] }
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (value === '--port') options.port = Number(args[++index])
    else if (value === '--allow-origin') options.origins.push(args[++index])
    else throw new Error(`Unknown option: ${value}`)
  }
  if (options.port !== undefined && (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65535)) {
    throw new Error('Port must be an integer between 1024 and 65535')
  }
  for (const origin of options.origins) validateOrigin(origin)
  return options
}

function validateOrigin(origin) {
  const parsed = new URL(origin)
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
    throw new Error(`Invalid origin: ${origin}`)
  }
}

async function ensureConfig(options = {}) {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 })
  let existing = null
  try { existing = JSON.parse(await readFile(CONFIG_PATH, 'utf8')) } catch { /* Create it below. */ }
  const existingToken = typeof existing?.token === 'string' && existing.token.length >= 32 ? existing.token : null
  const existingOrigins = Array.isArray(existing?.allowedOrigins) ? existing.allowedOrigins.filter((origin) => {
    try { validateOrigin(origin); return true } catch { return false }
  }) : DEFAULT_ORIGINS
  const config = {
    version: 1,
    host: HOST,
    port: options.port || existing?.port || DEFAULT_PORT,
    token: existingToken || randomBytes(32).toString('base64url'),
    allowedOrigins: [...new Set([...existingOrigins, ...(options.origins || [])])],
  }
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
  return config
}

async function readConfig() {
  try { return JSON.parse(await readFile(CONFIG_PATH, 'utf8')) } catch { return null }
}

async function readPid() {
  try {
    const pid = Number((await readFile(PID_PATH, 'utf8')).trim())
    return Number.isInteger(pid) && pid > 0 ? pid : null
  } catch { return null }
}

function processIsRunning(pid) {
  if (!pid) return false
  try { process.kill(pid, 0); return true } catch { return false }
}

async function removeStalePid() {
  const pid = await readPid()
  if (pid && processIsRunning(pid)) return pid
  await rm(PID_PATH, { force: true })
  return null
}

async function startBackground(options) {
  const config = await ensureConfig(options)
  const runningPid = await removeStalePid()
  if (runningPid) {
    if (await probe(config)) {
      console.log(`CurlLens Local Agent is already running (PID ${runningPid}).`)
      return
    }
    throw new Error(`PID file points to running process ${runningPid}, but it is not the authenticated CurlLens agent. Remove ${PID_PATH} after checking that process.`)
  }
  const log = await open(LOG_PATH, 'a', 0o600)
  let child
  try {
    child = spawn(process.execPath, [ENTRY_PATH, 'serve'], {
      detached: true,
      stdio: ['ignore', log.fd, log.fd],
      env: { ...process.env, CURLLENS_AGENT_HOME: CONFIG_DIR },
    })
    child.unref()
  } finally {
    await log.close()
  }

  const deadline = Date.now() + 5_000
  while (Date.now() < deadline) {
    if (await probe(config)) {
      console.log(`CurlLens Local Agent started at http://${HOST}:${config.port} (PID ${child.pid}).`)
      console.log(`Connection token: ${config.token}`)
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Agent did not start. Check ${LOG_PATH}`)
}

async function probe(config) {
  try {
    const response = await fetch(`http://${HOST}:${config.port}/v1/status`, {
      headers: { Authorization: `Bearer ${config.token}` },
      signal: AbortSignal.timeout(500),
    })
    return response.ok
  } catch { return false }
}

async function stopAgent({ quiet = false } = {}) {
  const config = await readConfig()
  const pid = await removeStalePid()
  if (!pid) {
    if (!quiet) console.log('CurlLens Local Agent is not running.')
    return
  }
  if (!config || !(await probe(config))) {
    throw new Error(`Refusing to stop PID ${pid}: it did not authenticate as this CurlLens agent.`)
  }
  process.kill(pid, 'SIGTERM')
  const deadline = Date.now() + 5_000
  while (Date.now() < deadline && processIsRunning(pid)) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (processIsRunning(pid)) process.kill(pid, 'SIGKILL')
  await rm(PID_PATH, { force: true })
  if (!quiet) console.log('CurlLens Local Agent stopped.')
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function setCorsHeaders(response, origin, config) {
  if (origin && config.allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
    response.setHeader('Access-Control-Allow-Private-Network', 'true')
  }
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-CurlLens-Agent')
  response.setHeader('Access-Control-Max-Age', '600')
  response.setHeader('Cache-Control', 'no-store')
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value)
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) })
  response.end(body)
}

async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_REQUEST_BYTES) throw Object.assign(new Error('Request payload is too large'), { status: 413 })
    chunks.push(chunk)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw Object.assign(new Error('Request body must be valid JSON'), { status: 400 }) }
}

function validateExecution(input) {
  if (!input || typeof input !== 'object') throw Object.assign(new Error('Invalid execution request'), { status: 400 })
  if (typeof input.url !== 'string') throw Object.assign(new Error('A URL is required'), { status: 400 })
  const url = new URL(input.url)
  if (!['http:', 'https:'].includes(url.protocol)) throw Object.assign(new Error('Only HTTP and HTTPS URLs are supported'), { status: 400 })
  const method = String(input.method || 'GET').toUpperCase()
  if (!/^[A-Z]+$/.test(method) || ['CONNECT', 'TRACE'].includes(method)) throw Object.assign(new Error(`Method ${method} is not allowed`), { status: 400 })
  const headers = new Headers()
  if (input.headers !== undefined && (!input.headers || typeof input.headers !== 'object' || Array.isArray(input.headers))) {
    throw Object.assign(new Error('Headers must be an object'), { status: 400 })
  }
  for (const [name, value] of Object.entries(input.headers || {})) {
    if (typeof value !== 'string') throw Object.assign(new Error(`Header ${name} must be a string`), { status: 400 })
    const normalized = name.toLowerCase()
    if (['host', 'content-length', 'connection', 'transfer-encoding', 'upgrade'].includes(normalized)) continue
    headers.set(name, value)
  }
  const timeoutMs = Math.min(Math.max(Number(input.timeoutMs) || DEFAULT_TIMEOUT_MS, 1_000), MAX_TIMEOUT_MS)
  return { url, method, headers, body: ['GET', 'HEAD'].includes(method) ? undefined : (typeof input.body === 'string' ? input.body : undefined), timeoutMs }
}

async function readResponseBody(response) {
  if (!response.body) return Buffer.alloc(0)
  const chunks = []
  let size = 0
  for await (const chunk of response.body) {
    size += chunk.length
    if (size > MAX_RESPONSE_BYTES) {
      await response.body.cancel()
      throw Object.assign(new Error(`Response exceeds ${MAX_RESPONSE_BYTES / 1024 / 1024} MB limit`), { status: 413 })
    }
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function executeRequest(input) {
  const validated = validateExecution(input)
  const started = performance.now()
  const targetResponse = await fetch(validated.url, {
    method: validated.method,
    headers: validated.headers,
    body: validated.body,
    redirect: 'follow',
    signal: AbortSignal.timeout(validated.timeoutMs),
  })
  const body = await readResponseBody(targetResponse)
  const contentType = targetResponse.headers.get('content-type') || ''
  const textLike = /(^text\/)|json|xml|javascript|x-www-form-urlencoded/i.test(contentType) || !contentType
  return {
    status: targetResponse.status,
    statusText: targetResponse.statusText,
    duration: Math.round(performance.now() - started),
    size: body.length,
    headers: Object.fromEntries(targetResponse.headers.entries()),
    body: textLike ? body.toString('utf8') : body.toString('base64'),
    bodyEncoding: textLike ? 'utf8' : 'base64',
    finalUrl: targetResponse.url,
  }
}

async function serve(options) {
  const config = await ensureConfig(options)
  const server = createServer(async (request, response) => {
    const origin = request.headers.origin
    setCorsHeaders(response, origin, config)

    if (origin && !config.allowedOrigins.includes(origin)) {
      sendJson(response, 403, { error: 'This website origin is not allowed by the CurlLens Local Agent.' })
      return
    }
    if (request.method === 'OPTIONS') {
      response.writeHead(204)
      response.end()
      return
    }

    const authorization = request.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!token || !safeEqual(token, config.token)) {
      sendJson(response, 401, { error: 'Invalid CurlLens Local Agent token.' })
      return
    }

    if (request.method === 'GET' && request.url === '/v1/status') {
      sendJson(response, 200, { name: 'CurlLens Local Agent', version: VERSION, protocolVersion: 1, port: config.port })
      return
    }
    if (request.method === 'POST' && request.url === '/v1/execute') {
      try {
        const input = await readJsonBody(request)
        sendJson(response, 200, await executeRequest(input))
      } catch (error) {
        const status = Number(error?.status) || (error?.name === 'TimeoutError' ? 504 : 502)
        sendJson(response, status, { error: error instanceof Error ? error.message : 'The target request failed' })
      }
      return
    }
    sendJson(response, 404, { error: 'Not found' })
  })

  function shutDown() {
    server.close(async () => {
      try {
        const pidContent = await readFile(PID_PATH, 'utf8')
        if (pidContent.trim() === String(process.pid)) await rm(PID_PATH, { force: true })
      } catch { /* Nothing to clean up. */ }
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 3_000).unref()
  }
  process.on('SIGINT', shutDown)
  process.on('SIGTERM', shutDown)

  server.on('error', async (error) => {
    await rm(PID_PATH, { force: true })
    console.error(`CurlLens Local Agent failed: ${error.message}`)
    process.exit(1)
  })
  server.listen(config.port, HOST, async () => {
    await writeFile(PID_PATH, `${process.pid}\n`, { mode: 0o600 })
    console.log(`[${new Date().toISOString()}] CurlLens Local Agent ${VERSION} listening on http://${HOST}:${config.port} (PID ${process.pid})`)
  })
}

async function showStatus() {
  const config = await readConfig()
  const pid = await removeStalePid()
  if (!config || !pid || !(await probe(config))) {
    console.log('CurlLens Local Agent is not running.')
    process.exitCode = 1
    return
  }
  console.log(`CurlLens Local Agent is running at http://${HOST}:${config.port} (PID ${pid}).`)
  console.log(`Allowed origins: ${config.allowedOrigins.join(', ')}`)
}

async function main() {
  const [command = 'help', ...args] = process.argv.slice(2)
  if (command === '--help' || command === '-h' || command === 'help') return printHelp()
  if (command === '--version' || command === '-v') return console.log(VERSION)
  const options = parseOptions(args)

  if (command === 'install') {
    await ensureConfig(options)
    console.log(`CurlLens Local Agent installed in ${CONFIG_DIR}.`)
    await startBackground(options)
  } else if (command === 'start') await startBackground(options)
  else if (command === 'serve') await serve(options)
  else if (command === 'status') await showStatus()
  else if (command === 'stop') await stopAgent()
  else if (command === 'uninstall') {
    await stopAgent({ quiet: true })
    await rm(CONFIG_DIR, { recursive: true, force: true })
    console.log('CurlLens Local Agent uninstalled and local configuration removed.')
  } else if (command === 'token') {
    const config = await ensureConfig(options)
    console.log(config.token)
  } else throw new Error(`Unknown command: ${command}`)
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
