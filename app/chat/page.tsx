"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Send } from "lucide-react"
import Navbar from "@/components/navbar"

type Message = {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your project assistant. How can I help you with your project today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about "${input}". I can help you with project planning, developer recommendations, and technical advice. What specific aspect would you like to explore?`,
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="flex min-h-screen flex-col bg-dark-900">
      <Navbar />
      <main className="flex-1 container py-8">
        <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col bg-dark-800 border-dark-700">
          <CardHeader className="bg-dark-700 text-white border-b border-dark-600">
            <CardTitle className="flex items-center gap-2">
              <span className="text-yellow-500">DevCollab</span> AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-yellow-500 text-black"
                      : "bg-dark-700 text-white border border-dark-600"
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-dark-700 text-white border border-dark-600">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse delay-150"></div>
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-dark-600 p-4">
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-dark-700 border-dark-600 text-white placeholder:text-gray-400"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-yellow-500 text-black hover:bg-yellow-400"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

