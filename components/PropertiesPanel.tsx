
import React, { useState } from 'react';
import { CanvasElement, ElementType } from '../types';
import { analyzeImage, editImage, generateVideo, modifyCanvasElement } from '../services/geminiService';
import { SparklesIcon, LockIcon, UnlockIcon, TrashIcon } from './Icons';

interface PropertiesPanelProps {
  selectedElements: CanvasElement[];
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElements, onUpdateElement, onDeleteElement }) => {
  const [activeTab, setActiveTab] = useState<'design' | 'ai'>('design');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (selectedElements.length === 0) {
    return (
      <div className="w-64 bg-[#09090b] border-l border-zinc-800 flex flex-col p-6 text-zinc-600 text-xs font-sans">
        <p className="text-center">No selection</p>
      </div>
    );
  }

  // Multi-select view
  if (selectedElements.length > 1) {
      return (
        <div className="w-64 bg-[#09090b] border-l border-zinc-800 flex flex-col p-4 text-zinc-400 text-xs font-sans">
           <div className="font-medium mb-6 text-zinc-200 flex justify-between items-center">
             <span>{selectedElements.length} items selected</span>
             <button onClick={onDeleteElement} className="text-zinc-500 hover:text-red-400 transition-colors"><TrashIcon /></button>
           </div>
           <div className="grid grid-cols-2 gap-2">
               <button 
                 onClick={() => selectedElements.forEach(el => onUpdateElement(el.id, { locked: true }))}
                 className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 rounded border border-zinc-800 transition-colors"
               >Lock All</button>
               <button 
                 onClick={() => selectedElements.forEach(el => onUpdateElement(el.id, { locked: false }))}
                 className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 rounded border border-zinc-800 transition-colors"
               >Unlock All</button>
               <button 
                 onClick={() => selectedElements.forEach(el => onUpdateElement(el.id, { x: selectedElements[0].x }))}
                 className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 rounded border border-zinc-800 transition-colors"
               >Align Left</button>
               <button 
                 onClick={() => selectedElements.forEach(el => onUpdateElement(el.id, { y: selectedElements[0].y }))}
                 className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 rounded border border-zinc-800 transition-colors"
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
    <div className="w-64 bg-[#09090b] border-l border-zinc-800 flex flex-col text-zinc-300 font-sans text-xs overflow-y-auto h-full">
      <div className="flex p-3 border-b border-zinc-800/50 gap-1">
        <button onClick={() => setActiveTab('design')} className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${activeTab === 'design' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Design</button>
        <button onClick={() => setActiveTab('ai')} className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${activeTab === 'ai' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Magic</button>
      </div>

      {activeTab === 'design' && (
        <div className="p-4 space-y-8">
          <section>
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Layout</h3>
                 <div className="flex gap-3">
                    <button onClick={() => handleInputChange('locked', !selectedElement.locked)} className="text-zinc-500 hover:text-white transition-colors">
                        {selectedElement.locked ? <LockIcon /> : <UnlockIcon />}
                    </button>
                    <button onClick={onDeleteElement} className="text-zinc-500 hover:text-red-400 transition-colors">
                        <TrashIcon />
                    </button>
                 </div>
             </div>
             <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {['x', 'y', 'width', 'height', 'rotation', 'borderRadius'].map(prop => (
                    <div key={prop} className="flex items-center justify-between group">
                        <span className="text-zinc-500 capitalize">{prop === 'borderRadius' ? 'Radius' : prop[0]}</span>
                        <input
                            type="number"
                            value={Math.round((selectedElement as any)[prop] || 0)}
                            onChange={(e) => handleInputChange(prop as any, parseInt(e.target.value))}
                            disabled={selectedElement.locked}
                            className="w-16 bg-transparent text-right outline-none text-white border-b border-zinc-800 focus:border-zinc-500 pb-0.5 transition-colors"
                        />
                    </div>
                ))}
             </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-wider">Style</h3>
            
            <div className="mb-4">
                <label className="block text-[10px] text-zinc-500 mb-1.5">Fill</label>
                <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded-full border border-zinc-700 overflow-hidden relative shadow-sm">
                        <input type="color" value={selectedElement.fill.startsWith('#') ? selectedElement.fill : '#000000'} onChange={(e) => handleInputChange('fill', e.target.value)} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer border-none p-0" />
                    </div>
                    <input type="text" value={selectedElement.fill} onChange={(e) => handleInputChange('fill', e.target.value)} className="flex-1 bg-transparent border-b border-zinc-800 focus:border-zinc-500 pb-1 text-white outline-none font-mono" />
                </div>
            </div>

             <div className="mb-4">
                <div className="flex justify-between mb-2">
                    <span className="text-zinc-500">Opacity</span>
                    <span className="text-zinc-300">{Math.round(selectedElement.opacity * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={selectedElement.opacity} onChange={(e) => handleInputChange('opacity', parseFloat(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded appearance-none" />
            </div>
          </section>

          {selectedElement.type === ElementType.TEXT && (
              <section>
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-wider">Typography</h3>
                  <textarea value={selectedElement.content} onChange={(e) => handleInputChange('content', e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 rounded-md p-2 text-white outline-none min-h-[80px] mb-4 text-sm resize-y" />
                  <div className="space-y-3">
                      <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Font</span>
                          <select value={selectedElement.fontFamily || 'Inter, sans-serif'} onChange={(e) => handleInputChange('fontFamily', e.target.value)} className="bg-transparent text-right text-white outline-none cursor-pointer">
                              <option value="Inter, sans-serif">Inter</option>
                              <option value="Roboto, sans-serif">Roboto</option>
                              <option value="Playfair Display, serif">Playfair</option>
                              <option value="Montserrat, sans-serif">Montserrat</option>
                          </select>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Weight</span>
                          <select value={selectedElement.fontWeight || '400'} onChange={(e) => handleInputChange('fontWeight', e.target.value)} className="bg-transparent text-right text-white outline-none cursor-pointer">
                              <option value="300">Light</option>
                              <option value="400">Regular</option>
                              <option value="600">SemiBold</option>
                              <option value="700">Bold</option>
                          </select>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Size</span>
                          <input type="number" value={selectedElement.fontSize || 14} onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))} className="w-12 bg-transparent text-right outline-none text-white border-b border-zinc-800 focus:border-zinc-500 pb-0.5" />
                      </div>
                  </div>
              </section>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="p-4 space-y-6">
            <div className="space-y-4">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Modification</div>
                
                <textarea 
                    value={aiPrompt} 
                    onChange={(e) => setAiPrompt(e.target.value)} 
                    placeholder={selectedElement.type === ElementType.IMAGE ? "Describe how to edit or animate..." : "e.g., 'Make it pill shaped', 'Use a serif font'"} 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white mb-2 h-24 outline-none resize-none text-sm focus:border-zinc-600 placeholder-zinc-600" 
                />

                {selectedElement.type === ElementType.IMAGE ? (
                    <>
                         <button onClick={() => handleAiAction('analyze')} disabled={isProcessing} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-md transition-all flex items-center justify-center gap-2">
                            <SparklesIcon /> {isProcessing ? 'Thinking...' : 'Analyze Content'}
                        </button>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button onClick={() => handleAiAction('edit')} disabled={isProcessing} className="bg-transparent hover:bg-zinc-800 text-zinc-300 py-2 rounded-md border border-zinc-800 transition-colors">{isProcessing ? '...' : 'Edit'}</button>
                            <button onClick={() => handleAiAction('animate')} disabled={isProcessing} className="bg-transparent hover:bg-zinc-800 text-zinc-300 py-2 rounded-md border border-zinc-800 transition-colors">{isProcessing ? '...' : 'Animate'}</button>
                         </div>
                    </>
                ) : (
                    <button onClick={() => handleAiAction('modify')} disabled={isProcessing} className="w-full bg-white hover:bg-zinc-200 text-black font-medium py-2 px-3 rounded-md transition-all flex items-center justify-center gap-2">
                        <SparklesIcon /> {isProcessing ? 'Processing...' : 'Apply'}
                    </button>
                )}
            </div>
            {(aiOutput || error) && (
            <div className="mt-4 p-3 bg-zinc-900 rounded-md border border-zinc-800 text-xs">
                {error && <p className="text-red-400 mb-1 font-medium">Error</p>}
                {error && <p className="text-zinc-400">{error}</p>}
                {aiOutput && <p className="text-blue-400 mb-1 font-medium">Gemini</p>}
                {aiOutput && <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{aiOutput}</p>}
            </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
