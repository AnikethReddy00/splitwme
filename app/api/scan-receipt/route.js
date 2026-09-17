import { NextResponse } from "next/server";
import Tesseract from "tesseract.js";
import { parseReceiptText } from "./ocr-parser.js";

// Cached persistent worker instance on globalThis for sub-second recognition in Next.js
const globalStore = globalThis;

async function getOcrWorker() {
  if (!globalStore._splitwmeOcrWorkerPromise) {
    globalStore._splitwmeOcrWorkerPromise = (async () => {
      const worker = await Tesseract.createWorker("eng");
      return worker;
    })().catch((err) => {
      globalStore._splitwmeOcrWorkerPromise = null;
      throw err;
    });
  }
  return globalStore._splitwmeOcrWorkerPromise;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "Please upload an image file (.png, .jpg, .jpeg, .webp)" },
        { status: 400 }
      );
    }

    // Verify it is strictly an image file
    const mimeType = file.type || "";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only image files (PNG, JPG, WEBP) are allowed." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // 1. Check for Groq Vision Key (Free tier available on groq.com - sub-second)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `You are an expert receipt OCR system. Extract the merchant name, date (YYYY-MM-DD), category (Food, Stay, Transport, Groceries, Activities, Utilities), itemized list of items with qty and unit price and line total, subtotal, tax, serviceCharge, and totalAmount. Output ONLY valid JSON matching this schema:
{"merchant":"string","date":"YYYY-MM-DD","category":"Food","items":[{"name":"string","qty":number,"price":number,"total":number}],"subtotal":number,"tax":number,"serviceCharge":number,"totalAmount":number}`
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType || "image/jpeg"};base64,${base64Image}`
                    }
                  }
                ]
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
          })
        });

        if (response.ok) {
          const aiData = await response.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          const parsed = JSON.parse(content);
          return NextResponse.json({ success: true, receipt: parsed, source: "groq-vision" });
        }
      } catch (err) {
        console.warn("Groq vision error, falling back to local OCR:", err);
      }
    }

    // 2. Check for Google Gemini Vision Key (100% Free on Google AI Studio)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "Extract receipt items, quantities, unit prices, line totals, merchant, date, tax, serviceCharge, and totalAmount. Output STRICT JSON only without markdown codeblocks: {\"merchant\":\"string\",\"date\":\"YYYY-MM-DD\",\"category\":\"Food\",\"items\":[{\"name\":\"string\",\"qty\":number,\"price\":number,\"total\":number}],\"subtotal\":number,\"tax\":number,\"serviceCharge\":number,\"totalAmount\":number}"
                    },
                    {
                      inlineData: {
                        mimeType: mimeType || "image/jpeg",
                        data: base64Image
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (response.ok) {
          const geminiData = await response.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanedText);
          return NextResponse.json({ success: true, receipt: parsed, source: "gemini-vision" });
        }
      } catch (err) {
        console.warn("Gemini vision error, falling back to local OCR:", err);
      }
    }

    // 3. Check for xAI / Grok Vision Key
    const xaiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    if (xaiKey) {
      try {
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${xaiKey}`
          },
          body: JSON.stringify({
            model: "grok-2-vision-1212",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert receipt & bill OCR parser. Analyze the uploaded receipt image and extract the merchant name, date, itemized list of items with quantities and unit prices, subtotal, taxes, and final total amount. Output STRICT JSON only."
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Extract all items and totals from this receipt. Return JSON:
{
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "category": "Food",
  "items": [
    { "name": "string", "qty": number, "price": number, "total": number }
  ],
  "subtotal": number,
  "tax": number,
  "serviceCharge": number,
  "totalAmount": number
}`
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType || "image/jpeg"};base64,${base64Image}`
                    }
                  }
                ]
              }
            ],
            temperature: 0.1
          })
        });

        if (response.ok) {
          const aiData = await response.json();
          const rawText = aiData.choices?.[0]?.message?.content || "";
          const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanedText);
          return NextResponse.json({ success: true, receipt: parsed, source: "grok-vision" });
        }
      } catch (err) {
        console.warn("Grok vision error, falling back to local OCR:", err);
      }
    }

    // 4. Default High-Speed Persistent Local OCR Engine (100% Free, zero keys, runs in ~500ms)
    let rawOcrText = "";
    try {
      const worker = await getOcrWorker();
      const ocrResult = await worker.recognize(buffer);
      rawOcrText = ocrResult?.data?.text || "";
    } catch (workerErr) {
      console.warn("Persistent worker error, falling back to one-shot:", workerErr);
      const fallbackResult = await Tesseract.recognize(buffer, "eng");
      rawOcrText = fallbackResult?.data?.text || "";
    }

    const parsedReceipt = parseReceiptText(rawOcrText);

    return NextResponse.json({
      success: true,
      receipt: parsedReceipt,
      source: "tesseract-ocr-local",
      message: "Receipt parsed successfully"
    });
  } catch (err) {
    console.error("Scan receipt error:", err);
    return NextResponse.json(
      { error: "Failed to process receipt image. Please try again." },
      { status: 500 }
    );
  }
}
