"use client";

import React, { useState } from "react";
import { generateUpiDeeplink, generateShareableReminderText } from "@/lib/settlement";
import { Zap, Share2, CheckCircle2, Copy, Users, ArrowUpRight } from "lucide-react";

export default function ReceiptCard({
  title = "Dinner & Drinks at Olive 🍕",
  totalAmount = 2400,
  paidBy = "Aniketh Reddy",
  paidByUpi = "aniketh@okhdfcbank",
  initialMembers = ["Aniketh Reddy", "Karthik", "Rohan Sharma", "Priya Patel"],
  onOpenApp
}) {
  const [selectedMembers, setSelectedMembers] = useState(initialMembers);
  const [copied, setCopied] = useState(false);

  const toggleMember = (member) => {
    if (selectedMembers.includes(member)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter((m) => m !== member));
      }
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const perPersonAmount = (totalAmount / selectedMembers.length).toFixed(2);
  const upiDeeplink = generateUpiDeeplink({
    upiId: paidByUpi,
    name: paidBy,
    amount: perPersonAmount,
    note: title
  });

  const handleCopyLink = () => {
    const text = generateShareableReminderText({
      fromName: "Friend",
      toName: paidBy,
      amount: perPersonAmount,
      groupName: title,
      upiDeeplink
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bharpai-card p-6 sm:p-7 max-w-md w-full mx-auto relative overflow-hidden bg-white text-[#09090b]">
      {/* Top Tag */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7] mb-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#71717a]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live UPI Split Receipt</span>
        </div>
        <span className="text-xs font-mono text-[#71717a]">No App Needed</span>
      </div>

      {/* Bill Title & Total */}
      <div className="mb-4">
        <h3 className="text-lg font-bold font-display text-[#09090b]">{title}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black font-display text-[#09090b] tracking-tight tabular-nums">
            ₹{Number(totalAmount).toLocaleString()}
          </span>
          <span className="text-xs text-[#71717a]">Total Bill</span>
        </div>
        <div className="text-xs text-[#71717a] mt-1">
          Paid by <span className="font-semibold text-[#09090b]">{paidBy}</span> ({paidByUpi})
        </div>
      </div>

      {/* Dashed Receipt Line */}
      <div className="dashed-line my-4" />

      {/* Participant Toggle Chips */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#09090b]">
            Split between ({selectedMembers.length} people):
          </span>
          <span className="text-[11px] font-mono text-[#71717a]">Tap to toggle</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {initialMembers.map((member) => {
            const isSelected = selectedMembers.includes(member);
            return (
              <button
                key={member}
                type="button"
                onClick={() => toggleMember(member)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-[#09090b] text-white border-[#09090b] shadow-sm"
                    : "bg-[#f4f4f5] text-[#71717a] border-[#e4e4e7] hover:bg-[#e4e4e7]"
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                <span>{member}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Per Person Calculation Box */}
      <div className="bharpai-card-flat p-4 rounded-2xl mb-5 flex items-center justify-between border border-[#e4e4e7]">
        <div>
          <div className="text-xs text-[#71717a]">Each Person Pays</div>
          <div className="text-2xl font-black font-display text-[#09090b] tracking-tight tabular-nums">
            ₹{perPersonAmount}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-600 font-bold">
            Instant Transfer
          </div>
          <div className="text-xs text-[#71717a]">Direct to Bank</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <a
          href={upiDeeplink}
          className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white btn-bharpai-upi flex items-center justify-center gap-2 cursor-pointer text-center"
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Pay ₹{perPersonAmount} with UPI</span>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </a>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold btn-bharpai-secondary flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#71717a]" />
                <span>Copy Pay Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              const text = encodeURIComponent(
                `Hey! Here is your 1-click bill split for ${title}:\nAmount: ₹${perPersonAmount}\nPay to: ${paidBy}\n👉 ${upiDeeplink}`
              );
              window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
            }}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#f4f4f5] hover:bg-[#e4e4e7] border border-[#e4e4e7] text-[#09090b] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* UPI Apps compatibility logos */}
      <div className="mt-4 pt-3 border-t border-[#e4e4e7] flex items-center justify-center gap-3 text-[11px] text-[#71717a] font-mono">
        <span>GPay</span>
        <span>•</span>
        <span>PhonePe</span>
        <span>•</span>
        <span>Paytm</span>
        <span>•</span>
        <span>CRED</span>
        <span>•</span>
        <span>BHIM</span>
      </div>
    </div>
  );
}
