import React, { useState } from 'react';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import ChatWidget from './components/ChatWidget';
import { CanvasElement, ElementType } from './types';
import { CursorIcon, SquareIcon, CircleIcon, TextIcon, ImageIcon, FrameIcon, MagicIcon, Spinner, LockIcon } from './components/Icons';
import { generateUiDesign, GeneratedElement, generateImage } from './services/geminiService';

const App: React.FC = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<'cursor' | 'rect' | 'circle' | 'text' | 'frame'>('cursor');
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  
  // Gen AI Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [genVibe, setGenVibe] = useState('Modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  const addElement = (type: ElementType, content?: string) => {
    const id = crypto.randomUUID();
    const count = elements.filter(e => e.type === type).length + 1;
    
    const newElement: CanvasElement = {
      id,
      type,
      name: `${type.charAt(0) + type.slice(1).toLowerCase()} ${count}`,
      x: 100 + elements.length * 20,
      y: 100 + elements.length * 20,
      width: type === ElementType.TEXT ? 200 : (type === ElementType.FRAME ? 400 : 100),
      height: type === ElementType.TEXT ? 50 : (type === ElementType.FRAME ? 300 : 100),
      fill: type === ElementType.TEXT ? '#ffffff' : (type === ElementType.FRAME ? 'transparent' : '#333333'),
      content: content || (type === ElementType.TEXT ? "Double click to edit" : undefined),
      rotation: 0,
      opacity: 1,
      borderRadius: 0,
      fontFamily: 'Inter, sans-serif',
      fontSize: 16,
    };
    setElements([...elements, newElement]);
    setSelectedIds([newElement.id]);
    setActiveTool('cursor'); 
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          addElement(ElementType.IMAGE, ev.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleGenerateDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genPrompt.trim()) return;
    setIsGenerating(true);
    setGenStatus('Dreaming up layout...');

    try {
      // 1. Generate Layout structure with Theme
      const design = await generateUiDesign(genPrompt, genVibe);
      
      // 2. Smart Placement
      let startX = 100;
      if (elements.length > 0) {
          const maxElX = Math.max(...elements.map(e => e.x + e.width));
          startX = maxElX + 100;
      }
      
      const frameId = crypto.randomUUID();
      const frameElement: CanvasElement = {
        id: frameId,
        type: ElementType.FRAME,
        name: design.frameName || 'Generated Frame',
        x: startX,
        y: 100,
        width: design.width,
        height: design.height,
        fill: design.theme?.palette.background || '#0f0f0f',
        rotation: 0,
        opacity: 1,
        borderRadius: 0,
      };

      // Convert JSON elements to CanvasElements
      const childElements: CanvasElement[] = design.elements.map((el: GeneratedElement) => ({
        id: crypto.randomUUID(),
        type: el.type as ElementType,
        name: el.name,
        x: startX + el.x,
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
      }));

      setElements(prev => [...prev, frameElement, ...childElements]);
      setIsGenModalOpen(false);
      setGenPrompt('');
      setSelectedIds([frameId]);

      // 4. Async Asset Generation (Images)
      const imageElements = design.elements.filter(el => el.type === 'IMAGE' && el.imagePrompt);
      if (imageElements.length > 0) {
         setGenStatus(`Generating ${imageElements.length} Assets...`);
         
         for (let i = 0; i < childElements.length; i++) {
             const originalRef = design.elements[i];
             const canvasRef = childElements[i];
             
             if (originalRef.type === 'IMAGE' && originalRef.imagePrompt) {
                 try {
                     const generatedUrl = await generateImage(originalRef.imagePrompt);
                     updateElement(canvasRef.id, { content: generatedUrl });
                 } catch (err) {
                     console.error("Failed to generate asset", err);
                 }
             }
         }
      }

    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate design. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenStatus('');
    }
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  // Layer Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLayerId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetId) return;

    const sourceIndex = elements.findIndex(el => el.id === draggedLayerId);
    const targetIndex = elements.findIndex(el => el.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newElements = [...elements];
    const [movedElement] = newElements.splice(sourceIndex, 1);
    newElements.splice(targetIndex, 0, movedElement);

    setElements(newElements);
    setDraggedLayerId(null);
  };

  const handleLayerNameChange = (id: string, newName: string) => {
    updateElement(id, { name: newName });
  };

  const selectedElements = elements.filter(el => selectedIds.includes(el.id));

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Minimal Header */}
      <div className="h-12 bg-[#0a0a0a] border-b border-[#222] flex items-center px-4 justify-between z-10">
        <div className="flex items-center gap-6">
          <div className="font-semibold tracking-tight text-white flex items-center gap-2 select-none">
            <div className="w-4 h-4 bg-white rounded-full"></div>
            Genma
          </div>
          
          <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#222]">
            <button onClick={() => setActiveTool('cursor')} className={`p-1.5 rounded hover:bg-[#333] transition-colors ${activeTool === 'cursor' ? 'bg-[#333] text-white' : 'text-gray-500'}`} title="Move (V)"><CursorIcon /></button>
            <button onClick={() => addElement(ElementType.FRAME)} className="p-1.5 rounded hover:bg-[#333] transition-colors text-gray-500" title="Frame (F)"><FrameIcon /></button>
            <button onClick={() => addElement(ElementType.RECTANGLE)} className="p-1.5 rounded hover:bg-[#333] transition-colors text-gray-500" title="Rectangle (R)"><SquareIcon /></button>
            <button onClick={() => addElement(ElementType.CIRCLE)} className="p-1.5 rounded hover:bg-[#333] transition-colors text-gray-500" title="Circle (O)"><CircleIcon /></button>
            <button onClick={() => addElement(ElementType.TEXT)} className="p-1.5 rounded hover:bg-[#333] transition-colors text-gray-500" title="Text (T)"><TextIcon /></button>
            <label className="p-1.5 rounded hover:bg-[#333] transition-colors text-gray-500 cursor-pointer" title="Image (I)"><ImageIcon /><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label>
            <div className="w-px h-4 bg-[#333] mx-1"></div>
            <button onClick={() => setIsGenModalOpen(true)} className="p-1.5 rounded hover:bg-blue-900/30 text-blue-400 hover:text-blue-300 transition-colors" title="Generate UI"><MagicIcon /></button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {isGenerating && <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded"><Spinner /> {genStatus}</div>}
           <div className="flex items-center text-xs text-gray-500 gap-2 bg-[#1a1a1a] px-2 py-1 rounded border border-[#222]">
             <button onClick={() => setScale(Math.max(0.1, scale - 0.1))} className="hover:text-white">-</button>
             <span className="w-8 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(Math.min(5, scale + 0.1))} className="hover:text-white">+</button>
           </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Minimal Layers Panel */}
        <div className="w-48 bg-[#0a0a0a] border-r border-[#222] flex flex-col z-10">
          <div className="p-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider select-none">Layers</div>
          <div className="flex-1 overflow-y-auto space-y-0.5 px-1">
            {[...elements].reverse().map(el => (
              <div 
                key={el.id}
                draggable
                onDragStart={(e) => handleDragStart(e, el.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, el.id)}
                onClick={(e) => {
                    if(e.shiftKey) {
                        setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]);
                    } else {
                        setSelectedIds([el.id]);
                    }
                }}
                className={`group px-3 py-2 text-xs rounded cursor-default flex items-center gap-2 transition-all border border-transparent
                  ${selectedIds.includes(el.id) ? 'bg-[#1a1a1a] text-white border-[#222]' : 'text-gray-500 hover:text-gray-300 hover:bg-[#111]'}
                  ${draggedLayerId === el.id ? 'opacity-50' : 'opacity-100'}
                `}
              >
                <span className="opacity-50 w-3">{el.locked ? <LockIcon /> : ''}</span>
                {el.type === ElementType.FRAME && <FrameIcon />}
                {el.type === ElementType.RECTANGLE && <SquareIcon />}
                {el.type === ElementType.CIRCLE && <CircleIcon />}
                {el.type === ElementType.TEXT && <TextIcon />}
                {el.type === ElementType.IMAGE && <ImageIcon />}
                {el.type === ElementType.VIDEO && <span className="text-[9px] font-bold">VID</span>}
                {el.type === ElementType.PATH && <span className="text-[9px] font-bold">SVG</span>}
                
                {renamingId === el.id ? (
                  <input 
                    autoFocus
                    type="text"
                    className="bg-[#111] text-white border border-[#333] rounded px-1 w-full outline-none"
                    defaultValue={el.name}
                    onBlur={() => setRenamingId(null)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { handleLayerNameChange(el.id, e.currentTarget.value); setRenamingId(null); }}}
                  />
                ) : (
                  <span className="truncate select-none w-full" onDoubleClick={() => setRenamingId(el.id)}>
                    {el.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <Canvas 
          elements={elements} 
          selectedIds={selectedIds} 
          onSelect={setSelectedIds}
          onUpdateElement={updateElement}
          scale={scale}
          setScale={setScale}
        />

        {/* Properties Panel */}
        <PropertiesPanel 
          selectedElements={selectedElements}
          onUpdateElement={updateElement}
        />

        {/* Generate Modal */}
        {isGenModalOpen && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl w-[400px] p-6">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-white font-medium flex items-center gap-2">
                   <MagicIcon /> Generate Design
                 </h2>
                 <button onClick={() => setIsGenModalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
               </div>
               
               <form onSubmit={handleGenerateDesign}>
                 <div className="mb-4">
                   <label className="block text-xs text-gray-500 mb-2">Describe your idea</label>
                   <textarea
                     autoFocus
                     value={genPrompt}
                     onChange={(e) => setGenPrompt(e.target.value)}
                     placeholder="E.g., A fintech dashboard with a sidebar and chart."
                     className="w-full bg-[#111] border border-[#333] rounded p-3 text-white text-sm focus:border-blue-500 focus:outline-none h-24 resize-none"
                   />
                 </div>
                 
                 <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-2">Vibe</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['Modern', 'Minimal', 'Pastel', 'Dark', 'Brutalist', 'Wireframe'].map(v => (
                            <button 
                                key={v}
                                type="button"
                                onClick={() => setGenVibe(v)}
                                className={`text-xs py-1.5 rounded border ${genVibe === v ? 'bg-blue-900/40 border-blue-500 text-blue-200' : 'bg-[#222] border-transparent text-gray-400 hover:bg-[#333]'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-[#222] p-2 rounded">
                    <span>Included:</span>
                    <div className="flex gap-2">
                        <span className="text-blue-400">Vectors</span>
                        <span className="text-purple-400">Theme</span>
                        <span className="text-green-400">Assets</span>
                    </div>
                 </div>
                 
                 <button 
                   type="submit" 
                   disabled={isGenerating}
                   className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                 >
                   {isGenerating ? <Spinner /> : 'Generate UI'}
                 </button>
               </form>
            </div>
          </div>
        )}
      </div>

      <ChatWidget />
    </div>
  );
};

export default App;
