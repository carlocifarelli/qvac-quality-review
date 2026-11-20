export function classify(a: number, b: number, c: string, d?: boolean) {
  if (a > 0 && b > 0) {
    if (c === 'x' || c === 'y') return 1
    for (let i = 0; i < a; i++) if (i % 2 && d) return 2
  } else if (a < 0) {
    switch (c) {
      case 'a':
        return 3
      case 'b':
        return 4
      case 'c':
        return 5
      default:
        return d ? 6 : 7
    }
  }
  while (b-- > 0) if (b === 3 || b === 5 || b === 9) return 8
  return c ?? 'z'
}

export const simple = (n: number) => n * 2
