import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData, ReceiptItem, ImageFile } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants for Models
const MODEL_NAME = 'gemini-3-pro-preview';

/**
 * Parses receipt image(s) to extract items, prices, and totals.
 */
export const parseReceiptImage = async (images: ImageFile[]): Promise<ReceiptData> => {
  try {
    const imageParts = images.map(img => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType,
      },
    }));

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          ...imageParts,
          {
            text: `Analyze these receipt images. If there are multiple images, treat them as a single receipt spanning multiple pages.
            Extract all line items with their prices. Also extract the tax, tip (if explicitly listed), and total.
            If tip is not listed, set it to 0. 
            Return a valid JSON object matching the schema.
            Ensure 'price' is a number. 
            Assign a unique string ID to each item (e.g., 'item-1', 'item-2').
            Initialize 'assignees' as an empty array for all items.
            Detect the currency symbol or code (e.g., "$", "€", "GBP") and return it in the 'currency' field. Default to "$" if unknown.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  assignees: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["id", "name", "price", "assignees"],
              },
            },
            subtotal: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            tip: { type: Type.NUMBER },
            total: { type: Type.NUMBER },
            currency: { type: Type.STRING },
          },
          required: ["items", "subtotal", "tax", "tip", "total", "currency"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response from Gemini.");
    }

    return JSON.parse(response.text) as ReceiptData;
  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
};

/**
 * Updates the assignment of items based on natural language user input.
 */
export const updateAssignments = async (
  currentData: ReceiptData,
  userPrompt: string
): Promise<{ updatedItems: ReceiptItem[]; aiResponseText: string }> => {
  
  // We send the current state of items to the model so it knows the context.
  const itemsContext = JSON.stringify(currentData.items.map(i => ({
    id: i.id,
    name: i.name,
    price: i.price,
    assignees: i.assignees
  })));

  const systemPrompt = `
    You are a helpful bill splitting assistant.
    Your goal is to update the 'assignees' list for receipt items based on the user's chat message.
    
    Current Items Context: ${itemsContext}
    
    Rules:
    1. If the user says "Dave had the burger", find the item "burger" (fuzzy match) and ADD "Dave" to its assignees.
    2. If the user says "Sarah and Mike shared the pizza", ADD both "Sarah" and "Mike" to the pizza's assignees.
    3. If the user says "Remove Dave from burger", remove him.
    4. If the user refers to "everything" or "all drinks", try to infer based on item names.
    5. Maintain existing assignees unless explicitly asked to change or remove them.
    6. Return the FULL updated list of items in the 'updatedItems' field.
    7. Also provide a short, friendly 'message' confirming what you did (e.g., "Okay, I've split the pizza between Sarah and Mike.").
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            updatedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  assignees: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["id", "name", "price", "assignees"],
              },
            },
            message: { type: Type.STRING },
          },
          required: ["updatedItems", "message"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response from Gemini.");
    }

    const result = JSON.parse(response.text);
    return {
      updatedItems: result.updatedItems,
      aiResponseText: result.message,
    };

  } catch (error) {
    console.error("Error processing split command:", error);
    throw error;
  }
};

/**
 * Gets the current exchange rate between two currencies using Gemini with Google Search.
 */
export const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number> => {
  if (fromCurrency === toCurrency) return 1;

  const prompt = `What is the current exchange rate to convert 1 ${fromCurrency} to ${toCurrency}? Return ONLY the numeric exchange rate.`;
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) throw new Error("Could not retrieve exchange rate");

    // Extract the first number from the response
    const match = text.match(/[\d.]+/);
    if (match) {
      return parseFloat(match[0]);
    }
    return 1;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 1; // Fallback
  }
};