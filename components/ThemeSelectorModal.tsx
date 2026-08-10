import React from 'react';
import { THEMES, ThemeId, ThemeConfig } from '../theme';
import { Palette, Check, Sparkles, X, Shield, Building2, Flame, Bot, Award } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: ThemeId;
    onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSelectorModal: React.FC<Props> = ({
    isOpen,
    onClose,
    currentTheme,
    onSelectTheme
}) => {
    if (!isOpen) return null;

    const themeIcons: Record<ThemeId, React.ReactNode> = {
        corporate: <Building2 className="text-blue-400" size={20} />,
        industrial: <Flame className="text-amber-400" size={20} />,
        emerald: <Shield className="text-emerald-400" size={20} />,
        cybertech: <Bot className="text-purple-400" size={20} />,
        executive: <Award className="text-sky-400" size={20} />
    };

    return (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative text-slate-100">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Palette size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Aariencia Visual y Temas Personalizados
                        </h2>
                        <p className="text-xs text-slate-400">
                            Elige la identidad visual que mejor se adapte a tu industria, cliente o estilo de gestión EHS.
                        </p>
                    </div>
                </div>

                {/* Theme List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {(Object.keys(THEMES) as ThemeId[]).map((key) => {
                        const theme = THEMES[key];
                        const isSelected = currentTheme === key;

                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    onSelectTheme(key);
                                }}
                                className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group ${
                                    isSelected 
                                        ? 'bg-slate-800/90 border-2 border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]' 
                                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                                }`}
                            >
                                {/* Top Badges */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {themeIcons[key]}
                                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                                            {theme.badgeText}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <span className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                            <Check size={12} /> Activo
                                        </span>
                                    )}
                                </div>

                                {/* Title & Subtitle */}
                                <div className="mb-3">
                                    <h3 className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                                        {theme.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                        {theme.subtitle}
                                    </p>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-slate-400/90 mb-4 leading-relaxed">
                                    {theme.description}
                                </p>

                                {/* Color Swatches */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Paleta:</span>
                                    <div className="flex items-center gap-1.5">
                                        {theme.previewGradients.map((color, idx) => (
                                            <div 
                                                key={idx} 
                                                className="w-5 h-5 rounded-full border border-white/20 shadow-sm" 
                                                style={{ backgroundColor: color }} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Modal Footer */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                        <Sparkles size={14} className="text-amber-400" />
                        Cambio instantáneo aplicado en toda la aplicación
                    </span>
                    <button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl transition-all"
                    >
                        Aceptar y Guardar
                    </button>
                </div>

            </div>
        </div>
    );
};
