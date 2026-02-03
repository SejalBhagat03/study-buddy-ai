import { useRef, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Trash2, GraduationCap, MessageCircle } from "lucide-react";

const teacherStarters = [
  "Explain opportunity cost with a simple example",
  "What should I know about market structures for my exam?",
  "Can you help me understand elasticity?",
  "I'm confused about monetary policy",
];

export default function Teacher() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat({
    mode: "teacher",
    studyContent: `
    Economics Exam Topics:
    
    1. Microeconomics:
    - Supply and Demand curves
    - Price elasticity
    - Market structures (Perfect competition, Monopoly, Oligopoly)
    - Consumer and Producer surplus
    
    2. Macroeconomics:
    - GDP and economic growth
    - Unemployment types and causes
    - Inflation and deflation
    - Monetary and Fiscal policy
    - International trade
    
    3. Key formulas:
    - Elasticity = % change in quantity / % change in price
    - GDP = C + I + G + (X - M)
    - Multiplier = 1 / (1 - MPC)
    `,
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-16 lg:pt-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-400 rounded-xl">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">Teacher Mode</h1>
                <p className="text-xs text-muted-foreground">
                  Interactive dialogue with Professor Study
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                New session
              </Button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Chat with Professor Study
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Have an interactive learning conversation. Ask doubts, get explanations, and learn like you're in a real classroom.
                </p>

                <div className="flex flex-wrap justify-center gap-2">
                  {teacherStarters.map((question) => (
                    <button
                      key={question}
                      onClick={() => sendMessage(question)}
                      className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-violet-50 dark:bg-violet-500/10 rounded-xl max-w-md mx-auto">
                  <p className="text-sm text-violet-700 dark:text-violet-300">
                    💡 <strong>Tip:</strong> The teacher will ask follow-up questions to check your understanding!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {isLoading && messages[messages.length - 1]?.role !== "teacher" && (
                  <TypingIndicator />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSend={sendMessage}
              disabled={isLoading}
              placeholder="Ask your teacher..."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
