
/**
 * ESQUEMA DE BASE DE DATOS (Simulado en TypeScript)
 * 
 * Estructura Relacional:
 * 1. Company (Contratista) -> 1:N -> Project (Contratos)
 * 2. Company -> 1:N -> Worker
 * 3. Company -> 1:N -> Vehicle
 * 4. DocumentSubmission -> Vinculado a Entity + Project
 */

export enum DocStatus {
    PENDING = 'PENDING',       // No subido
    IN_REVIEW = 'IN_REVIEW',   // Subido, esperando validación
    APPROVED = 'APPROVED',     // Validado OK
    REJECTED = 'REJECTED'      // Rechazado (debe resubir)
}

// NUEVO: Estados específicos del dictamen de IA
export type AiVerdict = 'REVIEW' | 'VALIDATION' | 'APPROVAL' | 'REJECTION' | 'NONE';

export enum EntityType {
    COMPANY = 'COMPANY',
    WORKER = 'WORKER',
    VEHICLE = 'VEHICLE'
}

export enum ReqCategory {
    LEGAL = 'LEGAL',
    TRAINING = 'TRAINING',
    HEALTH = 'HEALTH',
    TECHNICAL = 'TECHNICAL',
    CRITICAL = 'CRITICAL',
    EHS = 'EHS' // Nueva categoría para el módulo de seguridad
}

// NUEVO: Tipos de Trabajos Críticos
export type CriticalWork = 'LOTO' | 'CONFINED_SPACE' | 'HEIGHT' | 'HOT_WORK' | 'CHEMICALS';

export const CRITICAL_WORKS_LABELS: Record<CriticalWork, string> = {
    LOTO: 'Aislación y Bloqueo (LOTO)',
    CONFINED_SPACE: 'Espacios Confinados',
    HEIGHT: 'Trabajo en Altura',
    HOT_WORK: 'Trabajo en Caliente',
    CHEMICALS: 'Sustancias Químicas'
};

// NUEVO: Fuentes de Validación Externa
export enum VerificationSource {
    AI_ONLY = 'AI_ONLY',       // Solo análisis visual IA
    DT_GOB = 'DT_GOB',         // Dirección del Trabajo (Chile)
    REGISTRO_CIVIL = 'SRCEI',  // Servicio Registro Civil e Identificación
    PRT_CL = 'PRT_CL',         // Plantas Revisión Técnica
    SII = 'SII',               // Servicio Impuestos Internos
    PREVIRED = 'PREVIRED',     // Previred
    ACHS = 'ACHS',             // Asociación Chilena de Seguridad
    MANUAL = 'MANUAL'          // Auditor Humano
}

export type UserRole = 'ADMIN' | 'CONTRACTOR';

export interface User {
    id: string;
    email: string;
    password: string; // En prod esto debe ser un hash
    name: string;
    role: UserRole;
    companyId?: string; // Si es contractor, vincula a su empresa
    preferences?: {
        darkMode: boolean;
        language: 'es' | 'en';
    };
}

// Representa un "Tipo" de documento requerido (ej: "Certificado F-30-1")
export interface RequirementDef {
    id: string;
    name: string;
    description: string;
    entityType: EntityType;
    category?: ReqCategory; // Nueva categorización
    legalBasis?: string; // Ej: "Art 183-C Código del Trabajo"
    renewalFrequencyMonths?: number;
    // NUEVO: Indica si este tipo de documento es validable por API externa
    validationEndpoint?: 'DT_F30' | 'RC_ID' | 'PRT_REV';
    // NUEVO: Vinculación a trabajo crítico (solo aparece si la empresa tiene este trabajo)
    linkedCriticalWork?: CriticalWork;
    // NUEVO: Vinculación a roles específicos de trabajador (ej: Conductor)
    linkedRoles?: string[]; 
    // NUEVO: Vinculación a condición especial (ej: tiene subcontratos)
    specialCondition?: 'HAS_SUBCONTRACTORS';
    templateUrl?: string; // URL para descargar plantilla
    linkedVehicleTypes?: string[]; // Tipos de vehículo
}

// Representa el archivo físico subido y su estado
export interface DocumentSubmission {
    id: string;
    requirementId: string;
    entityId: string; // ID de la Empresa, Trabajador o Vehículo
    projectId: string; // NUEVO: Vinculación al contrato específico
    fileName: string;
    fileUrl: string; // En prod: S3/Blob storage URL
    uploadDate: string;
    status: DocStatus;
    reviewerComment?: string;
    startDate?: string; // NUEVO: Fecha Inicio Vigencia
    expiryDate?: string; // Fecha Término Vigencia
    
    // NUEVO: Metadatos de Validación
    verificationSource?: VerificationSource;
    aiVerdict?: AiVerdict; // NUEVO: Dictamen específico de la IA
    extractedMetadata?: Record<string, any>; // Ej: { folio: "12345", rut: "1-9" }
    
    // NUEVO: Historial de Versiones
    history?: {
        date: string;
        action: 'UPLOAD' | 'APPROVE' | 'REJECT';
        user: string;
        comment?: string;
    }[];
}

export interface Worker {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    rut: string; // ID Nacional
    role: string; // Ej: "Soldador", "Eléctrico", "Conductor"
    documents: DocumentSubmission[]; // Relación 1:N
    qrCodeUrl?: string; // URL generada para pase
}

export interface Vehicle {
    id: string;
    companyId: string;
    plate: string;
    type: string; // Ej: "Camión Pluma", "Camioneta"
    model: string;
    documents: DocumentSubmission[]; // Relación 1:N
}

// NUEVO: Detalle granular de incidentes
export interface IncidentDetail {
    count: number;
    reference: string;
}

export interface EHSDetails {
    nearMisses: IncidentDetail;
    firstAid: IncidentDetail;
    medicalTreatment: IncidentDetail;
    lostTime: IncidentDetail;
    envIncidents: IncidentDetail;
    propertyDamage: IncidentDetail;
    fatalities: IncidentDetail;
    publicDamage: IncidentDetail;
}

// NUEVO: Estadísticas Mensuales de Seguridad
export interface MonthlySafetyStats {
    id: string;
    month: string; // Formato YYYY-MM
    
    // Campos Agregados (Sumatorias para Dashboards Rápidos)
    accidents: number; // CTP + STP + Fatales
    incidents: number; // Ambientales + Publico
    nearMisses: number;
    propertyDamage: number;
    manHours: number; // Horas Hombre
    
    // Detalle Granular (Nuevo requerimiento UI)
    detailedStats?: EHSDetails;

    updatedAt: string;
}

// NUEVO: Definición de Proyecto / Contrato
export interface Project {
    id: string;
    name: string; // Ej: "Mantenimiento Planta Ácido"
    contractNumber: string; // Ej: "CTR-2024-001"
    isActive: boolean;
    description?: string;
    safetyStats?: MonthlySafetyStats[]; // Historial de estadísticas
}

export interface Company {
    id: string;
    name: string;
    rut: string;
    contactEmail: string;
    projects: Project[]; // NUEVO: Lista de contratos
    documents: DocumentSubmission[]; // Relación 1:N (Docs a nivel empresa)
    workers: Worker[];
    vehicles: Vehicle[];
    accessAuthorized: boolean; // El "Semáforo" final (Podría migrar a ser por proyecto, pero lo mantenemos global o calculado)
    criticalWorks?: CriticalWork[]; // NUEVO: Lista de trabajos críticos asignados
    hasSubcontractors?: boolean; // NUEVO: Indica si tiene subcontratos para lógica EHS
}

// Type para el Dashboard
export interface ComplianceStats {
    totalDocs: number;
    approved: number;
    pending: number;
    rejected: number;
    compliancePercentage: number;
}

// Type para Notificaciones
export interface AppNotification {
    id: string;
    companyId: string;
    title: string;
    message: string;
    type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
    timestamp: string;
    isRead: boolean;
    relatedDocId?: string;
}

// NUEVO: Log de Auditoría
export interface AuditLog {
    id: string;
    timestamp: string;
    action: string; // LOGIN, UPLOAD, APPROVE, REJECT, DELETE
    userId: string;
    userName: string;
    details: string;
}

// NUEVO: Corporate Requirements Support
export type RequirementStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VALIDATED';

export interface CorporateRequirement {
    id: string;
    name: string;
    category: 'PROGRAM' | 'CONTROL';
    status: RequirementStatus;
    isChecked?: boolean;
    evidenceName?: string;
    updatedAt?: string;
}
