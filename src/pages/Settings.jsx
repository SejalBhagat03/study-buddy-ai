import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Bell,
  BellOff,
  Target,
  Clock,
  Save,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  // Notification preferences (stored in localStorage)
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("studymate-notifications");
    return saved ? JSON.parse(saved) : {
      dailyReminder: true,
      streakAlerts: true,
      quizComplete: true,
      newContent: false,
    };
  });

  // Study goals
  const [studyGoals, setStudyGoals] = useState({
    dailyMinutes: 30,
    weeklyQuizzes: 3,
    flashcardsPerDay: 20,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load study goals from database
  useEffect(() => {
    const loadGoals = async () => {
      if (!user) return;
      
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_goals")
        .select("target_minutes")
        .eq("user_id", user.id)
        .eq("goal_date", today)
        .single();
      
      if (data) {
        setStudyGoals(prev => ({ ...prev, dailyMinutes: data.target_minutes }));
      }
    };
    
    loadGoals();
  }, [user]);

  // Save notification preferences
  useEffect(() => {
    localStorage.setItem("studymate-notifications", JSON.stringify(notifications));
  }, [notifications]);

  const handleSaveGoals = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { error } = await supabase
        .from("daily_goals")
        .upsert({
          user_id: user.id,
          goal_date: today,
          target_minutes: studyGoals.dailyMinutes,
          completed_minutes: 0,
        }, {
          onConflict: "user_id,goal_date",
        });
      
      if (error) throw error;
      
      // Also save other goals to localStorage
      localStorage.setItem("studymate-goals", JSON.stringify(studyGoals));
      
      toast.success("Study goals saved successfully!");
    } catch (error) {
      console.error("Error saving goals:", error);
      toast.error("Failed to save goals");
    } finally {
      setIsLoading(false);
    }
  };

  const SettingSection = ({ icon: Icon, title, children, color = "bg-pastel-purple/20" }) => (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 pt-16 lg:pt-0">
        <header className="sticky top-0 z-10 glass-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="p-2.5 study-gradient rounded-xl shadow-soft">
                <SettingsIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">Settings</h1>
                <p className="text-xs text-muted-foreground">
                  Customize your learning experience
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/profile")}
              className="gap-2"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">View Profile</span>
            </Button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Theme Settings */}
          <SettingSection icon={theme === "dark" ? Moon : Sun} title="Appearance" color="bg-pastel-blue/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Theme</Label>
                    <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-muted-foreground" />
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                  <Moon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </SettingSection>

          {/* Notification Settings */}
          <SettingSection icon={Bell} title="Notifications" color="bg-pastel-pink/20">
            <div className="space-y-3">
              {[
                { key: "dailyReminder", label: "Daily Study Reminder", desc: "Get reminded to study every day" },
                { key: "streakAlerts", label: "Streak Alerts", desc: "Be notified when your streak is at risk" },
                { key: "quizComplete", label: "Quiz Completion", desc: "Celebrate when you finish a quiz" },
                { key: "newContent", label: "New Content", desc: "Get notified about new study materials" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    {notifications[item.key] ? (
                      <Bell className="w-5 h-5 text-primary" />
                    ) : (
                      <BellOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label className="text-sm font-medium">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </SettingSection>

          {/* Study Goals */}
          <SettingSection icon={Target} title="Study Goals" color="bg-pastel-green/20">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Daily Study Time</Label>
                      <p className="text-xs text-muted-foreground">Target minutes per day</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{studyGoals.dailyMinutes} min</span>
                </div>
                <Slider
                  value={[studyGoals.dailyMinutes]}
                  onValueChange={([value]) => setStudyGoals((prev) => ({ ...prev, dailyMinutes: value }))}
                  min={15}
                  max={180}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15 min</span>
                  <span>3 hours</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/30">
                  <Label className="text-sm font-medium">Weekly Quizzes</Label>
                  <Input
                    type="number"
                    value={studyGoals.weeklyQuizzes}
                    onChange={(e) => setStudyGoals((prev) => ({ ...prev, weeklyQuizzes: parseInt(e.target.value) || 0 }))}
                    min={1}
                    max={20}
                    className="mt-2"
                  />
                </div>
                <div className="p-4 rounded-xl bg-secondary/30">
                  <Label className="text-sm font-medium">Flashcards/Day</Label>
                  <Input
                    type="number"
                    value={studyGoals.flashcardsPerDay}
                    onChange={(e) => setStudyGoals((prev) => ({ ...prev, flashcardsPerDay: parseInt(e.target.value) || 0 }))}
                    min={5}
                    max={100}
                    className="mt-2"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveGoals}
                disabled={isLoading}
                className="w-full study-gradient text-primary-foreground gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : "Save Study Goals"}
              </Button>
            </div>
          </SettingSection>
        </div>
      </main>
    </div>
  );
}
