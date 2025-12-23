import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  MessageCircle,
  GraduationCap,
  FileText,
  HelpCircle,
  StickyNote,
  Layers,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { icon: BookOpen, label: "Dashboard", path: "/dashboard" },
  { icon: MessageCircle, label: "Study Chat", path: "/chat" },
  { icon: GraduationCap, label: "Teacher Mode", path: "/teacher" },
  { icon: FileText, label: "Summaries", path: "/summaries" },
  { icon: HelpCircle, label: "Practice Quiz", path: "/quiz" },
  { icon: Layers, label: "Flashcards", path: "/flashcards" },
  { icon: StickyNote, label: "Notes", path: "/notes" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="p-2 study-gradient rounded-xl shrink-0">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">StudyMate</span>
          )}
        </div>
      </div>

      {/* New Study Button */}
      <div className="p-4">
        <Button
          variant={isCollapsed ? "ghost" : "gradient"}
          size={isCollapsed ? "icon" : "default"}
          className={cn("w-full", isCollapsed && "h-10 w-10")}
          onClick={() => navigate("/chat")}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span>New Study Session</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsMobileOpen(false);
              }}
              className={cn(
                "sidebar-item w-full",
                isActive && "sidebar-item-active",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3 mb-3", isCollapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-primary">
              {user?.email?.[0].toUpperCase() || "U"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || "Student"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>

        <div className={cn("flex gap-2", isCollapsed && "flex-col")}>
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            className={cn("flex-1", isCollapsed && "w-full")}
          >
            <Settings className="w-4 h-4" />
            {!isCollapsed && <span>Settings</span>}
          </Button>
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            onClick={handleSignOut}
            className={cn("flex-1 text-destructive hover:text-destructive", isCollapsed && "w-full")}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Sign out</span>}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-card rounded-lg shadow-soft border border-border"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-300 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        <SidebarContent />
        
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 p-1.5 bg-card border border-border rounded-full shadow-sm hover:bg-secondary transition-colors"
        >
          <ChevronRight
            className={cn(
              "w-3 h-3 text-muted-foreground transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
        </button>
      </aside>
    </>
  );
}
