
import React, { useState, useRef, useEffect } from 'react';
import { ChatIcon, Spinner } from './Icons';
import { ChatMessage } from '../types';
import { chatWithGemini } from '../services/geminiService';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await chatWithGemini(messages, input);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to Gemini." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-80 h-[450px] bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 backdrop-blur">
            <span className="text-sm font-medium text-white">Assistant</span>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-zinc-600 text-xs mt-12 px-4">
                I can help you brainstorm ideas, write copy, or understand design principles.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'bg-zinc-100 text-black font-medium' : 'bg-zinc-800 text-zinc-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-zinc-500 text-xs ml-2">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800 bg-[#09090b]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Gemini..."
              className="w-full bg-zinc-900 text-white text-xs rounded-md p-2.5 border border-zinc-800 focus:outline-none focus:border-zinc-600 placeholder-zinc-600"
            />
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-white hover:bg-zinc-200 text-black rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
      >
        <ChatIcon />
      </button>
    </div>
  );
};

export default ChatWidget;
