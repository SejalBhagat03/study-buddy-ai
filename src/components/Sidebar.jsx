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
   Sparkles,
 } from "lucide-react";
 
 const navItems = [
   { icon: BookOpen, label: "Dashboard", path: "/dashboard", color: "text-pastel-purple" },
   { icon: MessageCircle, label: "Study Chat", path: "/chat", color: "text-pastel-blue" },
   { icon: GraduationCap, label: "Teacher Mode", path: "/teacher", color: "text-pastel-pink" },
   { icon: FileText, label: "Summaries", path: "/summaries", color: "text-pastel-green" },
   { icon: HelpCircle, label: "Practice Quiz", path: "/quiz", color: "text-pastel-orange" },
   { icon: Layers, label: "Flashcards", path: "/flashcards", color: "text-pastel-yellow" },
   { icon: StickyNote, label: "Notes", path: "/notes", color: "text-pastel-purple" },
   { icon: BarChart3, label: "Analytics", path: "/analytics", color: "text-pastel-blue" },
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
       <div className="p-5 border-b border-sidebar-border">
         <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
           <div className="p-2.5 study-gradient rounded-xl shrink-0 shadow-soft">
             <Sparkles className="w-5 h-5 text-primary-foreground" />
           </div>
           {!isCollapsed && (
             <div>
               <span className="text-lg font-bold text-sidebar-foreground tracking-tight">StudyMate</span>
               <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">AI Learning</p>
             </div>
           )}
         </div>
       </div>
 
       <div className="p-4">
         <Button
           variant={isCollapsed ? "ghost" : "default"}
           size={isCollapsed ? "icon" : "default"}
           className={cn(
             "w-full study-gradient text-primary-foreground shadow-soft hover:shadow-elevated transition-all duration-300",
             isCollapsed && "h-10 w-10"
           )}
           onClick={() => navigate("/chat")}
         >
           <Plus className="w-4 h-4" />
           {!isCollapsed && <span className="ml-2 font-medium">New Session</span>}
         </Button>
       </div>
 
       <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
         <p className={cn(
           "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2",
           isCollapsed && "hidden"
         )}>
           Menu
         </p>
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
                 "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground transition-all duration-200",
                 isActive 
                   ? "bg-primary/10 text-primary font-medium shadow-soft" 
                   : "hover:bg-secondary/70 hover:text-foreground",
                 isCollapsed && "justify-center px-2"
               )}
             >
               <item.icon className={cn(
                 "w-5 h-5 shrink-0 transition-colors",
                 isActive ? "text-primary" : item.color
               )} />
               {!isCollapsed && (
                 <>
                   <span className="flex-1 text-left text-sm">{item.label}</span>
                   <ChevronRight className={cn(
                     "w-4 h-4 opacity-0 -translate-x-2 transition-all",
                     isActive && "opacity-100 translate-x-0",
                     "group-hover:opacity-50 group-hover:translate-x-0"
                   )} />
                 </>
               )}
             </button>
           );
         })}
       </nav>
 
       <div className="p-4 border-t border-sidebar-border mt-auto">
         <div className={cn(
           "flex items-center gap-3 mb-4 p-3 rounded-xl bg-secondary/30",
           isCollapsed && "justify-center p-2"
         )}>
           <div className="w-10 h-10 rounded-xl study-gradient flex items-center justify-center shrink-0 shadow-soft">
             <span className="text-sm font-bold text-primary-foreground">
               {user?.email?.[0].toUpperCase() || "U"}
             </span>
           </div>
           {!isCollapsed && (
             <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold text-sidebar-foreground truncate">
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
             className={cn("flex-1 text-muted-foreground hover:text-foreground", isCollapsed && "w-full")}
           >
             <Settings className="w-4 h-4" />
             {!isCollapsed && <span className="ml-2">Settings</span>}
           </Button>
           <Button
             variant="ghost"
             size={isCollapsed ? "icon" : "sm"}
             onClick={handleSignOut}
             className={cn("flex-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10", isCollapsed && "w-full")}
           >
             <LogOut className="w-4 h-4" />
             {!isCollapsed && <span className="ml-2">Sign out</span>}
           </Button>
         </div>
       </div>
     </div>
   );
 
   return (
     <>
       <button
         onClick={() => setIsMobileOpen(!isMobileOpen)}
         className="fixed top-4 left-4 z-50 lg:hidden p-2.5 glass-card rounded-xl shadow-soft border border-border"
       >
         {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
       </button>
 
       {isMobileOpen && (
         <div
           className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
           onClick={() => setIsMobileOpen(false)}
         />
       )}
 
       <aside
         className={cn(
           "fixed left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-300 lg:hidden shadow-elevated",
           isMobileOpen ? "translate-x-0" : "-translate-x-full"
         )}
       >
         <SidebarContent />
       </aside>
 
       <aside
         className={cn(
           "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative",
           isCollapsed ? "w-[72px]" : "w-64"
         )}
       >
         <SidebarContent />
         
         <button
           onClick={() => setIsCollapsed(!isCollapsed)}
           className="absolute -right-3 top-20 p-1.5 bg-card border border-border rounded-full shadow-soft hover:shadow-elevated hover:bg-secondary transition-all"
         >
           <ChevronRight
             className={cn(
               "w-3.5 h-3.5 text-muted-foreground transition-transform duration-300",
               isCollapsed && "rotate-180"
             )}
           />
         </button>
       </aside>
     </>
   );
 }