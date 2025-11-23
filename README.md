# SplitSmart AI 🧾✨

SplitSmart AI is an intelligent bill-splitting application that transforms the tedious task of dividing expenses into a simple conversation. Powered by Google's **Gemini 3 Pro** model, it allows users to upload receipt images and assign costs using natural language.

![SplitSmart AI Conceptual](https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=2000&ixlib=rb-4.0.3)

## 🚀 Features

- **AI Receipt Parsing**: Instantly extracts items, prices, tax, and tip from receipt photos using computer vision and LLMs (`gemini-3-pro-preview`).
- **Natural Language Splitting**: Just say "Tom had the burger" or "Sarah and Dave shared the appetizers" to assign costs.
- **Real-time Calculations**: Automatically updates individual totals, proportionally distributing tax and tip based on subtotal shares.
- **Visual Summary**: Clear, color-coded breakdown of who owes what and which items are currently unassigned.
- **Responsive Design**: A split-pane interface that works great on desktop and mobile devices.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI/ML**: Google GenAI SDK (`@google/genai`)
- **Icons**: Lucide React

## 💡 How it Works

1. **Upload**: Drag and drop or snap a photo of your receipt.
2. **Parse**: The app uses Gemini to digitize the line items.
3. **Chat**: Use the chat interface to assign items.
   - *"Add John to the steak"*
   - *"Split the wine between Mary and Sue"*
   - *"Remove Bob from the salad"*
   - *"Everyone shared the appetizers"*
4. **Settle**: View the final calculated totals including tax and tip.

## 📦 License

MIT
