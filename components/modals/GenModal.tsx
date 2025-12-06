import React, { useState } from 'react';
import { MagicIcon, Spinner } from '../Icons';
import { generateUiDesign, GeneratedScreen, generateImage } from '../../services/geminiService';
import { CanvasElement, ElementType } from '../../types';

interface GenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (elements: CanvasElement[]) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  existingElements: CanvasElement[];
  onGeneratingChange: (isGenerating: boolean) => void;
  onStatusChange: (status: string) => void;
}

const GenModal: React.FC<GenModalProps> = ({ 
  isOpen, 
  onClose, 
  onGenerate, 
  onUpdateElement,
  existingElements,
  onGeneratingChange,
  onStatusChange
}) => {
  const [genPrompt, setGenPrompt] = useState('');
  const [genVibe, setGenVibe] = useState('Modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  const updateGenerating = (val: boolean) => {
    setIsGenerating(val);
    onGeneratingChange(val);
  };

  const updateStatus = (status: string) => {
    setGenStatus(status);
    onStatusChange(status);
  };

  const handleGenerateDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genPrompt.trim()) return;
    updateGenerating(true);
    updateStatus('Architecting layout...');

    try {
      const designResponse = await generateUiDesign(genPrompt, genVibe);
      
      if (!designResponse || !designResponse.screens || !Array.isArray(designResponse.screens)) {
        throw new Error("AI returned an incomplete design structure. Please try again.");
      }

      let currentXOffset = 100;
      if (existingElements.length > 0) {
        const maxElX = Math.max(...existingElements.map(e => e.x + e.width));
        currentXOffset = maxElX + 100;
      }

      const newElementsToAdd: CanvasElement[] = [];
      const generatedImageRefs: { id: string, prompt: string }[] = [];

      designResponse.screens.forEach((screen: GeneratedScreen) => {
        const frameId = crypto.randomUUID();
        const frameElement: CanvasElement = {
          id: frameId,
          type: ElementType.FRAME,
          name: screen.frameName || 'Generated Frame',
          x: currentXOffset,
          y: 100,
          width: screen.width,
          height: screen.height,
          fill: designResponse.theme?.palette.background || '#0f0f0f',
          rotation: 0,
          opacity: 1,
          borderRadius: 0,
        };
        newElementsToAdd.push(frameElement);

        if (screen.elements && Array.isArray(screen.elements)) {
          screen.elements.forEach((el) => {
            const childId = crypto.randomUUID();
            newElementsToAdd.push({
              id: childId,
              type: el.type as ElementType,
              name: el.name,
              x: currentXOffset + el.x,
              y: 100 + el.y,
              width: el.width,
              height: el.height,
              fill: el.fill || '#ffffff',
              stroke: el.stroke,
              content: el.content,
              fontSize: el.fontSize,
              borderRadius: el.borderRadius || 0,
              fontFamily: el.fontFamily || 'Inter, sans-serif',
              fontWeight: el.fontWeight,
              rotation: 0,
              opacity: el.opacity || 1,
            });

            if (el.type === 'IMAGE' && el.imagePrompt) {
              generatedImageRefs.push({ id: childId, prompt: el.imagePrompt });
            }
          });
        }
        
        currentXOffset += screen.width + 100;
      });

      onGenerate(newElementsToAdd);
      onClose();
      setGenPrompt('');

      if (generatedImageRefs.length > 0) {
        updateStatus(`Generating ${generatedImageRefs.length} assets...`);
        
        for (const ref of generatedImageRefs) {
          try {
            const generatedUrl = await generateImage(ref.prompt);
            onUpdateElement(ref.id, { content: generatedUrl });
          } catch (err) {
            console.error("Failed to generate asset", err);
          }
        }
      }

    } catch (error: any) {
      console.error("Generation failed", error);
      alert(`Failed to generate design: ${error.message}`);
    } finally {
      updateGenerating(false);
      updateStatus('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl w-[500px] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-1 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2 px-3 py-2">
            <MagicIcon />
            <span className="text-xs font-medium text-white">Design Generator</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white px-3 py-2 transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleGenerateDesign} className="p-5">
          <div className="relative mb-6">
            <textarea
              autoFocus
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              placeholder="Describe the interface you want to build... (e.g. 'A dark mode analytics dashboard with a sidebar and data charts')"
              className="w-full bg-transparent text-white text-sm placeholder-zinc-600 focus:outline-none h-32 resize-none leading-relaxed"
            />
            <div className="absolute bottom-0 right-0 pointer-events-none">
              <span className="text-[10px] text-zinc-700 bg-[#09090b] px-1">Gemini 2.5 Flash</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">Style</span>
              {['Modern', 'Minimal', 'Dark', 'Swiss', 'Brutalist'].map(v => (
                <button 
                  key={v}
                  type="button"
                  onClick={() => setGenVibe(v)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${genVibe === v ? 'bg-zinc-100 text-black border-zinc-100 font-medium' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isGenerating}
            className="w-full bg-gradient-brand hover:opacity-90 text-black py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <><Spinner /> {genStatus}</> : 'Generate Design'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GenModal;

