"use client"

import { useEffect, useState } from 'react'
import { ReactNode } from 'react'

// Клиентский компонент, который загружает ThemeProvider только после монтирования
// Это полностью предотвращает попадание next-themes в серверный bundle
interface ThemeProviderClientProps {
  children: ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProviderClient({ 
  children, 
  attribute = 'class',
  defaultTheme = 'light',
  enableSystem = false,
  disableTransitionOnChange = false
}: ThemeProviderClientProps) {
  const [mounted, setMounted] = useState(false)
  const [ThemeProvider, setThemeProvider] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    setMounted(true)
    // Динамический импорт только после монтирования на клиенте
    import('next-themes').then((mod) => {
      setThemeProvider(() => mod.ThemeProvider)
    }).catch((err) => {
      console.error('Failed to load ThemeProvider:', err)
    })
  }, [])

  // До монтирования рендерим children без темы
  if (!mounted || !ThemeProvider) {
    return <>{children}</>
  }

  return (
    <ThemeProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      {children}
    </ThemeProvider>
  )
}

