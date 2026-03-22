import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  MessageCircle,
  FileText,
  HelpCircle,
  Layers,
  Notebook,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronRight,
} from "lucide-react";

// Standard Feature mapping based on standard guides
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", colorClass: "text-slate-700" },
  { icon: MessageCircle, label: "AI Chat", path: "/chat", colorClass: "text-sky-700" },
  { icon: FileText, label: "Summaries", path: "/summaries", colorClass: "text-indigo-700" },
  { icon: HelpCircle, label: "Quiz Generator", path: "/quiz", colorClass: "text-green-700" },
  { icon: Layers, label: "Flashcards", path: "/flashcards", colorClass: "text-pink-700" },
  { icon: Notebook, label: "Notes", path: "/notes", colorClass: "text-amber-700" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", colorClass: "text-violet-700" },
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
    <div className="flex flex-col h-full bg-white/25 backdrop-blur-xl border-r border-white/10">
      {/* Brand Logo */}
      <div className="p-5 border-b border-white/10">
        <div className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
          <div className="p-1.5 bg-gradient-to-r from-primary to-secondary rounded-xl shrink-0 shadow-soft">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="text-sm font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight">StudyMate</span>
              <p className="text-[9px] text-slate-500 font-bold tracking-wide uppercase">Workspace</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4">
        <Button
          variant={isCollapsed ? "ghost" : "default"}
          size={isCollapsed ? "icon" : "default"}
          className={cn(
            "w-full bg-gradient-to-r from-primary to-secondary hover:shadow-glow text-white rounded-xl shadow-soft font-bold text-xs h-9 transition-all duration-300",
            isCollapsed && "h-10 w-10 p-0"
          )}
          onClick={() => navigate("/chat")}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span className="ml-1.5">New Session</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
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
                "group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 text-left hover:translate-x-0.5",
                isActive 
                  ? "bg-gradient-to-r from-primary/30 to-secondary/30 text-slate-800 font-bold shadow-soft border border-white/30" 
                  : "text-slate-600 hover:bg-white/40 hover:text-slate-900 hover:shadow-soft",
                isCollapsed && "justify-center px-1"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive ? "text-primary" : `opacity-75 group-hover:opacity-100 ${item.colorClass}`
              )} />
              {!isCollapsed && <span className="flex-1 text-[11px] tracking-wide">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-white/10 mt-auto bg-white/20 backdrop-blur-md">
        <div className={cn(
          "flex items-center gap-2 mb-3 p-2 rounded-xl glass-card border-white/20 shadow-soft",
          isCollapsed && "justify-center p-1.5"
        )}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/40 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {user?.email?.[0].toUpperCase() || "U"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {user?.name || "Student"}
              </p>
              <p className="text-[9px] text-slate-500 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>

       <div className={cn("flex gap-1", isCollapsed && "flex-col")}>
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              onClick={() => {
                navigate("/settings");
                setIsMobileOpen(false);
              }}
              className={cn("flex-1 text-slate-600 hover:text-slate-900 hover:bg-white/50 hover:shadow-soft h-8 text-xs rounded-lg transition-all", isCollapsed && "w-8 h-8 p-0")}
            >
              <Settings className="w-3.5 h-3.5" />
              {!isCollapsed && <span className="ml-1 text-[10px] font-bold">Settings</span>}
            </Button>
           <Button
             variant="ghost"
             size={isCollapsed ? "icon" : "sm"}
             onClick={handleSignOut}
             className={cn("flex-1 text-slate-600 hover:text-rose-600 hover:bg-white/50 hover:shadow-soft h-8 text-xs rounded-lg transition-all", isCollapsed && "w-8 h-8 p-0")}
           >
             <LogOut className="w-3.5 h-3.5" />
             {!isCollapsed && <span className="ml-1 text-[10px] font-bold">Sign out</span>}
           </Button>
         </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-sm border border-slate-200"
      >
        {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white/10 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 lg:hidden shadow-md",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white/10 backdrop-blur-xl border-r border-white/10 transition-all duration-150 relative h-screen sticky top-0",
          isCollapsed ? "w-[64px]" : "w-60"
        )}
      >
        <SidebarContent />
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 p-1 bg-white border border-white/20 rounded-full shadow-soft hover:shadow-md hover:bg-slate-50 transition-all z-10"
        >
          <ChevronRight
            className={cn(
              "w-3 h-3 text-slate-400 transition-transform duration-100",
              isCollapsed && "rotate-180"
            )}
          />
        </button>
      </aside>
    </>
  );
}