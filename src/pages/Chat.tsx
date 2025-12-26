import { useRef, useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { YouTubeVideoForm } from "@/components/YouTubeVideoForm";
import { YouTubeVideosList } from "@/components/YouTubeVideosList";
import { PDFUpload } from "@/components/PDFUpload";
import { KnowledgeBasePanel } from "@/components/KnowledgeBasePanel";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, BookOpen, Lightbulb, FileText, Video, Sparkles, Target, Brain, HelpCircle } from "lucide-react";

const sampleQuestions = [
  "What is the law of supply and demand?",
  "Explain GDP and how it's calculated",
  "What causes inflation?",
  "Difference between micro and macro economics",
];

// Study partner features displayed when empty
const studyFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Q&A",
    description: "Ask any question about your study materials and get instant, exam-focused explanations",
  },
  {
    icon: Target,
    title: "Concept Breakdown",
    description: "Complex topics explained step-by-step in simple, student-friendly language",
  },
  {
    icon: Sparkles,
    title: "Smart Summaries",
    description: "Generate key points, definitions, and exam tips from PDFs and videos",
  },
  {
    icon: HelpCircle,
    title: "Doubt Resolution",
    description: "Get follow-up explanations until you fully understand the concept",
  },
];

export default function Chat() {
  const { user } = useAuth();
  const [studyContent, setStudyContent] = useState("");
  const [showYouTube, setShowYouTube] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  // Fetch videos and chapters on mount to include in study content
  useEffect(() => {
    const fetchContent = async () => {
      if (!user) return;

      let content = `
      Economics is a social science that studies how people interact with value, particularly the production, distribution, and consumption of goods and services.
      
      Key concepts include:
      - Supply and Demand: The relationship between the availability of a product and the desire for it
      - GDP (Gross Domestic Product): Total value of goods and services produced in a country
      - Inflation: The rate at which prices increase over time
      - Market Equilibrium: The point where supply equals demand
      - Opportunity Cost: The value of the next best alternative foregone
      
      Microeconomics focuses on individual agents and markets.
      Macroeconomics studies the economy as a whole.
      `;

      // Fetch user's videos
      const { data: videos } = await supabase
        .from("videos")
        .select("title, transcript")
        .eq("user_id", user.id);

      if (videos && videos.length > 0) {
        const videosWithTranscripts = videos.filter(v => v.transcript && v.transcript.trim().length > 0);
        if (videosWithTranscripts.length > 0) {
          content += "\n\n=== YOUTUBE VIDEO TRANSCRIPTS ===\n";
          videosWithTranscripts.forEach((video) => {
            content += `\n--- Video: ${video.title} ---\n${video.transcript}\n`;
          });
        }
      }

      // Fetch user's chapters (PDFs)
      const { data: chapters } = await supabase
        .from("chapters")
        .select("title, content")
        .eq("user_id", user.id);

      if (chapters && chapters.length > 0) {
        const chaptersWithContent = chapters.filter(c => c.content && c.content.trim().length > 0);
        if (chaptersWithContent.length > 0) {
          content += "\n\n=== UPLOADED PDF DOCUMENTS ===\n";
          chaptersWithContent.forEach((chapter) => {
            content += `\n--- Document: ${chapter.title} ---\n${chapter.content}\n`;
          });
        }
      }

      setStudyContent(content);
    };

    fetchContent();
  }, [user]);

  const { messages, isLoading, sendMessage, clearMessages } = useChat({
    mode: "chat",
    studyContent,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleVideoAdded = async () => {
    // Refetch all content when a video is added
    if (!user) return;
    
    let content = `
    Economics is a social science that studies how people interact with value, particularly the production, distribution, and consumption of goods and services.
    
    Key concepts include:
    - Supply and Demand: The relationship between the availability of a product and the desire for it
    - GDP (Gross Domestic Product): Total value of goods and services produced in a country
    - Inflation: The rate at which prices increase over time
    - Market Equilibrium: The point where supply equals demand
    - Opportunity Cost: The value of the next best alternative foregone
    
    Microeconomics focuses on individual agents and markets.
    Macroeconomics studies the economy as a whole.
    `;

    const { data: videos } = await supabase
      .from("videos")
      .select("title, transcript")
      .eq("user_id", user.id);

    if (videos && videos.length > 0) {
      const videosWithTranscripts = videos.filter(v => v.transcript && v.transcript.trim().length > 0);
      if (videosWithTranscripts.length > 0) {
        content += "\n\n=== YOUTUBE VIDEO TRANSCRIPTS ===\n";
        videosWithTranscripts.forEach((video) => {
          content += `\n--- Video: ${video.title} ---\n${video.transcript}\n`;
        });
      }
    }

    const { data: chapters } = await supabase
      .from("chapters")
      .select("title, content")
      .eq("user_id", user.id);

    if (chapters && chapters.length > 0) {
      const chaptersWithContent = chapters.filter(c => c.content && c.content.trim().length > 0);
      if (chaptersWithContent.length > 0) {
        content += "\n\n=== UPLOADED PDF DOCUMENTS ===\n";
        chaptersWithContent.forEach((chapter) => {
          content += `\n--- Document: ${chapter.title} ---\n${chapter.content}\n`;
        });
      }
    }

    setStudyContent(content);
  };

  const handlePDFUploaded = async (chapterId: string, pdfContent: string) => {
    // Refetch all content when PDF is uploaded
    await handleVideoAdded();
    setShowPDF(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-16 lg:pt-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 study-gradient rounded-xl">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">Study Chat</h1>
                <p className="text-xs text-muted-foreground">
                  Your AI Study Partner
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPDF(!showPDF);
                  setShowYouTube(false);
                }}
              >
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowYouTube(!showYouTube);
                  setShowPDF(false);
                }}
              >
                <Video className="w-4 h-4 mr-1" />
                Video
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* PDF Upload Form */}
          {showPDF && (
            <div className="max-w-4xl mx-auto mt-4">
              <PDFUpload onUploadComplete={handlePDFUploaded} />
            </div>
          )}

          {/* YouTube Form */}
          {showYouTube && (
            <div className="max-w-4xl mx-auto mt-4 p-4 bg-card rounded-xl border border-border space-y-4">
              <YouTubeVideoForm onSuccess={handleVideoAdded} />
              <YouTubeVideosList onUpdate={handleVideoAdded} />
            </div>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Knowledge Base Panel - Always visible */}
            <KnowledgeBasePanel studyContent={studyContent} />

            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl study-gradient flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Your AI Study Partner
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  I can help you understand your study materials. Upload PDFs or add YouTube videos, then ask me anything!
                </p>

                {/* Study Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-6">
                  {studyFeatures.map((feature) => (
                    <div
                      key={feature.title}
                      className="p-4 bg-secondary/30 rounded-xl border border-border text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <feature.icon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{feature.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>

                {/* Sample Questions */}
                <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {sampleQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => sendMessage(question)}
                      className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full transition-colors"
                    >
                      {question}
                    </button>
                  ))}
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
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
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
              placeholder="Ask about your study materials..."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
