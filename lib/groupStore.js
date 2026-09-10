import fs from "fs";
import path from "path";
import { INITIAL_GROUPS } from "@/lib/settlement";

const DATA_DIR = path.join(process.cwd(), "data");
const GROUPS_FILE = path.join(DATA_DIR, "groups.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Error creating data dir:", err);
  }
}

function loadGroupsFromDisk() {
  ensureDataDir();
  try {
    if (fs.existsSync(GROUPS_FILE)) {
      const data = fs.readFileSync(GROUPS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading groups.json:", err);
  }
  // Initialize with default groups
  saveGroupsToDisk(INITIAL_GROUPS);
  return [...INITIAL_GROUPS];
}

function saveGroupsToDisk(groups) {
  ensureDataDir();
  try {
    fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving groups.json:", err);
  }
}

// Global cache
if (!globalThis.__splitwme_groups) {
  globalThis.__splitwme_groups = loadGroupsFromDisk();
}

export function saveAllGroups(groups) {
  saveGroupsToDisk(groups);
  globalThis.__splitwme_groups = groups;
}

export function getAllGroups() {
  const diskGroups = loadGroupsFromDisk();
  globalThis.__splitwme_groups = diskGroups;
  return diskGroups;
}

export function getGroupById(groupId) {
  if (!groupId) return null;
  const groups = getAllGroups();
  const rawId = String(groupId).trim();
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (e) {}

  return groups.find(
    (g) =>
      g.id === rawId ||
      g.id === decodedId ||
      g.id.toLowerCase() === rawId.toLowerCase() ||
      g.id.toLowerCase() === decodedId.toLowerCase()
  );
}

export function createGroup({ name, category, creatorName, creatorUpi, members = [] }) {
  const groups = getAllGroups();
  const allMembers = Array.from(new Set([creatorName, ...members].filter(Boolean)));
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

  groups.unshift(newGroup);
  saveGroupsToDisk(groups);
  globalThis.__splitwme_groups = groups;
  return newGroup;
}

export function updateGroup(groupId, { name, category }) {
  const groups = getAllGroups();
  const rawId = String(groupId).trim();
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (e) {}

  const group = groups.find(
    (g) =>
      g.id === rawId ||
      g.id === decodedId ||
      g.id.toLowerCase() === rawId.toLowerCase() ||
      g.id.toLowerCase() === decodedId.toLowerCase()
  );
  if (!group) return { error: "Group not found" };

  if (name) group.name = name.trim();
  if (category) group.category = category.trim();

  saveGroupsToDisk(groups);
  globalThis.__splitwme_groups = groups;
  return { success: true, group };
}

export function deleteGroup(groupId) {
  let groups = getAllGroups();
  const rawId = String(groupId).trim();
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (e) {}

  const initialLen = groups.length;
  groups = groups.filter(
    (g) =>
      g.id !== rawId &&
      g.id !== decodedId &&
      g.id.toLowerCase() !== rawId.toLowerCase() &&
      g.id.toLowerCase() !== decodedId.toLowerCase()
  );

  if (groups.length === initialLen) {
    return { error: "Group not found" };
  }

  saveGroupsToDisk(groups);
  globalThis.__splitwme_groups = groups;
  return { success: true };
}

export function addMemberToGroup(groupId, { name, upiId }) {
  const groups = getAllGroups();
  const rawId = String(groupId).trim();
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (e) {}

  const group = groups.find(
    (g) =>
      g.id === rawId ||
      g.id === decodedId ||
      g.id.toLowerCase() === rawId.toLowerCase() ||
      g.id.toLowerCase() === decodedId.toLowerCase()
  );
  if (!group) return { error: "Group not found" };

  const cleanName = name.trim();
  if (!group.members) {
    group.members = [];
  }
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

  saveGroupsToDisk(groups);
  globalThis.__splitwme_groups = groups;
  return { success: true, group };
}

export function removeMemberFromGroup(groupId, memberName) {
  const groups = getAllGroups();
  const rawId = String(groupId).trim();
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (e) {}

  const group = groups.find(
    (g) =>
      g.id === rawId ||
      g.id === decodedId ||
      g.id.toLowerCase() === rawId.toLowerCase() ||
      g.id.toLowerCase() === decodedId.toLowerCase()
  );
  if (!group) return { error: "Group not found" };

  group.members = (group.members || []).filter((m) => m !== memberName);
  if (group.memberDetails && group.memberDetails[memberName]) {
    delete group.memberDetails[memberName];
  }

  // Remove member from any existing expense splits
  group.expenses?.forEach((expense) => {
    if (expense.splitBetween && expense.splitBetween.includes(memberName)) {
      expense.splitBetween = expense.splitBetween.filter((m) => m !== memberName);
    }
  });

  saveGroupsToDisk(groups);
  globalThis.__splitwme_groups = groups;
  return { success: true, group };
}

export function addExpenseToGroup(groupId, expense) {
  const groups = getAllGroups();
  const rawId = String(groupId).trim();
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (e) {}

  const group = groups.find(
    (g) =>
      g.id === rawId ||
      g.id === decodedId ||
      g.id.toLowerCase() === rawId.toLowerCase() ||
      g.id.toLowerCase() === decodedId.toLowerCase()
  );
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

  saveGroupsToDisk(groups);
  globalThis.__splitwme_groups = groups;
  return { success: true, expense: newExpense, group };
}

export function updateExpenseInGroup(groupId, expenseId, updatedData) {
  const groups = getAllGroups();
  const rawId = String(groupId).trim();
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (e) {}

  const group = groups.find(
    (g) =>
      g.id === rawId ||
      g.id === decodedId ||
      g.id.toLowerCase() === rawId.toLowerCase() ||
      g.id.toLowerCase() === decodedId.toLowerCase()
  );
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

  saveGroupsToDisk(groups);
  globalThis.__splitwme_groups = groups;
  return { success: true, expense, group };
}

export function deleteExpenseFromGroup(groupId, expenseId) {
  const groups = getAllGroups();
  const rawId = String(groupId).trim();
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (e) {}

  const group = groups.find(
    (g) =>
      g.id === rawId ||
      g.id === decodedId ||
      g.id.toLowerCase() === rawId.toLowerCase() ||
      g.id.toLowerCase() === decodedId.toLowerCase()
  );
  if (!group) return { error: "Group not found" };

  const initialLen = group.expenses?.length || 0;
  group.expenses = (group.expenses || []).filter((e) => e.id !== expenseId);

  if (group.expenses.length === initialLen) {
    return { error: "Expense not found" };
  }

  saveGroupsToDisk(groups);
  globalThis.__splitwme_groups = groups;
  return { success: true, group };
}
