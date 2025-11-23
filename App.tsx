import React, { useState, useEffect } from 'react';
import { ReceiptPanel } from './components/ReceiptPanel';
import { ChatPanel } from './components/ChatPanel';
import { ReceiptData, ChatMessage, AppState, PersonSummary, ImageFile } from './types';
import { parseReceiptImage, updateAssignments, getExchangeRate } from './services/geminiService';
import { calculateSplits } from './utils/calculations';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [summaries, setSummaries] = useState<PersonSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Currency handling
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(1);

  // Recalculate splits whenever receipt data changes
  useEffect(() => {
    if (receiptData) {
      const newSummaries = calculateSplits(receiptData);
      setSummaries(newSummaries);
      // Initialize display currency to receipt currency if not set
      if (appState === AppState.PROCESSING_RECEIPT) {
        setDisplayCurrency(receiptData.currency);
      }
    }
  }, [receiptData, appState]);

  const handleCurrencyChange = async (newCurrency: string) => {
    setDisplayCurrency(newCurrency);
    if (receiptData) {
      if (newCurrency === receiptData.currency) {
        setExchangeRate(1);
      } else {
        // Fetch rate
        setIsProcessing(true); // Small loading indicator logic could be better, but this blocks UI nicely
        try {
          const rate = await getExchangeRate(receiptData.currency, newCurrency);
          setExchangeRate(rate);
        } catch (e) {
          console.error("Failed to fetch rate", e);
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setAppState(AppState.PROCESSING_RECEIPT);
    setIsProcessing(true);
    
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: `Scanning ${files.length} image${files.length > 1 ? 's' : ''}... this will just take a moment.`,
      timestamp: Date.now()
    }]);

    try {
      const promises = Array.from(files).map(file => {
        return new Promise<ImageFile>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve({
              base64: base64String.split(',')[1],
              mimeType: file.type
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const images = await Promise.all(promises);

      try {
        const data = await parseReceiptImage(images);
        setReceiptData(data);
        setDisplayCurrency(data.currency || 'USD');
        setExchangeRate(1); // Reset on new upload
        setAppState(AppState.SPLITTING);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: 'I\'ve analyzed the receipt! You can drag items to names, type commands like "Alice had the burger", or use the microphone.',
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

  const handleDropItem = (personName: string, itemName: string) => {
    const command = `Assign ${itemName} to ${personName}`;
    handleSendMessage(command);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 overflow-hidden">
      {/* Left Pane: Receipt & Summary */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative z-10 shadow-xl md:shadow-none order-2 md:order-1">
        <ReceiptPanel 
          data={receiptData} 
          summaries={summaries} 
          isLoading={appState === AppState.PROCESSING_RECEIPT}
          onDropItem={handleDropItem}
          onCurrencyChange={handleCurrencyChange}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
        />
      </div>

      {/* Right Pane: Chat */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full order-1 md:order-2">
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