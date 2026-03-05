'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const EditorExtensions = dynamic(
  () => import('./EditorExtensions').then((mod) => ({ default: mod.EditorExtensions })),
  { ssr: false }
)

export function LazyEditorExtensions({ children }: { children: React.ReactNode }) {
  return <EditorExtensions>{children}</EditorExtensions>
}
