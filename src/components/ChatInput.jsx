 import { useState, useRef, useEffect } from "react";
 import { Button } from "@/components/ui/button";
 import { Send, Loader2, Mic, MicOff } from "lucide-react";
 import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
 import { cn } from "@/lib/utils";
 
 export function ChatInput({ onSend, disabled, placeholder = "Ask a question..." }) {
   const [message, setMessage] = useState("");
   const textareaRef = useRef(null);
   const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
 
   useEffect(() => {
     if (textareaRef.current) {
       textareaRef.current.style.height = "auto";
       textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
     }
   }, [message]);
 
   useEffect(() => {
     if (transcript) {
       setMessage(transcript);
     }
   }, [transcript]);
 
   const handleSubmit = (e) => {
     e.preventDefault();
     if (message.trim() && !disabled) {
       onSend(message.trim());
       setMessage("");
       resetTranscript();
     }
   };
 
   const handleKeyDown = (e) => {
     if (e.key === "Enter" && !e.shiftKey) {
       e.preventDefault();
       handleSubmit(e);
     }
   };
 
   const handleMicClick = () => {
     if (isListening) {
       stopListening();
     } else {
       startListening();
     }
   };
 
   return (
     <form onSubmit={handleSubmit} className="relative">
       <div className="flex items-end gap-2 p-2 bg-card border border-border rounded-2xl shadow-soft">
         <textarea
           ref={textareaRef}
           value={message}
           onChange={(e) => setMessage(e.target.value)}
           onKeyDown={handleKeyDown}
           placeholder={isListening ? "Listening..." : placeholder}
           disabled={disabled}
           rows={1}
           className={cn(
             "flex-1 bg-transparent px-3 py-2 text-sm resize-none focus:outline-none placeholder:text-muted-foreground min-h-[40px] max-h-[150px]",
             isListening && "placeholder:text-primary"
           )}
         />
         
         {isSupported && (
           <Button
             type="button"
             size="icon"
             variant={isListening ? "default" : "ghost"}
             onClick={handleMicClick}
             disabled={disabled}
             className={cn(
               "shrink-0 h-9 w-9 rounded-xl transition-colors",
               isListening && "bg-destructive hover:bg-destructive/90 animate-pulse"
             )}
           >
             {isListening ? (
               <MicOff className="w-4 h-4" />
             ) : (
               <Mic className="w-4 h-4" />
             )}
           </Button>
         )}
         
         <Button
           type="submit"
           size="icon"
           variant="gradient"
           disabled={!message.trim() || disabled}
           className="shrink-0 h-9 w-9 rounded-xl"
         >
           {disabled ? (
             <Loader2 className="w-4 h-4 animate-spin" />
           ) : (
             <Send className="w-4 h-4" />
           )}
         </Button>
       </div>
       <p className="text-xs text-muted-foreground text-center mt-2">
         {isListening ? "Speak now... click mic to stop" : "Press Enter to send, or click mic to speak"}
       </p>
     </form>
   );
 }