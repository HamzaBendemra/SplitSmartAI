import React, { useState, useEffect } from 'react';
import { ReceiptPanel } from './components/ReceiptPanel';
import { ChatPanel } from './components/ChatPanel';
import { ReceiptData, ChatMessage, AppState, PersonSummary } from './types';
import { parseReceiptImage, updateAssignments } from './services/geminiService';
import { calculateSplits } from './utils/calculations';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [summaries, setSummaries] = useState<PersonSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Recalculate splits whenever receipt data changes
  useEffect(() => {
    if (receiptData) {
      const newSummaries = calculateSplits(receiptData);
      setSummaries(newSummaries);
    }
  }, [receiptData]);

  const handleFileUpload = async (file: File) => {
    setAppState(AppState.PROCESSING_RECEIPT);
    setIsProcessing(true);
    
    // Add temporary message
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: 'Scanning your receipt... this will just take a moment.',
      timestamp: Date.now()
    }]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        try {
          const data = await parseReceiptImage(base64Data, mimeType);
          setReceiptData(data);
          setAppState(AppState.SPLITTING);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: 'I\'ve analyzed the receipt! You can now tell me who ordered what. For example: "Alice had the burger" or "Bob and Charlie shared the nachos".',
            timestamp: Date.now()
          }]);
        } catch (error) {
          console.error(error);
          setAppState(AppState.UPLOAD);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: 'Sorry, I couldn\'t parse that image. Please try uploading a clearer photo.',
            timestamp: Date.now()
          }]);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading error", error);
      setIsProcessing(false);
      setAppState(AppState.UPLOAD);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!receiptData) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const { updatedItems, aiResponseText } = await updateAssignments(receiptData, text);
      
      // Update receipt data with new assignments
      setReceiptData(prev => prev ? { ...prev, items: updatedItems } : null);

      // Add AI response
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Sorry, I had trouble updating the bill. Can you try saying that differently?',
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 overflow-hidden">
      {/* Left Pane: Receipt & Summary */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative z-10 shadow-xl md:shadow-none">
        <ReceiptPanel 
          data={receiptData} 
          summaries={summaries} 
          isLoading={appState === AppState.PROCESSING_RECEIPT}
        />
      </div>

      {/* Right Pane: Chat */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full">
        <ChatPanel 
          appState={appState}
          messages={messages}
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}

export default App;
