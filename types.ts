
export enum ElementType {
  FRAME = 'FRAME',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  PATH = 'PATH', // For SVG vectors
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string; // For paths/shapes
  content?: string; // text, image url, or SVG path data
  rotation: number;
  opacity: number;
  borderRadius: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  locked?: boolean;
  // Effects
  shadow?: {
    x: number;
    y: number;
    blur: number;
    color: string;
  };
  blur?: number; // Layer blur in px
  noise?: number; // Noise opacity 0-1
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  
  interface Window {
    aistudio?: AIStudio;
  }
}