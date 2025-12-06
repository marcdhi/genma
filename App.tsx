import React, { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import ChatWidget from './components/ChatWidget';
import LandingPage from './components/LandingPage';
import OnboardingModal from './components/OnboardingModal';
import { Header, LayersPanel } from './components/layout';
import { GenModal, VectorModal, HelpModal } from './components/modals';
import { ElementType } from './types';
import { useElements, useModals, useKeyboardShortcuts, useOnboarding, useLayerDragDrop } from './hooks';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTool, setActiveTool] = useState<'cursor' | 'hand' | 'rect' | 'circle' | 'text' | 'frame' | 'pen' | 'pencil'>('cursor');
  const [scale, setScale] = useState(1);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  
  // Custom hooks
  const {
    elements,
    setElements,
    selectedIds,
    setSelectedIds,
    clipboard,
    updateElement,
    addElement: addElementBase,
    handleAddElement,
    deleteSelectedElements,
    copySelectedElements,
    pasteElements,
  } = useElements();

  const {
    isGenModalOpen,
    setIsGenModalOpen,
    isVectorModalOpen,
    setIsVectorModalOpen,
    isHelpOpen,
    setIsHelpOpen,
    closeAllModals,
  } = useModals();

  const { showOnboarding, handleCloseOnboarding } = useOnboarding(view);

  const {
    draggedLayerId,
    handleDragStart,
    handleDragOver,
    handleDrop,
  } = useLayerDragDrop(elements, setElements);

  // Wrapper for addElement that also resets tool
  const addElement = (type: ElementType, content?: string) => {
    addElementBase(type, content);
    setActiveTool('cursor'); 
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    view,
    elements,
    selectedIds,
    clipboard,
    renamingId,
    activeTool,
    setActiveTool,
    addElement,
    deleteSelectedElements,
    copySelectedElements,
    pasteElements,
    updateElement,
    closeAllModals,
    setRenamingId,
  });

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

  const handleLayerNameChange = (id: string, newName: string) => {
    updateElement(id, { name: newName });
  };

  const handleGenerateElements = (newElements: any[]) => {
    setElements(prev => [...prev, ...newElements]);
    const frameIds = newElements.filter(e => e.type === ElementType.FRAME).map(e => e.id);
    setSelectedIds(frameIds);
  };

  const selectedElements = elements.filter(el => selectedIds.includes(el.id));

  if (view === 'landing') {
      return <LandingPage onLaunch={() => setView('app')} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-300 overflow-hidden font-sans selection:bg-zinc-700 selection:text-white">
      
      {/* Header */}
      <Header
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onAddElement={addElement}
        onImageUpload={handleImageUpload}
        onOpenGenModal={() => setIsGenModalOpen(true)}
        onOpenVectorModal={() => setIsVectorModalOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        scale={scale}
        setScale={setScale}
        isGenerating={isGenerating}
        genStatus={genStatus}
        onNavigateToLanding={() => setView('landing')}
      />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Layers Panel */}
        <LayersPanel
          elements={elements}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          draggedLayerId={draggedLayerId}
          onDragStart={handleDragStart}
                onDragOver={handleDragOver}
          onDrop={handleDrop}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
          onLayerNameChange={handleLayerNameChange}
        />

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

        {/* Modals */}
        <GenModal
          isOpen={isGenModalOpen}
          onClose={() => setIsGenModalOpen(false)}
          onGenerate={handleGenerateElements}
          onUpdateElement={updateElement}
          existingElements={elements}
          onGeneratingChange={setIsGenerating}
          onStatusChange={setGenStatus}
        />

        <VectorModal
          isOpen={isVectorModalOpen}
          onClose={() => setIsVectorModalOpen(false)}
          onAddElement={handleAddElement}
          elementsCount={elements.length}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />

        <HelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />

        {/* Onboarding Modal */}
        {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}

      </div>

      <ChatWidget />
    </div>
  );
};

export default App;
