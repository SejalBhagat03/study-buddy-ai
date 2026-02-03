import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChapters } from "@/hooks/useChapters";
import { toast } from "sonner";
import { 
  BookOpen, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Trophy,
  RotateCcw
} from "lucide-react";

export default function Quiz() {
  const { user } = useAuth();
  const { chapters, loading: chaptersLoading } = useChapters();
  const navigate = useNavigate();
  
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState(null);

  const selectedChapterData = chapters.find(c => c.id === selectedChapter);

  const generateQuiz = async () => {
    if (!selectedChapterData || !user) return;

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-quiz", {
        body: {
          content: selectedChapterData.content,
          title: selectedChapterData.title,
          questionCount: 5,
        },
      });

      if (response.error) throw response.error;

      const { questions } = response.data;
      
      setQuiz({
        questions,
        currentIndex: 0,
        answers: new Array(questions.length).fill(null),
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

    // Save quiz result
    try {
      await supabase.from("quizzes").insert({
        user_id: user.id,
        chapter_id: selectedChapterData.id,
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

  const currentQuestion = quiz?.questions[quiz.currentIndex];
  const progress = quiz ? ((quiz.currentIndex + 1) / quiz.questions.length) * 100 : 0;
  const score = quiz?.isSubmitted
    ? quiz.answers.reduce((acc, answer, index) => {
        return acc + (answer === quiz.questions[index].correctIndex ? 1 : 0);
      }, 0)
    : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Practice Quiz</h1>

          {!quiz ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Generate Quiz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Select a chapter to generate a practice quiz based on its content.
                </p>

                {chaptersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No chapters available. Upload a PDF or add study content first.
                    </p>
                    <Button onClick={() => navigate("/chat")}>
                      Go to Study Chat
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        onClick={() => setSelectedChapter(chapter.id)}
                        className={`w-full p-4 rounded-lg border text-left transition-colors ${
                          selectedChapter === chapter.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <p className="font-medium">{chapter.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {chapter.content.substring(0, 100)}...
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  onClick={generateQuiz}
                  disabled={!selectedChapter || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    "Generate Quiz"
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : quiz.showResult ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Quiz Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-4">
                  <p className="text-4xl font-bold mb-2">
                    {score}/{quiz.questions.length}
                  </p>
                  <p className="text-muted-foreground">
                    {score === quiz.questions.length
                      ? "Perfect score! Excellent work!"
                      : score >= quiz.questions.length / 2
                      ? "Good job! Keep studying!"
                      : "Keep practicing, you'll get there!"}
                  </p>
                </div>

                <div className="space-y-4">
                  {quiz.questions.map((q, index) => {
                    const isCorrect = quiz.answers[index] === q.correctIndex;
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          isCorrect ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium mb-2">{q.question}</p>
                            <p className="text-sm text-muted-foreground">
                              Your answer: {q.options[quiz.answers[index] ?? 0]}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Correct answer: {q.options[q.correctIndex]}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button onClick={resetQuiz} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Take Another Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Question {quiz.currentIndex + 1} of {quiz.questions.length}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {selectedChapterData?.title}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg font-medium">{currentQuestion?.question}</p>

                <RadioGroup
                  value={quiz.answers[quiz.currentIndex]?.toString() ?? ""}
                  onValueChange={(value) => selectAnswer(parseInt(value))}
                >
                  {currentQuestion?.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={prevQuestion}
                    disabled={quiz.currentIndex === 0}
                  >
                    Previous
                  </Button>

                  {quiz.currentIndex === quiz.questions.length - 1 ? (
                    <Button
                      onClick={submitQuiz}
                      disabled={quiz.answers.includes(null)}
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <Button onClick={nextQuestion}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
