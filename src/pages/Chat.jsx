import { useRef, useEffect, useState } from "react";
 import { useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { YouTubeVideoForm } from "@/components/YouTubeVideoForm";
import { YouTubeVideosList } from "@/components/YouTubeVideosList";
import { PDFUpload } from "@/components/PDFUpload";
import { KnowledgeBasePanel } from "@/components/KnowledgeBasePanel";
import { StreakWidget } from "@/components/StreakWidget";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, BookOpen, Lightbulb, FileText, Video, Sparkles, Target, Brain, HelpCircle, ArrowRight, Upload, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const sampleQuestions = [
  "What is the law of supply and demand?",
  "Explain GDP and how it's calculated",
  "What causes inflation?",
  "Difference between micro and macro economics",
];

const studyFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Q&A",
    description: "Get instant, exam-focused explanations for any concept",
    color: "bg-pastel-purple/20",
  },
  {
    icon: Target,
    title: "Concept Breakdown",
    description: "Complex topics explained step-by-step",
    color: "bg-pastel-blue/20",
  },
  {
    icon: Sparkles,
    title: "Smart Summaries",
    description: "Key points and exam tips from your materials",
    color: "bg-pastel-pink/20",
  },
  {
    icon: HelpCircle,
    title: "Doubt Resolution",
    description: "Follow-up explanations until you understand",
    color: "bg-pastel-green/20",
  },
];

export default function Chat() {
  const { user } = useAuth();
  const [studyContent, setStudyContent] = useState("");
  const [showYouTube, setShowYouTube] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

   const fetchStudyContent = useCallback(async () => {
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
   }, [user]);

   useEffect(() => {
     fetchStudyContent();
  }, [user]);


  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

   const { messages, isLoading, sendMessage, clearMessages } = useChat({
     mode: "chat",
     studyContent,
   });
 
   const handleVideoAdded = async () => {
     await fetchStudyContent();
  };

  const handlePDFUploaded = async (chapterId, pdfContent) => {
    await handleVideoAdded();
    setShowPDF(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-16 lg:pt-0">
        {/* Header */}
        <header className="sticky top-0 z-10 glass-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="p-2.5 study-gradient rounded-xl shadow-soft">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">Study Chat</h1>
                <p className="text-xs text-muted-foreground">
                  AI-powered learning assistant
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showPDF ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowPDF(!showPDF);
                  setShowYouTube(false);
                }}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload PDF</span>
              </Button>
              <Button
                variant={showYouTube ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowYouTube(!showYouTube);
                  setShowPDF(false);
                }}
                className="gap-2"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Add Video</span>
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  className="text-muted-foreground hover:text-destructive gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* PDF Upload Form */}
          {showPDF && (
            <div className="max-w-5xl mx-auto mt-4 animate-fade-in">
              <PDFUpload onUploadComplete={handlePDFUploaded} />
            </div>
          )}

          {/* YouTube Form */}
          {showYouTube && (
            <div className="max-w-5xl mx-auto mt-4 p-4 bg-card rounded-xl border border-border space-y-4 animate-fade-in">
              <YouTubeVideoForm onSuccess={handleVideoAdded} />
              <YouTubeVideosList onUpdate={handleVideoAdded} />
            </div>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Streak Widget */}
            <StreakWidget />

            {/* Knowledge Base Panel */}
            <KnowledgeBasePanel studyContent={studyContent} />

            {messages.length === 0 ? (
              <div className="py-8 animate-fade-in">
                {/* Hero Section */}
                <div className="text-center mb-10">
                  <div className="w-20 h-20 rounded-3xl study-gradient flex items-center justify-center mx-auto mb-6 shadow-glow">
                    <Lightbulb className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
                    Your AI Study Partner
                  </h2>
                  <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    Upload study materials, ask questions, and master concepts with personalized explanations.
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  {studyFeatures.map((feature, index) => (
                    <div
                      key={feature.title}
                      className={cn(
                        "group p-5 rounded-2xl border border-border/50 bg-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1",
                        "animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                        feature.color
                      )}>
                        <feature.icon className="w-5 h-5 text-foreground" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1.5">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick Start */}
                <div className="glass-card rounded-2xl p-6">
                  <p className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Try asking something
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sampleQuestions.map((question, index) => (
                      <button
                        key={question}
                        onClick={() => sendMessage(question)}
                        className={cn(
                          "group px-4 py-2.5 text-sm bg-secondary/50 hover:bg-primary hover:text-primary-foreground text-foreground rounded-xl transition-all duration-200 flex items-center gap-2",
                          "animate-fade-in"
                        )}
                        style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                      >
                        {question}
                        <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                  </div>
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
        <div className="sticky bottom-0 glass-card border-t border-border p-4">
          <div className="max-w-5xl mx-auto">
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
