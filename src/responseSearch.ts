export type SearchOptions = {
  matchCase: boolean
  wholeWord: boolean
  useRegex: boolean
}

export type TextMatch = {
  id: number
  start: number
  end: number
}

export type SearchResult = {
  matches: TextMatch[]
  error: string
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  matchCase: false,
  wholeWord: false,
  useRegex: false,
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildSearchPattern(query: string, options: SearchOptions): { pattern: RegExp | null, error: string } {
  if (!query) return { pattern: null, error: '' }

  try {
    const source = options.useRegex ? query : escapeRegExp(query)
    const bounded = options.wholeWord
      ? `(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])`
      : source
    return {
      pattern: new RegExp(bounded, `gu${options.matchCase ? '' : 'i'}`),
      error: '',
    }
  } catch (caught) {
    return {
      pattern: null,
      error: caught instanceof Error ? caught.message.replace(/^Invalid regular expression:\s*/i, '') : 'Invalid regular expression',
    }
  }
}

export function findTextMatches(text: string, query: string, options: SearchOptions, firstId = 0): SearchResult {
  const { pattern, error } = buildSearchPattern(query, options)
  if (!pattern || error) return { matches: [], error }

  const matches: TextMatch[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match[0].length > 0) matches.push({ id: firstId + matches.length, start: match.index, end: match.index + match[0].length })
    else pattern.lastIndex += 1
  }
  return { matches, error: '' }
}

export function primitiveSearchText(value: unknown) {
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

export function childJsonPointer(path: string, key: string) {
  return `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`
}
