import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Target,
  Lightbulb,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useChapters } from "@/hooks/useChapters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Slide {
  title: string;
  type: "overview" | "concepts" | "tips" | "warnings";
  points: string[];
}

interface Summary {
  title: string;
  slides: Slide[];
}

const iconMap = {
  overview: BookOpen,
  concepts: Target,
  tips: Lightbulb,
  warnings: AlertCircle,
};

export default function Summaries() {
  const navigate = useNavigate();
  const { chapters, loading: chaptersLoading } = useChapters();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const selectedChapterData = chapters.find((c) => c.id === selectedChapter);

  const handleGenerateSummary = async () => {
    if (!selectedChapterData) {
      toast.error("Please select a chapter first");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-summary", {
        body: {
          content: selectedChapterData.content,
          title: selectedChapterData.title,
        },
      });

      if (response.error) throw response.error;

      setSummary({
        title: selectedChapterData.title,
        slides: response.data.slides,
      });
      setCurrentSlide(0);
      toast.success("Summary generated!");
    } catch (error) {
      console.error("Failed to generate summary:", error);
      toast.error("Failed to generate summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const nextSlide = () => {
    if (summary && currentSlide < summary.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const exportAsMarkdown = () => {
    if (!summary) return;

    let markdown = `# ${summary.title}\n\n`;
    summary.slides.forEach((slide) => {
      markdown += `## ${slide.title}\n\n`;
      slide.points.forEach((point) => {
        markdown += `- ${point}\n`;
      });
      markdown += "\n";
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${summary.title.replace(/\s+/g, "_")}_summary.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Summary exported as Markdown!");
  };

  const currentSlideData = summary?.slides[currentSlide];
  const CurrentIcon = currentSlideData ? iconMap[currentSlideData.type] : BookOpen;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Video Summary
              </h1>
              <p className="text-sm text-muted-foreground">
                Slide-style summaries with key concepts
              </p>
            </div>
          </div>

          {!summary ? (
            /* Chapter Selection */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generate Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Select a chapter to generate a slide-style summary.
                </p>

                {chaptersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="text-center py-8">
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
                          "w-full p-4 rounded-lg border text-left transition-colors",
                          selectedChapter === chapter.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
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
                  onClick={handleGenerateSummary}
                  disabled={!selectedChapter || isGenerating}
                  className="w-full"
                  variant="gradient"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Summary...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Summary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
                {/* Title bar */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 p-6 text-white flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{summary.title}</h2>
                    <p className="text-sm text-white/80 mt-1">
                      Slide {currentSlide + 1} of {summary.slides.length}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportAsMarkdown}
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                {/* Slide content */}
                <div className="p-8 min-h-[400px] flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <CurrentIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {currentSlideData?.title}
                    </h3>
                  </div>

                  <ul className="flex-1 space-y-4">
                    {currentSlideData?.points.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 animate-fade-in"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {i + 1}
                        </span>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={prevSlide}
                      disabled={currentSlide === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>

                    {/* Dots */}
                    <div className="flex gap-2">
                      {summary.slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentSlide(i)}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${
                            i === currentSlide
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                          }`}
                        />
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={nextSlide}
                      disabled={currentSlide === summary.slides.length - 1}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Generate new summary */}
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSummary(null);
                    setSelectedChapter(null);
                  }}
                >
                  Generate Another Summary
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
