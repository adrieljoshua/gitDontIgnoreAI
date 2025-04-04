"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Send } from "lucide-react"
import Navbar from "@/components/navbar"

type Question = {
  id: number
  question: string
  answer: string
}

export default function ChatPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, question: "What are we gonna build today?", answer: "" },
    { id: 2, question: "What is our project called?", answer: "" },
    { id: 3, question: "Kindly provide a detailed comprehensive description of all the features and components that you want in your project like modules and submodules?", answer: "" },
    { id: 4, question: "How much will you be funding for the project?", answer: "" },
    { id: 5, question: "Are you sure?", answer: "" }
  ])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    
    // Update the current question's answer
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex].answer = input
    setQuestions(updatedQuestions)
    
    setInput("")
    setIsLoading(false)

    // Move to next question if available
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const showNextQuestion = currentQuestionIndex < questions.length - 1

  return (
    <div className="flex min-h-screen flex-col bg-dark-900">
      <Navbar />
      <main className="flex-1 container py-8">
        <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col bg-dark-800 border-dark-700">
          <CardHeader className="bg-dark-700 text-white border-b border-dark-600">
            <CardTitle className="flex items-center gap-2">
              <span className="text-yellow-500">Project</span> Questionnaire
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className={`space-y-2 ${index > currentQuestionIndex ? 'hidden' : ''}`}>
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-dark-700 text-white border border-dark-600">
                    <p>{q.question}</p>
                  </div>
                </div>
                {q.answer && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg p-3 bg-yellow-500 text-black">
                      <p>{q.answer}</p>
                    </div>
                  </div>
                )}
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
                placeholder={currentQuestionIndex < questions.length ? `Answer: ${currentQuestion.question}` : "All questions completed"}
                className="flex-1 bg-dark-700 border-dark-600 text-white placeholder:text-gray-400"
                disabled={isLoading || currentQuestionIndex >= questions.length}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim() || currentQuestionIndex >= questions.length}
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

