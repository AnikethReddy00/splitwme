"use client";

import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Zap,
  ShieldCheck,
  CreditCard,
  LogOut,
  Layers
} from "lucide-react";

export default function AuthPage() {
  const { user, login, register, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regUpi, setRegUpi] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status message
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: "", text: "" });

    if (!loginEmail || !loginPassword) {
      setStatusMsg({ type: "error", text: "Please enter both email and password." });
      return;
    }

    const res = await login(loginEmail, loginPassword);
    if (!res.success) {
      setStatusMsg({ type: "error", text: res.error || "Authentication failed." });
    } else {
      setStatusMsg({ type: "success", text: `Welcome back, ${res.user.name}!` });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: "", text: "" });

    if (!regName || !regEmail || !regPassword) {
      setStatusMsg({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    const res = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      upiId: regUpi
    });

    if (!res.success) {
      setStatusMsg({ type: "error", text: res.error || "Registration failed." });
    } else {
      setStatusMsg({ type: "success", text: "Account created successfully! Welcome to SplitWMe." });
    }
  };

  const handleDemoFill = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
    setActiveTab("login");
    setStatusMsg({ type: "info", text: `Auto-filled demo account for ${email}` });
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-[#060911]">
      {/* Background Animated Gradient Mesh & Glowing Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left Emerald Orb */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-float-slow" />
        
        {/* Center-right Cyan Orb */}
        <div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] bg-cyan-500/15 rounded-full blur-3xl animate-float-reverse" />
        
        {/* Bottom-center Violet Glow */}
        <div className="absolute -bottom-32 left-1/4 w-[32rem] h-[32rem] bg-violet-600/20 rounded-full blur-3xl animate-pulse-glow" />

        {/* Subtle Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: "28px 28px"
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel-subtle text-xs font-medium text-emerald-300 border border-emerald-500/20 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: "6s" }} />
            <span>Smart Split & 1-Click UPI Settlement</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            Split<span className="text-gradient-emerald">WMe</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Split group expenses effortlessly & settle instantly with GPay / UPI links
          </p>
        </div>

        {/* Main Glassmorphic Auth Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 backdrop-blur-2xl border border-white/10 relative overflow-hidden transition-all duration-300">
          
          {/* Top Decorative Highlight Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

          {/* Authenticated State Preview (If Logged In) */}
          {user ? (
            <div className="space-y-6 text-center py-2 animate-fadeIn">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 mx-auto">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-emerald-400" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <p className="text-sm text-slate-400">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  UPI Handle: {user.upiId || "Not configured"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Account Status
                  </span>
                  <span className="text-emerald-400 font-medium">Verified & Protected</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your account is active. You can create groups, log shared trip expenses, and generate 1-click UPI settlement links for your friends.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => alert("Redirecting to Dashboard & Groups...")}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-white btn-glow-primary flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="py-3 px-4 rounded-xl font-medium text-slate-300 glass-panel-subtle hover:text-rose-400 hover:border-rose-500/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated Tabbed Form */
            <div>
              {/* Tab Navigation */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/80 border border-white/5 mb-6 relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setStatusMsg({ type: "", text: "" });
                  }}
                  className={`py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === "login"
                      ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setStatusMsg({ type: "", text: "" });
                  }}
                  className={`py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === "register"
                      ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Create Account
                </button>
              </div>

              {/* Status Alert */}
              {statusMsg.text && (
                <div
                  className={`mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border transition-all ${
                    statusMsg.type === "error"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      : statusMsg.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                  }`}
                >
                  {statusMsg.type === "error" ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              {activeTab === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Password
                      </label>
                      <a
                        href="#forgot"
                        onClick={(e) => {
                          e.preventDefault();
                          alert("Demo account password is: password123");
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-white btn-glow-primary flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* 1-Click Quick Demo Login Chips */}
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 text-center">
                      Quick 1-Click Demo Accounts
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDemoFill("aniketh@splitwme.com", "password123")}
                        className="py-1.5 px-2 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-emerald-500/20 hover:border-emerald-500/30 border border-slate-700/60 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer text-center truncate"
                      >
                        Aniketh
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoFill("rohan@splitwme.com", "password123")}
                        className="py-1.5 px-2 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-emerald-500/20 hover:border-emerald-500/30 border border-slate-700/60 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer text-center truncate"
                      >
                        Rohan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoFill("priya@splitwme.com", "password123")}
                        className="py-1.5 px-2 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-emerald-500/20 hover:border-emerald-500/30 border border-slate-700/60 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer text-center truncate"
                      >
                        Priya
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* REGISTER FORM */}
              {activeTab === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="John Doe"
                        className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-sm placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-sm placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        UPI ID / Payment Handle
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">For 1-Click Pay Links</span>
                    </div>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={regUpi}
                        onChange={(e) => setRegUpi(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-sm placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Password (min 6 chars)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="glass-input w-full pl-10 pr-10 py-2 rounded-xl text-sm placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-white btn-glow-primary flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="glass-panel-subtle p-3 rounded-2xl border border-white/5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Bank-Grade Security</div>
            <div className="text-[10px] text-slate-400">256-bit Encrypted</div>
          </div>
          
          <div className="glass-panel-subtle p-3 rounded-2xl border border-white/5">
            <Zap className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">1-Click Settle</div>
            <div className="text-[10px] text-slate-400">Direct UPI Link</div>
          </div>

          <div className="glass-panel-subtle p-3 rounded-2xl border border-white/5">
            <QrCode className="w-4 h-4 text-violet-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Smart Minimizer</div>
            <div className="text-[10px] text-slate-400">Debt Simplification</div>
          </div>
        </div>
      </div>
    </main>
  );
}
