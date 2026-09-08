"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  INITIAL_GROUPS,
  calculateSmartSettlements,
  generateUpiDeeplink,
  generateQrCodeUrl,
  generateShareableReminderText
} from "@/lib/settlement";
import {
  Sparkles,
  Plus,
  ArrowRight,
  Zap,
  Users,
  CreditCard,
  QrCode,
  Share2,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Receipt,
  LogOut,
  Calendar,
  X,
  ExternalLink,
  Copy,
  ChevronRight,
  Tag,
  UserPlus,
  MessageCircle,
  Link as LinkIcon,
  Settings,
  Pencil,
  Trash2,
  AlertTriangle,
  UserMinus,
  Check,
  UserCheck,
  User as UserIcon,
  Phone,
  Camera
} from "lucide-react";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80"
];

export default function DashboardView() {
  const { user, updateProfile, logout } = useAuth();
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [selectedGroupId, setSelectedGroupId] = useState("group_1");

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [selectedQrSettlement, setSelectedQrSettlement] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  // Group Settings Edit State
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupCategory, setEditGroupCategory] = useState("Trip");

  // Profile Edit State
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileUpi, setProfileUpi] = useState(user?.upiId || "");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatusMsg, setProfileStatusMsg] = useState("");

  // Direct Add Friend state inside Invite Modal
  const [directFriendName, setDirectFriendName] = useState("");
  const [directFriendUpi, setDirectFriendUpi] = useState("");
  const [directAddMsg, setDirectAddMsg] = useState("");

  // Expense form state
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState(user?.name || "Aniketh Reddy");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [expenseSplitBetween, setExpenseSplitBetween] = useState([]);

  // New Group form state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState("Trip");
  const [newGroupMembersText, setNewGroupMembersText] = useState("");

  // Base URL for invite links
  const [originUrl, setOriginUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // Sync profile edit state when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileUpi(user.upiId || "");
      setProfileAvatar(user.avatar || AVATAR_PRESETS[0]);
      setProfilePhone(user.phone || "");
    }
  }, [user]);

  // Sync groups from API on load
  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch("/api/groups");
        const data = await res.json();
        if (res.ok && data.groups && data.groups.length > 0) {
          setGroups(data.groups);
        }
      } catch (err) {
        console.error("Failed to load groups:", err);
      }
    }
    fetchGroups();
  }, []);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || groups[0] || {
      id: "fallback",
      name: "My Group",
      category: "Trip",
      members: [user?.name || "Aniketh Reddy"],
      expenses: []
    };
  }, [groups, selectedGroupId, user?.name]);

  // Sync Group Settings Modal when opening
  useEffect(() => {
    if (selectedGroup) {
      setEditGroupName(selectedGroup.name);
      setEditGroupCategory(selectedGroup.category || "Trip");
    }
  }, [selectedGroup]);

  // Calculate Smart Settlements for the currently selected group
  const { netBalances, settlements } = useMemo(() => {
    if (!selectedGroup) return { netBalances: {}, settlements: [] };
    return calculateSmartSettlements(selectedGroup.members || [], selectedGroup.expenses || []);
  }, [selectedGroup]);

  // Calculate Overall Net Balance for the logged-in user across all groups
  const overallStats = useMemo(() => {
    let totalOwedToUser = 0;
    let totalUserOwes = 0;
    let totalExpensesSum = 0;

    groups.forEach((grp) => {
      const { netBalances: grpBalances } = calculateSmartSettlements(grp.members || [], grp.expenses || []);
      const userNet = grpBalances[user?.name] || 0;
      if (userNet > 0) totalOwedToUser += userNet;
      if (userNet < 0) totalUserOwes += Math.abs(userNet);

      grp.expenses?.forEach((e) => {
        totalExpensesSum += Number(e.amount) || 0;
      });
    });

    return {
      net: totalOwedToUser - totalUserOwes,
      totalOwedToUser,
      totalUserOwes,
      totalExpensesSum,
      activeGroupsCount: groups.length
    };
  }, [groups, user?.name]);

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    setProfileSaving(true);
    setProfileStatusMsg("");

    const res = await updateProfile({
      name: profileName.trim(),
      upiId: profileUpi.trim(),
      avatar: profileAvatar,
      phone: profilePhone.trim()
    });

    setProfileSaving(false);

    if (res.success) {
      setProfileStatusMsg("Profile updated successfully!");
      // Update local groups state to reflect any new name/upiId/avatar
      setGroups((prev) =>
        prev.map((g) => {
          const oldName = user?.name;
          const newName = profileName.trim();
          if (oldName && g.members?.includes(oldName)) {
            const updatedMembers = g.members.map((m) => (m === oldName ? newName : m));
            const updatedDetails = { ...(g.memberDetails || {}) };
            if (updatedDetails[oldName]) {
              const oldD = updatedDetails[oldName];
              delete updatedDetails[oldName];
              updatedDetails[newName] = {
                ...oldD,
                upiId: profileUpi.trim(),
                avatar: profileAvatar
              };
            }
            return {
              ...g,
              members: updatedMembers,
              memberDetails: updatedDetails
            };
          }
          return g;
        })
      );

      setTimeout(() => {
        setIsProfileModalOpen(false);
        setProfileStatusMsg("");
      }, 1000);
    } else {
      setProfileStatusMsg(res.error || "Failed to update profile");
    }
  };

  // Open Expense Modal for Creating
  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    setExpenseTitle("");
    setExpenseAmount("");
    setExpensePaidBy(user?.name || selectedGroup.members[0] || "Aniketh Reddy");
    setExpenseCategory("Food");
    setExpenseSplitBetween(selectedGroup.members || []);
    setIsExpenseModalOpen(true);
  };

  // Open Expense Modal for Editing
  const handleOpenEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setExpenseTitle(expense.title);
    setExpenseAmount(String(expense.amount));
    setExpensePaidBy(expense.paidBy);
    setExpenseCategory(expense.category || "Food");
    setExpenseSplitBetween(
      expense.splitBetween && expense.splitBetween.length > 0 
        ? [...expense.splitBetween] 
        : [...selectedGroup.members]
    );
    setIsExpenseModalOpen(true);
  };

  // Handle Save Expense (Add or Edit)
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount || Number(expenseAmount) <= 0) return;

    const splitMembers = expenseSplitBetween.length > 0 
      ? expenseSplitBetween 
      : selectedGroup.members;

    if (editingExpenseId) {
      // Edit existing expense
      const updatedExpenseData = {
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        paidBy: expensePaidBy,
        category: expenseCategory,
        splitBetween: splitMembers
      };

      try {
        await fetch(`/api/groups/${selectedGroup.id}/expenses/${editingExpenseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedExpenseData)
        });
      } catch (err) {
        console.error("API update expense error:", err);
      }

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === selectedGroup.id) {
            return {
              ...g,
              expenses: (g.expenses || []).map((exp) =>
                exp.id === editingExpenseId ? { ...exp, ...updatedExpenseData } : exp
              )
            };
          }
          return g;
        })
      );
    } else {
      // Add new expense
      const newExpense = {
        id: `e_${Date.now()}`,
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        paidBy: expensePaidBy,
        splitBetween: splitMembers,
        date: "Just now",
        category: expenseCategory
      };

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === selectedGroup.id) {
            return {
              ...g,
              expenses: [newExpense, ...(g.expenses || [])]
            };
          }
          return g;
        })
      );
    }

    setIsExpenseModalOpen(false);
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (expenseId, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await fetch(`/api/groups/${selectedGroup.id}/expenses/${expenseId}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Delete expense error:", err);
    }

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === selectedGroup.id) {
          return {
            ...g,
            expenses: (g.expenses || []).filter((e) => e.id !== expenseId)
          };
        }
        return g;
      })
    );
  };

  // Handle Save Group Settings (Rename / Change Category)
  const handleSaveGroupSettings = async (e) => {
    e.preventDefault();
    if (!editGroupName.trim()) return;

    try {
      await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editGroupName.trim(),
          category: editGroupCategory
        })
      });
    } catch (err) {
      console.error("Update group API error:", err);
    }

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === selectedGroup.id) {
          return {
            ...g,
            name: editGroupName.trim(),
            category: editGroupCategory
          };
        }
        return g;
      })
    );

    setIsGroupSettingsOpen(false);
  };

  // Handle Remove Member from Group
  const handleRemoveMember = async (memberName) => {
    if (memberName === user?.name) {
      alert("You cannot remove yourself as group admin.");
      return;
    }
    if (!confirm(`Remove ${memberName} from "${selectedGroup.name}"?`)) return;

    try {
      await fetch(`/api/groups/${selectedGroup.id}/members/${encodeURIComponent(memberName)}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Remove member API error:", err);
    }

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === selectedGroup.id) {
          const updatedMembers = g.members.filter((m) => m !== memberName);
          const updatedExpenses = (g.expenses || []).map((exp) => ({
            ...exp,
            splitBetween: exp.splitBetween?.filter((m) => m !== memberName) || updatedMembers
          }));
          return {
            ...g,
            members: updatedMembers,
            expenses: updatedExpenses
          };
        }
        return g;
      })
    );
  };

  // Handle Delete Group
  const handleDeleteGroup = async () => {
    if (!confirm(`Are you sure you want to delete the group "${selectedGroup.name}"? This action cannot be undone.`)) return;

    try {
      await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Delete group error:", err);
    }

    const remainingGroups = groups.filter((g) => g.id !== selectedGroup.id);
    setGroups(remainingGroups);
    if (remainingGroups.length > 0) {
      setSelectedGroupId(remainingGroups[0].id);
    }
    setIsGroupSettingsOpen(false);
  };

  // Handle Creating a New Group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const extraMembers = newGroupMembersText
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const allMembers = Array.from(new Set([user?.name || "Aniketh Reddy", ...extraMembers]));

    const newGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      category: newGroupCategory,
      members: allMembers,
      memberDetails: {
        [user?.name || "Aniketh Reddy"]: {
          upiId: user?.upiId || "aniketh@okhdfcbank",
          avatar: user?.avatar || AVATAR_PRESETS[0]
        }
      },
      expenses: []
    };

    try {
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          category: newGroupCategory,
          creatorName: user?.name,
          creatorUpi: user?.upiId,
          members: extraMembers
        })
      });
    } catch (err) {
      console.error("API create group error:", err);
    }

    setGroups((prev) => [newGroup, ...prev]);
    setSelectedGroupId(newGroup.id);
    setNewGroupName("");
    setNewGroupMembersText("");
    setIsNewGroupOpen(false);
  };

  // Handle Direct Adding a Friend to the Group
  const handleDirectAddFriend = async (e) => {
    e.preventDefault();
    if (!directFriendName.trim()) return;

    const cleanName = directFriendName.trim();
    const cleanUpi = directFriendUpi.trim() || `${cleanName.toLowerCase().replace(/\s+/g, "")}@upi`;

    try {
      await fetch(`/api/groups/${selectedGroup.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          upiId: cleanUpi
        })
      });
    } catch (err) {
      console.error("Join api error:", err);
    }

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === selectedGroup.id) {
          const updatedMembers = g.members.includes(cleanName) ? g.members : [...g.members, cleanName];
          return {
            ...g,
            members: updatedMembers,
            memberDetails: {
              ...(g.memberDetails || {}),
              [cleanName]: {
                upiId: cleanUpi,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`
              }
            }
          };
        }
        return g;
      })
    );

    setDirectFriendName("");
    setDirectFriendUpi("");
    setDirectAddMsg(`Added ${cleanName} to ${selectedGroup.name}!`);
    setTimeout(() => setDirectAddMsg(""), 3500);
  };

  // Generate Invite URL
  const inviteUrl = `${originUrl || "http://localhost:3000"}/join/${selectedGroup.id}`;

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hey! Join our "${selectedGroup.name}" group on SplitWMe to track shared expenses & settle up in 1-click via UPI:\n👉 ${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Handle Copy Settlement Link
  const handleCopyLink = (settlement, index) => {
    const creditorDetails = selectedGroup.memberDetails?.[settlement.to] || {};
    const upiLink = generateUpiDeeplink({
      upiId: creditorDetails.upiId || `${settlement.to.toLowerCase().replace(/\s+/g, "")}@upi`,
      name: settlement.to,
      amount: settlement.amount,
      note: `${selectedGroup.name} Settlement`
    });

    const shareText = generateShareableReminderText({
      fromName: settlement.from,
      toName: settlement.to,
      amount: settlement.amount,
      groupName: selectedGroup.name,
      upiDeeplink: upiLink
    });

    navigator.clipboard.writeText(shareText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 3000);
  };

  // User's Net in Selected Group
  const userGroupNet = netBalances[user?.name] || 0;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative z-10 pb-16">
      {/* Top Navigation Bar */}
      <header className="border-b border-sky-500/15 backdrop-blur-xl bg-slate-950/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Split<span className="text-gradient-cloudy">WMe</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Info (Clickable to Edit Profile) */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full glass-panel-subtle hover:bg-sky-500/15 border border-sky-500/20 hover:border-sky-400/40 transition-all cursor-pointer group"
              title="Click to Edit Profile & UPI ID"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-sky-900/50 flex items-center justify-center border border-sky-400/30 group-hover:scale-105 transition-transform">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-sky-300">{user?.name?.[0] || "U"}</span>
                )}
              </div>
              <div className="text-left pr-1">
                <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                  <span>{user?.name}</span>
                  <Pencil className="w-3 h-3 text-sky-400 opacity-60 group-hover:opacity-100" />
                </div>
                <div className="text-[10px] text-sky-400 font-mono leading-tight">
                  {user?.upiId || "UPI Active"}
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsNewGroupOpen(true)}
              className="py-2 px-3.5 rounded-xl text-xs font-semibold text-white btn-glow-primary flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Group</span>
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 glass-panel-subtle hover:border-rose-500/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full space-y-6">
        {/* Hero Glance Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Balance Card */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 to-teal-400" />
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Overall Net Balance</span>
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black tracking-tight">
              {overallStats.net >= 0 ? (
                <span className="text-emerald-400">+₹{overallStats.net.toLocaleString()}</span>
              ) : (
                <span className="text-rose-400">-₹{Math.abs(overallStats.net).toLocaleString()}</span>
              )}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>
                {overallStats.net >= 0 ? "You are in positive balance" : "You have pending dues to pay"}
              </span>
            </div>
          </div>

          {/* You Are Owed */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Friends Owe You</span>
              <DollarSign className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-teal-300">
              ₹{overallStats.totalOwedToUser.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] text-teal-400/80">
              Ready for 1-click settlement links
            </div>
          </div>

          {/* You Owe */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>You Owe Others</span>
              <CreditCard className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-300">
              ₹{overallStats.totalUserOwes.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] text-sky-400/80">
              Pay in 1-tap via UPI / GPay
            </div>
          </div>

          {/* Quick Smart Settle Action */}
          <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-sky-950/40 via-slate-900/60 to-teal-950/30 border-sky-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-300">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Smart Debt Simplifier
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                Min Flow
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {settlements.length} direct transfers needed to settle this group.
            </p>
            <button
              onClick={() => setIsSettleModalOpen(true)}
              className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-semibold text-white btn-glow-teal flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Open Settle Hub</span>
            </button>
          </div>
        </div>

        {/* Groups Horizontal Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {groups.map((group) => {
            const isSelected = group.id === selectedGroupId;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-2.5 shrink-0 ${
                  isSelected
                    ? "glass-panel border-sky-400/50 text-white shadow-lg shadow-sky-500/10"
                    : "glass-panel-subtle text-slate-400 hover:text-slate-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSelected ? "bg-sky-400 shadow-[0_0_8px_#38bdf8]" : "bg-slate-600"
                  }`}
                />
                <span className="font-semibold">{group.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono">
                  {group.members?.length || 0} members
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Group Details & Expenses Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Column: Group Header & Expense Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Group Banner & Action Bar */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] font-medium mb-2">
                    <Tag className="w-3 h-3" />
                    {selectedGroup.category || "Expense Group"}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-black text-white">{selectedGroup.name}</h2>
                    <button
                      onClick={() => setIsGroupSettingsOpen(true)}
                      title="Group Settings & Members"
                      className="p-1.5 rounded-xl glass-panel-subtle hover:text-sky-300 text-slate-400 hover:border-sky-500/30 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedGroup.members?.join(", ") || "No members"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* INVITE FRIENDS BUTTON */}
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-teal-300 glass-panel-subtle hover:bg-teal-500/20 border border-teal-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <UserPlus className="w-4 h-4 text-teal-400" />
                    <span>Invite</span>
                  </button>

                  <button
                    onClick={handleOpenAddExpense}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white btn-glow-primary flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Expense</span>
                  </button>

                  <button
                    onClick={() => setIsSettleModalOpen(true)}
                    className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-sky-300 glass-panel-subtle hover:bg-sky-500/20 border border-sky-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span>Settle</span>
                  </button>
                </div>
              </div>

              {/* Group Net Status Strip */}
              <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-slate-400">
                  Total Group Spending:{" "}
                  <span className="font-bold text-white">
                    ₹
                    {selectedGroup.expenses
                      ?.reduce((sum, e) => sum + Number(e.amount), 0)
                      .toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  Your Net Share:{" "}
                  {userGroupNet > 0 ? (
                    <span className="font-bold text-teal-400">+₹{userGroupNet.toFixed(2)} (Owed)</span>
                  ) : userGroupNet < 0 ? (
                    <span className="font-bold text-rose-400">-₹{Math.abs(userGroupNet).toFixed(2)} (You owe)</span>
                  ) : (
                    <span className="font-bold text-slate-300">All Settled Up</span>
                  )}
                </div>
              </div>
            </div>

            {/* Expense Activity List */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Logged Transactions ({selectedGroup.expenses?.length || 0})
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Real-time split</span>
              </div>

              {(!selectedGroup.expenses || selectedGroup.expenses.length === 0) ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No expenses logged yet in this group. Click "+ Add Expense" to start!
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedGroup.expenses.map((expense) => {
                    const splitCount = expense.splitBetween?.length || selectedGroup.members.length;
                    const perPersonAmount = (Number(expense.amount) / splitCount).toFixed(0);

                    return (
                      <div
                        key={expense.id}
                        className="glass-panel-subtle glass-panel-hover p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                            <Receipt className="w-5 h-5 text-sky-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{expense.title}</span>
                              <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 font-normal">
                                {expense.category}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-sky-300 font-medium">
                                Paid by {expense.paidBy}
                              </span>
                              <span>•</span>
                              <span>{expense.date || "Today"}</span>
                              <span>•</span>
                              <span className="text-teal-400 font-mono text-[11px]">
                                Split by {splitCount} ({expense.splitBetween?.join(", ") || "All members"})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-black text-white">
                              ₹{Number(expense.amount).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                              ₹{perPersonAmount}/ea
                            </div>
                          </div>

                          {/* Actions: Edit & Delete */}
                          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenEditExpense(expense)}
                              title="Edit Expense"
                              className="p-1.5 rounded-lg glass-panel-subtle hover:text-sky-300 text-slate-400 hover:border-sky-500/30 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(expense.id, expense.title)}
                              title="Delete Expense"
                              className="p-1.5 rounded-lg glass-panel-subtle hover:text-rose-400 text-slate-400 hover:border-rose-500/30 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Smart Settlements & 1-Click Payment Hub */}
          <div className="space-y-4">
            <div className="glass-panel p-6 rounded-3xl space-y-4 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-bold text-white">Smart Settle Actions</h3>
                </div>
                <span className="text-[10px] text-teal-400 font-mono px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                  Min-Cash-Flow
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Debts are simplified to the minimum transactions. Tap below to send 1-click UPI payment links.
              </p>

              {settlements.length === 0 ? (
                <div className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-teal-200">All Settled Up!</div>
                  <div className="text-xs text-teal-300/70 mt-1">No pending dues in this group.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlements.map((settle, idx) => {
                    const isDebtor = settle.from === user?.name;
                    const isCreditor = settle.to === user?.name;
                    const creditorDetails = selectedGroup.memberDetails?.[settle.to] || {};
                    const upiLink = generateUpiDeeplink({
                      upiId: creditorDetails.upiId || `${settle.to.toLowerCase().replace(/\s+/g, "")}@upi`,
                      name: settle.to,
                      amount: settle.amount,
                      note: `${selectedGroup.name} Settlement`
                    });

                    return (
                      <div
                        key={settle.id || idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          isDebtor
                            ? "bg-rose-500/10 border-rose-500/30"
                            : isCreditor
                            ? "bg-teal-500/10 border-teal-500/30"
                            : "glass-panel-subtle border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold text-slate-200">
                            <span className={isDebtor ? "text-rose-300 font-bold" : ""}>
                              {settle.from}
                            </span>
                            <span className="text-slate-400 mx-1.5">owes</span>
                            <span className={isCreditor ? "text-teal-300 font-bold" : ""}>
                              {settle.to}
                            </span>
                          </div>
                          <div className="text-sm font-extrabold text-white">
                            ₹{settle.amount.toLocaleString()}
                          </div>
                        </div>

                        {/* Direct 1-Click Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          {/* 1-Tap Mobile UPI Intent */}
                          <a
                            href={upiLink}
                            className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-white btn-glow-primary text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>1-Tap Pay</span>
                          </a>

                          {/* Desktop QR Modal */}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedQrSettlement({
                                ...settle,
                                upiLink,
                                qrUrl: generateQrCodeUrl(upiLink)
                              })
                            }
                            className="p-1.5 rounded-xl glass-panel-subtle hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 transition-colors cursor-pointer"
                            title="Show UPI QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Share / Copy WhatsApp Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(settle, idx)}
                            className="p-1.5 rounded-xl glass-panel-subtle hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 transition-colors cursor-pointer"
                            title="Copy Shareable WhatsApp Link"
                          >
                            {copiedIndex === idx ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: EDIT USER PROFILE & UPI ID */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-7 relative border border-sky-500/30">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Edit Your Profile</h3>
                <p className="text-xs text-slate-400">Update your payment UPI ID, display name, and avatar</p>
              </div>
            </div>

            {profileStatusMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  profileStatusMsg.includes("success")
                    ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileStatusMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Avatar</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-sky-950 border-2 border-sky-400/50 shrink-0">
                    <img src={profileAvatar} alt="Current Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {AVATAR_PRESETS.map((avatarUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileAvatar(avatarUrl)}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          profileAvatar === avatarUrl
                            ? "border-sky-400 scale-105 shadow-md shadow-sky-500/30"
                            : "border-white/10 hover:border-sky-400/40 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={avatarUrl} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Full Name"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    UPI ID / Payment Handle
                  </label>
                  <span className="text-[10px] text-teal-400 font-mono">For 1-Click Pay Links</span>
                </div>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={profileUpi}
                    onChange={(e) => setProfileUpi(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder:text-slate-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Friends in all your groups will pay you using this UPI handle.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white btn-glow-primary flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {profileSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Profile & Update Handle</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GROUP SETTINGS & MEMBER MANAGEMENT */}
      {isGroupSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-7 relative border border-sky-500/30 space-y-5">
            <button
              onClick={() => setIsGroupSettingsOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Group Settings</h3>
                <p className="text-xs text-slate-400">Manage group details, members, and rules</p>
              </div>
            </div>

            {/* Rename & Category Form */}
            <form onSubmit={handleSaveGroupSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="glass-input w-full px-3.5 py-2 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={editGroupCategory}
                  onChange={(e) => setEditGroupCategory(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-sm bg-slate-900"
                >
                  <option value="Trip">🌴 Vacation / Trip</option>
                  <option value="Home">🏠 Apartment / Flatmates</option>
                  <option value="Dinner">🍕 Dinner & Outing</option>
                  <option value="Project">💻 Project / Event</option>
                  <option value="General">🏷️ General</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-white btn-glow-primary text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Group Changes</span>
              </button>
            </form>

            {/* Member Management Section */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Group Members ({selectedGroup.members?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsGroupSettingsOpen(false);
                    setIsInviteModalOpen(true);
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Invite Member</span>
                </button>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {selectedGroup.members?.map((member) => {
                  const details = selectedGroup.memberDetails?.[member] || {};
                  const isCurrentUser = member === user?.name;

                  return (
                    <div
                      key={member}
                      className="glass-panel-subtle p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-900/60 flex items-center justify-center text-sky-200 font-bold text-xs">
                          {member[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1">
                            <span>{member}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-sky-400/80 font-mono">
                            {details.upiId || "UPI not set"}
                          </div>
                        </div>
                      </div>

                      {!isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={`Remove ${member}`}
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone: Delete Group */}
            <div className="pt-4 border-t border-rose-500/20">
              <button
                type="button"
                onClick={handleDeleteGroup}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entire Group</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EXPENSE WITH GRANULAR SUBSET SPLITTING */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-7 relative border border-sky-500/30 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              {editingExpenseId ? (
                <>
                  <Pencil className="w-5 h-5 text-sky-400" />
                  Edit Group Expense
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-sky-400" />
                  Add Group Expense
                </>
              )}
            </h3>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Expense Description
                </label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Scuba Diving, Dinner, Petrol, Groceries"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="1200"
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-sm bg-slate-900"
                  >
                    <option value="Food">🍽️ Food & Drinks</option>
                    <option value="Stay">🏨 Hotel / Stay</option>
                    <option value="Transport">🚗 Travel & Cabs</option>
                    <option value="Groceries">🛒 Groceries</option>
                    <option value="Activities">🎟️ Fun & Activities</option>
                    <option value="Utilities">💡 Utilities / Bills</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Who Paid the Bill?
                </label>
                <select
                  value={expensePaidBy}
                  onChange={(e) => setExpensePaidBy(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-900"
                >
                  {selectedGroup.members?.map((m) => (
                    <option key={m} value={m}>
                      {m} {m === user?.name ? "(You)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* GRANULAR SUBSET SPLITTING SELECTOR */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Split With Specific People ({expenseSplitBetween.length} of {selectedGroup.members?.length || 0})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpenseSplitBetween([...selectedGroup.members])}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                    >
                      All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setExpenseSplitBetween([])}
                      className="text-[11px] text-slate-400 hover:text-slate-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Per person live calculation preview */}
                {expenseAmount > 0 && expenseSplitBetween.length > 0 && (
                  <div className="mb-2 p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center justify-between font-mono">
                    <span>Per person share:</span>
                    <span className="font-bold">
                      ₹{(Number(expenseAmount) / expenseSplitBetween.length).toFixed(2)} / person
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                  {selectedGroup.members?.map((m) => {
                    const isChecked = expenseSplitBetween.includes(m);
                    return (
                      <label
                        key={m}
                        className={`flex items-center gap-2 text-xs p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-sky-500/15 border border-sky-500/30 text-white font-medium"
                            : "text-slate-400 hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let current = [...expenseSplitBetween];
                            if (e.target.checked) {
                              if (!current.includes(m)) current.push(m);
                            } else {
                              current = current.filter((x) => x !== m);
                            }
                            setExpenseSplitBetween(current);
                          }}
                          className="rounded border-sky-500/30 text-sky-500 focus:ring-sky-500"
                        />
                        <span className="truncate">{m}</span>
                      </label>
                    );
                  })}
                </div>
                {expenseSplitBetween.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    ⚠️ Please select at least one person to split this expense.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={expenseSplitBetween.length === 0}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white btn-glow-primary flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                <span>{editingExpenseId ? "Save Changes" : "Log Expense & Split"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVITE FRIENDS / SHARE GROUP LINK */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-7 relative border border-teal-500/30">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Invite Friends</h3>
                <p className="text-xs text-slate-400">
                  Share invite link to <span className="text-sky-300 font-semibold">{selectedGroup.name}</span>
                </p>
              </div>
            </div>

            {/* Share Link Box */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-900/80 border border-sky-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
                  Shareable Invite Link
                </span>
                <span className="text-[10px] text-teal-400 font-mono">No App Install Needed</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-slate-300 bg-slate-950/80 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="py-2 px-3.5 rounded-xl text-xs font-semibold text-white btn-glow-primary flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedInviteLink ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share Invite via WhatsApp</span>
              </button>
            </div>

            {/* Direct Add Friend Form */}
            <div className="mt-5 pt-5 border-t border-white/5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Or Add Friend Directly
              </h4>

              {directAddMsg && (
                <div className="mb-3 p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{directAddMsg}</span>
                </div>
              )}

              <form onSubmit={handleDirectAddFriend} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={directFriendName}
                  onChange={(e) => setDirectFriendName(e.target.value)}
                  placeholder="Friend's Name (e.g. Karthik)"
                  className="glass-input px-3 py-2 rounded-xl text-xs placeholder:text-slate-500"
                />
                <input
                  type="text"
                  value={directFriendUpi}
                  onChange={(e) => setDirectFriendUpi(e.target.value)}
                  placeholder="UPI ID (e.g. karthik@oksbi)"
                  className="glass-input px-3 py-2 rounded-xl text-xs placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 py-2 px-3 rounded-xl text-xs font-semibold text-white btn-glow-teal flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Group Now</span>
                </button>
              </form>
            </div>

            {/* Existing Members Chips */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <div className="text-[11px] text-slate-400 mb-2">
                Current Members ({selectedGroup.members?.length || 0}):
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {selectedGroup.members?.map((m) => (
                  <span
                    key={m}
                    className="px-2.5 py-1 rounded-xl text-xs bg-slate-900 border border-sky-500/15 text-slate-300 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE SCANNER */}
      {selectedQrSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 sm:p-7 relative border border-sky-500/30 text-center">
            <button
              onClick={() => setSelectedQrSettlement(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Instant UPI Settle QR</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              Pay ₹{selectedQrSettlement.amount.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              To <span className="font-semibold text-sky-300">{selectedQrSettlement.to}</span>
            </p>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl shadow-xl inline-block mx-auto mb-4">
              <img
                src={selectedQrSettlement.qrUrl}
                alt="UPI QR Code"
                className="w-52 h-52 object-contain"
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Scan with GPay, PhonePe, Paytm, CRED, or BHIM app to settle instantly.
            </p>

            <div className="flex gap-2">
              <a
                href={selectedQrSettlement.upiLink}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-white btn-glow-primary flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in App</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedQrSettlement.upiLink);
                  alert("UPI payment link copied to clipboard!");
                }}
                className="py-2.5 px-3 rounded-xl text-xs font-medium text-slate-300 glass-panel-subtle hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW GROUP */}
      {isNewGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-7 relative border border-sky-500/30">
            <button
              onClick={() => setIsNewGroupOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-sky-400" />
              Create New Split Group
            </h3>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Group / Trip Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Manali Trekking 🏔️, Flat 204 Utilities"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-sm bg-slate-900"
                >
                  <option value="Trip">🌴 Vacation / Trip</option>
                  <option value="Home">🏠 Apartment / Flatmates</option>
                  <option value="Dinner">🍕 Dinner & Outing</option>
                  <option value="Project">💻 Project / Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Add Friends / Members (comma separated)
                </label>
                <input
                  type="text"
                  value={newGroupMembersText}
                  onChange={(e) => setNewGroupMembersText(e.target.value)}
                  placeholder="Rohan Sharma, Priya Patel, Karthik"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm placeholder:text-slate-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  You ({user?.name || "You"}) will be added automatically as the creator.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-semibold text-white btn-glow-primary flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>Create Group</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULL SETTLEMENT MODAL */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-7 relative border border-sky-500/30">
            <button
              onClick={() => setIsSettleModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Smart Settlement Hub - {selectedGroup.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Direct peer-to-peer 1-click settlement payment engine
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {settlements.length === 0 ? (
                <div className="p-8 text-center text-teal-300">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-80" />
                  <p className="font-bold">All group debts are completely settled!</p>
                </div>
              ) : (
                settlements.map((settle, idx) => {
                  const creditorDetails = selectedGroup.memberDetails?.[settle.to] || {};
                  const upiLink = generateUpiDeeplink({
                    upiId: creditorDetails.upiId || `${settle.to.toLowerCase().replace(/\s+/g, "")}@upi`,
                    name: settle.to,
                    amount: settle.amount,
                    note: `${selectedGroup.name} Settle`
                  });

                  return (
                    <div
                      key={idx}
                      className="glass-panel-subtle p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-sky-500/20"
                    >
                      <div>
                        <div className="text-xs text-slate-400">
                          <span className="text-white font-bold">{settle.from}</span> pays{" "}
                          <span className="text-teal-300 font-bold">{settle.to}</span>
                        </div>
                        <div className="text-lg font-black text-white mt-0.5">
                          ₹{settle.amount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-sky-400 font-mono">
                          UPI: {creditorDetails.upiId || "Standard UPI Link"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={upiLink}
                          className="py-2 px-3 rounded-xl text-xs font-semibold text-white btn-glow-primary flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Pay Now</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setIsSettleModalOpen(false);
                            setSelectedQrSettlement({
                              ...settle,
                              upiLink,
                              qrUrl: generateQrCodeUrl(upiLink)
                            });
                          }}
                          className="p-2 rounded-xl glass-panel-subtle hover:bg-sky-500/20 text-slate-300"
                          title="View QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(settle, idx)}
                          className="p-2 rounded-xl glass-panel-subtle hover:bg-sky-500/20 text-slate-300"
                          title="Copy Share Link"
                        >
                          {copiedIndex === idx ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
