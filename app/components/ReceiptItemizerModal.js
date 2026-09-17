"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  X,
  Plus,
  Trash2,
  Users,
  Check,
  AlertCircle,
  Receipt,
  Sparkles,
  ArrowRight,
  DollarSign,
  Image as ImageIcon
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
  const [items, setItems] = useState([]);
  const [tax, setTax] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [paidBy, setPaidBy] = useState(currentUser || groupMembers[0] || "Aniketh Reddy");
  // Track member assignments per item: { [itemIndex]: ["Aniketh Reddy", "Varun"] }
  const [itemAssignments, setItemAssignments] = useState({});
  const [uploadStatus, setUploadStatus] = useState("Extracting items from bill image...");

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Client-side image optimization to make upload & OCR lightning fast (< 1s)
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

        const extractedItems = (r.items || []).map((item) => ({
          name: item.name || "Item",
          qty: Number(item.qty) || 1,
          price: Number(item.price) || 0,
          total: Number(item.total) || (Number(item.qty) || 1) * (Number(item.price) || 0)
        }));

        setItems(extractedItems);

        // Default: assign each item to all group members
        const initialAssignments = {};
        extractedItems.forEach((_, idx) => {
          initialAssignments[idx] = [...groupMembers];
        });
        setItemAssignments(initialAssignments);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Item modifications
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === "qty" || field === "price") {
        item.total = (Number(item.qty) || 0) * (Number(item.price) || 0);
      }
      next[index] = item;
      return next;
    });
  };

  const handleAddItem = () => {
    const newItemIndex = items.length;
    setItems((prev) => [...prev, { name: "New Item", qty: 1, price: 100, total: 100 }]);
    setItemAssignments((prev) => ({
      ...prev,
      [newItemIndex]: [...groupMembers]
    }));
  };

  const handleDeleteItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    const nextAssignments = {};
    let offset = 0;
    items.forEach((_, idx) => {
      if (idx !== index) {
        nextAssignments[offset] = itemAssignments[idx] || [...groupMembers];
        offset++;
      }
    });
    setItemAssignments(nextAssignments);
  };

  // Toggle member assignment for an item
  const toggleMemberForItem = (itemIdx, member) => {
    setItemAssignments((prev) => {
      const current = prev[itemIdx] || [];
      const updated = current.includes(member)
        ? current.filter((m) => m !== member)
        : [...current, member];
      return { ...prev, [itemIdx]: updated };
    });
  };

  // Select all / clear for a specific item
  const setAllMembersForItem = (itemIdx) => {
    setItemAssignments((prev) => ({
      ...prev,
      [itemIdx]: [...groupMembers]
    }));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const grandTotal = subtotal + Number(tax || 0) + Number(serviceCharge || 0);

  // Calculate per-member breakdown (item shares + proportional tax/tip)
  const memberTotals = {};
  groupMembers.forEach((m) => {
    memberTotals[m] = 0;
  });

  items.forEach((item, idx) => {
    const assigned = itemAssignments[idx] || [];
    if (assigned.length > 0) {
      const perPersonItem = (Number(item.total) || 0) / assigned.length;
      assigned.forEach((m) => {
        memberTotals[m] = (memberTotals[m] || 0) + perPersonItem;
      });
    }
  });

  // Proportional tax/service charge allocation
  if (subtotal > 0 && (tax > 0 || serviceCharge > 0)) {
    const extraRatio = (Number(tax || 0) + Number(serviceCharge || 0)) / subtotal;
    Object.keys(memberTotals).forEach((m) => {
      memberTotals[m] += memberTotals[m] * extraRatio;
    });
  }

  // Final submit handler
  const handleSaveToGroup = () => {
    if (items.length === 0 || grandTotal <= 0) return;

    // Collect all members who have a non-zero share
    const involvedMembers = Object.keys(memberTotals).filter(
      (m) => memberTotals[m] > 0.01
    );

    const expensePayload = {
      title: merchant.trim() || "Uploaded Bill",
      amount: Math.round(grandTotal * 100) / 100,
      paidBy: paidBy,
      category: category,
      splitBetween: involvedMembers.length > 0 ? involvedMembers : groupMembers,
      items: items,
      memberShares: memberTotals
    };

    onApplyExpense(expensePayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#09090b]/70 backdrop-blur-sm animate-fadeIn">
      <div className="bharpai-card max-w-2xl w-full p-5 sm:p-7 relative bg-white border border-[#e4e4e7] shadow-2xl max-h-[92vh] overflow-y-auto rounded-3xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#71717a] hover:text-[#09090b] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#e4e4e7]">
          <div className="w-9 h-9 rounded-xl bg-[#09090b] text-white flex items-center justify-center shadow-sm">
            <Receipt className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-[#09090b]">
              Upload & Itemize Bill Image
            </h3>
            <p className="text-xs text-[#71717a]">
              Upload a bill image (.png, .jpg, .webp) to extract items, qty & prices.
            </p>
          </div>
        </div>

        {/* STEP 1: Upload Image Box (If no items parsed yet or to replace image) */}
        {!parsedData ? (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#e4e4e7] hover:border-[#09090b] transition-all rounded-2xl p-8 text-center cursor-pointer bg-[#fcfcfd] group flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 group-hover:bg-zinc-200 transition-colors flex items-center justify-center text-zinc-800">
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold font-display text-[#09090b]">
                  {isUploading ? uploadStatus : "Click or drag to upload Bill Image"}
                </div>
                <div className="text-xs text-[#71717a] mt-1 font-mono">
                  {isUploading ? "Please wait a moment..." : "Supported formats: PNG, JPG, JPEG, WEBP"}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-600 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        ) : (
          /* STEP 2: Interactive Itemized Table & Member Assignment */
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

            {/* Extracted Item List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-display text-[#09090b] uppercase tracking-wider">
                  Itemized List ({items.length} items)
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const assigned = itemAssignments[idx] || [];
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-[#e4e4e7] bg-[#fcfcfd] space-y-2"
                    >
                      {/* Item Inputs Row */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                          placeholder="Item name"
                          className="bharpai-input flex-1 px-2.5 py-1.5 text-xs font-medium"
                        />
                        <div className="w-16">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                            placeholder="Qty"
                            className="bharpai-input w-full px-2 py-1.5 text-xs text-center font-mono"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                            placeholder="Unit Price"
                            className="bharpai-input w-full px-2 py-1.5 text-xs font-mono tabular-nums text-right"
                          />
                        </div>
                        <div className="w-20 text-right text-xs font-bold font-mono text-[#09090b]">
                          ₹{(Number(item.total) || 0).toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Who ate/shared this item selector */}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-[#71717a] text-[10px] font-mono">Split with:</span>
                        <div className="flex flex-wrap gap-1 items-center">
                          {groupMembers.map((m) => {
                            const isAssigned = assigned.includes(m);
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => toggleMemberForItem(idx, m)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer border ${
                                  isAssigned
                                    ? "bg-[#09090b] text-white border-[#09090b]"
                                    : "bg-white text-[#71717a] border-[#e4e4e7] hover:border-zinc-400"
                                }`}
                              >
                                {m.split(" ")[0]}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setAllMembersForItem(idx)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-900 underline ml-1 cursor-pointer font-mono"
                          >
                            All
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Taxes & Charges Row */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#e4e4e7]">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#71717a] mb-1 font-mono">
                  GST / Taxes (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
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
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(Number(e.target.value) || 0)}
                  className="bharpai-input w-full px-2.5 py-1.5 text-xs font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Live Per-Person Split Summary */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-[#e4e4e7] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-900">
                <span>Calculated Grand Total:</span>
                <span className="text-base font-black font-mono">
                  ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                {Object.entries(memberTotals).map(([m, share]) => (
                  <div key={m} className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-zinc-200/60 font-mono">
                    <span className="truncate text-zinc-600">{m.split(" ")[0]}:</span>
                    <span className="font-bold text-zinc-900">₹{Math.round(share).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setParsedData(null);
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[#71717a] border border-[#e4e4e7] hover:bg-zinc-100 cursor-pointer"
              >
                Upload Different Image
              </button>

              <button
                type="button"
                onClick={handleSaveToGroup}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-[#09090b] hover:bg-[#18181b] flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all text-xs"
              >
                <span>Add Scanned Bill to Group</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
