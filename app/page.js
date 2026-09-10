"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import DashboardView from "./components/DashboardView";
import ReceiptCard from "./components/ReceiptCard";
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
  Share2,
  Receipt,
  ArrowUpRight,
  Check,
  X
} from "lucide-react";

function HomePageContent() {
  const { user, login, register, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialGroupId = searchParams ? searchParams.get("group") : null;

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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
      setIsAuthModalOpen(false);
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
      setIsAuthModalOpen(false);
    }
  };

  const handleDemoFill = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
    setActiveTab("login");
    setStatusMsg({ type: "info", text: `Selected demo account: ${email}` });
  };

  // If user is authenticated, render the full Dashboard with initialGroupId
  if (user) {
    return <DashboardView initialGroupId={initialGroupId} />;
  }

  return (
    <main className="min-h-screen bg-white text-[#09090b] selection:bg-[#09090b] selection:text-white flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-[#e4e4e7] sticky top-0 z-30 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#09090b] text-white flex items-center justify-center font-bold text-sm">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-[#09090b]">
              SplitWMe
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setActiveTab("login");
                setIsAuthModalOpen(true);
              }}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-[#09090b] hover:bg-[#f4f4f5] transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setIsAuthModalOpen(true);
              }}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-white btn-bharpai-primary flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bharpai-pill text-xs font-medium text-[#09090b]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Split bills over UPI. Friends never install anything.</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#09090b] leading-[1.08]">
              One person collects, friends tap a link and pay by UPI with exact amount prefilled.
            </h1>

            <p className="text-base sm:text-lg text-[#71717a] max-w-xl leading-relaxed">
              No app download or sign-up needed for payers. Share a link on WhatsApp, their UPI app (GPay / PhonePe / Paytm) opens with the exact fractional amount. Money goes directly to your bank account.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setActiveTab("register");
                  setIsAuthModalOpen(true);
                }}
                className="py-3.5 px-6 rounded-xl text-sm font-bold text-white btn-bharpai-primary flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Create a Split Group</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  handleDemoFill("aniketh@splitwme.com", "password123");
                  setIsAuthModalOpen(true);
                }}
                className="py-3.5 px-6 rounded-xl text-sm font-semibold btn-bharpai-secondary flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Try Demo: Aniketh</span>
              </button>
            </div>

            {/* Key Trust Badges */}
            <div className="pt-6 border-t border-[#e4e4e7] grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-xs font-bold text-[#09090b]">100% Direct UPI</div>
                <div className="text-[11px] text-[#71717a]">Zero wallet lock-in</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#09090b]">Zero App Install</div>
                <div className="text-[11px] text-[#71717a]">Payers tap & pay</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#09090b]">Smart Min-Cash</div>
                <div className="text-[11px] text-[#71717a]">Fewest transfers</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Bharpai Receipt Simulator */}
          <div className="lg:col-span-5">
            <ReceiptCard
              title="Goa Beach Villa & Seafood 🌴"
              totalAmount={4800}
              paidBy="Aniketh Reddy"
              paidByUpi="aniketh@okhdfcbank"
              initialMembers={["Aniketh Reddy", "Karthik", "Rohan", "Priya"]}
            />
          </div>

        </div>
      </section>

      {/* 3-Step How It Works */}
      <section className="bg-[#f4f4f5] border-y border-[#e4e4e7] py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold font-display tracking-tight text-[#09090b]">
              How it works in 3 simple steps
            </h2>
            <p className="text-sm text-[#71717a] mt-2">
              The fastest way to settle shared group expenses without the awkward math.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bharpai-card p-6 bg-white space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#09090b] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-bold font-display text-[#09090b]">
                Add bill & who was there
              </h3>
              <p className="text-xs text-[#71717a] leading-relaxed">
                Log the expense title, amount, and pick the specific friends who participated. Split equally or by custom subset.
              </p>
            </div>

            <div className="bharpai-card p-6 bg-white space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#09090b] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-bold font-display text-[#09090b]">
                Share 1-tap WhatsApp link
              </h3>
              <p className="text-xs text-[#71717a] leading-relaxed">
                Copy the link or send a formatted WhatsApp reminder with direct settlement links or instant UPI QR codes.
              </p>
            </div>

            <div className="bharpai-card p-6 bg-white space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#09090b] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-bold font-display text-[#09090b]">
                Friends tap & UPI opens prefilled
              </h3>
              <p className="text-xs text-[#71717a] leading-relaxed">
                Their UPI app (GPay, PhonePe, Paytm, CRED) launches with your name & exact amount. Money lands directly in your bank account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717a]">
        <div>© 2026 SplitWMe. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <span>Direct UPI Transfers</span>
          <span>•</span>
          <span>No Middleware</span>
          <span>•</span>
          <span>Free Forever</span>
        </div>
      </footer>

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/60 backdrop-blur-sm animate-fadeIn">
          <div className="bharpai-card max-w-md w-full p-6 sm:p-8 relative bg-white border border-[#e4e4e7] shadow-2xl">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-[#09090b] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Brand in modal */}
            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#09090b] text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black font-display tracking-tight text-[#09090b]">
                {activeTab === "login" ? "Sign in to SplitWMe" : "Create your account"}
              </h3>
              <p className="text-xs text-[#71717a] mt-1">
                Start logging expenses & collecting 1-tap UPI payments
              </p>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] mb-5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setStatusMsg({ type: "", text: "" });
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "login"
                    ? "bg-white text-[#09090b] shadow-sm"
                    : "text-[#71717a] hover:text-[#09090b]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setStatusMsg({ type: "", text: "" });
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "register"
                    ? "bg-white text-[#09090b] shadow-sm"
                    : "text-[#71717a] hover:text-[#09090b]"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Status Alert */}
            {statusMsg.text && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 border ${
                  statusMsg.type === "error"
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                {statusMsg.type === "error" ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {activeTab === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#09090b] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bharpai-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#09090b] mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bharpai-input w-full px-3.5 py-2.5 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#09090b]"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white btn-bharpai-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* 1-Click Demo Login */}
                <div className="pt-4 border-t border-[#e4e4e7]">
                  <button
                    type="button"
                    onClick={() => handleDemoFill("aniketh@splitwme.com", "password123")}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold btn-bharpai-secondary flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-fill Demo: Aniketh Reddy</span>
                  </button>
                </div>
              </form>
            )}

            {/* REGISTER FORM */}
            {activeTab === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#09090b] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Aniketh Reddy"
                    className="bharpai-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#09090b] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bharpai-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-[#09090b]">
                      Your UPI ID / Payment Handle
                    </label>
                    <span className="text-[10px] text-emerald-600 font-mono font-semibold">
                      For receiving pay links
                    </span>
                  </div>
                  <input
                    type="text"
                    value={regUpi}
                    onChange={(e) => setRegUpi(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="bharpai-input w-full px-3.5 py-2.5 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#09090b] mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bharpai-input w-full px-3.5 py-2.5 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#09090b]"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white btn-bharpai-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account & Start</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="w-8 h-8 border-2 border-[#09090b] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
