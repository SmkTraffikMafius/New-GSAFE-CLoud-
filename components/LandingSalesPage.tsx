import React, { useState } from 'react';
import { 
    Construction, Bot, ShieldCheck, Zap, ArrowRight, CheckCircle2, XCircle, 
    FileText, QrCode, Cpu, Sparkles, TrendingUp, DollarSign, Clock, Users, 
    Building2, Mail, Phone, Lock, ChevronRight, Play, RefreshCw, BarChart3, 
    Award, Layers, Check, AlertTriangle, Shield, Scale, HelpCircle, Star, GitMerge
} from 'lucide-react';

interface Props {
    onGoToLogin: () => void;
    onQuickDemoAdmin: () => void;
    onQuickDemoContractor: () => void;
}

export const LandingSalesPage: React.FC<Props> = ({
    onGoToLogin,
    onQuickDemoAdmin,
    onQuickDemoContractor
}) => {
    // --- ESTADOS INTERACTIVOS DE LA LANDING ---
    const [numContractors, setNumContractors] = useState<number>(35);
    const [numWorkers, setNumWorkers] = useState<number>(450);
    const [docsPerWorker, setDocsPerWorker] = useState<number>(6);

    // Estado del Simulador IA en Vivo
    const [activeSimDoc, setActiveSimDoc] = useState<'f30' | 'das' | 'loto' | 'licencia'>('f30');
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [simResult, setSimResult] = useState<any>(null);

    // Estado Formulario de Contacto / Cotización
    const [contactForm, setContactForm] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        role: 'Jefe EHS / Prevención',
        contractorsCount: '20 - 50 contratistas',
        message: ''
    });
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    // --- CÁLCULO DE ROI Y AHORRO EN TIEMPO REAL ---
    const totalDocsMonth = numWorkers * docsPerWorker;
    // Tradicional: ~$3.500 CLP por revisión manual + salario de validadores (aprox. $4.800 CLP por doc procesado)
    const costTraditional = Math.round(totalDocsMonth * 4800);
    // Compliance Cloud IA: ~$850 CLP por doc equivalente en suscripción
    const costComplianceCloud = Math.round(totalDocsMonth * 850);
    const monthlySavings = costTraditional - costComplianceCloud;
    const yearlySavings = monthlySavings * 12;
    // Horas recuperadas (aprox. 15 minutos por doc manual vs 10 segundos IA)
    const hoursSavedMonth = Math.round((totalDocsMonth * 14) / 60);

    // --- MANEJADOR DEL SIMULADOR IA EN VIVO ---
    const handleRunSim = (docType: 'f30' | 'das' | 'loto' | 'licencia') => {
        setActiveSimDoc(docType);
        setIsSimulating(true);
        setSimResult(null);

        setTimeout(() => {
            setIsSimulating(false);
            if (docType === 'f30') {
                setSimResult({
                    title: 'Certificado F30-1 (Antecedentes Laborales y Previsionales)',
                    rutCompany: '76.849.320-K (Andes Servicios Mineros SpA)',
                    worker: 'Todos los trabajadores asociados',
                    emissionDate: '01/08/2026',
                    expirationDate: '31/08/2026',
                    status: 'APPROVED',
                    confidence: '99.8%',
                    details: 'Documento oficial emitiendo la Dirección del Trabajo (DT). Sin multas gravísimas pendientes. Vigencia de 30 días cumplida.'
                });
            } else if (docType === 'das') {
                setSimResult({
                    title: 'Obligación de Informar (ODI / DAS Artículo 21 DS 40)',
                    rutCompany: '76.849.320-K',
                    worker: '18.452.910-3 (Juan Carlos Pérez Soto)',
                    emissionDate: '15/05/2026',
                    expirationDate: 'Vigente (Acreditación Anual)',
                    status: 'APPROVED',
                    confidence: '99.5%',
                    details: 'Contiene firma ológrafa del trabajador, detalle de riesgos específicos de la faena y medidas de control según DS 40.'
                });
            } else if (docType === 'loto') {
                setSimResult({
                    title: 'Certificado Aislación y Bloqueo de Energías (LOTO EHS)',
                    rutCompany: '76.849.320-K',
                    worker: '18.452.910-3 (Juan Carlos Pérez Soto)',
                    emissionDate: '10/01/2026',
                    expirationDate: '10/01/2027',
                    status: 'APPROVED',
                    confidence: '99.9%',
                    details: 'Aprobación del estándar crítico LOTO para trabajos con energía cero. Cumple exigencias de Mandante y Decreto 132.'
                });
            } else {
                setSimResult({
                    title: 'Licencia de Conducir A-4 y Revisión Técnica Vehicular',
                    rutCompany: '76.849.320-K',
                    worker: 'Patente: GH-89-21 (Camión Aljibe)',
                    emissionDate: '12/03/2026',
                    expirationDate: '12/03/2027',
                    status: 'APPROVED',
                    confidence: '99.7%',
                    details: 'Validado contra base de datos PRT. Registro MMT vigente, clase de licencia compatible con el tonelaje registrado.'
                });
            }
        }, 800);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
            
            {/* TOP NOTICE BANNER */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600 text-white text-xs py-2 px-4 text-center font-medium shadow-md flex items-center justify-center gap-2">
                <Sparkles size={14} className="animate-pulse" />
                <span><strong>Nuevo Agente IA Gemini 3.5:</strong> Auditoría Documental en Tiempo Real con Eliminación de Espera para Contratistas.</span>
                <button 
                    onClick={onGoToLogin}
                    className="underline hover:text-yellow-300 font-bold ml-2 transition-colors"
                >
                    Probar Demo en Vivo &rarr;
                </button>
            </div>

            {/* HEADER NAV */}
            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                            <Construction size={24} />
                        </div>
                        <div>
                            <span className="text-xl font-extrabold tracking-tight text-white">Compliance</span>
                            <span className="text-xl font-light text-blue-400">Cloud</span>
                            <span className="ml-2 text-[10px] uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">EHS IA Platform</span>
                        </div>
                    </div>

                    <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="#funcionalidades" className="hover:text-blue-400 transition-colors">Funcionalidades</a>
                        <a href="#ventaja-ia" className="hover:text-blue-400 transition-colors">Plus Principal IA</a>
                        <a href="#comparativa" className="hover:text-blue-400 transition-colors">vs Competencia</a>
                        <a href="#calculadora" className="hover:text-blue-400 transition-colors">Calculadora ROI</a>
                        <a href="#normativa" className="hover:text-blue-400 transition-colors">Leyes Chile</a>
                        <a href="#precios" className="hover:text-blue-400 transition-colors">Planes</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onGoToLogin}
                            className="hidden sm:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:border-slate-600"
                        >
                            <Lock size={14} /> Acceso Clientes
                        </button>
                        <button 
                            onClick={onQuickDemoAdmin}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
                        >
                            <Play size={14} fill="currentColor" /> Probar Demo Mandante
                        </button>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none"></div>
                <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 shadow-inner">
                            <Bot size={16} className="text-blue-400 animate-bounce" />
                            <span>Agente Auditor Multimodal con IA Gemini 3.5 Integrado</span>
                            <span className="bg-blue-500 text-slate-950 font-black px-1.5 py-0.5 rounded text-[10px]">NUEVO</span>
                        </div>

                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] mb-6">
                            La primera plataforma de <br className="hidden sm:inline" />
                            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                                Acreditación de Contratistas 100% Automatizada por IA
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed mb-10 max-w-3xl mx-auto">
                            Elimina los cuellos de botella y demoras de 72 horas. <strong>Compliance Cloud</strong> lee, extrae y audita la documentación de tus contratistas, trabajadores y vehículos en <strong>segundos</strong>, con cumplimiento estricto de las leyes laborales chilena (Ley 20.123, Ley 16.744) y Ley 21.719 de Protección de Datos.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <button 
                                onClick={onQuickDemoAdmin}
                                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] cursor-pointer"
                            >
                                <Zap size={20} className="fill-current text-yellow-300" />
                                Probar Demo Interactiva (Mandante)
                            </button>
                            <button 
                                onClick={onQuickDemoContractor}
                                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-8 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all hover:border-slate-500 cursor-pointer"
                            >
                                <Building2 size={20} className="text-emerald-400" />
                                Demo Portal Contratista
                            </button>
                            <a 
                                href="#calculadora"
                                className="w-full sm:w-auto bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 px-6 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <TrendingUp size={20} />
                                Calcular Ahorro Fin.
                            </a>
                        </div>

                        {/* KEY METRICS BAR */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                            <div className="p-3 border-r border-slate-800/80 last:border-0">
                                <div className="text-3xl lg:text-4xl font-black text-blue-400 mb-1">&lt; 10 seg</div>
                                <div className="text-xs text-slate-400 font-medium">Tiempo de aprobación IA por doc</div>
                            </div>
                            <div className="p-3 border-r border-slate-800/80 last:border-0">
                                <div className="text-3xl lg:text-4xl font-black text-emerald-400 mb-1">99.8%</div>
                                <div className="text-xs text-slate-400 font-medium">Precisión OCR en RUTs y Vigencias</div>
                            </div>
                            <div className="p-3 border-r border-slate-800/80 last:border-0">
                                <div className="text-3xl lg:text-4xl font-black text-amber-400 mb-1">-85%</div>
                                <div className="text-xs text-slate-400 font-medium">Reducción en Costos de Gestión</div>
                            </div>
                            <div className="p-3">
                                <div className="text-3xl lg:text-4xl font-black text-indigo-400 mb-1">100%</div>
                                <div className="text-xs text-slate-400 font-medium">Cumplimiento Ley 21.719 & Ley 20.123</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN: EL PLUS PRINCIPAL & BENEFICIO DE VENTA GOOGLE ADS */}
            <section id="ventaja-ia" className="py-20 bg-slate-900/60 border-y border-slate-800/80 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                            El Plus Principal Indiscutible
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
                            Análisis Documental Automático e Inteligente con IA
                        </h2>
                        <p className="text-slate-300 text-base sm:text-lg">
                            Lo que prometemos en nuestras campañas y propuesta comercial: <strong>Cero revisiones manuales lentas</strong>. La Inteligencia Artificial analiza el documento en el instante en que el contratista lo sube.
                        </p>
                    </div>

                    {/* INTERACTIVE IA DEMO WIDGET */}
                    <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 lg:p-10 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            
                            {/* Left Controls */}
                            <div className="w-full lg:w-1/3 space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="text-yellow-400" size={20} />
                                    Simulador de Auditoría IA
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Haz clic en cualquier tipo de documento laboral chileno para ver cómo el Agente Gemini 3.5 extrae los datos y emite el veredicto en tiempo real:
                                </p>

                                <div className="space-y-2 pt-2">
                                    <button 
                                        onClick={() => handleRunSim('f30')}
                                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${activeSimDoc === 'f30' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-blue-400" />
                                            <span>Certificado F30-1 (Dirección del Trabajo)</span>
                                        </div>
                                        <ChevronRight size={16} />
                                    </button>

                                    <button 
                                        onClick={() => handleRunSim('das')}
                                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${activeSimDoc === 'das' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck size={18} className="text-emerald-400" />
                                            <span>ODI / DAS (Art. 21 Ley 16.744)</span>
                                        </div>
                                        <ChevronRight size={16} />
                                    </button>

                                    <button 
                                        onClick={() => handleRunSim('loto')}
                                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${activeSimDoc === 'loto' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle size={18} className="text-amber-400" />
                                            <span>Certificado LOTO / Trabajo Crítico</span>
                                        </div>
                                        <ChevronRight size={16} />
                                    </button>

                                    <button 
                                        onClick={() => handleRunSim('licencia')}
                                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${activeSimDoc === 'licencia' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={18} className="text-indigo-400" />
                                            <span>Licencia Conducir + Revisión Técnica</span>
                                        </div>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Right Live Simulation Box */}
                            <div className="w-full lg:w-2/3 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative min-h-[340px] flex flex-col justify-between">
                                {isSimulating ? (
                                    <div className="flex flex-col items-center justify-center my-auto py-12 text-center">
                                        <div className="relative mb-4">
                                            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                            <Bot size={28} className="text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        </div>
                                        <h4 className="font-bold text-white text-base mb-1">Auditor IA Procesando Visión y OCR...</h4>
                                        <p className="text-xs text-slate-400 font-mono">Leyendo RUTs, código de barras, timbre digital y fechas de vigencia...</p>
                                    </div>
                                ) : simResult ? (
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Bot size={20} className="text-blue-400" />
                                                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 font-mono">Análisis Gemini 3.5 Finalizado</span>
                                            </div>
                                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                                                <CheckCircle2 size={14} /> Veredicto: {simResult.status} ({simResult.confidence})
                                            </span>
                                        </div>

                                        <h4 className="text-lg font-bold text-white">{simResult.title}</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                <span className="text-slate-500 block font-semibold mb-0.5">Empresa / RUT Extraído</span>
                                                <span className="font-mono text-slate-200 font-bold">{simResult.rutCompany}</span>
                                            </div>
                                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                <span className="text-slate-500 block font-semibold mb-0.5">Trabajador / Entidad</span>
                                                <span className="font-mono text-slate-200 font-bold">{simResult.worker}</span>
                                            </div>
                                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                <span className="text-slate-500 block font-semibold mb-0.5">Fecha de Emisión</span>
                                                <span className="font-mono text-slate-200">{simResult.emissionDate}</span>
                                            </div>
                                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                <span className="text-slate-500 block font-semibold mb-0.5">Fecha de Vencimiento</span>
                                                <span className="font-mono text-emerald-400 font-bold">{simResult.expirationDate}</span>
                                            </div>
                                        </div>

                                        <div className="bg-blue-950/40 border border-blue-900/60 p-4 rounded-xl text-xs text-blue-200">
                                            <strong className="text-blue-300 block mb-1">Justificación Legal del Agente Auditor:</strong>
                                            {simResult.details}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center my-auto py-12">
                                        <Bot size={48} className="text-slate-700 mx-auto mb-3 animate-pulse" />
                                        <p className="text-slate-400 text-sm font-medium">Selecciona un tipo de documento a la izquierda para ejecutar la auditoría automática IA.</p>
                                    </div>
                                )}

                                <div className="pt-4 mt-auto border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                                    <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-400" /> Sin riesgo de suplantación de archivos</span>
                                    <span className="font-mono text-blue-400">Motor Gemini 3.5 Flash EHS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN: COMPARATIVA DIRECTA VS LA COMPETENCIA (WEBCONTROL, PRONEXO, RYF, ETC) */}
            <section id="comparativa" className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                            Diferenciador Radical de Mercado
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
                            ¿Por qué reemplazar la competencia tradicional?
                        </h2>
                        <p className="text-slate-300 text-base sm:text-lg">
                            Las plataformas antiguas dependen de ejércitos de validadores humanos lentos y costosos. <strong>Compliance Cloud</strong> ofrece la velocidad y precisión que exige la industria moderna.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* TRADICIONAL COMPETENCIA */}
                        <div className="bg-slate-900/40 border border-red-900/30 rounded-3xl p-8 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-red-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-500/10 p-3 rounded-2xl text-red-400">
                                        <XCircle size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-200">Plataformas Tradicionales</h3>
                                        <span className="text-xs text-slate-500">Webcontrol, Pronexo, RyF, Osal, etc.</span>
                                    </div>
                                </div>
                                <span className="bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/20">
                                    Lento & Costoso
                                </span>
                            </div>

                            <ul className="space-y-4 text-sm text-slate-300">
                                <li className="flex items-start gap-3">
                                    <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Demoras de 48 a 72 horas:</strong> Revisiones manuales por humanos que detienen faenas y causan cuellos de botella en la acreditación.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Cobros excesivos por documento:</strong> Tarifas infladas por cada intento o trabajador ingresado al sistema.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Riesgo de Error Humano:</strong> Validadores exhaustos que pasan por alto fechas vencidas o RUTs que no corresponden al contrato.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Soporte Inexistente:</strong> Contratistas frustrados sin respuestas cuando un documento es rechazado de forma ambigua.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Procesos Manuales Ineficientes:</strong> Dependencia de planillas Excel desactualizadas y carpetas físicas de papel.</span>
                                </li>
                            </ul>
                        </div>

                        {/* NUESTRA PLATAFORMA IA */}
                        <div className="bg-gradient-to-b from-blue-950/60 to-slate-900 border-2 border-blue-500/50 rounded-3xl p-8 relative shadow-2xl shadow-blue-500/10">
                            <div className="absolute top-0 right-0 bg-blue-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl">
                                RECOMENDADO
                            </div>

                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-blue-800/40">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-400">
                                        <Zap size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Compliance Cloud IA</h3>
                                        <span className="text-xs text-blue-300">Auditoría con Agente Gemini 3.5</span>
                                    </div>
                                </div>
                                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                                    <Sparkles size={12} /> Aprobación en Segundos
                                </span>
                            </div>

                            <ul className="space-y-4 text-sm text-slate-200">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Auditoría Instantánea con IA:</strong> Lectura de OCR, verificación de RUT y vigencia en menos de 10 segundos.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Ahorro del 85% en Costos:</strong> Sin costos escondidos por revisión adicional. Escalabilidad ilimitada.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Detección Anti-Fraude:</strong> Cruce automático entre la empresa contratista, el trabajador y el archivo subido.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Asistente Virtual EHS 24/7:</strong> Chatbot entrenado en normativa chilena (BCN, DS 594, DS 40) para guiarlos.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span><strong>Acreditación de Nóminas en Línea:</strong> Visibilidad consolidada de trabajadores autorizados y vigencias previsionales.</span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </section>

            {/* SECCIÓN: TODAS LAS FUNCIONALIDADES DE LA APLICACIÓN */}
            <section id="funcionalidades" className="py-20 bg-slate-900/40 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                            Capacidad Operativa Total
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
                            Módulos y Funcionalidades de la Aplicación
                        </h2>
                        <p className="text-slate-300 text-base sm:text-lg">
                            Todo lo que necesita una empresa Mandante y sus Contratistas para una acreditación rápida, segura y legalmente blindada.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Feature 1 */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/40 transition-all hover:-translate-y-1 group">
                            <div className="h-12 w-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Bot size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Auditoría IA Multimodal</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Procesamiento OCR con Gemini 3.5. Extrae RUTs, fechas de emisión/vencimiento y valida la autenticidad documental automáticamente.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/40 transition-all hover:-translate-y-1 group">
                            <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Building2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Portal Autónomo Contratista</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Carga masiva e individual de requerimientos legales (F30, F30-1, RIOHS, Protocolos MINSAL, Matriz MIPER) por empresa y proyecto.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-amber-500/40 transition-all hover:-translate-y-1 group">
                            <div className="h-12 w-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Gestión de Personal y Flota</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Control de trabajadores y vehículos asignados. Acreditación de exámenes ocupacionales, licencias, inducciones y registros LOTO.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-purple-500/40 transition-all hover:-translate-y-1 group">
                            <div className="h-12 w-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <GitMerge size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Auditoría de Subcontratación</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Trazabilidad de empresas subcontratadas en cadena. Cumplimiento de responsabilidad subsidiaria y acreditación de personal.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/40 transition-all hover:-translate-y-1 group">
                            <div className="h-12 w-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Scale size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Cumplimiento Leyes Chile</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Mapeo directo contra Ley 20.123 (Subcontratación), Ley 16.744, DS 594 (Higiene) y DS 40 (ODI / Derecho a Saber).
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
                            <div className="h-12 w-12 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Portal ARCO+P (Ley 21.719)</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Módulo nativo para ejercicio de derechos de privacidad de datos personales (Acceso, Cancelación, Portabilidad) y Oficial DPO.
                            </p>
                        </div>

                        {/* Feature 7 */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-red-500/40 transition-all hover:-translate-y-1 group">
                            <div className="h-12 w-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Mail size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Alertas SMTP & Correo Real</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Notificaciones automáticas por correo electrónico sobre documentos vencidos o por vencer a administradores y contratistas.
                            </p>
                        </div>

                        {/* Feature 8 */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-yellow-500/40 transition-all hover:-translate-y-1 group">
                            <div className="h-12 w-12 bg-yellow-500/10 text-yellow-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Control Center Mandante</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Vista consolidada ejecutiva del % de cumplimiento global, semáforo de riesgo por empresa y reportes exportables en Excel/JSON.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* SECCIÓN: CALCULADORA DE ROI Y AHORRO EN TIEMPO REAL */}
            <section id="calculadora" className="py-20 bg-slate-950 relative border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                            Demostrabilidad Financiera
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
                            Calculadora de ROI y Ahorro Operativo
                        </h2>
                        <p className="text-slate-300 text-base sm:text-lg">
                            Descubre cuánto dinero y horas-hombre ahorras al reemplazar las revisiones manuales por el motor de IA de Compliance Cloud.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        
                        {/* Sliders Area */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-slate-200">
                                        Número de Empresas Contratistas:
                                    </label>
                                    <span className="text-lg font-mono font-bold text-blue-400">{numContractors} empresas</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="200" 
                                    value={numContractors}
                                    onChange={(e) => setNumContractors(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-slate-200">
                                        Trabajadores Totales Acreditados:
                                    </label>
                                    <span className="text-lg font-mono font-bold text-emerald-400">{numWorkers} trabajadores</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="20" 
                                    max="2500" 
                                    step="10"
                                    value={numWorkers}
                                    onChange={(e) => setNumWorkers(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-slate-200">
                                        Documentos Exigidos por Trabajador:
                                    </label>
                                    <span className="text-lg font-mono font-bold text-indigo-400">{docsPerWorker} documentos</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="2" 
                                    max="12" 
                                    value={docsPerWorker}
                                    onChange={(e) => setDocsPerWorker(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                                <Clock size={20} className="text-amber-400 flex-shrink-0" />
                                <span>Procesando un total estimado de <strong>{totalDocsMonth.toLocaleString()} documentos mensuales</strong>.</span>
                            </div>

                        </div>

                        {/* Savings Display Card */}
                        <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 to-slate-900 border border-emerald-500/30 p-6 rounded-2xl space-y-6 text-center">
                            
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Ahorro Financiero Anual Estimado
                                </span>
                                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                                    ${yearlySavings.toLocaleString('es-CL')} CLP
                                </div>
                                <span className="text-[11px] text-emerald-500/80 font-medium">
                                    (~${monthlySavings.toLocaleString('es-CL')} CLP al mes)
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-left text-xs">
                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <span className="text-slate-500 block">Horas Libres / Mes</span>
                                    <strong className="text-lg text-blue-400 font-mono">{hoursSavedMonth} hrs</strong>
                                </div>
                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <span className="text-slate-500 block">Reducción Costos</span>
                                    <strong className="text-lg text-emerald-400 font-mono">82.3%</strong>
                                </div>
                            </div>

                            <button 
                                onClick={onQuickDemoAdmin}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20"
                            >
                                Solicitar Cotización Formal &rarr;
                            </button>

                        </div>

                    </div>

                </div>
            </section>

            {/* SECCIÓN: CUMPLIMIENTO MARCO LEGAL CHILENO */}
            <section id="normativa" className="py-20 bg-slate-900/60 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                            Blindaje Normativo Garantizado
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
                            Alineado a la Legislación Chilena Vigente
                        </h2>
                        <p className="text-slate-300 text-base sm:text-lg">
                            Diseñado bajo la jurisprudencia de la Biblioteca del Congreso Nacional (BCN), la Dirección del Trabajo (DT) y la Seremi de Salud.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-blue-400 font-mono font-bold text-sm">
                                <Scale size={18} /> Ley N° 20.123
                            </div>
                            <h3 className="text-lg font-bold text-white">Ley de Subcontratación</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Protege a la empresa Mandante frente a la responsabilidad subsidiaria y solidaria. Exige verificación estricta de certificados F30 y F30-1 de los contratistas.
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                                <ShieldCheck size={18} /> Ley N° 16.744
                            </div>
                            <h3 className="text-lg font-bold text-white">Seguro Social Accidentes</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Regula la prevención de riesgos profesionales. Valida la implementación del DS 594 (Higiene) y el DS 40 (Obligación de Informar / DAS Art. 21).
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
                                <Lock size={18} /> Ley N° 21.719
                            </div>
                            <h3 className="text-lg font-bold text-white">Protección Datos Personales</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Cumplimiento constitucional chileno en tratamiento de datos sensibles de trabajadores. Portal nativo para el ejercicio de derechos ARCO+P.
                            </p>
                        </div>

                    </div>

                </div>
            </section>

            {/* SECCIÓN: PLANES Y PRECIOS */}
            <section id="precios" className="py-20 relative border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                            Planes Flexibles PaaS / SaaS
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
                            Modelos para Todo Tamaño de Operación
                        </h2>
                        <p className="text-slate-300 text-base sm:text-lg">
                            Paga solo por lo que utilizas sin permanencias ni cargos sorpresa.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        
                        {/* Plan 1 */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-bold uppercase text-slate-400 font-mono">Plan Starter / Contratistas</span>
                                <h3 className="text-2xl font-black text-white mt-1 mb-2">Pyme EHS</h3>
                                <div className="text-3xl font-black text-white my-4 font-mono">
                                    UF 4.5 <span className="text-xs text-slate-400 font-normal">/ mes</span>
                                </div>
                                <p className="text-xs text-slate-400 mb-6">Ideal para contratistas medianos o mandantes con hasta 10 empresas contratistas directas.</p>
                                
                                <ul className="space-y-3 text-xs text-slate-300">
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Hasta 10 Contratistas</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Auditoría IA Gemini 3.5</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Pase de Acceso QR Garita</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Soporte por Correo</li>
                                </ul>
                            </div>
                            <button 
                                onClick={onQuickDemoAdmin}
                                className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-colors"
                            >
                                Seleccionar Plan
                            </button>
                        </div>

                        {/* Plan 2 Featured */}
                        <div className="bg-gradient-to-b from-blue-950 to-slate-900 border-2 border-blue-500 rounded-3xl p-8 flex flex-col justify-between relative shadow-2xl shadow-blue-500/20">
                            <div className="absolute top-0 right-0 bg-blue-500 text-slate-950 text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-2xl">
                                MÁS POPULAR
                            </div>
                            <div>
                                <span className="text-xs font-bold uppercase text-blue-300 font-mono">Plan Corporativo</span>
                                <h3 className="text-2xl font-black text-white mt-1 mb-2">Mandante Pro</h3>
                                <div className="text-3xl font-black text-white my-4 font-mono">
                                    UF 18 <span className="text-xs text-slate-400 font-normal">/ mes</span>
                                </div>
                                <p className="text-xs text-slate-300 mb-6">Diseñado para plantas industriales, constructoras y faenas mineras de alto volumen.</p>
                                
                                <ul className="space-y-3 text-xs text-slate-200">
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Hasta 100 Contratistas</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Auditoría IA Ilimitada</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Control Center Multi-Empresa</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Servidor SMTP Propio / Gmail</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Portal Ley 21.719 DPO</li>
                                </ul>
                            </div>
                            <button 
                                onClick={onQuickDemoAdmin}
                                className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs transition-colors shadow-lg shadow-blue-600/30"
                            >
                                Iniciar Prueba Demo
                            </button>
                        </div>

                        {/* Plan 3 */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-bold uppercase text-slate-400 font-mono">Plan Enterprise</span>
                                <h3 className="text-2xl font-black text-white mt-1 mb-2">Custom Multi-Faena</h3>
                                <div className="text-3xl font-black text-white my-4 font-mono">
                                    Cotizar
                                </div>
                                <p className="text-xs text-slate-400 mb-6">Infraestructura dedicada, integraciones con ERPs (SAP, Buk, Talana) y SLA 99.9%.</p>
                                
                                <ul className="space-y-3 text-xs text-slate-300">
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Contratistas Ilimitados</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Integración API / Webhooks</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Servidor Dedicado Cloud Run</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Ejecutivo de Cuenta EHS</li>
                                </ul>
                            </div>
                            <a 
                                href="#contacto"
                                className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-bold py-3 rounded-xl text-xs transition-colors block"
                            >
                                Contactar Ventas
                            </a>
                        </div>

                    </div>

                </div>
            </section>

            {/* SECCIÓN: FORMULARIO DE CONTACTO Y AGENDAR DEMO */}
            <section id="contacto" className="py-20 bg-slate-900/80 border-t border-slate-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
                        
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-white mb-2">Solicita una Demostración Comercial</h2>
                            <p className="text-xs sm:text-sm text-slate-400">
                                Déjanos tus datos y un especialista EHS se pondrá en contacto en menos de 2 horas laborables.
                            </p>
                        </div>

                        {isSubmitted ? (
                            <div className="bg-emerald-950/60 border border-emerald-500/40 p-8 rounded-2xl text-center space-y-3 animate-in zoom-in duration-300">
                                <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
                                <h3 className="text-xl font-bold text-white">¡Solicitud Recibida con Éxito!</h3>
                                <p className="text-xs text-slate-300">
                                    Hemos asignado un especialista a tu empresa (<strong>{contactForm.company || 'Su Empresa'}</strong>). Te enviaremos el dossier comercial y acceso de pruebas a <strong>{contactForm.email}</strong>.
                                </p>
                                <button 
                                    onClick={onQuickDemoAdmin}
                                    className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
                                >
                                    Ir a Probar el Sistema Mientras Tanto &rarr;
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Ej: Roberto Silva"
                                            value={contactForm.name}
                                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">Empresa / Razón Social</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Ej: Constructora El Bosque SpA"
                                            value={contactForm.company}
                                            onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">Correo Corporativo</label>
                                        <input 
                                            type="email" 
                                            required 
                                            placeholder="rsilva@empresa.cl"
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono Móvil</label>
                                        <input 
                                            type="tel" 
                                            required 
                                            placeholder="+56 9 8765 4321"
                                            value={contactForm.phone}
                                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Mensaje o Requerimientos Especiales</label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Indica si manejas proyectos de minería, construcción o transporte..."
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                                    ></textarea>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all"
                                >
                                    Enviar Solicitud Comercial
                                </button>
                            </form>
                        )}

                    </div>

                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 font-bold text-slate-300">
                        <Construction size={18} className="text-yellow-400" />
                        <span>Compliance Cloud Platform &copy; {new Date().getFullYear()}</span>
                    </div>
                    <div>
                        Alineado a Ley N° 20.123, Ley N° 16.744 y Ley N° 21.719 de Protección de Datos Personales en Chile.
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onGoToLogin} className="hover:text-slate-300 underline">Ingreso Clientes</button>
                    </div>
                </div>
            </footer>

        </div>
    );
};
