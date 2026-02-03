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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChapters } from "@/hooks/useChapters";
import { useExport } from "@/hooks/useExport";
import { toast } from "sonner";
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
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      toast.error("Failed to load notes");
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
      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        chapter_id: newNote.chapter_id || null,
      });

      if (error) throw error;

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
      const { error } = await supabase
        .from("notes")
        .update({
          title: editNote.title.trim(),
          content: editNote.content.trim(),
        })
        .eq("id", id);

      if (error) throw error;

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
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Note deleted");
      fetchNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
    }
  };

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditNote({ title: note.title, content: note.content });
  };

  const getChapterTitle = (chapterId) => {
    if (!chapterId) return null;
    return chapters.find((c) => c.id === chapterId)?.title;
  };

  const handleExport = (format) => {
    const exportData = notes.map((note) => ({
      title: note.title,
      content: note.content,
      chapter: getChapterTitle(note.chapter_id) || undefined,
      updated_at: note.updated_at,
    }));
    
    if (format === "markdown") {
      exportNotesAsMarkdown(exportData);
    } else {
      exportNotesAsHTML(exportData);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 lg:pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Study Notes</h1>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={notes.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("markdown")}>
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("html")}>
                    Export as HTML (PDF)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setShowNewNote(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>
          </div>

          {/* New Note Form */}
          {showNewNote && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  Create New Note
                </CardTitle>
              </CardHeader>
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
                      <SelectItem key={chapter.id} value={chapter.id}>
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
            <Card>
              <CardContent className="py-12 text-center">
                <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  No notes yet. Create your first study note!
                </p>
                <Button onClick={() => setShowNewNote(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="pt-6">
                    {editingId === note.id ? (
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
                          <Button onClick={() => updateNote(note.id)}>
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
                            <h3 className="font-semibold text-lg">
                              {note.title}
                            </h3>
                            {getChapterTitle(note.chapter_id) && (
                              <p className="text-sm text-muted-foreground">
                                Chapter: {getChapterTitle(note.chapter_id)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(note)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteNote(note.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-4">
                          Updated:{" "}
                          {new Date(note.updated_at).toLocaleDateString()}
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
