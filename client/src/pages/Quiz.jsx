import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
// Removed Supabase
import { useAuth } from "@/hooks/useAuth";
import { useChapters } from "@/hooks/useChapters";
import { toast } from "sonner";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Trophy,
  RotateCcw,
  HelpCircle,
  FileText
} from "lucide-react";

import { PDFUpload } from "@/components/PDFUpload";
import api from "@/api";


export default function Quiz() {
  const { user } = useAuth();
  const { chapters, loading: chaptersLoading, refetch } = useChapters();
  const navigate = useNavigate();
  
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");

  const selectedChapterData = chapters.find(c => (c._id || c.id) === selectedChapter);

  const generateQuiz = async () => {
    if (!selectedChapterData || !user) return;

    setIsGenerating(true);
    try {
      const response = await api.post("/quizzes/generate", {
        content: selectedChapterData.content || "Study content details",
        count: questionCount,
        difficulty: difficulty
      });

      const aiQuestions = response.data.data;

      const mappedQuestions = aiQuestions.map(q => ({
        question: q.question,
        options: q.options,
        correctIndex: q.options.indexOf(q.correctAnswer) !== -1 ? q.options.indexOf(q.correctAnswer) : 0
      }));

      setQuiz({
        questions: mappedQuestions,
        currentIndex: 0,
        answers: new Array(mappedQuestions.length).fill(null),
        showResult: false,
        isSubmitted: false,
      });

      toast.success("Quiz generated!");

    } catch (error) {
      console.error("Failed to generate quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectAnswer = (optionIndex) => {
    if (!quiz || quiz.isSubmitted) return;
    setQuiz(prev => {
      if (!prev) return prev;
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentIndex] = optionIndex;
      return { ...prev, answers: newAnswers };
    });
  };

  const nextQuestion = () => {
    if (!quiz) return;
    if (quiz.currentIndex < quiz.questions.length - 1) {
      setQuiz(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : prev);
    }
  };

  const prevQuestion = () => {
    if (!quiz || quiz.currentIndex === 0) return;
    setQuiz(prev => prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : prev);
  };

  const submitQuiz = async () => {
    if (!quiz || !user || !selectedChapterData) return;

    const score = quiz.answers.reduce((acc, answer, index) => {
      return acc + (answer === quiz.questions[index].correctIndex ? 1 : 0);
    }, 0);

    setQuiz(prev => prev ? { ...prev, isSubmitted: true, showResult: true } : prev);

    try {
      await api.post("/quizzes", {
        chapter_id: selectedChapterData._id || selectedChapterData.id,
        title: `Quiz: ${selectedChapterData.title}`,
        questions: quiz.questions,
        score,
        total_questions: quiz.questions.length,
        completed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save quiz:", error);
    }

    toast.success(`Quiz completed! Score: ${score}/${quiz.questions.length}`);
  };

  const resetQuiz = () => {
    setQuiz(null);
    setSelectedChapter(null);
  };

  const score = quiz?.isSubmitted
    ? quiz.answers.reduce((acc, answer, index) => {
        return acc + (answer === quiz.questions[index].correctIndex ? 1 : 0);
      }, 0)
    : 0;

  const currentQuestion = quiz?.questions[quiz.currentIndex];
  const progress = quiz ? ((quiz.currentIndex + 1) / quiz.questions.length) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 bg-transparent">
        <div className="w-full max-w-7xl mx-auto">

          {/* page Header */}
          <div className="mb-8 flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-white/30 shadow-soft">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#111827]">Practice Quiz</h1>
              <p className="text-xs text-slate-500 font-medium">Test your retention with AI-generated questions.</p>
            </div>
          </div>

          {!quiz ? (
            <div className="grid md:grid-cols-5 gap-6 mb-8 animate-fade-in">
              
              {/* Left Column: How It Works */}
              <div className="md:col-span-2 space-y-6 flex flex-col justify-center">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-1">How It Works</h3>
                  <p className="text-xs text-slate-500 font-medium">Generate a personalized test in seconds.</p>
                </div>

                <div className="space-y-4 relative">
                  {/* Step 1 */}
                  <div className="flex gap-4 relative z-10 group">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11 shadow-sm group-hover:scale-105 transition-all duration-300">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-700 mb-0.5">1. Select Chapter</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Pick an existing note or upload a new chapter PDF.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 relative z-10 group">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11 shadow-sm group-hover:scale-105 transition-all duration-300">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-700 mb-0.5">2. Set Preferences</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Choose difficulty levels and question count formats sets.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4 relative z-10 group">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11 shadow-sm group-hover:scale-105 transition-all duration-300">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-700 mb-0.5">3. Start Quiz</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Answer prompts accurately gaining scores track rewards safely.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Selections & Settings */}
              <div className="md:col-span-3">
                <Card className="glass-card border border-white/20 shadow-soft flex flex-col">
                  <div className="flex items-center gap-2 border-b border-white/10 p-5 pb-3">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm text-slate-800">Quiz Settings</h3>
                  </div>

                  <CardContent className="space-y-4 p-5">
                    {/* Chapter select */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">Select Content</Label>
                       {selectedChapterData ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in shadow-soft">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                              <FileText className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 line-clamp-1">{selectedChapterData.title}</span>
                          </div>
                          <button 
                            onClick={() => setSelectedChapter(null)} 
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all duration-200"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : chaptersLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        </div>
                      ) : chapters.length === 0 ? (
                        <div className="text-center py-5 flex flex-col items-center border border-slate-100 rounded-xl">
                          <p className="text-xs font-bold text-slate-700 mb-1">No chapters available</p>
                          {!showUpload ? (
                            <Button size="sm" className="rounded-xl text-xs h-8 px-4 font-bold" onClick={() => setShowUpload(true)}>
                              Upload PDF
                            </Button>
                          ) : (
                            <div className="w-full max-w-sm mt-1">
                              <PDFUpload onUploadComplete={() => { refetch(); setShowUpload(false); }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {chapters.map((chapter) => (
                              <button
                                key={chapter._id || chapter.id}
                                onClick={() => setSelectedChapter(chapter._id || chapter.id)}
                                className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                                  selectedChapter === (chapter._id || chapter.id)
                                    ? "border-primary/40 bg-gradient-to-r from-primary/10 to-secondary/10 font-bold shadow-soft"
                                    : "border-white/10 hover:bg-white/40"
                                }`}
                              >
                                <p className="text-xs font-bold text-slate-800 line-clamp-1">{chapter.title}</p>
                              </button>
                            ))}
                          </div>
                          
                          {!showUpload ? (
                             <button onClick={() => setShowUpload(true)} className="text-[10px] font-bold text-primary hover:underline mt-1 flex items-center gap-1">+ Upload Multiple PDFs</button>
                          ) : (
                             <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm rounded-xl mt-2">
                                <PDFUpload onUploadComplete={() => { refetch(); setShowUpload(false); }} />
                             </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Settings rows */}
                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Questions</Label>
                        <select 
                          value={questionCount} 
                          onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                          className="w-full bg-white/40 backdrop-blur-md rounded-xl border border-white/20 p-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          <option value="3">3 Questions</option>
                          <option value="5">5 Questions</option>
                          <option value="10">10 Questions</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Difficulty</Label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100/50 p-1 rounded-xl">
                          {["easy", "medium", "hard"].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDifficulty(d)}
                              className={`p-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                                difficulty === d 
                                  ? "bg-white text-primary shadow-sm" 
                                  : "text-slate-500 hover:bg-white/30"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={generateQuiz}
                      disabled={!selectedChapter || isGenerating}
                      className="w-full rounded-xl hover:shadow-glow font-bold h-10 mt-2 transition-all duration-300"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Quiz Details...
                        </>
                      ) : (
                        "Generate Quiz"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

            </div>
          ) : quiz.showResult ? (
            // Results View
            <div className="glass-card border border-white/20 rounded-2xl p-6 shadow-soft space-y-6">
              <div className="text-center py-4 border-b border-white/10">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-soft">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                  {score}/{quiz.questions.length}
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  {score === quiz.questions.length
                    ? "Perfect score! Excellent work!"
                    : score >= quiz.questions.length / 2
                    ? "Good job! Keep studying!"
                    : "Keep practicing, you'll get there!"}
                </p>
              </div>

              <div className="space-y-3">
                {quiz.questions.map((q, index) => {
                  const isCorrect = quiz.answers[index] === q.correctIndex;
                  return (
                    <div
                      key={index}
                      className={`p-3.5 rounded-xl border ${
                        isCorrect ? "border-green-200 bg-green-50/20" : "border-red-200 bg-red-50/20"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 mb-1">{q.question}</p>
                          <p className="text-[10px] text-slate-500">
                            Your answer: <span className={isCorrect ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{q.options[quiz.answers[index] ?? 0]}</span>
                          </p>
                          {!isCorrect && (
                            <p className="text-[10px] text-green-600 font-bold">
                              Correct: {q.options[q.correctIndex]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button onClick={resetQuiz} className="w-full rounded-xl text-xs font-bold h-10 shadow-soft">
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Take Another Quiz
              </Button>
            </div>
          ) : (
            // Quiz Questions View
            <div className="glass-card border border-white/20 rounded-2xl p-6 shadow-soft space-y-5">
              <div className="border-b border-white/10 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-500">Question {quiz.currentIndex + 1} of {quiz.questions.length}</p>
                  <span className="text-[10px] font-bold text-primary truncate max-w-[120px]">
                    {selectedChapterData?.title}
                  </span>
                </div>
                <div className="h-1.5 bg-white/30 rounded-full overflow-hidden border border-white/10">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <p className="text-sm font-bold text-slate-800">{currentQuestion?.question}</p>

              <RadioGroup
                value={quiz.answers[quiz.currentIndex]?.toString() ?? ""}
                onValueChange={(value) => selectAnswer(parseInt(value))}
                className="space-y-2"
              >
                {currentQuestion?.options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      quiz.answers[quiz.currentIndex] === index
                        ? "border-primary/40 bg-gradient-to-r from-primary/10 to-secondary/10 font-bold shadow-soft"
                        : "border-white/10 hover:bg-white/40"
                    }`}
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} className="text-primary border-white/40" />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-xs text-slate-700 font-medium">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={quiz.currentIndex === 0}
                  className="h-9 px-4 rounded-xl text-xs font-semibold shadow-soft"
                >
                  Previous
                </Button>

                {quiz.currentIndex === quiz.questions.length - 1 ? (
                  <Button
                    onClick={submitQuiz}
                    disabled={quiz.answers.includes(null)}
                    className="h-9 px-5 rounded-xl text-xs font-bold shadow-soft"
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button onClick={nextQuestion} className="h-9 px-4 rounded-xl text-xs font-semibold shadow-soft">
                    Next
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
