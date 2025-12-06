import React, { useState } from 'react';
import { CanvasElement, ElementType } from '../../types';
import { FrameIcon, SquareIcon, CircleIcon, TextIcon, ImageIcon, LockIcon } from '../Icons';

interface LayersPanelProps {
  elements: CanvasElement[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  draggedLayerId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  onLayerNameChange: (id: string, newName: string) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedIds,
  setSelectedIds,
  draggedLayerId,
  onDragStart,
  onDragOver,
  onDrop,
  renamingId,
  setRenamingId,
  onLayerNameChange,
}) => {
  return (
    <div className="w-52 bg-[#09090b] border-r border-zinc-800 flex flex-col z-10">
      <div className="h-10 flex items-center px-4 border-b border-zinc-800/50">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Layers</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {[...elements].reverse().map(el => (
          <div 
            key={el.id}
            draggable
            onDragStart={(e) => onDragStart(e, el.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, el.id)}
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
                onKeyDown={(e) => { if(e.key === 'Enter') { onLayerNameChange(el.id, e.currentTarget.value); setRenamingId(null); }}}
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
  );
};

export default LayersPanel;

