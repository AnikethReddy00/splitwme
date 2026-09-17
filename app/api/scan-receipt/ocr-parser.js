export function parseReceiptText(text) {
  const rawLines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  let merchant = "";
  let date = new Date().toISOString().split("T")[0];
  const items = [];
  let subtotal = 0;
  let tax = 0;
  let serviceCharge = 0;
  let totalAmount = 0;

  // 1. Search for date pattern DD/MM/YYYY or YYYY-MM-DD
  const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/;
  for (const line of rawLines) {
    const match = line.match(dateRegex);
    if (match) {
      date = match[1];
      break;
    }
  }

  // Keywords to ignore for merchant name and line items
  const skipKeywords = [
    "bill no", "waiter", "table", "tno", "cash/bill", "tin:", "gstin", "fssai", "ph:", "phone",
    "sub total", "subtotal", "gross total", "net amount", "total quantity",
    "vat", "service tax", "service charge", "service charges", "cgst", "sgst", "igst", "gst",
    "round off", "balance", "change", "cash", "card", "thank you", "get back", "welcome", "layout",
    "bangalore", "mumbai", "delhi", "chennai", "hyderabad", "kalyan", "nagar", "road", "street", "cross", "block"
  ];

  // 2. Find table header index (e.g. "Item Price Qty Total Rs")
  let tableHeaderIndex = -1;
  for (let i = 0; i < rawLines.length; i++) {
    const lower = rawLines[i].toLowerCase();
    if (lower.includes("item") && (lower.includes("price") || lower.includes("qty") || lower.includes("total") || lower.includes("rate") || lower.includes("rs"))) {
      tableHeaderIndex = i;
      break;
    }
  }

  // 3. Extract merchant name from top lines before table header
  const linesBeforeHeader = tableHeaderIndex > 0 ? rawLines.slice(0, tableHeaderIndex) : rawLines.slice(0, 6);
  for (const line of linesBeforeHeader) {
    const lower = line.toLowerCase();
    const hasPincode = /\b\d{5,6}\b/.test(line);
    const isNoise = skipKeywords.some(sk => lower.includes(sk)) || hasPincode || /^[\d\s\-\+\(\)\:\#\,\.\/]+$/.test(line);
    
    if (!isNoise && line.length >= 3) {
      const cleanName = line.replace(/^[^\w]+|[^\w\s\&\.\'\-]+$/g, '').trim();
      if (cleanName.length >= 3 && !/^\d+$/.test(cleanName)) {
        merchant = cleanName;
        break;
      }
    }
  }

  // 4. Scan candidate lines for items and totals
  const candidateLines = tableHeaderIndex >= 0 ? rawLines.slice(tableHeaderIndex + 1) : rawLines;

  for (const line of candidateLines) {
    const lower = line.toLowerCase();

    // Taxes (VAT, GST, Service Tax)
    if (lower.includes("vat") || lower.includes("service tax") || lower.includes("cgst") || lower.includes("sgst") || lower.includes("igst")) {
      const nums = line.match(/[\d]+(?:\.[\d]{1,2})?/g);
      if (nums && nums.length > 0) {
        const val = parseFloat(nums[nums.length - 1]);
        if (!isNaN(val) && val > 0 && val < 50000) {
          tax += val;
        }
      }
      continue;
    }

    // Service Charge / Tip
    if (lower.includes("service charge") || lower.includes("service charges") || lower.includes("tip") || lower.includes("svc chg")) {
      const nums = line.match(/[\d]+(?:\.[\d]{1,2})?/g);
      if (nums && nums.length > 0) {
        const val = parseFloat(nums[nums.length - 1]);
        if (!isNaN(val) && val > 0 && val < 50000) {
          serviceCharge += val;
        }
      }
      continue;
    }

    // Subtotal / Gross Total
    if (lower.includes("gross total") || lower.includes("sub total") || lower.includes("subtotal")) {
      const nums = line.match(/[\d]+(?:\.[\d]{1,2})?/g);
      if (nums && nums.length > 0) {
        const val = parseFloat(nums[nums.length - 1]);
        if (!isNaN(val) && val > 0) subtotal = val;
      }
      continue;
    }

    // Net Amount / Grand Total
    if (lower.includes("net amount") || lower.includes("grand total") || (lower.includes("total") && !lower.includes("qty") && !lower.includes("quantity") && !lower.includes("item"))) {
      const nums = line.match(/[\d]+(?:\.[\d]{1,2})?/g);
      if (nums && nums.length > 0) {
        const val = parseFloat(nums[nums.length - 1]);
        if (!isNaN(val) && val > 0) totalAmount = val;
      }
      continue;
    }

    // Check if line should be skipped
    const isSkip = skipKeywords.some(sk => lower.includes(sk));
    if (isSkip) continue;

    // Item line matching
    const cleanedLine = line.replace(/[\~\_\-\=\*\|]+/g, ' ').replace(/\s+/g, ' ').trim();
    const numbers = cleanedLine.match(/\b\d+(?:\.\d+)?\b/g);

    if (numbers && numbers.length >= 1) {
      const firstNumIndex = cleanedLine.search(/\b\d+(?:\.\d+)?\b/);
      if (firstNumIndex > 1) {
        const namePart = cleanedLine.substring(0, firstNumIndex).trim();
        const name = namePart.replace(/^[^\w]+|[^\w\s\&\.\'\-]+$/g, '').trim();

        if (name.length >= 2 && !/^\d+$/.test(name) && !skipKeywords.some(sk => name.toLowerCase().includes(sk))) {
          let price = 0;
          let qty = 1;
          let lineTotal = 0;

          if (numbers.length >= 3) {
            // Typical format: [Price, Qty, Total] e.g. [330.00, 1.000, 330.00]
            const n1 = parseFloat(numbers[0]);
            const n2 = parseFloat(numbers[1]);
            const n3 = parseFloat(numbers[2]);

            if (n2 <= 50 && n2 > 0) {
              // n2 is qty
              qty = Math.round(n2);
              price = n1;
              lineTotal = n3 > 0 ? n3 : price * qty;
            } else if (n1 <= 50 && n1 > 0) {
              // n1 is qty
              qty = Math.round(n1);
              price = n2;
              lineTotal = n3 > 0 ? n3 : price * qty;
            } else {
              price = n1;
              qty = 1;
              lineTotal = n1;
            }
          } else if (numbers.length === 2) {
            const n1 = parseFloat(numbers[0]);
            const n2 = parseFloat(numbers[1]);
            if (n1 <= 20 && n2 > 20) {
              qty = Math.round(n1);
              price = n2;
              lineTotal = price * qty;
            } else if (n2 <= 20 && n1 > 20) {
              price = n1;
              qty = Math.round(n2);
              lineTotal = price * qty;
            } else {
              price = n1;
              qty = 1;
              lineTotal = n2;
            }
          } else if (numbers.length === 1) {
            price = parseFloat(numbers[0]);
            qty = 1;
            lineTotal = price;
          }

          // Self-consistency check: if line total and qty are known, align price
          if (qty > 0 && lineTotal > 0 && Math.abs(price * qty - lineTotal) > 2) {
            if (qty === 1) {
              price = lineTotal;
            } else {
              lineTotal = price * qty;
            }
          }

          if (price > 0 && price < 100000) {
            items.push({
              name,
              qty: qty || 1,
              price: Math.round(price * 100) / 100,
              total: Math.round((lineTotal || price * (qty || 1)) * 100) / 100
            });
          }
        }
      }
    }
  }

  const itemsSum = items.reduce((sum, item) => sum + item.total, 0);
  if (!subtotal || subtotal < itemsSum * 0.5) {
    subtotal = itemsSum;
  }
  if (!totalAmount || totalAmount < itemsSum) {
    totalAmount = Math.round((subtotal + tax + serviceCharge) * 100) / 100;
  }

  return {
    merchant: merchant || "Scanned Receipt",
    date,
    category: "Food",
    items: items.length > 0 ? items : [
      { name: "Scanned Item", qty: 1, price: totalAmount || 100, total: totalAmount || 100 }
    ],
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    serviceCharge: Math.round(serviceCharge * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
}
