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
  QrCode
} from "lucide-react";

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const rawGroupId = params?.groupId;
  const groupId = rawGroupId ? decodeURIComponent(rawGroupId) : "";

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState(user?.name || "");
  const [upiId, setUpiId] = useState(user?.upiId || "");
  const [joining, setJoining] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    let isMounted = true;
    async function fetchGroup() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}`);
        const data = await res.json();
        
        if (!isMounted) return;

        if (res.ok && data.group) {
          setGroup(data.group);
          if (user?.name && data.group.members?.includes(user.name)) {
            setJoinedSuccess(true);
          }
        } else {
          setError(data.error || "Group not found or expired invite link");
        }
      } catch (err) {
        if (isMounted) setError("Failed to load group details");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchGroup();

    return () => {
      isMounted = false;
    };
  }, [groupId, user]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setJoining(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          upiId: upiId.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join group");
      }

      setJoinedSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfd] text-zinc-900">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            Join {group.name}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Zero sign-up friction. Split bills & settle in 1 tap with UPI.
          </p>
        </div>

        {/* Group Receipt Card */}
        <div className="bharpai-card rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xl shadow-zinc-200/50 relative overflow-hidden bg-white">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-600 uppercase">
                {group.category || "Trip"}
              </span>
              <h2 className="text-xl font-bold font-display text-zinc-950 mt-1">{group.name}</h2>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Users className="w-5 h-5 text-zinc-800" />
            </div>
          </div>

          {/* Members in Group */}
          <div className="mb-5">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 font-mono">
              Members in group ({group.members.length})
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

          {/* Group Stats */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between mb-6 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Receipt className="w-4 h-4 text-zinc-800" />
              {group.expenses?.length || 0} expenses recorded
            </span>
            <span className="text-emerald-700 font-mono font-semibold text-[11px] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> 1-Tap UPI
            </span>
          </div>

          {/* Join Form / Success State */}
          {joinedSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-display text-zinc-950">You&apos;re in the group!</h3>
              <p className="text-xs text-zinc-500">
                Opening your dashboard to view split calculations...
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#09090b] hover:bg-[#18181b] flex items-center justify-center gap-2 cursor-pointer transition-all text-xs mt-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Karthik"
                  className="bharpai-input w-full px-3.5 py-2.5 rounded-xl text-sm placeholder:text-zinc-400 font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Your UPI ID (Optional)
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">For receiving payments</span>
                </div>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="karthik@okhdfcbank"
                    className="bharpai-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder:text-zinc-400 font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Friends can send you instant payments directly via GPay / PhonePe / Paytm.
                </p>
              </div>

              <button
                type="submit"
                disabled={joining}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#09090b] hover:bg-[#18181b] active:scale-[0.99] flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50 transition-all text-sm shadow-md"
              >
                {joining ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Join & View Expenses</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

