import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, Trophy, Layers, StickyNote, 
  TrendingUp, Calendar, Target, Loader2, 
  Sparkles, PlusCircle, ArrowRight
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Mini SVG Progress Ring Sub-component
function MiniProgressRing({ percentage, colorClass }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg className="w-8 h-8 transform -rotate-90 shrink-0">
      <circle className="text-slate-200/40" strokeWidth="3.5" stroke="currentColor" fill="transparent" r={radius} cx="16" cy="16" />
      <circle className={colorClass} strokeWidth="3.5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="16" cy="16" />
    </svg>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [flashcardStats, setFlashcardStats] = useState({ total: 0, reviewed: 0, mastered: 0 });
  const [notesCount, setNotesCount] = useState(0);
  const [chaptersCount, setChaptersCount] = useState(0);
  const [selectedKpi, setSelectedKpi] = useState(null);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: quizzesRes } = await api.get("/quizzes");
      const quizzesData = quizzesRes.data || [];
      setQuizzes(quizzesData);

      const { data: flashcardsRes } = await api.get("/flashcards");
      const flashcardsData = flashcardsRes.data || [];
      setFlashcardStats({ 
        total: flashcardsData.length, 
        reviewed: flashcardsData.filter((f) => f.review_count > 0).length, 
        mastered: flashcardsData.filter((f) => f.difficulty >= 3).length 
      });

      const { data: notesRes } = await api.get("/notes");
      setNotesCount(notesRes.data?.length || 0);

      const { data: chaptersRes } = await api.get("/chapters");
      setChaptersCount(chaptersRes.data?.length || 0);
    } catch (error) { 
      console.error("Failed to fetch analytics:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter((q) => q.completed_at).length;
  const averageScore = completedQuizzes > 0 ? Math.round(quizzes.filter((q) => q.score !== null).reduce((acc, q) => acc + ((q.score || 0) / q.total_questions) * 100, 0) / completedQuizzes) : 0;
  const quizChartData = quizzes.filter((q) => q.completed_at && q.score !== null).slice(0, 10).reverse().map((q, i) => ({ name: `Quiz ${i + 1}`, score: Math.round(((q.score || 0) / q.total_questions) * 100) }));
  const activityData = [{ name: "Chapters", count: chaptersCount }, { name: "Quizzes", count: totalQuizzes }, { name: "Cards", count: flashcardStats.total }, { name: "Notes", count: notesCount }];

  const getInsight = () => {
    if (completedQuizzes === 0) return "Start your first quiz to unlock personalized learning insights and track your trends.";
    if (averageScore > 80) return "Excellent work! Your average score is above 80%. Consider increasing quiz difficulty to test layouts nodes limits.";
    if (flashcardStats.total > 0 && flashcardStats.reviewed === 0) return "You have unreviewed flashcards. Consistent review improves retention visual guides framing updates offsets correctly.";
    return "Keep up the great work! Consistent daily study is the key to mastering concepts framing setups offsets loops setups.";
  };

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

  const kpis = [
    { id: 'score', label: "Avg Score", value: `${averageScore}%`, icon: Trophy, color: "text-amber-500", borderColor: "border-t-[#FCD34D]", countValue: averageScore },
    { id: 'quizzes', label: "Quizzes", value: completedQuizzes, icon: Target, color: "text-violet-500", borderColor: "border-t-[#C084FC]", countValue: completedQuizzes > 0 ? 100 : 0 },
    { id: 'flashcards', label: "Mastered", value: flashcardStats.mastered, icon: Layers, color: "text-emerald-500", borderColor: "border-t-[#34D399]", countValue: flashcardStats.total > 0 ? Math.round((flashcardStats.mastered / flashcardStats.total) * 100) : 0 },
    { id: 'notes', label: "Notes", value: notesCount, icon: StickyNote, color: "text-sky-500", borderColor: "border-t-[#38BDF8]", countValue: notesCount > 0 ? 100 : 0 },
  ];

  return (
    <div className="flex min-h-screen bg-transparent relative overflow-hidden">
      {/* Background Ambient Layers */}
      <div className="absolute top-1/4 -left-12 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl animate-blob animation-delay-2000" />

      <Sidebar className="absolute z-50 md:relative" />
      
      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 relative z-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Greeting Overlay */}
          <div className="mb-4 animate-fade-in">
            <h1 className="text-xl font-bold text-slate-800">
              Welcome back, {user?.email ? user.email.split('@')[0] : "Student"}!
            </h1>
            <p className="text-xs text-slate-500 font-medium">Here’s your learning progress overview.</p>
          </div>

          <PageHeader 
            icon={BarChart3} 
            title="Study Analytics" 
            subtitle="Track your learning progress and performance metrics." 
            bgClass="bg-[#C7D2FE]/20" 
            iconClass="text-indigo-800" 
            borderClass="border-[#C7D2FE]/30"
          />

          {/* Smart Insights Panel */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-5 mb-6 text-white shadow-elevated relative overflow-hidden group animate-fade-in border border-white/20">
            <div className="absolute inset-0 bg-black/5 backdrop-blur-sm opacity-50 group-hover:opacity-40 transition-opacity" />
            <Sparkles className="absolute top-4 right-4 w-10 h-10 text-white/30 animate-float" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold mb-0.5 tracking-wide">Smart Learning Insight</h3>
                <p className="text-[11px] text-white/90 leading-relaxed max-w-lg">{getInsight()}</p>
              </div>
            </div>
          </div>

          {/* Bento Grid (NEW Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            
            {/* Primary Card - Avg Score (Large 2x2 style) */}
            <div 
              onClick={() => setSelectedKpi(selectedKpi === 'score' ? null : 'score')}
              className={`md:col-span-2 md:row-span-2 glass-card-gradient p-8 rounded-2xl cursor-pointer animate-fade-in hover:scale-[1.02] transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                selectedKpi === 'score' ? 'scale-[1.02] shadow-glow border-b-2 border-b-primary' : ''
              }`}
            >
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm text-amber-500 animate-float">
                <Trophy className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Overall Performance</p>
                <h3 className="text-4xl font-extrabold text-slate-800 flex items-baseline gap-1">
                  {averageScore}<span className="text-2xl font-bold text-slate-400">%</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Average score across all completed quizzes.</p>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">Accuracy Goal</span>
                  <span className="text-xs font-bold text-slate-600">80%</span>
                </div>
                <div className="w-full h-2 bg-slate-100/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-pulse-soft" style={{ width: `${Math.min(averageScore, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Quizzes Completed - Standard 1x1 */}
            <div 
              onClick={() => setSelectedKpi(selectedKpi === 'quizzes' ? null : 'quizzes')}
              className={`glass-card p-5 rounded-xl border-t-2 border-t-[#C084FC] cursor-pointer animate-fade-in hover:scale-105 transition-all shadow-soft flex items-center justify-between ${
                selectedKpi === 'quizzes' ? 'scale-105 shadow-glow border-b-2 border-b-primary' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 border border-white/30 text-violet-500">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-slate-800">{completedQuizzes}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quizzes</p>
                </div>
              </div>
              <MiniProgressRing percentage={completedQuizzes > 0 ? 100 : 0} colorClass="text-violet-500" />
            </div>

            {/* Flashcards Mastered - Standard 1x1 */}
            <div 
              onClick={() => setSelectedKpi(selectedKpi === 'flashcards' ? null : 'flashcards')}
              className={`glass-card p-5 rounded-xl border-t-2 border-t-[#34D399] cursor-pointer animate-fade-in hover:scale-105 transition-all shadow-soft flex items-center justify-between ${
                selectedKpi === 'flashcards' ? 'scale-105 shadow-glow border-b-2 border-b-primary' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-white/30 text-emerald-500">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-slate-800">{flashcardStats.mastered}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mastered</p>
                </div>
              </div>
              {flashcardStats.total > 0 && (
                <MiniProgressRing percentage={Math.round((flashcardStats.mastered / flashcardStats.total) * 100)} colorClass="text-emerald-500" />
              )}
            </div>

            {/* Notes Count - Wide Banner Card at Bottom */}
            <div 
              onClick={() => setSelectedKpi(selectedKpi === 'notes' ? null : 'notes')}
              className={`md:col-span-3 glass-card p-5 rounded-xl border-t-2 border-t-[#38BDF8] cursor-pointer animate-fade-in hover:scale-105 transition-all shadow-soft flex items-center justify-between ${
                selectedKpi === 'notes' ? 'scale-105 shadow-glow border-b-2 border-b-primary' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-sky-500/10 border border-white/30 text-sky-500">
                  <StickyNote className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-slate-800">{notesCount} <span className="text-slate-400 text-xs font-medium">Notes Available</span></h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Keep creating and reviewing notes to reinforce learning</p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); navigate("/notes"); }}
                className="flex items-center gap-1.5 text-sky-600 font-bold text-xs group hover:text-sky-700 transition-colors"
              >
                Review Notes <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

          {/* Chart Section Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Quiz Performance Chart */}
            <div className="glass-card p-6 rounded-2xl border border-white/20 shadow-soft animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Quiz Performance</h3>
                </div>
              </div>
              
              <div className="h-[200px]">
                {quizChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={quizChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '12px', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }} 
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "white", stroke: "hsl(var(--primary))", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <BarChart3 className="w-8 h-8 opacity-40 animate-float" />
                    <p className="text-xs font-semibold">No quiz data yet</p>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg border-primary/30 text-primary h-px-1 px-3 mt-1" onClick={() => navigate("/quiz")}>
                      Start First Quiz <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Chart */}
            <div className="glass-card p-6 rounded-2xl border border-white/20 shadow-soft animate-fade-in animation-delay-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-secondary/10 text-secondary">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Overall Activity</h3>
                </div>
              </div>
              
              <div className="h-[200px]">
                {chaptersCount > 0 || totalQuizzes > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '12px', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }} 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Calendar className="w-8 h-8 opacity-40 animate-float" />
                    <p className="text-xs font-semibold">No activity recorded</p>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg border-primary/30 text-primary h-px-1 px-3 mt-1" onClick={() => navigate("/dashboard")}>
                      Get Started <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
