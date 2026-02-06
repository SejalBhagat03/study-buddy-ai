import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User,
  Mail,
  Calendar,
  Flame,
  Trophy,
  BookOpen,
  FileText,
  Save,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({
    fullName: "",
    avatarUrl: "",
  });
  const [stats, setStats] = useState({
    streak: 0,
    longestStreak: 0,
    totalQuizzes: 0,
    totalFlashcards: 0,
    totalNotes: 0,
    totalChapters: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setIsLoading(true);
      
      try {
        // Load profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", user.id)
          .single();
        
        if (profileData) {
          setProfile({
            fullName: profileData.full_name || user.user_metadata?.full_name || "",
            avatarUrl: profileData.avatar_url || "",
          });
        } else {
          setProfile({
            fullName: user.user_metadata?.full_name || "",
            avatarUrl: "",
          });
        }
        
        // Load stats
        const [streakRes, quizzesRes, flashcardsRes, notesRes, chaptersRes] = await Promise.all([
          supabase.from("study_streaks").select("current_streak, longest_streak").eq("user_id", user.id).single(),
          supabase.from("quizzes").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("flashcards").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("notes").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("chapters").select("id", { count: "exact" }).eq("user_id", user.id),
        ]);
        
        setStats({
          streak: streakRes.data?.current_streak || 0,
          longestStreak: streakRes.data?.longest_streak || 0,
          totalQuizzes: quizzesRes.count || 0,
          totalFlashcards: flashcardsRes.count || 0,
          totalNotes: notesRes.count || 0,
          totalChapters: chaptersRes.count || 0,
        });
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: profile.fullName,
          avatar_url: profile.avatarUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });
      
      if (error) throw error;
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="p-4 rounded-xl bg-secondary/30 text-center">
      <div className={cn("w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center", color)}>
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 pt-16 lg:pt-0">
        <header className="sticky top-0 z-10 glass-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings")}
                className="mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="p-2.5 study-gradient rounded-xl shadow-soft">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">Profile</h1>
                <p className="text-xs text-muted-foreground">
                  Manage your account information
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Profile Card */}
          <div className="glass-card rounded-2xl p-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-2xl study-gradient flex items-center justify-center shadow-glow">
                <span className="text-4xl font-bold text-primary-foreground">
                  {profile.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {profile.fullName || "Student"}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-1 justify-center md:justify-start">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Joined {user?.created_at ? format(new Date(user.created_at), "MMMM yyyy") : "Recently"}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            <div className="space-y-4 border-t border-border pt-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="study-gradient text-primary-foreground gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-pastel-yellow/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Your Progress</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon={Flame} label="Current Streak" value={`${stats.streak} days`} color="bg-pastel-orange/20" />
              <StatCard icon={Trophy} label="Longest Streak" value={`${stats.longestStreak} days`} color="bg-pastel-yellow/20" />
              <StatCard icon={BookOpen} label="Quizzes Taken" value={stats.totalQuizzes} color="bg-pastel-blue/20" />
              <StatCard icon={Sparkles} label="Flashcards" value={stats.totalFlashcards} color="bg-pastel-purple/20" />
              <StatCard icon={FileText} label="Notes" value={stats.totalNotes} color="bg-pastel-pink/20" />
              <StatCard icon={BookOpen} label="Documents" value={stats.totalChapters} color="bg-pastel-green/20" />
            </div>
          </div>

          {/* Achievements Placeholder */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-pastel-purple/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "First Steps", desc: "Complete your first quiz", unlocked: stats.totalQuizzes > 0 },
                { name: "Note Taker", desc: "Create 5 notes", unlocked: stats.totalNotes >= 5 },
                { name: "On Fire", desc: "Reach a 7-day streak", unlocked: stats.longestStreak >= 7 },
                { name: "Card Master", desc: "Create 50 flashcards", unlocked: stats.totalFlashcards >= 50 },
              ].map((achievement) => (
                <div
                  key={achievement.name}
                  className={cn(
                    "p-4 rounded-xl border text-center transition-all",
                    achievement.unlocked
                      ? "bg-primary/10 border-primary/30"
                      : "bg-secondary/30 border-border opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center",
                    achievement.unlocked ? "study-gradient" : "bg-muted"
                  )}>
                    <Trophy className={cn(
                      "w-6 h-6",
                      achievement.unlocked ? "text-primary-foreground" : "text-muted-foreground"
                    )} />
                  </div>
                  <p className="text-sm font-medium text-foreground">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
