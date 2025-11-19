
import React from 'react';
import { MagicIcon, VectorIcon, SparklesIcon, FrameIcon, SquareIcon, CircleIcon, TextIcon, CursorIcon } from './Icons';

interface LandingPageProps {
  onLaunch: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-rose-500/30 selection:text-rose-200 flex flex-col overflow-x-hidden">
      {/* Minimal Nav */}
      <nav className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 lg:px-12 fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[#050505]/60">
        <div className="flex items-center gap-3 font-medium tracking-tight cursor-pointer" onClick={onLaunch}>
          <div className="w-5 h-5 rounded bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500"></div>
          <span className="text-sm text-zinc-300">Genma</span>
        </div>
        <button 
            onClick={onLaunch}
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors tracking-wide"
        >
            Launch App &rarr;
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center pt-32 px-4 relative">
        
        {/* Background Ambience */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-900/10 via-zinc-900/5 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8 mb-16">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm text-[10px] font-medium text-zinc-500 uppercase tracking-wider fade-in slide-in-from-bottom-4 duration-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Gemini 3 Pro Intelligence
           </div>
           
           <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
             Interface design <br/> 
             <span className="text-transparent bg-clip-text bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500">for the intelligence age.</span>
           </h1>
           
           <p className="text-lg text-zinc-500 max-w-lg mx-auto font-light leading-relaxed">
             A native AI design environment. Generate high-fidelity layouts, craft vectors, and modify assets with natural language.
           </p>

           <div className="pt-4">
             <button 
               onClick={onLaunch}
               className="px-8 py-3 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500 text-black rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-[0_0_30px_-10px_rgba(251,146,60,0.3)]"
             >
               Start Creating
             </button>
           </div>
        </div>

        {/* Product Mockup - CSS Implementation of Genma UI */}
        <div className="w-full max-w-6xl h-[600px] bg-[#09090b] border border-zinc-800 rounded-t-xl shadow-2xl relative overflow-hidden select-none group">
            {/* Mockup Header */}
            <div className="h-10 border-b border-zinc-800 flex items-center px-4 justify-between bg-[#09090b]">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                    <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                    <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                </div>
                <div className="text-[10px] text-zinc-600 font-mono">Untitled Design</div>
                <div className="w-16 h-4 bg-zinc-800 rounded-sm"></div>
            </div>
            
            <div className="flex h-full">
                {/* Mockup Left Sidebar */}
                <div className="w-48 border-r border-zinc-800 bg-[#09090b] hidden md:flex flex-col p-3 gap-3">
                    <div className="w-full h-6 bg-zinc-800/50 rounded"></div>
                    <div className="space-y-2 pt-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-zinc-800"></div>
                                <div className="h-2 bg-zinc-900 w-20 rounded-sm"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mockup Canvas */}
                <div className="flex-1 relative bg-[#050505] flex items-center justify-center overflow-hidden">
                    {/* Grid */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    {/* Floating Toolbar Mockup */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-900/80 backdrop-blur p-1 rounded-lg border border-zinc-700/50 shadow-xl z-20">
                         {[CursorIcon, FrameIcon, SquareIcon, CircleIcon, TextIcon, MagicIcon].map((Icon, i) => (
                             <div key={i} className={`w-8 h-8 flex items-center justify-center rounded text-zinc-400 ${i === 0 ? 'bg-zinc-700 text-white' : ''}`}>
                                 <Icon />
                             </div>
                         ))}
                    </div>

                    {/* Design Elements on Canvas */}
                    <div className="relative w-[600px] h-[400px] bg-[#09090b] border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden transition-transform duration-700 group-hover:scale-[1.02] origin-center">
                        <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-6">
                             <div className="w-6 h-6 rounded bg-zinc-800"></div>
                             <div className="flex gap-4">
                                 <div className="w-16 h-2 bg-zinc-800 rounded"></div>
                                 <div className="w-16 h-2 bg-zinc-800 rounded"></div>
                             </div>
                        </div>
                        <div className="flex-1 p-8 flex gap-8 items-center">
                             <div className="flex-1 space-y-4">
                                 <div className="w-32 h-8 bg-zinc-800 rounded"></div>
                                 <div className="w-full h-2 bg-zinc-900 rounded"></div>
                                 <div className="w-2/3 h-2 bg-zinc-900 rounded"></div>
                                 <div className="w-24 h-8 rounded bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500 mt-4"></div>
                             </div>
                             <div className="w-48 h-32 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center">
                                 <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700"></div>
                             </div>
                        </div>
                        {/* AI Cursor Mockup */}
                        <div className="absolute bottom-12 right-12 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500 text-black text-[10px] font-bold px-3 py-1.5 rounded-full rounded-tl-none shadow-lg transform translate-x-2 translate-y-2">
                            Genma is cooking
                        </div>
                    </div>
                </div>

                {/* Mockup Right Sidebar */}
                <div className="w-60 border-l border-zinc-800 bg-[#09090b] hidden lg:flex flex-col p-4 gap-6">
                    <div className="space-y-3">
                        <div className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Layout</div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="h-8 bg-zinc-900 rounded border border-zinc-800"></div>
                            <div className="h-8 bg-zinc-900 rounded border border-zinc-800"></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">Fill</div>
                        <div className="flex gap-2">
                            <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700"></div>
                            <div className="flex-1 h-8 bg-zinc-900 rounded border border-zinc-800"></div>
                        </div>
                    </div>
                    <div className="mt-auto p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                         <div className="flex items-center gap-2 mb-2 text-[10px] text-blue-400 font-bold uppercase">
                             <SparklesIcon /> Assistant
                         </div>
                         <div className="h-12 w-full bg-zinc-900 rounded mb-2"></div>
                         <div className="h-6 w-16 bg-zinc-800 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* Value Props */}
      <section className="py-32 border-t border-zinc-900">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                  <h3 className="text-lg font-medium text-zinc-200">Generative UI</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                      Move beyond templates. Describe your needs and let the engine architect production-ready layouts with perfect hierarchy, spacing, and modern aesthetics.
                  </p>
              </div>
              <div className="space-y-4">
                  <h3 className="text-lg font-medium text-zinc-200">Smart Vectors</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                      Don't hunt for icons. Generate SVG assets directly on the canvas. From simple symbols to complex illustrations, fully editable as paths.
                  </p>
              </div>
              <div className="space-y-4">
                  <h3 className="text-lg font-medium text-zinc-200">Magic Edit</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                      Refine without clicks. Select any element and command changes like "make it pop", "add soft shadows", or "switch to dark mode".
                  </p>
              </div>
          </div>
      </section>

      {/* Technical Section */}
      <section className="py-32 bg-zinc-900/20 border-t border-zinc-900 relative overflow-hidden">
         <div className="max-w-5xl mx-auto px-6 relative z-10">
             <div className="mb-16">
                 <h2 className="text-3xl font-bold tracking-tight text-white mb-4">The Intelligence Layer</h2>
                 <p className="text-zinc-500 max-w-xl">Genma isn't just a wrapper. It's a deeply integrated design environment built on the Google GenAI SDK, leveraging the reasoning capabilities of Gemini 3 Pro.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="p-6 rounded-xl border border-zinc-800 bg-black/50 backdrop-blur">
                     <div className="font-mono text-xs text-blue-400 mb-4">services/geminiService.ts</div>
                     <div className="font-mono text-[10px] text-zinc-500 leading-loose">
                        <span className="text-purple-400">const</span> design = <span className="text-purple-400">await</span> ai.models.generateContent&#123;<br/>
                        &nbsp;&nbsp;model: <span className="text-green-400">'gemini-3-pro-preview'</span>,<br/>
                        &nbsp;&nbsp;config: &#123;<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;thinkingConfig: &#123; budget: <span className="text-orange-400">2048</span> &#125;,<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;systemInstruction: <span className="text-green-400">'You are a World-Class Designer...'</span><br/>
                        &nbsp;&nbsp;&#125;<br/>
                        &#125;;
                     </div>
                 </div>
                 <div className="flex flex-col justify-center space-y-6">
                     <div className="flex gap-4 items-start">
                         <div className="w-8 h-8 rounded flex items-center justify-center bg-zinc-800 text-white shrink-0"><MagicIcon /></div>
                         <div>
                             <h4 className="text-sm font-medium text-white">Reasoning Engine</h4>
                             <p className="text-xs text-zinc-500 mt-1 leading-relaxed">The model plans layouts pixel-by-pixel, calculating constraints before generating the render tree.</p>
                         </div>
                     </div>
                     <div className="flex gap-4 items-start">
                         <div className="w-8 h-8 rounded flex items-center justify-center bg-zinc-800 text-white shrink-0"><VectorIcon /></div>
                         <div>
                             <h4 className="text-sm font-medium text-white">Multimodal Context</h4>
                             <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Understand images, vectors, and code simultaneously to maintain design system consistency.</p>
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-24 text-center border-t border-zinc-900 bg-[#050505]">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-8">Ready to build?</h2>
          <button 
            onClick={onLaunch}
            className="px-6 py-2 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-400 to-rose-500 text-black font-medium rounded text-sm hover:opacity-90 transition-opacity"
          >
            Launch Genma
          </button>
          <div className="mt-12 text-[10px] text-zinc-700 font-mono uppercase tracking-widest">
              v1.0.0 • Powered by Gemini • 2025
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;
