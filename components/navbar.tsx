"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserCircle } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-yellow-500">DevCollab</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/projects"
              className={`text-sm font-medium transition-colors hover:text-yellow-500 ${
                pathname.startsWith("/projects") ? "text-yellow-500" : ""
              }`}
            >
              Projects
            </Link>
            <Link
              href="/chat"
              className={`text-sm font-medium transition-colors hover:text-yellow-500 ${
                pathname === "/chat" ? "text-yellow-500" : ""
              }`}
            >
              AI Chat
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

