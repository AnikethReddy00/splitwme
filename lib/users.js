import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Default mock users
export const MOCK_USERS = [
  {
    id: "user_1",
    name: "Aniketh Reddy",
    email: "aniketh@splitwme.com",
    password: "password123",
    upiId: "aniketh@okhdfcbank",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "+91 98765 43210"
  }
];

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Error creating data dir for users:", err);
  }
}

function loadUsersFromDisk() {
  ensureDataDir();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading users.json:", err);
  }
  saveUsersToDisk(MOCK_USERS);
  return [...MOCK_USERS];
}

function saveUsersToDisk(users) {
  ensureDataDir();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving users.json:", err);
  }
}

// Global cache
if (!globalThis.__splitwme_users) {
  globalThis.__splitwme_users = loadUsersFromDisk();
}

export function getAllUsers() {
  const diskUsers = loadUsersFromDisk();
  globalThis.__splitwme_users = diskUsers;
  return diskUsers;
}

export function findUserByEmail(email) {
  if (!email) return null;
  const users = getAllUsers();
  return users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
}

export function findUserById(id) {
  if (!id) return null;
  const users = getAllUsers();
  return users.find((u) => u.id === id);
}

export function registerNewUser({ name, email, password, upiId, phone }) {
  const users = getAllUsers();
  const existing = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const newUser = {
    id: `user_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    upiId: upiId ? upiId.trim() : `${name.toLowerCase().replace(/\s+/g, "")}@upi`,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    phone: phone || ""
  };

  users.push(newUser);
  saveUsersToDisk(users);
  globalThis.__splitwme_users = users;
  return { user: newUser };
}

export function updateUserProfile(id, { name, upiId, avatar, phone }) {
  const users = getAllUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return { error: "User not found" };

  if (name) user.name = name.trim();
  if (upiId) user.upiId = upiId.trim();
  if (avatar) user.avatar = avatar.trim();
  if (phone !== undefined) user.phone = phone.trim();

  saveUsersToDisk(users);
  globalThis.__splitwme_users = users;

  const { password: _, ...safeUser } = user;
  return { success: true, user: safeUser };
}
