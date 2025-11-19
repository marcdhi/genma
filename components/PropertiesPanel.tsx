
import React, { useState } from 'react';
import { CanvasElement, ElementType } from '../types';
import { analyzeImage, editImage, generateVideo, modifyCanvasElement } from '../services/geminiService';
import { SparklesIcon, LockIcon, UnlockIcon, TrashIcon, EffectsIcon, ShadowIcon, BlurIcon, NoiseIcon, GradientIcon } from './Icons';

interface PropertiesPanelProps {
  selectedElements: CanvasElement[];
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: () => void;
}

const GOOGLE_FONTS = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Nunito', 
    'Playfair Display', 'Merriweather', 'Oswald', 'Work Sans', 'Crimson Text'
];

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElements, onUpdateElement, onDeleteElement }) => {
  const [activeTab, setActiveTab] = useState<'design' | 'ai'>('design');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Gradient State Local Control
  const [gradMode, setGradMode] = useState<'solid' | 'gradient'>('solid');
  const [gradStart, setGradStart] = useState('#3b82f6');
  const [gradEnd, setGradEnd] = useState('#ef4444');
  const [gradAngle, setGradAngle] = useState(135);

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
           </div>
        </div>
      );
  }

  const selectedElement = selectedElements[0];

  const handleInputChange = (field: keyof CanvasElement, value: string | number | boolean) => {
    onUpdateElement(selectedElement.id, { [field]: value });
  };

  const updateGradient = (start: string, end: string, angle: number) => {
      const gradString = `linear-gradient(${angle}deg, ${start}, ${end})`;
      handleInputChange('fill', gradString);
  };
  
  const handleShadowChange = (key: 'x'|'y'|'blur'|'color', val: any) => {
      const current = selectedElement.shadow || { x: 0, y: 4, blur: 10, color: 'rgba(0,0,0,0.5)' };
      handleInputChange('shadow', { ...current, [key]: val });
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
        <div className="p-4 space-y-6">
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
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-wider">Fill</h3>
            
            <div className="flex gap-2 mb-3 p-1 bg-zinc-900 rounded-md">
                <button onClick={() => setGradMode('solid')} className={`flex-1 py-1 rounded text-[10px] ${gradMode === 'solid' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Solid</button>
                <button onClick={() => setGradMode('gradient')} className={`flex-1 py-1 rounded text-[10px] flex justify-center ${gradMode === 'gradient' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}><GradientIcon /></button>
            </div>

            {gradMode === 'solid' ? (
                <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded-full border border-zinc-700 overflow-hidden relative shadow-sm">
                        <input type="color" value={selectedElement.fill.startsWith('#') ? selectedElement.fill : '#000000'} onChange={(e) => handleInputChange('fill', e.target.value)} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer border-none p-0" />
                    </div>
                    <input type="text" value={selectedElement.fill} onChange={(e) => handleInputChange('fill', e.target.value)} className="flex-1 bg-transparent border-b border-zinc-800 focus:border-zinc-500 pb-1 text-white outline-none font-mono" />
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <input type="color" value={gradStart} onChange={e => { setGradStart(e.target.value); updateGradient(e.target.value, gradEnd, gradAngle); }} className="bg-transparent w-8 h-8 cursor-pointer"/>
                        <input type="range" min="0" max="360" value={gradAngle} onChange={e => { setGradAngle(parseInt(e.target.value)); updateGradient(gradStart, gradEnd, parseInt(e.target.value)); }} className="w-24 accent-white h-1 bg-zinc-800 rounded appearance-none" />
                        <input type="color" value={gradEnd} onChange={e => { setGradEnd(e.target.value); updateGradient(gradStart, e.target.value, gradAngle); }} className="bg-transparent w-8 h-8 cursor-pointer"/>
                    </div>
                </div>
            )}

             <div className="mt-4">
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
                  <textarea value={selectedElement.content} onChange={(e) => handleInputChange('content', e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 rounded-md p-2 text-white outline-none min-h-[60px] mb-4 text-sm resize-y" />
                  <div className="space-y-3">
                      <div>
                          <div className="text-zinc-500 mb-1">Font Family</div>
                          <select 
                            value={selectedElement.fontFamily?.split(',')[0].replace(/'/g, '') || 'Inter'} 
                            onChange={(e) => handleInputChange('fontFamily', `'${e.target.value}', sans-serif`)} 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-white outline-none"
                          >
                              {GOOGLE_FONTS.map(f => (
                                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                              ))}
                          </select>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Size</span>
                          <input type="number" value={selectedElement.fontSize || 14} onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))} className="w-12 bg-transparent text-right outline-none text-white border-b border-zinc-800 focus:border-zinc-500 pb-0.5" />
                      </div>
                  </div>
              </section>
          )}
          
          {/* Effects Section */}
          <section>
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-wider flex items-center gap-2"><EffectsIcon /> Effects</h3>
              
              {/* Shadow */}
              <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                     <label className="text-zinc-400 text-[11px] flex gap-2 items-center"><ShadowIcon /> Drop Shadow</label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                      <input type="number" placeholder="X" value={selectedElement.shadow?.x || 0} onChange={e => handleShadowChange('x', parseInt(e.target.value))} className="bg-zinc-900 rounded p-1 text-center outline-none"/>
                      <input type="number" placeholder="Y" value={selectedElement.shadow?.y || 0} onChange={e => handleShadowChange('y', parseInt(e.target.value))} className="bg-zinc-900 rounded p-1 text-center outline-none"/>
                      <input type="number" placeholder="B" value={selectedElement.shadow?.blur || 0} onChange={e => handleShadowChange('blur', parseInt(e.target.value))} className="bg-zinc-900 rounded p-1 text-center outline-none"/>
                      <input type="color" value={selectedElement.shadow?.color || '#000000'} onChange={e => handleShadowChange('color', e.target.value)} className="h-full w-full bg-transparent cursor-pointer"/>
                  </div>
              </div>

              {/* Blur */}
              <div className="mb-4">
                 <div className="flex justify-between mb-1">
                    <label className="text-zinc-400 text-[11px] flex gap-2 items-center"><BlurIcon /> Layer Blur</label>
                    <span className="text-zinc-500">{selectedElement.blur || 0}px</span>
                 </div>
                 <input type="range" min="0" max="50" value={selectedElement.blur || 0} onChange={e => handleInputChange('blur', parseInt(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded appearance-none"/>
              </div>

              {/* Noise */}
              <div>
                 <div className="flex justify-between mb-1">
                    <label className="text-zinc-400 text-[11px] flex gap-2 items-center"><NoiseIcon /> Noise</label>
                    <span className="text-zinc-500">{Math.round((selectedElement.noise || 0) * 100)}%</span>
                 </div>
                 <input type="range" min="0" max="0.5" step="0.01" value={selectedElement.noise || 0} onChange={e => handleInputChange('noise', parseFloat(e.target.value))} className="w-full accent-white h-1 bg-zinc-800 rounded appearance-none"/>
              </div>
          </section>
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
                    <button onClick={() => handleAiAction('modify')} disabled={isProcessing} className="w-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500 hover:opacity-90 text-black font-medium py-2 px-3 rounded-md transition-all flex items-center justify-center gap-2">
                        <SparklesIcon /> {isProcessing ? 'Processing...' : 'Apply Magic'}
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