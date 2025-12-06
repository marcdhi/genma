import { useEffect } from 'react';
import { ElementType } from '../types';

interface UseKeyboardShortcutsProps {
  view: 'landing' | 'app';
  elements: any[];
  selectedIds: string[];
  clipboard: any[];
  renamingId: string | null;
  activeTool: string;
  setActiveTool: (tool: any) => void;
  addElement: (type: ElementType) => void;
  deleteSelectedElements: () => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
  updateElement: (id: string, updates: any) => void;
  closeAllModals: () => void;
  setRenamingId: (id: string | null) => void;
}

export const useKeyboardShortcuts = ({
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
}: UseKeyboardShortcutsProps) => {
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
        closeAllModals();
        setActiveTool('cursor');
        setRenamingId(null);
        return;
      }

      if (isInputActive) return;

      // Copy: Cmd/Ctrl + C
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelectedElements();
        return;
      }

      // Paste: Cmd/Ctrl + V
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteElements();
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
  }, [selectedIds, elements, renamingId, clipboard, view, activeTool, setActiveTool, addElement, deleteSelectedElements, copySelectedElements, pasteElements, updateElement, closeAllModals, setRenamingId]);
};

