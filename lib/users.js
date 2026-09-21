import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Default mock users with clean usernames
export const MOCK_USERS = [
  {
    id: "user_1",
    username: "aniketh",
    name: "Aniketh Reddy",
    email: "aniketh@splitwme.com",
    password: "password123",
    upiId: "anikethreddy0987@okaxis",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "+91 98765 43210"
  },
  {
    id: "user_1789068701129",
    username: "varunsharma",
    name: "Varun Sharma",
    email: "varunsharma@guest.splitwme.com",
    password: "password123",
    upiId: "varun@oksbi",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Varun%20Sharma",
    phone: "+91 98111 22334"
  },
  {
    id: "user_siddharth",
    username: "siddharth",
    name: "Siddharth Verma",
    email: "siddharth@splitwme.com",
    password: "password123",
    upiId: "siddharth@okicici",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Siddharth%20Verma",
    phone: "+91 98222 33445"
  },
  {
    id: "user_rohan",
    username: "rohan",
    name: "Rohan Mehta",
    email: "rohan@splitwme.com",
    password: "password123",
    upiId: "rohan@paytm",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rohan%20Mehta",
    phone: "+91 98333 44556"
  },
  {
    id: "user_priya",
    username: "priyapatel",
    name: "Priya Patel",
    email: "priya@splitwme.com",
    password: "password123",
    upiId: "priya@okhdfcbank",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Priya%20Patel",
    phone: "+91 98444 55667"
  },
  {
    id: "user_karthik",
    username: "karthikr",
    name: "Karthik Ram",
    email: "karthik@splitwme.com",
    password: "password123",
    upiId: "karthik@oksbi",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Karthik%20Ram",
    phone: "+91 98555 66778"
  },
  {
    id: "user_neha",
    username: "nehagupta",
    name: "Neha Gupta",
    email: "neha@splitwme.com",
    password: "password123",
    upiId: "neha@okhdfcbank",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Neha%20Gupta",
    phone: "+91 98666 77889"
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

/**
 * Validates a username according to strict rules:
 * - Lowercase alphanumeric characters ONLY (a-z, 0-9)
 * - No capital letters
 * - No symbols or punctuation
 * - No spaces
 * - Length between 3 and 20 characters
 */
export function validateUsername(username) {
  if (!username || typeof username !== "string") {
    return { valid: false, error: "Username is required." };
  }

  const raw = username.trim();

  if (raw.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters long." };
  }
  if (raw.length > 20) {
    return { valid: false, error: "Username cannot exceed 20 characters." };
  }
  if (/\s/.test(raw)) {
    return { valid: false, error: "Username cannot contain spaces." };
  }
  if (/[A-Z]/.test(raw)) {
    return { valid: false, error: "Username cannot contain capital letters (lowercase only)." };
  }
  if (/[^a-z0-9]/.test(raw)) {
    return { valid: false, error: "Username cannot contain symbols or special characters." };
  }
  if (!/^[a-z0-9]{3,20}$/.test(raw)) {
    return { valid: false, error: "Username must contain only lowercase letters and numbers." };
  }

  return { valid: true, sanitized: raw };
}

/**
 * Sanitizes any raw input string into a valid candidate username
 */
export function sanitizeUsername(input) {
  if (!input) return "";
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
}

/**
 * Generates a unique username from display name or email
 */
function generateFallbackUsername(name, email, existingUsers) {
  let base = sanitizeUsername(name) || sanitizeUsername(email ? email.split("@")[0] : "") || "user";
  if (base.length < 3) base = base.padEnd(3, "0");

  let candidate = base;
  let counter = 1;
  const taken = new Set(existingUsers.map((u) => (u.username || "").toLowerCase()));

  while (taken.has(candidate)) {
    candidate = `${base}${counter}`;
    counter++;
  }
  return candidate;
}

function loadUsersFromDisk() {
  ensureDataDir();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure every user has a valid unique username and backfill missing mock users
        let modified = false;
        const users = [...parsed];

        // 1. Backfill usernames for existing records without one
        users.forEach((u) => {
          if (!u.username) {
            u.username = generateFallbackUsername(u.name, u.email, users);
            modified = true;
          }
        });

        // 2. Ensure all default mock users exist in directory so directory search is rich
        MOCK_USERS.forEach((mock) => {
          const exists = users.find(
            (u) =>
              (u.username && u.username.toLowerCase() === mock.username.toLowerCase()) ||
              (u.email && u.email.toLowerCase() === mock.email.toLowerCase()) ||
              u.id === mock.id
          );
          if (!exists) {
            users.push({ ...mock });
            modified = true;
          } else if (!exists.username) {
            exists.username = mock.username;
            modified = true;
          }
        });

        if (modified) {
          saveUsersToDisk(users);
        }
        return users;
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

export function findUserByUsername(username) {
  if (!username) return null;
  const clean = username.trim().toLowerCase().replace(/^@/, "");
  const users = getAllUsers();
  return users.find((u) => (u.username || "").toLowerCase() === clean);
}

export function findUserByEmailOrUsername(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase().replace(/^@/, "");
  const users = getAllUsers();
  return users.find(
    (u) =>
      (u.username && u.username.toLowerCase() === clean) ||
      (u.email && u.email.toLowerCase() === clean)
  );
}

export function findUserById(id) {
  if (!id) return null;
  const users = getAllUsers();
  return users.find((u) => u.id === id);
}

/**
 * Textbook Binary Search for Prefix Matching on a Sorted Array.
 * Time Complexity: O(log N + K) where N = total users, K = matching users.
 * 
 * @param {Array<object>} sortedArray - Pre-sorted array of objects
 * @param {string} key - Property key to search (e.g. 'username' or 'name')
 * @param {string} prefix - Lowercase prefix string to find
 * @returns {Array<object>} Matched objects starting with prefix
 */
export function binarySearchPrefix(sortedArray, key, prefix) {
  if (!sortedArray || sortedArray.length === 0 || !prefix) return [];
  const cleanPrefix = prefix.toLowerCase();

  // Binary search to find the lower bound (first index where item[key] >= prefix)
  let low = 0;
  let high = sortedArray.length - 1;
  let firstIdx = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = (sortedArray[mid][key] || "").toLowerCase();

    if (midVal >= cleanPrefix) {
      firstIdx = mid;
      high = mid - 1; // Look in left partition for earlier match
    } else {
      low = mid + 1; // Look in right partition
    }
  }

  if (firstIdx === -1) return [];

  // Linear scan forward from firstIdx to collect all matching prefix elements
  const results = [];
  for (let i = firstIdx; i < sortedArray.length; i++) {
    const val = (sortedArray[i][key] || "").toLowerCase();
    if (val.startsWith(cleanPrefix)) {
      results.push(sortedArray[i]);
    } else {
      break; // Since sorted, no further elements can match
    }
  }

  return results;
}

/**
 * Searches the user directory using Binary Search on sorted username and name indexes.
 * @param {string} query - Search term (e.g. username, @handle, or name)
 * @param {number} limit - Max results to return
 * @returns {Array<object>} Safe user profiles matching query
 */
export function searchUsersBinary(query, limit = 10) {
  const users = getAllUsers();
  const cleanQuery = (query || "").trim().toLowerCase().replace(/^@/, "");

  if (!cleanQuery) {
    return users.slice(0, limit).map(({ password: _, ...u }) => u);
  }

  // 1. Sort users by username for binary search
  const sortedByUsername = [...users].sort((a, b) =>
    (a.username || "").toLowerCase().localeCompare((b.username || "").toLowerCase())
  );

  // 2. Perform Binary Search on username index
  const usernameMatches = binarySearchPrefix(sortedByUsername, "username", cleanQuery);

  // 3. Sort users by full name for binary search
  const sortedByName = [...users].sort((a, b) =>
    (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase())
  );

  // 4. Perform Binary Search on name index
  const nameMatches = binarySearchPrefix(sortedByName, "name", cleanQuery);

  // 5. Combine and deduplicate matches, prioritizing exact/prefix username matches
  const seenIds = new Set();
  const combined = [];

  [...usernameMatches, ...nameMatches].forEach((u) => {
    if (!seenIds.has(u.id)) {
      seenIds.add(u.id);
      const { password: _, ...safeUser } = u;
      combined.push(safeUser);
    }
  });

  return combined.slice(0, limit);
}

export function registerNewUser({ username, name, email, password, upiId, phone }) {
  const users = getAllUsers();

  // Validate username
  const usernameVal = validateUsername(username);
  if (!usernameVal.valid) {
    return { error: usernameVal.error };
  }
  const cleanUsername = usernameVal.sanitized;

  // Check unique username
  const existingUsername = users.find(
    (u) => (u.username || "").toLowerCase() === cleanUsername
  );
  if (existingUsername) {
    return { error: `The username @${cleanUsername} is already taken. Please choose another.` };
  }

  // Check unique email
  const existingEmail = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (existingEmail) {
    return { error: "An account with this email already exists." };
  }

  const cleanName = name.trim();
  const newUser = {
    id: `user_${Date.now()}`,
    username: cleanUsername,
    name: cleanName,
    email: email.trim().toLowerCase(),
    password: password,
    upiId: upiId ? upiId.trim() : `${cleanUsername}@upi`,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`,
    phone: phone || ""
  };

  users.push(newUser);
  saveUsersToDisk(users);
  globalThis.__splitwme_users = users;
  return { user: newUser };
}

export function updateUserProfile(id, { name, username, upiId, avatar, phone }) {
  const users = getAllUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return { error: "User not found" };

  if (username) {
    const val = validateUsername(username);
    if (!val.valid) return { error: val.error };
    const taken = users.find(
      (u) => u.id !== id && (u.username || "").toLowerCase() === val.sanitized
    );
    if (taken) return { error: `Username @${val.sanitized} is already taken.` };
    user.username = val.sanitized;
  }

  if (name) user.name = name.trim();
  if (upiId) user.upiId = upiId.trim();
  if (avatar) user.avatar = avatar.trim();
  if (phone !== undefined) user.phone = phone.trim();

  saveUsersToDisk(users);
  globalThis.__splitwme_users = users;

  const { password: _, ...safeUser } = user;
  return { success: true, user: safeUser };
}
