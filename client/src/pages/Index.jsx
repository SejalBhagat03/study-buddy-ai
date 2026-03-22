import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  MessageCircle,
  GraduationCap,
  FileText,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Users,
  Clock,
  Brain,
  Upload,
} from "lucide-react";

// Animated Counter Sub-component
function AnimatedCounter({ value, duration = 2000, suffix = "" }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime;
    let animationFrame;

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      setCount(Math.floor(percentage * value));

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, hasStarted]);

  return <span ref={countRef}>{count.toLocaleString()}{suffix}</span>;
}

const features = [
  {
    icon: MessageCircle,
    title: "AI Chat",
    description: "Get instant answers and clear explanations with AI assistance.",
    iconColor: "text-primary",
  },
  {
    icon: GraduationCap,
    title: "Teacher Mode",
    description: "Engage in an interactive dialogue to master complex topics deeply.",
    iconColor: "text-secondary",
  },
  {
    icon: FileText,
    title: "Summaries",
    description: "Generate structured summaries and key notes from your study materials.",
    iconColor: "text-accent",
  },
];

const stats = [
  { label: "Active Students", value: 12500, suffix: "+", icon: Users, color: "from-blue-400/20 to-cyan-400/10 text-cyan-600" },
  { label: "Quizzes Generated", value: 45000, suffix: "+", icon: Brain, color: "from-purple-400/20 to-pink-400/10 text-pink-600" },
  { label: "Study Hours Saved", value: 8500, suffix: "h", icon: Clock, color: "from-emerald-400/20 to-teal-400/10 text-emerald-600" },
];

const steps = [
  {
    number: "01",
    title: "Upload Materials",
    description: "Upload your notes, PDFs, or drop learning links directly into your workspace.",
    icon: Upload,
    color: "from-primary/30 to-primary/10",
    iconColor: "text-primary",
  },
  {
    number: "02",
    title: "AI Analysis",
    description: "Our AI analyzes your content to generate structured insights, summaries, and quizzes.",
    icon: Sparkles,
    color: "from-secondary/30 to-secondary/10",
    iconColor: "text-secondary",
  },
  {
    number: "03",
    title: "Master Concepts",
    description: "Learn interactively with your AI tutor and master weak points faster.",
    icon: GraduationCap,
    color: "from-accent/30 to-accent/10",
    iconColor: "text-accent",
  },
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Typing Effect State
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const phrases = [
    "Learn smarter with AI",
    "Track your progress easily",
    "Boost your productivity"
  ];

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let timer;
    const handleTyping = () => {
      const currentPhrase = phrases[textIndex];
      if (isDeleting) {
        setDisplayText((prev) => prev.slice(0, -1));
        if (displayText === "") {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % phrases.length);
        }
      } else {
        setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        if (displayText === currentPhrase) {
          timer = setTimeout(() => setIsDeleting(true), 2000);
          return;
        }
      }
    };

    if (!timer) {
      timer = setTimeout(handleTyping, isDeleting ? 40 : 80);
    }
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, textIndex]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative overflow-hidden">
      {/* Background Ambient Layers */}
      <div className="absolute top-1/4 -left-12 w-64 h-64 bg-primary/20 rounded-full filter blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-secondary/20 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full filter blur-3xl animate-blob animation-delay-4000" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/30 backdrop-blur-xl border-b border-white/10 shadow-soft">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-r from-primary to-secondary rounded-lg shadow-soft">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">StudyMate</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-slate-700 text-xs font-semibold" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button className="font-semibold text-xs rounded-xl px-5" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 relative z-10">
        <div className="container mx-auto max-w-3xl flex items-center justify-center">
          <div className="glass-card-gradient p-14 text-center rounded-3xl animate-fade-in w-full max-w-2xl relative">
            <Sparkles className="absolute top-6 right-6 w-5 h-5 text-primary opacity-60 animate-float" />
            <BookOpen className="absolute bottom-10 left-6 w-6 h-6 text-secondary opacity-50 animate-float animation-delay-2000" />

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1F2937] mb-3 leading-tight gradient-text">
              Study Smarter, Not Harder
            </h1>
            {/* Dynamic Typing Text */}
            <p className="min-h-[24px] text-sm md:text-base font-bold text-primary mb-6 flex items-center justify-center tracking-wide">
              <span>{displayText}</span>
              <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse" />
            </p>

            <p className="text-xs md:text-sm text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
              Your AI-powered workspace to simplify learning, answer questions instantly, and stay organized.
            </p>

            <div className="flex justify-center">
              <Button size="lg" className="rounded-xl px-8 font-extrabold text-sm group shadow-glow" onClick={() => navigate("/auth")}>
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-80 cursor-pointer" onClick={() => {
          document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' });
        }}>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider">LEARN MORE</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </section>

      {/* Stats Section (NEW) */}
      <section id="stats-section" className="py-20 px-6 bg-gradient-to-b from-transparent to-white/10 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="glass-card p-6 flex items-center gap-4 rounded-2xl animate-fade-in hover:scale-105 transition-all duration-300 shadow-soft"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0 border border-white/30 shadow-sm`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-800">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subtle Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent relative z-10" />

      {/* How It Works Section (NEW Alternate Layout) */}
      <section className="py-24 px-6 bg-gradient-to-b from-white/10 to-transparent relative z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
              How It Works
            </h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Three simple steps to supercharge your learning with AI.
            </p>
          </div>

          <div className="space-y-16">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 animate-fade-in ${
                  i % 2 !== 0 ? "md:flex-row-reverse" : ""
                }`}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {/* Visual Step Card */}
                <div className="w-full md:w-1/2 flex justify-center">
                  <div className={`w-64 h-64 rounded-3xl bg-gradient-to-br ${step.color} border border-white/20 shadow-soft flex items-center justify-center relative overflow-hidden group hover:scale-105 transition-all duration-300`}>
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                    <span className="absolute top-4 left-4 text-4xl font-extrabold text-white/40">{step.number}</span>
                    <step.icon className={`w-20 h-20 ${step.iconColor} relative z-10 animate-float`} />
                  </div>
                </div>

                {/* Text Content */}
                <div className="w-full md:w-1/2 text-center md:text-left">
                  <span className="text-xs font-bold text-primary tracking-wider uppercase mb-2 block">{`Step ${step.number}`}</span>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-md mx-auto md:mx-0">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subtle Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent relative z-10" />

      {/* Features Section */}
      <section className="py-24 px-6 bg-transparent relative z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Everything You Need to Excel
            </h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Everything you need to study smarter and excel with AI assistance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="glass-card-gradient p-6 flex flex-col items-center text-center animate-fade-in group cursor-pointer"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 border border-white/40 shadow-soft group-hover:scale-110 group-hover:shadow-glow transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-secondary transition-colors duration-300" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1.5 transition-colors group-hover:text-primary">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner (NEW) */}
      <section className="py-24 px-6 relative z-10">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-12 text-center text-white shadow-elevated relative overflow-hidden group">
            {/* Ambient Overlay inside Banner */}
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm opacity-50 group-hover:opacity-40 transition-opacity" />
            <Sparkles className="absolute top-6 left-6 w-12 h-12 text-white/30 animate-float" />
            <BookOpen className="absolute bottom-6 right-6 w-16 h-16 text-white/20 animate-float animation-delay-2000" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight leading-tight">
                Ready to Supercharge Your Studies?
              </h2>
              <p className="text-xs md:text-sm text-white/90 mb-8 max-w-md mx-auto leading-relaxed">
                Join thousands of students improving their learning and mastering exams with AI.
              </p>
              <Button size="lg" className="bg-white hover:bg-white/90 text-primary rounded-xl px-8 font-extrabold text-sm shadow-md hover:scale-105 transition-all" onClick={() => navigate("/auth")}>
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-white/10 bg-white/20 backdrop-blur-md relative z-10">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gradient-to-r from-primary to-secondary rounded-md shadow-soft">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-xs text-slate-800">StudyMate</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            © 2026 StudyMate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
