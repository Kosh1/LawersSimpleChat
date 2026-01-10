"use client"

import dynamic from 'next/dynamic'
import { type ThemeProviderProps } from 'next-themes'
import { ReactNode, Suspense } from 'react'

// Динамический импорт ThemeProvider для избежания попадания next-themes 
// в основной layout.js chunk, что предотвращает ошибку SyntaxError
// Используем ssr: false чтобы модуль загружался только на клиенте
const DynamicThemeProvider = dynamic(
  () => import('next-themes').then((mod) => mod.ThemeProvider),
  { 
    ssr: false,
    loading: () => null // Не показываем индикатор загрузки
  }
)

interface ThemeProviderWrapperProps extends ThemeProviderProps {
  children: ReactNode
}

export function ThemeProviderWrapper({ children, ...props }: ThemeProviderWrapperProps) {
  return (
    <Suspense fallback={<>{children}</>}>
      <DynamicThemeProvider {...props}>
        {children}
      </DynamicThemeProvider>
    </Suspense>
  )
}

