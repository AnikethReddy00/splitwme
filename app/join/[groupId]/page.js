"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Check
} from "lucide-react";

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { user, login, register, isLoading: isAuthLoading } = useAuth();

  const rawGroupId = params?.groupId;
  const groupId = rawGroupId ? decodeURIComponent(rawGroupId) : "";

  const [group, setGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [error, setError] = useState("");

  // Auth Card state (for non-authenticated users)
  const [authTab, setAuthTab] = useState("register"); // 'register' | 'login'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authUpi, setAuthUpi] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  // Group Joining state (for authenticated users)
  const [userUpi, setUserUpi] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  // 1. Fetch group details
  useEffect(() => {
    if (!groupId) return;

    let isMounted = true;
    async function fetchGroup() {
      try {
        setLoadingGroup(true);
        setError("");
        const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.group) {
          setGroup(data.group);
        } else {
          setError(data.error || "Group not found or invite link has expired.");
        }
      } catch (err) {
        if (isMounted) setError("Failed to load group details.");
      } finally {
        if (isMounted) setLoadingGroup(false);
      }
    }

    fetchGroup();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  // Sync user UPI state when logged in
  useEffect(() => {
    if (user) {
      setUserUpi(user.upiId || "");
      if (group && group.members?.includes(user.name)) {
        setJoinedSuccess(true);
      }
    }
  }, [user, group]);

  // Handle Login for guest user
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!authEmail.trim() || !authPassword) {
      setAuthError("Please enter your email and password.");
      return;
    }

    setAuthSubmitting(true);
    const res = await login(authEmail.trim(), authPassword);
    setAuthSubmitting(false);

    if (!res.success) {
      setAuthError(res.error || "Login failed. Please check your credentials.");
    }
  };

  // Handle Register for guest user
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!authName.trim() || !authEmail.trim() || !authPassword) {
      setAuthError("Please fill in your name, email, and password.");
      return;
    }

    setAuthSubmitting(true);
    const res = await register({
      name: authName.trim(),
      email: authEmail.trim(),
      password: authPassword,
      upiId: authUpi.trim()
    });
    setAuthSubmitting(false);

    if (!res.success) {
      setAuthError(res.error || "Registration failed. Please try again.");
    }
  };

  // Handle Confirm & Join Group (once user is authenticated)
  const handleConfirmJoin = async () => {
    if (!user?.name || !groupId) return;

    setJoiningGroup(true);
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          upiId: userUpi.trim() || user.upiId || ""
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join group");
      }

      setJoinedSuccess(true);
      setTimeout(() => {
        router.push(`/?group=${encodeURIComponent(groupId)}`);
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoiningGroup(false);
    }
  };

  // Initial loading state
  if (loadingGroup || isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfd] text-zinc-900 gap-3">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-zinc-500">Checking invitation link...</p>
      </div>
    );
  }

  // Error / Invalid Group state
  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#fcfcfd]">
        <div className="bharpai-card max-w-md w-full p-8 rounded-3xl text-center border border-zinc-200">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display text-zinc-950 mb-1">Invite Link Invalid</h2>
          <p className="text-xs text-zinc-500 mb-6">{error || "This group could not be found or has expired."}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#09090b] hover:bg-[#18181b] transition-all text-xs"
          >
            Go to SplitWMe Home
          </button>
        </div>
      </div>
    );
  }

  const isAlreadyMember = user && group.members?.includes(user.name);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#fcfcfd] text-zinc-900">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 bg-white text-[11px] font-mono font-medium text-zinc-700 shadow-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
            <span>Group Invitation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-zinc-950">
            {group.name}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Split expenses & settle in 1 tap over UPI.
          </p>
        </div>

        {/* Group Preview Banner */}
        <div className="bharpai-card rounded-2xl p-4 mb-4 border border-zinc-200 bg-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold font-display text-zinc-950">{group.name}</div>
              <div className="text-[11px] text-zinc-500 font-mono">
                {group.members.length} {group.members.length === 1 ? "member" : "members"} • {group.category || "Trip"}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            Active
          </span>
        </div>

        {/* CONDITION 1: User is NOT logged in -> Show Login / Register Card */}
        {!user ? (
          <div className="bharpai-card rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xl shadow-zinc-200/50 bg-white">
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold font-display text-zinc-950">
                Log in or Create Account
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                You must have an account to join and track your splits.
              </p>
            </div>

            {/* Tab Selector */}
            <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("register");
                  setAuthError("");
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authTab === "register"
                    ? "bg-white text-zinc-950 shadow-sm border border-zinc-200/50"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("login");
                  setAuthError("");
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authTab === "login"
                    ? "bg-white text-zinc-950 shadow-sm border border-zinc-200/50"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Log In
              </button>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-600 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* REGISTER FORM */}
            {authTab === "register" ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Karthik"
                      className="bharpai-input w-full pl-9 pr-3 py-2 rounded-xl text-xs placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="karthik@example.com"
                      className="bharpai-input w-full pl-9 pr-3 py-2 rounded-xl text-xs placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bharpai-input w-full pl-9 pr-9 py-2 rounded-xl text-xs placeholder:text-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-700">
                      UPI ID (Optional)
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">For 1-click settlements</span>
                  </div>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={authUpi}
                      onChange={(e) => setAuthUpi(e.target.value)}
                      placeholder="karthik@okhdfcbank"
                      className="bharpai-input w-full pl-9 pr-3 py-2 rounded-xl text-xs placeholder:text-zinc-400 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-[#09090b] hover:bg-[#18181b] active:scale-[0.99] flex items-center justify-center gap-2 mt-3 cursor-pointer disabled:opacity-50 transition-all text-xs shadow-md"
                >
                  {authSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="aniketh@splitwme.com"
                      className="bharpai-input w-full pl-9 pr-3 py-2 rounded-xl text-xs placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bharpai-input w-full pl-9 pr-9 py-2 rounded-xl text-xs placeholder:text-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-[#09090b] hover:bg-[#18181b] active:scale-[0.99] flex items-center justify-center gap-2 mt-3 cursor-pointer disabled:opacity-50 transition-all text-xs shadow-md"
                >
                  {authSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Log In & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* CONDITION 2: User IS logged in -> Show Confirm Join / Already Joined Card */
          <div className="bharpai-card rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xl shadow-zinc-200/50 bg-white">
            {joinedSuccess || isAlreadyMember ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-display text-zinc-950">
                  {isAlreadyMember ? "You are a member!" : "You're in the group!"}
                </h3>
                <p className="text-xs text-zinc-500">
                  Opening {group.name} in your dashboard...
                </p>
                <button
                  onClick={() => router.push(`/?group=${encodeURIComponent(groupId)}`)}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#09090b] hover:bg-[#18181b] flex items-center justify-center gap-2 cursor-pointer transition-all text-xs mt-2"
                >
                  <span>Go to Group Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-lg font-bold font-display text-zinc-950">
                    Join {group.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Confirm your details below to join this group.
                  </p>
                </div>

                {/* User Info Box */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs uppercase font-mono">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-900 truncate">{user.name}</div>
                    <div className="text-[11px] text-zinc-500 truncate font-mono">{user.email}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                    Logged In
                  </span>
                </div>

                {/* Confirm / Edit UPI handle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      Your Receiving UPI ID
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Editable</span>
                  </div>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={userUpi}
                      onChange={(e) => setUserUpi(e.target.value)}
                      placeholder="e.g. yourname@okhdfcbank"
                      className="bharpai-input w-full pl-10 pr-4 py-2.5 rounded-xl text-xs placeholder:text-zinc-400 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Friends in {group.name} will use this UPI ID to pay you back in 1 tap.
                  </p>
                </div>

                {/* Existing Members preview */}
                <div className="pt-2 border-t border-zinc-100">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 font-mono">
                    Existing Members ({group.members.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.members.map((member) => (
                      <span
                        key={member}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-50 border border-zinc-200 text-zinc-800"
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmJoin}
                  disabled={joiningGroup}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#09090b] hover:bg-[#18181b] active:scale-[0.99] flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50 transition-all text-sm shadow-md"
                >
                  {joiningGroup ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Confirm & Join Group</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
