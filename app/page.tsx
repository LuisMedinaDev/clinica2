"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Stethoscope,
  Scissors,
  Scan,
  HeartPulse,
  Bed,
  Phone,
  Check,
  Calendar,
  Clock,
  Building2,
} from "lucide-react";

// Catálogo Homogéneo de Servicios Hospitalarios
const SERVICIOS_DATA = [
  {
    id: "SRV-001",
    nombre: "Área de Emergencia y Triaje Médico",
    icon: Activity,
    descripcion:
      "Atención médica inmediata para la estabilización de cuadros agudos, crisis hipertensivas, fiebre elevada y soporte inicial de urgencia.",
    items: [
      "Triaje y valoración clínica de urgencias",
      "Manejo inicial de dolor agudo y traumatismos",
      "Nebulizaciones y oxigenoterapia continua",
      "Monitoreo hemodinámico y estabilización",
    ],
    horario: "Guardias diurnas y fines de semana",
  },
  {
    id: "SRV-002",
    nombre: "Quirófano y Cirugía Ambulatoria",
    icon: Scissors,
    descripcion:
      "Pabellón quirúrgico acondicionado para procedimientos electivos menores y cirugías ambulatorias programadas con estrictas normas de asepsia.",
    items: [
      "Cirugía menor y de partes blandas",
      "Extirpación de lipomas, quistes y biopsias",
      "Cirugía de hernias no complicadas",
      "Sala de recuperación post-quirúrgica",
    ],
    horario: "Procedimientos programados",
  },
  {
    id: "SRV-003",
    nombre: "Servicio de Radiología (Rayos X)",
    icon: Scan,
    descripcion:
      "Diagnóstico por imágenes con tecnología digitalizada para la evaluación ósea, torácica y articular con entrega rápida de informes.",
    items: [
      "Rayos X digitalizados de tórax y extremidades",
      "Evaluación de fracturas, luxaciones y traumatismos",
      "Estudios radiológicos preoperatorios",
      "Informes médicos especializados",
    ],
    horario: "Lunes a Viernes: 8:00 AM - 4:00 PM",
  },
  {
    id: "SRV-004",
    nombre: "Consulta de Medicina General",
    icon: Stethoscope,
    descripcion:
      "Evaluación clínica integral para adultos y niños, control periódico de patologías crónicas y chequeos médicos preventivos.",
    items: [
      "Control y seguimiento de hipertensión y diabetes",
      "Evaluaciones médicas preoperatorias",
      "Diagnóstico de patologías infecciosas",
      "Chequeos preventivos integrales",
    ],
    horario: "Lunes a Sábado: 7:00 AM - 5:00 PM",
  },
  {
    id: "SRV-005",
    nombre: "Enfermería y Cuidados Clínicos",
    icon: HeartPulse,
    descripcion:
      "Personal de enfermería profesional para la administración de tratamientos médicos, toma de signos vitales y cuidados asistenciales.",
    items: [
      "Administración de tratamientos parenterales",
      "Curaciones quirúrgicas simples y complejas",
      "Control de tensión arterial y glicemia capilar",
      "Atención directa al paciente en sala",
    ],
    horario: "Atención diurna continua",
  },
  {
    id: "SRV-006",
    nombre: "Sala de Observación y Recuperación",
    icon: Bed,
    descripcion:
      "Camas clínicas acondicionadas para reposo asistido, restitución de líquidos y vigilancia continua bajo indicación facultativa.",
    items: [
      "Monitoreo de signos vitales periódicos",
      "Terapia de hidratación parenteral endovenosa",
      "Recuperación post-anestésica inmediata",
      "Vigilancia clínica previa al alta médica",
    ],
    horario: "Según prescripción médica",
  },
];

// Directorio del Personal de Salud con Fotos Reales Profesionales
const PERSONAL_SALUD = [
  {
    id: "PER-001",
    nombre: "Dr. Arquímedes Márquez",
    cargo: "Médico - Gerente",
    especialidad: "Medicina General / Cirugía Menor",
    cedula: "V-14.238.901",
    mpps: "MPPS 45.291",
    colegio: "Col. Médico Monagas #3.842",
    telefono: "0414-7890123",
    foto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
    descripcion:
      "Dirección médica de la institución, procedimientos ambulatorios y consulta general integral de adultos y niños.",
  },
  {
    id: "PER-002",
    nombre: "Dra. Elisbeth Malave",
    cargo: "Médico Especialista en Radiología",
    especialidad: "Imagenología y Diagnóstico por Imágenes",
    cedula: "V-18.452.110",
    mpps: "MPPS 58.710",
    colegio: "Col. Médico Monagas #4.190",
    telefono: "0424-3456789",
    foto: "https://images.unsplash.com/photo-1594824813511-4b1307b9cf47?auto=format&fit=crop&w=400&q=80",
    descripcion:
      "Interpretación especializada de estudios radiológicos digitales, placas de tórax, óseas y valoraciones prequirúrgicas.",
  },
  {
    id: "PER-003",
    nombre: "Lic. María Rondón",
    cargo: "Enfermera Coordinadora Asistencial",
    especialidad: "Instrumentación Quirúrgica y Cuidados Críticos",
    cedula: "V-20.312.445",
    mpps: "CPE-9821",
    colegio: "Col. Profesionales de Enfermería",
    telefono: "0416-8901234",
    foto: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80",
    descripcion:
      "Supervisión de procedimientos asistenciales, bioseguridad en área quirúrgica y monitoreo continuo en recuperación.",
  },
  {
    id: "PER-004",
    nombre: "Lic. Danny Díaz",
    cargo: "Enfermera de Procedimientos Clínicos",
    especialidad: "Curas Quirúrgicas y Cuidados Ambulatorios",
    cedula: "V-22.109.876",
    mpps: "CPE-10442",
    colegio: "Col. Profesionales de Enfermería",
    telefono: "0414-5544332",
    foto: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    descripcion:
      "Atención en curas post-quirúrgicas, administración parenteral de analgésicos y control directo de vías de infusión.",
  },
  {
    id: "PER-005",
    nombre: "Lic. Betzabeth Medina",
    cargo: "Enfermera Asistencial de Triaje",
    especialidad: "Control de Signos Vitales y Triaje",
    cedula: "V-23.778.654",
    mpps: "CPE-11503",
    colegio: "Col. Profesionales de Enfermería",
    telefono: "0426-1122334",
    foto: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80",
    descripcion:
      "Toma sistemática de constantes vitales, glicemia capilar y orientación inicial al paciente que ingresa a consulta.",
  },
  {
    id: "PER-006",
    nombre: "Sra. Marielis Mendoza",
    cargo: "Administradora General",
    especialidad: "Gestión Administrativa y Financiera",
    cedula: "V-17.892.400",
    mpps: "Área Administrativa",
    colegio: "Administración Hospitalaria",
    telefono: "0414-8899001",
    foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    descripcion:
      "Planificación de suministros hospitalarios, facturación de servicios y coordinación operativa de la clínica.",
  },
  {
    id: "PER-007",
    nombre: "Stefani Padilla",
    cargo: "Secretaría y Admisión de Pacientes",
    especialidad: "Atención al Usuario y Agendamiento",
    cedula: "V-25.990.123",
    mpps: "Área de Admisión",
    colegio: "Atención al Usuario",
    telefono: "0414-9988776",
    foto: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=400&q=80",
    descripcion:
      "Recepción de pacientes, confirmación de turnos médicos y apertura de expedientes clínicos institucionales.",
  },
];

export default function PortalPage() {
  const [filtroPersonal, setFiltroPersonal] = useState("TODOS");

  const [citaForm, setCitaForm] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    servicioRequerido: "Área de Emergencia y Triaje",
    fechaDeseada: "",
    motivo: "",
  });

  const [citaConfirmada, setCitaConfirmada] = useState<any>(null);

  const handleEnviarCita = (e: React.FormEvent) => {
    e.preventDefault();
    const codigoCita = `CITA-CSJ-${Date.now().toString().slice(-5)}`;
    setCitaConfirmada({
      codigo: codigoCita,
      ...citaForm,
    });
    setCitaForm({
      nombre: "",
      cedula: "",
      telefono: "",
      servicioRequerido: "Área de Emergencia y Triaje",
      fechaDeseada: "",
      motivo: "",
    });
  };

  const personalFiltrado = PERSONAL_SALUD.filter((persona) => {
    if (filtroPersonal === "MEDICOS") return persona.cargo.includes("Médico");
    if (filtroPersonal === "ENFERMERIA") return persona.cargo.includes("Enfermera");
    if (filtroPersonal === "ADMIN")
      return (
        persona.cargo.includes("Administradora") ||
        persona.cargo.includes("Secretaría")
      );
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Bar Institucional */}
      <div className="bg-slate-950 text-blue-200 text-xs py-2.5 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="font-normal text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-teal-400 inline" />
            Avenida Principal de Temblador, Municipio Libertador, Estado Monagas
          </span>
          <Link
            href="/historias"
            className="bg-teal-700 hover:bg-teal-600 text-white font-medium px-3.5 py-1 rounded-md text-[11px] border border-teal-500/50 transition flex items-center gap-1.5 shadow-xs"
          >
            <span className="w-3.5 h-3.5 text-teal-200" />
            →
          </Link>
        </div>
      </div>

      {/* Navegación Principal Sobria */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-900 rounded-xl flex items-center justify-center text-teal-100 font-bold text-sm tracking-wider shadow-sm">
              CSJ
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                CLÍNICA SAN JORGE C.A.
              </h1>
              <p className="text-xs text-teal-800 font-medium">
                Servicios Médicos Hospitalarios • Temblador
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-7 text-xs font-semibold text-slate-700">
            <a href="#servicios" className="hover:text-teal-800 transition">
              Servicios
            </a>
            <a href="#equipo" className="hover:text-teal-800 transition">
              Directorio Médico
            </a>
            <a href="#citas" className="bg-teal-800 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Solicitar Turno
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="inicio"
        className="bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950 text-white py-16 sm:py-20 px-4"
      >
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <span className="inline-block text-xs font-medium bg-teal-950/80 text-teal-200 px-3.5 py-1 rounded-full border border-teal-700/60 shadow-xs">
            Centro Asistencial Privado • Temblador, Estado Monagas
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Atención médica organizada, oportuna y con vocación profesional
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Brindamos servicios clínicos integrales que abarcan atención médica general,
            radiología digital, sala de observación, triaje de emergencia y procedimientos quirúrgicos ambulatorios.
          </p>
          <div className="pt-3 flex flex-wrap justify-center gap-3">
            <a
              href="#servicios"
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition shadow-sm"
            >
              Servicios Disponibles
            </a>
            <a
              href="#equipo"
              className="bg-teal-900 hover:bg-teal-800 text-white font-medium px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider border border-teal-600 transition"
            >
              Cuerpo Asistencial
            </a>
          </div>
        </div>
      </section>

      {/* SECCIÓN 1: SERVICIOS HOSPITALARIOS */}
      <section id="servicios" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-teal-800 font-bold text-xs uppercase tracking-wider">
            Capacidades Asistenciales
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Servicios Clínicos Especializados
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2">
            Estructura operativa orientada al diagnóstico certero, tratamiento eficiente y la recuperación integral del paciente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICIOS_DATA.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs hover:shadow-md hover:border-teal-700/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4 text-teal-800">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {srv.id}
                    </span>
                    <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {srv.horario}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {srv.nombre}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {srv.descripcion}
                  </p>
                  <ul className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    {srv.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECCIÓN 2: CUERPO MÉDICO Y ASISTENCIAL */}
      <section id="equipo" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-teal-800 font-bold text-xs uppercase tracking-wider">
            Cuerpo Asistencial
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Directorio del Personal de Salud
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2">
            Profesionales colegiados comprometidos con la ética médica y la seguridad del paciente.
          </p>

          {/* Filtros de Personal */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              { id: "TODOS", label: "Todo el Personal" },
              { id: "MEDICOS", label: "Médicos Especialistas" },
              { id: "ENFERMERIA", label: "Equipo de Enfermería" },
              { id: "ADMIN", label: "Administración y Admisión" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFiltroPersonal(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filtroPersonal === tab.id
                    ? "bg-teal-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {personalFiltrado.map((persona) => (
            <div
              key={persona.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
            >
              <div className="h-44 overflow-hidden bg-slate-100 relative flex items-center justify-center">
                {/* Foto de perfil vacía */}
                <div className="flex flex-col items-center justify-center gap-1 text-slate-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 80 80"
                    className="w-20 h-20"
                    fill="none"
                  >
                    <circle cx="40" cy="40" r="40" fill="#e2e8f0" />
                    <circle cx="40" cy="30" r="13" fill="#94a3b8" />
                    <ellipse cx="40" cy="68" rx="22" ry="14" fill="#94a3b8" />
                  </svg>
                </div>
                <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  {persona.id}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {persona.nombre}
                  </h4>
                  <p className="text-xs font-medium text-teal-800 mt-0.5">
                    {persona.cargo}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {persona.especialidad}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600 font-mono">
                    <p>CI: {persona.cedula}</p>
                    <p>{persona.mpps}</p>
                    <p className="text-[10px] text-slate-500 truncate">{persona.colegio}</p>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-snug">
                    {persona.descripcion}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono text-[11px] text-teal-900 font-medium">
                    <Phone className="w-3 h-3 text-teal-700" /> {persona.telefono}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 3: SOLICITAR TURNO / CITA */}
      <section id="citas" className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <span className="text-teal-800 font-bold text-xs uppercase tracking-wider">
              Atención Programada
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Solicitud de Cita o Evaluación Clínica
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete el siguiente formulario para tramitar su asignación de turno en recepción.
            </p>
          </div>

          {citaConfirmada ? (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-teal-800 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">
                ¡Solicitud Registrada con Éxito!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Su código de solicitud es{" "}
                <span className="font-mono font-bold text-teal-900 text-sm bg-white px-2 py-0.5 rounded border border-teal-200">
                  {citaConfirmada.codigo}
                </span>
                . Presente este comprobante en la taquilla de admisión o espere la confirmación telefónica.
              </p>

              <div className="bg-white rounded-lg p-3 text-left text-xs text-slate-700 max-w-sm mx-auto border border-teal-100 space-y-1">
                <p>
                  <b>Paciente:</b> {citaConfirmada.nombre} ({citaConfirmada.cedula})
                </p>
                <p>
                  <b>Servicio:</b> {citaConfirmada.servicioRequerido}
                </p>
                <p>
                  <b>Fecha sugerida:</b> {citaConfirmada.fechaDeseada}
                </p>
                <p>
                  <b>Contacto:</b> {citaConfirmada.telefono}
                </p>
              </div>

              <button
                onClick={() => setCitaConfirmada(null)}
                className="text-xs bg-teal-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition"
              >
                Nueva Solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnviarCita} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombres y Apellidos"
                    value={citaForm.nombre}
                    onChange={(e) =>
                      setCitaForm({ ...citaForm, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="V-XX.XXX.XXX"
                    value={citaForm.cedula}
                    onChange={(e) =>
                      setCitaForm({ ...citaForm, cedula: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono de Contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0414-XXXXXXX"
                    value={citaForm.telefono}
                    onChange={(e) =>
                      setCitaForm({ ...citaForm, telefono: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Área o Servicio Requerido *
                  </label>
                  <select
                    value={citaForm.servicioRequerido}
                    onChange={(e) =>
                      setCitaForm({
                        ...citaForm,
                        servicioRequerido: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 font-medium"
                  >
                    <option value="Área de Emergencia y Triaje">
                      Área de Emergencia y Triaje
                    </option>
                    <option value="Servicio de Radiología (Rayos X)">
                      Servicio de Radiología (Rayos X)
                    </option>
                    <option value="Quirófano / Cirugía Ambulatoria">
                      Quirófano / Cirugía Ambulatoria
                    </option>
                    <option value="Medicina General y Consulta">
                      Consulta de Medicina General
                    </option>
                    <option value="Enfermería y Curaciones">
                      Enfermería y Curaciones
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fecha Deseada *
                </label>
                <input
                  type="date"
                  required
                  value={citaForm.fechaDeseada}
                  onChange={(e) =>
                    setCitaForm({ ...citaForm, fechaDeseada: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo o Breve Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Indique brevemente el motivo de su consulta o estudio..."
                  value={citaForm.motivo}
                  onChange={(e) =>
                    setCitaForm({ ...citaForm, motivo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-900 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-lg transition text-xs tracking-wider uppercase shadow-xs"
              >
                Enviar Solicitud
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer Formal */}
      <footer className="bg-white border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-slate-900">
              CLÍNICA SAN JORGE C.A. • RIF: J-40812903-1
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Avenida Principal de Temblador, Municipio Libertador, Estado Monagas, Venezuela.
            </p>
          </div>
          <div className="text-right">
            <p>© 2026 Clínica San Jorge C.A. Todos los derechos reservados.</p>
            <p className="text-[11px] text-slate-400">
              Proyecto Socio-Tecnológico UTDFT • PNF en Informática
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
