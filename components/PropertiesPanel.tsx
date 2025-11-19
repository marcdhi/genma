import React, { useState } from 'react';
import { CanvasElement, ElementType } from '../types';
import { analyzeImage, editImage, generateVideo, modifyCanvasElement } from '../services/geminiService';
import { SparklesIcon, LockIcon, UnlockIcon } from './Icons';

interface PropertiesPanelProps {
  selectedElements: CanvasElement[];
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElements, onUpdateElement }) => {
  const [activeTab, setActiveTab] = useState<'design' | 'ai'>('design');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (selectedElements.length === 0) {
    return (
      <div className="w-64 bg-[#111] border-l border-[#222] flex flex-col p-6 text-gray-500 text-xs font-sans">
        <p className="text-center">No selection</p>
      </div>
    );
  }

  // Multi-select view
  if (selectedElements.length > 1) {
      return (
        <div className="w-64 bg-[#111] border-l border-[#222] flex flex-col p-4 text-gray-300 text-xs font-sans">
           <div className="font-bold mb-4 text-white">{selectedElements.length} items selected</div>
           <div className="grid grid-cols-2 gap-2">
               <button 
                 onClick={() => selectedElements.forEach(el => onUpdateElement(el.id, { locked: true }))}
                 className="bg-[#222] hover:bg-[#333] p-2 rounded border border-[#333]"
               >Lock All</button>
               <button 
                 onClick={() => selectedElements.forEach(el => onUpdateElement(el.id, { locked: false }))}
                 className="bg-[#222] hover:bg-[#333] p-2 rounded border border-[#333]"
               >Unlock All</button>
               <button 
                 onClick={() => selectedElements.forEach(el => onUpdateElement(el.id, { x: selectedElements[0].x }))}
                 className="bg-[#222] hover:bg-[#333] p-2 rounded border border-[#333]"
               >Align Left</button>
               <button 
                 onClick={() => selectedElements.forEach(el => onUpdateElement(el.id, { y: selectedElements[0].y }))}
                 className="bg-[#222] hover:bg-[#333] p-2 rounded border border-[#333]"
               >Align Top</button>
           </div>
        </div>
      );
  }

  const selectedElement = selectedElements[0];

  const handleInputChange = (field: keyof CanvasElement, value: string | number | boolean) => {
    onUpdateElement(selectedElement.id, { [field]: value });
  };

  const handleAiAction = async (action: 'edit' | 'analyze' | 'animate' | 'modify') => {
    setIsProcessing(true);
    setAiOutput(null);
    setError(null);

    try {
      if (action === 'analyze') {
        if (selectedElement.type !== ElementType.IMAGE || !selectedElement.content) return;
        const result = await analyzeImage(selectedElement.content);
        setAiOutput(result);
      } else if (action === 'edit') {
        if (!aiPrompt) throw new Error("Please enter a prompt.");
        if (selectedElement.type !== ElementType.IMAGE || !selectedElement.content) return;
        
        const newImage = await editImage(selectedElement.content, aiPrompt);
        onUpdateElement(selectedElement.id, { content: newImage });
        setAiOutput("Image updated successfully!");
      
      } else if (action === 'animate') {
        if (selectedElement.type !== ElementType.IMAGE || !selectedElement.content) return;
        const videoUrl = await generateVideo(selectedElement.content, aiPrompt);
        onUpdateElement(selectedElement.id, { type: ElementType.VIDEO, content: videoUrl });
        setAiOutput("Video generated!");
      
      } else if (action === 'modify') {
        if (!aiPrompt) throw new Error("Please enter a prompt.");
        const updates = await modifyCanvasElement(selectedElement, aiPrompt);
        onUpdateElement(selectedElement.id, updates);
        setAiOutput("Element updated!");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-64 bg-[#111] border-l border-[#222] flex flex-col text-gray-300 font-sans text-xs overflow-y-auto">
      <div className="flex border-b border-[#222] p-1 m-2 bg-[#1a1a1a] rounded">
        <button onClick={() => setActiveTab('design')} className={`flex-1 py-1.5 rounded transition-colors ${activeTab === 'design' ? 'bg-[#333] text-white' : 'text-gray-500'}`}>Design</button>
        <button onClick={() => setActiveTab('ai')} className={`flex-1 py-1.5 rounded transition-colors ${activeTab === 'ai' ? 'bg-[#333] text-white' : 'text-gray-500'}`}>AI</button>
      </div>

      {activeTab === 'design' && (
        <div className="p-4 space-y-6">
          <section>
             <div className="flex justify-between items-center mb-3">
                 <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Layout</h3>
                 <button onClick={() => handleInputChange('locked', !selectedElement.locked)} className="text-gray-500 hover:text-white">
                    {selectedElement.locked ? <LockIcon /> : <UnlockIcon />}
                 </button>
             </div>
             <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                {['x', 'y', 'width', 'height', 'rotation', 'borderRadius'].map(prop => (
                    <div key={prop} className="flex items-center bg-[#1a1a1a] rounded px-2 py-1 border border-[#222]">
                        <span className="text-gray-500 w-4 capitalize">{prop[0]}</span>
                        <input
                            type="number"
                            value={Math.round((selectedElement as any)[prop] || 0)}
                            onChange={(e) => handleInputChange(prop as any, parseInt(e.target.value))}
                            disabled={selectedElement.locked}
                            className="w-full bg-transparent text-right outline-none text-white disabled:opacity-50"
                        />
                    </div>
                ))}
             </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-wider">Style</h3>
            <div className="mb-3">
                <label className="block text-[10px] text-gray-500 mb-1">Name</label>
                <input type="text" value={selectedElement.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#222] rounded px-2 py-1.5 text-white outline-none" />
            </div>
            
            <div className="mb-3">
                <label className="block text-[10px] text-gray-500 mb-1">Fill</label>
                <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded border border-[#333] overflow-hidden relative">
                        <input type="color" value={selectedElement.fill.startsWith('#') ? selectedElement.fill : '#000000'} onChange={(e) => handleInputChange('fill', e.target.value)} className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-none" />
                    </div>
                    <input type="text" value={selectedElement.fill} onChange={(e) => handleInputChange('fill', e.target.value)} className="flex-1 bg-[#1a1a1a] border border-[#222] rounded px-2 py-1.5 text-white outline-none" />
                </div>
            </div>

             <div className="flex items-center justify-between bg-[#1a1a1a] rounded px-2 py-1 border border-[#222]">
                <span className="text-gray-500">Opacity</span>
                <div className="flex items-center gap-2">
                    <input type="range" min="0" max="1" step="0.01" value={selectedElement.opacity} onChange={(e) => handleInputChange('opacity', parseFloat(e.target.value))} className="w-16 accent-white h-1" />
                    <span className="w-8 text-right">{Math.round(selectedElement.opacity * 100)}%</span>
                </div>
            </div>
          </section>

          {selectedElement.type === ElementType.TEXT && (
              <section>
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-wider">Typography</h3>
                  <textarea value={selectedElement.content} onChange={(e) => handleInputChange('content', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#222] rounded p-2 text-white outline-none min-h-[60px] mb-2" />
                  <div className="grid grid-cols-2 gap-2">
                      <select value={selectedElement.fontFamily || 'Inter, sans-serif'} onChange={(e) => handleInputChange('fontFamily', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#222] rounded p-1.5 text-white text-[11px] outline-none">
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="Playfair Display, serif">Playfair</option>
                          <option value="Montserrat, sans-serif">Montserrat</option>
                      </select>
                      <input type="number" value={selectedElement.fontSize || 14} onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#222] rounded p-1.5 text-white outline-none" />
                  </div>
                  <div className="mt-2">
                      <select value={selectedElement.fontWeight || '400'} onChange={(e) => handleInputChange('fontWeight', e.target.value)} className="w-full bg-[#1a1a1a] border border-[#222] rounded p-1.5 text-white text-[11px] outline-none">
                          <option value="300">Light</option>
                          <option value="400">Regular</option>
                          <option value="600">SemiBold</option>
                          <option value="700">Bold</option>
                      </select>
                  </div>
              </section>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="p-4 space-y-6">
            <div className="space-y-4">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Magic Edit</div>
                
                {/* Universal Prompt Input */}
                <textarea 
                    value={aiPrompt} 
                    onChange={(e) => setAiPrompt(e.target.value)} 
                    placeholder={selectedElement.type === ElementType.IMAGE ? "Describe how to edit or animate..." : "Example: 'Make it blue and rounded' or 'Change text to headline'"} 
                    className="w-full bg-[#1a1a1a] text-white rounded p-2 border border-[#333] mb-2 h-20 outline-none resize-none text-xs" 
                />

                {selectedElement.type === ElementType.IMAGE ? (
                    <>
                         <button onClick={() => handleAiAction('analyze')} disabled={isProcessing} className="w-full bg-[#222] hover:bg-[#333] text-white py-2 px-3 rounded border border-[#333] transition-all flex items-center justify-center gap-2">
                            <SparklesIcon /> {isProcessing ? 'Analyzing...' : 'Describe Content'}
                        </button>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button onClick={() => handleAiAction('edit')} disabled={isProcessing} className="bg-[#222] hover:bg-[#333] text-white py-2 rounded border border-[#333]">{isProcessing ? '...' : 'Flash Edit'}</button>
                            <button onClick={() => handleAiAction('animate')} disabled={isProcessing} className="bg-[#222] hover:bg-[#333] text-white py-2 rounded border border-[#333]">{isProcessing ? '...' : 'Veo Video'}</button>
                         </div>
                    </>
                ) : (
                    <button onClick={() => handleAiAction('modify')} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded transition-all flex items-center justify-center gap-2">
                        <SparklesIcon /> {isProcessing ? 'Thinking...' : 'Apply Changes'}
                    </button>
                )}
            </div>
            {(aiOutput || error) && (
            <div className="mt-4 p-3 bg-[#1a1a1a] rounded border border-[#222] text-xs">
                {error && <p className="text-red-400 mb-1">Error</p>}
                {error && <p className="text-gray-400">{error}</p>}
                {aiOutput && <p className="text-blue-400 mb-1">Result</p>}
                {aiOutput && <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{aiOutput}</p>}
            </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
