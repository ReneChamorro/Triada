// Fill-in-the-blank ("completación") prompts mark each blank with an empty
// "[[ ]]" marker. The accepted answers live server-side in quiz_answer_keys,
// never inside the prompt the student receives.

export const BLANK_RE = /\[\[\s*\]\]/g

// "[[Caracas]]" — an answer typed inside the marker would be shown to students.
const FILLED_MARKER_RE = /\[\[(?!\s*\]\])[^\]]*\]\]/

export type PromptPart =
  | { kind: 'text'; text: string }
  | { kind: 'blank'; index: number }

export function countBlanks(prompt: string): number {
  return (prompt.match(BLANK_RE) ?? []).length
}

export function hasFilledMarker(prompt: string): boolean {
  return FILLED_MARKER_RE.test(prompt)
}

export function splitPrompt(prompt: string): PromptPart[] {
  const parts: PromptPart[] = []
  let cursor = 0
  let index = 0
  for (const match of prompt.matchAll(BLANK_RE)) {
    const start = match.index ?? 0
    if (start > cursor) parts.push({ kind: 'text', text: prompt.slice(cursor, start) })
    parts.push({ kind: 'blank', index: index++ })
    cursor = start + match[0].length
  }
  if (cursor < prompt.length) parts.push({ kind: 'text', text: prompt.slice(cursor) })
  return parts
}
