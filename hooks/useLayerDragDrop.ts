import { useState } from 'react';
import { CanvasElement } from '../types';

export const useLayerDragDrop = (elements: CanvasElement[], setElements: (elements: CanvasElement[]) => void) => {
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);

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

  return {
    draggedLayerId,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
};

