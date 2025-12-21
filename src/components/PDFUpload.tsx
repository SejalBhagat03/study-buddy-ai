import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PDFUploadProps {
  onUploadComplete?: (chapterId: string, content: string) => void;
}

export function PDFUpload({ onUploadComplete }: PDFUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(".pdf", ""));
      }
    } else {
      toast.error("Please select a PDF file");
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Use a simple text extraction approach
    // For production, you'd want to use a proper PDF parsing library or edge function
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Basic PDF text extraction - looks for text between stream markers
    let text = "";
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const content = decoder.decode(uint8Array);
    
    // Extract readable text patterns from PDF
    const textMatches = content.match(/\(([^)]+)\)/g);
    if (textMatches) {
      text = textMatches
        .map(match => match.slice(1, -1))
        .filter(t => t.length > 2 && /[a-zA-Z]/.test(t))
        .join(" ");
    }
    
    // If basic extraction fails, return a placeholder message
    if (text.length < 100) {
      return `PDF Content from: ${file.name}\n\nThis PDF contains study material that has been uploaded for analysis. The AI will help you understand and study this content.`;
    }
    
    return text;
  };

  const handleUpload = async () => {
    if (!file || !user || !title.trim()) {
      toast.error("Please provide a title and select a PDF file");
      return;
    }

    setIsUploading(true);
    try {
      // Extract text from PDF
      const extractedText = await extractTextFromPDF(file);

      // Upload PDF to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("chapter-pdfs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create chapter with extracted content
      const { data: chapter, error: chapterError } = await supabase
        .from("chapters")
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: extractedText,
        })
        .select()
        .single();

      if (chapterError) throw chapterError;

      toast.success("PDF uploaded and chapter created!");
      setFile(null);
      setTitle("");
      
      if (onUploadComplete && chapter) {
        onUploadComplete(chapter.id, extractedText);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload PDF");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2 text-sm font-medium">
        <FileText className="h-4 w-4" />
        Upload Chapter PDF
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="pdf-title">Chapter Title</Label>
          <Input
            id="pdf-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chapter title..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pdf-file">PDF File</Label>
          <div className="flex items-center gap-2">
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="flex-1"
            />
          </div>
          {file && (
            <p className="text-xs text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || !title.trim() || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
