import { useMemo, useState } from 'react'
import { Box, Button, Textarea } from '@chakra-ui/react'
import {
  Braces,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Github,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  WrapText,
  X,
  Zap,
} from 'lucide-react'

type CurlRequest = {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
}

type ResponseState = {
  status: number
  statusText: string
  duration: number
  size: number
  data: unknown
  raw: string
} | null

const EXAMPLE_CURL = `curl 'https://jsonplaceholder.typicode.com/users/1' \\
  -H 'Accept: application/json'`

function tokenizeCurl(input: string): string[] {
  const tokens: string[] = []
  const pattern = /"((?:\\.|[^"\\])*)"|'([^']*)'|([^\s\\]+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3])
  }
  return tokens
}

function parseCurl(command: string): CurlRequest {
  const tokens = tokenizeCurl(command.trim())
  if (tokens[0]?.toLowerCase() !== 'curl') throw new Error('Command must start with curl')

  let url = ''
  let method = 'GET'
  let body: string | undefined
  const headers: Record<string, string> = {}

  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token === '-X' || token === '--request') {
      method = (tokens[++i] || 'GET').toUpperCase()
    } else if (token === '-H' || token === '--header') {
      const header = tokens[++i] || ''
      const separator = header.indexOf(':')
      if (separator > -1) {
        headers[header.slice(0, separator).trim()] = header.slice(separator + 1).trim()
      }
    } else if (['-d', '--data', '--data-raw', '--data-binary'].includes(token)) {
      body = tokens[++i] || ''
      if (method === 'GET') method = 'POST'
    } else if (token === '--url') {
      url = tokens[++i] || ''
    } else if (/^https?:\/\//i.test(token)) {
      url = token
    }
  }

  if (!url) throw new Error('No HTTP or HTTPS URL found in the curl command')
  return { url, method, headers, body }
}

function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null) return <span className="json-null">null</span>
  if (typeof value === 'string') return <span className="json-string">&quot;{value}&quot;</span>
  if (typeof value === 'number') return <span className="json-number">{value}</span>
  if (typeof value === 'boolean') return <span className="json-boolean">{String(value)}</span>

  const isArray = Array.isArray(value)
  const entries = Object.entries(value as Record<string, unknown>)
  if (!entries.length) return <span>{isArray ? '[]' : '{}'}</span>

  return (
    <span>
      {isArray ? '[' : '{'}
      {'\n'}
      {entries.map(([key, child], index) => (
        <span key={key}>
          {'  '.repeat(depth + 1)}
          {!isArray && <><span className="json-key">&quot;{key}&quot;</span>: </>}
          <JsonValue value={child} depth={depth + 1} />
          {index < entries.length - 1 ? ',' : ''}
          {'\n'}
        </span>
      ))}
      {'  '.repeat(depth)}
      {isArray ? ']' : '}'}
    </span>
  )
}

function App() {
  const [curl, setCurl] = useState(EXAMPLE_CURL)
  const [response, setResponse] = useState<ResponseState>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')

  const formatted = useMemo(() => {
    if (!response) return ''
    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
  }, [response])

  async function runRequest() {
    setError('')
    setLoading(true)
    setResponse(null)
    try {
      const request = parseCurl(curl)
      const started = performance.now()
      const result = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      })
      const raw = await result.text()
      const duration = Math.round(performance.now() - started)
      let data: unknown = raw
      try { data = JSON.parse(raw) } catch { /* Keep non-JSON responses readable. */ }
      setResponse({
        status: result.status,
        statusText: result.statusText,
        duration,
        size: new Blob([raw]).size,
        data,
        raw,
      })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'The request failed'
      setError(message.includes('Failed to fetch')
        ? 'Request blocked or unreachable. The target API may not allow browser requests (CORS).'
        : message)
    } finally {
      setLoading(false)
    }
  }

  async function copyResponse() {
    if (!formatted) return
    await navigator.clipboard.writeText(formatted)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const lineCount = formatted ? formatted.split('\n').length : 0
  const matchCount = search && formatted ? formatted.toLowerCase().split(search.toLowerCase()).length - 1 : 0

  return (
    <Box className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="CurlLens home">
          <span className="brand-mark"><Braces size={19} strokeWidth={2.4} /></span>
          <span>Curl<span>Lens</span></span>
        </a>
        <nav>
          <a href="#workspace">Workspace</a>
          <a href="#how-it-works">How it works</a>
          <a className="github-link" href="https://github.com" target="_blank" rel="noreferrer"><Github size={16} /> GitHub</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><Zap size={13} fill="currentColor" /> Developer tool · Zero setup</div>
          <h1>From cURL to clarity,<br /><span>instantly.</span></h1>
          <p>Paste a cURL command. Run it. Explore a beautifully formatted JSON response—without leaving your browser.</p>
        </section>

        <section className="workspace" id="workspace">
          <div className="panel request-panel">
            <div className="panel-heading">
              <div><span className="step">01</span><div><h2>Request</h2><p>Paste your cURL command</p></div></div>
              <button className="text-button" onClick={() => setCurl(EXAMPLE_CURL)}>Load example</button>
            </div>
            <div className="editor-wrap curl-editor">
              <span className="terminal-prompt">$</span>
              <Textarea
                aria-label="Curl command"
                value={curl}
                onChange={(event) => setCurl(event.target.value)}
                spellCheck={false}
                placeholder="curl https://api.example.com/data"
              />
            </div>
            <div className="request-footer">
              <span><ShieldCheck size={14} /> Requests run locally in your browser</span>
              <Button className="run-button" onClick={runRequest} disabled={loading || !curl.trim()}>
                {loading ? <span className="spinner" /> : <Play size={15} fill="currentColor" />}
                {loading ? 'Running…' : 'Run request'}
                <kbd>⌘ ↵</kbd>
              </Button>
            </div>
          </div>

          <div className="connector"><ChevronDown size={18} /></div>

          <div className="panel response-panel">
            <div className="panel-heading response-heading">
              <div><span className="step">02</span><div><h2>Response</h2><p>Formatted JSON output</p></div></div>
              <div className="response-actions">
                {response && <>
                  <button title="Search response" className={searchOpen ? 'active' : ''} onClick={() => setSearchOpen(!searchOpen)}><Search size={16} /></button>
                  <button title="Copy response" onClick={copyResponse}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>
                </>}
                <button title="Clear response" onClick={() => { setResponse(null); setError('') }}><RotateCcw size={16} /></button>
              </div>
            </div>

            {searchOpen && response && (
              <div className="search-bar">
                <Search size={15} />
                <input autoFocus placeholder="Find in response…" value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <span>{matchCount} matches</span>}
                <button onClick={() => { setSearch(''); setSearchOpen(false) }}><X size={14} /></button>
              </div>
            )}

            {error ? (
              <div className="state-message error-state">
                <span className="state-icon"><X size={22} /></span>
                <h3>Request failed</h3><p>{error}</p>
              </div>
            ) : response ? (
              <>
                <div className="response-meta">
                  <span className={response.status < 400 ? 'status-ok' : 'status-bad'}>
                    <i /> {response.status} {response.statusText}
                  </span>
                  <span><Clock3 size={13} /> {response.duration} ms</span>
                  <span>{response.size < 1024 ? `${response.size} B` : `${(response.size / 1024).toFixed(1)} KB`}</span>
                  <span className="meta-spacer" />
                  <span><WrapText size={13} /> {lineCount} lines</span>
                </div>
                <div className="json-viewer">
                  <div className="line-numbers">{Array.from({ length: lineCount }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
                  <pre><JsonValue value={response.data} /></pre>
                </div>
              </>
            ) : (
              <div className="state-message empty-state">
                <span className="state-icon"><Braces size={25} /></span>
                <h3>Your response will appear here</h3>
                <p>Run the cURL request above to inspect the formatted result.</p>
              </div>
            )}
          </div>
        </section>

        <section className="how-it-works" id="how-it-works">
          <div><span>1</span><h3>Paste</h3><p>Drop in any cURL command from your docs or terminal.</p></div>
          <div><span>2</span><h3>Run</h3><p>We parse and execute the request directly in your browser.</p></div>
          <div><span>3</span><h3>Inspect</h3><p>Read, search, and copy clean syntax-highlighted JSON.</p></div>
        </section>
      </main>

      <footer><span>Built for developers who value focus.</span><span>Your request data never touches our servers.</span></footer>
    </Box>
  )
}

export default App
