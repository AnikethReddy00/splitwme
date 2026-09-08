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
  Receipt
} from "lucide-react";

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const groupId = params.groupId;

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState(user?.name || "");
  const [upiId, setUpiId] = useState(user?.upiId || "");
  const [joining, setJoining] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  useEffect(() => {
    async function fetchGroup() {
      try {
        const res = await fetch(`/api/groups/${groupId}`);
        const data = await res.json();
        if (res.ok && data.group) {
          setGroup(data.group);
          if (user?.name && data.group.members.includes(user.name)) {
            setJoinedSuccess(true);
          }
        } else {
          setError(data.error || "Group not found or expired invite link");
        }
      } catch (err) {
        setError("Failed to load group details");
      } finally {
        setLoading(false);
      }
    }

    if (groupId) {
      fetchGroup();
    }
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
      <div className="min-h-screen flex items-center justify-center bg-[#060b16] text-sky-400">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#060b16]">
        <div className="glass-panel max-w-md w-full p-8 rounded-3xl text-center border border-rose-500/30">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-1">Invite Link Invalid</h2>
          <p className="text-xs text-slate-400 mb-6">{error || "This group could not be found."}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white btn-glow-primary text-xs"
          >
            Go to SplitWMe Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#060b16]">
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] bg-teal-500/18 rounded-full blur-3xl animate-float-reverse" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel-subtle text-xs font-medium text-sky-300 border border-sky-500/30 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Group Invitation</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            You&apos;re Invited to Join
          </h1>
        </div>

        {/* Group Card Preview */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 backdrop-blur-2xl border border-sky-500/25 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 via-teal-400 to-sky-400" />

          <div className="flex items-center justify-between pb-4 border-b border-sky-500/15 mb-5">
            <div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 font-medium">
                {group.category || "Trip"}
              </span>
              <h2 className="text-2xl font-black text-white mt-1">{group.name}</h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-sky-400" />
            </div>
          </div>

          {/* Members in Group */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Existing Members ({group.members.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.members.map((member) => (
                <span
                  key={member}
                  className="px-2.5 py-1 rounded-xl text-xs bg-slate-900/80 border border-sky-500/20 text-sky-200"
                >
                  {member}
                </span>
              ))}
            </div>
          </div>

          {/* Group Stats */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-sky-500/15 flex items-center justify-between mb-6 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-sky-400" />
              {group.expenses?.length || 0} expenses recorded
            </span>
            <span className="text-teal-300 font-semibold font-mono">
              1-Click UPI Ready
            </span>
          </div>

          {/* Join Form / Success State */}
          {joinedSuccess ? (
            <div className="text-center py-4 space-y-3 animate-fadeIn">
              <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">You&apos;re in the group!</h3>
              <p className="text-xs text-slate-400">
                Redirecting to your dashboard to view split calculations...
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white btn-glow-primary flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Go to Group Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Karthik"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Your UPI ID / Handle (Optional)
                  </label>
                  <span className="text-[10px] text-teal-400 font-mono">For receiving payments</span>
                </div>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="karthik@okhdfcbank"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Your friends will use this to send you 1-click GPay / PhonePe settlements.
                </p>
              </div>

              <button
                type="submit"
                disabled={joining}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white btn-glow-primary flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
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
