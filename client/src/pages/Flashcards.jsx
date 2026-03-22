import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
// Removed Supabase
import { useAuth } from "@/hooks/useAuth";
import { useChapters } from "@/hooks/useChapters";
import { toast } from "sonner";
import { Layers, Loader2, RotateCcw, ThumbsUp, ThumbsDown, Sparkles, Trash2, BookOpen, Zap, FileText, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { PDFUpload } from "@/components/PDFUpload";
import api from "@/api";



export default function Flashcards() {
  const { user } = useAuth();
  const { chapters, loading: chaptersLoading, refetch } = useChapters();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [cardCount, setCardCount] = useState(5);
  const selectedChapterData = chapters.find((c) => (c._id || c.id) === selectedChapter);

  useEffect(() => { if (user) fetchFlashcards(); }, [user]);

  const fetchFlashcards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.get("/flashcards");
      setFlashcards(response.data.data || []);
    } catch (error) { 
      console.error("Failed to fetch flashcards:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  const generateFlashcards = async () => {
    const chapter = chapters.find((c) => (c._id || c.id) === selectedChapter);
    if (!chapter || !user) return;
    setGenerating(true);
    try {
      const response = await api.post("/flashcards/generate", {
        content: chapter.content || "Study content details",
        count: cardCount
      });

      const aiCards = response.data.data;

      const cardsToInsert = aiCards.map((card) => ({ 
        user_id: user.id, 
        chapter_id: chapter._id || chapter.id, 
        deck_name: chapter.title, 
        front: card.front, 
        back: card.back 
      }));

      await api.post("/flashcards", cardsToInsert);

      toast.success(`Created ${aiCards.length} flashcards from AI!`);

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
    await api.put(`/flashcards/${card._id || card.id}`, { difficulty: newDifficulty, next_review: nextReview.toISOString(), review_count: card.review_count + 1 });
    if (currentIndex < studyCards.length - 1) { setCurrentIndex((prev) => prev + 1); setIsFlipped(false); } else { toast.success("Study session complete!"); setStudyMode(false); fetchFlashcards(); }
  };

  const deleteDeck = async (deckName) => {
    if (!user) return;
    await api.delete(`/flashcards/deck?deckName=${encodeURIComponent(deckName)}`);
    toast.success("Deck deleted");
    fetchFlashcards();
  };

  const decks = flashcards.reduce((acc, card) => { if (!acc[card.deck_name]) acc[card.deck_name] = []; acc[card.deck_name].push(card); return acc; }, {});

  if (studyMode && studyCards.length > 0) {
    const currentCard = studyCards[currentIndex];
    return (
      <div className="flex min-h-screen bg-transparent">
        <Sidebar />
        <main className="flex-1 p-6 bg-transparent">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" className="rounded-xl text-xs font-bold" onClick={() => setStudyMode(false)}>← Exit</Button>
              <span className="text-xs font-bold text-slate-500">{currentIndex + 1}/{studyCards.length}</span>
            </div>
            
            <Progress value={((currentIndex + 1) / studyCards.length) * 100} className="mb-6 h-1.5 rounded-full" />
            
            <div className="perspective-1000 h-80 w-full max-w-md mx-auto mb-6">
              <div 
                className={cn(
                  "relative w-full h-full text-center transition-transform duration-500 transform-style-3d cursor-pointer rounded-2xl border border-white/20 glass-card bg-white p-8 flex items-center justify-center shadow-soft",
                  isFlipped ? "rotate-y-180" : ""
                )}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-white/90 to-slate-50/90 rounded-2xl">
                  <p className="text-xs text-primary font-bold tracking-wider mb-2 uppercase">Question</p>
                  <p className="text-xl font-extrabold text-[#111827] leading-snug">{currentCard.front}</p>
                  <p className="text-[10px] text-slate-400 mt-4 font-medium">Click card to flip</p>
                </div>
                
                {/* Back */}
                <div className="absolute inset-0 rotate-y-180 backface-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl">
                  <p className="text-xs text-primary font-bold tracking-wider mb-2 uppercase">Answer</p>
                  <p className="text-lg font-extrabold text-slate-800 leading-snug">{currentCard.back}</p>
                </div>
              </div>
            </div>

            {isFlipped && (
              <div className="flex justify-center gap-4 animate-fade-in">
                <Button variant="outline" className="rounded-xl font-bold text-slate-600 shadow-soft" onClick={() => handleDifficulty(false)}>
                  <ThumbsDown className="h-4 w-4 mr-2 text-red-500" />
                  Hard
                </Button>
                <Button className="rounded-xl font-bold shadow-soft" onClick={() => handleDifficulty(true)}>
                  <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
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
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 bg-transparent">
        <div className="max-w-5xl mx-auto">
          <PageHeader 
            icon={Layers} 
            title="Flashcards" 
            subtitle="Master your knowledge with spaced repetition guides." 
            bgClass="bg-gradient-to-br from-primary/20 to-secondary/20" 
            iconClass="text-primary" 
            borderClass="border-white/20"
          />

          <div className="grid md:grid-cols-5 gap-6 mb-8 animate-fade-in border-b border-white/10 pb-6">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-5 flex flex-col justify-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-1">How It Works</h3>
                <p className="text-xs text-slate-500 font-medium">Create smart study decks from notes accurately.</p>
              </div>

              <div className="space-y-4 relative">
                <div className="flex gap-4 relative z-10 group">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11 shadow-sm group-hover:scale-105 transition-all duration-300">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-700 mb-0.5">1. Select Chapter</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Pick an existing file reference or upload PDFs.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10 group">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11 shadow-sm group-hover:scale-105 transition-all duration-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-700 mb-0.5">2. AI Generation</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Generate flashcards featuring terms formulas overlays correctly.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10 group">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11 shadow-sm group-hover:scale-105 transition-all duration-300">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-700 mb-0.5">3. Smart Review</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Practice decks using spaced repetition memory buffers safely.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-3">
              <Card className="glass-card border border-white/20 shadow-soft flex flex-col">
                <div className="flex items-center gap-2 border-b border-white/10 p-5 pb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm text-slate-800">Generate Flashcards</h3>
                </div>

                <CardContent className="space-y-4 p-5">
                  <div className="space-y-1.5">
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
                        <div className="space-y-1.5">
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {chapters.map((chapter) => (
                            <button 
                              key={chapter._id || chapter.id} 
                              onClick={() => setSelectedChapter(chapter._id || chapter.id)} 
                              className={cn(
                                "w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all", 
                                selectedChapter === (chapter._id || chapter.id) 
                                  ? "border-primary/40 bg-gradient-to-r from-primary/10 to-secondary/10 shadow-soft font-bold" 
                                  : "border-white/10 hover:bg-white/40"
                              )}
                            >
                              <span className="truncate block">{chapter.title}</span>
                            </button>
                          ))}
                        </div>

                        {!showUpload ? (
                           <button onClick={() => setShowUpload(true)} className="text-[10px] font-bold text-primary hover:underline mt-1 flex items-center gap-1">+ Upload Multiple PDFs</button>
                        ) : (
                           <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm mt-2">
                              <PDFUpload onUploadComplete={() => { refetch(); setShowUpload(false); }} />
                           </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-3 space-y-1.5">
                     <Label className="text-xs font-bold text-slate-600">Number of Cards</Label>
                     <select 
                        value={cardCount} 
                        onChange={(e) => setCardCount(parseInt(e.target.value))}
                        className="w-full bg-white/40 backdrop-blur-md rounded-xl border border-white/20 p-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                     >
                        <option value="5">5 Cards</option>
                        <option value="10">10 Cards</option>
                        <option value="20">20 Cards</option>
                     </select>
                  </div>

                  <Button onClick={generateFlashcards} disabled={!selectedChapter || generating} className="w-full rounded-xl text-xs font-bold h-10 mt-2 shadow-soft hover:shadow-glow transition-all duration-300">
                    {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating Decks...</> : "Generate Flashcards"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
             <h3 className="text-lg font-extrabold text-slate-800 mb-4 tracking-tight">Your Decks</h3>
             
             {loading ? (
                <div className="flex items-center justify-center py-12">
                   <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
             ) : Object.keys(decks).length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 bg-white/50 backdrop-blur-sm">
                   <CardContent className="py-12 text-center flex flex-col items-center">
                      <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-400">
                         <Layers className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 mb-1">No flashcards yet</p>
                      <p className="text-xs text-slate-500 mb-4 max-w-xs leading-relaxed">Generate flashcards from your notes above to start learning.</p>
                   </CardContent>
                </Card>
             ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                   {Object.entries(decks).map(([deckName, cards]) => {
                      const dueCards = cards.filter((c) => new Date(c.next_review) <= new Date()).length;
                      return (
                         <div key={deckName} className="group relative">
                            <Card className="border border-white/20 backdrop-blur-md rounded-2xl shadow-soft p-5 bg-white/70 overflow-hidden flex flex-col h-full hover:shadow-glow transition-all duration-500 ease-out group-hover:-translate-y-1">
                               <div className="flex items-start justify-between mb-3 border-b border-white/10 pb-2">
                                  <div>
                                     <h4 className="font-bold text-sm text-slate-800 tracking-tight line-clamp-1">{deckName}</h4>
                                     <p className="text-[10px] text-slate-500 font-medium">{cards.length} cards {dueCards > 0 && `• ${dueCards} due`}</p>
                                  </div>
                                  <Button variant="ghost" size="icon" onClick={() => deleteDeck(deckName)} className="p-0 h-6 w-6 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50">
                                     <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                               </div>

                               {/* 3D Stack Preview with offsets */}
                               <div className="relative h-28 w-full perspective-[800px] mb-4 flex items-center justify-center">
                                  {cards.slice(0, 3).map((c, i) => (
                                     <div 
                                        key={c._id || c.id} 
                                        className={cn(
                                           "absolute inset-0 bg-white border border-white/30 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-soft transition-all duration-500 ease-out cursor-pointer",
                                           i === 0 && "z-20 transform-gpu rotate-0 group-hover:scale-105",
                                           i === 1 && "z-10 transform-gpu translate-y-1.5 translate-x-1.5 rotate-1 group-hover:translate-y-2 group-hover:translate-x-2 opacity-90",
                                           i === 2 && "z-0 transform-gpu translate-y-3 translate-x-3 rotate-2 group-hover:translate-y-4 group-hover:translate-x-4 opacity-80"
                                        )}
                                     >
                                        <p className="text-[8px] text-primary font-bold uppercase tracking-wider mb-1">Preview</p>
                                        <p className="text-[10px] font-extrabold text-slate-800 line-clamp-2 max-w-xs">{c.front}</p>
                                     </div>
                                  ))}
                               </div>

                               <Button 
                                  onClick={() => startStudySession(deckName)} 
                                  disabled={dueCards === 0} 
                                  className={`w-full rounded-xl text-xs font-bold h-9 mt-auto ${dueCards > 0 ? 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 shadow-md' : 'bg-slate-100 text-slate-400'}`}
                               >
                                  {dueCards > 0 ? `Start Studying (${dueCards} due)` : "All Review Completed"}
                                </Button>
                            </Card>
                         </div>
                      )
                   })}
                </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
