/** Retorna a cor CSS do gráfico para um índice de categoria (1-6). */
export function chartColor(index: number): string {
  const n = ((index - 1) % 6) + 1
  return `var(--color-chart-${n})`
}
