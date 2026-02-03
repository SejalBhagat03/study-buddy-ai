import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChapters } from "@/hooks/useChapters";
import { toast } from "sonner";
import { Layers, Loader2, RotateCcw, ThumbsUp, ThumbsDown, Sparkles, Trash2, BookOpen, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Flashcards() {
  const { user } = useAuth();
  const { chapters, loading: chaptersLoading } = useChapters();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState([]);

  useEffect(() => { if (user) fetchFlashcards(); }, [user]);

  const fetchFlashcards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("flashcards").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) { toast.error("Failed to load flashcards"); } finally { setLoading(false); }
  };

  const generateFlashcards = async () => {
    const chapter = chapters.find((c) => c.id === selectedChapter);
    if (!chapter || !user) return;
    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-flashcards", { body: { content: chapter.content, title: chapter.title, cardCount: 10 } });
      if (response.error) throw response.error;
      const { flashcards: generatedCards } = response.data;
      const cardsToInsert = generatedCards.map((card) => ({ user_id: user.id, chapter_id: chapter.id, deck_name: chapter.title, front: card.front, back: card.back }));
      await supabase.from("flashcards").insert(cardsToInsert);
      toast.success(`Created ${generatedCards.length} flashcards!`);
      setSelectedChapter(null);
      fetchFlashcards();
    } catch (error) { toast.error("Failed to generate flashcards"); } finally { setGenerating(false); }
  };

  const startStudySession = (deckName) => {
    let cards = deckName ? flashcards.filter((c) => c.deck_name === deckName) : flashcards;
    cards = cards.filter((c) => new Date(c.next_review) <= new Date());
    if (cards.length === 0) { toast.info("No cards due for review!"); return; }
    setStudyCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyMode(true);
  };

  const handleDifficulty = async (easy) => {
    const card = studyCards[currentIndex];
    if (!card) return;
    const newDifficulty = easy ? Math.max(0, card.difficulty - 1) : Math.min(5, card.difficulty + 1);
    const intervals = [1, 3, 7, 14, 30, 60];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + (easy ? intervals[Math.min(newDifficulty, intervals.length - 1)] : 1));
    await supabase.from("flashcards").update({ difficulty: newDifficulty, next_review: nextReview.toISOString(), review_count: card.review_count + 1 }).eq("id", card.id);
    if (currentIndex < studyCards.length - 1) { setCurrentIndex((prev) => prev + 1); setIsFlipped(false); } else { toast.success("Study session complete!"); setStudyMode(false); fetchFlashcards(); }
  };

  const deleteDeck = async (deckName) => {
    if (!user) return;
    await supabase.from("flashcards").delete().eq("user_id", user.id).eq("deck_name", deckName);
    toast.success("Deck deleted");
    fetchFlashcards();
  };

  const decks = flashcards.reduce((acc, card) => { if (!acc[card.deck_name]) acc[card.deck_name] = []; acc[card.deck_name].push(card); return acc; }, {});

  if (studyMode && studyCards.length > 0) {
    const currentCard = studyCards[currentIndex];
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6"><Button variant="ghost" onClick={() => setStudyMode(false)}>← Exit</Button><span className="text-sm">{currentIndex + 1}/{studyCards.length}</span></div>
            <Progress value={((currentIndex + 1) / studyCards.length) * 100} className="mb-6" />
            <Card className="h-80 cursor-pointer mb-6" onClick={() => setIsFlipped(!isFlipped)}>
              <CardContent className="h-full flex items-center justify-center p-8 text-center">
                <div><p className="text-xs text-muted-foreground mb-2">{isFlipped ? "ANSWER" : "QUESTION"}</p><p className="text-xl font-medium">{isFlipped ? currentCard.back : currentCard.front}</p>{!isFlipped && <p className="text-sm text-muted-foreground mt-4">Click to flip</p>}</div>
              </CardContent>
            </Card>
            {isFlipped && <div className="flex justify-center gap-4"><Button variant="outline" onClick={() => handleDifficulty(false)}><ThumbsDown className="h-4 w-4 mr-2" />Hard</Button><Button onClick={() => handleDifficulty(true)}><ThumbsUp className="h-4 w-4 mr-2" />Easy</Button></div>}
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
          <div className="flex items-center gap-3 mb-8"><div className="p-3 rounded-2xl study-gradient"><Layers className="h-6 w-6 text-white" /></div><div><h1 className="text-2xl font-bold">Flashcards</h1><p className="text-sm text-muted-foreground">Master your knowledge</p></div></div>
          <Card className="mb-8"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Generate Flashcards</CardTitle></CardHeader><CardContent className="space-y-4">
            {chaptersLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : chapters.length === 0 ? <div className="text-center py-8"><p className="text-muted-foreground mb-4">No chapters. Upload a PDF first.</p><Button onClick={() => navigate("/chat")}>Go to Study Chat</Button></div> : <div className="space-y-2">{chapters.map((chapter) => <button key={chapter.id} onClick={() => setSelectedChapter(chapter.id)} className={cn("w-full p-4 rounded-lg border text-left", selectedChapter === chapter.id ? "border-primary bg-primary/5" : "border-border")}>{chapter.title}</button>)}</div>}
            <Button onClick={generateFlashcards} disabled={!selectedChapter || generating} className="w-full">{generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : "Generate Flashcards"}</Button>
          </CardContent></Card>
          {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : Object.keys(decks).length === 0 ? <Card><CardContent className="py-12 text-center"><Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">No flashcard decks yet</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{Object.entries(decks).map(([deckName, cards]) => { const dueCards = cards.filter((c) => new Date(c.next_review) <= new Date()).length; return (<Card key={deckName}><CardContent className="pt-6"><div className="flex items-start justify-between mb-4"><div><h3 className="font-semibold">{deckName}</h3><span className="text-sm text-muted-foreground">{cards.length} cards{dueCards > 0 && ` • ${dueCards} due`}</span></div><Button variant="ghost" size="icon" onClick={() => deleteDeck(deckName)}><Trash2 className="h-4 w-4" /></Button></div><Button onClick={() => startStudySession(deckName)} disabled={dueCards === 0} className="w-full">{dueCards > 0 ? `Study (${dueCards} due)` : "All caught up!"}</Button></CardContent></Card>); })}</div>}
        </div>
      </main>
    </div>
  );
}
