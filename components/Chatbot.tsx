import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `Eres el Asistente GSAFE, un experto en la aplicación GSAFE Compliance Manager. 
Tu rol es ayudar a los usuarios a entender cómo funciona la aplicación, explicar conceptos de cumplimiento, 
y guiarlos en el uso de la plataforma. 

GSAFE es un Sistema de Gestión de Contratistas (CMS) de nivel empresarial diseñado para el control de cumplimiento, 
validación de documentos y autorización de acceso basado en estándares regulatorios chilenos (Ley 20.123, 16.744) 
y requerimientos de sitios de alta seguridad.

Reglas:
- Responde de manera profesional, clara y concisa.
- Si te preguntan sobre cómo usar una función (ej: cómo subir un documento, cómo agregar un trabajador), explica los pasos generales.
- Si no sabes la respuesta o no está relacionada con la aplicación, indica amablemente que tu función es asistir con el uso de GSAFE.
- Mantén un tono amigable y servicial.`;

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: '1',
        role: 'assistant',
        text: '¡Hola! Soy el asistente virtual de GSAFE. ¿En qué te puedo ayudar hoy?'
    }]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        if (!inputMessage.trim() || isTyping) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: inputMessage.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');
        setIsTyping(true);

        try {
            // Prepare history for context
            const history = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
                    { role: 'model', parts: [{ text: 'Entendido. Actuaré como el Asistente GSAFE.' }] },
                    ...history,
                    { role: 'user', parts: [{ text: userMsg.text }] }
                ]
            });

            const botText = response.text || 'Lo siento, no pude procesar tu solicitud.';
            
            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: botText
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Error al generar respuesta:', error);
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: 'Lo siento, ha ocurrido un error al intentar comunicarme con el servidor. Por favor, intenta de nuevo más tarde.'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700 transition-all duration-300">
                    {/* Header */}
                    <div className="bg-blue-600 dark:bg-blue-800 text-white p-4 flex justify-between items-center shadow-md">
                        <div className="flex items-center space-x-2">
                            <Bot className="w-6 h-6" />
                            <div>
                                <h3 className="font-semibold text-sm">Asistente GSAFE</h3>
                                <p className="text-xs text-blue-100">Soporte Inteligente</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:text-gray-200 focus:outline-none transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                        msg.role === 'user' ? 'bg-blue-100 text-blue-600 ml-2' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 mr-2'
                                    }`}>
                                        {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex flex-row max-w-[85%]">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 mr-2 flex items-center justify-center">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-tl-none flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Escribe tu pregunta..."
                                disabled={isTyping}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-0 rounded-full text-sm dark:text-white transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isTyping}
                                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-5 h-5 ml-0.5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
                    isOpen ? 'bg-red-500 hover:bg-red-600 rotate-90' : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>
        </div>
    );
};
