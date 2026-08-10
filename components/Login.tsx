import React, { useState } from 'react';
import { Lock, Mail, Construction, ArrowRight } from 'lucide-react';

interface Props {
    onLogin: (email: string, pass: string) => void;
    onGoToLanding?: () => void;
    error?: string;
}

export const Login: React.FC<Props> = ({ onLogin, onGoToLanding, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simular un pequeño delay para feedback visual
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Enviar datos limpios (sin espacios al inicio/final)
        onLogin(email.trim(), password);
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute top-0 left-0 w-full h-full bg-slate-800 opacity-50 transform -skew-y-6 origin-top-left translate-y-[-50%]"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                                 <Construction size={36} />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Compliance Cloud</h2>
                        <p className="text-yellow-400 font-medium text-sm uppercase tracking-wider mt-1">Compliance Manager</p>
                        <p className="text-gray-400 mt-4 text-sm max-w-xs mx-auto">Plataforma integral para la gestión y validación documental de contratistas.</p>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200 flex items-center gap-2 animate-pulse">
                            <div className="h-2 w-2 bg-red-600 rounded-full"></div>
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Corporativo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-gray-900"
                                    placeholder="nombre@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-gray-900"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isSubmitting ? 'opacity-70 cursor-wait' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
                    >
                        {isSubmitting ? 'Verificando...' : 'Ingresar al Portal'}
                        {!isSubmitting && <ArrowRight size={16} />}
                    </button>
                    
                    {onGoToLanding && (
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={onGoToLanding}
                                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline transition-colors"
                            >
                                &larr; Volver a la Página Web Comercial / Propuesta de Valor
                            </button>
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-center text-gray-500 mb-3 font-semibold uppercase">Credenciales de Prueba por Rol Jerárquico</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button 
                                type="button"
                                onClick={() => { setEmail('owner@compliance.cl'); setPassword('masterowner2026'); }}
                                className="bg-amber-50 hover:bg-amber-100 p-2 rounded-lg border border-amber-300 text-center transition-all cursor-pointer"
                            >
                                <span className="block font-bold text-amber-900">Propietario Master</span>
                                <span className="block text-amber-700 font-mono text-[10px]">owner@compliance.cl</span>
                            </button>

                            <button 
                                type="button"
                                onClick={() => { setEmail('admin@compliance.cl'); setPassword('admin'); }}
                                className="bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-300 text-center transition-all cursor-pointer"
                            >
                                <span className="block font-bold text-slate-800">Admin Mandante</span>
                                <span className="block text-slate-600 font-mono text-[10px]">admin@compliance.cl</span>
                            </button>

                            <button 
                                type="button"
                                onClick={() => { setEmail('contacto@andes.cl'); setPassword('123'); }}
                                className="bg-blue-50 hover:bg-blue-100 p-2 rounded-lg border border-blue-300 text-center transition-all cursor-pointer"
                            >
                                <span className="block font-bold text-blue-900">Contratista Directo</span>
                                <span className="block text-blue-700 font-mono text-[10px]">contacto@andes.cl</span>
                            </button>

                            <button 
                                type="button"
                                onClick={() => { setEmail('sub@electro.cl'); setPassword('123'); }}
                                className="bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg border border-emerald-300 text-center transition-all cursor-pointer"
                            >
                                <span className="block font-bold text-emerald-900">Subcontratista EHS</span>
                                <span className="block text-emerald-700 font-mono text-[10px]">sub@electro.cl</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                            <Lock size={12} /> Cifrado de Extremo a Extremo & Ley N° 21.719 de Protección de Datos
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};