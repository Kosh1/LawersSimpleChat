"use client"

import dynamic from 'next/dynamic'

// Клиентский wrapper для Toaster с динамическим импортом
// Это предотвращает попадание @radix-ui/react-toast в основной bundle
const DynamicToaster = dynamic(
  () => import("@/components/ui/toaster").then((mod) => mod.Toaster),
  { 
    ssr: false,
    loading: () => null
  }
)

export function ToasterClient() {
  return <DynamicToaster />
}

