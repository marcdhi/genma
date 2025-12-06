import { useState } from 'react';
import { CanvasElement, ElementType } from '../types';

export const useElements = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);

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
    return newElement;
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
    return newEl;
  };

  const deleteSelectedElements = () => {
    setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
    setSelectedIds([]);
  };

  const copySelectedElements = () => {
    const toCopy = elements.filter(el => selectedIds.includes(el.id));
    if (toCopy.length > 0) {
      setClipboard(toCopy);
    }
  };

  const pasteElements = () => {
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
  };

  return {
    elements,
    setElements,
    selectedIds,
    setSelectedIds,
    clipboard,
    updateElement,
    addElement,
    handleAddElement,
    deleteSelectedElements,
    copySelectedElements,
    pasteElements,
  };
};

