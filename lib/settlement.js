/**
 * Smart Debt Simplification Algorithm (Min-Cash-Flow)
 * Minimizes the total number of transactions needed to settle all debts in a group.
 */

/**
 * Calculates net balances for each person and computes the minimal settlement transactions.
 * @param {Array<string>} members - List of member names/IDs
 * @param {Array<object>} expenses - List of expenses: { id, title, amount, paidBy, splitBetween: [] }
 * @returns {Array<{ from: string, to: string, amount: number }>}
 */
export function calculateSmartSettlements(members = [], expenses = []) {
  // 1. Calculate net balance for each person
  const balances = {};
  (members || []).forEach((m) => {
    balances[m] = 0;
  });

  (expenses || []).forEach((expense) => {
    const amount = Number(expense.amount) || 0;
    const paidBy = expense.paidBy;
    const splitBetween = expense.splitBetween && expense.splitBetween.length > 0 
      ? expense.splitBetween 
      : members;

    if (splitBetween.length === 0) return;
    const perPerson = amount / splitBetween.length;

    // The payer is credited
    balances[paidBy] = (balances[paidBy] || 0) + amount;

    // The splitters are debited
    splitBetween.forEach((person) => {
      balances[person] = (balances[person] || 0) - perPerson;
    });
  });

  // 2. Separate into debtors and creditors
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([person, balance]) => {
    const net = Math.round(balance * 100) / 100;
    if (net < -0.01) {
      debtors.push({ person, balance: -net });
    } else if (net > 0.01) {
      creditors.push({ person, balance: net });
    }
  });

  // Sort descending by amount
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const settlements = [];
  let dIdx = 0;
  let cIdx = 0;

  // 3. Match largest debtor with largest creditor greedily
  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.balance, creditor.balance);
    const roundedAmount = Math.round(settleAmount * 100) / 100;

    if (roundedAmount > 0) {
      settlements.push({
        id: `settle_${dIdx}_${cIdx}_${Date.now()}`,
        from: debtor.person,
        to: creditor.person,
        amount: roundedAmount
      });
    }

    debtor.balance -= settleAmount;
    creditor.balance -= settleAmount;

    if (debtor.balance < 0.01) dIdx++;
    if (creditor.balance < 0.01) cIdx++;
  }

  return {
    netBalances: balances,
    settlements
  };
}

/**
 * Builds a universal UPI Deeplink compatible with GPay, PhonePe, Paytm, CRED, BHIM.
 */
export function generateUpiDeeplink({ upiId, name, amount, note = "SplitWMe Settlement" }) {
  const cleanUpi = (upiId || "").trim();
  const cleanName = encodeURIComponent((name || "Friend").trim());
  const cleanAmount = Number(amount).toFixed(2);
  const cleanNote = encodeURIComponent(note);

  // Standard UPI Intent URL scheme
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}

/**
 * Generates a desktop-ready QR code URL for instant phone scanning.
 */
export function generateQrCodeUrl(upiDeeplink) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(upiDeeplink)}`;
}

/**
 * Formats a clean WhatsApp / SMS shareable settlement message.
 */
export function generateShareableReminderText({ fromName, toName, amount, groupName, upiDeeplink }) {
  return `Hey ${fromName}! 👋\n\nHere is your 1-click settlement for *${groupName}* on SplitWMe:\n💰 *Amount:* ₹${amount}\n👤 *Pay To:* ${toName}\n\n👉 *Pay Instantly (GPay/PhonePe/Paytm):*\n${upiDeeplink}\n\n_Split smartly with SplitWMe_`;
}

// Initial Groups Data for Aniketh
export const INITIAL_GROUPS = [
  {
    id: "group_1",
    name: "Goa Trip 🌴",
    category: "Vacation",
    members: ["Aniketh Reddy"],
    memberDetails: {
      "Aniketh Reddy": {
        upiId: "aniketh@okhdfcbank",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
      }
    },
    expenses: []
  },
  {
    id: "group_2",
    name: "Apartment Flatmates 🏠",
    category: "Home",
    members: ["Aniketh Reddy"],
    memberDetails: {
      "Aniketh Reddy": {
        upiId: "aniketh@okhdfcbank",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
      }
    },
    expenses: []
  }
];
