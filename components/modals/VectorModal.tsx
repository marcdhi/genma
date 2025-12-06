import React, { useState } from 'react';
import { VectorIcon } from '../Icons';
import { generateSvg } from '../../services/geminiService';
import { ElementType } from '../../types';

interface VectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElement: (element: Partial<any>) => void;
  elementsCount: number;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
}

const VectorModal: React.FC<VectorModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddElement,
  elementsCount,
  isGenerating,
  setIsGenerating
}) => {
  const [vectorPrompt, setVectorPrompt] = useState('');

  const handleGenerateVector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vectorPrompt) return;
    setIsGenerating(true);
    try {
      const pathData = await generateSvg(vectorPrompt);
      onAddElement({
        type: ElementType.PATH,
        content: pathData,
        width: 100,
        height: 100,
        x: 100 + elementsCount * 10,
        y: 100 + elementsCount * 10,
        fill: '#ffffff',
        stroke: 'none'
      });
      onClose();
      setVectorPrompt('');
    } catch (e) {
      alert('Failed to generate SVG');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <VectorIcon />
            <span className="text-xs font-medium text-white">Vector Generator</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleGenerateVector} className="p-4">
          <textarea 
            autoFocus
            value={vectorPrompt}
            onChange={e => setVectorPrompt(e.target.value)}
            placeholder="Describe the icon (e.g., 'A cute rocket ship outline', 'Minimalist star')"
            className="w-full bg-zinc-900 text-white text-sm border border-zinc-800 rounded p-3 mb-4 h-24 focus:outline-none focus:border-zinc-600 resize-none"
          />
          <button 
            type="submit"
            disabled={isGenerating}
            className="w-full bg-white text-black py-2 rounded-md font-medium text-xs hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating Vector...' : 'Generate SVG'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VectorModal;

