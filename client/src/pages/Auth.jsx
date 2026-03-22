import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BookOpen, Mail, Lock, User, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      } else {
        if (!fullName.trim()) {
          toast.error("Please enter your name");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! Welcome aboard!");
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex relative overflow-hidden">
      {/* Ambient background glows for the ENTIRE page wrapper */}
      <div className="absolute top-1/4 -left-12 w-64 h-64 bg-primary/20 rounded-full filter blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-secondary/20 rounded-full filter blur-3xl animate-blob animation-delay-2000" />

      {/* Left side - Modern Decorative Split */}
      <div className="hidden lg:flex lg:w-1/2 bg-white/10 backdrop-blur-md border-r border-white/10 relative overflow-hidden flex-col justify-center p-16">
        {/* Subtle pattern or lights overlay inside left section */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-40" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/15 rounded-full filter blur-2xl animate-pulse-soft" />

        <div className="relative z-10 max-w-sm">
          <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-4 w-fit">
            <div className="p-1.5 bg-gradient-to-r from-primary to-secondary rounded-lg shadow-soft flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-extrabold text-[#1F2937] tracking-tight">StudyMate</span>
          </div>
          
          <h1 className="text-4xl font-extrabold mb-4 leading-tight tracking-tight gradient-text">
            Study Smarter, Not Harder
          </h1>
          <p className="text-xs text-slate-500 mb-8 leading-relaxed max-w-xs">
            Your personal workspace simplifying learning, answering doubts instantly, and keeping goals organized intelligently.
          </p>

          <div className="space-y-4">
            {[
              "Interact with adaptive AI tutors for conceptual clarity",
              "Convert reading materials into structured notes summaries",
              "Practice smarter with custom quiz frameworks modules"
            ].map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-4 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-soft hover:scale-105 transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/10 flex items-center justify-center border border-white/30 shadow-soft group-hover:scale-110 transition-transform">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[#374151] text-xs font-semibold tracking-wide">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-transparent relative z-10">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="absolute top-6 left-6 gap-2 text-slate-500 hover:text-slate-700 rounded-lg h-8 text-xs font-semibold backdrop-blur-sm bg-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>

        {/* Upgrade to glass-card-gradient */}
        <div className="w-full max-w-sm glass-card-gradient p-8 rounded-2xl relative shadow-glow">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="p-1.5 bg-gradient-to-r from-primary to-secondary rounded-lg">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">StudyMate</span>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {isLogin 
                ? "Sign in to continue your study sessions" 
                : "Get started with your AI learning companion"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[10px] font-bold text-slate-600 tracking-wider">FULL NAME</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 h-10 text-xs rounded-xl border-white/20 bg-white/20 backdrop-blur-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all focus:bg-white/40"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 tracking-wider">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl border-white/20 bg-white/20 backdrop-blur-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all focus:bg-white/40"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 tracking-wider">PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl border-white/20 bg-white/20 backdrop-blur-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all focus:bg-white/40"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl px-4 h-11 text-sm font-extrabold shadow-glow mt-2 hover:scale-[1.02] transition-transform duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-1.5 justify-center">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating..."}
                </span>
              ) : (
                <span className="flex items-center gap-1 justify-center">
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-slate-500 hover:text-primary transition-colors duration-200"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
