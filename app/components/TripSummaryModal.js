"use client";

import React, { useState } from "react";
import {
  X,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
  PieChart,
  ArrowRight,
  ExternalLink,
  Receipt,
  Users,
  Wallet,
  Globe
} from "lucide-react";
import {
  calculateSmartSettlements,
  generateUpiDeeplink
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

export default function TripSummaryModal({
  isOpen,
  onClose,
  group,
  originUrl = ""
}) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'whatsapp' | 'csv' | 'public'
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !group) return null;

  const members = group.members || [];
  const expenses = group.expenses || [];
  const memberDetails = group.memberDetails || {};

  // 1. Calculations: Total Spend & Category Distribution
  const totalSpend = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const categoryTotals = {};
  expenses.forEach((e) => {
    const cat = e.category || "General";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0);
  });

  // 2. Individual Paid Upfront vs Consumed
  const paidUpfrontMap = {};
  const consumedMap = {};
  members.forEach((m) => {
    paidUpfrontMap[m] = 0;
    consumedMap[m] = 0;
  });

  expenses.forEach((e) => {
    const amt = Number(e.amount) || 0;

    // Upfront paid
    if (e.paidByShares && typeof e.paidByShares === "object" && Object.keys(e.paidByShares).length > 0) {
      Object.entries(e.paidByShares).forEach(([person, val]) => {
        paidUpfrontMap[person] = (paidUpfrontMap[person] || 0) + (Number(val) || 0);
      });
    } else if (e.paidBy && paidUpfrontMap[e.paidBy] !== undefined) {
      paidUpfrontMap[e.paidBy] = (paidUpfrontMap[e.paidBy] || 0) + amt;
    }

    // Consumed
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

  // 3. Smart Settlements
  const { netBalances, settlements } = calculateSmartSettlements(members, expenses);

  // 4. Generate WhatsApp Summary Text
  const generateWhatsAppMessage = () => {
    const safeOrigin = originUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const publicSummaryLink = `${safeOrigin}/summary/${group.id}`;

    let msg = `*📊 ${group.name} — Trip Summary & Settlements*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Total Spent:* ₹${totalSpend.toLocaleString()} (${expenses.length} bills logged)\n\n`;

    // Category Breakdown
    msg += `*🏷️ Spending by Category:*\n`;
    Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, amt]) => {
        const pct = totalSpend > 0 ? Math.round((amt / totalSpend) * 100) : 0;
        msg += `• ${cat}: ₹${amt.toLocaleString()} (${pct}%)\n`;
      });
    msg += `\n`;

    // Who Paid vs Consumed
    msg += `*👥 Member Totals:*\n`;
    members.forEach((m) => {
      const paid = Math.round(paidUpfrontMap[m] || 0);
      const consumed = Math.round(consumedMap[m] || 0);
      const net = Math.round(netBalances[m] || 0);
      const netStr = net > 0 ? `+₹${net.toLocaleString()} (gets back)` : net < 0 ? `-₹${Math.abs(net).toLocaleString()} (owes)` : `₹0 (settled)`;
      msg += `• *${m}:* Paid ₹${paid.toLocaleString()} | Share ₹${consumed.toLocaleString()} | Net: ${netStr}\n`;
    });
    msg += `\n`;

    // Settlements
    if (settlements.length > 0) {
      msg += `*⚡ Direct 1-Click UPI Settlements:*\n`;
      settlements.forEach((s, idx) => {
        const toDetails = memberDetails[s.to] || {};
        const upiLink = generateUpiDeeplink({
          upiId: toDetails.upiId || "upi@bank",
          name: s.to,
          amount: s.amount,
          note: `${group.name} settlement`
        });
        msg += `${idx + 1}. 👉 *${s.from}* pays *${s.to}*: *₹${s.amount.toLocaleString()}*\n`;
        msg += `   🔗 *Pay via GPay/PhonePe/Paytm:*\n   ${upiLink}\n\n`;
      });
    } else {
      msg += `🎉 *All debts are settled!*\n\n`;
    }

    msg += `🌐 *View Full Trip Breakdown Online:*\n${publicSummaryLink}\n\n`;
    msg += `_Split smartly with SplitWMe ⚡_`;

    return msg;
  };

  const whatsAppText = generateWhatsAppMessage();

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppText)}`;
    window.open(url, "_blank");
  };

  // 5. Generate CSV Spreadsheet
  const handleDownloadCSV = () => {
    const headers = [
      "Date",
      "Expense Title",
      "Category",
      "Total Amount (INR)",
      "Paid By",
      "Multi-Payer Breakdown",
      "Split Between",
      "Itemized Shares"
    ];

    const rows = expenses.map((e) => {
      const multiPayerStr = e.paidByShares
        ? Object.entries(e.paidByShares)
            .map(([p, v]) => `${p}: ${v}`)
            .join(" | ")
        : "";
      const splitList = (e.splitBetween || members).join(", ");
      const itemizedStr = e.memberShares
        ? Object.entries(e.memberShares)
            .map(([p, s]) => `${p}: ₹${Math.round(s)}`)
            .join(" | ")
        : "";

      return [
        `"${e.date || "Today"}"`,
        `"${(e.title || "Expense").replace(/"/g, '""')}"`,
        `"${e.category || "General"}"`,
        Number(e.amount) || 0,
        `"${e.paidBy || "Unknown"}"`,
        `"${multiPayerStr}"`,
        `"${splitList}"`,
        `"${itemizedStr}"`
      ].join(",");
    });

    // Summary Section at bottom of CSV
    rows.push("\n");
    rows.push(`"--- GROUP SUMMARY ---",,,,`);
    rows.push(`"Group Name","${group.name.replace(/"/g, '""')}",,,`);
    rows.push(`"Total Group Spend",${totalSpend},,,`);
    rows.push("\n");
    rows.push(`"Member","Paid Upfront (INR)","Consumed Share (INR)","Net Balance (INR)"`);

    members.forEach((m) => {
      rows.push(
        `"${m}",${Math.round(paidUpfrontMap[m] || 0)},${Math.round(consumedMap[m] || 0)},${Math.round(netBalances[m] || 0)}`
      );
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const cleanFileName = (group.name || "Trip").replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("download", `${cleanFileName}_SplitWMe_Summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const publicUrl = `${originUrl || (typeof window !== "undefined" ? window.location.origin : "")}/summary/${group.id}`;

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#09090b]/75 backdrop-blur-md animate-fadeIn">
      <div className="bharpai-card max-w-3xl w-full p-4 sm:p-6 relative bg-white border border-[#e4e4e7] shadow-2xl max-h-[94vh] flex flex-col rounded-3xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#71717a] hover:text-[#09090b] p-1.5 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e4e4e7] shrink-0 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#09090b] text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-[#09090b]">
                Trip Summary & Export
              </h3>
              <p className="text-xs text-[#71717a]">
                {group.name} • {members.length} members • {expenses.length} bills
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Tabs */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-zinc-900 shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("whatsapp")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "whatsapp"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("csv")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "csv"
                  ? "bg-white text-zinc-900 shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Download className="w-3 h-3" />
              <span>Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* TAB 1: VISUAL TRIP OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Glance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900 text-white shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    Total Group Spend
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                    ₹{totalSpend.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Across {expenses.length} logged expenses
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                    Top Spending Category
                  </span>
                  <div className="text-lg font-bold text-zinc-900 truncate">
                    {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"}
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    ₹{(Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[1] || 0).toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                    Direct Settlements
                  </span>
                  <div className="text-lg font-bold text-indigo-700">
                    {settlements.length} Transfers Needed
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Min-Cash-Flow optimized
                  </span>
                </div>
              </div>

              {/* Category Distribution Pills */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-900 font-display">
                  <span>Category Breakdown</span>
                  <span className="text-[10px] font-mono text-zinc-500">{Object.keys(categoryTotals).length} categories</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryTotals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amt]) => {
                      const pct = totalSpend > 0 ? Math.round((amt / totalSpend) * 100) : 0;
                      const badgeStyle = CATEGORY_COLORS[cat] || CATEGORY_COLORS.General;

                      return (
                        <div
                          key={cat}
                          className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${badgeStyle}`}
                        >
                          <span>{cat}</span>
                          <span className="font-mono">₹{amt.toLocaleString()}</span>
                          <span className="text-[10px] opacity-75 font-mono">({pct}%)</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Members Ledger Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider font-display text-zinc-900">
                  Individual Balances & Breakdown
                </span>

                <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-mono text-[10px] uppercase font-bold">
                        <th className="p-2.5">Member</th>
                        <th className="p-2.5 text-right">Paid Upfront</th>
                        <th className="p-2.5 text-right">Consumed Share</th>
                        <th className="p-2.5 text-right">Net Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white font-mono">
                      {members.map((m) => {
                        const paid = Math.round(paidUpfrontMap[m] || 0);
                        const share = Math.round(consumedMap[m] || 0);
                        const net = Math.round(netBalances[m] || 0);

                        return (
                          <tr key={m} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="p-2.5 font-bold text-zinc-900 font-display text-xs">
                              {m}
                            </td>
                            <td className="p-2.5 text-right text-zinc-700">
                              ₹{paid.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right text-zinc-700">
                              ₹{share.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right font-bold">
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

              {/* Minimal Settlements Required */}
              {settlements.length > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-display">
                      Final Settlement Matrix ({settlements.length} payments)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">UPI Enabled</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          className="p-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-between gap-2"
                        >
                          <div className="truncate">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                              <span>{s.from.split(" ")[0]}</span>
                              <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="text-emerald-400">{s.to.split(" ")[0]}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              ₹{s.amount.toLocaleString()}
                            </div>
                          </div>

                          <a
                            href={upiLink}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[11px] font-black shrink-0 flex items-center gap-1 transition-colors"
                          >
                            <span>Pay</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 1-CLICK WHATSAPP EXPORTER */}
          {activeTab === "whatsapp" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Ready to send! This formatted summary contains all trip totals, breakdown, and 1-click UPI links for WhatsApp.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open WhatsApp</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={whatsAppText}
                  rows={14}
                  className="w-full p-4 rounded-2xl bg-zinc-900 text-zinc-100 font-mono text-xs border border-zinc-700 leading-relaxed focus:outline-none select-all"
                />

                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  {copiedWhatsApp ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CSV & PRINTABLE EXPORTER */}
          {activeTab === "csv" && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CSV Download Box */}
                <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold font-display text-zinc-900">
                      Download CSV Spreadsheet
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Export all {expenses.length} expenses with itemized breakdown, multi-payers, and member shares directly to Excel/Google Sheets.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="w-full py-2.5 px-4 rounded-xl font-bold bg-zinc-900 hover:bg-zinc-800 text-white text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .CSV File</span>
                  </button>
                </div>

                {/* Print / Save as PDF Box */}
                <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Printer className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold font-display text-zinc-900">
                      Print or Save as PDF
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Generate a clean, printable PDF statement for trip receipts and apartment expense audits.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full py-2.5 px-4 rounded-xl font-bold bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                  >
                    <Printer className="w-4 h-4 text-zinc-700" />
                    <span>Print / Save as PDF</span>
                  </button>
                </div>
              </div>

              {/* Public Shareable Web Link Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-indigo-950">
                      Shareable Public Summary Web Link
                    </div>
                    <div className="text-[11px] text-indigo-700">
                      Friends can view the breakdown and pay via UPI directly from their phone browser without signing in.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyPublicLink}
                    className="px-3 py-1.5 rounded-xl bg-white border border-indigo-300 hover:bg-indigo-50 text-xs font-bold text-indigo-900 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                    title="Open public summary in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
