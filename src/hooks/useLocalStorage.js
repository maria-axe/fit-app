import { useEffect, useState } from 'react'

function lerInicial(key, initialValue) {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) return JSON.parse(raw)
  } catch {
    // JSON inválido ou storage indisponível: cai no valor inicial
  }
  return typeof initialValue === 'function' ? initialValue() : initialValue
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => lerInicial(key, initialValue))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // quota cheia ou storage bloqueado: ignora para não quebrar a UI
    }
  }, [key, value])

  return [value, setValue]
}
