import React from 'react';
import { CursorIcon, HandIcon, SquareIcon, CircleIcon, TextIcon, ImageIcon, FrameIcon, MagicIcon, Spinner, HelpIcon, PenIcon, PencilIcon, VectorIcon } from '../Icons';
import { ElementType } from '../../types';

interface HeaderProps {
  activeTool: 'cursor' | 'hand' | 'rect' | 'circle' | 'text' | 'frame' | 'pen' | 'pencil';
  setActiveTool: (tool: 'cursor' | 'hand' | 'rect' | 'circle' | 'text' | 'frame' | 'pen' | 'pencil') => void;
  onAddElement: (type: ElementType) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenGenModal: () => void;
  onOpenVectorModal: () => void;
  onOpenHelp: () => void;
  scale: number;
  setScale: (scale: number) => void;
  isGenerating: boolean;
  genStatus: string;
  onNavigateToLanding: () => void;
}

const Header: React.FC<HeaderProps> = ({
  activeTool,
  setActiveTool,
  onAddElement,
  onImageUpload,
  onOpenGenModal,
  onOpenVectorModal,
  onOpenHelp,
  scale,
  setScale,
  isGenerating,
  genStatus,
  onNavigateToLanding,
}) => {
  return (
    <div className="h-12 bg-[#09090b] border-b border-zinc-800 flex items-center px-4 justify-between z-20 relative">
      {/* Left: Branding */}
      <div className="flex items-center gap-4">
        <div className="font-bold tracking-tight text-zinc-100 text-sm flex items-center gap-2 select-none cursor-pointer" onClick={onNavigateToLanding}>
          <div className="w-5 h-5 rounded-md bg-gradient-brand shadow-sm"></div>
          Genma
        </div>
      </div>
      
      {/* Center: Floating Toolbar */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center gap-0.5 bg-zinc-900/50 backdrop-blur-md p-1 rounded-md border border-zinc-800 shadow-sm">
          <button onClick={() => setActiveTool('cursor')} className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${activeTool === 'cursor' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`} title="Move (V)"><CursorIcon /></button>
          <button onClick={() => setActiveTool('hand')} className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${activeTool === 'hand' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`} title="Hand Tool (H)"><HandIcon /></button>
          <div className="w-px h-4 bg-zinc-800 mx-1"></div>
          <button onClick={() => onAddElement(ElementType.FRAME)} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300" title="Frame (F)"><FrameIcon /></button>
          <button onClick={() => onAddElement(ElementType.RECTANGLE)} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300" title="Rectangle (R)"><SquareIcon /></button>
          <button onClick={() => onAddElement(ElementType.CIRCLE)} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300" title="Circle (O)"><CircleIcon /></button>
          <button onClick={() => onAddElement(ElementType.TEXT)} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300" title="Text (T)"><TextIcon /></button>
          <button onClick={() => setActiveTool('pen')} className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${activeTool === 'pen' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`} title="Pen Tool (P)"><PenIcon /></button>
          <button onClick={() => setActiveTool('pencil')} className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${activeTool === 'pencil' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`} title="Pencil Tool (Shift+P)"><PencilIcon /></button>
          <label className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300 cursor-pointer" title="Image (I)"><ImageIcon /><input type="file" accept="image/*" className="hidden" onChange={onImageUpload} /></label>
          <button onClick={onOpenVectorModal} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300" title="Generate Vector"><VectorIcon /></button>
          <div className="w-px h-4 bg-zinc-800 mx-1"></div>
          <button onClick={onOpenGenModal} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Generate UI"><MagicIcon /></button>
        </div>
      </div>
      
      {/* Right: Zoom/Status */}
      <div className="flex items-center gap-3">
        {isGenerating && <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-wider"><Spinner /> {genStatus}</div>}
        <button onClick={onOpenHelp} className="text-zinc-500 hover:text-zinc-300 p-1"><HelpIcon /></button>
        <div className="flex items-center text-[10px] font-medium text-zinc-500 gap-2">
          <button onClick={() => setScale(Math.max(0.1, scale - 0.1))} className="hover:text-white px-1">-</button>
          <span className="w-8 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(5, scale + 0.1))} className="hover:text-white px-1">+</button>
        </div>
      </div>
    </div>
  );
};

export default Header;

