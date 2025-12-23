import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3,
  Trophy,
  Layers,
  StickyNote,
  TrendingUp,
  Calendar,
  Target,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface QuizResult {
  id: string;
  title: string;
  score: number | null;
  total_questions: number;
  completed_at: string | null;
}

interface FlashcardStats {
  total: number;
  reviewed: number;
  mastered: number;
}

interface DailyActivity {
  date: string;
  quizzes: number;
  flashcards: number;
  notes: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats>({
    total: 0,
    reviewed: 0,
    mastered: 0,
  });
  const [notesCount, setNotesCount] = useState(0);
  const [chaptersCount, setChaptersCount] = useState(0);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch quizzes
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("id, title, score, total_questions, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      setQuizzes(quizzesData || []);

      // Fetch flashcard stats
      const { data: flashcardsData } = await supabase
        .from("flashcards")
        .select("id, review_count, difficulty")
        .eq("user_id", user.id);

      if (flashcardsData) {
        setFlashcardStats({
          total: flashcardsData.length,
          reviewed: flashcardsData.filter((f) => f.review_count > 0).length,
          mastered: flashcardsData.filter((f) => f.difficulty >= 3).length,
        });
      }

      // Fetch notes count
      const { count: notesTotal } = await supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setNotesCount(notesTotal || 0);

      // Fetch chapters count
      const { count: chaptersTotal } = await supabase
        .from("chapters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setChaptersCount(chaptersTotal || 0);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter((q) => q.completed_at).length;
  const averageScore =
    completedQuizzes > 0
      ? Math.round(
          quizzes
            .filter((q) => q.score !== null)
            .reduce((acc, q) => acc + ((q.score || 0) / q.total_questions) * 100, 0) /
            completedQuizzes
        )
      : 0;

  // Prepare chart data for quiz scores over time
  const quizChartData = quizzes
    .filter((q) => q.completed_at && q.score !== null)
    .slice(0, 10)
    .reverse()
    .map((q, i) => ({
      name: `Quiz ${i + 1}`,
      score: Math.round(((q.score || 0) / q.total_questions) * 100),
    }));

  // Study activity by category
  const activityData = [
    { name: "Chapters", count: chaptersCount, color: "hsl(var(--primary))" },
    { name: "Quizzes", count: totalQuizzes, color: "hsl(220, 80%, 55%)" },
    { name: "Flashcards", count: flashcardStats.total, color: "hsl(260, 60%, 55%)" },
    { name: "Notes", count: notesCount, color: "hsl(165, 60%, 45%)" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-400 rounded-xl">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Study Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Track your learning progress and performance
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{averageScore}%</p>
                    <p className="text-xs text-muted-foreground">Avg Quiz Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Target className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedQuizzes}</p>
                    <p className="text-xs text-muted-foreground">Quizzes Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Layers className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{flashcardStats.mastered}</p>
                    <p className="text-xs text-muted-foreground">Cards Mastered</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <StickyNote className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{notesCount}</p>
                    <p className="text-xs text-muted-foreground">Study Notes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Quiz Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Quiz Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quizChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={quizChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[0, 100]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No quiz data yet. Take a quiz to see your progress!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Study Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Flashcard Progress */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4" />
                Flashcard Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Cards Reviewed</span>
                  <span className="text-muted-foreground">
                    {flashcardStats.reviewed} / {flashcardStats.total}
                  </span>
                </div>
                <Progress
                  value={
                    flashcardStats.total > 0
                      ? (flashcardStats.reviewed / flashcardStats.total) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Cards Mastered</span>
                  <span className="text-muted-foreground">
                    {flashcardStats.mastered} / {flashcardStats.total}
                  </span>
                </div>
                <Progress
                  value={
                    flashcardStats.total > 0
                      ? (flashcardStats.mastered / flashcardStats.total) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4" />
                Recent Quiz Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quizzes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No quiz results yet. Take a quiz to track your progress!
                </p>
              ) : (
                <div className="space-y-3">
                  {quizzes.slice(0, 5).map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium text-sm">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.completed_at
                            ? new Date(quiz.completed_at).toLocaleDateString()
                            : "In progress"}
                        </p>
                      </div>
                      {quiz.score !== null && (
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {Math.round((quiz.score / quiz.total_questions) * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {quiz.score}/{quiz.total_questions}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
