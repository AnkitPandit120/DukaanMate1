
import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Icons } from '../components/icons';
import { GoogleGenAI, Type } from '@google/genai';

interface ParsedItem {
    id: number;
    name: string;
    quantity: number;
    price: number | null;
    isValid: boolean;
    isPriceAmbiguous?: boolean;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            // remove the prefix e.g. "data:audio/webm;base64,"
            resolve(base64data.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


const RushMode: React.FC = () => {
    const { addSale } = useData();
    const { t } = useLanguage();
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [capturedItems, setCapturedItems] = useState<ParsedItem[]>([]);
    const [notification, setNotification] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleTranscription = async (audioBlob: Blob) => {
        setIsLoading(true);
        setNotification('');
        try {
            const base64Audio = await blobToBase64(audioBlob);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const audioPart = {
                inlineData: {
                    mimeType: audioBlob.type,
                    data: base64Audio
                }
            };

            const prompt = `You are an expert audio transcription and entity extraction system for a small Indian shopkeeper. The audio may contain English, Hindi, or a mix (Hinglish). 
            
            Goal: Transcribe the audio and extract items with their quantity and price.

            Rules:
            - Quantity Handling: Listen for number words (e.g., 'do', 'teen', 'two', 'ek', 'one') or digits. Convert "to" or "too" to 2 if it appears before an item name. Default to 1 if not specified.
            - Price Handling: Listen carefully for price indicators in Hinglish such as 'rupay', 'rupees', 'rs', 'bucks', 'ka', 'wala', 'at', 'for'. Price is in Indian Rupees (₹).
            - Ambiguity Detection:
                - If a number is mentioned but it's unclear if it's a price or quantity (e.g., "milk 50"), prefer price if it's a larger number (>10) typically associated with cost, or check context. 
                - CRITICAL: If a price is likely mentioned but ambiguous (e.g. "at 50" without "rupees"), set 'price' to the number but mark 'isPriceAmbiguous' as true.
                - If explicitly '50 rupees' or '50 ka', set 'price' to 50 and 'isPriceAmbiguous' as false.
            - Structure: Return a JSON array of objects: { "name": string, "quantity": number, "price": number | null, "isPriceAmbiguous": boolean }.
            - Missing Price: If price is completely absent, set 'price' to null.

            Example audio 1: "do milk tees rupay aur ek bread"
            Output 1: [{"name": "milk", "quantity": 2, "price": 30, "isPriceAmbiguous": false}, {"name": "bread", "quantity": 1, "price": null, "isPriceAmbiguous": false}]
            
            Example audio 2: "maggi 2 at 12"
            Output 2: [{"name": "maggi", "quantity": 2, "price": 12, "isPriceAmbiguous": false}]

            Example audio 3: "bread 40 ka"
            Output 3: [{"name": "bread", "quantity": 1, "price": 40, "isPriceAmbiguous": false}]

            Return ONLY the JSON array.
            `;
            
            const responseSchema = {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    price: { type: Type.NUMBER },
                    isPriceAmbiguous: { type: Type.BOOLEAN },
                  },
                  required: ["name", "quantity"],
                },
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }, audioPart] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema,
                },
            });

            let parsedJson;
            try {
                parsedJson = JSON.parse(response.text);
            } catch (e) {
                console.error("Failed to parse Gemini response as JSON:", response.text);
                throw new Error("Received an invalid format from the AI.");
            }
            
            if (Array.isArray(parsedJson)) {
                const newItems: ParsedItem[] = parsedJson.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price ?? null,
                    isPriceAmbiguous: item.isPriceAmbiguous ?? false,
                    id: Date.now() + Math.random(),
                    isValid: !!(item.name && (item.price !== undefined && item.price !== null) && item.quantity > 0 && !item.isPriceAmbiguous),
                }));
                setCapturedItems(prev => [...prev, ...newItems]);
            }

        } catch (error) {
            console.error("Error with Gemini transcription:", error);
            setNotification(t('speechError') + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                handleTranscription(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setNotification("Microphone access denied.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };
    
    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    
    const handleItemChange = (id: number, field: keyof ParsedItem, value: string | number) => {
        setCapturedItems(items => items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                // If user edits the price, assume ambiguity is resolved
                if (field === 'price') {
                    updatedItem.isPriceAmbiguous = false;
                }
                return { ...updatedItem, isValid: !!(updatedItem.name && updatedItem.price && updatedItem.quantity > 0 && !updatedItem.isPriceAmbiguous) };
            }
            return item;
        }));
    };
    
    const handleDeleteItem = (id: number) => {
        setCapturedItems(items => items.filter(item => item.id !== id));
    };

    const addItemsToSales = () => {
        const validItems = capturedItems.filter(item => item.isValid);
        validItems.forEach(item => {
            addSale({ itemName: item.name, quantity: item.quantity, price: item.price! });
        });
        setNotification(`${validItems.length} ${t('itemsAddedToSales')}`);
        setCapturedItems([]);
        setTimeout(() => setNotification(''), 3000);
    };

    const allItemsValid = capturedItems.length > 0 && capturedItems.every(item => item.isValid);
    
    const getButtonState = () => {
      if (isLoading) return { text: "Transcribing with AI...", color: "bg-yellow-500", disabled: true };
      if (isRecording) return { text: t('listening'), color: "bg-red-500", disabled: false };
      return { text: t('tapToStart'), color: "bg-blue-600", disabled: false };
    }

    const buttonState = getButtonState();

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('rushModeTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('rushModeDesc')}</p>
            
            {/* Full screen overlay for recording feedback */}
            {isRecording && (
                <div className="fixed inset-0 bg-red-500 bg-opacity-10 z-40 pointer-events-none animate-pulse flex items-center justify-center">
                    <div className="text-red-600 font-bold text-2xl">Recording...</div>
                </div>
            )}

            <div className="text-center mb-8 relative z-50">
                <button 
                  onClick={toggleRecording} 
                  disabled={buttonState.disabled}
                  className={`relative w-40 h-40 rounded-full flex items-center justify-center text-white transition-all duration-300 ${buttonState.color} ${isRecording ? 'shadow-xl scale-110' : 'shadow-md hover:bg-blue-700'}`}
                >
                    <Icons.RushMode className="h-16 w-16" />
                    {isRecording && <span className="absolute inset-0 rounded-full bg-white opacity-25 animate-ping"></span>}
                </button>
                <p className="mt-4 font-semibold text-lg text-gray-800 dark:text-gray-200">{buttonState.text}</p>
            </div>
            {notification && <div className="mt-4 text-center text-green-600 dark:text-green-400 font-semibold">{notification}</div>}

            <div className="mt-8 max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">{t('reviewItems')}</h2>
                {capturedItems.length > 0 ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 px-3">
                            <span className="col-span-6">{t('itemName')}</span>
                            <span className="col-span-2 text-center">{t('quantity')}</span>
                            <span className="col-span-3 text-center">{t('price')}</span>
                        </div>
                        {capturedItems.map(item => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                                <input type="text" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} className={`col-span-6 bg-transparent focus:outline-none focus:ring-1 rounded-md p-1 text-gray-800 dark:text-gray-200 ${!item.name ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'}`} />
                                <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} className="col-span-2 text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md p-1 text-gray-800 dark:text-gray-200" />
                                <input type="number" placeholder="0.00" value={item.price ?? ''} onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))} className={`col-span-3 text-center bg-transparent focus:outline-none focus:ring-1 rounded-md p-1 text-gray-800 dark:text-gray-200 ${item.price === null || item.isPriceAmbiguous ? 'ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'focus:ring-blue-500'}`} />
                                <button onClick={() => handleDeleteItem(item.id)} className="col-span-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Icons.Trash className="h-5 w-5 mx-auto" /></button>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-500 dark:text-gray-400 text-center py-4">{isLoading ? '...' : t('noItemsCaptured')}</p>}
                
                {capturedItems.length > 0 && (
                    <div className="mt-6 text-right">
                        {!allItemsValid && <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2 text-left">{t('reviewItemsHint')}</p>}
                        <button onClick={addItemsToSales} disabled={!allItemsValid} className="bg-green-600 text-white py-2 px-6 rounded-md shadow-sm hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center ml-auto transition-colors">
                            <Icons.Add className="h-5 w-5 mr-2" /> {t('addToSales')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RushMode;
