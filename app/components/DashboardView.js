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
  ArrowUpRight
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
    if (!confirm(`Are you sure you want to delete "${selectedGroup.name}"?`)) return;

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
    <div className="min-h-screen bg-[#ffffff] text-[#09090b] flex flex-col pb-16">
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
            {/* User Profile Pill */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] border border-[#e4e4e7] transition-all cursor-pointer group"
              title="Click to Edit Profile & UPI ID"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#e4e4e7] shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#09090b]">{user?.name?.[0] || "U"}</span>
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#09090b] leading-tight flex items-center gap-1">
                  <span>{user?.name}</span>
                  <Pencil className="w-2.5 h-2.5 text-[#71717a] group-hover:text-[#09090b]" />
                </div>
                <div className="text-[10px] text-[#71717a] font-mono leading-tight">
                  {user?.upiId || "UPI Active"}
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsNewGroupOpen(true)}
              className="py-2 px-3.5 rounded-xl text-xs font-bold text-white btn-bharpai-primary flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Group</span>
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-[#71717a] hover:text-rose-600 bg-[#f4f4f5] hover:bg-rose-50 border border-[#e4e4e7] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Ledger Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 w-full space-y-6">
        
        {/* Glance Balance Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Net Balance Card */}
          <div className="bharpai-card p-5 relative">
            <div className="text-xs font-bold text-[#71717a] uppercase tracking-wider mb-1">
              Overall Balance
            </div>
            <div className="text-3xl font-black font-display tracking-tight tabular-nums">
              {overallStats.net >= 0 ? (
                <span className="text-emerald-600">+₹{overallStats.net.toLocaleString()}</span>
              ) : (
                <span className="text-rose-600">-₹{Math.abs(overallStats.net).toLocaleString()}</span>
              )}
            </div>
            <div className="mt-2 text-xs text-[#71717a]">
              {overallStats.net >= 0 ? "You are owed money overall" : "You have pending settlements"}
            </div>
          </div>

          {/* Friends Owe You */}
          <div className="bharpai-card p-5">
            <div className="text-xs font-bold text-[#71717a] uppercase tracking-wider mb-1">
              Friends Owe You
            </div>
            <div className="text-3xl font-black font-display text-emerald-600 tracking-tight tabular-nums">
              ₹{overallStats.totalOwedToUser.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-[#71717a]">
              Ready for 1-click UPI links
            </div>
          </div>

          {/* You Owe */}
          <div className="bharpai-card p-5">
            <div className="text-xs font-bold text-[#71717a] uppercase tracking-wider mb-1">
              You Owe Others
            </div>
            <div className="text-3xl font-black font-display text-[#09090b] tracking-tight tabular-nums">
              ₹{overallStats.totalUserOwes.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-[#71717a]">
              Pay in 1-tap via GPay / UPI
            </div>
          </div>

          {/* Smart Settle Quick Hub */}
          <div className="bharpai-card p-5 bg-[#09090b] text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                <span>Smart Settle</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  Min-Flow
                </span>
              </div>
              <div className="text-xs text-[#a1a1aa] mt-0.5">
                {settlements.length} direct transfers needed to settle this group.
              </div>
            </div>
            <button
              onClick={() => setIsSettleModalOpen(true)}
              className="mt-3 w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-white text-[#09090b] hover:bg-[#f4f4f5] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Open Settle Hub</span>
            </button>
          </div>

        </div>

        {/* Group Selector Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {groups.map((group) => {
            const isSelected = group.id === selectedGroupId;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                  isSelected
                    ? "bg-[#09090b] text-white border-[#09090b] shadow-sm"
                    : "bg-[#f4f4f5] text-[#71717a] border-[#e4e4e7] hover:text-[#09090b] hover:bg-[#e4e4e7]"
                }`}
              >
                <span>{group.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${isSelected ? "bg-white/20 text-white" : "bg-black/5 text-[#71717a]"}`}>
                  {group.members?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Group Ledger & Settlement Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left 8-Cols: Group Header & Transactions Feed */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Group Header Card */}
            <div className="bharpai-card p-6 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f4f4f5] border border-[#e4e4e7] text-xs font-semibold text-[#71717a] mb-2">
                    <Tag className="w-3 h-3 text-[#09090b]" />
                    {selectedGroup.category || "Trip"}
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black font-display text-[#09090b] tracking-tight">
                      {selectedGroup.name}
                    </h2>
                    <button
                      onClick={() => setIsGroupSettingsOpen(true)}
                      title="Group Settings"
                      className="p-1.5 rounded-lg text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#71717a] mt-1">
                    {selectedGroup.members?.join(", ") || "No members yet"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="py-2.5 px-3.5 rounded-xl text-xs font-bold btn-bharpai-secondary flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#09090b]" />
                    <span>Invite</span>
                  </button>

                  <button
                    onClick={handleOpenAddExpense}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-white btn-bharpai-primary flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Bill</span>
                  </button>

                  <button
                    onClick={() => setIsSettleModalOpen(true)}
                    className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-[#f4f4f5] hover:bg-[#e4e4e7] border border-[#e4e4e7] text-[#09090b] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Settle Dues</span>
                  </button>
                </div>
              </div>

              {/* Group Spend Strip */}
              <div className="mt-5 pt-4 border-t border-[#e4e4e7] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-[#71717a]">
                  Total Group Spending:{" "}
                  <span className="font-bold text-[#09090b] tabular-nums">
                    ₹{selectedGroup.expenses?.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  Your Net Share:{" "}
                  {userGroupNet > 0 ? (
                    <span className="font-bold text-emerald-600 tabular-nums">+₹{userGroupNet.toFixed(2)} (Owed to you)</span>
                  ) : userGroupNet < 0 ? (
                    <span className="font-bold text-rose-600 tabular-nums">-₹{Math.abs(userGroupNet).toFixed(2)} (You owe)</span>
                  ) : (
                    <span className="font-bold text-[#71717a]">All Settled</span>
                  )}
                </div>
              </div>
            </div>

            {/* Transactions Feed */}
            <div className="bharpai-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#09090b]" />
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-[#09090b]">
                    Logged Bills & Expenses ({selectedGroup.expenses?.length || 0})
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#71717a]">UPI Ready</span>
              </div>

              {(!selectedGroup.expenses || selectedGroup.expenses.length === 0) ? (
                <div className="text-center py-12 text-[#71717a] text-xs">
                  No bills logged yet. Tap <strong>"+ Add Bill"</strong> to log your first shared expense!
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedGroup.expenses.map((expense) => {
                    const splitCount = expense.splitBetween?.length || selectedGroup.members.length;
                    const perPersonAmount = (Number(expense.amount) / splitCount).toFixed(0);

                    return (
                      <div
                        key={expense.id}
                        className="bharpai-card-flat p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group border border-[#e4e4e7] hover:border-[#d4d4d8] bg-white transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center font-bold text-sm shrink-0">
                            🧾
                          </div>
                          <div>
                            <div className="text-sm font-bold font-display text-[#09090b] flex items-center gap-2">
                              <span>{expense.title}</span>
                              <span className="px-1.5 py-0.2 rounded bg-[#f4f4f5] border border-[#e4e4e7] text-[10px] text-[#71717a] font-normal">
                                {expense.category}
                              </span>
                            </div>
                            <div className="text-xs text-[#71717a] flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span>Paid by <strong className="text-[#09090b]">{expense.paidBy}</strong></span>
                              <span>•</span>
                              <span>{expense.date || "Today"}</span>
                              <span>•</span>
                              <span className="text-[#09090b] font-mono text-[11px]">
                                Split with {splitCount} ({expense.splitBetween?.join(", ") || "All members"})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e4e4e7]">
                          <div className="text-left sm:text-right">
                            <div className="text-base font-black font-display text-[#09090b] tabular-nums">
                              ₹{Number(expense.amount).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-[#71717a] font-mono">
                              ₹{perPersonAmount}/person
                            </div>
                          </div>

                          {/* Edit / Delete */}
                          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenEditExpense(expense)}
                              title="Edit Expense"
                              className="p-1.5 rounded-lg text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(expense.id, expense.title)}
                              title="Delete Expense"
                              className="p-1.5 rounded-lg text-[#71717a] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

          {/* Right 4-Cols: Settle Actions Hub */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bharpai-card p-6 space-y-4 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold font-display text-[#09090b]">
                    1-Tap Settle Hub
                  </h3>
                </div>
                <span className="text-[10px] text-[#71717a] font-mono">
                  UPI Direct
                </span>
              </div>

              <p className="text-xs text-[#71717a] leading-relaxed">
                Tangled debts are simplified to the minimum direct transfers.
              </p>

              {settlements.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#f4f4f5] border border-[#e4e4e7] text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <div className="text-sm font-bold font-display text-[#09090b]">All Settled Up!</div>
                  <div className="text-xs text-[#71717a] mt-1">No pending dues in this group.</div>
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
                        className={`p-4 rounded-xl border transition-all ${
                          isDebtor
                            ? "bg-rose-50/60 border-rose-200"
                            : isCreditor
                            ? "bg-emerald-50/60 border-emerald-200"
                            : "bg-[#f4f4f5] border-[#e4e4e7]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold text-[#09090b]">
                            <span className={isDebtor ? "text-rose-700 font-bold" : ""}>
                              {settle.from}
                            </span>
                            <span className="text-[#71717a] mx-1">pays</span>
                            <span className={isCreditor ? "text-emerald-700 font-bold" : ""}>
                              {settle.to}
                            </span>
                          </div>
                          <div className="text-sm font-black font-display text-[#09090b] tabular-nums">
                            ₹{settle.amount.toLocaleString()}
                          </div>
                        </div>

                        {/* 1-Tap Action Row */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[#e4e4e7]">
                          <a
                            href={upiLink}
                            className="flex-1 py-2 px-2.5 rounded-lg text-xs font-bold text-white btn-bharpai-upi text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                            <span>1-Tap Pay</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedQrSettlement({
                                ...settle,
                                upiLink,
                                qrUrl: generateQrCodeUrl(upiLink)
                              })
                            }
                            className="p-2 rounded-lg bg-white border border-[#e4e4e7] hover:bg-[#f4f4f5] text-[#09090b] transition-colors cursor-pointer"
                            title="Show UPI QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(settle, idx)}
                            className="p-2 rounded-lg bg-white border border-[#e4e4e7] hover:bg-[#f4f4f5] text-[#09090b] transition-colors cursor-pointer"
                            title="Copy WhatsApp Pay Link"
                          >
                            {copiedIndex === idx ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/60 backdrop-blur-sm animate-fadeIn">
          <div className="bharpai-card max-w-md w-full p-6 sm:p-7 relative bg-white border border-[#e4e4e7] shadow-2xl">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-[#09090b] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#09090b] text-white flex items-center justify-center font-bold text-sm">
                <UserIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-[#09090b]">Edit Your Profile</h3>
                <p className="text-xs text-[#71717a]">Update payment UPI ID and display name</p>
              </div>
            </div>

            {profileStatusMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  profileStatusMsg.includes("success")
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileStatusMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#09090b] mb-1.5">Avatar</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#f4f4f5] border-2 border-[#09090b] shrink-0">
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
                            ? "border-[#09090b] scale-105 shadow-sm"
                            : "border-[#e4e4e7] opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={avatarUrl} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#09090b] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Full Name"
                  className="bharpai-input w-full px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#09090b]">
                    UPI ID / Payment Handle
                  </label>
                  <span className="text-[10px] text-emerald-600 font-mono font-semibold">For 1-Click Pay Links</span>
                </div>
                <input
                  type="text"
                  required
                  value={profileUpi}
                  onChange={(e) => setProfileUpi(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="bharpai-input w-full px-3.5 py-2.5 text-sm font-mono"
                />
                <p className="text-[11px] text-[#71717a] mt-1">
                  Friends in all your groups will pay you using this UPI handle.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#09090b] mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="bharpai-input w-full px-3.5 py-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-3 px-4 rounded-xl font-bold text-white btn-bharpai-primary flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {profileSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Profile & UPI ID</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GROUP SETTINGS & MEMBER MANAGEMENT */}
      {isGroupSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/60 backdrop-blur-sm animate-fadeIn">
          <div className="bharpai-card max-w-lg w-full p-6 sm:p-7 relative bg-white border border-[#e4e4e7] shadow-2xl space-y-5">
            <button
              onClick={() => setIsGroupSettingsOpen(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-[#09090b] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#09090b] text-white flex items-center justify-center font-bold text-sm">
                <Settings className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-[#09090b]">Group Settings</h3>
                <p className="text-xs text-[#71717a]">Manage group details & member list</p>
              </div>
            </div>

            <form onSubmit={handleSaveGroupSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#09090b] mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="bharpai-input w-full px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#09090b] mb-1">Category</label>
                <select
                  value={editGroupCategory}
                  onChange={(e) => setEditGroupCategory(e.target.value)}
                  className="bharpai-input w-full px-3 py-2.5 text-sm bg-white"
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
                className="w-full py-2.5 px-4 rounded-xl font-bold text-white btn-bharpai-primary text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </form>

            {/* Members list */}
            <div className="pt-4 border-t border-[#e4e4e7] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[#09090b]">
                  Group Members ({selectedGroup.members?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsGroupSettingsOpen(false);
                    setIsInviteModalOpen(true);
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Invite Friend</span>
                </button>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {selectedGroup.members?.map((member) => {
                  const details = selectedGroup.memberDetails?.[member] || {};
                  const isCurrentUser = member === user?.name;

                  return (
                    <div
                      key={member}
                      className="p-2.5 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#e4e4e7] flex items-center justify-center font-bold text-xs text-[#09090b]">
                          {member[0]}
                        </div>
                        <div>
                          <div className="font-bold text-[#09090b] flex items-center gap-1">
                            <span>{member}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#71717a] font-mono">
                            {details.upiId || "UPI not set"}
                          </div>
                        </div>
                      </div>

                      {!isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          className="p-1.5 rounded-lg text-[#71717a] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

            {/* Delete Group */}
            <div className="pt-4 border-t border-rose-200">
              <button
                type="button"
                onClick={handleDeleteGroup}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entire Group</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EXPENSE WITH SUBSET SPLITTING */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/60 backdrop-blur-sm animate-fadeIn">
          <div className="bharpai-card max-w-md w-full p-6 sm:p-7 relative bg-white border border-[#e4e4e7] shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-[#09090b] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-[#09090b] flex items-center gap-2 mb-4">
              {editingExpenseId ? (
                <>
                  <Pencil className="w-5 h-5 text-emerald-600" />
                  Edit Group Expense
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-emerald-600" />
                  Add Group Expense
                </>
              )}
            </h3>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#09090b] mb-1">
                  Expense Description
                </label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Scuba Diving, Dinner, Fuel, Groceries"
                  className="bharpai-input w-full px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#09090b] mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="1200"
                    className="bharpai-input w-full px-3.5 py-2.5 text-sm font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#09090b] mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="bharpai-input w-full px-3 py-2.5 text-sm bg-white"
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
                <label className="block text-xs font-medium text-[#09090b] mb-1">
                  Who Paid the Bill?
                </label>
                <select
                  value={expensePaidBy}
                  onChange={(e) => setExpensePaidBy(e.target.value)}
                  className="bharpai-input w-full px-3.5 py-2.5 text-sm bg-white"
                >
                  {selectedGroup.members?.map((m) => (
                    <option key={m} value={m}>
                      {m} {m === user?.name ? "(You)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subset splitting selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#09090b]">
                    Split With Specific People ({expenseSplitBetween.length} of {selectedGroup.members?.length || 0})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpenseSplitBetween([...selectedGroup.members])}
                      className="text-[11px] text-[#09090b] font-bold hover:underline cursor-pointer"
                    >
                      All
                    </button>
                    <span className="text-[#e4e4e7]">•</span>
                    <button
                      type="button"
                      onClick={() => setExpenseSplitBetween([])}
                      className="text-[11px] text-[#71717a] hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {expenseAmount > 0 && expenseSplitBetween.length > 0 && (
                  <div className="mb-2 p-2 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] text-xs text-[#09090b] flex items-center justify-between font-mono">
                    <span>Per person share:</span>
                    <span className="font-bold">
                      ₹{(Number(expenseAmount) / expenseSplitBetween.length).toFixed(2)} / person
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7]">
                  {selectedGroup.members?.map((m) => {
                    const isChecked = expenseSplitBetween.includes(m);
                    return (
                      <label
                        key={m}
                        className={`flex items-center gap-2 text-xs p-2 rounded-lg cursor-pointer transition-colors border ${
                          isChecked
                            ? "bg-white border-[#09090b] text-[#09090b] font-bold shadow-xs"
                            : "text-[#71717a] border-transparent hover:bg-white"
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
                          className="rounded border-[#e4e4e7] text-[#09090b] focus:ring-[#09090b]"
                        />
                        <span className="truncate">{m}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={expenseSplitBetween.length === 0}
                className="w-full py-3 px-4 rounded-xl font-bold text-white btn-bharpai-primary flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/60 backdrop-blur-sm animate-fadeIn">
          <div className="bharpai-card max-w-lg w-full p-6 sm:p-7 relative bg-white border border-[#e4e4e7] shadow-2xl">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-[#09090b] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#09090b] text-white flex items-center justify-center font-bold text-sm">
                <UserPlus className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-[#09090b]">Invite Friends</h3>
                <p className="text-xs text-[#71717a]">
                  Share invite link to <strong>{selectedGroup.name}</strong>
                </p>
              </div>
            </div>

            {/* Share Link Box */}
            <div className="mt-5 p-4 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] space-y-3">
              <div className="flex items-center justify-between text-xs text-[#09090b] font-semibold">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#09090b]" />
                  Shareable Invite Link
                </span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">No App Needed</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="bharpai-input w-full px-3 py-2 text-xs font-mono text-[#09090b] bg-white select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="py-2 px-3.5 rounded-xl text-xs font-bold text-white btn-bharpai-primary flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedInviteLink ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share Invite via WhatsApp</span>
              </button>
            </div>

            {/* Direct Add Friend Form */}
            <div className="mt-5 pt-5 border-t border-[#e4e4e7]">
              <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[#09090b] mb-2">
                Or Add Friend Directly
              </h4>

              {directAddMsg && (
                <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
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
                  className="bharpai-input px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={directFriendUpi}
                  onChange={(e) => setDirectFriendUpi(e.target.value)}
                  placeholder="UPI ID (e.g. karthik@oksbi)"
                  className="bharpai-input px-3 py-2 text-xs font-mono"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 py-2 px-3 rounded-xl text-xs font-bold text-white btn-bharpai-primary flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Group Now</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE SCANNER */}
      {selectedQrSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/60 backdrop-blur-sm animate-fadeIn">
          <div className="bharpai-card max-w-sm w-full p-6 sm:p-7 relative bg-white border border-[#e4e4e7] shadow-2xl text-center">
            <button
              onClick={() => setSelectedQrSettlement(null)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-[#09090b] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f4f5] border border-[#e4e4e7] text-xs font-mono font-bold text-[#09090b] mb-3">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant UPI Settle QR</span>
            </div>

            <h3 className="text-2xl font-black font-display text-[#09090b] mb-1 tabular-nums">
              Pay ₹{selectedQrSettlement.amount.toLocaleString()}
            </h3>
            <p className="text-xs text-[#71717a] mb-4">
              To <strong className="text-[#09090b]">{selectedQrSettlement.to}</strong>
            </p>

            <div className="p-3 bg-white border border-[#e4e4e7] rounded-2xl shadow-sm inline-block mx-auto mb-4">
              <img
                src={selectedQrSettlement.qrUrl}
                alt="UPI QR Code"
                className="w-52 h-52 object-contain"
              />
            </div>

            <p className="text-[11px] text-[#71717a] mb-4">
              Scan with GPay, PhonePe, Paytm, CRED, or BHIM app to settle instantly.
            </p>

            <div className="flex gap-2">
              <a
                href={selectedQrSettlement.upiLink}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white btn-bharpai-upi flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open in App</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedQrSettlement.upiLink);
                  alert("UPI payment link copied to clipboard!");
                }}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold btn-bharpai-secondary"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW GROUP */}
      {isNewGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/60 backdrop-blur-sm animate-fadeIn">
          <div className="bharpai-card max-w-md w-full p-6 sm:p-7 relative bg-white border border-[#e4e4e7] shadow-2xl">
            <button
              onClick={() => setIsNewGroupOpen(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-[#09090b] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-[#09090b] flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-600" />
              Create New Split Group
            </h3>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#09090b] mb-1">
                  Group / Trip Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Manali Trekking 🏔️, Flat 204 Utilities"
                  className="bharpai-input w-full px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#09090b] mb-1">Category</label>
                <select
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                  className="bharpai-input w-full px-3 py-2.5 text-sm bg-white"
                >
                  <option value="Trip">🌴 Vacation / Trip</option>
                  <option value="Home">🏠 Apartment / Flatmates</option>
                  <option value="Dinner">🍕 Dinner & Outing</option>
                  <option value="Project">💻 Project / Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#09090b] mb-1">
                  Add Friends / Members (comma separated)
                </label>
                <input
                  type="text"
                  value={newGroupMembersText}
                  onChange={(e) => setNewGroupMembersText(e.target.value)}
                  placeholder="Rohan Sharma, Priya Patel, Karthik"
                  className="bharpai-input w-full px-3.5 py-2.5 text-sm"
                />
                <p className="text-[11px] text-[#71717a] mt-1">
                  You ({user?.name || "You"}) will be added automatically as the creator.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-white btn-bharpai-primary flex items-center justify-center gap-2 mt-2 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/60 backdrop-blur-sm animate-fadeIn">
          <div className="bharpai-card max-w-xl w-full p-6 sm:p-7 relative bg-white border border-[#e4e4e7] shadow-2xl">
            <button
              onClick={() => setIsSettleModalOpen(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-[#09090b] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#09090b] text-white flex items-center justify-center font-bold text-sm">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-[#09090b]">
                  Smart Settlement Hub — {selectedGroup.name}
                </h3>
                <p className="text-xs text-[#71717a]">
                  Direct peer-to-peer 1-click UPI payments
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {settlements.length === 0 ? (
                <div className="p-8 text-center text-[#71717a]">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                  <p className="font-bold font-display text-[#09090b]">All group debts are completely settled!</p>
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
                      className="p-4 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs text-[#71717a]">
                          <strong className="text-[#09090b]">{settle.from}</strong> pays{" "}
                          <strong className="text-emerald-700">{settle.to}</strong>
                        </div>
                        <div className="text-xl font-black font-display text-[#09090b] mt-0.5 tabular-nums">
                          ₹{settle.amount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#71717a] font-mono">
                          UPI: {creditorDetails.upiId || "Standard UPI Link"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={upiLink}
                          className="py-2 px-3.5 rounded-xl text-xs font-bold text-white btn-bharpai-upi flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pay Now</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
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
                          className="p-2 rounded-xl bg-white border border-[#e4e4e7] hover:bg-[#e4e4e7] text-[#09090b]"
                          title="View QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(settle, idx)}
                          className="p-2 rounded-xl bg-white border border-[#e4e4e7] hover:bg-[#e4e4e7] text-[#09090b]"
                          title="Copy Share Link"
                        >
                          {copiedIndex === idx ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
