
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { CanvasElement, ElementType } from "../types";

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to parse JSON that might be wrapped in markdown code blocks or text
 */
const cleanAndParseJson = (text: string) => {
  let cleaned = text.trim();
  
  // Locate the first '{' and last '}' to handle any preamble text or markdown
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON:", cleaned);
    throw new Error("Invalid JSON response from AI");
  }
};

/**
 * AI Chatbot using gemini-3-pro-preview
 */
export const chatWithGemini = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string
): Promise<string> => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "I couldn't generate a response.";
};

/**
 * Analyze Image
 */
export const analyzeImage = async (base64Image: string): Promise<string> => {
  const ai = getAiClient();
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: "Analyze this image in detail. Describe the visual elements, style, and any text present." },
        { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
      ]
    }
  });

  return response.text || "Analysis failed.";
};

/**
 * Edit Image
 */
export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = getAiClient();
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
      ]
    },
    config: {
      responseModalities: [Modality.IMAGE]
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image generated");
};

/**
 * Modify Canvas Element Properties using AI
 */
export const modifyCanvasElement = async (element: CanvasElement, prompt: string): Promise<Partial<CanvasElement>> => {
  const ai = getAiClient();
  
  const systemInstruction = `
    You are a UI Design Expert. Your job is to modify the properties of a UI element based on a user request.
    Use 'gemini-3-pro-preview' reasoning to ensure the modification fits standard design patterns.
    Return ONLY the JSON properties that need to change.
    
    Current Element JSON: ${JSON.stringify(element)}
    
    Available changes:
    - fill (hex color)
    - width, height, x, y (numbers)
    - borderRadius (number)
    - fontSize, fontWeight, fontFamily (if text)
    - content (if text)
    - opacity (0-1)
    
    Example: User says "Make it a red circle", you return { "type": "CIRCLE", "fill": "#ff0000", "borderRadius": 50 }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `User Request: ${prompt}`,
    config: {
      systemInstruction: systemInstruction,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 1024 },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fill: { type: Type.STRING },
          stroke: { type: Type.STRING },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
          borderRadius: { type: Type.NUMBER },
          fontSize: { type: Type.NUMBER },
          fontWeight: { type: Type.STRING },
          content: { type: Type.STRING },
          opacity: { type: Type.NUMBER }
        }
      }
    }
  });

  if (response.text) {
    return cleanAndParseJson(response.text) as Partial<CanvasElement>;
  }
  throw new Error("Failed to modify element");
};

/**
 * Generate Image Asset (High Quality)
 */
export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: '1:1',
      outputMimeType: 'image/jpeg'
    }
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (imageBytes) {
    return `data:image/jpeg;base64,${imageBytes}`;
  }
  throw new Error("Image generation failed");
};

/**
 * Generate Video using Veo
 */
export const generateVideo = async (base64Image: string, prompt: string): Promise<string> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt || "Animate this image naturally",
    image: {
      imageBytes: cleanBase64,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed: No URI");

  const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const videoBlob = await videoRes.blob();
  return URL.createObjectURL(videoBlob);
};

/**
 * Generate UI Design Layout
 */
export interface GeneratedElement {
  type: 'RECTANGLE' | 'CIRCLE' | 'TEXT' | 'PATH' | 'IMAGE';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  content?: string;
  fontSize?: number;
  borderRadius?: number;
  fontFamily?: string;
  fontWeight?: string;
  opacity?: number;
  imagePrompt?: string; // For generating images later
}

export interface GeneratedScreen {
  frameName: string;
  width: number;
  height: number;
  elements: GeneratedElement[];
}

export interface GeneratedDesignResponse {
  theme?: {
    name: string;
    palette: {
      background: string;
      surface: string;
      primary: string;
      text: string;
    };
  };
  screens: GeneratedScreen[];
}

export const generateUiDesign = async (prompt: string, vibe: string = 'Modern'): Promise<GeneratedDesignResponse> => {
  const ai = getAiClient();
  
  const systemInstruction = `
  You are a World-Class Senior Product Designer. Your goal is to generate high-fidelity, production-ready UI layouts.
  
  **DESIGN PHILOSOPHY:**
  - **AVOID AI SLOP:** Do not create generic, flat, "default" looking designs. No generic purple/blue neon unless asked.
  - **VIBE:** ${vibe}.
  - **LAYOUT:** Use asymmetric balances, interesting whitespace, and sophisticated grid systems (e.g., Bento grids).
  - **TYPOGRAPHY:** Use strong typographic hierarchy. Vary font sizes (Display vs Body), weights, and opacity (Text-primary vs Text-secondary).
  - **INTERACTIVITY:** Visually suggest interactivity (buttons, inputs, hover states).
  - **THINKING:** Use your thinking budget to calculate exact pixel dimensions to ensure elements fit and are aligned perfectly.
  - **MULTI-SCREEN:** If the prompt implies a flow (e.g., "Login and Dashboard"), generate multiple screens in the 'screens' array.
  
  **VISUALS:**
  - **Palette:** Generate a cohesive, professional color palette (Swiss, Monochrome, Pastel, or Deep Dark Mode).
  - **Shapes:** Use 'RECTANGLE' with different borderRadius for buttons, cards, and inputs.
  - **Images:** Use 'IMAGE' type with a descriptive 'imagePrompt' for areas that need high-quality photos.
  - **Vectors:** Use 'PATH' for icons or abstract decorative elements.
  
  **OUTPUT:**
  - Return a JSON object with 'theme' and 'screens'.
  - Coordinates (x,y) are relative to the screen frame.
  `;

  const contents = [
      { text: `Generate a ${vibe} design for: ${prompt}.` }
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      maxOutputTokens: 65536, 
      thinkingConfig: { thinkingBudget: 2048 },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          theme: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              palette: {
                type: Type.OBJECT,
                properties: {
                  background: { type: Type.STRING },
                  surface: { type: Type.STRING },
                  primary: { type: Type.STRING },
                  text: { type: Type.STRING }
                }
              }
            }
          },
          screens: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    frameName: { type: Type.STRING },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                    elements: {
                        type: Type.ARRAY,
                        items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['RECTANGLE', 'CIRCLE', 'TEXT', 'PATH', 'IMAGE'] },
                            name: { type: Type.STRING },
                            x: { type: Type.NUMBER },
                            y: { type: Type.NUMBER },
                            width: { type: Type.NUMBER },
                            height: { type: Type.NUMBER },
                            fill: { type: Type.STRING },
                            stroke: { type: Type.STRING },
                            content: { type: Type.STRING, description: "Text content or SVG path data" },
                            imagePrompt: { type: Type.STRING, description: "Prompt to generate high quality image if type is IMAGE" },
                            fontSize: { type: Type.NUMBER },
                            borderRadius: { type: Type.NUMBER },
                            fontFamily: { type: Type.STRING },
                            fontWeight: { type: Type.STRING },
                            opacity: { type: Type.NUMBER }
                        },
                        required: ['type', 'x', 'y', 'width', 'height', 'fill']
                        }
                    }
                }
            }
          }
        },
        required: ['screens', 'theme']
      }
    }
  });

  if (response.text) {
    return cleanAndParseJson(response.text) as GeneratedDesignResponse;
  }
  throw new Error("Failed to generate design JSON");
};
