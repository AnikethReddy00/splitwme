// In-memory / persistent mock user database for SplitWMe auth flow
export const MOCK_USERS = [
  {
    id: "user_1",
    name: "Aniketh Reddy",
    email: "aniketh@splitwme.com",
    password: "password123",
    upiId: "aniketh@okhdfcbank",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "+91 98765 43210"
  },
  {
    id: "user_2",
    name: "Rohan Sharma",
    email: "rohan@splitwme.com",
    password: "password123",
    upiId: "rohan@oksbi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    phone: "+91 98765 12345"
  },
  {
    id: "user_3",
    name: "Priya Patel",
    email: "priya@splitwme.com",
    password: "password123",
    upiId: "priya@icici",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    phone: "+91 98765 67890"
  }
];

// Runtime registered users store (persists during server life)
const registeredUsers = [...MOCK_USERS];

export function findUserByEmail(email) {
  return registeredUsers.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
}

export function findUserById(id) {
  return registeredUsers.find((u) => u.id === id);
}

export function registerNewUser({ name, email, password, upiId, phone }) {
  const existing = findUserByEmail(email);
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

  registeredUsers.push(newUser);
  return { user: newUser };
}
