export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignees: string[]; // List of names assigned to this item
}

export interface ReceiptData {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
}

export interface PersonSummary {
  name: string;
  subtotal: number;
  taxShare: number;
  tipShare: number;
  total: number;
  items: string[]; // Names of items they are paying for
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PROCESSING_RECEIPT = 'PROCESSING_RECEIPT',
  SPLITTING = 'SPLITTING',
}
