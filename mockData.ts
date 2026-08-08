
import { Company, DocStatus, EntityType, RequirementDef, DocumentSubmission, ReqCategory, User, VerificationSource } from './types';

// Definición de Requisitos (Catalog)
export const REQUIREMENTS: RequirementDef[] = [
    // --- [MODULO EMPRESA - LEGAL / RRHH] ---
    { id: 'req_c_riohs_cartas', name: 'Cartas Recepción RIOHS (Seremi/IT)', entityType: EntityType.COMPANY, category: ReqCategory.LEGAL, description: 'Cartas de recepción del Reglamento Interno actual ante Seremi de Salud e Inspección del Trabajo.' },
    { id: 'req_c_riohs_doc', name: 'Reglamento Interno (RIOHS)', entityType: EntityType.COMPANY, category: ReqCategory.LEGAL, description: 'Documento completo del Reglamento Interno de Orden, Higiene y Seguridad.' },
    { id: 'req_c_afiliacion', name: 'Cert. Afiliación Mutualidad (Ley 16.744)', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Certificado de adhesión a organismo administrador (ACHS, Mutual, IST o ISL).' },
    { id: 'req_c_cotiz_mutual', name: 'Cert. Cotizaciones Mutualidad al día', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Certificado que acredite pago de cotizaciones de la Ley 16.744.' },
    { id: 'req_c_accidentabilidad', name: 'Informe Accidentabilidad (Últimos 3 años)', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Indices de siniestralidad, frecuencia y gravedad de los últimos 3 periodos.' },
    { id: 'req_c_prevencionista', name: 'Antecedentes Responsable Prevención', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Registro SNS y contrato del experto en prevención de riesgos.' },
    { id: 'req_c_comite_paritario', name: 'Acta CPHS o Delegado SSO', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Acta de constitución vigente de Comité Paritario o designación de Delegado.' },
    { id: 'req_c_calidad_epp', name: 'Certificados de Calidad EPP', entityType: EntityType.COMPANY, category: ReqCategory.TECHNICAL, description: 'Certificaciones de cumplimiento de estándares de los equipos de protección.' },
    { id: 'req_c_nomina_mensual', name: 'Nómina Trabajadores DataLuna', entityType: EntityType.COMPANY, category: ReqCategory.LEGAL, description: 'Listado del personal presente en instalaciones durante el mes en curso.' },
    { id: 'req_c_f30_1', name: 'Certificado F30-1 (Cumplimiento)', entityType: EntityType.COMPANY, category: ReqCategory.LEGAL, description: 'Certificado de Cumplimiento de Obligaciones Laborales y Previsionales (Dirección del Trabajo).', validationEndpoint: 'DT_F30' },
    { id: 'req_c_previred', name: 'Planilla Pago Cotizaciones (Previred)', entityType: EntityType.COMPANY, category: ReqCategory.LEGAL, description: 'Comprobante de pago de cotizaciones previsionales del mes anterior.' },
    { id: 'req_c_desvinculaciones', name: 'Desvinculaciones del Mes', entityType: EntityType.COMPANY, category: ReqCategory.LEGAL, description: 'Finiquitos o avisos de término de contrato del personal que salió del proyecto.' },
    { id: 'req_c_f30', name: 'Certificado F30 (Antecedentes)', entityType: EntityType.COMPANY, category: ReqCategory.LEGAL, description: 'Certificado de Antecedentes Laborales y Previsionales.' },
    { id: 'req_c_protocolos_minsal', name: 'Protocolos MINSAL', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Documentación de implementación de protocolos (TMERT, MMC, PREXOR, etc.).' },
    { id: 'req_c_plan_prevencion', name: 'Plan Prevención Riesgos (DS 44)', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Plan de seguridad alineado al Decreto Supremo 44.' },
    { id: 'req_c_prog_cap', name: 'Programa de Capacitaciones Corporativas', entityType: EntityType.COMPANY, category: ReqCategory.TRAINING, description: 'Plan anual de formación incluyendo exigencias mínimas del mandante.' },
    { id: 'req_c_matriz_legal', name: 'Matriz de Cumplimiento Legal', entityType: EntityType.COMPANY, category: ReqCategory.LEGAL, description: 'Listado de normativa aplicable y estado de cumplimiento.' },
    { id: 'req_c_matriz_epp', name: 'Matriz de EPP por Cargo', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Definición de elementos de protección personal por perfil de riesgo.' },
    { id: 'req_c_miper', name: 'Matriz MIPER', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Identificación de Peligros y Evaluación de Riesgos actualizada.' },
    { id: 'req_c_prog_prevencion', name: 'Programas de Prevención', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Programa de Vigilancia Médica y otros programas preventivos requeridos.' },
    { id: 'req_c_plan_emergencia', name: 'Plan de Emergencias Específico', entityType: EntityType.COMPANY, category: ReqCategory.EHS, description: 'Plan de respuesta ante emergencias actualizado según riesgos críticos.' },

    // --- [MODULO TRABAJADOR - DOCUMENTOS BASE] ---
    { id: 'req_w_id', name: 'Cédula de Identidad / Pasaporte', entityType: EntityType.WORKER, category: ReqCategory.LEGAL, description: 'Copia legible por ambos lados o documento de identidad internacional.' },
    { id: 'req_w_contrato', name: 'Contrato y Anexo DataLuna', entityType: EntityType.WORKER, category: ReqCategory.LEGAL, description: 'Contrato de trabajo con anexo específico de vinculación al proyecto DataLuna.' },
    { id: 'req_w_irl', name: 'Informativo de Riesgos (IRL)', entityType: EntityType.WORKER, category: ReqCategory.EHS, description: 'Derecho a saber / Obligación de informar específica de la empresa.' },
    { id: 'req_w_induccion', name: 'Inducción Corporativa', entityType: EntityType.WORKER, category: ReqCategory.TRAINING, description: 'Comprobante de aprobación de inducción corporativa.' },
    { id: 'req_w_entrega_epp', name: 'Registro Entrega de EPP', entityType: EntityType.WORKER, category: ReqCategory.EHS, description: 'Comprobante firmado de recepción de elementos de protección.' },
    { id: 'req_w_entrega_riohs', name: 'Registro Entrega RIOHS', entityType: EntityType.WORKER, category: ReqCategory.LEGAL, description: 'Comprobante de recepción del Reglamento Interno de la empresa.' },
    { id: 'req_w_difusion_miper', name: 'Registro Difusión MIPER', entityType: EntityType.WORKER, category: ReqCategory.EHS, description: 'Evidencia de conocimiento de la matriz de riesgos por parte del trabajador.' },
    { id: 'req_w_difusion_pts', name: 'Difusión Protocolos y PTS', entityType: EntityType.WORKER, category: ReqCategory.EHS, description: 'Registro de difusión de Procedimientos de Trabajo Seguro y Protocolos MINSAL.' },
    { id: 'req_w_examen', name: 'Examen Preocupacional / Ocupacional', entityType: EntityType.WORKER, category: ReqCategory.HEALTH, description: 'Certificado de aptitud médica vigente para el cargo.' },

    // --- [MODULO TRABAJADOR - CAPACITACIONES] ---
    { id: 'req_w_cap_extintores', name: 'Formación Manejo de Extintores', entityType: EntityType.WORKER, category: ReqCategory.TRAINING, description: 'Curso teórico-práctico de uso de extintores portátiles.' },
    { id: 'req_w_cap_primeros_auxilios', name: 'Formación Primeros Auxilios', entityType: EntityType.WORKER, category: ReqCategory.TRAINING, description: 'Capacitación en respuesta inicial ante emergencias médicas.' },
    { id: 'req_w_cap_uso_epp', name: 'Formación Uso de EPP', entityType: EntityType.WORKER, category: ReqCategory.TRAINING, description: 'Capacitación en el uso correcto de elementos de protección.' },
    { id: 'req_w_cap_cuidado_epp', name: 'Uso y Cuidado de EPP', entityType: EntityType.WORKER, category: ReqCategory.TRAINING, description: 'Capacitación específica en mantenimiento y reposición de EPP.' },
    { id: 'req_w_cap_quimicos', name: 'Productos Químicos y Sust. Peligrosas', entityType: EntityType.WORKER, category: ReqCategory.TRAINING, description: 'Capacitación según alcance de trabajo con sustancias peligrosas.' },
    { id: 'req_w_cap_corp_relevant', name: 'Capacitación Procedimientos Corporativos', entityType: EntityType.WORKER, category: ReqCategory.TRAINING, description: 'Formación en procedimientos relevantes según alcance del contrato.' },
    { id: 'req_w_loto_std', name: 'Certificado LOTO (Aislación y Bloqueo)', entityType: EntityType.WORKER, category: ReqCategory.TRAINING, description: 'Certificado de capacitación en estándar de Aislación y Bloqueo de Energías Peligrosas.', linkedCriticalWork: 'LOTO' },

    // --- [MODULO VEHÍCULOS] ---
    { id: 'req_v_rt', name: 'Revisión Técnica', entityType: EntityType.VEHICLE, category: ReqCategory.TECHNICAL, description: 'Certificado vigente.', validationEndpoint: 'PRT_REV' },
    { id: 'req_v_pc', name: 'Permiso de Circulación', entityType: EntityType.VEHICLE, category: ReqCategory.TECHNICAL, description: 'Correspondiente al periodo vigente.' },
    { id: 'req_v_soap', name: 'Seguro Obligatorio (SOAP)', entityType: EntityType.VEHICLE, category: ReqCategory.TECHNICAL, description: 'Certificado de seguro vigente.' },
    { id: 'req_v_padron', name: 'Padrón / Cert. Inscripción', entityType: EntityType.VEHICLE, category: ReqCategory.TECHNICAL, description: 'Certificado de Anotaciones Vigentes.' },
    { id: 'req_v_mantencion', name: 'Programa de Mantención Preventiva', entityType: EntityType.VEHICLE, category: ReqCategory.TECHNICAL, description: 'Plan de mantenimiento vigente aplicable a vehículos livianos y maquinaria pesada.', linkedVehicleTypes: ['Vehículo Liviano', 'Camión', 'Maquinaria Pesada'] }
];

// Datos Iniciales
const initialDocs: DocumentSubmission[] = [
    { 
        id: 'd1', requirementId: 'req_c_f30_1', entityId: 'comp_1', projectId: 'proj_1', fileName: 'f30_octubre.pdf', fileUrl: '#', uploadDate: '2023-10-01', status: DocStatus.APPROVED, expiryDate: '2023-11-01', verificationSource: VerificationSource.DT_GOB, reviewerComment: 'Validado automáticamente en Dirección del Trabajo.',
        extractedMetadata: { folio_number: '123456789', rut_holder: '76.543.210-K', start_date: '2023-10-01', expiry_date: '2023-11-01' }
    }, 
    { id: 'd2', requirementId: 'req_c_afiliacion', entityId: 'comp_1', projectId: 'proj_1', fileName: 'poliza_seguro.pdf', fileUrl: '#', uploadDate: '2023-01-15', status: DocStatus.APPROVED },
];

export const MOCK_COMPANY: Company = {
    id: 'comp_1',
    name: 'Constructora Andes Limitada',
    rut: '76.543.210-K',
    contactEmail: 'contacto@andes.cl',
    accessAuthorized: false,
    criticalWorks: ['LOTO', 'HEIGHT'], // Ejemplo: Esta empresa realiza LOTO y ALTURA
    hasSubcontractors: false, // Default
    projects: [
        { id: 'proj_1', name: 'Montaje Estructural Nave A', contractNumber: 'CTR-2023-088', isActive: true, safetyStats: [] },
        { id: 'proj_2', name: 'Mantenimiento Preventivo 2024', contractNumber: 'OS-2024-002', isActive: true, safetyStats: [] }
    ],
    documents: initialDocs,
    workers: [
        {
            id: 'w_1',
            companyId: 'comp_1',
            firstName: 'Juan',
            lastName: 'Pérez',
            rut: '12.345.678-9',
            role: 'Soldador Calificado',
            documents: [
                // Legales
                { id: 'd3', requirementId: 'req_w_contrato', entityId: 'w_1', projectId: 'proj_1', fileName: 'contrato_jp.pdf', fileUrl: '#', uploadDate: '2023-05-20', status: DocStatus.APPROVED, reviewerComment: 'Contrato firmado digitalmente.' },
                { 
                    id: 'd4', requirementId: 'req_w_entrega_epp', entityId: 'w_1', projectId: 'proj_1', fileName: 'epp_jp.jpg', fileUrl: '#', uploadDate: '2023-05-20', status: DocStatus.REJECTED, reviewerComment: 'Firma ilegible en comprobante. No se distingue recepción conforme.',
                    extractedMetadata: { is_legible: false, visual_assessment: 'REJECTED', visual_reason: 'Firma ilegible o borrosa' } 
                },
                // Capacitaciones
                { id: 'd_t1', requirementId: 'req_w_induccion', entityId: 'w_1', projectId: 'proj_1', fileName: 'induccion_site.pdf', fileUrl: '#', uploadDate: '2023-05-21', status: DocStatus.APPROVED },
            ]
        },
        {
            id: 'w_2',
            companyId: 'comp_1',
            firstName: 'Maria',
            lastName: 'González',
            rut: '15.432.109-8',
            role: 'Prevencionista',
            documents: []
        }
    ],
    vehicles: [
        {
            id: 'v_1',
            companyId: 'comp_1',
            plate: 'GK-LP-99',
            model: 'Toyota Hilux 4x4',
            type: 'Camioneta',
            documents: [
                 { 
                    id: 'd5', requirementId: 'req_v_rt', entityId: 'v_1', projectId: 'proj_1', fileName: 'rt_hilux.pdf', fileUrl: '#', uploadDate: '2023-08-01', status: DocStatus.APPROVED, expiryDate: '2024-08-01', verificationSource: VerificationSource.PRT_CL, reviewerComment: 'Patente vigente en PRT.cl',
                    extractedMetadata: { plate_number: 'GK-LP-99', start_date: '2023-08-01', expiry_date: '2024-08-01', plant_code: 'AB-01' }
                },
            ]
        }
    ]
};

// Base de datos inicial de Usuarios
export const MOCK_USERS: User[] = [
    {
        id: 'u_admin',
        email: 'admin@compliance.cl',
        password: 'admin',
        name: 'Administrador de Cumplimiento',
        role: 'ADMIN'
    },
    {
        id: 'u_comp1',
        email: 'contacto@andes.cl',
        password: '123',
        name: 'Contacto Andes',
        role: 'CONTRACTOR',
        companyId: 'comp_1'
    }
];
