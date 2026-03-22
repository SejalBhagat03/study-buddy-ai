import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle2, Trash2, Plus } from "lucide-react";
import api from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

export function PDFUpload({ onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);
  const { user } = useAuth();

  const handleFileChange = (e) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
    }
  };

  const validateAndAddFiles = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter(f => f.type === "application/pdf");
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    } else {
      toast.error("Please select valid PDF files");
    }
  };

  const removeFile = (index) => {
    if (isUploading) return;
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const extractTextFromPDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }
      
      fullText = fullText.replace(/\s+/g, " ").replace(/\n\s*\n/g, "\n\n").trim();
      return fullText.length < 50 ? `PDF: ${file.name}\nGeneric material placeholder.` : fullText;
    } catch (error) {
      console.error("PDF extraction error:", error);
      return `PDF Content from: ${file.name}`;
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 || !user) {
      toast.error("Please select at least one PDF file");
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentUploadIndex(i);
        const f = files[i];
        const extractedText = await extractTextFromPDF(f);
        const cleanTitle = f.name.replace(".pdf", "").substring(0, 100);

        const response = await api.post("/chapters", {
          title: cleanTitle,
          content: extractedText,
        });

        if (response.data?.data) successCount++;
      }

      toast.success(`Successfully uploaded ${successCount} files!`);
      setFiles([]);
      if (onUploadComplete) onUploadComplete();

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload all files. Please try again.");
    } finally {
      setIsUploading(false);
      setCurrentUploadIndex(-1);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden ${
          isDragging 
            ? "border-primary bg-primary/5 shadow-glow scale-[1.02]" 
            : "border-slate-200 bg-white/50 hover:bg-white/80 hover:border-primary/50"
        }`}
      >
        <input
          ref={fileInputRef}
          id="pdf-file"
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center animate-fade-in">
          <div className={`p-2 rounded-lg mb-2 ${isDragging ? "bg-primary/20 text-primary" : "bg-slate-100/80 text-slate-400 border border-slate-100"}`}>
            {isDragging ? <Upload className="h-6 w-6 animate-pulse" /> : <Plus className="h-6 w-6" />}
          </div>
          <p className="text-xs font-extrabold text-slate-700">Drag & Drop chapters here</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">or click to browse multiple PDFs</p>
        </div>
      </div>

      {/* Files List Queue Section framed inside lists continuous setups buffers */}
      {files.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Queue ({files.length})</h4>
            {!isUploading && (
              <button 
                onClick={() => { setFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; }} 
                className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {files.map((f, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-2 rounded-xl border border-white/20 glass-card bg-white/40 shadow-sm animate-fade-in ${
                  isUploading && currentUploadIndex === index ? "border-emerald-300 bg-emerald-500/5" : ""
                }`}
              >
                <div className="flex items-center gap-2 max-w-[80%]">
                  {isUploading && currentUploadIndex === index ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500 shrink-0" />
                  ) : isUploading && currentUploadIndex > index ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-extrabold text-slate-700 truncate">{f.name}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                {!isUploading && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <Button
          onClick={(e) => { e.stopPropagation(); handleUpload(); }}
          disabled={isUploading}
          className="w-full rounded-xl h-10 font-bold transition-all duration-300 hover:shadow-glow"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading {currentUploadIndex + 1} of {files.length}...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload {files.length} {files.length === 1 ? 'file' : 'files'}
            </>
          )}
        </Button>
      )}

    </div>
  );
}