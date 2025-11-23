import React, { useState } from 'react';
import { ReceiptData, PersonSummary, ReceiptItem } from '../types';
import { calculateUnclaimedAmount } from '../utils/calculations';
import { User, Receipt, AlertCircle, Share2, DollarSign, ExternalLink } from 'lucide-react';

interface ReceiptPanelProps {
  data: ReceiptData | null;
  summaries: PersonSummary[];
  isLoading: boolean;
  onDropItem: (personName: string, item: string) => void;
  onCurrencyChange: (currency: string) => void;
  displayCurrency: string;
  exchangeRate: number;
}

const AVAILABLE_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

export const ReceiptPanel: React.FC<ReceiptPanelProps> = ({ 
  data, 
  summaries, 
  isLoading, 
  onDropItem,
  onCurrencyChange,
  displayCurrency,
  exchangeRate
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const formatPrice = (price: number, originalCurrency: string) => {
    const val = price * exchangeRate;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: displayCurrency }).format(val);
  };

  const handleDragStart = (e: React.DragEvent, itemName: string) => {
    e.dataTransfer.setData('text/plain', itemName);
    setDraggedItem(itemName);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, personName: string) => {
    e.preventDefault();
    const itemName = e.dataTransfer.getData('text/plain');
    if (itemName) {
      onDropItem(personName, itemName);
    }
    setDraggedItem(null);
  };

  const handleSettle = (person: PersonSummary) => {
    const amount = (person.total * exchangeRate).toFixed(2);
    // Venmo web link construction
    // Note: 'recipients' parameter often requires a username, but we leave it blank for the user to fill.
    const note = encodeURIComponent(`SplitSmart Bill Share for ${person.items.length} items`);
    const link = `https://venmo.com/?txn=charge&amount=${amount}&note=${note}`;
    window.open(link, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-pulse">
        <Receipt size={48} className="mb-4 opacity-50" />
        <p>Analyzing receipt details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Receipt size={48} className="mb-4" />
        <p>Upload a receipt to get started</p>
      </div>
    );
  }

  const unclaimedAmount = calculateUnclaimedAmount(data);

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="text-blue-600" />
            Receipt Details
          </h2>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Currency:</label>
            <select 
              value={displayCurrency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1 bg-white"
            >
              <option value={data.currency}>{data.currency} (Original)</option>
              {AVAILABLE_CURRENCIES.filter(c => c !== data.currency).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-2 text-sm text-slate-500 flex justify-between">
          <span>Subtotal: {formatPrice(data.subtotal, data.currency)}</span>
          <span>Tax: {formatPrice(data.tax, data.currency)}</span>
          <span>Tip: {formatPrice(data.tip, data.currency)}</span>
          <span className="font-bold text-slate-900">Total: {formatPrice(data.total, data.currency)}</span>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Items List */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Items (Drag to Assign)</h3>
          <div className="space-y-2">
            {data.items.map((item) => (
              <div 
                key={item.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, item.name)}
                className={`flex flex-col p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                  item.assignees.length === 0 
                    ? 'border-orange-100 bg-orange-50/30' 
                    : 'border-slate-100 bg-white'
                } hover:shadow-md hover:border-blue-200`}
              >
                <div className="flex justify-between items-start mb-1 pointer-events-none">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="font-semibold text-slate-900">{formatPrice(item.price, data.currency)}</span>
                </div>
                
                {/* Assignees badges */}
                <div className="flex flex-wrap gap-1 mt-1 pointer-events-none">
                  {item.assignees.length > 0 ? (
                    item.assignees.map((assignee, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        <User size={10} className="mr-1" />
                        {assignee}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center text-xs text-orange-500 font-medium">
                      <AlertCircle size={10} className="mr-1" />
                      Unassigned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-200 mx-4 my-2"></div>

        {/* Summary Section */}
        <div className="p-4 bg-slate-50/50">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Split Summary</h3>
          
          {unclaimedAmount > 0.01 && (
             <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between text-orange-800">
                <span className="text-sm font-medium flex items-center">
                  <AlertCircle size={16} className="mr-2" />
                  Unclaimed Amount
                </span>
                <span className="font-bold">{formatPrice(unclaimedAmount, data.currency)}</span>
             </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {summaries.map((person) => (
              <div 
                key={person.name} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, person.name)}
                className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-colors ${draggedItem ? 'border-dashed border-blue-400 bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">{person.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(person.total, data.currency)}
                    </span>
                  </div>
                </div>
                
                {/* Breakdown */}
                <div className="flex justify-between text-xs text-slate-500 px-1 border-t border-slate-100 pt-2 mt-2">
                  <span>Items: {formatPrice(person.subtotal, data.currency)}</span>
                  <span>Tax: {formatPrice(person.taxShare, data.currency)}</span>
                  <span>Tip: {formatPrice(person.tipShare, data.currency)}</span>
                </div>
                
                <div className="mt-3 flex justify-between items-center">
                  <div className="text-xs text-slate-400 truncate max-w-[150px]">
                    {person.items.length} items assigned
                  </div>
                  <button 
                    onClick={() => handleSettle(person)}
                    className="flex items-center gap-1 text-xs font-medium text-white bg-[#008CFF] hover:bg-[#0074D4] px-2 py-1 rounded transition-colors"
                    title="Settle with Venmo"
                  >
                    <ExternalLink size={10} />
                    Settle Up
                  </button>
                </div>
              </div>
            ))}
            
            {summaries.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">
                Assign items in the chat or drag them here to create a person.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};