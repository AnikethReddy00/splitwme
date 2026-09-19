"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  X,
  Plus,
  Minus,
  Trash2,
  Users,
  Check,
  AlertCircle,
  Receipt,
  Sparkles,
  ArrowRight,
  DollarSign,
  Percent,
  Sliders,
  CheckCircle2,
  HelpCircle
} from "lucide-react";

export default function ReceiptItemizerModal({
  isOpen,
  onClose,
  groupMembers = [],
  currentUser,
  onApplyExpense
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Extracted Receipt Data
  const [parsedData, setParsedData] = useState(null);
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food");
  
  // Array of item objects:
  // {
  //   id: string,
  //   name: string,
  //   qty: number,
  //   price: number,
  //   total: number,
  //   splitMode: 'equal' | 'qty', // 'equal' = split line total among assigned members, 'qty' = assign specific quantities to members
  //   assignedMembers: string[],
  //   memberQuantities: { [memberName: string]: number }
  // }
  const [items, setItems] = useState([]);
  
  // Common Fees & Surcharges (Shared across the whole bill)
  const [tax, setTax] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [extraCharges, setExtraCharges] = useState(0); // e.g. Delivery, Packaging, Surcharges
  const [discount, setDiscount] = useState(0);
  
  // How common charges are distributed:
  // 'proportional' = proportional to each person's item subtotal (most fair)
  // 'equal' = split common charges equally among everyone participating
  const [commonSplitMode, setCommonSplitMode] = useState("proportional");

  const [paidBy, setPaidBy] = useState(currentUser || groupMembers[0] || "Aniketh Reddy");
  const [uploadStatus, setUploadStatus] = useState("Extracting items from bill image...");

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Client-side image optimization for fast OCR
  const optimizeImageBeforeUpload = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name || "receipt.jpg", {
                type: "image/jpeg",
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.88
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Only image files (.png, .jpg, .jpeg, .webp) are allowed.");
      return;
    }

    setErrorMessage("");
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));

    // Automatically trigger extraction
    await uploadAndParse(file);
  };

  const uploadAndParse = async (file) => {
    setIsUploading(true);
    setErrorMessage("");
    setUploadStatus("Optimizing receipt image...");

    try {
      const optimizedFile = await optimizeImageBeforeUpload(file);
      setUploadStatus("Reading receipt & extracting items...");

      const formData = new FormData();
      formData.append("file", optimizedFile);

      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to scan receipt image.");
      }

      if (data.receipt) {
        const r = data.receipt;
        setParsedData(r);
        setMerchant(r.merchant || "Uploaded Bill Expense");
        setCategory(r.category || "Food");
        setTax(Number(r.tax) || 0);
        setServiceCharge(Number(r.serviceCharge) || 0);
        setExtraCharges(0);
        setDiscount(0);

        const extractedItems = (r.items || []).map((item, idx) => {
          const itemQty = Math.max(1, Number(item.qty) || 1);
          const itemPrice = Number(item.price) || 0;
          const itemTotal = Number(item.total) || itemQty * itemPrice;

          return {
            id: `item_${Date.now()}_${idx}`,
            name: item.name || `Item ${idx + 1}`,
            qty: itemQty,
            price: itemPrice > 0 ? itemPrice : (itemQty > 0 ? Math.round((itemTotal / itemQty) * 100) / 100 : itemTotal),
            total: itemTotal,
            splitMode: "equal", // default equal split
            assignedMembers: [...groupMembers], // default split to all
            memberQuantities: {}
          };
        });

        setItems(extractedItems);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Item modification helpers
  const handleItemFieldChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === "qty" || field === "price") {
        const q = Math.max(1, Number(field === "qty" ? value : item.qty) || 1);
        const p = Number(field === "price" ? value : item.price) || 0;
        item.qty = q;
        item.price = p;
        item.total = Math.round(q * p * 100) / 100;
      }
      next[index] = item;
      return next;
    });
  };

  const handleAddItem = () => {
    const newItem = {
      id: `item_${Date.now()}_${items.length}`,
      name: "New Item",
      qty: 1,
      price: 100,
      total: 100,
      splitMode: "equal",
      assignedMembers: [...groupMembers],
      memberQuantities: {}
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleDeleteItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Global action: Split all items to everyone
  const handleSplitAllItemsToEveryone = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        splitMode: "equal",
        assignedMembers: [...groupMembers],
        memberQuantities: {}
      }))
    );
  };

  // Toggle mode for a single item (equal vs qty)
  const setItemSplitMode = (itemIndex, mode) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[itemIndex], splitMode: mode };

      if (mode === "qty" && (!item.memberQuantities || Object.keys(item.memberQuantities).length === 0)) {
        // Initialize memberQuantities: if single member or previously assigned, distribute
        const initialQtyMap = {};
        groupMembers.forEach((m) => {
          initialQtyMap[m] = 0;
        });
        // Default to assigning 1 to paidBy or first member if qty is 1, or leave 0 for manual assignment
        if (groupMembers.length > 0) {
          initialQtyMap[paidBy || groupMembers[0]] = Math.min(item.qty, 1);
        }
        item.memberQuantities = initialQtyMap;
      }

      next[itemIndex] = item;
      return next;
    });
  };

  // Assign / Unassign member in 'equal' mode
  const toggleMemberInEqualMode = (itemIndex, member) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[itemIndex] };
      const current = item.assignedMembers || [];
      item.assignedMembers = current.includes(member)
        ? current.filter((m) => m !== member)
        : [...current, member];
      next[itemIndex] = item;
      return next;
    });
  };

  const setAllMembersForItem = (itemIndex) => {
    setItems((prev) => {
      const next = [...prev];
      next[itemIndex] = {
        ...next[itemIndex],
        splitMode: "equal",
        assignedMembers: [...groupMembers]
      };
      return next;
    });
  };

  // Change quantity allocated to a specific member in 'qty' mode
  const handleMemberQtyChange = (itemIndex, member, newQty) => {
    const validQty = Math.max(0, Number(newQty) || 0);
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[itemIndex] };
      const qtyMap = { ...(item.memberQuantities || {}) };
      qtyMap[member] = validQty;
      item.memberQuantities = qtyMap;
      next[itemIndex] = item;
      return next;
    });
  };

  const adjustMemberQtyStep = (itemIndex, member, delta) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[itemIndex] };
      const qtyMap = { ...(item.memberQuantities || {}) };
      const current = Number(qtyMap[member]) || 0;
      const updated = Math.max(0, current + delta);
      qtyMap[member] = updated;
      item.memberQuantities = qtyMap;
      next[itemIndex] = item;
      return next;
    });
  };

  // Helper to distribute remaining unassigned qty equally in 'qty' mode
  const handleDistributeRemainingQty = (itemIndex) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[itemIndex] };
      const qtyMap = { ...(item.memberQuantities || {}) };
      const totalAssigned = Object.values(qtyMap).reduce((sum, v) => sum + (Number(v) || 0), 0);
      const remaining = Math.max(0, item.qty - totalAssigned);

      if (remaining > 0 && groupMembers.length > 0) {
        const perPerson = Math.round((remaining / groupMembers.length) * 100) / 100;
        groupMembers.forEach((m) => {
          qtyMap[m] = Math.round(((Number(qtyMap[m]) || 0) + perPerson) * 100) / 100;
        });
        item.memberQuantities = qtyMap;
      }
      next[itemIndex] = item;
      return next;
    });
  };

  // ==========================================
  // MATHEMATICAL CALCULATIONS & BREAKDOWN
  // ==========================================
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const netCommonCharges = Number(tax || 0) + Number(serviceCharge || 0) + Number(extraCharges || 0) - Number(discount || 0);
  const grandTotal = Math.max(0, subtotal + netCommonCharges);

  // 1. Calculate base item cost per member
  const memberItemSubtotals = {};
  const memberItemSummaries = {}; // for visual itemized explanation
  groupMembers.forEach((m) => {
    memberItemSubtotals[m] = 0;
    memberItemSummaries[m] = [];
  });

  items.forEach((item) => {
    const itemTotal = Number(item.total) || 0;
    const itemPrice = Number(item.price) || 0;

    if (item.splitMode === "qty") {
      // Quantity-based calculation
      const qtyMap = item.memberQuantities || {};
      const totalAllocatedQty = Object.values(qtyMap).reduce((sum, q) => sum + (Number(q) || 0), 0);

      groupMembers.forEach((m) => {
        const userQty = Number(qtyMap[m]) || 0;
        if (userQty > 0) {
          // If total allocated matches or user specified, calculate by unit price
          let userItemCost = 0;
          if (totalAllocatedQty > 0 && totalAllocatedQty !== item.qty) {
            // Scale proportionally to item line total if allocated qty doesn't match total qty
            userItemCost = (userQty / totalAllocatedQty) * itemTotal;
          } else {
            userItemCost = userQty * itemPrice;
          }

          memberItemSubtotals[m] = (memberItemSubtotals[m] || 0) + userItemCost;
          memberItemSummaries[m].push(`${userQty}x ${item.name} (₹${Math.round(userItemCost)})`);
        }
      });
    } else {
      // Equal split among assigned members
      const assigned = item.assignedMembers && item.assignedMembers.length > 0 ? item.assignedMembers : groupMembers;
      if (assigned.length > 0) {
        const perPersonCost = itemTotal / assigned.length;
        assigned.forEach((m) => {
          if (groupMembers.includes(m)) {
            memberItemSubtotals[m] = (memberItemSubtotals[m] || 0) + perPersonCost;
            const fraction = assigned.length === groupMembers.length ? "All" : `1/${assigned.length}`;
            memberItemSummaries[m].push(`${item.name} [${fraction}] (₹${Math.round(perPersonCost)})`);
          }
        });
      }
    }
  });

  // Identify participating members (who have non-zero item share)
  const activeParticipants = groupMembers.filter((m) => (memberItemSubtotals[m] || 0) > 0.001);
  const participantCount = activeParticipants.length > 0 ? activeParticipants.length : groupMembers.length;

  // 2. Allocate Common Taxes, Surcharges & Fees
  const memberTaxShares = {};
  const memberFinalTotals = {};

  groupMembers.forEach((m) => {
    const personItemSubtotal = memberItemSubtotals[m] || 0;
    let personTaxShare = 0;

    if (netCommonCharges !== 0) {
      if (commonSplitMode === "equal") {
        // Equal split among active participants
        if (activeParticipants.includes(m) || activeParticipants.length === 0) {
          personTaxShare = netCommonCharges / participantCount;
        }
      } else {
        // Proportional to item subtotal (Fair Split)
        if (subtotal > 0 && personItemSubtotal > 0) {
          personTaxShare = (personItemSubtotal / subtotal) * netCommonCharges;
        }
      }
    }

    memberTaxShares[m] = personTaxShare;
    memberFinalTotals[m] = Math.max(0, Math.round((personItemSubtotal + personTaxShare) * 100) / 100);
  });

  // Final submit handler
  const handleSaveToGroup = () => {
    if (items.length === 0 || grandTotal <= 0) return;

    const involvedMembers = groupMembers.filter((m) => (memberFinalTotals[m] || 0) > 0.01);

    const expensePayload = {
      title: merchant.trim() || "Uploaded Bill",
      amount: Math.round(grandTotal * 100) / 100,
      paidBy: paidBy,
      category: category,
      splitBetween: involvedMembers.length > 0 ? involvedMembers : groupMembers,
      items: items,
      memberShares: memberFinalTotals,
      tax: tax,
      serviceCharge: serviceCharge,
      extraCharges: extraCharges - discount
    };

    onApplyExpense(expensePayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#09090b]/75 backdrop-blur-md animate-fadeIn">
      <div className="bharpai-card max-w-3xl w-full p-4 sm:p-6 relative bg-white border border-[#e4e4e7] shadow-2xl max-h-[94vh] flex flex-col rounded-3xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#71717a] hover:text-[#09090b] p-1.5 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#e4e4e7] shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-[#09090b] text-white flex items-center justify-center shadow-md">
            <Receipt className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-[#09090b]">
              Upload & Itemize Bill
            </h3>
            <p className="text-xs text-[#71717a]">
              Smart bill splitting with per-item quantity assignments and common taxes/surcharges.
            </p>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* STEP 1: Upload Image Box (If no items parsed yet) */}
          {!parsedData ? (
            <div className="space-y-4 py-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#e4e4e7] hover:border-[#09090b] transition-all rounded-3xl p-10 text-center cursor-pointer bg-[#fcfcfd] group flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-16 h-16 rounded-3xl bg-zinc-100 group-hover:bg-zinc-200 transition-colors flex items-center justify-center text-zinc-800 shadow-inner">
                  {isUploading ? (
                    <div className="w-7 h-7 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-zinc-700" />
                  )}
                </div>
                <div>
                  <div className="text-base font-bold font-display text-[#09090b]">
                    {isUploading ? uploadStatus : "Click or drag to upload Bill Image"}
                  </div>
                  <div className="text-xs text-[#71717a] mt-1 font-mono">
                    {isUploading ? "AI is recognizing items, quantities & prices..." : "Supports PNG, JPG, JPEG, WEBP receipts"}
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-600 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Interactive Itemized Table & Member Quantities */
            <div className="space-y-5">
              {/* Bill Header Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#f4f4f5] border border-[#e4e4e7]">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#71717a] mb-1 font-mono">
                    Merchant / Place
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="bharpai-input w-full px-2.5 py-1.5 text-xs font-bold"
                    placeholder="e.g. Toit Brewpub"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#71717a] mb-1 font-mono">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bharpai-input w-full px-2 py-1.5 text-xs bg-white"
                  >
                    <option value="Food">🍽️ Food & Drinks</option>
                    <option value="Stay">🏨 Hotel / Stay</option>
                    <option value="Transport">🚗 Travel & Cabs</option>
                    <option value="Groceries">🛒 Groceries</option>
                    <option value="Activities">🎟️ Fun & Activities</option>
                    <option value="Utilities">💡 Utilities / Bills</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#71717a] mb-1 font-mono">
                    Who Paid Upfront?
                  </label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="bharpai-input w-full px-2 py-1.5 text-xs bg-white font-semibold"
                  >
                    {groupMembers.map((m) => (
                      <option key={m} value={m}>
                        {m} {m === currentUser ? "(You)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Header & Global Split Options */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-display text-[#09090b] uppercase tracking-wider">
                      Itemized Items ({items.length})
                    </span>
                    <span className="text-[11px] font-mono text-[#71717a]">
                      Subtotal: ₹{subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSplitAllItemsToEveryone}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-zinc-200"
                      title="Set all items to equal split among all members"
                    >
                      <Users className="w-3 h-3" />
                      <span>Split All to Everyone</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const isQtyMode = item.splitMode === "qty";
                    const assignedList = item.assignedMembers || [];
                    const qtyMap = item.memberQuantities || {};
                    const totalAssignedQty = Object.values(qtyMap).reduce(
                      (sum, v) => sum + (Number(v) || 0),
                      0
                    );
                    const unassignedQty = Math.max(0, item.qty - totalAssignedQty);

                    return (
                      <div
                        key={item.id || idx}
                        className="p-3.5 rounded-2xl border border-[#e4e4e7] bg-[#fcfcfd] hover:border-zinc-300 transition-all space-y-3 shadow-xs"
                      >
                        {/* Item Info Line */}
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemFieldChange(idx, "name", e.target.value)}
                            placeholder="Item name"
                            className="bharpai-input flex-1 min-w-[130px] px-2.5 py-1.5 text-xs font-semibold text-[#09090b]"
                          />

                          <div className="flex items-center gap-1.5">
                            {/* Quantity Input */}
                            <div className="flex items-center bg-white border border-[#e4e4e7] rounded-lg px-1.5 py-0.5">
                              <span className="text-[10px] text-zinc-400 font-mono mr-1">Qty:</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.qty}
                                onChange={(e) => handleItemFieldChange(idx, "qty", e.target.value)}
                                className="w-10 text-xs text-center font-mono font-bold focus:outline-none bg-transparent"
                              />
                            </div>

                            {/* Unit Price */}
                            <div className="flex items-center bg-white border border-[#e4e4e7] rounded-lg px-2 py-0.5">
                              <span className="text-[10px] text-zinc-400 font-mono mr-1">₹/unit:</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.price}
                                onChange={(e) => handleItemFieldChange(idx, "price", e.target.value)}
                                className="w-16 text-xs text-right font-mono focus:outline-none bg-transparent"
                              />
                            </div>

                            {/* Line Total */}
                            <div className="min-w-[68px] text-right text-xs font-black font-mono text-[#09090b] px-1">
                              ₹{(Number(item.total) || 0).toLocaleString()}
                            </div>

                            {/* Delete Item */}
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(idx)}
                              className="text-zinc-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Splitting Mode Toggle Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-zinc-200/60">
                          {/* Mode Switcher */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-[#71717a] font-bold uppercase">
                              Split by:
                            </span>
                            <div className="flex items-center bg-zinc-200/60 p-0.5 rounded-lg text-[10px] font-semibold">
                              <button
                                type="button"
                                onClick={() => setItemSplitMode(idx, "equal")}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  !isQtyMode
                                    ? "bg-white text-[#09090b] shadow-xs font-bold"
                                    : "text-zinc-600 hover:text-zinc-900"
                                }`}
                              >
                                Split to All / Equal
                              </button>
                              <button
                                type="button"
                                onClick={() => setItemSplitMode(idx, "qty")}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                  isQtyMode
                                    ? "bg-white text-[#09090b] shadow-xs font-bold"
                                    : "text-zinc-600 hover:text-zinc-900"
                                }`}
                              >
                                <Sliders className="w-2.5 h-2.5 text-indigo-500" />
                                <span>Assign Quantities</span>
                              </button>
                            </div>
                          </div>

                          {/* Quick shortcuts / Status */}
                          {!isQtyMode ? (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <button
                                type="button"
                                onClick={() => setAllMembersForItem(idx)}
                                className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                              >
                                Split to All ({groupMembers.length})
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[10px] font-mono">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold ${
                                  unassignedQty === 0
                                    ? "bg-emerald-100 text-emerald-800"
                                    : totalAssignedQty > item.qty
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-zinc-100 text-zinc-700"
                                }`}
                              >
                                Assigned: {totalAssignedQty} / {item.qty}
                              </span>
                              {unassignedQty > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleDistributeRemainingQty(idx)}
                                  className="text-emerald-700 hover:text-emerald-900 underline font-semibold cursor-pointer"
                                >
                                  Distribute rest ({unassignedQty}) equally
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* MODE 1: Equal Split Member Selection Pills */}
                        {!isQtyMode && (
                          <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
                            {groupMembers.map((m) => {
                              const isAssigned = assignedList.includes(m);
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => toggleMemberInEqualMode(idx, m)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                                    isAssigned
                                      ? "bg-[#09090b] text-white border-[#09090b] shadow-xs"
                                      : "bg-white text-[#71717a] border-[#e4e4e7] hover:border-zinc-400"
                                  }`}
                                >
                                  <span>{m.split(" ")[0]}</span>
                                  {isAssigned && <Check className="w-3 h-3 text-emerald-400" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* MODE 2: Per-Person Quantity Assignment Steppers */}
                        {isQtyMode && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                            {groupMembers.map((m) => {
                              const userQty = Number(qtyMap[m]) || 0;
                              const userCost = Math.round(userQty * (item.price || 0));

                              return (
                                <div
                                  key={m}
                                  className={`p-2 rounded-xl border transition-all ${
                                    userQty > 0
                                      ? "bg-indigo-50/50 border-indigo-200"
                                      : "bg-white border-zinc-200/80 opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-900 mb-1">
                                    <span className="truncate">{m.split(" ")[0]}</span>
                                    <span className="font-mono text-[10px] text-zinc-500">
                                      {userQty > 0 ? `₹${userCost}` : "—"}
                                    </span>
                                  </div>

                                  {/* Stepper Controls */}
                                  <div className="flex items-center justify-between bg-white rounded-lg border border-zinc-200 p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => adjustMemberQtyStep(idx, m, -1)}
                                      disabled={userQty <= 0}
                                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>

                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={userQty}
                                      onChange={(e) => handleMemberQtyChange(idx, m, e.target.value)}
                                      className="w-10 text-xs text-center font-mono font-bold focus:outline-none"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => adjustMemberQtyStep(idx, m, 1)}
                                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-600 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Common Taxes, Surcharges & Extra Fees (Shared for all items) */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-[#e4e4e7] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-display text-zinc-900 uppercase tracking-wider">
                      Common Taxes & Surcharges
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">(Common to all)</span>
                  </div>

                  {/* Common Charges Allocation Mode */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-[10px] font-mono text-zinc-500 font-semibold">Distribution:</span>
                    <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg text-[10px]">
                      <button
                        type="button"
                        onClick={() => setCommonSplitMode("proportional")}
                        className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-all ${
                          commonSplitMode === "proportional"
                            ? "bg-white text-zinc-900 shadow-xs font-bold"
                            : "text-zinc-600 hover:text-zinc-900"
                        }`}
                        title="Taxes & surcharges are shared in proportion to what each person ordered"
                      >
                        Proportional (Fair)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommonSplitMode("equal")}
                        className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-all ${
                          commonSplitMode === "equal"
                            ? "bg-white text-zinc-900 shadow-xs font-bold"
                            : "text-zinc-600 hover:text-zinc-900"
                        }`}
                        title="Taxes & surcharges are divided equally among active participants"
                      >
                        Equal Split
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#71717a] mb-1 font-mono">
                      GST / Tax (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tax}
                      onChange={(e) => setTax(Number(e.target.value) || 0)}
                      className="bharpai-input w-full px-2.5 py-1.5 text-xs font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#71717a] mb-1 font-mono">
                      Service Charge / Tip (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(Number(e.target.value) || 0)}
                      className="bharpai-input w-full px-2.5 py-1.5 text-xs font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#71717a] mb-1 font-mono">
                      Delivery / Surcharges (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={extraCharges}
                      onChange={(e) => setExtraCharges(Number(e.target.value) || 0)}
                      className="bharpai-input w-full px-2.5 py-1.5 text-xs font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-emerald-600 mb-1 font-mono">
                      Discount / Coupon (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="bharpai-input w-full px-2.5 py-1.5 text-xs font-mono text-emerald-600"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Live Per-Person Final Split Breakdown */}
              <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-3 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold font-display uppercase tracking-wider text-zinc-200">
                      Live Member Breakdown
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 uppercase font-mono mr-1.5">Grand Total:</span>
                    <span className="text-base font-black font-mono text-emerald-400">
                      ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Member Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {groupMembers.map((m) => {
                    const itemShare = memberItemSubtotals[m] || 0;
                    const taxShare = memberTaxShares[m] || 0;
                    const finalTotal = memberFinalTotals[m] || 0;
                    const isPayer = m === paidBy;

                    return (
                      <div
                        key={m}
                        className={`p-2.5 rounded-xl border transition-all ${
                          finalTotal > 0
                            ? "bg-zinc-800/80 border-zinc-700/80"
                            : "bg-zinc-900/40 border-zinc-800/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-bold text-white truncate">
                              {m}
                            </span>
                            {isPayer && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                                Paid
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-black font-mono text-white">
                            ₹{Math.round(finalTotal).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-700/50">
                          <span>Items: ₹{Math.round(itemShare).toLocaleString()}</span>
                          <span>Tax/Fees: ₹{Math.round(taxShare).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="py-2.5 px-4 rounded-2xl text-xs font-semibold text-[#71717a] border border-[#e4e4e7] hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Upload Another Bill
                </button>

                <button
                  type="button"
                  onClick={handleSaveToGroup}
                  className="flex-1 py-2.5 px-5 rounded-2xl font-bold text-white bg-[#09090b] hover:bg-[#18181b] flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all text-xs"
                >
                  <span>Apply & Add Bill to Group</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
