import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
// Removed Supabase
import api from "@/api";

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
  Edit2,
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
  const [isEditMode, setIsEditMode] = useState(false);
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
        const response = await api.get("/user/profile");
        const data = response.data.data;
        
        setProfile({
          fullName: data.name || "",
          avatarUrl: "",
        });
        
        setStats({
          streak: data.streak.currentStreak || 0,
          longestStreak: data.streak.longestStreak || 0,
          totalQuizzes: data.stats.totalQuizzes || 0,
          totalFlashcards: data.stats.totalFlashcards || 0,
          totalNotes: data.stats.totalNotes || 0,
          totalChapters: data.stats.totalChapters || 0,
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
      await api.put("/user/profile", {
        fullName: profile.fullName,
      });
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };


  const StatCard = ({ icon: Icon, label, value, color, path }) => (
    <div 
      onClick={() => path && navigate(path)} 
      className={cn(
        "p-4 rounded-xl bg-slate-50 border border-slate-100 text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 group",
        path ? "hover:shadow-md hover:-translate-y-1 cursor-pointer hover:border-primary/20 hover:bg-white" : ""
      )}
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm mb-1 group-hover:scale-105 transition-transform", color)}>
        <Icon className="w-4 h-4 text-slate-700" />
      </div>
      <p className="text-xl font-black tracking-tight text-slate-800">{value}</p>
      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
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

      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8">
        <header className="sticky top-0 z-10 glass-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
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

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Profile Card */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in flex flex-col gap-6">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100/80 pb-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl study-gradient flex items-center justify-center shadow-md">
                    <span className="text-3xl font-extrabold text-primary-foreground">
                      {profile.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-xl font-bold text-slate-800 mb-1">
                      {profile.fullName || "Student"}
                    </h2>
                     <div className="flex items-center gap-2 text-slate-500 justify-center md:justify-start">
                       <Mail className="w-3.5 h-3.5" strokeWidth={2.5} />
                       <span className="text-xs font-bold">{user?.email}</span>
                     </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" onClick={() => setIsEditMode(!isEditMode)} className="rounded-xl h-8 px-3.5 text-xs font-extrabold text-slate-600 gap-1.5 border-dashed">
                      <Edit2 className="w-3.5 h-3.5" />
                      {isEditMode ? "View Profile" : "Edit Details"}
                   </Button>
                </div>
             </div>

             {/* Edit mode vs Info View */}
             {isEditMode ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5 flex-1">
                     <Label htmlFor="fullName" className="text-xs font-extrabold text-slate-700">Full Name</Label>
                     <Input
                        id="fullName"
                        value={profile.fullName}
                        onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                        className="rounded-xl h-9 text-xs font-medium border-slate-200"
                     />
                  </div>
                  <div className="flex justify-end gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setIsEditMode(false)}
                       className="rounded-xl h-8 text-[11px] font-bold"
                     >
                       Cancel
                     </Button>
                     <Button
                       onClick={async () => { await handleSaveProfile(); setIsEditMode(false); }}
                       disabled={isSaving}
                       className="study-gradient text-primary-foreground gap-1.5 h-8 rounded-xl text-[11px] font-bold px-4"
                     >
                       <Save className="w-3.5 h-3.5" />
                       {isSaving ? "Saving..." : "Save Changes"}
                     </Button>
                  </div>
                </div>
             ) : (
                <div className="space-y-3 animate-fade-in">
                   <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                      <span>Profile Strength</span>
                      <span className="text-primary">{profile.fullName ? "100%" : "50%"}</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100/80 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-inner">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse-soft transition-all duration-500" style={{ width: profile.fullName ? "100%" : "50%" }} />
                   </div>
                   <p className="text-[10px] text-slate-500 font-semibold">{profile.fullName ? "Your profile is fully complete!" : "Complete your name to strengthen your profile ranking."}</p>
                </div>
             )}
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
              <StatCard icon={Flame} label="Current Streak" value={`${stats.streak} days`} color="bg-pastel-orange/20" path="/analytics" />
              <StatCard icon={Trophy} label="Longest Streak" value={`${stats.longestStreak} days`} color="bg-pastel-yellow/20" path="/analytics" />
              <StatCard icon={BookOpen} label="Quizzes Taken" value={stats.totalQuizzes} color="bg-pastel-blue/20" path="/quiz" />
              <StatCard icon={Sparkles} label="Flashcards" value={stats.totalFlashcards} color="bg-pastel-purple/20" path="/flashcards" />
              <StatCard icon={FileText} label="Notes" value={stats.totalNotes} color="bg-pastel-pink/20" path="/notes" />
              <StatCard icon={BookOpen} label="Summaries" value={stats.totalChapters} color="bg-pastel-green/20" path="/summaries" />
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
              {/* Achievements Map */}
              {[
                { name: "First Steps", desc: "Complete your first quiz", unlocked: stats.totalQuizzes > 0 },
                { name: "Note Taker", desc: "Create 5 notes", unlocked: stats.totalNotes >= 5 },
                { name: "On Fire", desc: "Reach a 7-day streak", unlocked: stats.longestStreak >= 7 },
                { name: "Card Master", desc: "Create 50 flashcards", unlocked: stats.totalFlashcards >= 50 },
              ].map((achievement) => (
                <div key={achievement.name} className="relative group">
                  <div
                    className={cn(
                      "p-4 rounded-xl border text-center transition-all duration-300 h-full flex flex-col items-center justify-center gap-1",
                      achievement.unlocked
                        ? "bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border-primary/20 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                        : "bg-slate-50/80 border-slate-100 opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-11 h-11 rounded-xl mb-1 flex items-center justify-center transition-transform duration-300",
                      achievement.unlocked 
                        ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-sm group-hover:scale-110 group-hover:rotate-6" 
                        : "bg-slate-100 text-slate-400"
                    )}>
                      <Trophy className={cn(
                        "w-5 h-5",
                        achievement.unlocked ? "text-white" : "text-slate-400"
                      )} />
                    </div>
                    <p className="text-xs font-extrabold text-slate-800">{achievement.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium md:hidden">{achievement.desc}</p>
                  </div>

                  {/* Desktop Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 p-1.5 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-max max-w-[150px] shadow-lg text-center font-bold z-20 hidden md:block">
                     {achievement.desc}
                     <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
