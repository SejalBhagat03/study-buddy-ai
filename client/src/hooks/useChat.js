import { useState, useCallback, useRef, useEffect } from "react";
import api from "@/api";


export function useChat(options = {}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Keep the latest studyContent without forcing sendMessage to rememoize
  const studyContentRef = useRef(options.studyContent || "");
  useEffect(() => {
    studyContentRef.current = options.studyContent || "";
  }, [options.studyContent]);

  const sendMessage = useCallback(async (content) => {
    const userMessage = {
      id: crypto.randomUUID(),
      role: options.mode === "teacher" ? "student" : "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";

    const assistantMessage = {
      id: crypto.randomUUID(),
      role: options.mode === "teacher" ? "teacher" : "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const chatMessages = [...messages, userMessage].map((m) => ({
        role: m.role === "student" ? "user" : m.role === "teacher" ? "assistant" : m.role,
        content: m.content,
      }));

      // Always use the latest studyContent from the ref
      const currentStudyContent = studyContentRef.current;
      console.log("Sending study content length:", currentStudyContent.length);

      const response = await api.post("/chat", {
        messages: chatMessages,
        studyContent: currentStudyContent,
        mode: options.mode || "chat",
      });

      assistantContent = response.data?.data?.message || response.data?.message || "Connected to local back-end.";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: assistantContent }
            : m
        )
      );

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content:
                  error instanceof Error
                    ? `Sorry, I encountered an error: ${error.message}`
                    : "Sorry, something went wrong. Please try again.",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, options.mode]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
