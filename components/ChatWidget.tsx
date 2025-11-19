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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl flex flex-col overflow-hidden">
          <div className="p-3 bg-[#2c2c2c] border-b border-[#333] flex justify-between items-center">
            <span className="text-xs font-bold text-white">Genma Assistant</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-xs mt-10">
                Ask me anything about your design or general questions.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded p-2 text-xs ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#333] text-gray-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-gray-500 text-xs">Gemini is thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-[#333] bg-[#2c2c2c]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Gemini..."
              className="w-full bg-[#1e1e1e] text-white text-xs rounded p-2 border border-[#444] focus:outline-none focus:border-blue-500"
            />
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
      >
        <ChatIcon />
      </button>
    </div>
  );
};

export default ChatWidget;
