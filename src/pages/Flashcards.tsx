import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChapters } from "@/hooks/useChapters";
import { useExport } from "@/hooks/useExport";
import { toast } from "sonner";
import { 
  Layers, 
  Loader2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Trash2,
  Download,
  Zap,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck_name: string;
  difficulty: number;
  next_review: string;
  review_count: number;
  chapter_id: string | null;
}

export default function Flashcards() {
  const { user } = useAuth();
  const { chapters, loading: chaptersLoading } = useChapters();
  const { exportFlashcardsAsMarkdown, exportFlashcardsAsHTML } = useExport();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    if (user) fetchFlashcards();
  }, [user]);

  const fetchFlashcards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
      toast.error("Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  };

  const generateFlashcards = async () => {
    const chapter = chapters.find((c) => c.id === selectedChapter);
    if (!chapter || !user) return;

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-flashcards", {
        body: {
          content: chapter.content,
          title: chapter.title,
          cardCount: 10,
        },
      });

      if (response.error) throw response.error;

      const { flashcards: generatedCards } = response.data;

      // Save flashcards to database
      const cardsToInsert = generatedCards.map((card: { front: string; back: string }) => ({
        user_id: user.id,
        chapter_id: chapter.id,
        deck_name: chapter.title,
        front: card.front,
        back: card.back,
      }));

      const { error: insertError } = await supabase
        .from("flashcards")
        .insert(cardsToInsert);

      if (insertError) throw insertError;

      toast.success(`Created ${generatedCards.length} flashcards!`);
      setSelectedChapter(null);
      fetchFlashcards();
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
      toast.error("Failed to generate flashcards");
    } finally {
      setGenerating(false);
    }
  };

  const startStudySession = (deckName?: string) => {
    let cards = flashcards;
    if (deckName) {
      cards = flashcards.filter((c) => c.deck_name === deckName);
    }
    // Filter cards due for review
    const now = new Date();
    cards = cards.filter((c) => new Date(c.next_review) <= now);
    
    if (cards.length === 0) {
      toast.info("No cards due for review!");
      return;
    }

    setStudyCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyMode(true);
  };

  const handleDifficulty = async (easy: boolean) => {
    const card = studyCards[currentIndex];
    if (!card) return;

    // Spaced repetition logic
    const newDifficulty = easy 
      ? Math.max(0, card.difficulty - 1)
      : Math.min(5, card.difficulty + 1);
    
    // Calculate next review time (simple exponential backoff)
    const intervals = [1, 3, 7, 14, 30, 60]; // days
    const daysUntilReview = intervals[Math.min(newDifficulty, intervals.length - 1)];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + (easy ? daysUntilReview : 1));

    try {
      await supabase
        .from("flashcards")
        .update({
          difficulty: newDifficulty,
          next_review: nextReview.toISOString(),
          review_count: card.review_count + 1,
        })
        .eq("id", card.id);

      // Move to next card
      if (currentIndex < studyCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        toast.success("Study session complete!");
        setStudyMode(false);
        fetchFlashcards();
      }
    } catch (error) {
      console.error("Failed to update card:", error);
    }
  };

  const deleteDeck = async (deckName: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("user_id", user.id)
        .eq("deck_name", deckName);

      if (error) throw error;
      toast.success("Deck deleted");
      fetchFlashcards();
    } catch (error) {
      console.error("Failed to delete deck:", error);
      toast.error("Failed to delete deck");
    }
  };

  // Group flashcards by deck
  const decks = flashcards.reduce((acc, card) => {
    if (!acc[card.deck_name]) {
      acc[card.deck_name] = [];
    }
    acc[card.deck_name].push(card);
    return acc;
  }, {} as Record<string, Flashcard[]>);

  const progress = studyCards.length > 0 
    ? ((currentIndex + 1) / studyCards.length) * 100 
    : 0;

  const handleExport = (format: "markdown" | "html") => {
    const exportData = flashcards.map((card) => ({
      front: card.front,
      back: card.back,
      deck_name: card.deck_name,
    }));
    
    if (format === "markdown") {
      exportFlashcardsAsMarkdown(exportData);
    } else {
      exportFlashcardsAsHTML(exportData);
    }
  };

  if (studyMode && studyCards.length > 0) {
    const currentCard = studyCards[currentIndex];
    
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setStudyMode(false)}
                className="hover:bg-primary/10 transition-all duration-300"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Exit Study
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                <Zap className="h-4 w-4" />
                <span>{currentIndex + 1} / {studyCards.length}</span>
              </div>
            </div>

            <div className="relative mb-6">
              <Progress value={progress} className="h-3 bg-muted" />
              <div 
                className="absolute top-0 left-0 h-3 rounded-full study-gradient transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={cn(
                "flip-card h-80 cursor-pointer mb-6",
                isFlipped && "flipped"
              )}
            >
              <div className="flip-card-inner">
                {/* Front */}
                <Card className="flip-card-front flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 via-card to-accent/5 border-2 border-primary/20 shadow-elevated hover:shadow-glow transition-all duration-500">
                  <CardContent className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                      <BookOpen className="h-3 w-3" />
                      QUESTION
                    </div>
                    <p className="text-xl font-medium leading-relaxed">{currentCard.front}</p>
                    <p className="text-sm text-muted-foreground mt-6 animate-pulse-soft">
                      ✨ Click to reveal answer
                    </p>
                  </CardContent>
                </Card>

                {/* Back */}
                <Card className="flip-card-back flex items-center justify-center p-8 bg-gradient-to-br from-accent/10 via-card to-primary/5 border-2 border-accent/20 shadow-elevated">
                  <CardContent className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium mb-4">
                      <Sparkles className="h-3 w-3" />
                      ANSWER
                    </div>
                    <p className="text-xl font-medium leading-relaxed">{currentCard.back}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {isFlipped && (
              <div className="flex justify-center gap-4 animate-fade-in-up">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleDifficulty(false)}
                  className="flex-1 max-w-40 border-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive transition-all duration-300 group"
                >
                  <ThumbsDown className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                  Hard
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleDifficulty(true)}
                  className="flex-1 max-w-40 study-gradient text-white border-0 hover:opacity-90 transition-all duration-300 shadow-glow group glow-button"
                >
                  <ThumbsUp className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                  Easy
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 lg:pt-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl study-gradient shadow-glow">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Flashcards</h1>
                <p className="text-sm text-muted-foreground">Master your knowledge</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={flashcards.length === 0}
                  className="border-2 hover:border-primary/50 transition-all duration-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="animate-scale-in">
                <DropdownMenuItem onClick={() => handleExport("markdown")}>
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("html")}>
                  Export as HTML (PDF)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Generate New Deck */}
          <Card className="mb-8 pastel-card animate-fade-in-up overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 study-gradient" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <span>Generate Flashcards</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Select a chapter to generate AI-powered flashcards.
              </p>

              {chaptersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : chapters.length === 0 ? (
                <div className="text-center py-8 animate-fade-in">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    No chapters available. Upload a PDF first.
                  </p>
                  <Button 
                    onClick={() => navigate("/chat")}
                    className="study-gradient text-white glow-button"
                  >
                    Go to Study Chat
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => setSelectedChapter(chapter.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all duration-300 animate-fade-in",
                        selectedChapter === chapter.id
                          ? "border-primary bg-primary/10 shadow-soft"
                          : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="font-medium">{chapter.title}</span>
                    </button>
                  ))}
                </div>
              )}

              <Button
                onClick={generateFlashcards}
                disabled={!selectedChapter || generating}
                className="w-full study-gradient text-white border-0 h-12 text-base font-medium glow-button transition-all duration-300"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Magic...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Decks */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full bg-primary/20" />
              </div>
            </div>
          ) : Object.keys(decks).length === 0 ? (
            <Card className="pastel-card animate-fade-in-up">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-float">
                  <Layers className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Flashcard Decks Yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Generate some flashcards from your chapters to start learning!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {Object.entries(decks).map(([deckName, cards], index) => {
                const dueCards = cards.filter(
                  (c) => new Date(c.next_review) <= new Date()
                ).length;

                const colors = [
                  "from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30",
                  "from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30",
                  "from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30",
                  "from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30",
                ];

                return (
                  <Card 
                    key={deckName}
                    className={cn(
                      "pastel-card overflow-hidden animate-fade-in-up bg-gradient-to-br",
                      colors[index % colors.length]
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{deckName}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {cards.length} cards
                            </span>
                            {dueCards > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                                <Zap className="h-3 w-3" />
                                {dueCards} due
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                          onClick={() => deleteDeck(deckName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={() => startStudySession(deckName)}
                        disabled={dueCards === 0}
                        className={cn(
                          "w-full transition-all duration-300",
                          dueCards > 0 
                            ? "study-gradient text-white glow-button" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {dueCards > 0 ? `Study (${dueCards} due)` : "All caught up! 🎉"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
