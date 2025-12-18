import { cn } from "@/lib/utils";
import { GraduationCap, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant" | "teacher" | "student";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user" || role === "student";
  const isTeacher = role === "teacher" || role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
          isTeacher ? "study-gradient" : "bg-accent"
        )}
      >
        {isTeacher ? (
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        ) : (
          <User className="w-5 h-5 text-accent-foreground" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 shadow-soft",
          isTeacher ? "teacher-bubble" : "student-bubble"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
          {isStreaming && (
            <span className="inline-flex gap-1 ml-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-9 h-9 rounded-full study-gradient flex items-center justify-center shrink-0">
        <GraduationCap className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="teacher-bubble px-4 py-3 shadow-soft">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot" />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot" />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
}
