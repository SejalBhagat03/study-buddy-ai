import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import api from "@/api";
import {
  MessageCircle,
  FileText,
  HelpCircle,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await api.get("/quizzes");
        setQuizzes(data.data || []);
      } catch (err) {
        console.error("Dashboard quiz fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchQuizzes();
  }, [user]);

  // Derive stats dynamically
  const completedQuizzes = quizzes.filter((q) => q.completed_at).length;
  const totalScore = quizzes.reduce((acc, q) => acc + (q.score || 0), 0);
  const totalQuestions = quizzes.reduce((acc, q) => acc + (q.total_questions || 0), 0);
  const averageScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  const actions = [
    { label: "Start Quiz", icon: HelpCircle, path: "/quiz", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Ask AI", icon: MessageCircle, path: "/chat", color: "text-sky-600", bg: "bg-sky-500/10 border-sky-500/20" },
    { label: "Flashcards", icon: Layers, path: "/flashcards", color: "text-pink-600", bg: "bg-pink-500/10 border-pink-500/20" },
    { label: "Summaries", icon: FileText, path: "/summaries", color: "text-indigo-600", bg: "bg-indigo-500/10 border-indigo-500/20" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-transparent">
        <Sidebar className="absolute z-50 md:relative" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent relative overflow-hidden">
      {/* Ambient ambient effects */}
      <div className="absolute top-1/4 -left-12 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl animate-pulse" />

      <Sidebar className="absolute z-50 md:relative" />
      
      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 relative z-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto flex flex-col justify-center min-h-[80vh]">
          
          {/* Welcome & Prompt Header */}
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
              Welcome back, {user?.email ? user.email.split('@')[0] : "Student"} 👋
            </h1>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              What would you like to do today?
            </h2>
            <p className="text-xs text-slate-500 font-medium">Choose an action to continue your learning journey.</p>
          </div>

          {/* Quick Actions Grid Rows (Direct Workflow Buttons) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in animation-delay-200">
            {actions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="glass-card p-5 rounded-xl border border-white/20 shadow-soft flex flex-col items-center justify-center text-center gap-3 hover:scale-[1.04] active:scale-95 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-xl ${action.bg} border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-xs font-extrabold text-slate-700 group-hover:text-primary transition-colors">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Progress Insights Bar (Minimal & Clean) Accordance */}
          <div className="bg-white/30 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-sm mb-6 flex items-center justify-between animate-fade-in animation-delay-400">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-1.5 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-white/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 flex-1">
                <span className="text-[11px] font-bold text-slate-600 leading-relaxed">
                  You completed <span className="text-slate-800 font-extrabold">{completedQuizzes}</span> quizzes so far • 
                  Avg score: <span className="text-slate-800 font-extrabold">{averageScore}%</span>
                </span>
                
                {/* Visual Progress Line */}
                <div className="w-full md:w-32 h-1.5 bg-slate-100/80 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse-soft" style={{ width: `${averageScore}%` }} />
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate("/analytics")}
              className="flex items-center gap-1 text-[10px] font-extrabold text-primary hover:underline cursor-pointer"
            >
              Full Stats <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Smart Context Tip (Simple support overlay) */}
          <div className="glass-card-gradient p-5 rounded-xl border border-white/10 shadow-soft hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-300 animate-fade-in animation-delay-600 border-l-4 border-l-primary flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary animate-float" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-0.5">Quick Learning Tip</h4>
              <p className="text-[10px] text-slate-500 font-semibold max-w-md">
                Did you know? Taking a 5-minute break every 25 minutes (Pomodoro technique) helps retain 80% more information and increases overall mental stamina.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
