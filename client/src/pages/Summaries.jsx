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
  Upload,
  Sparkles,
  XCircle
} from "lucide-react";
// Removed Supabase
import api from "@/api";

import { useChapters } from "@/hooks/useChapters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { PDFUpload } from "@/components/PDFUpload";

const iconMap = {
  overview: BookOpen,
  concepts: Target,
  tips: Lightbulb,
  warnings: AlertCircle,
};

export default function Summaries() {
  const navigate = useNavigate();
  const { chapters, loading: chaptersLoading, refetch } = useChapters();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const selectedChapterData = chapters.find((c) => (c._id || c.id) === selectedChapter);

  const handleGenerateSummary = async () => {
    if (!selectedChapterData) {
      toast.error("Please select a chapter first");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post("/summaries/generate", {
          content: selectedChapterData.content,
          title: selectedChapterData.title,
      });

      setSummary({
        title: selectedChapterData.title,
        slides: response.data.data.slides,
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
  const CurrentIcon = (currentSlideData && iconMap[currentSlideData.type]) || BookOpen;

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 bg-transparent">
        <div className="w-full max-w-7xl mx-auto">

          <PageHeader 
            icon={FileText} 
            title="Summaries" 
            subtitle="Slide-style summaries with key concepts" 
            bgClass="bg-gradient-to-br from-primary/20 to-secondary/20" 
            iconClass="text-primary" 
            borderClass="border-white/20"
          />

          {!summary ? (
            <div className="grid md:grid-cols-5 gap-6 mb-8 animate-fade-in">
              
              {/* Left Column: How It Works */}
              <div className="md:col-span-2 space-y-6 flex flex-col justify-center">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-1">How It Works</h3>
                  <p className="text-xs text-slate-500 font-medium">Follow these simple steps to generate your slides.</p>
                </div>

                <div className="space-y-4 relative">
                  {/* Step 1 */}
                  <div className="flex gap-4 relative z-10 group">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11 shadow-sm group-hover:scale-105 transition-all duration-300">
                      <Upload className="w-5 h-5 animate-float" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-700 mb-0.5">1. Upload Material</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Drag & Drop your chapter PDF above to parse text contents.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 relative z-10 group">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11 shadow-sm group-hover:scale-105 transition-all duration-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-700 mb-0.5">2. AI Processing</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Our AI will analyze and breaking down chapters into slides lists.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4 relative z-10 group">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11 shadow-sm group-hover:scale-105 transition-all duration-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-700 mb-0.5">3. Get Summary Cards</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Review bulleted highlight nodes containing concepts guides triggers.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions / Selection Frame */}
              <div className="md:col-span-3">
                <Card className="glass-card border border-white/20 shadow-soft h-full flex flex-col">
                  <div className="flex items-center gap-2 border-b border-white/10 p-5 pb-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm text-slate-800">Generate Summary</h3>
                  </div>

                  <CardContent className="flex-1 p-5 pt-3 flex flex-col justify-between">
                    <div>
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
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : chapters.length === 0 ? (
                        <div className="text-center py-6 flex flex-col items-center">
                          <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 mb-3 animate-pulse-soft">
                            <FileText className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-800 mb-1">No chapters available</p>
                          <p className="text-[10px] text-slate-500 mb-4 max-w-[200px]">Upload a PDF first to generate summaries.</p>
                          
                          {!showUpload ? (
                            <Button size="sm" className="rounded-xl text-xs h-8 px-4 font-bold shadow-soft" onClick={() => setShowUpload(true)}>
                              Upload PDF
                            </Button>
                          ) : (
                            <div className="w-full max-w-md mt-2 text-left bg-white/20 p-2 rounded-xl border border-white/10 backdrop-blur-sm">
                              <PDFUpload onUploadComplete={() => { refetch(); setShowUpload(false); }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-500 font-medium">Select a chapter below:</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {chapters.map((chapter) => (
                              <button
                                key={chapter._id || chapter.id}
                                onClick={() => setSelectedChapter(chapter._id || chapter.id)}
                                className={`w-full p-3 rounded-xl border text-left transition-all ${
                                  selectedChapter === (chapter._id || chapter.id)
                                    ? "border-primary/40 bg-gradient-to-r from-primary/10 to-secondary/10 font-bold shadow-soft"
                                    : "border-white/10 hover:bg-white/40"
                                }`}
                              >
                                <p className="font-bold text-xs text-slate-800">{chapter.title}</p>
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  {chapter.content.substring(0, 80)}...
                                </p>
                              </button>
                            ))}
                          </div>
                          
                          {!showUpload ? (
                             <button onClick={() => setShowUpload(true)} className="text-[10px] font-bold text-primary hover:underline mt-1 flex items-center gap-1">+ Upload Another PDF</button>
                          ) : (
                             <div className="bg-white/10 p-4 rounded-xl border border-white/5 mt-2">
                                <PDFUpload onUploadComplete={() => { refetch(); setShowUpload(false); }} />
                             </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <Button
                        onClick={handleGenerateSummary}
                        disabled={!selectedChapter || isGenerating}
                        className="w-full rounded-xl hover:shadow-glow font-bold h-10 transition-all duration-300"
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
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="glass-card rounded-2xl border border-white/20 shadow-soft overflow-hidden">
                {/* Title bar */}
                <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold">{summary.title}</h2>
                    <p className="text-xs text-white/90 font-medium mt-1">
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/30 shadow-soft">
                      <CurrentIcon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">
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
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-extrabold text-primary border border-primary/20">
                          {i + 1}
                        </span>
                        <span className="text-slate-700 font-medium text-sm leading-relaxed">{item}</span>

                      </li>
                    ))}
                  </ul>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
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
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === currentSlide
                              ? "bg-primary w-4"
                              : "bg-primary/30 hover:bg-primary/50"
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
