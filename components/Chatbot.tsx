
import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { Icons } from './icons';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { GoogleGenAI, FunctionDeclaration, Type, Part } from '@google/genai';

interface Message {
    text: string;
    sender: 'user' | 'bot';
}

type ChatContent = {
    role: 'user' | 'model' | 'function';
    parts: Part[];
};


const Chatbot: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
      { sender: 'bot', text: t('chatbotGreeting') }
  ]);
  const [history, setHistory] = useState<ChatContent[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 550 });
  
  const { addStockItem, stock, sales, expenses, payments } = useData();
  const ref = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ref.current) {
      isDragging.current = true;
      offset.current = {
        x: e.clientX - ref.current.getBoundingClientRect().left,
        y: e.clientY - ref.current.getBoundingClientRect().top,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !ref.current) return;
    setPosition({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    if (isOpen) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);

  const addStockItemTool: FunctionDeclaration = {
    name: 'addStockItem',
    description: 'Adds a new item to the shop\'s stock inventory. Asks for clarification if any required parameters are missing.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            itemName: { type: Type.STRING, description: 'The name of the product.' },
            category: { type: Type.STRING, description: 'The category of the product (e.g., Dairy, Bakery, Produce).' },
            quantity: { type: Type.NUMBER, description: 'The number of units to add.' },
            price: { type: Type.NUMBER, description: 'The price per unit in Indian Rupees (₹).' },
        },
        required: ["itemName", "category", "quantity", "price"]
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
      e.preventDefault();
      if(!userInput.trim() || isLoading) return;

      const userMessageText = userInput;
      const userMessage: Message = { text: userMessageText, sender: 'user' };
      setMessages(prev => [...prev, userMessage]);
      setUserInput('');
      setIsLoading(true);

      const currentHistory: ChatContent[] = [...history, { role: 'user', parts: [{ text: userMessageText }] }];
      
      try {
        const context = `You are DukaanMate's friendly and intelligent AI assistant. 
        - Your role is to help a small shopkeeper analyze their business data, manage their shop, and answer general questions.
        - All monetary values are in Indian Rupees (₹). 
        - Today's date is ${new Date().toLocaleDateString()}.
        - Be concise, helpful, and encouraging.
        - You have access to Google Search to provide up-to-date information (e.g., market prices, trends, news, weather) if the user asks about things outside their shop data or general knowledge.
        - When asked to perform an action like adding stock, use the provided tools.
        
        Here is the current shop data for context: 
        - Sales (last 20): ${JSON.stringify(sales.slice(0, 20))}
        - Stock: ${JSON.stringify(stock)}
        - Expenses: ${JSON.stringify(expenses)}
        - Payments: ${JSON.stringify(payments)}`;
        
        // Use gemini-3-pro-preview for complex tasks and search grounding
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: currentHistory,
            config: {
                systemInstruction: context,
                tools: [
                    { functionDeclarations: [addStockItemTool] },
                    { googleSearch: {} } // Enable Google Search Grounding
                ],
            }
        });

        let responseCandidate = response.candidates?.[0];
        // Handle cases where content might be blocked or empty, though rare with proper API keys
        if (!responseCandidate || !responseCandidate.content || !responseCandidate.content.parts) {
             throw new Error("No content received from model.");
        }

        let botResponsePart = responseCandidate.content.parts[0];
        let modelTurnWithPotentialFunctionCall: ChatContent = { role: 'model', parts: [botResponsePart] };
        let historyForNextCall: ChatContent[] = [...currentHistory, modelTurnWithPotentialFunctionCall];

        if (botResponsePart.functionCall) {
            const fc = botResponsePart.functionCall;
            if(fc.name === 'addStockItem') {
                const args = fc.args as { itemName: string; category: string; quantity: number; price: number };
                addStockItem(args);

                const functionResponsePart: Part = {
                    functionResponse: {
                        name: 'addStockItem',
                        response: {
                            result: `Successfully added ${args.quantity} units of ${args.itemName} to stock.`
                        }
                    }
                };
                
                historyForNextCall.push({ role: 'function', parts: [functionResponsePart] });
                
                const responseAfterFunctionCall = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: historyForNextCall,
                    config: {
                        systemInstruction: context,
                        tools: [
                             { functionDeclarations: [addStockItemTool] },
                             { googleSearch: {} }
                        ],
                    }
                });
                
                responseCandidate = responseAfterFunctionCall.candidates?.[0];
                botResponsePart = responseCandidate?.content?.parts?.[0] || { text: "Action completed." };
            }
        }
        
        const botResponseText = botResponsePart.text || "I'm sorry, I couldn't process that properly.";
        
        // Check for grounding metadata to display sources (optional, but good for transparency)
        let finalText = botResponseText;
        if (responseCandidate.groundingMetadata?.groundingChunks) {
             const sources = responseCandidate.groundingMetadata.groundingChunks
                .map((chunk: any) => chunk.web?.title ? `[${chunk.web.title}](${chunk.web.uri})` : null)
                .filter(Boolean)
                .join(', ');
             if (sources) {
                 finalText += `\n\nSources: ${sources}`;
             }
        }

        const botMessage: Message = { text: finalText, sender: 'bot' };
        setMessages(prev => [...prev, botMessage]);
        
        const finalModelTurn: ChatContent = { role: 'model', parts: responseCandidate.content?.parts || [] };
        setHistory([...historyForNextCall, finalModelTurn]);

      } catch (error) {
        console.error("Error communicating with Gemini:", error);
        const errorMessage: Message = { text: t('chatbotError'), sender: 'bot' };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110"
        aria-label="Open Chatbot"
      >
        <Icons.Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      ref={ref}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-80 h-[450px] flex flex-col border border-gray-200 dark:border-gray-700"
    >
      <div
        onMouseDown={handleMouseDown}
        className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center cursor-move rounded-t-lg"
      >
        <h3 className="font-semibold">{t('chatbotTitle')}</h3>
        <button onClick={() => setIsOpen(false)} className="text-white hover:text-blue-100" aria-label="Close chatbot">
          <Icons.Close className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 scrollbar-hide">
        {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'} mb-3`}>
                <div className={`py-2 px-3 rounded-xl max-w-xs ${msg.sender === 'bot' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100' : 'bg-blue-500 text-white'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

                </div>
            </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="py-2 px-3 rounded-xl max-w-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
              <p className="text-sm flex items-center">
                <span className="animate-pulse">...</span>
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-3 border-t bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-b-lg">
        <div className="flex items-center">
            <input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={t('chatbotPlaceholder')}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                disabled={isLoading}
            />
            <button type="submit" className="ml-2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 disabled:bg-blue-300" aria-label="Send message" disabled={isLoading}>
                <Icons.ChevronUp className="h-5 w-5"/>
            </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;
