import { describe, expect, it } from 'vitest'
import { buildSearchPattern, childJsonPointer, DEFAULT_SEARCH_OPTIONS, findTextMatches, primitiveSearchText } from './responseSearch'

const options = { ...DEFAULT_SEARCH_OPTIONS }

describe('response search', () => {
  it('finds every case-insensitive literal occurrence', () => {
    expect(findTextMatches('Name name surname', 'name', options).matches).toEqual([
      { id: 0, start: 0, end: 4 },
      { id: 1, start: 5, end: 9 },
      { id: 2, start: 13, end: 17 },
    ])
  })

  it('escapes regular expression characters in literal mode', () => {
    expect(findTextMatches('a.b a0b a.b', 'a.b', options).matches).toHaveLength(2)
  })

  it('supports case-sensitive matching', () => {
    expect(findTextMatches('Name name NAME', 'Name', { ...options, matchCase: true }).matches).toHaveLength(1)
  })

  it('uses developer-friendly Unicode whole-word boundaries', () => {
    const result = findTextMatches('user user-name user.name user_name superuser user2', 'user', { ...options, wholeWord: true })
    expect(result.matches).toHaveLength(3)
  })

  it('supports regular expressions', () => {
    const result = findTextMatches('user-12 user-abc user-99', 'user-\\d+', { ...options, useRegex: true })
    expect(result.matches.map(({ start, end }) => [start, end])).toEqual([[0, 7], [17, 24]])
  })

  it('returns a validation error for invalid expressions', () => {
    const result = buildSearchPattern('[', { ...options, useRegex: true })
    expect(result.pattern).toBeNull()
    expect(result.error).not.toBe('')
  })

  it('ignores zero-length regular expression matches without looping', () => {
    expect(findTextMatches('ab', '(?=b)', { ...options, useRegex: true }).matches).toHaveLength(0)
  })

  it('returns stable ids with an offset', () => {
    expect(findTextMatches('x x', 'x', options, 4).matches.map((match) => match.id)).toEqual([4, 5])
  })

  it('normalizes primitive values for tree search', () => {
    expect([primitiveSearchText(null), primitiveSearchText(true), primitiveSearchText(42), primitiveSearchText('hello')]).toEqual(['null', 'true', '42', 'hello'])
  })

  it('escapes JSON Pointer path segments', () => {
    expect(childJsonPointer('$/users', 'a/b~c.d')).toBe('$/users/a~1b~0c.d')
  })
})
