export type ThemeId = 'corporate' | 'industrial' | 'emerald' | 'cybertech' | 'executive';

export interface ThemeConfig {
    id: ThemeId;
    name: string;
    subtitle: string;
    description: string;
    primaryHex: string;
    accentHex: string;
    badgeText: string;
    previewGradients: string[];
    headerBg: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
    buttonPrimary: string;
    tagClass: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
    corporate: {
        id: 'corporate',
        name: 'Corporate Compliance (Azul Corporativo)',
        subtitle: 'Estándar Legal & Prevención de Riesgos',
        description: 'Enfoque corporativo de alta legitimidad para mandantes, auditorías legales y grandes empresas.',
        primaryHex: '#2563eb',
        accentHex: '#3b82f6',
        badgeText: 'Estándar',
        previewGradients: ['#0f172a', '#1e40af', '#3b82f6'],
        headerBg: 'bg-slate-900 border-slate-800',
        accentBg: 'bg-blue-600',
        accentText: 'text-blue-400',
        accentBorder: 'border-blue-500/40',
        buttonPrimary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30',
        tagClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    industrial: {
        id: 'industrial',
        name: 'Alta Minería e Industria (Safety Amber)',
        subtitle: 'Seguridad Operativa y Alta Visibilidad',
        description: 'Diseño enfocado en operaciones mineras, faenas industriales y construcción con colores de alta seguridad EHS.',
        primaryHex: '#d97706',
        accentHex: '#f59e0b',
        badgeText: 'Minería & Faena',
        previewGradients: ['#111827', '#b45309', '#f59e0b'],
        headerBg: 'bg-stone-950 border-amber-900/40',
        accentBg: 'bg-amber-600',
        accentText: 'text-amber-400',
        accentBorder: 'border-amber-500/40',
        buttonPrimary: 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black shadow-amber-500/30',
        tagClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    emerald: {
        id: 'emerald',
        name: 'Sostenibilidad & EHS (Verde Esmeralda)',
        subtitle: 'Medio Ambiente, Salud y Seguridad',
        description: 'Inspirado en estándares de sustentabilidad ambiental, certificaciones ISO 14001 y prevención verde.',
        primaryHex: '#059669',
        accentHex: '#10b981',
        badgeText: 'EHS Verde',
        previewGradients: ['#064e3b', '#047857', '#10b981'],
        headerBg: 'bg-slate-950 border-emerald-900/40',
        accentBg: 'bg-emerald-600',
        accentText: 'text-emerald-400',
        accentBorder: 'border-emerald-500/40',
        buttonPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30',
        tagClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    cybertech: {
        id: 'cybertech',
        name: 'Auditoría IA Cybertech (Neón Violeta & Cyan)',
        subtitle: 'IA Avanzada & Automatización Digital',
        description: 'Tema tecnológico futurista optimizado para la experiencia de auditoría inteligente en tiempo real.',
        primaryHex: '#7c3aed',
        accentHex: '#06b6d4',
        badgeText: 'IA Cyber',
        previewGradients: ['#030712', '#5b21b6', '#06b6d4'],
        headerBg: 'bg-gray-950 border-purple-900/40',
        accentBg: 'bg-purple-600',
        accentText: 'text-purple-400',
        accentBorder: 'border-purple-500/40',
        buttonPrimary: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-600/30',
        tagClass: 'bg-purple-500/10 text-purple-300 border-purple-500/20'
    },
    executive: {
        id: 'executive',
        name: 'Executive Platinum (Elegante & Claro)',
        subtitle: 'Tablero de Control Gerencial de Alto Nivel',
        description: 'Limpio, sobrio y de máxima legibilidad para reportes a directores, gerentes y auditorías externas.',
        primaryHex: '#0284c7',
        accentHex: '#38bdf8',
        badgeText: 'Gerencial',
        previewGradients: ['#0c4a6e', '#0369a1', '#38bdf8'],
        headerBg: 'bg-slate-900 border-sky-800/40',
        accentBg: 'bg-sky-600',
        accentText: 'text-sky-400',
        accentBorder: 'border-sky-500/40',
        buttonPrimary: 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white shadow-sky-600/30',
        tagClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    }
};
