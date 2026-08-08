import React from 'react';
import { X, ShieldCheck, Lock, FileText, CheckCircle2, UserCheck, Key, Database, RefreshCw, Mail } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="bg-slate-900 px-6 py-5 flex justify-between items-center text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-600/30 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/30">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight">Política de Tratamiento de Datos Personales</h3>
                            <p className="text-xs text-slate-400">Cumplimiento 100% Ley N° 21.719 de Protección de Datos Personales de Chile (Art. 14 ter)</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="Cerrar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    
                    {/* Header Banner */}
                    <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-800/50 flex items-start gap-3">
                        <Lock className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm">Compromiso de Privacidad y Seguridad Compliance Cloud</h4>
                            <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                                En Compliance Cloud nos comprometemos a garantizar la protección, confidencialidad, integridad y uso responsable de todos los datos personales y datos sensibles de trabajadores, contratistas y usuarios, conforme a las exigencias de la **Ley N° 21.719** y el estándar constitucional chileno.
                            </p>
                        </div>
                    </div>

                    {/* Section 1: Responsable del Tratamiento */}
                    <section className="space-y-2">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-slate-700">
                            <Building2Icon size={18} className="text-blue-600 dark:text-blue-400" />
                            1. Identificación del Responsable y Delegado de Protección (DPO)
                        </h4>
                        <p>
                            El Responsable del Tratamiento de Datos es **Compliance Cloud Platform**, en coordinación con las Empresas Mandantes y Contratistas autorizadas en el sistema.
                        </p>
                        <div className="bg-gray-50 dark:bg-slate-900/60 p-3 rounded-lg border border-gray-200 dark:border-slate-700 text-xs space-y-1">
                            <p><strong>Entidad Responsable:</strong> Compliance Cloud SpA</p>
                            <p><strong>Oficial / Delegado de Protección de Datos (DPO):</strong> dpo@compliance.cl</p>
                            <p><strong>Dirección para Notificaciones:</strong> Av. Andrés Bello 2457, Providencia, Santiago, Chile</p>
                        </div>
                    </section>

                    {/* Section 2: Finalidad del Tratamiento */}
                    <section className="space-y-2">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-slate-700">
                            <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                            2. Finalidades Específicas e Informadas del Tratamiento
                        </h4>
                        <p>
                            Los datos personales y documentos son recolectados y procesados con las siguientes finalidades exclusivas:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li><strong>Acreditación de Cumplimiento Laboral y Previsional:</strong> Cumplimiento de la Ley 20.123 sobre Trabajo en Subcontratación (Certificados F-30 y F-30-1, Liquidaciones de Sueldo, Planillas Previred).</li>
                            <li><strong>Gestión de Salud Ocupacional y Seguridad (EHS):</strong> Validación de aptitud médica laboral para trabajos críticos mediante Exámenes Médicos Ocupacionales y Preocupacionales (Ley 16.744 y Normas Minsal).</li>
                            <li><strong>Control de Acceso Físico a Faenas y Plantas:</strong> Habilitación de pases de ingreso mediante códigos QR y credenciales electrónicas.</li>
                            <li><strong>Auditoría Corporativa y Trazabilidad Legal:</strong> Verificación por parte de auditores autorizados de la empresa mandante.</li>
                        </ul>
                    </section>

                    {/* Section 3: Categorías de Datos (PII y Sensibles) */}
                    <section className="space-y-2">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-slate-700">
                            <Database size={18} className="text-blue-600 dark:text-blue-400" />
                            3. Categorías de Datos Recolectados y Clasificación
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-gray-900 dark:text-gray-100 block mb-1">Datos Personales Generales (PII):</span>
                                <p>RUT, Nombres, Apellidos, Correo Electrónico Corporativo, Cargo u Oficio, Fotografía de Cédula y Registros de Asistencia.</p>
                            </div>
                            <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/40">
                                <span className="font-bold text-red-700 dark:text-red-400 block mb-1">Datos Sensibles (Art. 2° lit. g Ley 21.719):</span>
                                <p>Exámenes médicos ocupacionales, diagnósticos de aptitud física/psíquica, registros de impositivas AFP/Salud y datos biométricos.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Portal de Derechos ARCO+P */}
                    <section className="space-y-2">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-slate-700">
                            <UserCheck size={18} className="text-blue-600 dark:text-blue-400" />
                            4. Derechos de los Titulares (ARCO+P) - Título I (Arts. 4° al 11)
                        </h4>
                        <p>
                            Los titulares de datos (trabajadores y usuarios) pueden ejercer en cualquier momento sus derechos gratuitos a través de nuestro **Portal de Derechos ARCO+P**:
                        </p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                            <div className="p-2.5 bg-gray-50 dark:bg-slate-900/50 rounded border border-gray-200 dark:border-slate-700">
                                <strong>Acceso (Art. 5°):</strong> Confirmar y obtener copia estructurada de sus datos.
                            </div>
                            <div className="p-2.5 bg-gray-50 dark:bg-slate-900/50 rounded border border-gray-200 dark:border-slate-700">
                                <strong>Rectificación (Art. 6°):</strong> Corregir o actualizar información inexacta.
                            </div>
                            <div className="p-2.5 bg-gray-50 dark:bg-slate-900/50 rounded border border-gray-200 dark:border-slate-700">
                                <strong>Supresión (Art. 7°):</strong> Solicitar eliminación o anonimización de datos.
                            </div>
                            <div className="p-2.5 bg-gray-50 dark:bg-slate-900/50 rounded border border-gray-200 dark:border-slate-700">
                                <strong>Oposición (Art. 8°):</strong> Oponerse al tratamiento no esencial.
                            </div>
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200">
                                <strong>Bloqueo Temporal (Art. 8° ter):</strong> Suspender visibilidad en app a los 2 días hábiles.
                            </div>
                            <div className="p-2.5 bg-gray-50 dark:bg-slate-900/50 rounded border border-gray-200 dark:border-slate-700">
                                <strong>Portabilidad (Art. 9°):</strong> Descargar paquete de datos en formato JSON/CSV.
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Anonimización e Integridad Audit visual */}
                    <section className="space-y-2">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-slate-700">
                            <RefreshCw size={18} className="text-blue-600 dark:text-blue-400" />
                            5. Anonimización y Mantenimiento de Integridad Referencial
                        </h4>
                        <p className="text-xs">
                            Conforme al Artículo 7° y 14° ter de la Ley 21.719, las solicitudes de **Supresión** aprobadas se ejecutan mediante un procedimiento de **Anonimización Irreversible** de datos personales (destruyendo vínculos con RUT, nombres y fotos), preservando únicamente estadísticas anonimizadas e historial numérico para auditorías de seguridad corporativa e inspecciones laborales sin vulnerar la privacidad del titular.
                        </p>
                    </section>

                    {/* Section 6: Medidas de Seguridad y Confidencialidad */}
                    <section className="space-y-2">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-slate-700">
                            <Key size={18} className="text-blue-600 dark:text-blue-400" />
                            6. Seguridad, Confidencialidad y Registro de Logs (Art. 14 quinquies)
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li><strong>Control Multi-empresa (Art. 14 bis):</strong> Estricta separación de datos entre Mandante, Contratista y Subcontratista. Cada contratista accede únicamente a su nómina de personal.</li>
                            <li><strong>Registro Obligatorio de Accesos (Audit Trail):</strong> Cada lectura (`VIEW`), descarga (`DOWNLOAD`) o modificación (`EDIT`) de documentos de salud y remuneraciones queda registrada en logs inmutables con usuario, fecha, hora exacta e ID del documento.</li>
                            <li><strong>Cifrado y Resguardo:</strong> Almacenamiento con cifrado estándar de la industria en tránsito y reposo.</li>
                        </ul>
                    </section>

                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 dark:bg-slate-900/80 px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-green-500" />
                        Vigencia Actualizada Ley 21.719 Chile
                    </span>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-md transition-colors"
                    >
                        Entendido
                    </button>
                </div>

            </div>
        </div>
    );
};

const Building2Icon = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width={16} height={20} x={4} y={2} rx={2} ry={2} />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
);
