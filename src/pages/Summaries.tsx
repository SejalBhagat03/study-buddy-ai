import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Target,
  Lightbulb,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";

const sampleSummary = {
  title: "Introduction to Economics",
  slides: [
    {
      title: "Chapter Overview",
      icon: BookOpen,
      content: [
        "Economics studies how society allocates scarce resources",
        "Two main branches: Microeconomics & Macroeconomics",
        "Key principle: People respond to incentives",
        "Scarcity forces us to make choices",
      ],
    },
    {
      title: "Key Concepts",
      icon: Target,
      content: [
        "Supply & Demand: Foundation of market economics",
        "Opportunity Cost: Value of next best alternative",
        "Marginal Analysis: Comparing additional benefits vs costs",
        "Market Equilibrium: Where supply meets demand",
      ],
    },
    {
      title: "Exam Tips",
      icon: Lightbulb,
      content: [
        "Always draw diagrams for supply/demand questions",
        "Remember: Demand curves slope downward",
        "Use the formula: Elasticity = %ΔQ / %ΔP",
        "Know the difference between movements along and shifts of curves",
      ],
    },
    {
      title: "Common Mistakes",
      icon: AlertCircle,
      content: [
        "Confusing shift vs movement along the curve",
        "Forgetting to label axes on graphs",
        "Mixing up nominal and real values",
        "Ignoring ceteris paribus conditions",
      ],
    },
  ],
};

export default function Summaries() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const { sendMessage, isLoading } = useChat({
    mode: "summary",
    studyContent: "Economics chapter content...",
  });

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    // Simulate summary generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  const nextSlide = () => {
    if (currentSlide < sampleSummary.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const CurrentIcon = sampleSummary.slides[currentSlide].icon;

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

          {/* Summary Card */}
          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            {/* Title bar */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 p-6 text-white">
              <h2 className="text-xl font-bold">{sampleSummary.title}</h2>
              <p className="text-sm text-white/80 mt-1">
                Slide {currentSlide + 1} of {sampleSummary.slides.length}
              </p>
            </div>

            {/* Slide content */}
            <div className="p-8 min-h-[400px] flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <CurrentIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {sampleSummary.slides[currentSlide].title}
                </h3>
              </div>

              <ul className="flex-1 space-y-4">
                {sampleSummary.slides[currentSlide].content.map((item, i) => (
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
                  {sampleSummary.slides.map((_, i) => (
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
                  disabled={currentSlide === sampleSummary.slides.length - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Generate new summary */}
          <div className="mt-6 p-6 bg-card rounded-2xl border border-border shadow-soft">
            <h3 className="font-semibold text-foreground mb-2">
              Generate New Summary
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a chapter or paste content to generate a new slide-style summary
            </p>
            <div className="flex gap-3">
              <Button
                variant="gradient"
                onClick={handleGenerateSummary}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
