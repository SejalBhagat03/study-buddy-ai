import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }
      
      // Clean up the text
      fullText = fullText
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();
      
      if (fullText.length < 50) {
        return `PDF Content from: ${file.name}\n\nThis PDF contains study material that has been uploaded. The content may be image-based or scanned. You can still ask questions about the topic.`;
      }
      
      return fullText;
    } catch (error) {
      console.error("PDF extraction error:", error);
      return `PDF Content from: ${file.name}\n\nThis PDF has been uploaded for study. You can ask questions about the topic mentioned in the title.`;
    }
  };

  const handleUpload = async () => {
    if (!file || !user || !title.trim()) {
      toast.error("Please provide a title and select a PDF file");
      return;
    }

    setIsUploading(true);
    try {
      // Extract text from PDF first
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
      
      // Reset file input
      const fileInput = document.getElementById("pdf-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      if (onUploadComplete && chapter) {
        onUploadComplete(chapter.id, extractedText);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload PDF. Please try again.");
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
              Processing PDF...
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
