import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  GraduationCap,
  FileText,
  Sparkles,
  TrendingUp,
  Clock,
  BookOpen,
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

const quickStats = [
  { icon: BookOpen, label: "Chapters", value: "3" },
  { icon: Clock, label: "Study Time", value: "2.5h" },
  { icon: TrendingUp, label: "Progress", value: "65%" },
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

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card rounded-xl p-4 border border-border shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {features.map((feature) => (
              <button
                key={feature.title}
                onClick={() => navigate(feature.path)}
                className="group bg-card rounded-2xl p-6 border border-border shadow-soft hover:shadow-elevated transition-all duration-300 text-left hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center text-primary text-sm font-medium">
                  Get started
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
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
