export function alternarDia(dias, dia) {
  return dias.includes(dia)
    ? dias.filter((d) => d !== dia)
    : [...dias, dia].sort((a, b) => a - b)
}

export function mesmosDias(a, b) {
  if (a.length !== b.length) return false
  const conjuntoB = new Set(b)
  return a.every((dia) => conjuntoB.has(dia))
}
