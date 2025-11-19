import React, { useRef, useEffect, useState } from 'react';
import { CanvasElement, ElementType } from '../types';
import { LockIcon } from './Icons';

interface CanvasProps {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  scale: number;
  setScale: (s: number) => void;
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se';

const SNAP_THRESHOLD = 5;

const Canvas: React.FC<CanvasProps> = ({ elements, selectedIds, onSelect, onUpdateElement, scale, setScale }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [snapLines, setSnapLines] = useState<{ vertical?: number, horizontal?: number }>({});
  
  // Rubber band selection
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);

  // Dragging state
  const dragRef = useRef<{ 
    startX: number; 
    startY: number; 
    elements: { id: string; originalX: number; originalY: number }[];
  } | null>(null);

  // Panning state
  const panRef = useRef<{ startX: number, startY: number, initialOffsetX: number, initialOffsetY: number } | null>(null);

  // Resizing state
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
    originalW: number;
    originalH: number;
    handle: HandleType;
    id: string;
  } | null>(null);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale
    };
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (e.button === 1 || (e.button === 0 && e.shiftKey && !isSelecting)) {
        // Middle click or shift+click (if not multi-selecting items) could be pan, but standard is Space+Drag for pan.
        // Here we let Shift+Click be multi-select.
    }
    
    // Pan check
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initialOffsetX: offset.x,
          initialOffsetY: offset.y
        };
        return;
    }

    if (e.button !== 0) return;

    const element = elements.find(el => el.id === id);
    if (!element) return;

    // Handle Multi-Select
    let newSelectedIds = [...selectedIds];
    if (e.shiftKey) {
        if (newSelectedIds.includes(id)) {
            newSelectedIds = newSelectedIds.filter(sid => sid !== id);
        } else {
            newSelectedIds.push(id);
        }
    } else {
        if (!newSelectedIds.includes(id)) {
            newSelectedIds = [id];
        }
    }
    
    onSelect(newSelectedIds);

    // Initiate Drag if element is not locked
    if (!element.locked) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        
        // Gather all draggable elements (selected + children of frames if applicable)
        // Simplified: Just move selected elements. 
        // TODO: Add recursive frame moving if frame is selected.
        
        const draggingElements = elements.filter(el => newSelectedIds.includes(el.id) && !el.locked).map(el => ({
            id: el.id,
            originalX: el.x,
            originalY: el.y
        }));

        // If a Frame is selected, also move its children visually? 
        // The previous implementation handled child moving via logic inside mouseMove. 
        // Let's stick to moving explicitly selected items for now to fix "broken layering" confusion,
        // OR re-implement the frame logic cleanly.
        // Better: If I select a Frame, I move the Frame. Children should follow if they are spatially inside.
        // For multi-select, we just move what is selected.
        
        // Re-adding Frame Logic: If a selected item is a Frame, find its children and add them to drag if not already selected.
        const frameIds = elements.filter(el => newSelectedIds.includes(el.id) && el.type === ElementType.FRAME).map(el => el.id);
        if (frameIds.length > 0) {
             elements.forEach(child => {
                 if (newSelectedIds.includes(child.id)) return; // already handled
                 // Check containment
                 const parentFrame = elements.find(f => frameIds.includes(f.id));
                 if (parentFrame) {
                     const cx = child.x + child.width / 2;
                     const cy = child.y + child.height / 2;
                     if (cx > parentFrame.x && cx < parentFrame.x + parentFrame.width &&
                         cy > parentFrame.y && cy < parentFrame.y + parentFrame.height) {
                             draggingElements.push({
                                 id: child.id,
                                 originalX: child.x,
                                 originalY: child.y
                             });
                         }
                 }
             });
        }

        dragRef.current = {
            startX: coords.x,
            startY: coords.y,
            elements: draggingElements
        };
    }
  };

  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialOffsetX: offset.x,
        initialOffsetY: offset.y
      };
      return;
    }
    
    // Start Selection Box
    if (e.button === 0) {
        setIsSelecting(true);
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setSelectionBox({
            startX: coords.x,
            startY: coords.y,
            endX: coords.x,
            endY: coords.y
        });
        if (!e.shiftKey) onSelect([]);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, id: string, handle: HandleType) => {
    e.stopPropagation();
    e.preventDefault();
    const element = elements.find(el => el.id === id);
    if (element && !element.locked) {
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originalX: element.x,
        originalY: element.y,
        originalW: element.width,
        originalH: element.height,
        handle,
        id
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panRef.current) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        setOffset({
            x: panRef.current.initialOffsetX + dx,
            y: panRef.current.initialOffsetY + dy
        });
        return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Handle Selection Box
    if (isSelecting && selectionBox) {
        setSelectionBox(prev => prev ? ({ ...prev, endX: coords.x, endY: coords.y }) : null);
        return;
    }

    // Handle Resize
    if (resizeRef.current) {
      const { startX, startY, originalX, originalY, originalW, originalH, handle, id } = resizeRef.current;
      const dx = (e.clientX - startX) / scale;
      const dy = (e.clientY - startY) / scale;

      let newX = originalX;
      let newY = originalY;
      let newW = originalW;
      let newH = originalH;

      if (handle.includes('e')) newW = originalW + dx;
      if (handle.includes('w')) { newX = originalX + dx; newW = originalW - dx; }
      if (handle.includes('s')) newH = originalH + dy;
      if (handle.includes('n')) { newY = originalY + dy; newH = originalH - dy; }

      if (newW < 10) newW = 10;
      if (newH < 10) newH = 10;

      onUpdateElement(id, { x: newX, y: newY, width: newW, height: newH });
      return;
    }

    // Handle Move
    if (dragRef.current) {
      const dx = coords.x - dragRef.current.startX;
      const dy = coords.y - dragRef.current.startY;
      
      // Simple snapping for the primary selected element (first in list)
      // We calculate snap delta based on the FIRST element in drag list to keep it simple
      const primaryElState = dragRef.current.elements[0];
      if (!primaryElState) return;
      
      let finalDx = dx;
      let finalDy = dy;
      
      // Snap Logic (Simplified for multi-drag: snap the primary item)
      const targetX = primaryElState.originalX + dx;
      const targetY = primaryElState.originalY + dy;
      let snapX: number | undefined = undefined;
      let snapY: number | undefined = undefined;
      
      // Find primary element dimensions
      const primaryEl = elements.find(el => el.id === primaryElState.id);
      
      if (primaryEl) {
          // Iterate over NON-dragging elements for snap targets
          const draggingIds = dragRef.current.elements.map(d => d.id);
          elements.forEach(other => {
              if (draggingIds.includes(other.id)) return;
              
              const otherRight = other.x + other.width;
              const otherBottom = other.y + other.height;
              const myW = primaryEl.width;
              const myH = primaryEl.height;

               // Horizontal
               if (Math.abs(targetX - other.x) < SNAP_THRESHOLD) { finalDx = other.x - primaryElState.originalX; snapX = other.x; }
               else if (Math.abs(targetX - otherRight) < SNAP_THRESHOLD) { finalDx = otherRight - primaryElState.originalX; snapX = otherRight; }
               
               // Vertical
               if (Math.abs(targetY - other.y) < SNAP_THRESHOLD) { finalDy = other.y - primaryElState.originalY; snapY = other.y; }
               else if (Math.abs(targetY - otherBottom) < SNAP_THRESHOLD) { finalDy = otherBottom - primaryElState.originalY; snapY = otherBottom; }
          });
      }

      setSnapLines({ vertical: snapX, horizontal: snapY });

      // Apply delta to ALL dragging elements
      dragRef.current.elements.forEach(elState => {
          onUpdateElement(elState.id, {
              x: elState.originalX + finalDx,
              y: elState.originalY + finalDy
          });
      });
    }
  };

  const handleMouseUp = () => {
    // Finalize selection box
    if (isSelecting && selectionBox) {
        const x1 = Math.min(selectionBox.startX, selectionBox.endX);
        const x2 = Math.max(selectionBox.startX, selectionBox.endX);
        const y1 = Math.min(selectionBox.startY, selectionBox.endY);
        const y2 = Math.max(selectionBox.startY, selectionBox.endY);
        
        const foundIds = elements.filter(el => 
            el.x >= x1 && el.x + el.width <= x2 && 
            el.y >= y1 && el.y + el.height <= y2
        ).map(el => el.id);
        
        onSelect(foundIds);
    }

    dragRef.current = null;
    resizeRef.current = null;
    setIsPanning(false);
    setIsSelecting(false);
    setSelectionBox(null);
    panRef.current = null;
    setSnapLines({});
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = -e.deltaY;
          const newScale = Math.min(Math.max(scale + delta * 0.001, 0.1), 5);
          setScale(newScale);
      } else {
          setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isSelecting, selectionBox]);

  return (
    <div 
      className="flex-1 bg-[#0e0e0e] relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseDown={handleBgMouseDown}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      <div 
        ref={canvasRef}
        className="absolute top-0 left-0 transform-origin-top-left will-change-transform"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        {/* Grid */}
        <div style={{ position: 'absolute', top: -20000, left: -20000, width: 40000, height: 40000, 
            backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

        {elements.map(el => {
            const isSelected = selectedIds.includes(el.id);
            
            return (
            <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                onClick={(e) => e.stopPropagation()} 
                style={{
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    transform: `rotate(${el.rotation}deg)`,
                    opacity: el.opacity,
                    cursor: isPanning ? 'grabbing' : 'default',
                    zIndex: isSelected ? 100 : (el.type === ElementType.FRAME ? 0 : 10),
                    pointerEvents: 'all'
                }}
                className="group"
            >
                {/* Label */}
                {(isSelected || !isPanning) && (
                    <div className={`absolute -top-5 left-0 text-[10px] select-none whitespace-nowrap pointer-events-none flex items-center gap-1
                        ${isSelected ? 'text-blue-400' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}>
                        {el.name} {el.locked && <LockIcon />}
                    </div>
                )}

                {/* Visuals */}
                <div 
                    style={{
                        width: '100%', height: '100%',
                        backgroundColor: el.type === ElementType.FRAME ? (el.fill === 'transparent' ? 'rgba(255,255,255,0.02)' : el.fill) : (el.type === ElementType.RECTANGLE || el.type === ElementType.CIRCLE) ? el.fill : 'transparent',
                        border: el.type === ElementType.FRAME ? `1px dashed ${isSelected ? '#3b82f6' : '#444'}` : 'none',
                        borderRadius: el.type === ElementType.CIRCLE ? '50%' : `${el.borderRadius}px`,
                        overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isSelected ? '0 0 0 1px #3b82f6' : 'none',
                    }}
                >
                    {el.type === ElementType.TEXT && (
                        <div style={{ 
                            color: el.fill, fontSize: `${el.fontSize || 14}px`, fontFamily: el.fontFamily || 'Inter, sans-serif', fontWeight: el.fontWeight || '400',
                            width: '100%', height: '100%', padding: '4px', whiteSpace: 'pre-wrap', lineHeight: 1.4
                        }}>
                            {el.content || "Text"}
                        </div>
                    )}
                    
                    {el.type === ElementType.IMAGE && (
                         el.content ? <img src={el.content} alt={el.name} className="w-full h-full object-cover" /> 
                         : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600 text-xs">Generating Image...</div>
                    )}

                    {el.type === ElementType.VIDEO && el.content && (
                        <video src={el.content} autoPlay loop muted className="w-full h-full object-cover" />
                    )}

                    {el.type === ElementType.PATH && el.content && (
                        <svg width="100%" height="100%" viewBox="0 0 24 24" preserveAspectRatio="none">
                             <path d={el.content} fill={el.fill} stroke={el.stroke} />
                        </svg>
                    )}
                </div>

                {/* Selection Ring / Handles */}
                {isSelected && !el.locked && (
                <>
                    <div className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-white border border-blue-500 cursor-nw-resize z-50" onMouseDown={(e) => handleResizeStart(e, el.id, 'nw')}/>
                    <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white border border-blue-500 cursor-ne-resize z-50" onMouseDown={(e) => handleResizeStart(e, el.id, 'ne')}/>
                    <div className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-white border border-blue-500 cursor-sw-resize z-50" onMouseDown={(e) => handleResizeStart(e, el.id, 'sw')}/>
                    <div className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-white border border-blue-500 cursor-se-resize z-50" onMouseDown={(e) => handleResizeStart(e, el.id, 'se')}/>
                </>
                )}
            </div>
            );
        })}

        {/* Selection Box */}
        {isSelecting && selectionBox && (
            <div style={{
                position: 'absolute',
                left: Math.min(selectionBox.startX, selectionBox.endX),
                top: Math.min(selectionBox.startY, selectionBox.endY),
                width: Math.abs(selectionBox.endX - selectionBox.startX),
                height: Math.abs(selectionBox.endY - selectionBox.startY),
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid #3b82f6',
                pointerEvents: 'none',
                zIndex: 9999
            }} />
        )}

        {/* Snap Guides */}
        {snapLines.vertical !== undefined && <div className="absolute top-[-5000px] bottom-[-5000px] w-[1px] bg-red-500 pointer-events-none z-[200]" style={{ left: snapLines.vertical }} />}
        {snapLines.horizontal !== undefined && <div className="absolute left-[-5000px] right-[-5000px] h-[1px] bg-red-500 pointer-events-none z-[200]" style={{ top: snapLines.horizontal }} />}
      </div>
    </div>
  );
};

export default Canvas;