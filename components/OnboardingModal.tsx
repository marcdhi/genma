
import React, { useState } from 'react';
import { MagicIcon, VectorIcon, SparklesIcon } from './Icons';

interface OnboardingModalProps {
  onClose: () => void;
}

const steps = [
  {
    title: "Welcome to Genma",
    description: "Your new AI-native design environment. Craft interfaces, icons, and interactions at the speed of thought.",
    icon: (
      <div className="w-24 h-24 rounded-2xl bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500 shadow-[0_0_40px_-10px_rgba(251,146,60,0.4)] flex items-center justify-center transform transition-transform hover:scale-105 duration-500">
         <span className="text-4xl font-bold text-black tracking-tighter">Gn</span>
      </div>
    )
  },
  {
    title: "Generative UI",
    description: "Describe your dream interface. Genma architects high-fidelity layouts with auto-layout, typography, and modern styling.",
    icon: (
       <div className="relative w-32 h-24 bg-zinc-900 rounded-lg border border-zinc-800 p-2 flex flex-col gap-2 shadow-2xl transform rotate-2 transition-transform duration-700 hover:rotate-0">
          <div className="w-full h-2 bg-zinc-800 rounded-full mb-1"/>
          <div className="flex gap-2 h-full">
             <div className="w-8 h-full bg-zinc-800/50 rounded border border-zinc-800/50"/>
             <div className="flex-1 space-y-2">
                 <div className="w-full h-8 bg-zinc-800/80 rounded border border-zinc-800/50"/>
                 <div className="flex gap-1">
                    <div className="w-1/2 h-4 bg-zinc-800/50 rounded"/>
                    <div className="w-1/2 h-4 bg-zinc-800/50 rounded"/>
                 </div>
             </div>
          </div>
          <div className="absolute -right-3 -bottom-3 bg-zinc-900 p-1.5 rounded-lg border border-zinc-700 text-blue-400 shadow-lg">
             <MagicIcon />
          </div>
       </div>
    )
  },
  {
    title: "Smart Vectors",
    description: "Need an icon? Just ask. Generate editable SVG paths directly on the canvas. No more hunting for assets.",
    icon: (
        <div className="relative w-32 h-32 flex items-center justify-center bg-zinc-900/30 rounded-full border border-zinc-800/50">
             <svg viewBox="0 0 100 100" className="w-20 h-20 text-zinc-500 stroke-current stroke-[1.5] fill-none overflow-visible">
                 <path d="M20,80 Q50,10 80,80" className="animate-[dash_3s_linear_infinite]" strokeDasharray="100" strokeDashoffset="100" />
                 <circle cx="20" cy="80" r="3" className="fill-blue-500 stroke-none"/>
                 <circle cx="50" cy="10" r="3" className="fill-white stroke-blue-500"/>
                 <circle cx="80" cy="80" r="3" className="fill-blue-500 stroke-none"/>
                 <line x1="20" y1="80" x2="50" y2="10" className="stroke-blue-500/30 stroke-[1]"/>
                 <line x1="80" y1="80" x2="50" y2="10" className="stroke-blue-500/30 stroke-[1]"/>
             </svg>
             <div className="absolute top-0 right-0 text-white bg-zinc-800 border border-zinc-700 p-2 rounded-full shadow-lg scale-75">
                 <VectorIcon />
             </div>
        </div>
    )
  },
   {
    title: "Magic Edits",
    description: "Select any element and use natural language to modify it. 'Make it rounded', 'Add a retro shadow', or 'Translate to Spanish'.",
    icon: (
        <div className="relative h-24 w-32 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center opacity-30 transform scale-90">
                 <div className="w-20 h-8 border border-dashed border-zinc-600 rounded"></div>
            </div>
            <div className="w-24 h-10 bg-white text-black font-bold text-xs rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center z-10 transform hover:scale-110 transition-transform duration-300">
                Create
            </div>
             <div className="absolute -top-4 -right-4 text-rose-500 animate-pulse scale-125">
                 <SparklesIcon />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 bg-[radial-gradient(circle,_rgba(251,146,60,0.2)_0%,_transparent_70%)] pointer-events-none"></div>
        </div>
    )
  }
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
   const [step, setStep] = useState(0);

   const handleNext = () => {
       if (step < steps.length - 1) {
           setStep(step + 1);
       } else {
           onClose();
       }
   };

   return (
       <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-[#09090b] border border-zinc-800 rounded-2xl w-full max-w-[420px] overflow-hidden shadow-2xl relative flex flex-col">
               {/* Progress Bar */}
               <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full z-10">
                   <div 
                     className="h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500 transition-all duration-500 ease-out"
                     style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                   />
               </div>

               <div className="p-8 flex flex-col items-center text-center flex-1 min-h-[400px] justify-center relative">
                   {/* Animated Background Glow */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-zinc-800/20 to-transparent rounded-full blur-3xl pointer-events-none" />

                   <div className="flex-1 flex items-center justify-center w-full mb-8 relative z-10">
                       <div key={`icon-${step}`} className="animate-in zoom-in-90 fade-in duration-500">
                           {steps[step].icon}
                       </div>
                   </div>
                   
                   <div key={`text-${step}`} className="space-y-3 mb-4 animate-in slide-in-from-bottom-2 fade-in duration-500 relative z-10">
                       <h2 className="text-2xl font-bold text-white tracking-tight">{steps[step].title}</h2>
                       <p className="text-sm text-zinc-500 leading-relaxed max-w-[280px] mx-auto font-medium">
                           {steps[step].description}
                       </p>
                   </div>
               </div>

               <div className="p-6 border-t border-zinc-900 bg-zinc-900/30 flex justify-between items-center backdrop-blur-sm">
                   <button 
                     onClick={onClose}
                     className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-2"
                   >
                       Skip Intro
                   </button>
                   
                   <button 
                     onClick={handleNext}
                     className="px-6 py-2.5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500 text-black text-xs font-bold rounded-lg shadow-lg hover:opacity-90 transition-all transform active:scale-95 flex items-center gap-2"
                   >
                       {step === steps.length - 1 ? 'Start Creating' : 'Next'}
                   </button>
               </div>
           </div>
       </div>
   );
};

export default OnboardingModal;
