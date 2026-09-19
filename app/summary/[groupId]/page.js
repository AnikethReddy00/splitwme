"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  Users,
  Wallet,
  Zap,
  ArrowRight,
  Share2,
  Download,
  Copy,
  Check,
  Tag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  DollarSign
} from "lucide-react";
import {
  calculateSmartSettlements,
  generateUpiDeeplink,
  generateQrCodeUrl
} from "@/lib/settlement";

const CATEGORY_COLORS = {
  Food: "bg-amber-100 text-amber-800 border-amber-200",
  Stay: "bg-blue-100 text-blue-800 border-blue-200",
  Transport: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Groceries: "bg-teal-100 text-teal-800 border-teal-200",
  Activities: "bg-purple-100 text-purple-800 border-purple-200",
  Utilities: "bg-orange-100 text-orange-800 border-orange-200",
  General: "bg-zinc-100 text-zinc-800 border-zinc-200"
};

export default function PublicTripSummaryPage() {
  const params = useParams();
  const router = useRouter();

  const rawGroupId = params?.groupId;
  const groupId = rawGroupId ? decodeURIComponent(rawGroupId) : "";

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedQrSettlement, setSelectedQrSettlement] = useState(null);

  useEffect(() => {
    if (!groupId) return;

    async function loadGroupSummary() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Group not found");
        }

        setGroup(data.group);
      } catch (err) {
        setError(err.message || "Failed to load trip summary");
      } finally {
        setLoading(false);
      }
    }

    loadGroupSummary();
  }, [groupId]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-bold font-display text-zinc-900">Loading Trip Summary...</div>
        <div className="text-xs text-zinc-500 font-mono">Fetching latest bills & settlements</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold font-display text-zinc-900">Summary Not Available</h2>
        <p className="text-xs text-zinc-500 max-w-sm">{error || "This group summary could not be found."}</p>
        <Link
          href="/"
          className="py-2.5 px-5 rounded-xl font-bold text-xs bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
        >
          Go to SplitWMe
        </Link>
      </div>
    );
  }

  const members = group.members || [];
  const expenses = group.expenses || [];
  const memberDetails = group.memberDetails || {};

  // Calculations
  const totalSpend = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const categoryTotals = {};
  expenses.forEach((e) => {
    const cat = e.category || "General";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0);
  });

  const paidUpfrontMap = {};
  const consumedMap = {};
  members.forEach((m) => {
    paidUpfrontMap[m] = 0;
    consumedMap[m] = 0;
  });

  expenses.forEach((e) => {
    const amt = Number(e.amount) || 0;
    if (e.paidByShares && typeof e.paidByShares === "object" && Object.keys(e.paidByShares).length > 0) {
      Object.entries(e.paidByShares).forEach(([person, val]) => {
        paidUpfrontMap[person] = (paidUpfrontMap[person] || 0) + (Number(val) || 0);
      });
    } else if (e.paidBy && paidUpfrontMap[e.paidBy] !== undefined) {
      paidUpfrontMap[e.paidBy] = (paidUpfrontMap[e.paidBy] || 0) + amt;
    }

    if (e.memberShares && typeof e.memberShares === "object" && Object.keys(e.memberShares).length > 0) {
      Object.entries(e.memberShares).forEach(([person, share]) => {
        consumedMap[person] = (consumedMap[person] || 0) + (Number(share) || 0);
      });
    } else {
      const splitList = e.splitBetween && e.splitBetween.length > 0 ? e.splitBetween : members;
      if (splitList.length > 0) {
        const perPerson = amt / splitList.length;
        splitList.forEach((person) => {
          consumedMap[person] = (consumedMap[person] || 0) + perPerson;
        });
      }
    }
  });

  const { netBalances, settlements } = calculateSmartSettlements(members, expenses);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#09090b] flex flex-col pb-20">
      {/* Header */}
      <header className="border-b border-[#e4e4e7] sticky top-0 z-30 bg-white/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#09090b] text-white flex items-center justify-center font-bold text-sm">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-base font-bold font-display tracking-tight text-[#09090b]">
                SplitWMe
              </span>
              <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.2 rounded font-mono ml-2">
                Public Trip Report
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="py-1.5 px-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-900 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Share</span>
                </>
              )}
            </button>

            <Link
              href="/"
              className="py-1.5 px-3.5 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-colors"
            >
              Open App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 w-full space-y-6">
        {/* Trip Banner */}
        <div className="bharpai-card p-6 bg-white border border-zinc-200 shadow-sm rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-600 mb-2">
                <Tag className="w-3 h-3 text-zinc-900" />
                {group.category || "Trip"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-zinc-900 tracking-tight">
                {group.name}
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                {members.length} friends • {expenses.length} shared expenses
              </p>
            </div>

            {/* Total Spent Box */}
            <div className="p-4 rounded-2xl bg-zinc-900 text-white text-left sm:text-right shrink-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Total Trip Spent
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                ₹{totalSpend.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Category Chips */}
          <div className="pt-3 border-t border-zinc-100 flex flex-wrap gap-2">
            {Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const pct = totalSpend > 0 ? Math.round((amt / totalSpend) * 100) : 0;
                const badgeStyle = CATEGORY_COLORS[cat] || CATEGORY_COLORS.General;

                return (
                  <div
                    key={cat}
                    className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${badgeStyle}`}
                  >
                    <span>{cat}</span>
                    <span className="font-mono">₹{amt.toLocaleString()}</span>
                    <span className="text-[10px] opacity-75 font-mono">({pct}%)</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Smart Settlements Matrix */}
        {settlements.length > 0 && (
          <div className="bharpai-card p-6 bg-zinc-900 text-white rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-200">
                  Instant UPI Settlements ({settlements.length} payments)
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">GPay / PhonePe / Paytm</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settlements.map((s, idx) => {
                const toDetails = memberDetails[s.to] || {};
                const upiLink = generateUpiDeeplink({
                  upiId: toDetails.upiId || "upi@bank",
                  name: s.to,
                  amount: s.amount,
                  note: `${group.name} settlement`
                });

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{s.from}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-emerald-400">{s.to}</span>
                      </div>
                      <div className="text-base font-black font-mono text-white mt-0.5">
                        ₹{s.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        UPI: {toDetails.upiId || "upi@bank"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedQrSettlement({ ...s, upiDeeplink: upiLink })}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        title="Show QR Code"
                      >
                        QR
                      </button>

                      <a
                        href={upiLink}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-black transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <span>Pay</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Member Balances Table */}
        <div className="bharpai-card p-6 bg-white border border-zinc-200 rounded-3xl space-y-3">
          <h3 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900">
            Individual Balances Ledger
          </h3>

          <div className="rounded-2xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-mono text-[10px] uppercase font-bold">
                  <th className="p-3">Member</th>
                  <th className="p-3 text-right">Paid Upfront</th>
                  <th className="p-3 text-right">Consumed Share</th>
                  <th className="p-3 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-mono">
                {members.map((m) => {
                  const paid = Math.round(paidUpfrontMap[m] || 0);
                  const share = Math.round(consumedMap[m] || 0);
                  const net = Math.round(netBalances[m] || 0);

                  return (
                    <tr key={m} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3 font-bold text-zinc-900 font-display text-xs">
                        {m}
                      </td>
                      <td className="p-3 text-right text-zinc-700">₹{paid.toLocaleString()}</td>
                      <td className="p-3 text-right text-zinc-700">₹{share.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold">
                        {net > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            +₹{net.toLocaleString()}
                          </span>
                        ) : net < 0 ? (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            -₹{Math.abs(net).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                            ₹0
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Full Expense Feed */}
        <div className="bharpai-card p-6 bg-white border border-zinc-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-zinc-900" />
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900">
                All Logged Bills ({expenses.length})
              </h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {expenses.map((expense) => {
              const splitCount = expense.splitBetween?.length || members.length;
              const perPerson = (Number(expense.amount) / splitCount).toFixed(0);

              return (
                <div
                  key={expense.id}
                  className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                      <span>{expense.title}</span>
                      <span className="px-1.5 py-0.2 rounded bg-white border border-zinc-200 text-[10px] text-zinc-600 font-normal">
                        {expense.category}
                      </span>
                      {expense.paidByShares && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 border border-amber-200 text-[10px] text-amber-800 font-semibold">
                          Multi-Payer
                        </span>
                      )}
                      {expense.memberShares && (
                        <span className="px-1.5 py-0.2 rounded bg-indigo-100 border border-indigo-200 text-[10px] text-indigo-800 font-semibold">
                          Itemized
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                      {expense.paidByShares ? (
                        <span>
                          Paid by{" "}
                          {Object.entries(expense.paidByShares)
                            .map(([p, v]) => `${p.split(" ")[0]} (₹${Math.round(v)})`)
                            .join(", ")}
                        </span>
                      ) : (
                        <span>Paid by {expense.paidBy}</span>
                      )}
                      {" • "}
                      <span>Split with {splitCount}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black font-mono text-zinc-900">
                      ₹{Number(expense.amount).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      ₹{perPerson}/person
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* QR Code Modal for Public settlements */}
      {selectedQrSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bharpai-card max-w-sm w-full p-6 text-center bg-white rounded-3xl border border-zinc-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold font-display text-zinc-900">
              Scan UPI QR to Pay
            </h3>
            <div className="text-xs text-zinc-600">
              Paying <strong>{selectedQrSettlement.to}</strong>: ₹{selectedQrSettlement.amount}
            </div>

            <div className="p-3 bg-zinc-100 rounded-2xl inline-block border border-zinc-200">
              <img
                src={generateQrCodeUrl(selectedQrSettlement.upiDeeplink)}
                alt="UPI QR Code"
                className="w-48 h-48 rounded-xl object-contain mx-auto"
              />
            </div>

            <div className="text-[10px] text-zinc-400 font-mono">
              Works with Google Pay, PhonePe, Paytm, CRED & BHIM
            </div>

            <button
              type="button"
              onClick={() => setSelectedQrSettlement(null)}
              className="w-full py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
