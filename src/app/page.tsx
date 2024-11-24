'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"

type Message = {
  type: 'ai' | 'human';
  content: string;
  additional_kwargs: Record<string, unknown>;
  example?: boolean;
  isMarkdown?: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      content: 'Olá, em que posso ajudá-lo?',
      additional_kwargs: {},
      example: false,
      isMarkdown: false
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage: Message = {
      type: 'human',
      content: input,
      additional_kwargs: {},
      example: false,
      isMarkdown: false
    }

    setMessages(prev => [...prev, newMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ...messages,
          newMessage
        ]),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setMessages(prev => [...prev, {
        type: 'ai',
        content: '',
        additional_kwargs: {},
        example: false,
        isMarkdown: true
      }])

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Failed to get response reader')

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const decoder = new TextDecoder()
        const text = decoder.decode(value)
        
        const cleanedText = text
          .split('\n')
          .map(line => line.replace(/^data: /, ''))
          .filter(line => line.length > 0 && line !== ' ')
          .join('')

        accumulatedContent += cleanedText

        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            type: 'ai',
            content: accumulatedContent,
            additional_kwargs: {},
            example: false,
            isMarkdown: true
          }
        ])
      }

    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, there was an error processing your request.',
        additional_kwargs: {},
        example: false,
        isMarkdown: false
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">Firfingers Bot Cultural</h1>
        <ThemeToggle />
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((m, index) => (
            <div
              key={index}
              className={`flex ${m.type === 'human' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  m.type === 'human'
                    ? 'bg-blue-500 text-white dark:bg-blue-600'
                    : 'bg-gray-200 text-black dark:bg-gray-700 dark:text-white'
                }`}
              >
                {m.isMarkdown ? (
                  <ReactMarkdown className="prose dark:prose-invert max-w-none">
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

