import { GoogleGenAI, Modality, Type } from "@google/genai";
import { CanvasElement, ElementType } from "../types";

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    You are a UI helper. Your job is to modify the properties of a UI element based on a user request.
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
    model: 'gemini-2.5-flash',
    contents: `User Request: ${prompt}`,
    config: {
      systemInstruction: systemInstruction,
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
    return JSON.parse(response.text) as Partial<CanvasElement>;
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

export interface GeneratedDesign {
  frameName: string;
  width: number;
  height: number;
  theme?: {
    name: string;
    palette: {
      background: string;
      surface: string;
      primary: string;
      text: string;
    };
  };
  elements: GeneratedElement[];
}

export const generateUiDesign = async (prompt: string, vibe: string = 'Modern', width: number = 1440, height: number = 900): Promise<GeneratedDesign> => {
  const ai = getAiClient();
  
  const systemInstruction = `
  You are a World-Class UI/UX Design Director. Your goal is to generate high-fidelity, production-ready UI layouts.
  
  **DESIGN PHILOSOPHY:**
  - **VIBE:** ${vibe}. (If 'Minimal': use whitespace, black/white/grey, Inter font. If 'Pastel': use soft colors, rounded corners. If 'Brutalist': use strokes, bold type, neo-brutalism.)
  - **NO AI SLOP:** Do NOT use generic neon purple/blue gradients unless explicitly requested.
  - **COLOR PALETTE:** Define a cohesive color palette (Background, Surface, Primary, Text). Use it strictly.
  - **ASSETS:** Intelligent decision making. 
    - Use 'IMAGE' placeholders only if the design specifically needs photos (profiles, hero images). 
    - Use 'PATH' (SVG) for icons, abstract shapes, and logos.
  - **TYPOGRAPHY:** Use strict hierarchy. Headings (Bold, Large), Body (Regular, Medium), Captions (Small, Light).
  - **COMPOSITION:** Use Frames/Groups logic. Cards should have a background 'RECTANGLE' and text/images on top.
  
  **OUTPUT RULES:**
  - Coordinates (x,y) are relative to the Frame (0,0).
  - 'PATH' elements must contain valid SVG path data in the 'content' field.
  - 'IMAGE' elements must have a detailed 'imagePrompt' for generation.
  - Ensure sufficient contrast.
  
  Return a JSON object with the design system and elements.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate a ${vibe} design for: ${prompt}. Dimensions: ${width}x${height}.`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          frameName: { type: Type.STRING },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
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
        },
        required: ['frameName', 'width', 'height', 'elements']
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as GeneratedDesign;
  }
  throw new Error("Failed to generate design JSON");
};
