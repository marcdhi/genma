
import React, { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import ChatWidget from './components/ChatWidget';
import LandingPage from './components/LandingPage';
import OnboardingModal from './components/OnboardingModal';
import { CanvasElement, ElementType } from './types';
import { CursorIcon, HandIcon, SquareIcon, CircleIcon, TextIcon, ImageIcon, FrameIcon, MagicIcon, Spinner, LockIcon, HelpIcon, PenIcon, PencilIcon, VectorIcon } from './components/Icons';
import { generateUiDesign, GeneratedElement, generateImage, GeneratedScreen, generateSvg } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<'cursor' | 'hand' | 'rect' | 'circle' | 'text' | 'frame' | 'pen' | 'pencil'>('cursor');
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);
  
  // Gen AI Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [genVibe, setGenVibe] = useState('Modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  
  // Vector Gen Modal
  const [isVectorModalOpen, setIsVectorModalOpen] = useState(false);
  const [vectorPrompt, setVectorPrompt] = useState('');
  
  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check onboarding on view change
  useEffect(() => {
      if (view === 'app') {
          const hasOnboarded = localStorage.getItem('genma_onboarded');
          if (!hasOnboarded) {
              setShowOnboarding(true);
          }
      }
  }, [view]);

  const handleCloseOnboarding = () => {
      localStorage.setItem('genma_onboarded', 'true');
      setShowOnboarding(false);
  };

  // Delete logic
  const deleteSelectedElements = () => {
    setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
    setSelectedIds([]);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

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
    setElements(prev => [...prev, newElement]);
    setSelectedIds([newElement.id]);
    setActiveTool('cursor'); 
  };

  const handleAddElement = (element: Partial<CanvasElement>) => {
    const id = crypto.randomUUID();
    const newEl = {
        id,
        name: `Path ${elements.filter(e => e.type === ElementType.PATH).length + 1}`,
        type: ElementType.PATH,
        rotation: 0,
        opacity: 1,
        borderRadius: 0,
        locked: false,
        fill: 'transparent',
        stroke: '#ffffff', 
        ...element
    } as CanvasElement;
    setElements(prev => [...prev, newEl]);
    setSelectedIds([id]);
    // Keep tool active for multiple draws
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (view !== 'app') return;

    const handleKeyDown = (e: KeyboardEvent) => {
        const activeElement = document.activeElement;
        const activeTag = activeElement?.tagName.toLowerCase();
        const isInputActive = activeTag === 'input' || activeTag === 'textarea';

        if (e.key === 'Escape') {
             if (isInputActive) {
                 (activeElement as HTMLElement).blur();
                 return;
             }
             setSelectedIds([]);
             setIsGenModalOpen(false);
             setIsVectorModalOpen(false);
             setIsHelpOpen(false);
             setShowOnboarding(false);
             setActiveTool('cursor');
             return;
        }

        if (isInputActive) return;

        // Copy: Cmd/Ctrl + C
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            const toCopy = elements.filter(el => selectedIds.includes(el.id));
            if (toCopy.length > 0) {
                setClipboard(toCopy);
            }
            return;
        }

        // Paste: Cmd/Ctrl + V
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            if (clipboard.length === 0) return;

            const newIds: string[] = [];
            const newElements = clipboard.map(el => {
                const newId = crypto.randomUUID();
                newIds.push(newId);
                return {
                    ...el,
                    id: newId,
                    x: el.x + 20,
                    y: el.y + 20,
                    name: el.name,
                };
            });

            setElements(prev => [...prev, ...newElements]);
            setSelectedIds(newIds);
            return;
        }

        // Tools
        switch(e.key.toLowerCase()) {
            case 'v': setActiveTool('cursor'); break;
            case 'h': setActiveTool('hand'); break;
            case 'r': addElement(ElementType.RECTANGLE); break;
            case 'o': addElement(ElementType.CIRCLE); break;
            case 't': addElement(ElementType.TEXT); break;
            case 'f': addElement(ElementType.FRAME); break;
            case 'p': if(!e.shiftKey) setActiveTool('pen'); break;
        }
        
        if (e.shiftKey && e.key.toLowerCase() === 'p') {
           setActiveTool('pencil');
        }

        // Deletion
        if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteSelectedElements();
        }

        // Typography Sizing (Cmd/Ctrl + Shift + < or >)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
            if (e.key === '>' || e.key === '.') {
                e.preventDefault();
                elements.forEach(el => {
                    if (selectedIds.includes(el.id) && el.type === ElementType.TEXT) {
                        updateElement(el.id, { fontSize: (el.fontSize || 16) + 2 });
                    }
                });
            }
            if (e.key === '<' || e.key === ',') {
                e.preventDefault();
                elements.forEach(el => {
                    if (selectedIds.includes(el.id) && el.type === ElementType.TEXT) {
                        updateElement(el.id, { fontSize: Math.max(8, (el.fontSize || 16) - 2) });
                    }
                });
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, renamingId, clipboard, view]);

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

  const handleGenerateVector = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!vectorPrompt) return;
      setIsGenerating(true);
      try {
          const pathData = await generateSvg(vectorPrompt);
          handleAddElement({
              type: ElementType.PATH,
              content: pathData,
              width: 100,
              height: 100,
              x: 100 + elements.length * 10,
              y: 100 + elements.length * 10,
              fill: '#ffffff',
              stroke: 'none'
          });
          setIsVectorModalOpen(false);
          setVectorPrompt('');
      } catch (e) {
          alert('Failed to generate SVG');
      } finally {
          setIsGenerating(false);
      }
  };

  const handleGenerateDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genPrompt.trim()) return;
    setIsGenerating(true);
    setGenStatus('Architecting layout...');

    try {
      // 1. Generate Layout structure with Theme
      const designResponse = await generateUiDesign(genPrompt, genVibe);
      
      if (!designResponse || !designResponse.screens || !Array.isArray(designResponse.screens)) {
          throw new Error("AI returned an incomplete design structure. Please try again.");
      }

      let currentXOffset = 100;
      if (elements.length > 0) {
          const maxElX = Math.max(...elements.map(e => e.x + e.width));
          currentXOffset = maxElX + 100;
      }

      const newElementsToAdd: CanvasElement[] = [];
      const generatedImageRefs: { id: string, prompt: string }[] = [];

      // Iterate over multiple screens if returned
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

          // Add Children
          if (screen.elements && Array.isArray(screen.elements)) {
            screen.elements.forEach((el: GeneratedElement) => {
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
          
          // Increment offset for next screen
          currentXOffset += screen.width + 100;
      });

      setElements(prev => [...prev, ...newElementsToAdd]);
      setIsGenModalOpen(false);
      setGenPrompt('');
      // Select the newly added frames
      const frameIds = newElementsToAdd.filter(e => e.type === ElementType.FRAME).map(e => e.id);
      setSelectedIds(frameIds);

      // 4. Async Asset Generation (Images)
      if (generatedImageRefs.length > 0) {
         setGenStatus(`Generating ${generatedImageRefs.length} assets...`);
         
         for (const ref of generatedImageRefs) {
             try {
                 const generatedUrl = await generateImage(ref.prompt);
                 updateElement(ref.id, { content: generatedUrl });
             } catch (err) {
                 console.error("Failed to generate asset", err);
             }
         }
      }

    } catch (error: any) {
      console.error("Generation failed", error);
      alert(`Failed to generate design: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setGenStatus('');
    }
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

  if (view === 'landing') {
      return <LandingPage onLaunch={() => setView('app')} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-300 overflow-hidden font-sans selection:bg-zinc-700 selection:text-white">
      
      {/* Minimal Pro Header */}
      <div className="h-12 bg-[#09090b] border-b border-zinc-800 flex items-center px-4 justify-between z-20 relative">
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <div className="font-bold tracking-tight text-zinc-100 text-sm flex items-center gap-2 select-none cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-5 h-5 rounded-md bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500 shadow-sm"></div>
            Genma
          </div>
        </div>
        
        {/* Center: Floating Toolbar */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-0.5 bg-zinc-900/50 backdrop-blur-md p-1 rounded-md border border-zinc-800 shadow-sm">
            <button onClick={() => setActiveTool('cursor')} className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${activeTool === 'cursor' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`} title="Move (V)"><CursorIcon /></button>
            <button onClick={() => setActiveTool('hand')} className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${activeTool === 'hand' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`} title="Hand Tool (H)"><HandIcon /></button>
            <div className="w-px h-4 bg-zinc-800 mx-1"></div>
            <button onClick={() => addElement(ElementType.FRAME)} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300" title="Frame (F)"><FrameIcon /></button>
            <button onClick={() => addElement(ElementType.RECTANGLE)} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300" title="Rectangle (R)"><SquareIcon /></button>
            <button onClick={() => addElement(ElementType.CIRCLE)} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300" title="Circle (O)"><CircleIcon /></button>
            <button onClick={() => addElement(ElementType.TEXT)} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300" title="Text (T)"><TextIcon /></button>
            <button onClick={() => setActiveTool('pen')} className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${activeTool === 'pen' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`} title="Pen Tool (P)"><PenIcon /></button>
            <button onClick={() => setActiveTool('pencil')} className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${activeTool === 'pencil' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`} title="Pencil Tool (Shift+P)"><PencilIcon /></button>
            <label className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300 cursor-pointer" title="Image (I)"><ImageIcon /><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label>
            <button onClick={() => setIsVectorModalOpen(true)} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300" title="Generate Vector"><VectorIcon /></button>
            <div className="w-px h-4 bg-zinc-800 mx-1"></div>
            <button onClick={() => setIsGenModalOpen(true)} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Generate UI"><MagicIcon /></button>
          </div>
        </div>
        
        {/* Right: Zoom/Status */}
        <div className="flex items-center gap-3">
           {isGenerating && <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-wider"><Spinner /> {genStatus}</div>}
           <button onClick={() => setIsHelpOpen(true)} className="text-zinc-500 hover:text-zinc-300 p-1"><HelpIcon /></button>
           <div className="flex items-center text-[10px] font-medium text-zinc-500 gap-2">
             <button onClick={() => setScale(Math.max(0.1, scale - 0.1))} className="hover:text-white px-1">-</button>
             <span className="w-8 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(Math.min(5, scale + 0.1))} className="hover:text-white px-1">+</button>
           </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Minimal Layers Panel */}
        <div className="w-52 bg-[#09090b] border-r border-zinc-800 flex flex-col z-10">
          <div className="h-10 flex items-center px-4 border-b border-zinc-800/50">
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Layers</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
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
                className={`group px-4 py-1.5 text-xs cursor-default flex items-center gap-2 transition-colors
                  ${selectedIds.includes(el.id) ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}
                  ${draggedLayerId === el.id ? 'opacity-50' : 'opacity-100'}
                `}
              >
                <span className="opacity-0 group-hover:opacity-100 w-3 text-zinc-600">{el.locked ? <LockIcon /> : '⋮'}</span>
                <span className="text-zinc-500">
                    {el.type === ElementType.FRAME && <FrameIcon />}
                    {el.type === ElementType.RECTANGLE && <SquareIcon />}
                    {el.type === ElementType.CIRCLE && <CircleIcon />}
                    {el.type === ElementType.TEXT && <TextIcon />}
                    {el.type === ElementType.IMAGE && <ImageIcon />}
                    {el.type === ElementType.VIDEO && <span className="text-[9px] font-bold border border-current px-0.5 rounded">V</span>}
                    {el.type === ElementType.PATH && <span className="text-[9px] font-bold border border-current px-0.5 rounded">P</span>}
                </span>
                
                {renamingId === el.id ? (
                  <input 
                    autoFocus
                    type="text"
                    className="bg-black text-white border border-zinc-700 rounded px-1 w-full outline-none text-xs -ml-1"
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
          onAddElement={handleAddElement}
          scale={scale}
          setScale={setScale}
          activeTool={activeTool}
        />

        {/* Properties Panel */}
        <PropertiesPanel 
          selectedElements={selectedElements}
          onUpdateElement={updateElement}
          onDeleteElement={deleteSelectedElements}
        />

        {/* Vector Generator Modal */}
        {isVectorModalOpen && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setIsVectorModalOpen(false)}>
                <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                   <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                       <div className="flex items-center gap-2">
                           <VectorIcon />
                           <span className="text-xs font-medium text-white">Vector Generator</span>
                       </div>
                       <button onClick={() => setIsVectorModalOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
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
        )}

        {/* Pro Generation Modal */}
        {isGenModalOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl w-[500px] overflow-hidden animate-in fade-in zoom-in duration-200">
               <div className="p-1 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                   <div className="flex items-center gap-2 px-3 py-2">
                       <MagicIcon />
                       <span className="text-xs font-medium text-white">Design Generator</span>
                   </div>
                   <button onClick={() => setIsGenModalOpen(false)} className="text-zinc-500 hover:text-white px-3 py-2 transition-colors">✕</button>
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
                   className="w-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500 hover:opacity-90 text-black py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isGenerating ? <Spinner /> : 'Generate Design'}
                 </button>
               </form>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {isHelpOpen && (
           <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setIsHelpOpen(false)}>
               <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                      <h3 className="font-medium text-white text-sm">Keyboard Shortcuts</h3>
                      <button onClick={() => setIsHelpOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
                      <div>
                          <h4 className="text-zinc-500 uppercase tracking-wider font-bold mb-2 text-[10px]">Tools</h4>
                          <div className="space-y-2">
                              <div className="flex justify-between"><span className="text-zinc-300">Cursor</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">V</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Hand</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">H</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Frame</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">F</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Text</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">T</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Rectangle</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">R</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Circle</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">O</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Pen</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">P</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Pencil</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">⇧P</kbd></div>
                          </div>
                      </div>
                      <div>
                          <h4 className="text-zinc-500 uppercase tracking-wider font-bold mb-2 text-[10px]">Actions</h4>
                          <div className="space-y-2">
                              <div className="flex justify-between"><span className="text-zinc-300">Delete</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">Del</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Copy</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">⌘C</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Paste</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">⌘V</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Deselect</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">Esc</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Zoom In</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">Ctrl +</kbd></div>
                              <div className="flex justify-between"><span className="text-zinc-300">Zoom Out</span> <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-400 font-mono">Ctrl -</kbd></div>
                          </div>
                      </div>
                  </div>
               </div>
           </div>
        )}

        {/* Onboarding Modal */}
        {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}

      </div>

      <ChatWidget />
    </div>
  );
};

export default App;
