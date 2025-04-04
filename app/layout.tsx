import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Prompt } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })
const prompt = Prompt({ 
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-prompt',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light" style={{colorScheme: "light"}}>
      <body className={`${inter.className} ${prompt.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'