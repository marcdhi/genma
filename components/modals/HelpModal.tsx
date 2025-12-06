import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h3 className="font-medium text-white text-sm">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
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
  );
};

export default HelpModal;

