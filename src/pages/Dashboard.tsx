import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ProgressTracker } from "@/components/ProgressTracker";
import {
  MessageCircle,
  GraduationCap,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Study Chat",
    description: "Ask questions about your study materials and get instant explanations",
    path: "/chat",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: GraduationCap,
    title: "Teacher Mode",
    description: "Have an interactive dialogue with your AI teacher",
    path: "/teacher",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    icon: FileText,
    title: "Video Summary",
    description: "Get slide-style summaries with key concepts and exam tips",
    path: "/summaries",
    gradient: "from-emerald-500 to-teal-400",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI-Powered Learning</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to StudyMate
            </h1>
            <p className="text-muted-foreground">
              Your personal AI study companion for mastering Economics
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Feature Cards */}
            <div className="lg:col-span-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => (
                <button
                  key={feature.title}
                  onClick={() => navigate(feature.path)}
                  className="group bg-card rounded-2xl p-5 border border-border shadow-soft hover:shadow-elevated transition-all duration-300 text-left hover:-translate-y-1"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-primary text-sm font-medium">
                    Start
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>

            {/* Progress Tracker */}
            <div className="lg:col-span-1">
              <ProgressTracker />
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Getting Started
            </h2>
            <div className="space-y-3">
              {[
                "Upload your Economics chapter PDF to get started",
                "Ask questions in Study Chat for instant explanations",
                "Use Teacher Mode for interactive learning sessions",
                "Generate summaries for quick exam revision",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full study-gradient flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
            <Button variant="gradient" className="mt-6" onClick={() => navigate("/chat")}>
              Start Learning
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
