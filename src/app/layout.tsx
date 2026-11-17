import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import type { ReactNode } from 'react'
import { THEME_STORAGE } from '../theme'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Display and reading face: headings, verdicts, headline figures and report prose.
const serif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
})

export const metadata: Metadata = {
  title: 'Market Research Analysis',
  description: 'Evidence-backed go / no-go for a product idea',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
}

// Runs before the first paint so a saved dark theme doesn't flash light first.
// With nothing saved the page stays in light mode, the default.
const applySavedTheme = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE)});if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${inter.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applySavedTheme }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
