import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, AppState } from '../types';
import { Send, Upload, Sparkles, MessageSquare } from 'lucide-react';

interface ChatPanelProps {
  appState: AppState;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  appState, 
  messages, 
  onSendMessage, 
  onFileUpload,
  isProcessing 
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white shadow-sm flex justify-between items-center z-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="text-indigo-600" size={20} />
          Split Assistant
        </h2>
        {appState !== AppState.UPLOAD && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Upload size={14} />
            New Receipt
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {appState === AppState.UPLOAD && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
              <Upload className="text-indigo-400" size={32} />
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-xl font-bold text-slate-700 mb-2">Upload a Receipt</h3>
              <p className="text-slate-500">Take a photo or upload an image of your bill to start splitting costs automatically.</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Upload size={18} />
              Choose Image
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
              }`}
            >
              {msg.role === 'model' && (
                <div className="flex items-center gap-1 text-xs text-indigo-500 font-bold mb-1">
                  <Sparkles size={12} /> AI ASSISTANT
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex justify-start">
             <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={appState === AppState.UPLOAD || isProcessing}
            placeholder={
              appState === AppState.UPLOAD 
                ? "Upload a receipt first..." 
                : "Type e.g., 'Tom had the steak' or 'Share pizza'"
            }
            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing || appState === AppState.UPLOAD}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};
