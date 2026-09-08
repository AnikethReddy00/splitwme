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

export function updateGroup(groupId, { name, category }) {
  const group = getGroupById(groupId);
  if (!group) return { error: "Group not found" };

  if (name) group.name = name.trim();
  if (category) group.category = category.trim();

  return { success: true, group };
}

export function deleteGroup(groupId) {
  const initialLen = groupsStore.length;
  groupsStore = groupsStore.filter((g) => g.id !== groupId);
  if (groupsStore.length === initialLen) {
    return { error: "Group not found" };
  }
  return { success: true };
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

export function removeMemberFromGroup(groupId, memberName) {
  const group = getGroupById(groupId);
  if (!group) return { error: "Group not found" };

  group.members = group.members.filter((m) => m !== memberName);
  if (group.memberDetails && group.memberDetails[memberName]) {
    delete group.memberDetails[memberName];
  }

  // Remove member from any existing expense splits
  group.expenses?.forEach((expense) => {
    if (expense.splitBetween && expense.splitBetween.includes(memberName)) {
      expense.splitBetween = expense.splitBetween.filter((m) => m !== memberName);
    }
  });

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
    splitBetween: expense.splitBetween && expense.splitBetween.length > 0 ? expense.splitBetween : group.members,
    date: expense.date || "Just now",
    category: expense.category || "General"
  };

  if (!group.expenses) group.expenses = [];
  group.expenses.unshift(newExpense);
  return { success: true, expense: newExpense, group };
}

export function updateExpenseInGroup(groupId, expenseId, updatedData) {
  const group = getGroupById(groupId);
  if (!group) return { error: "Group not found" };

  const expense = group.expenses?.find((e) => e.id === expenseId);
  if (!expense) return { error: "Expense not found" };

  if (updatedData.title) expense.title = updatedData.title.trim();
  if (updatedData.amount) expense.amount = Number(updatedData.amount);
  if (updatedData.paidBy) expense.paidBy = updatedData.paidBy;
  if (updatedData.category) expense.category = updatedData.category;
  if (updatedData.splitBetween) {
    expense.splitBetween = updatedData.splitBetween.length > 0 ? updatedData.splitBetween : group.members;
  }

  return { success: true, expense, group };
}

export function deleteExpenseFromGroup(groupId, expenseId) {
  const group = getGroupById(groupId);
  if (!group) return { error: "Group not found" };

  const initialLen = group.expenses?.length || 0;
  group.expenses = (group.expenses || []).filter((e) => e.id !== expenseId);

  if (group.expenses.length === initialLen) {
    return { error: "Expense not found" };
  }

  return { success: true, group };
}
