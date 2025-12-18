import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Sparkles,
  MessageCircle,
  GraduationCap,
  FileText,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Interactive Q&A",
    description: "Ask questions and get instant, exam-focused explanations from AI",
  },
  {
    icon: GraduationCap,
    title: "Teacher Dialogue",
    description: "Learn through conversation with your AI economics professor",
  },
  {
    icon: FileText,
    title: "Smart Summaries",
    description: "Get slide-style summaries with key concepts and exam tips",
  },
];

const benefits = [
  "Simple, student-friendly explanations",
  "Exam-oriented answers",
  "Step-by-step breakdowns",
  "Available 24/7 for your studies",
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 study-gradient rounded-xl">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">StudyMate AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button variant="gradient" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Study Companion
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Master Economics with{" "}
            <span className="gradient-text">AI-Powered</span> Learning
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your personal study assistant that explains concepts simply, answers your doubts instantly, and helps you ace your exams.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="gradient" onClick={() => navigate("/auth")}>
              Start Learning Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Watch Demo
            </Button>
          </div>

          {/* Benefits list */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="w-4 h-4 text-accent" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              StudyMate combines the best of AI technology with proven learning methods
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl p-6 border border-border shadow-soft hover:shadow-elevated transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl study-gradient flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="study-gradient rounded-3xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Studies?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              Join thousands of students who are already learning smarter with AI-powered study tools.
            </p>
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={() => navigate("/auth")}
            >
              Get Started Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 study-gradient rounded-lg">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">StudyMate AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 StudyMate. Built for students, by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
