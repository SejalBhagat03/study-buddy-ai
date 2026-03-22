import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useChapters } from "@/hooks/useChapters";
import { useExport } from "@/hooks/useExport";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import api from "@/api";
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Loader2,
  Download
} from "lucide-react";

export default function Notes() {
  const { user } = useAuth();
  const { chapters } = useChapters();
  const { exportNotesAsMarkdown, exportNotesAsHTML } = useExport();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    chapter_id: "",
  });

  const [editNote, setEditNote] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.get("/notes");
      setNotes(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!user || !newNote.title.trim() || !newNote.content.trim()) {
      toast.error("Please fill in title and content");
      return;
    }

    try {
      await api.post("/notes", {
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        chapter_id: newNote.chapter_id || null,
      });

      toast.success("Note created!");
      setNewNote({ title: "", content: "", chapter_id: "" });
      setShowNewNote(false);
      fetchNotes();
    } catch (error) {
      console.error("Failed to create note:", error);
      toast.error("Failed to create note");
    }
  };

  const updateNote = async (id) => {
    if (!editNote.title.trim() || !editNote.content.trim()) {
      toast.error("Please fill in title and content");
      return;
    }

    try {
      await api.put(`/notes/${id}`, {
        title: editNote.title.trim(),
        content: editNote.content.trim()
      });

      toast.success("Note updated!");
      setEditingId(null);
      fetchNotes();
    } catch (error) {
      console.error("Failed to update note:", error);
      toast.error("Failed to update note");
    }
  };

  const deleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      toast.success("Note deleted");
      fetchNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
    }
  };

  const startEditing = (note) => {
    setEditingId(note._id || note.id);
    setEditNote({ title: note.title, content: note.content });
  };

  const getChapterTitle = (chapterId) => {
    if (!chapterId) return null;
    return chapters.find((c) => c._id === chapterId || c.id === chapterId)?.title;
  };

  const handleExport = (format) => {
    const exportData = notes.map((note) => ({
      title: note.title,
      content: note.content,
      chapter: getChapterTitle(note.chapter_id) || undefined,
      updated_at: note.updatedAt || note.updated_at,
    }));
    
    if (format === "markdown") {
      exportNotesAsMarkdown(exportData);
    } else {
      exportNotesAsHTML(exportData);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 bg-transparent">
        <div className="w-full max-w-7xl mx-auto">

          <PageHeader 
            icon={StickyNote} 
            title="Study Notes" 
            subtitle="Organize your thoughts and study guides." 
            bgClass="bg-[#86EFAC]/10" 
            iconClass="text-green-800" 
            borderClass="border-[#86EFAC]/20"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={notes.length === 0} className="rounded-xl text-xs h-8 px-3 font-semibold text-slate-600">
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("markdown")} className="text-xs">
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("html")} className="text-xs">
                  Export as HTML
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={() => setShowNewNote(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs h-8 px-4 font-semibold shadow-sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Note
            </Button>
          </PageHeader>


          {/* Quick Actions & Templates Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fade-in">
             <Card onClick={() => { setShowNewNote(true); setNewNote({ title: "Lecture Notes", content: "## Topic:\n\n## Key Concepts:\n- \n- \n\n## Summary:\n", chapter_id: "" }) }} className="glass-card border border-white/20 p-4 hover:shadow-md transition-all cursor-pointer group hover:border-primary/30 flex-1">
                <CardContent className="p-0 flex flex-col gap-2">
                   <div className="p-2 rounded-lg bg-pink-100 text-pink-600 w-fit group-hover:scale-105 transition-all"><StickyNote className="h-4 w-4" /></div>
                   <h4 className="font-bold text-xs text-slate-800">Lecture Notes</h4>
                   <p className="text-[10px] text-slate-500">Prefilled structure for class notes.</p>
                </CardContent>
             </Card>
             <Card onClick={() => { setShowNewNote(true); setNewNote({ title: "Quick Summary", content: "- Concept 1:\n- Concept 2:\n\n**Takeaway:**", chapter_id: "" }) }} className="glass-card border border-white/20 p-4 hover:shadow-md transition-all cursor-pointer group hover:border-primary/30 flex-1">
                <CardContent className="p-0 flex flex-col gap-2">
                   <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 w-fit group-hover:scale-105 transition-all"><StickyNote className="h-4 w-4" /></div>
                   <h4 className="font-bold text-xs text-slate-800">Quick Summary</h4>
                   <p className="text-[10px] text-slate-500">Concise takeaways and highlights.</p>
                </CardContent>
             </Card>
             <Card onClick={() => setShowNewNote(true)} className="glass-card border border-white/20 p-4 hover:shadow-md transition-all cursor-pointer group hover:border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 flex-1">
                <CardContent className="p-0 flex flex-col gap-2">
                   <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit group-hover:scale-105 transition-all"><Plus className="h-4 w-4" /></div>
                   <h4 className="font-bold text-xs text-slate-800">Blank Note</h4>
                   <p className="text-[10px] text-slate-500">Start from scratch with empty slate.</p>
                </CardContent>
             </Card>
          </div>

          <div className="mb-4 flex items-center justify-between gap-2 max-w-sm ml-auto">
             <div className="relative w-full">
                <StickyNote className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input 
                   placeholder="Search notes..." 
                   value={searchTerm} 
                   onChange={(e) => setSearchTerm(e.target.value)} 
                   className="pl-8 rounded-xl text-xs h-8 bg-white/50 border-white/10"
                />
             </div>
          </div>

          {/* New Note Form */}
          {showNewNote && (
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                  <StickyNote className="w-4 h-4 text-indigo-600" />
                  Create New Note
              </div>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
                <Select
                  value={newNote.chapter_id}
                  onValueChange={(value) =>
                    setNewNote((prev) => ({ ...prev, chapter_id: value === "none" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to chapter (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No chapter</SelectItem>
                    {chapters.map((chapter) => (
                      <SelectItem key={chapter._id || chapter.id} value={chapter._id || chapter.id}>
                        {chapter.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Write your notes here..."
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote((prev) => ({ ...prev, content: e.target.value }))
                  }
                  rows={6}
                />
                <div className="flex gap-2">
                  <Button onClick={createNote}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Note
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewNote(false);
                      setNewNote({ title: "", content: "", chapter_id: "" });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="grid md:grid-cols-5 gap-6 mb-8 animate-fade-in border border-slate-100 p-6 rounded-xl bg-white/50">
              <div className="md:col-span-2 space-y-4 flex flex-col justify-center">
                 <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Structured Notes</h3>
                 <div className="space-y-4 relative">
                    <div className="flex gap-4 relative z-10">
                       <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11"><StickyNote className="w-5 h-5" /></div>
                       <div><h4 className="text-xs font-black text-slate-800">1. Pick Title</h4><p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Link to Chapters nodes effectively.</p></div>
                    </div>
                    <div className="flex gap-4 relative z-10">
                       <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/20 text-primary flex items-center justify-center shrink-0 w-11 h-11"><Plus className="w-5 h-5" /></div>
                       <div><h4 className="text-xs font-black text-slate-800">2. Write Structure</h4><p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">Define bullets points concisely.</p></div>
                    </div>
                 </div>
              </div>
              <Card className="md:col-span-3 flex items-center justify-center p-6 text-center border-dashed border-slate-200">
                 <CardContent className="p-0">
                    <StickyNote className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-bold text-slate-700 mb-1">No notes yet</p>
                    <p className="text-[11px] text-slate-500 mb-4 max-w-xs">Create your first study note using a template above to get started.</p>
                    <Button onClick={() => setShowNewNote(true)} className="rounded-xl">
                       <Plus className="h-4 w-4 mr-2" />
                       Start Note
                    </Button>
                 </CardContent>
              </Card>
           </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase())).map((note) => (
                <Card key={note._id || note.id} className="hover:shadow-md transition-all duration-200 border-white/20 group hover:border-primary/20">
                  <CardContent className="pt-6">
                    {editingId === (note._id || note.id) ? (
                      <div className="space-y-4">
                        <Input
                          value={editNote.title}
                          onChange={(e) =>
                            setEditNote((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                        />
                        <Textarea
                          value={editNote.content}
                          onChange={(e) =>
                            setEditNote((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          rows={6}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => updateNote(note._id || note.id)}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-sm text-slate-800">
                              {note.title}
                            </h3>
                            {getChapterTitle(note.chapter_id) && (
                              <p className="text-[10px] text-muted-foreground">
                                Chapter: {getChapterTitle(note.chapter_id)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => startEditing(note)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-7 w-7"
                              onClick={() => deleteNote(note._id || note.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-4">
                          {note.content}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-4">
                          Updated:{" "}
                          {new Date(note.updatedAt || note.updated_at).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
