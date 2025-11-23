import React from 'react';
import { ReceiptData, PersonSummary } from '../types';
import { calculateUnclaimedAmount } from '../utils/calculations';
import { User, DollarSign, Receipt, AlertCircle } from 'lucide-react';

interface ReceiptPanelProps {
  data: ReceiptData | null;
  summaries: PersonSummary[];
  isLoading: boolean;
}

export const ReceiptPanel: React.FC<ReceiptPanelProps> = ({ data, summaries, isLoading }) => {
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
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Receipt className="text-blue-600" />
          Receipt Details
        </h2>
        <div className="mt-2 text-sm text-slate-500 flex justify-between">
          <span>Subtotal: {data.currency}{data.subtotal.toFixed(2)}</span>
          <span>Tax: {data.currency}{data.tax.toFixed(2)}</span>
          <span>Tip: {data.currency}{data.tip.toFixed(2)}</span>
          <span className="font-bold text-slate-900">Total: {data.currency}{data.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Items List */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Items</h3>
          <div className="space-y-2">
            {data.items.map((item) => (
              <div 
                key={item.id} 
                className={`flex flex-col p-3 rounded-lg border transition-colors ${
                  item.assignees.length === 0 
                    ? 'border-orange-100 bg-orange-50/30' 
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="font-semibold text-slate-900">{data.currency}{item.price.toFixed(2)}</span>
                </div>
                
                {/* Assignees badges */}
                <div className="flex flex-wrap gap-1 mt-1">
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
                <span className="font-bold">{data.currency}{unclaimedAmount.toFixed(2)}</span>
             </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {summaries.map((person) => (
              <div key={person.name} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">{person.name}</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {data.currency}{person.total.toFixed(2)}
                  </span>
                </div>
                
                {/* Breakdown */}
                <div className="flex justify-between text-xs text-slate-500 px-1 border-t border-slate-100 pt-2 mt-2">
                  <span>Items: {data.currency}{person.subtotal.toFixed(2)}</span>
                  <span>Tax: {data.currency}{person.taxShare.toFixed(2)}</span>
                  <span>Tip: {data.currency}{person.tipShare.toFixed(2)}</span>
                </div>
                
                {/* Item list detail tooltip/dropdown could go here, for now just item count */}
                <div className="mt-2 text-xs text-slate-400 truncate">
                  {person.items.join(', ')}
                </div>
              </div>
            ))}
            
            {summaries.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">
                Assign items in the chat to see the split here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
