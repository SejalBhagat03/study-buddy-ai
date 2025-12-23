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
  Download
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
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => setStudyMode(false)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Exit Study
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {studyCards.length}
              </span>
            </div>

            <Progress value={progress} className="mb-6" />

            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={cn(
                "relative h-80 cursor-pointer perspective-1000",
                "transition-transform duration-500 transform-style-preserve-3d",
                isFlipped && "rotate-y-180"
              )}
              style={{
                perspective: "1000px",
              }}
            >
              <Card 
                className={cn(
                  "absolute inset-0 flex items-center justify-center p-8 backface-hidden",
                  "transition-all duration-500",
                  isFlipped ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
              >
                <CardContent className="text-center">
                  <p className="text-xs text-muted-foreground mb-4">QUESTION</p>
                  <p className="text-xl font-medium">{currentCard.front}</p>
                  <p className="text-sm text-muted-foreground mt-6">
                    Click to reveal answer
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "absolute inset-0 flex items-center justify-center p-8",
                  "transition-all duration-500",
                  !isFlipped ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
              >
                <CardContent className="text-center">
                  <p className="text-xs text-muted-foreground mb-4">ANSWER</p>
                  <p className="text-xl font-medium">{currentCard.back}</p>
                </CardContent>
              </Card>
            </div>

            {isFlipped && (
              <div className="flex justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleDifficulty(false)}
                  className="flex-1 max-w-40"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Hard
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleDifficulty(true)}
                  className="flex-1 max-w-40"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
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
      <main className="flex-1 p-6 pt-16 lg:pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Flashcards</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={flashcards.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generate Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Select a chapter to generate AI-powered flashcards.
              </p>

              {chaptersLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : chapters.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    No chapters available. Upload a PDF first.
                  </p>
                  <Button onClick={() => navigate("/chat")}>
                    Go to Study Chat
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => setSelectedChapter(chapter.id)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-colors",
                        selectedChapter === chapter.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      {chapter.title}
                    </button>
                  ))}
                </div>
              )}

              <Button
                onClick={generateFlashcards}
                disabled={!selectedChapter || generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Decks */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : Object.keys(decks).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No flashcard decks yet. Generate some from your chapters!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(decks).map(([deckName, cards]) => {
                const dueCards = cards.filter(
                  (c) => new Date(c.next_review) <= new Date()
                ).length;

                return (
                  <Card key={deckName}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{deckName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {cards.length} cards • {dueCards} due
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteDeck(deckName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={() => startStudySession(deckName)}
                        disabled={dueCards === 0}
                        className="w-full"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {dueCards > 0 ? `Study (${dueCards} due)` : "All caught up!"}
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
