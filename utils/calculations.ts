import { ReceiptData, PersonSummary, ReceiptItem } from "../types";

export const calculateSplits = (data: ReceiptData): PersonSummary[] => {
  const peopleMap = new Map<string, PersonSummary>();
  
  // Helper to get or create person
  const getPerson = (name: string) => {
    if (!peopleMap.has(name)) {
      peopleMap.set(name, {
        name,
        subtotal: 0,
        taxShare: 0,
        tipShare: 0,
        total: 0,
        items: []
      });
    }
    return peopleMap.get(name)!;
  };

  // 1. Calculate Subtotals
  let totalAssignedSubtotal = 0;

  data.items.forEach(item => {
    if (item.assignees.length > 0) {
      const splitPrice = item.price / item.assignees.length;
      item.assignees.forEach(assignee => {
        const person = getPerson(assignee);
        person.subtotal += splitPrice;
        
        // Add item name to list if not already there (or handled differently for display)
        // We can format it nicely later, e.g. "Pizza (1/2)"
        const itemDisplay = item.assignees.length > 1 
          ? `${item.name} (1/${item.assignees.length})`
          : item.name;
          
        person.items.push(itemDisplay);
      });
      totalAssignedSubtotal += item.price;
    }
  });

  // 2. Distribute Tax and Tip proportionally based on subtotal share
  // Note: Unassigned items are excluded from the distribution base in this logic to be fair to those who claimed items.
  // Alternatively, unassigned items could be treated as "shared by everyone", but typically we want to leave them "Unclaimed" in the UI.
  
  const summaries = Array.from(peopleMap.values());
  const grandTotalAssigned = totalAssignedSubtotal > 0 ? totalAssignedSubtotal : 1; // Avoid divide by zero

  summaries.forEach(person => {
    const shareRatio = person.subtotal / grandTotalAssigned;
    
    // We only distribute the tax/tip proportional to what has been CLAIMED so far.
    // Real-world logic: Usually you split the WHOLE tax/tip. 
    // Let's split the WHOLE tax/tip based on the ratio of their subtotal to the Total CLAIMED subtotal.
    // This assumes all items will eventually be claimed. If not, the tax/tip for unclaimed items is effectively hidden/unassigned here.
    
    person.taxShare = data.tax * shareRatio;
    person.tipShare = data.tip * shareRatio;
    person.total = person.subtotal + person.taxShare + person.tipShare;
  });

  return summaries.sort((a, b) => b.total - a.total);
};

export const calculateUnclaimedAmount = (data: ReceiptData): number => {
  return data.items
    .filter(item => item.assignees.length === 0)
    .reduce((sum, item) => sum + item.price, 0);
};
