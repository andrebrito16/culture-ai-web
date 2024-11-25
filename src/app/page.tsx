'use client'

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

type Message = {
  type: 'ai' | 'human';
  content: string;
  additional_kwargs: Record<string, unknown>;
  example?: boolean;
  isMarkdown?: boolean;
  URL3D?: string;
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
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setMessages(prev => [...prev, {
        type: 'ai',
        content: '',
        additional_kwargs: {},
        example: false,
        isMarkdown: true
      }]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to get response reader');

      let accumulatedContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5).trim());

              if (data.type === 'url') {
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  {
                    ...prev[prev.length - 1],
                    URL3D: data.content
                  }
                ]);
              } else if (data.type === 'message') {
                accumulatedContent += data.content;

                setMessages(prev => [
                  ...prev.slice(0, -1),
                  {
                    ...prev[prev.length - 1],
                    content: accumulatedContent
                  }
                ]);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
              const cleanedLine = line.replace(/^data: /, '').trim();
              if (cleanedLine) {
                accumulatedContent += cleanedLine;
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  {
                    ...prev[prev.length - 1],
                    content: accumulatedContent
                  }
                ]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, there was an error processing your request.',
        additional_kwargs: {},
        example: false,
        isMarkdown: false
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">Firefingers Bot Cultural</h1>
        <ThemeToggle />
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((m, index) => (
            <div key={index}>
              <div
                key={index}
                className={`flex ${m.type === 'human' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${m.type === 'human'
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
              {
                m.URL3D && (
                  <div className='flex flex-col gap-2 mt-2 ml-1'>
                    <p className="font-thin max-w-[60%]">Oferecemos essa obra de maneira interativa em 3D, clique no botão abaixo para visualizar.</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="max-w-[40%]" variant="outline">Visualizar obra em 3D</Button>
                      </DialogTrigger>
                      <DialogContent style={{
                        maxWidth: '95vw',
                        maxHeight: '100vh',
                      }} className="flex flex-col sm:max-w-[425px] max-w-3/4 h-3/4">
                        <DialogHeader className="px-0 py-0">
                          <DialogTitle>Obra em 3D</DialogTitle>
                          <DialogDescription>
                            Você pode interagir com essa obra em 3D.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex h-full">
                          <iframe
                          
                            src={m.URL3D}
                            className="w-full h-full"
                            title="3D model"
                          />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )
              }
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

