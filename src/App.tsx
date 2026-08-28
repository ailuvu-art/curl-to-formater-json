import { useMemo, useState } from 'react'
import { Box, Button, Textarea } from '@chakra-ui/react'
import {
  Braces,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock3,
  Code2,
  Copy,
  FileText,
  Github,
  Home,
  Network,
  Play,
  Plus,
  RotateCcw,
  Trash2,
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

type ResponseResult = {
  status: number
  statusText: string
  duration: number
  size: number
  data: unknown
  raw: string
}

type ResponseState = ResponseResult | null

type WorkspaceTab = {
  id: string
  name: string
  curl: string
  response: ResponseState
  error: string
  loading: boolean
  viewMode: ViewMode
  collapsedPaths: string[]
}

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

type ViewMode = 'tree' | 'code' | 'text'

type TreeNodeProps = {
  value: unknown
  name?: string
  path: string
  depth?: number
  collapsedPaths: Set<string>
  onToggle: (path: string) => void
}

function PrimitiveValue({ value }: { value: unknown }) {
  if (value === null) return <span className="json-null">null</span>
  if (typeof value === 'string') return <span className="json-string">&quot;{value}&quot;</span>
  if (typeof value === 'number') return <span className="json-number">{value}</span>
  if (typeof value === 'boolean') return <span className="json-boolean">{String(value)}</span>
  return <span className="json-null">undefined</span>
}

function TreeNode({ value, name, path, depth = 0, collapsedPaths, onToggle }: TreeNodeProps) {
  const isContainer = value !== null && typeof value === 'object'
  const isArray = Array.isArray(value)
  const entries = isContainer ? Object.entries(value as Record<string, unknown>) : []
  const collapsed = collapsedPaths.has(path)
  const label = name === undefined ? null : <span className="tree-key">{isArray ? name : `\"${name}\"`}</span>

  if (!isContainer) {
    return (
      <div className="tree-row" style={{ paddingLeft: `${depth * 19 + 8}px` }}>
        <span className="tree-spacer" />{label}{label && <span className="tree-colon">:</span>} <PrimitiveValue value={value} />
      </div>
    )
  }

  const typeLabel = isArray ? 'Array' : 'Object'
  const opening = isArray ? '[' : '{'
  const closing = isArray ? ']' : '}'

  return (
    <div className="tree-node">
      <div className="tree-row tree-container-row" style={{ paddingLeft: `${depth * 19 + 8}px` }}>
        <button className="tree-toggle" onClick={() => onToggle(path)} aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${name ?? 'root'}`}>
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>
        {label}{label && <span className="tree-colon">:</span>}
        <span className="tree-bracket">{opening}</span>
        <span className="tree-summary">{entries.length} {entries.length === 1 ? 'item' : 'items'} · {typeLabel}</span>
        {collapsed && <span className="tree-bracket">…{closing}</span>}
      </div>
      {!collapsed && <>
        {entries.map(([key, child]) => (
          <TreeNode
            key={`${path}.${key}`}
            value={child}
            name={isArray ? key : key}
            path={`${path}.${key}`}
            depth={depth + 1}
            collapsedPaths={collapsedPaths}
            onToggle={onToggle}
          />
        ))}
        <div className="tree-row tree-closing" style={{ paddingLeft: `${depth * 19 + 27}px` }}>{closing}</div>
      </>}
    </div>
  )
}

function collectContainerPaths(value: unknown, path = '$'): string[] {
  if (value === null || typeof value !== 'object') return []
  return [path, ...Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => collectContainerPaths(child, `${path}.${key}`))]
}

function syntaxHighlight(json: string) {
  const tokenPattern = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:)|("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")|\b(true|false)\b|\b(null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g
  const parts: Array<string | JSX.Element> = []
  let cursor = 0
  let match: RegExpExecArray | null
  let index = 0

  while ((match = tokenPattern.exec(json)) !== null) {
    if (match.index > cursor) parts.push(json.slice(cursor, match.index))
    const token = match[0]
    const className = match[1] ? 'json-key' : match[2] ? 'json-string' : match[3] ? 'json-boolean' : match[4] ? 'json-null' : 'json-number'
    parts.push(<span className={className} key={`${match.index}-${index++}`}>{token}</span>)
    cursor = match.index + token.length
  }
  if (cursor < json.length) parts.push(json.slice(cursor))
  return parts
}

function createWorkspaceTab(index: number): WorkspaceTab {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: `Request ${index}`,
    curl: index === 1 ? EXAMPLE_CURL : '',
    response: null,
    error: '',
    loading: false,
    viewMode: 'tree',
    collapsedPaths: [],
  }
}

async function executeCurl(curl: string): Promise<ResponseResult> {
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
  return {
    status: result.status,
    statusText: result.statusText,
    duration,
    size: new Blob([raw]).size,
    data,
    raw,
  }
}

function ResponsePreview({
  response,
  viewMode,
  collapsedPaths,
  onViewModeChange,
  onCollapsedPathsChange,
}: {
  response: ResponseResult
  viewMode: ViewMode
  collapsedPaths: string[]
  onViewModeChange: (mode: ViewMode) => void
  onCollapsedPathsChange: (paths: string[]) => void
}) {
  const formatted = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
  const lineCount = formatted ? formatted.split('\n').length : 0
  const containerPaths = collectContainerPaths(response.data)
  const collapsedSet = new Set(collapsedPaths)
  const allCollapsed = containerPaths.length > 0 && containerPaths.every((path) => collapsedSet.has(path))

  function togglePath(path: string) {
    const next = new Set(collapsedSet)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    onCollapsedPathsChange([...next])
  }

  return <>
    <div className="response-meta workspace-response-meta">
      <span className={response.status < 400 ? 'status-ok' : 'status-bad'}><i /> {response.status} {response.statusText}</span>
      <span><Clock3 size={13} /> {response.duration} ms</span>
      <span>{response.size < 1024 ? `${response.size} B` : `${(response.size / 1024).toFixed(1)} KB`}</span>
      <span className="meta-spacer" />
      <span><WrapText size={13} /> {lineCount} lines</span>
    </div>
    <div className="viewer-toolbar">
      <div className="view-tabs" role="tablist" aria-label="Response view mode">
        <button role="tab" aria-selected={viewMode === 'tree'} className={viewMode === 'tree' ? 'active' : ''} onClick={() => onViewModeChange('tree')}><Network size={13} /> Tree</button>
        <button role="tab" aria-selected={viewMode === 'code'} className={viewMode === 'code' ? 'active' : ''} onClick={() => onViewModeChange('code')}><Code2 size={13} /> Code</button>
        <button role="tab" aria-selected={viewMode === 'text'} className={viewMode === 'text' ? 'active' : ''} onClick={() => onViewModeChange('text')}><FileText size={13} /> Text</button>
      </div>
      {viewMode === 'tree' && containerPaths.length > 0 && <button className="collapse-all" onClick={() => onCollapsedPathsChange(allCollapsed ? [] : containerPaths)}>
        {allCollapsed ? <ChevronsUpDown size={13} /> : <ChevronsDownUp size={13} />}{allCollapsed ? 'Expand all' : 'Collapse all'}
      </button>}
    </div>
    {viewMode === 'tree' ? <div className="tree-viewer workspace-tree-viewer"><TreeNode value={response.data} path="$" collapsedPaths={collapsedSet} onToggle={togglePath} /></div>
      : viewMode === 'code' ? <div className="json-viewer workspace-json-viewer"><div className="line-numbers">{Array.from({ length: lineCount }, (_, i) => <span key={i}>{i + 1}</span>)}</div><pre>{syntaxHighlight(formatted)}</pre></div>
        : <pre className="text-viewer workspace-text-viewer">{response.raw}</pre>}
  </>
}

function WorkspacePage() {
  const [tabs, setTabs] = useState<WorkspaceTab[]>(() => [createWorkspaceTab(1)])
  const [activeId, setActiveId] = useState(() => tabs[0].id)
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  function updateTab(id: string, changes: Partial<WorkspaceTab>) {
    setTabs((current) => current.map((tab) => tab.id === id ? { ...tab, ...changes } : tab))
  }

  function addTab() {
    const tab = createWorkspaceTab(tabs.length + 1)
    setTabs((current) => [...current, tab])
    setActiveId(tab.id)
  }

  function closeTab(id: string) {
    if (tabs.length === 1) {
      const replacement = createWorkspaceTab(1)
      setTabs([replacement])
      setActiveId(replacement.id)
      return
    }
    const index = tabs.findIndex((tab) => tab.id === id)
    const remaining = tabs.filter((tab) => tab.id !== id)
    setTabs(remaining)
    if (activeId === id) setActiveId(remaining[Math.min(index, remaining.length - 1)].id)
  }

  async function runTab(tab: WorkspaceTab) {
    updateTab(tab.id, { loading: true, error: '', response: null, collapsedPaths: [] })
    try {
      const response = await executeCurl(tab.curl)
      let hostname = ''
      try { hostname = new URL(parseCurl(tab.curl).url).hostname.replace(/^www\./, '') } catch { /* Keep tab name. */ }
      updateTab(tab.id, { response, loading: false, name: hostname || tab.name })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'The request failed'
      updateTab(tab.id, {
        loading: false,
        error: message.includes('Failed to fetch') ? 'Request blocked or unreachable. The target API may not allow browser requests (CORS).' : message,
      })
    }
  }

  return <Box className="workspace-page-shell">
    <header className="workspace-topbar">
      <a className="brand" href="/" aria-label="CurlLens home"><span className="brand-mark"><Braces size={19} strokeWidth={2.4} /></span><span>Curl<span>Lens</span></span></a>
      <div className="workspace-title"><span>Workspace</span><i />{tabs.length} {tabs.length === 1 ? 'request' : 'requests'}</div>
      <div className="workspace-nav"><a href="/"><Home size={14} /> Home</a><a href="https://github.com/ailuvu-art/curl-to-formater-json" target="_blank" rel="noreferrer"><Github size={15} /></a></div>
    </header>

    <div className="request-tabs-bar">
      <div className="request-tabs" role="tablist">
        {tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={tab.id === activeId} className={tab.id === activeId ? 'active' : ''} onClick={() => setActiveId(tab.id)}>
          <span className={`tab-status ${tab.loading ? 'loading' : tab.error ? 'error' : tab.response ? 'success' : ''}`} />
          <span className="tab-name">{tab.name}</span>
          <span className="tab-close" role="button" aria-label={`Close ${tab.name}`} onClick={(event) => { event.stopPropagation(); closeTab(tab.id) }}><X size={12} /></span>
        </button>)}
        <button className="add-tab" aria-label="Add request tab" onClick={addTab}><Plus size={15} /></button>
      </div>
    </div>

    <main className="workspace-canvas">
      <section className="workspace-pane workspace-request-pane">
        <div className="workspace-pane-heading">
          <div><span className="pane-icon">$</span><div><h1>{activeTab.name}</h1><p>cURL request</p></div></div>
          <div className="pane-actions"><button onClick={() => updateTab(activeTab.id, { curl: EXAMPLE_CURL })}>Example</button><button title="Clear request" onClick={() => updateTab(activeTab.id, { curl: '', response: null, error: '' })}><Trash2 size={14} /></button></div>
        </div>
        <div className="workspace-editor">
          <Textarea aria-label="Curl command" value={activeTab.curl} onChange={(event) => updateTab(activeTab.id, { curl: event.target.value })} spellCheck={false} placeholder="Paste a cURL command here…" />
        </div>
        <div className="workspace-request-footer">
          <span><ShieldCheck size={14} /> Runs locally in your browser</span>
          <Button className="run-button" onClick={() => runTab(activeTab)} disabled={activeTab.loading || !activeTab.curl.trim()}>
            {activeTab.loading ? <span className="spinner" /> : <Play size={15} fill="currentColor" />}{activeTab.loading ? 'Running…' : 'Send request'}
          </Button>
        </div>
      </section>

      <section className="workspace-pane workspace-preview-pane">
        <div className="workspace-pane-heading preview-pane-heading">
          <div><span className="pane-icon"><Braces size={15} /></span><div><h2>JSON Preview</h2><p>Response inspector</p></div></div>
          {activeTab.response && <button className="copy-workspace" title="Copy response" onClick={() => navigator.clipboard.writeText(JSON.stringify(activeTab.response?.data, null, 2))}><Copy size={14} /> Copy</button>}
        </div>
        {activeTab.error ? <div className="workspace-empty error-state"><span className="state-icon"><X size={22} /></span><h3>Request failed</h3><p>{activeTab.error}</p></div>
          : activeTab.loading ? <div className="workspace-empty"><span className="large-spinner" /><h3>Fetching response</h3><p>Waiting for the API to respond…</p></div>
            : activeTab.response ? <ResponsePreview response={activeTab.response} viewMode={activeTab.viewMode} collapsedPaths={activeTab.collapsedPaths} onViewModeChange={(viewMode) => updateTab(activeTab.id, { viewMode })} onCollapsedPathsChange={(collapsedPaths) => updateTab(activeTab.id, { collapsedPaths })} />
              : <div className="workspace-empty"><span className="state-icon"><Network size={23} /></span><h3>No response yet</h3><p>Paste a cURL command and send the request to inspect its JSON response.</p></div>}
      </section>
    </main>
  </Box>
}

function LandingPage() {
  const [curl, setCurl] = useState(EXAMPLE_CURL)
  const [response, setResponse] = useState<ResponseState>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set())

  const formatted = useMemo(() => {
    if (!response) return ''
    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
  }, [response])
  const containerPaths = useMemo(() => response ? collectContainerPaths(response.data) : [], [response])
  const allCollapsed = containerPaths.length > 0 && containerPaths.every((path) => collapsedPaths.has(path))

  async function runRequest() {
    setError('')
    setLoading(true)
    setResponse(null)
    setCollapsedPaths(new Set())
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
    await navigator.clipboard.writeText(viewMode === 'text' && response ? response.raw : formatted)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function togglePath(path: string) {
    setCollapsedPaths((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function toggleAllNodes() {
    setCollapsedPaths(allCollapsed ? new Set() : new Set(containerPaths))
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
          <a href="/workspace">Workspace</a>
          <a href="#how-it-works">How it works</a>
          <a className="github-link" href="https://github.com/ailuvu-art/curl-to-formater-json" target="_blank" rel="noreferrer"><Github size={16} /> GitHub</a>
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
                <div className="viewer-toolbar">
                  <div className="view-tabs" role="tablist" aria-label="Response view mode">
                    <button role="tab" aria-selected={viewMode === 'tree'} className={viewMode === 'tree' ? 'active' : ''} onClick={() => setViewMode('tree')}><Network size={13} /> Tree</button>
                    <button role="tab" aria-selected={viewMode === 'code'} className={viewMode === 'code' ? 'active' : ''} onClick={() => setViewMode('code')}><Code2 size={13} /> Code</button>
                    <button role="tab" aria-selected={viewMode === 'text'} className={viewMode === 'text' ? 'active' : ''} onClick={() => setViewMode('text')}><FileText size={13} /> Text</button>
                  </div>
                  {viewMode === 'tree' && containerPaths.length > 0 && (
                    <button className="collapse-all" onClick={toggleAllNodes}>
                      {allCollapsed ? <ChevronsUpDown size={13} /> : <ChevronsDownUp size={13} />}
                      {allCollapsed ? 'Expand all' : 'Collapse all'}
                    </button>
                  )}
                </div>
                {viewMode === 'tree' ? (
                  <div className="tree-viewer">
                    <TreeNode value={response.data} path="$" collapsedPaths={collapsedPaths} onToggle={togglePath} />
                  </div>
                ) : viewMode === 'code' ? (
                  <div className="json-viewer code-viewer">
                    <div className="line-numbers">{Array.from({ length: lineCount }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
                    <pre>{syntaxHighlight(formatted)}</pre>
                  </div>
                ) : (
                  <pre className="text-viewer">{response.raw}</pre>
                )}
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

function App() {
  return window.location.pathname.startsWith('/workspace') ? <WorkspacePage /> : <LandingPage />
}

export default App
