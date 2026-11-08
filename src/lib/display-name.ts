// Public reviews show a short, non-identifying name ("María G.") snapshotted
// at write time, because public pages cannot read other users' profiles.

const clean = (value: string | null | undefined) =>
  (value ?? '').replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim()

const capitalize = (word: string) =>
  word.charAt(0).toLocaleUpperCase('es') + word.slice(1).toLocaleLowerCase('es')

export function toReviewDisplayName(profile: {
  name?: string | null
  lastname?: string | null
  full_name?: string | null
}): string {
  let first = clean(profile.name).split(' ')[0] ?? ''
  let last = clean(profile.lastname)

  if (!first) {
    const parts = clean(profile.full_name).split(' ').filter(Boolean)
    first = parts[0] ?? ''
    if (!last) last = parts.slice(1).join(' ')
  }

  if (!first) return 'Estudiante'

  const initial = last ? ` ${last.charAt(0).toLocaleUpperCase('es')}.` : ''
  return `${capitalize(first)}${initial}`.slice(0, 40)
}
