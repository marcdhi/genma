
import React, { useRef, useEffect, useState } from 'react';
import { CanvasElement, ElementType } from '../types';
import { LockIcon } from './Icons';

interface CanvasProps {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onAddElement: (element: Partial<CanvasElement>) => void;
  scale: number;
  setScale: (s: number) => void;
  activeTool?: 'cursor' | 'hand' | 'rect' | 'circle' | 'text' | 'frame' | 'pen' | 'pencil';
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se';

const SNAP_THRESHOLD = 5;

// Noise texture data URI (subtle grain)
const NOISE_PATTERN = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E";

const Canvas: React.FC<CanvasProps> = ({ elements, selectedIds, onSelect, onUpdateElement, onAddElement, scale, setScale, activeTool }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [snapLines, setSnapLines] = useState<{ vertical?: number, horizontal?: number }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Rubber band selection
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPath, setDrawingPath] = useState<{x: number, y: number}[]>([]);

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

  const isHandTool = activeTool === 'hand';
  const isDrawTool = activeTool === 'pen' || activeTool === 'pencil';

  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale
    };
  };

  const finishPath = () => {
      if (drawingPath.length < 2) {
          setDrawingPath([]);
          setIsDrawing(false);
          return;
      }

      // Calculate bounding box
      const xs = drawingPath.map(p => p.x);
      const ys = drawingPath.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);

      // Normalize path data
      const d = drawingPath.map((p, i) => 
          `${i === 0 ? 'M' : 'L'} ${p.x - minX} ${p.y - minY}`
      ).join(' ');

      onAddElement({
          x: minX,
          y: minY,
          width,
          height,
          content: d,
          type: ElementType.PATH,
          stroke: '#ffffff', // Default stroke
          fill: 'transparent'
      });

      setDrawingPath([]);
      setIsDrawing(false);
  };

  const handleMouseDown = (e: React.MouseEvent, id?: string) => {
    e.preventDefault(); // Critical: Prevents browser native drag
    
    // Pan check
    if (isHandTool || e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initialOffsetX: offset.x,
          initialOffsetY: offset.y
        };
        return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Drawing Logic
    if (activeTool === 'pencil') {
        setIsDrawing(true);
        setDrawingPath([{ x: coords.x, y: coords.y }]);
        return;
    }
    
    if (activeTool === 'pen') {
        if (!isDrawing) setIsDrawing(true);
        setDrawingPath(prev => [...prev, { x: coords.x, y: coords.y }]);
        return;
    }

    if (e.button !== 0) return;

    // Editing text check
    if (editingId && editingId !== id) {
        setEditingId(null);
    }
    if (editingId === id) return;

    // If clicking background and not special tool -> Selection Box
    if (!id) {
        setIsSelecting(true);
        setSelectionBox({
            startX: coords.x,
            startY: coords.y,
            endX: coords.x,
            endY: coords.y
        });
        if (!e.shiftKey) onSelect([]);
        return;
    }

    e.stopPropagation(); // Stop bubbling to background

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
        const draggingElements = elements.filter(el => newSelectedIds.includes(el.id) && !el.locked).map(el => ({
            id: el.id,
            originalX: el.x,
            originalY: el.y
        }));

        // Frame containment logic (simplified)
        const frameIds = elements.filter(el => newSelectedIds.includes(el.id) && el.type === ElementType.FRAME).map(el => el.id);
        if (frameIds.length > 0) {
             elements.forEach(child => {
                 if (newSelectedIds.includes(child.id)) return; 
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

  const handleDoubleClick = (e: React.MouseEvent, id?: string) => {
      e.stopPropagation();

      // Pen tool finish
      if (activeTool === 'pen') {
          finishPath();
          return;
      }

      if (!id) return;
      const element = elements.find(el => el.id === id);
      if (element && element.type === ElementType.TEXT && !element.locked) {
          setEditingId(id);
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
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Pencil drawing
    if (activeTool === 'pencil' && isDrawing) {
        setDrawingPath(prev => [...prev, { x: coords.x, y: coords.y }]);
        return;
    }

    if (isPanning && panRef.current) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        setOffset({
            x: panRef.current.initialOffsetX + dx,
            y: panRef.current.initialOffsetY + dy
        });
        return;
    }

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
      
      const draggingIds = dragRef.current.elements.map(d => d.id);
      const primaryElState = dragRef.current.elements[0];
      
      let finalDx = dx;
      let finalDy = dy;
      
      let snapX: number | undefined = undefined;
      let snapY: number | undefined = undefined;
      
      const primaryEl = elements.find(el => el.id === primaryElState.id);
      
      if (primaryEl) {
          // Current candidate position
          const currentX = primaryElState.originalX + dx;
          const currentY = primaryElState.originalY + dy;
          const { width, height } = primaryEl;

          // Snap calculation state
          let minDiffX = SNAP_THRESHOLD + 1;
          let minDiffY = SNAP_THRESHOLD + 1;

          elements.forEach(other => {
              if (draggingIds.includes(other.id)) return;

              // X Axis Snapping (Left, Center, Right)
              const xTargets = [other.x, other.x + other.width / 2, other.x + other.width];
              const xSources = [currentX, currentX + width / 2, currentX + width];
              
              xSources.forEach((source) => {
                  xTargets.forEach(target => {
                      const diff = target - source;
                      if (Math.abs(diff) < Math.abs(minDiffX)) {
                          minDiffX = diff;
                          snapX = target;
                      }
                  });
              });

              // Y Axis Snapping (Top, Center, Bottom)
              const yTargets = [other.y, other.y + other.height / 2, other.y + other.height];
              const ySources = [currentY, currentY + height / 2, currentY + height];

              ySources.forEach((source) => {
                  yTargets.forEach(target => {
                      const diff = target - source;
                      if (Math.abs(diff) < Math.abs(minDiffY)) {
                          minDiffY = diff;
                          snapY = target;
                      }
                  });
              });
          });

          // Apply Object Snap
          if (Math.abs(minDiffX) <= SNAP_THRESHOLD) {
              finalDx = dx + minDiffX;
          } else {
              // Fallback: Grid Snap (10px)
              const gridSnapDiffX = (Math.round(currentX / 10) * 10) - currentX;
              if (Math.abs(gridSnapDiffX) <= SNAP_THRESHOLD) {
                  finalDx = dx + gridSnapDiffX;
              }
              snapX = undefined; // Hide line for grid snap
          }

          if (Math.abs(minDiffY) <= SNAP_THRESHOLD) {
              finalDy = dy + minDiffY;
          } else {
              // Fallback: Grid Snap (10px)
              const gridSnapDiffY = (Math.round(currentY / 10) * 10) - currentY;
              if (Math.abs(gridSnapDiffY) <= SNAP_THRESHOLD) {
                  finalDy = dy + gridSnapDiffY;
              }
              snapY = undefined; // Hide line for grid snap
          }
      }

      setSnapLines({ vertical: snapX, horizontal: snapY });

      dragRef.current.elements.forEach(elState => {
          onUpdateElement(elState.id, {
              x: elState.originalX + finalDx,
              y: elState.originalY + finalDy
          });
      });
    }
  };

  const handleMouseUp = () => {
    if (activeTool === 'pencil' && isDrawing) {
        finishPath();
    }
    
    // Only update selection if we were actually selecting
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

  // Stable event listener attachment
  const mouseUpRef = useRef(handleMouseUp);
  mouseUpRef.current = handleMouseUp;

  useEffect(() => {
    const fn = () => mouseUpRef.current();
    window.addEventListener('mouseup', fn);
    return () => window.removeEventListener('mouseup', fn);
  }, []);

  return (
    <div 
      className="flex-1 bg-[#09090b] relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseDown={(e) => handleMouseDown(e)}
      onDoubleClick={(e) => handleDoubleClick(e)}
      onWheel={handleWheel}
      style={{ 
          cursor: isPanning ? 'grabbing' : (isHandTool ? 'grab' : (isDrawTool ? 'crosshair' : 'default')),
          userSelect: 'none'
      }}
    >
      <div 
        ref={canvasRef}
        className="absolute top-0 left-0 transform-origin-top-left will-change-transform"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        {/* Grid */}
        <div style={{ position: 'absolute', top: -20000, left: -20000, width: 40000, height: 40000, 
            backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none', opacity: 0.3 }} />

        {/* 1. Render Content Elements */}
        {elements.map(el => {
            const isSelected = selectedIds.includes(el.id);
            const isEditing = editingId === el.id;
            const shadowStyle = el.shadow ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color}` : 'none';
            const filterStyle = el.blur ? `blur(${el.blur}px)` : 'none';
            const isText = el.type === ElementType.TEXT;
            
            return (
            <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                onDoubleClick={(e) => handleDoubleClick(e, el.id)}
                onClick={(e) => e.stopPropagation()} 
                style={{
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    transform: `rotate(${el.rotation}deg)`,
                    opacity: el.opacity,
                    cursor: isPanning ? 'grabbing' : (isHandTool ? 'grab' : (isDrawTool ? 'crosshair' : (isEditing ? 'text' : 'default'))),
                    zIndex: isEditing ? 100 : (el.type === ElementType.FRAME ? 0 : 10),
                    pointerEvents: isDrawTool ? 'none' : 'all', // Click through when drawing
                }}
                className="group"
            >
                {/* Hover Label */}
                {!isSelected && !isHandTool && !isDrawTool && !isEditing && (
                    <div className="absolute -top-5 left-0 text-[10px] select-none whitespace-nowrap pointer-events-none flex items-center gap-1
                        text-zinc-500 opacity-0 group-hover:opacity-100">
                        {el.name} {el.locked && <LockIcon />}
                    </div>
                )}

                {/* Visuals Container */}
                <div 
                    style={{
                        width: '100%', height: '100%',
                        background: el.type === ElementType.FRAME ? (el.fill === 'transparent' ? 'rgba(255,255,255,0.01)' : el.fill) : (el.type === ElementType.RECTANGLE || el.type === ElementType.CIRCLE ? el.fill : 'transparent'),
                        border: el.type === ElementType.FRAME ? '1px dashed #333' : 'none',
                        borderRadius: el.type === ElementType.CIRCLE ? '50%' : `${el.borderRadius}px`,
                        overflow: 'visible',
                        display: 'flex', 
                        alignItems: isText ? 'flex-start' : 'center', 
                        justifyContent: 'center',
                        boxShadow: shadowStyle,
                        filter: filterStyle,
                    }}
                >
                    {/* Noise Overlay */}
                    {el.noise && (
                        <div style={{
                            position: 'absolute', inset: 0, 
                            backgroundImage: `url("${NOISE_PATTERN}")`,
                            opacity: el.noise,
                            borderRadius: el.type === ElementType.CIRCLE ? '50%' : `${el.borderRadius}px`,
                            pointerEvents: 'none'
                        }} />
                    )}

                    {isText && (
                        isEditing ? (
                            <textarea 
                                autoFocus
                                value={el.content}
                                onChange={(e) => onUpdateElement(el.id, { content: e.target.value })}
                                onBlur={() => setEditingId(null)}
                                onMouseDown={(e) => e.stopPropagation()} 
                                style={{
                                    color: el.fill.startsWith('linear-gradient') ? 'transparent' : el.fill, 
                                    backgroundImage: el.fill.startsWith('linear-gradient') ? el.fill : 'none',
                                    backgroundClip: el.fill.startsWith('linear-gradient') ? 'text' : 'border-box',
                                    WebkitBackgroundClip: el.fill.startsWith('linear-gradient') ? 'text' : 'border-box',
                                    fontSize: `${el.fontSize || 14}px`, fontFamily: el.fontFamily || 'Inter, sans-serif', fontWeight: el.fontWeight || '400',
                                    width: '100%', height: '100%', padding: '4px', lineHeight: 1.4, resize: 'none', background: 'transparent', outline: 'none', border: 'none',
                                    overflow: 'hidden'
                                }}
                            />
                        ) : (
                            <div style={{ 
                                color: el.fill.startsWith('linear-gradient') ? 'transparent' : el.fill, 
                                backgroundImage: el.fill.startsWith('linear-gradient') ? el.fill : 'none',
                                backgroundClip: el.fill.startsWith('linear-gradient') ? 'text' : 'border-box',
                                WebkitBackgroundClip: el.fill.startsWith('linear-gradient') ? 'text' : 'border-box',
                                fontSize: `${el.fontSize || 14}px`, fontFamily: el.fontFamily || 'Inter, sans-serif', fontWeight: el.fontWeight || '400',
                                width: '100%', padding: '4px', whiteSpace: 'pre-wrap', lineHeight: 1.4
                            }}>
                                {el.content || "Text"}
                            </div>
                        )
                    )}
                    
                    {el.type === ElementType.IMAGE && (
                         el.content ? <img src={el.content} alt={el.name} className="w-full h-full object-cover pointer-events-none" style={{ borderRadius: `${el.borderRadius}px` }} /> 
                         : <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">No Image</div>
                    )}

                    {el.type === ElementType.VIDEO && el.content && (
                        <video src={el.content} autoPlay loop muted className="w-full h-full object-cover pointer-events-none" style={{ borderRadius: `${el.borderRadius}px` }} />
                    )}

                    {el.type === ElementType.PATH && el.content && (
                        <svg width="100%" height="100%" viewBox={`0 0 ${el.width} ${el.height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                             <path d={el.content} fill={el.fill} stroke={el.stroke || 'none'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </div>
            </div>
            );
        })}

        {/* Drawing Preview Overlay */}
        {isDrawTool && drawingPath.length > 0 && (
            <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}>
                <svg style={{ overflow: 'visible' }}>
                    <path 
                        d={drawingPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {activeTool === 'pen' && drawingPath.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#3b82f6" strokeWidth="1" />
                    ))}
                </svg>
            </div>
        )}

        {/* 2. Render Selection Overlay (UI Layer) - Always on top */}
        {elements.filter(el => selectedIds.includes(el.id) && !isHandTool && !isDrawTool).map(el => {
             const isEditing = editingId === el.id;
             if (isEditing) return null; 

             return (
                <div
                    key={`overlay-${el.id}`}
                    style={{
                        position: 'absolute',
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        transform: `rotate(${el.rotation}deg)`,
                        pointerEvents: 'none', 
                        zIndex: 999, 
                        boxShadow: '0 0 0 1px #3b82f6', 
                        borderRadius: el.type === ElementType.CIRCLE ? '50%' : `${el.borderRadius}px`
                    }}
                >
                    {/* Active Label */}
                    <div className="absolute -top-5 left-0 text-[10px] select-none whitespace-nowrap pointer-events-none flex items-center gap-1 text-blue-400">
                        {el.name} {el.locked && <LockIcon />}
                    </div>

                    {/* Resize Handles */}
                    {!el.locked && (
                    <>
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-blue-500 cursor-nw-resize z-50 pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, el.id, 'nw')}/>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-blue-500 cursor-ne-resize z-50 pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, el.id, 'ne')}/>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-blue-500 cursor-sw-resize z-50 pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, el.id, 'sw')}/>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-blue-500 cursor-se-resize z-50 pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, el.id, 'se')}/>
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
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
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