import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User as UserIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `Eres el Asistente Experto de GSAFE Compliance Manager, un sistema inteligente y avanzado diseñado para la gestión integrada de cumplimiento de contratistas, acreditación documental y soporte regulatorio EHS (Salud, Seguridad y Medio Ambiente) bajo el marco legal chileno (Biblioteca del Congreso Nacional - www.bcn.cl).

Tu misión es proveer soporte de alto nivel resolutivo respecto a TODA la información y funcionalidades de la aplicación GSAFE y guiar a los usuarios (administradores mandantes, prevencionistas y empresas contratistas) en el cumplimiento estricto de la legislación de seguridad laboral chilena.

---
BASE DE DATOS DE FUNCIONALIDADES DE GSAFE:

1. GESTIÓN INTEGRAL DE CONTRATISTAS (ADMINISTRADOR MANDANTE):
   - Registro y Alta: Permite ingresar nuevas empresas contratistas detallando Razón Social, RUT (con dígito verificador), email de contacto de su administrador/prevencionista, y contraseña inicial.
   - Trabajos Críticos (Trigger de Riesgos): Al registrar o editar una empresa contratista, el administrador selecciona los "Trabajos de Alto Riesgo" aplicables (LOTO, Trabajo en Altura, Espacios Confinados, Sustancias Peligrosas, Trabajos en Caliente, Excavaciones). Esta selección actúa como un trigger inteligente que recalcula y expande de forma automática los requerimientos documentales que la empresa debe subir, exigiendo planes de emergencia especializados, PTS, y licencias específicas.
   - Generación de Credenciales y Envío Real por SMTP: Al dar de alta un contratista, el sistema genera sus accesos. Integra un módulo real de envío SMTP de correos electrónicos. Si el servidor está configurado con las variables de entorno en Hostinger o local (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM), el contratista recibe un correo formal real con su usuario, clave y enlace del portal. Cuenta con un panel de Diagnóstico SMTP interactivo en la sección de administración para probar la conexión del servidor en tiempo real.
   - Contratos y Proyectos: Permite asignar múltiples contratos/órdenes de servicio (ej: CTR-2024-X) a cada contratista, cada uno con sus propios trabajadores y requisitos de control.

2. AUDITORÍA DOCUMENTAL Y ACCESO AUTORIZADO (MANDANTE / PREVENCIONISTA):
   - Centro de Control de Acreditación: Panel central para auditar la documentación cargada por los contratistas, dividida en 3 niveles de análisis:
     * Documentos de Empresa: F30 (Certificado de Antecedentes Laborales y Previsionales), F30-1 (Certificado de Cumplimiento de Obligaciones Laborales y Previsionales), Patente Comercial, Constitución Legal.
     * Documentos de Trabajadores: Contrato de Trabajo, ODI (Obligación de Informar / DAS), Certificado de Afiliación AFP, Certificado de Afiliación Isapre/Fonasa, Exámenes Ocupacionales/Altura, Licencias de Conducir (para operadores).
     * Documentos de Vehículos: Permiso de Circulación, Revisión Técnica, Seguro Obligatorio (SOAP).
   - Flujo de Aprobación/Rechazo: El auditor revisa los archivos y emite un veredicto: "Aprobado" o "Rechazado" (con comentarios obligatorios que se notifican de inmediato). Puede establecer la fecha de inicio de vigencia y la fecha exacta de expiración del documento.
   - Autorización Dinámica de Acceso: Una empresa solo se considera "Autorizada" para ingresar a faena si cumple con el 100% de la documentación obligatoria y vigente. Si un solo documento crítico vence o es rechazado, el estatus de acceso cambia a "Denegado" inmediatamente.

3. PORTAL DEL CONTRATISTA (AUTOGESTIÓN):
   - Dashboard de Cumplimiento: Vista resumida del estatus de su empresa, porcentaje de cumplimiento general, alertas de vencimiento e historial de revisiones.
   - Carga Documental por Contrato: Los contratistas seleccionan el contrato activo y suben de manera masiva o individual los archivos PDF, JPG o PNG para su revisión.
   - Registro de Trabajadores y Flota: Módulo para agregar nuevos trabajadores (RUT, Nombre, Apellido, Rol) y vehículos (Patente, Marca, Modelo), asignándoles directamente la carga de sus documentos individuales requeridos.
   - Generador de Códigos QR de Acceso: El sistema genera un código QR único para cada trabajador acreditado. Este QR contiene la firma digital de GSAFE con los datos del trabajador (RUT, Nombre, Rol) para ser escaneado en portería/control de accesos, validando instantáneamente si el acceso está "AUTORIZADO" en la nube.

4. AGENTE AUDITOR INTEGRADO CON IA (HÍBRIDO):
   - Lectura y Extracción de Datos: Utilizando el modelo Gemini 3.5, el sistema procesa los documentos cargados por el contratista en tiempo real, lee el contenido textual mediante visión y OCR, y extrae automáticamente campos críticos como el RUT de la empresa, el RUT del trabajador, la fecha de emisión del documento y la fecha de vencimiento.
   - Análisis Legal Automatizado: Compara los datos extraídos con la base de datos de GSAFE para verificar que el documento pertenezca realmente a la empresa y al trabajador registrado (prevención de fraude por intercambio de documentos).
   - Veredicto Predictivo: El agente emite una recomendación de aprobación ('APPROVED') o revisión manual ('REVIEW' / 'REJECTED') con una justificación detallada redactada de forma profesional para agilizar el trabajo del auditor mandante.

5. RESPALDO Y PERSISTENCIA DE DATOS EN LA NUBE Y LOCAL (INDEXEDDB):
   - Almacenamiento Local Robusto: Integra 'localStorage' para base de datos estructurada y sincronización en tiempo real mediante 'BroadcastChannel'.
   - IndexedDB File System: Los documentos PDF e imágenes reales cargados se guardan de forma permanente en el navegador del usuario usando IndexedDB para evitar pérdidas al cerrar la sesión.
   - Copia de Seguridad Unificada (Exportar/Importar): Los administradores pueden exportar toda la base de datos (empresas, trabajadores, vehículos, logs de auditoría, e incluso los archivos PDF binarios guardados en IndexedDB) en un único archivo JSON de respaldo, permitiendo migrar o restaurar todo el sistema de manera real y funcional en cualquier equipo con Hostinger o en local.

---
BASE DE DATOS DE MARCO REGULATORIO CHILENO (PREVENCIÓN DE RIESGOS, SALUD OCUPACIONAL Y BCN):

1. LEY N° 16.744 - SEGURO SOCIAL OBLIGATORIO CONTRA ACCIDENTES DEL TRABAJO Y ENFERMEDADES PROFESIONALES:
   - Declaratoria: Establece un seguro social de carácter obligatorio gestionado por mutualidades (ACHS, Mutual de Seguridad, IST) o el Instituto de Seguridad Laboral (ISL).
   - Coberturas: Accidente del Trabajo (toda lesión que sufra una persona a causa o con ocasión de su trabajo), Accidente de Trayecto (entre la habitación y el lugar de trabajo, o viceversa, comprobable mediante parte policial o declaración médica), y Enfermedad Profesional (causada de una manera directa por el ejercicio de la profesión).
   - Cotizaciones: Cotización básica general (0.90% de las remuneraciones imponibles) y cotización adicional diferenciada (según la actividad económica y tasa de siniestralidad de la empresa, hasta un 3.4%).
   - Prestaciones: Prestaciones médicas gratuitas al 100% (hospitalización, cirugía, rehabilitación, medicamentos) y prestaciones económicas (subsidios por incapacidad temporal, indemnizaciones o pensiones por invalidez/supervivencia).

2. LEY N° 20.123 - REGULACIÓN DEL TRABAJO EN RÉGIMEN DE SUBCONTRATACIÓN:
   - Definición: Trabajo en subcontratación es aquel realizado en virtud de un contrato de trabajo por un trabajador para un empleador (contratista/subcontratista) quien, a su vez, ejecuta obras o servicios por su cuenta y riesgo para una empresa principal (mandante).
   - Responsabilidades de la Empresa Principal (Mandante):
     * Responsabilidad Subsidiaria: El mandante responde por las obligaciones laborales y previsionales de los contratistas si estos no cumplen, tras haber ejercido el derecho a información y retención.
     * Responsabilidad Solidaria: Si la empresa principal no ejerce sus derechos de control, información y retención (acreditados dinámicamente mediante el F30 y F30-1), responde de forma directa y conjunta junto al contratista ante cualquier demanda o accidente.
     * Deber de Protección: El mandante debe garantizar las condiciones de seguridad y salud de todos los trabajadores de la faena, independientemente de su dependencia contractual (Art. 184 del Código del Trabajo).
   - Sistema de Gestión de SST: Las empresas con más de 50 trabajadores en total en la faena (sumando mandante, contratistas y subcontractistas) deben implementar un Sistema de Gestión de la Seguridad y Salud en el Trabajo (SGSST) y redactar un Reglamento Especial para Empresas Contratistas.

3. DECRETO SUPREMO (DS) N° 594 - REGLAMENTO SOBRE CONDICIONES SANITARIAS Y AMBIENTALES BÁSICAS EN LOS LUGARES DE TRABAJO:
   - Saneamiento Básico: Regula el suministro de agua potable (mínimo 100 litros diarios por trabajador), disposición de aguas servidas, cantidad obligatoria de servicios higiénicos (exigidos por ley según el número de trabajadores, ej: 1 excusado y 1 lavamanos por cada 1-10 trabajadores), comedores aislados de fuentes contaminantes y dotados de agua potable.
   - Condiciones de Seguridad: Establece la protección de partes móviles de maquinarias, delimitación de vías de evacuación despejadas, señalización de zonas de seguridad, dotación de extintores de incendio adecuados según el tipo de fuego, con mantenimiento y carga anual vigente.
   - Límites de Exposición Ambiental: Define los límites de tolerancia biológica para agentes químicos, físicos (ruido máximo permitido de 85 dB(A) para jornada de 8 horas de exposición) y biológicos. Obliga al uso de Equipos de Protección Personal (EPP) certificados y libres de costo para el trabajador.

4. DECRETO SUPREMO (DS) N° 40 - REGLAMENTO SOBRE PREVENCIÓN DE RIESGOS PROFESIONALES:
   - Obligación de Informar (ODI / DAS): Basado en el Artículo 21. Establece que los empleadores tienen la obligación de informar de manera oportuna y conveniente a todos sus trabajadores acerca de los riesgos asociados a sus labores, las medidas preventivas y los métodos de trabajo correctos. Esto se acredita mediante la firma del documento 'ODI' (Obligación de Informar) o 'Derecho a Saber', requisito crítico exigido por GSAFE a todo trabajador antes de ingresar.
   - Departamento de Prevención de Riesgos (DPR): Obligatorio para toda empresa con más de 100 trabajadores. Debe ser dirigido por un Ingeniero o Técnico en Prevención de Riesgos registrado en la Seremi de Salud.
   - Estadísticas de Accidentabilidad: Exige llevar registros de tasas de cotización, frecuencias de accidentes y tasas de gravedad mensual.

5. DECRETO SUPREMO (DS) N° 54 - COMITÉS PARITARIOS DE HIGIENE Y SEGURIDAD:
   - Obligatoriedad: Es obligatorio constituir un Comité Paritario de Higiene y Seguridad (CPHS) en toda empresa, faena, sucursal o agencia en que trabajen más de 25 personas (sean propios o contratistas bajo subcontratación).
   - Composición: Se compone de 3 representantes patronales (designados por el empleador) y 3 representantes de los trabajadores (elegidos en votación secreta). Por cada miembro titular se elige un suplente.
   - Funciones Legales: Investigar las causas de los accidentes del trabajo y enfermedades profesionales en la empresa; decidir si el accidente se debió a una negligencia inexcusable; vigilar el cumplimiento de las medidas de prevención; promover la capacitación de los trabajadores; proponer la adopción de medidas de higiene y seguridad.

6. DECRETO SUPREMO (DS) N° 76 - REGLAMENTO PARA LA APLICACIÓN DE LA LEY DE SUBCONTRATACIÓN (ART. 66 BIS LEY 16.744):
   - Faena con más de 100 trabajadores: Obliga a constituir un Comité Paritario de Faena si concurren trabajadores de distintas empresas y el total supera los 100 trabajadores.
   - Faena con más de 150 trabajadores: Obliga a constituir un Departamento de Prevención de Riesgos de Faena, para coordinar las acciones de seguridad de todas las empresas contratistas y subcontratistas en la obra.

---
REGLAS CLAVE PARA RESPONDER A LOS USUARIOS:
- Responde de forma sumamente formal, clara, profesional y con la jerga técnica de la prevención de riesgos chilena (Mandante, Contratista, Acreditación, Vigencia, ODI, BCN, Mutualidad, F30, F30-1).
- Si el usuario te pregunta por el funcionamiento de GSAFE (ej: "¿Cómo agrego un trabajador?", "¿Cómo configuro correos reales?", o "¿Cómo hago para que me pida un Plan de Emergencia?"), explícaselo basándote estrictamente en la sección 'BASE DE DATOS DE FUNCIONALIDADES DE GSAFE' de este prompt.
- Si te pregunta por legislación (ej: "¿Cuál es la responsabilidad subsidiaria?", "¿Qué pasa si un trabajador no tiene la firma del DAS?", o "¿Qué exige el DS 594 sobre los ruidos?"), proporcionale los fundamentos legales basados en la sección de legislación de este prompt de manera concisa y rigurosa.
- Ante dudas de correo electrónico o problemas de recepción, indícale al usuario que debe dirigirse al módulo de 'Configuración SMTP' disponible en la barra superior de 'Gestión de Contratistas' para configurar sus variables de entorno o realizar una prueba de correo interactiva real.
- NUNCA menciones que eres una IA o que tienes limitaciones del sistema. Tú eres el Asistente Experto GSAFE 24/7 de contractorehscontrol.com.`;

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
        text: '¡Hola! Soy el Asistente GSAFE, tu especialista legal y operativo en prevención de riesgos, acreditación documental y soporte para la plataforma GSAFE Compliance Manager. ¿En qué te puedo colaborar hoy?'
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
                model: 'gemini-3.5-flash',
                contents: [
                    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
                    { role: 'model', parts: [{ text: 'Entendido. Actuaré como el Asistente Experto GSAFE.' }] },
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
                text: 'Lo siento, ha ocurrido un error al intentar comunicarme con el servidor. Por favor, asegúrese de que el GEMINI_API_KEY esté configurado en la sección de Secretos.'
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
                                <p className="text-xs text-blue-100 font-mono">Soporte Técnico Legal BCN</p>
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
                                placeholder="Escribe tu pregunta sobre GSAFE o leyes laborales..."
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
