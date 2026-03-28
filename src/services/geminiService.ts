import { GoogleGenAI } from "@google/genai";

export const generatePlumbingImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K") => {
  try {
    // Use selected key if available, otherwise fallback to default
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });
    
    // Use gemini-2.5-flash-image by default as it's more reliable and often free
    // Only use 3.1 if specifically needed for high-res or search features
    const modelName = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model");
  } catch (error: any) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const getNearbyPlumbingInfo = async (lat: number, lng: number) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "What are the most common plumbing issues in Thoothukudi, Tamil Nadu, and where are the nearest hardware stores?",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching maps data:", error);
    return "Could not fetch local plumbing data.";
  }
};
