export function overlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  // expects HH:mm 24h
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number)
    return h * 60 + m
  }
  const a1 = toMin(startA), a2 = toMin(endA)
  const b1 = toMin(startB), b2 = toMin(endB)
  return Math.max(a1, b1) < Math.min(a2, b2)
}


