import { INITIAL_GROUPS } from "@/lib/settlement";

// Persistent in-memory store for groups during runtime
let groupsStore = [...INITIAL_GROUPS];

export function getAllGroups() {
  return groupsStore;
}

export function getGroupById(groupId) {
  return groupsStore.find((g) => g.id === groupId);
}

export function createGroup({ name, category, creatorName, creatorUpi, members = [] }) {
  const allMembers = Array.from(new Set([creatorName, ...members]));
  const newGroup = {
    id: `grp_${Date.now()}`,
    name: name.trim(),
    category: category || "Trip",
    members: allMembers,
    memberDetails: {
      [creatorName]: {
        upiId: creatorUpi || `${creatorName.toLowerCase().replace(/\s+/g, "")}@upi`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(creatorName)}`
      }
    },
    expenses: []
  };

  groupsStore.unshift(newGroup);
  return newGroup;
}

export function addMemberToGroup(groupId, { name, upiId }) {
  const group = getGroupById(groupId);
  if (!group) return { error: "Group not found" };

  const cleanName = name.trim();
  if (!group.members.includes(cleanName)) {
    group.members.push(cleanName);
  }

  if (!group.memberDetails) {
    group.memberDetails = {};
  }

  group.memberDetails[cleanName] = {
    upiId: upiId ? upiId.trim() : `${cleanName.toLowerCase().replace(/\s+/g, "")}@upi`,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`
  };

  return { success: true, group };
}

export function addExpenseToGroup(groupId, expense) {
  const group = getGroupById(groupId);
  if (!group) return { error: "Group not found" };

  const newExpense = {
    id: `e_${Date.now()}`,
    title: expense.title.trim(),
    amount: Number(expense.amount),
    paidBy: expense.paidBy,
    splitBetween: expense.splitBetween || group.members,
    date: expense.date || "Just now",
    category: expense.category || "General"
  };

  group.expenses.unshift(newExpense);
  return { success: true, expense: newExpense, group };
}
