"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Printer,
  FileDown,
  Save,
  Plus,
  Trash2,
  Paperclip,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const DRAFT = "hcsj.borrador.v1";
const STORE = "hcsj.historias.v1";
const PACI = "hcsj.pacientes.v1";
const DB_NAME = "hcsj-adjuntos";
const DB_STORE = "archivos";

function uid() {
  if (typeof window !== "undefined" && window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function uidPac() {
  return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function num(v: any) {
  const n = parseFloat(String(v == null ? "" : v).replace(",", "."));
  return isFinite(n) ? n : null;
}

function esc(s: any) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fechaCorta(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? m[3] + "/" + m[2] + "/" + m[1] : iso || "";
}

function normNombre(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function nombreArchivo(c: Record<string, any>) {
  return (
    (c.expediente || c.nombres || "historia")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .toLowerCase() || "historia"
  );
}

function fmtSize(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(0) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

function extOf(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name || "");
  return m ? m[1].toUpperCase().slice(0, 4) : "FILE";
}

// ================= IndexedDB Helpers =================
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("Sin IndexedDB"));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: "pk", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => any): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((res, rej) => {
        const t = db.transaction(DB_STORE, mode);
        const store = t.objectStore(DB_STORE);
        let out: any;
        try {
          out = fn(store);
        } catch (e) {
          db.close();
          return rej(e);
        }
        t.oncomplete = () => {
          db.close();
          res(out && out.result !== undefined ? out.result : out);
        };
        t.onerror = () => {
          db.close();
          rej(t.error);
        };
      })
  );
}

const dbAdd = (rec: any) => tx("readwrite", (s) => s.add(rec));
const dbAll = () => tx<any[]>("readonly", (s) => s.getAll());
const dbDelete = (pk: number) => tx("readwrite", (s) => s.delete(pk));

const DEFAULT_CAMPOS: Record<string, any> = {
  _id: "",
  _paciente: "",
  expediente: "",
  fecha_ingreso: new Date().toISOString().slice(0, 10),
  nombres: "",
  edad: "",
  fecha_nac: "",
  ocupacion: "",
  empresa: "",
  cargo: "",
  ant_patologicos: "",
  tabaco: "",
  tabaco_n: "",
  tabaco_edad: "",
  alcohol: "",
  drogas: "",
  drogas_cual: "",
  sueno: "",
  sueno_ritmo: "",
  hobby: "",
  actividad: "",
  dieta: "",
  fam_padre: "",
  fam_madre: "",
  fam_hermanos: "",
  fam_consanguineos: "",
  f_pulmonar: false,
  f_cancer: false,
  f_dm: false,
  f_cardio: false,
  f_hta: false,
  f_malf: false,
  f_osteo: false,
  f_epilepsia: false,
  f_lues: false,
  f_atopia: false,
  f_farmaco: false,
  f_mental: false,
  f_otros: false,
  ocupacional: "",
  medico: "",
  colegiacion: "",
  recibido_por: "",
  recibido_parentesco: "",
};

export default function HistoriasClinicasPage() {
  const [campos, setCampos] = useState<Record<string, any>>(() => ({
    ...DEFAULT_CAMPOS,
    _id: uid(),
  }));

  const [signos, setSignos] = useState<any[]>([
    { fecha: "", hora: "", ta: "", pulso: "", resp: "", temp: "", spo2: "", peso: "", firma: "" },
  ]);

  const [evolucion, setEvolucion] = useState<any[]>([
    { fecha: "", hora: "", nota: "", responsable: "" },
  ]);

  const [enfermeria, setEnfermeria] = useState<any[]>([
    { fecha: "", turno: "", reporte: "", enfermera: "" },
  ]);

  const [adjuntos, setAdjuntos] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<string>("");
  const [toastOn, setToastOn] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [pacientesAbiertos, setPacientesAbiertos] = useState<Record<string, boolean>>({});
  const [storeData, setStoreData] = useState<Record<string, any>>({});
  const [pacData, setPacData] = useState<Record<string, any>>({});
  const [nombreInvalido, setNombreInvalido] = useState<boolean>(false);
  const [printDate, setPrintDate] = useState<string>("");

  const toastTimerRef = useRef<any>(null);
  const draftTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastOn(false);
    }, 2500);
  }, []);

  const refreshAttachments = useCallback(async (currentId: string) => {
    if (!currentId) {
      setAdjuntos([]);
      return;
    }
    try {
      const all = (await dbAll()) || [];
      setAdjuntos(all.filter((r) => r.historiaId === currentId));
    } catch (e) {
      setAdjuntos([]);
    }
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "{}") || {};
      setStoreData(s);
    } catch (e) {}

    try {
      const p = JSON.parse(localStorage.getItem(PACI) || "{}") || {};
      setPacData(p);
    } catch (e) {}

    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT) || "null");
      if (draft && draft.campos) {
        setCampos(draft.campos);
        if (draft.signos && draft.signos.length) setSignos(draft.signos);
        if (draft.evolucion && draft.evolucion.length) setEvolucion(draft.evolucion);
        if (draft.enfermeria && draft.enfermeria.length) setEnfermeria(draft.enfermeria);
        setSaveStatus("Borrador recuperado");
        refreshAttachments(draft.campos._id);
        return;
      }
    } catch (e) {}

    refreshAttachments(campos._id);
  }, [refreshAttachments]);

  // Actualizar fecha de impresión
  useEffect(() => {
    const handleBeforePrint = () => {
      const d = new Date();
      setPrintDate(
        "Impreso: " +
          d.toLocaleDateString("es-HN") +
          " " +
          d.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })
      );
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, []);

  // Atajos de teclado Ctrl+S y Ctrl+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        guardarHistoria();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Autoguardado en borrador (debounce 350ms)
  const queueDraft = useCallback(
    (newCampos: any, newSignos: any, newEvo: any, newEnf: any) => {
      setSaveStatus("Editando…");
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        try {
          const draftPayload = {
            _v: 1,
            _modificado: new Date().toISOString(),
            campos: newCampos,
            signos: newSignos.filter((o: any) =>
              Object.values(o).some((v) => String(v).trim() !== "")
            ),
            evolucion: newEvo.filter((o: any) =>
              Object.values(o).some((v) => String(v).trim() !== "")
            ),
            enfermeria: newEnf.filter((o: any) =>
              Object.values(o).some((v) => String(v).trim() !== "")
            ),
          };
          localStorage.setItem(DRAFT, JSON.stringify(draftPayload));
          setSaveStatus("Borrador guardado");
        } catch (e) {
          setSaveStatus("⚠ Sin espacio");
        }
      }, 350);
    },
    []
  );

  const handleCampoChange = (key: string, value: any) => {
    if (key === "nombres" && value) setNombreInvalido(false);
    let nextCampos = { ...campos, [key]: value };

    // Cálculo automático de edad si cambia fecha_nac
    if (key === "fecha_nac" && value) {
      const n = new Date(value + "T00:00:00");
      if (!isNaN(n.getTime())) {
        const hoy = new Date();
        let a = hoy.getFullYear() - n.getFullYear();
        const m = hoy.getMonth() - n.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) a--;
        if (a >= 0 && a < 130) {
          nextCampos.edad = String(a);
        }
      }
    }

    setCampos(nextCampos);
    queueDraft(nextCampos, signos, evolucion, enfermeria);
  };

  const handleRowChange = (table: "sv" | "evo" | "enf", index: number, col: string, val: string) => {
    if (table === "sv") {
      const next = [...signos];
      next[index] = { ...next[index], [col]: val };
      setSignos(next);
      queueDraft(campos, next, evolucion, enfermeria);
    } else if (table === "evo") {
      const next = [...evolucion];
      next[index] = { ...next[index], [col]: val };
      setEvolucion(next);
      queueDraft(campos, signos, next, enfermeria);
    } else if (table === "enf") {
      const next = [...enfermeria];
      next[index] = { ...next[index], [col]: val };
      setEnfermeria(next);
      queueDraft(campos, signos, evolucion, next);
    }
  };

  const addRow = (table: "sv" | "evo" | "enf") => {
    if (table === "sv") {
      const next = [...signos, { fecha: "", hora: "", ta: "", pulso: "", resp: "", temp: "", spo2: "", peso: "", firma: "" }];
      setSignos(next);
      queueDraft(campos, next, evolucion, enfermeria);
    } else if (table === "evo") {
      const next = [...evolucion, { fecha: "", hora: "", nota: "", responsable: "" }];
      setEvolucion(next);
      queueDraft(campos, signos, next, enfermeria);
    } else if (table === "enf") {
      const next = [...enfermeria, { fecha: "", turno: "", reporte: "", enfermera: "" }];
      setEnfermeria(next);
      queueDraft(campos, signos, evolucion, next);
    }
  };

  const delRow = (table: "sv" | "evo" | "enf", index: number) => {
    if (table === "sv") {
      const next = signos.filter((_, i) => i !== index);
      const safe = next.length ? next : [{ fecha: "", hora: "", ta: "", pulso: "", resp: "", temp: "", spo2: "", peso: "", firma: "" }];
      setSignos(safe);
      queueDraft(campos, safe, evolucion, enfermeria);
    } else if (table === "evo") {
      const next = evolucion.filter((_, i) => i !== index);
      const safe = next.length ? next : [{ fecha: "", hora: "", nota: "", responsable: "" }];
      setEvolucion(safe);
      queueDraft(campos, signos, safe, enfermeria);
    } else if (table === "enf") {
      const next = enfermeria.filter((_, i) => i !== index);
      const safe = next.length ? next : [{ fecha: "", turno: "", reporte: "", enfermera: "" }];
      setEnfermeria(safe);
      queueDraft(campos, signos, evolucion, safe);
    }
  };

  // Alertas fisiológicas automáticas
  const alertasClinicas = useMemo(() => {
    const chips: Array<{ text: string; type: "crit" | "warn" | "ok" }> = [];
    const validRows = signos.filter((r) => Object.values(r).some((v) => String(v).trim() !== ""));

    const lastVal = (col: string) => {
      for (let i = validRows.length - 1; i >= 0; i--) {
        const v = String(validRows[i][col] || "").trim();
        if (v) return v;
      }
      return "";
    };

    const ta = lastVal("ta").match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    if (ta) {
      const sys = +ta[1], dia = +ta[2];
      if (sys >= 180 || dia >= 110) chips.push({ text: `Crisis hipertensiva ${sys}/${dia}`, type: "crit" });
      else if (sys >= 140 || dia >= 90) chips.push({ text: `Hipertensión ${sys}/${dia}`, type: "warn" });
      else if (sys < 90 || dia < 60) chips.push({ text: `Hipotensión ${sys}/${dia}`, type: "warn" });
    }

    const pul = num(lastVal("pulso"));
    if (pul !== null) {
      if (pul > 120) chips.push({ text: `Taquicardia ${pul} x'`, type: "crit" });
      else if (pul > 100) chips.push({ text: `Taquicardia ${pul} x'`, type: "warn" });
      else if (pul < 50) chips.push({ text: `Bradicardia ${pul} x'`, type: "warn" });
    }

    const fr = num(lastVal("resp"));
    if (fr !== null) {
      if (fr > 28) chips.push({ text: `Taquipnea ${fr} x'`, type: "crit" });
      else if (fr > 20) chips.push({ text: `Taquipnea ${fr} x'`, type: "warn" });
      else if (fr < 12) chips.push({ text: `Bradipnea ${fr} x'`, type: "warn" });
    }

    const t = num(lastVal("temp"));
    if (t !== null) {
      if (t >= 39) chips.push({ text: `Fiebre alta ${t} °C`, type: "crit" });
      else if (t >= 38) chips.push({ text: `Fiebre ${t} °C`, type: "warn" });
      else if (t < 35.5) chips.push({ text: `Hipotermia ${t} °C`, type: "warn" });
    }

    const sp = num(lastVal("spo2"));
    if (sp !== null) {
      if (sp < 90) chips.push({ text: `Hipoxemia SpO₂ ${sp}%`, type: "crit" });
      else if (sp < 94) chips.push({ text: `SpO₂ baja ${sp}%`, type: "warn" });
    }

    return chips;
  }, [signos]);

  // Agrupación de pacientes para la barra lateral
  const gruposPacientes = useMemo(() => {
    const grupos = new Map<string, { id: string; nombre: string; historias: Array<{ key: string; data: any }> }>();

    Object.keys(storeData).forEach((k) => {
      const d = storeData[k] || {};
      const c = d.campos || {};
      const pid = c._paciente || "sin-id";
      const pNombre = (pacData[pid] && pacData[pid].nombre) || c.nombres || "Sin nombre";

      if (!grupos.has(pid)) {
        grupos.set(pid, { id: pid, nombre: pNombre, historias: [] });
      }
      grupos.get(pid)!.historias.push({ key: k, data: d });
    });

    return Array.from(grupos.values())
      .map((g) => {
        const orden = g.historias.slice().sort((a, b) =>
          String(b.data._guardado || "").localeCompare(String(a.data._guardado || ""))
        );
        return { ...g, historias: orden };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [storeData, pacData]);

  // Pacientes filtrados por búsqueda
  const pacientesFiltrados = useMemo(() => {
    const q = normNombre(search);
    if (!q) return gruposPacientes;

    return gruposPacientes.filter(
      (g) =>
        normNombre(g.nombre).includes(q) ||
        g.historias.some((h) => {
          const c = h.data.campos || {};
          return normNombre(c.expediente).includes(q) || normNombre(c.nombres).includes(q);
        })
    );
  }, [gruposPacientes, search]);

  const totalHistorias = useMemo(() => {
    return gruposPacientes.reduce((acc, g) => acc + g.historias.length, 0);
  }, [gruposPacientes]);

  // Vincular paciente
  const vincularPaciente = (nombres: string, pidExistente: string) => {
    const nombre = String(nombres || "").trim();
    let currentPac = { ...pacData };
    let pid = pidExistente || "";

    if (pid && !currentPac[pid]) pid = "";
    if (!pid && nombre) {
      const n = normNombre(nombre);
      const cands = Object.keys(currentPac).filter((k) => normNombre(currentPac[k].nombre) === n);

      if (cands.length === 1) {
        const cuantas = Object.keys(storeData).filter(
          (k) => ((storeData[k].campos || {})._paciente || "") === cands[0]
        ).length;
        const misma = window.confirm(
          `Ya existe un paciente llamado «${nombre}»${
            cuantas ? ` con ${cuantas} historia${cuantas === 1 ? "" : "s"}` : ""
          }.\n\nAceptar: es la misma persona, esta historia se agrega a su expediente.\nCancelar: es otra persona con el mismo nombre, se guarda por separado.`
        );
        pid = misma ? cands[0] : "";
      }
    }

    if (!pid) {
      pid = uidPac();
      currentPac[pid] = { id: pid, nombre: nombre || "Sin nombre", creado: new Date().toISOString() };
    }

    if (nombre && currentPac[pid].nombre !== nombre) {
      currentPac[pid].nombre = nombre;
    }
    currentPac[pid].actualizado = new Date().toISOString();

    setPacData(currentPac);
    try {
      localStorage.setItem(PACI, JSON.stringify(currentPac));
    } catch (e) {}

    return pid;
  };

  const blankForm = (presetPac?: any) => {
    const newId = uid();
    const hoy = new Date().toISOString().slice(0, 10);
    const newCampos = {
      ...DEFAULT_CAMPOS,
      _id: newId,
      fecha_ingreso: hoy,
      nombres: presetPac ? presetPac.nombre : "",
      _paciente: presetPac ? presetPac.id : "",
    };
    setCampos(newCampos);
    setSignos([{ fecha: "", hora: "", ta: "", pulso: "", resp: "", temp: "", spo2: "", peso: "", firma: "" }]);
    setEvolucion([{ fecha: "", hora: "", nota: "", responsable: "" }]);
    setEnfermeria([{ fecha: "", turno: "", reporte: "", enfermera: "" }]);
    setAdjuntos([]);
    setSaveStatus("");
    setNombreInvalido(false);
  };

  const guardarHistoria = () => {
    if (!String(campos.nombres || "").trim()) {
      setNombreInvalido(true);
      showToast("Nombre y apellido es obligatorio");
      return;
    }

    const fn = campos.fecha_nac;
    const fi = campos.fecha_ingreso;
    if (fn && fi && fn > fi) {
      alert("La fecha de nacimiento es posterior a la fecha de ingreso. Revisa las fechas.");
      return;
    }

    const ed = num(campos.edad);
    if (ed !== null && (ed < 0 || ed > 120)) {
      alert("La edad debe estar entre 0 y 120 años.");
      return;
    }

    let key = campos._id || uid();
    const exp = (campos.expediente || "").trim().toLowerCase();

    if (exp) {
      const dup = Object.keys(storeData).find(
        (k) =>
          k !== key &&
          String((storeData[k].campos || {}).expediente || "").trim().toLowerCase() === exp
      );
      if (dup) {
        const other = (storeData[dup].campos || {}).nombres || "sin nombre";
        if (
          !window.confirm(
            `Ya existe una historia con el expediente ${campos.expediente} (${other}).\n\n¿Sobrescribirla con los datos actuales?`
          )
        ) {
          return;
        }
        key = dup;
      }
    }

    const eraNueva = !storeData[key];
    const pid = vincularPaciente(campos.nombres, campos._paciente);

    const dataToSave: any = {
      _guardado: new Date().toISOString(),
      campos: {
        ...campos,
        _id: key,
        _paciente: pid,
      },
      signos: signos.filter((o) => Object.values(o).some((v) => String(v).trim() !== "")),
      evolucion: evolucion.filter((o) => Object.values(o).some((v) => String(v).trim() !== "")),
      enfermeria: enfermeria.filter((o) => Object.values(o).some((v) => String(v).trim() !== "")),
    };

    const nextStore = { ...storeData, [key]: dataToSave };
    setStoreData(nextStore);

    try {
      localStorage.setItem(STORE, JSON.stringify(nextStore));
    } catch (e) {
      showToast("No hay espacio suficiente en localStorage");
      return;
    }

    setPacientesAbiertos((prev) => ({ ...prev, [pid]: true }));
    const hora = new Date().toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });

    if (eraNueva) {
      blankForm();
      try {
        localStorage.removeItem(DRAFT);
      } catch (e) {}
      setSaveStatus(`Guardada ${hora} · lista la siguiente`);
      showToast(`Guardada: ${dataToSave.campos.nombres} — formulario listo para siguiente`);
    } else {
      setCampos(dataToSave.campos);
      setSaveStatus(`Actualizada ${hora}`);
      showToast(`Historia actualizada: ${dataToSave.campos.nombres}`);
      refreshAttachments(key);
    }
  };

  const handleAbrirHistoria = (key: string) => {
    const d = storeData[key];
    if (!d) {
      showToast("Esa historia ya no existe");
      return;
    }
    setCampos(d.campos || {});
    setSignos(d.signos && d.signos.length ? d.signos : [{ fecha: "", hora: "", ta: "", pulso: "", resp: "", temp: "", spo2: "", peso: "", firma: "" }]);
    setEvolucion(d.evolucion && d.evolucion.length ? d.evolucion : [{ fecha: "", hora: "", nota: "", responsable: "" }]);
    setEnfermeria(d.enfermeria && d.enfermeria.length ? d.enfermeria : [{ fecha: "", turno: "", reporte: "", enfermera: "" }]);
    refreshAttachments(key);
    try {
      localStorage.setItem(DRAFT, JSON.stringify(d));
    } catch (e) {}
    setSaveStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Historia abierta");
  };

  const handleBorrarHistoria = async (key: string) => {
    const d = storeData[key] || {};
    const c = d.campos || {};
    const cuando = fechaCorta(c.fecha_ingreso);

    if (
      !window.confirm(
        `¿Eliminar la historia de ${c.nombres || "este paciente"}${
          cuando ? ` del ${cuando}` : ""
        }?\n\nTambién se borrarán sus archivos adjuntos. No se puede deshacer.`
      )
    ) {
      return;
    }

    const nextStore = { ...storeData };
    delete nextStore[key];
    setStoreData(nextStore);

    try {
      localStorage.setItem(STORE, JSON.stringify(nextStore));
    } catch (e) {}

    // Eliminar adjuntos en IndexedDB
    try {
      const all = (await dbAll()) || [];
      const toDelete = all.filter((r) => r.historiaId === key);
      await Promise.all(toDelete.map((r) => dbDelete(r.pk)));
    } catch (e) {}

    const pid = c._paciente;
    const quedan = Object.keys(nextStore).some(
      (k) => ((nextStore[k].campos || {})._paciente || "") === pid
    );
    if (pid && !quedan) {
      const nextPac = { ...pacData };
      delete nextPac[pid];
      setPacData(nextPac);
      try {
        localStorage.setItem(PACI, JSON.stringify(nextPac));
      } catch (e) {}
    }

    if (key === campos._id) {
      try {
        localStorage.removeItem(DRAFT);
      } catch (e) {}
      blankForm();
    }

    showToast("Historia eliminada");
  };

  const handleAdjuntarArchivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!campos._id) {
      showToast("Guarda la historia primero");
      return;
    }

    for (const f of files) {
      if (f.size > 15 * 1024 * 1024) {
        showToast(`"${f.name}" supera 15 MB`);
        continue;
      }
      try {
        await dbAdd({
          historiaId: campos._id,
          name: f.name,
          size: f.size,
          type: f.type,
          added: new Date().toISOString(),
          blob: f,
        });
      } catch (err) {
        showToast("No se pudo guardar el archivo adjunto");
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    refreshAttachments(campos._id);
    if (files.length) {
      showToast(files.length === 1 ? "Archivo adjuntado" : `${files.length} archivos adjuntados`);
    }
  };

  const handleAbrirAdjunto = async (pk: number) => {
    try {
      const all = (await dbAll()) || [];
      const rec = all.find((x) => x.pk === pk);
      if (!rec) return;
      const url = URL.createObjectURL(rec.blob);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {}
  };

  const handleBorrarAdjunto = async (pk: number) => {
    if (!window.confirm("¿Quitar este archivo de la historia?")) return;
    try {
      await dbDelete(pk);
      refreshAttachments(campos._id);
      showToast("Archivo eliminado");
    } catch (e) {}
  };

  // Exportar a Word (.doc)
  const handleExportarWord = async () => {
    const c = campos;
    const E = (s: any) =>
      String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\r?\n/g, "<br>");
    const V = (k: string) => E(c[k] || "");
    const box = (k: string) => (c[k] ? "☒" : "☐");

    const tabla = (pares: any[], cols: number) => {
      let out = "";
      for (let i = 0; i < pares.length; i += cols === 4 ? 2 : 1) {
        const a = pares[i], b = pares[i + 1];
        out += "<tr><td class='lbl'>" + E(a[0]) + "</td><td>" + a[1] + "</td>";
        if (cols === 4) {
          out += b ? "<td class='lbl'>" + E(b[0]) + "</td><td>" + b[1] + "</td>" : "<td class='lbl'></td><td></td>";
        }
        out += "</tr>";
      }
      return "<table>" + out + "</table>";
    };

    const validSV = signos.filter((r) => Object.values(r).some((v) => String(v).trim() !== ""));
    const filasSV = (validSV.length ? validSV : [{}]).map((r: any) =>
      "<tr><td>" + E(fechaCorta(r.fecha)) + "</td><td>" + E(r.hora) + "</td><td>" + E(r.ta) +
      "</td><td>" + E(r.pulso) + "</td><td>" + E(r.resp) + "</td><td>" + E(r.temp) +
      "</td><td>" + E(r.spo2) + "</td><td>" + E(r.peso) + "</td><td>" + E(r.firma) + "</td></tr>"
    ).join("");

    const validEvo = evolucion.filter((r) => Object.values(r).some((v) => String(v).trim() !== ""));
    const filasEvo = (validEvo.length ? validEvo : [{}]).map((r: any) =>
      "<tr><td>" + E(fechaCorta(r.fecha)) + "</td><td>" + E(r.hora) + "</td><td>" + E(r.nota) +
      "</td><td>" + E(r.responsable) + "</td></tr>"
    ).join("");

    const validEnf = enfermeria.filter((r) => Object.values(r).some((v) => String(v).trim() !== ""));
    const filasEnf = (validEnf.length ? validEnf : [{}]).map((r: any) =>
      "<tr><td>" + E(fechaCorta(r.fecha)) + "</td><td>" + E(r.turno) + "</td><td>" + E(r.reporte) +
      "</td><td>" + E(r.enfermera) + "</td></tr>"
    ).join("");

    const nombresAdjuntos = adjuntos.map((r) => r.name);

    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<title>Historia Clínica ${E(c.expediente || "")}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page WordSection1 { size:21.0cm 29.7cm; margin:1.5cm; }
div.WordSection1 { page:WordSection1; }
body { font-family:Calibri,Arial,sans-serif; font-size:10.5pt; color:#12232e; }
h1 { font-size:15pt; margin:0 0 1pt; }
.sub { font-size:8.5pt; color:#5b6b75; margin:0; line-height:1.35; }
h2 { font-size:10pt; color:#0b6b6b; border-bottom:1px solid #0b6b6b; padding-bottom:2pt; margin:13pt 0 5pt; letter-spacing:.4pt; }
h3 { font-size:8.5pt; color:#4a5b66; margin:10pt 0 4pt; letter-spacing:.4pt; }
table { border-collapse:collapse; width:100%; }
td, th { border:1px solid #c3d0d6; padding:3pt 5pt; vertical-align:top; font-size:9.5pt; }
th { background:#eef4f5; font-size:8pt; text-align:left; letter-spacing:.4pt; }
td.lbl { width:24%; background:#f7fafa; color:#4a5b66; font-size:8.5pt; }
table.meta, table.meta td { border:0; padding:0; }
table.sign td { border:0; border-top:1px solid #444; padding-top:3pt; font-size:8.5pt; text-align:center; }
.checks { font-size:9.5pt; margin:5pt 0 0; line-height:1.7; }
.pie { margin-top:12pt; font-size:7.5pt; color:#6b7a84; border-top:1px solid #d6e0e4; padding-top:3pt; }
</style></head>
<body><div class="WordSection1">

<table class="meta">
<tr><td>
  <h1>Hospital de Clínicas San Jorge, S.A.</h1>
  <p class="sub">Historia Clínica · Tel. 762-1841</p>
</td></tr>
<tr><td style="text-align:right; padding-top:4pt; border-top:1px solid #c3d0d6">
  <p class="sub">Historia N° <b>${E(c.expediente || "")}</b> &nbsp;&nbsp;·&nbsp;&nbsp; Fecha <b>${E(fechaCorta(c.fecha_ingreso))}</b></p>
</td></tr>
</table>

<h2>I. Datos generales</h2>
${tabla([
  ["Nombre y apellido", V("nombres")],
  ["Edad", V("edad")],
  ["Fecha de nacimiento", E(fechaCorta(c.fecha_nac))],
  ["Profesión", V("ocupacion")],
  ["Empresa", V("empresa")],
  ["Cargo propuesto", V("cargo")],
], 4)}

<h2>II. Antecedentes patológicos (médicos) – quirúrgicos – accidentes</h2>
${tabla([["Antecedentes", V("ant_patologicos")]], 2)}
<h3>HÁBITOS</h3>
${tabla([
  ["Cigarrillos", V("tabaco")],
  ["N.° al día", V("tabaco_n")],
  ["Edad en que comenzó", V("tabaco_edad")],
  ["Alcohol", V("alcohol")],
  ["Otras drogas", V("drogas")],
  ["Cuál", V("drogas_cual")],
  ["Sueño: horas diarias", V("sueno")],
  ["Sueño", V("sueno_ritmo")],
  ["Hobby", V("hobby")],
  ["Actividad física – deportes", V("actividad")],
  ["Dieta", V("dieta")],
], 4)}

<h2>III. Antecedentes familiares</h2>
${tabla([
  ["Padre", V("fam_padre")],
  ["Madre", V("fam_madre")],
  ["Hermanos / as", V("fam_hermanos")],
  ["Consanguíneos (abuelos, tíos, primos)", V("fam_consanguineos")],
], 4)}
<p class="checks">${[
  ["f_pulmonar", "Pulmonares"], ["f_cancer", "Cáncer"], ["f_dm", "Diabetes"],
  ["f_cardio", "Cardiopatía"], ["f_hta", "Hipertensión"], ["f_malf", "Malformaciones congénitas"],
  ["f_osteo", "E. osteomusculares"], ["f_epilepsia", "Epilepsia"], ["f_lues", "Lues"],
  ["f_atopia", "Atopia"], ["f_farmaco", "Farmacodependencia"], ["f_mental", "Trastornos mentales"],
  ["f_otros", "Otras"],
].map((p) => box(p[0]) + "&nbsp;" + p[1]).join("&nbsp;&nbsp;&nbsp;&nbsp;")}</p>

<h2>IV. Antecedentes ocupacionales</h2>
${tabla([["Antecedentes", V("ocupacional")]], 2)}

<h2>V. Signos vitales</h2>
<table>
<tr>
  <th style="width:11%">Fecha</th><th style="width:8%">Hora</th><th style="width:10%">T/A (mmHg)</th>
  <th style="width:9%">Pulso (x')</th><th style="width:9%">Resp. (x')</th><th style="width:9%">Temp. (°C)</th>
  <th style="width:9%">SpO₂ (%)</th><th style="width:9%">Peso (kg)</th><th>Firma</th>
</tr>
${filasSV}
</table>

<h2>VI. Evolución / notas médicas</h2>
<table>
<tr><th style="width:13%">Fecha</th><th style="width:9%">Hora</th><th>Nota de evolución</th><th style="width:22%">Responsable</th></tr>
${filasEvo}
</table>

<h2>VII. Reporte de enfermería</h2>
<table>
<tr><th style="width:13%">Fecha</th><th style="width:12%">Turno</th><th>Reporte</th><th style="width:22%">Enfermera/o</th></tr>
${filasEnf}
</table>

<table class="sign" style="margin-top:28pt"><tr>
  <td style="width:50%">${E(c.medico || "")}</td>
  <td style="width:50%">${E(c.recibido_por || "")}</td>
</tr><tr>
  <td>Médico responsable · Firma y sello</td>
  <td>Paciente / responsable · Firma</td>
</tr></table>

<p class="pie">
  Historia Clínica · Hospital de Clínicas San Jorge, S.A.${
    c.colegiacion ? " · Colegiación " + E(c.colegiacion) : ""
  }${nombresAdjuntos.length ? " · Adjuntos: " + E(nombresAdjuntos.join(", ")) : ""} · Generado el ${new Date().toLocaleDateString(
      "es-HN"
    )} ${new Date().toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
</p>

</div></body></html>`;

    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "historia-" + nombreArchivo(c) + ".doc";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    showToast("Documento Word descargado");
  };

  return (
    <div className="min-h-screen bg-[#eef2f5] text-[#12232e]">
      {/* ================= App Bar Superior ================= */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-2.5 bg-[#0f3d3d] text-[#eaf6f6] shadow-md no-print flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-teal-200 hover:text-white px-2 py-1 rounded bg-teal-900/60 border border-teal-700/50 transition mr-2"
            title="Volver al Portal Institucional"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Portal
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#eaf6f6] text-[#0f3d3d] grid place-items-center font-bold text-xs">
              CSJ
            </div>
            <div>
              <span className="font-semibold text-xs sm:text-sm block">
                Hospital de Clínicas San Jorge, S.A.
              </span>
              <small className="hidden sm:block text-[10px] text-teal-200/80">
                Historia Clínica Digital · Registro y Expediente
              </small>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-[11px] text-teal-200/75 italic mr-1">
              {saveStatus}
            </span>
          )}

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2fa3a3] hover:bg-[#3ab8b8] text-[#04211f] transition flex items-center gap-1.5 shadow-xs"
            title="Abre el diálogo de impresión: guardar como PDF (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
          </button>

          <button
            onClick={handleExportarWord}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-[#eaf6f6] border border-white/25 transition flex items-center gap-1.5"
            title="Descarga un documento .doc que abre en Word"
          >
            <FileDown className="w-3.5 h-3.5" /> Word
          </button>

          <button
            onClick={guardarHistoria}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-teal-400/50 transition flex items-center gap-1.5"
            title="Guardar historia en el expediente (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" /> Guardar
          </button>
        </div>
      </header>

      {/* ================= Layout: Barra Lateral + Hoja ================= */}
      <div className="max-w-[1300px] mx-auto px-2 sm:px-4 py-4 flex flex-col md:flex-row items-start gap-4 hcsj-layout">
        {/* Barra Lateral de Pacientes */}
        <aside
          className="w-full md:w-[296px] shrink-0 bg-white border border-[#c9d6dd] rounded-xl overflow-hidden shadow-xs md:sticky md:top-16 max-h-[85vh] flex flex-col no-print"
          aria-label="Pacientes e historias"
        >
          <div className="p-3 bg-[#f8fbfb] border-b border-[#c9d6dd]">
            <div className="flex justify-between items-baseline text-[11px] font-bold uppercase tracking-wider text-[#4a5b66] mb-2">
              <span>Pacientes</span>
              <span className="text-[10px] font-medium lowercase text-teal-700">
                {gruposPacientes.length} pac · {totalHistorias} hist
              </span>
            </div>
            <button
              onClick={() => blankForm()}
              className="w-full py-1.5 px-3 bg-[#0b6b6b] hover:bg-[#095959] text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva historia
            </button>
            <div className="relative mt-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar paciente o exp…"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#9db0ba] rounded-lg focus:outline-none focus:border-[#0b6b6b]"
              />
            </div>
          </div>

          <div className="overflow-y-auto p-2 flex-1 space-y-1">
            {pacientesFiltrados.length === 0 ? (
              <div className="text-center py-8 px-4 text-xs text-[#4a5b66]">
                {search ? (
                  <p>Sin coincidencias para &quot;{search}&quot;.</p>
                ) : (
                  <p>
                    No hay historias registradas aún. Inicie con <b>Nueva historia</b>.
                  </p>
                )}
              </div>
            ) : (
              pacientesFiltrados.map((g) => {
                const isOpen = !!pacientesAbiertos[g.id] || (!!search && pacientesFiltrados.length <= 4);
                const ult = g.historias[0];
                const fechaUlt = ult
                  ? fechaCorta((ult.data.campos || {}).fecha_ingreso) ||
                    (ult.data._guardado || "").slice(0, 10)
                  : "";
                const expUlt = ult
                  ? String((ult.data.campos || {}).expediente || "").trim()
                  : "";

                return (
                  <div
                    key={g.id}
                    className={`border rounded-lg transition overflow-hidden ${
                      isOpen ? "border-[#c9d6dd] bg-[#fbfdfd]" : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setPacientesAbiertos((prev) => ({
                          ...prev,
                          [g.id]: !prev[g.id],
                        }))
                      }
                      className="w-full text-left p-2 rounded-lg hover:bg-[#e6f2f2]/60 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="block font-semibold text-xs text-slate-900 truncate">
                          {g.nombre}
                        </span>
                        <span className="block text-[10.5px] text-[#4a5b66] mt-0.5">
                          {g.historias.length} historia{g.historias.length === 1 ? "" : "s"}
                          {fechaUlt ? ` · ${fechaUlt}` : ""}
                          {expUlt ? ` · Exp. ${expUlt}` : ""}
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-2 pb-2 pt-0.5 space-y-1">
                        <button
                          onClick={() => blankForm(g)}
                          className="w-full text-left text-[11px] text-[#0b6b6b] border border-dashed border-[#9db0ba] hover:bg-[#e6f2f2] rounded-md px-2 py-1 transition flex items-center gap-1 mb-1.5"
                        >
                          <Plus className="w-3 h-3" /> Nueva consulta para este paciente
                        </button>

                        {g.historias.map((h) => {
                          const c = h.data.campos || {};
                          const f =
                            fechaCorta(c.fecha_ingreso) ||
                            fechaCorta((h.data._guardado || "").slice(0, 10));
                          const sub = [
                            c.expediente ? `Exp. ${c.expediente}` : "Sin exp.",
                            c.edad ? `${c.edad} años` : "",
                          ]
                            .filter(Boolean)
                            .join(" · ");
                          const isActive = h.key === campos._id;

                          return (
                            <div
                              key={h.key}
                              className={`flex items-center justify-between gap-1 p-1.5 rounded-md border-t border-dotted border-[#c9d6dd] ${
                                isActive ? "bg-[#e6f2f2] text-[#0b6b6b]" : "hover:bg-slate-100/80"
                              }`}
                            >
                              <button
                                onClick={() => handleAbrirHistoria(h.key)}
                                className="flex-1 text-left min-w-0"
                              >
                                <b className="block text-[11.5px] truncate font-semibold">
                                  {f || "Sin fecha"}
                                </b>
                                <span className="block text-[10px] text-[#4a5b66] truncate">
                                  {sub}
                                </span>
                              </button>
                              <button
                                onClick={() => handleBorrarHistoria(h.key)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                                title="Eliminar esta historia"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ================= Hoja A4 Digital ================= */}
        <main className="flex-1 w-full bg-white rounded-xl shadow-md p-6 sm:p-10 hcsj-sheet">
          {/* Cabecera institucional */}
          <div className="flex items-center gap-4 border-b border-dotted border-[#c9d6dd] pb-3">
            <div className="w-13 h-13 border-2 border-[#0b6b6b] rounded-lg grid place-items-center text-[#0b6b6b] font-bold text-sm tracking-wider">
              HCSJ
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Hospital de Clínicas San Jorge, S.A.
              </h1>
              <p className="text-xs text-[#4a5b66]">
                <b>Historia Clínica</b> · Tel. 762-1841
              </p>
            </div>
          </div>

          {/* Doc Meta (Expediente + Fecha) */}
          <div className="flex flex-wrap items-center justify-end gap-6 py-2 border-b-2 border-[#0b6b6b] mb-4">
            <div className="hcsj-f">
              <label>Historia N°</label>
              <input
                value={campos.expediente || ""}
                onChange={(e) => handleCampoChange("expediente", e.target.value)}
                placeholder="N° Expediente"
                className="w-28 text-sm font-semibold text-slate-900"
              />
            </div>
            <div className="hcsj-f">
              <label>Fecha</label>
              <input
                type="date"
                value={campos.fecha_ingreso || ""}
                onChange={(e) => handleCampoChange("fecha_ingreso", e.target.value)}
                className="w-32 text-xs font-medium"
              />
            </div>
          </div>

          {/* ================= I. DATOS GENERALES ================= */}
          <section className="hcsj-sec mb-5">
            <h2>
              <span className="hcsj-num">I</span> Datos generales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div
                className={`hcsj-f req sm:col-span-2 ${
                  nombreInvalido ? "invalid" : ""
                }`}
              >
                <label>Nombre y apellido</label>
                <input
                  value={campos.nombres || ""}
                  onChange={(e) => handleCampoChange("nombres", e.target.value)}
                  placeholder="Apellidos y nombres completos"
                  className="font-medium"
                />
              </div>
              <div className="hcsj-f">
                <label>Edad</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={campos.edad || ""}
                  onChange={(e) => handleCampoChange("edad", e.target.value)}
                  placeholder="Años"
                />
              </div>
              <div className="hcsj-f">
                <label>Fecha de nacimiento</label>
                <input
                  type="date"
                  value={campos.fecha_nac || ""}
                  onChange={(e) => handleCampoChange("fecha_nac", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 mt-2">
              <div className="hcsj-f">
                <label>Profesión</label>
                <input
                  value={campos.ocupacion || ""}
                  onChange={(e) => handleCampoChange("ocupacion", e.target.value)}
                />
              </div>
              <div className="hcsj-f">
                <label>Empresa</label>
                <input
                  value={campos.empresa || ""}
                  onChange={(e) => handleCampoChange("empresa", e.target.value)}
                />
              </div>
              <div className="hcsj-f">
                <label>Cargo propuesto</label>
                <input
                  value={campos.cargo || ""}
                  onChange={(e) => handleCampoChange("cargo", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ================= II. ANTECEDENTES PATOLÓGICOS Y HÁBITOS ================= */}
          <section className="hcsj-sec mb-5">
            <h2>
              <span className="hcsj-num">II</span> Antecedentes patológicos (médicos) – quirúrgicos – accidentes
            </h2>
            <div className="hcsj-f stack">
              <textarea
                value={campos.ant_patologicos || ""}
                onChange={(e) => handleCampoChange("ant_patologicos", e.target.value)}
                placeholder="Renglón de antecedentes patológicos personales, cirugías previas, traumatismos o alergias..."
                rows={2}
              />
            </div>

            <p className="text-[10px] uppercase font-bold tracking-wider text-[#4a5b66] mt-3 mb-1">
              Hábitos
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
              <div className="hcsj-f">
                <label>Cigarrillos</label>
                <select
                  value={campos.tabaco || ""}
                  onChange={(e) => handleCampoChange("tabaco", e.target.value)}
                >
                  <option value=""></option>
                  <option value="No">No</option>
                  <option value="Sí">Sí</option>
                </select>
              </div>
              <div className="hcsj-f">
                <label>N.° al día</label>
                <input
                  value={campos.tabaco_n || ""}
                  onChange={(e) => handleCampoChange("tabaco_n", e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="hcsj-f">
                <label>Edad inicio</label>
                <input
                  value={campos.tabaco_edad || ""}
                  onChange={(e) => handleCampoChange("tabaco_edad", e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="hcsj-f">
                <label>Alcohol</label>
                <select
                  value={campos.alcohol || ""}
                  onChange={(e) => handleCampoChange("alcohol", e.target.value)}
                >
                  <option value=""></option>
                  <option value="No">No</option>
                  <option value="Sí">Sí</option>
                  <option value="Socialmente">Socialmente</option>
                  <option value="A diario">A diario</option>
                </select>
              </div>

              <div className="hcsj-f">
                <label>Otras drogas</label>
                <select
                  value={campos.drogas || ""}
                  onChange={(e) => handleCampoChange("drogas", e.target.value)}
                >
                  <option value=""></option>
                  <option value="No">No</option>
                  <option value="Sí">Sí</option>
                </select>
              </div>
              <div className="hcsj-f">
                <label>Cuál</label>
                <input
                  value={campos.drogas_cual || ""}
                  onChange={(e) => handleCampoChange("drogas_cual", e.target.value)}
                />
              </div>
              <div className="hcsj-f">
                <label>Sueño (hrs)</label>
                <input
                  value={campos.sueno || ""}
                  onChange={(e) => handleCampoChange("sueno", e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="hcsj-f">
                <label>Ritmo sueño</label>
                <select
                  value={campos.sueno_ritmo || ""}
                  onChange={(e) => handleCampoChange("sueno_ritmo", e.target.value)}
                >
                  <option value=""></option>
                  <option value="Normal">Normal</option>
                  <option value="Irregular">Irregular</option>
                </select>
              </div>

              <div className="hcsj-f col-span-2">
                <label>Hobby</label>
                <input
                  value={campos.hobby || ""}
                  onChange={(e) => handleCampoChange("hobby", e.target.value)}
                />
              </div>
              <div className="hcsj-f col-span-2">
                <label>Actividad física / deportes</label>
                <input
                  value={campos.actividad || ""}
                  onChange={(e) => handleCampoChange("actividad", e.target.value)}
                />
              </div>
              <div className="hcsj-f col-span-2 sm:col-span-4">
                <label>Dieta</label>
                <input
                  value={campos.dieta || ""}
                  onChange={(e) => handleCampoChange("dieta", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ================= III. ANTECEDENTES FAMILIARES ================= */}
          <section className="hcsj-sec mb-5">
            <h2>
              <span className="hcsj-num">III</span> Antecedentes familiares
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div className="hcsj-f">
                <label>Padre</label>
                <input
                  value={campos.fam_padre || ""}
                  onChange={(e) => handleCampoChange("fam_padre", e.target.value)}
                />
              </div>
              <div className="hcsj-f">
                <label>Madre</label>
                <input
                  value={campos.fam_madre || ""}
                  onChange={(e) => handleCampoChange("fam_madre", e.target.value)}
                />
              </div>
              <div className="hcsj-f">
                <label>Hermanos / as</label>
                <input
                  value={campos.fam_hermanos || ""}
                  onChange={(e) => handleCampoChange("fam_hermanos", e.target.value)}
                />
              </div>
              <div className="hcsj-f">
                <label>Consanguíneos (abuelos, tíos, primos)</label>
                <input
                  value={campos.fam_consanguineos || ""}
                  onChange={(e) => handleCampoChange("fam_consanguineos", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 pt-2 border-t border-dotted border-[#c9d6dd] text-xs">
              {[
                { k: "f_pulmonar", label: "Pulmonares" },
                { k: "f_cancer", label: "Cáncer" },
                { k: "f_dm", label: "Diabetes" },
                { k: "f_cardio", label: "Cardiopatía" },
                { k: "f_hta", label: "Hipertensión" },
                { k: "f_malf", label: "Malformaciones congénitas" },
                { k: "f_osteo", label: "E. osteomusculares" },
                { k: "f_epilepsia", label: "Epilepsia" },
                { k: "f_lues", label: "Lues" },
                { k: "f_atopia", label: "Atopia" },
                { k: "f_farmaco", label: "Farmacodependencia" },
                { k: "f_mental", label: "Trastornos mentales" },
                { k: "f_otros", label: "Otras" },
              ].map((item) => (
                <label key={item.k} className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!campos[item.k]}
                    onChange={(e) => handleCampoChange(item.k, e.target.checked)}
                    className="accent-[#0b6b6b] rounded"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* ================= IV. ANTECEDENTES OCUPACIONALES ================= */}
          <section className="hcsj-sec mb-5">
            <h2>
              <span className="hcsj-num">IV</span> Antecedentes ocupacionales
            </h2>
            <div className="hcsj-f stack">
              <textarea
                value={campos.ocupacional || ""}
                onChange={(e) => handleCampoChange("ocupacional", e.target.value)}
                placeholder="Empresas, ocupación, riesgos, puesto de trabajo actual, protección personal y colectiva, ocupación extra empresa, servicio militar."
                rows={2}
              />
            </div>
          </section>

          {/* ================= V. SIGNOS VITALES ================= */}
          <section className="hcsj-sec mb-5">
            <h2>
              <span className="hcsj-num">V</span> Signos vitales
            </h2>
            <div className="overflow-x-auto">
              <table className="hcsj-table">
                <thead>
                  <tr>
                    <th className="w-24">Fecha</th>
                    <th className="w-20">Hora</th>
                    <th className="w-24">T/A (mmHg)</th>
                    <th className="w-20">Pulso (x&apos;)</th>
                    <th className="w-20">Resp. (x&apos;)</th>
                    <th className="w-20">Temp. (°C)</th>
                    <th className="w-20">SpO₂ (%)</th>
                    <th className="w-20">Peso (kg)</th>
                    <th>Firma</th>
                    <th className="w-8 no-print"></th>
                  </tr>
                </thead>
                <tbody>
                  {signos.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="date"
                          value={row.fecha || ""}
                          onChange={(e) => handleRowChange("sv", idx, "fecha", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={row.hora || ""}
                          onChange={(e) => handleRowChange("sv", idx, "hora", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={row.ta || ""}
                          onChange={(e) => handleRowChange("sv", idx, "ta", e.target.value)}
                          placeholder="120/80"
                        />
                      </td>
                      <td>
                        <input
                          value={row.pulso || ""}
                          onChange={(e) => handleRowChange("sv", idx, "pulso", e.target.value)}
                          placeholder="75"
                        />
                      </td>
                      <td>
                        <input
                          value={row.resp || ""}
                          onChange={(e) => handleRowChange("sv", idx, "resp", e.target.value)}
                          placeholder="18"
                        />
                      </td>
                      <td>
                        <input
                          value={row.temp || ""}
                          onChange={(e) => handleRowChange("sv", idx, "temp", e.target.value)}
                          placeholder="36.5"
                        />
                      </td>
                      <td>
                        <input
                          value={row.spo2 || ""}
                          onChange={(e) => handleRowChange("sv", idx, "spo2", e.target.value)}
                          placeholder="98"
                        />
                      </td>
                      <td>
                        <input
                          value={row.peso || ""}
                          onChange={(e) => handleRowChange("sv", idx, "peso", e.target.value)}
                          placeholder="70"
                        />
                      </td>
                      <td>
                        <input
                          value={row.firma || ""}
                          onChange={(e) => handleRowChange("sv", idx, "firma", e.target.value)}
                        />
                      </td>
                      <td className="no-print text-center">
                        <button
                          type="button"
                          onClick={() => delRow("sv", idx)}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                          title="Eliminar fila"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chips de Alertas Fisiológicas */}
            {alertasClinicas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {alertasClinicas.map((a, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      a.type === "crit"
                        ? "bg-[#fdecea] text-[#a4231f] border-[#f3c4c0]"
                        : a.type === "warn"
                        ? "bg-[#fff6e5] text-[#8a5300] border-[#edd9b0]"
                        : "bg-[#e8f5ec] text-[#1c6b3f] border-[#bfe0ca]"
                    }`}
                  >
                    {a.type === "crit" ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {a.text}
                  </span>
                ))}
              </div>
            )}

            <div className="no-print mt-2">
              <button
                type="button"
                onClick={() => addRow("sv")}
                className="text-xs font-semibold text-[#0b6b6b] hover:bg-[#e6f2f2] px-2.5 py-1 rounded border border-dashed border-[#9db0ba] transition"
              >
                + Agregar toma de signos vitales
              </button>
            </div>
          </section>

          {/* ================= VI. EVOLUCIÓN ================= */}
          <section className="hcsj-sec mb-5">
            <h2>
              <span className="hcsj-num">VI</span> Evolución / notas médicas
            </h2>
            <div className="overflow-x-auto">
              <table className="hcsj-table">
                <thead>
                  <tr>
                    <th className="w-28">Fecha</th>
                    <th className="w-20">Hora</th>
                    <th>Nota de evolución</th>
                    <th className="w-36">Responsable</th>
                    <th className="w-8 no-print"></th>
                  </tr>
                </thead>
                <tbody>
                  {evolucion.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="date"
                          value={row.fecha || ""}
                          onChange={(e) => handleRowChange("evo", idx, "fecha", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={row.hora || ""}
                          onChange={(e) => handleRowChange("evo", idx, "hora", e.target.value)}
                        />
                      </td>
                      <td>
                        <textarea
                          rows={2}
                          value={row.nota || ""}
                          onChange={(e) => handleRowChange("evo", idx, "nota", e.target.value)}
                          placeholder="Nota médica de evolución clínica..."
                        />
                      </td>
                      <td>
                        <input
                          value={row.responsable || ""}
                          onChange={(e) => handleRowChange("evo", idx, "responsable", e.target.value)}
                          placeholder="Dr. / Dra."
                        />
                      </td>
                      <td className="no-print text-center">
                        <button
                          type="button"
                          onClick={() => delRow("evo", idx)}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                          title="Eliminar fila"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="no-print mt-2">
              <button
                type="button"
                onClick={() => addRow("evo")}
                className="text-xs font-semibold text-[#0b6b6b] hover:bg-[#e6f2f2] px-2.5 py-1 rounded border border-dashed border-[#9db0ba] transition"
              >
                + Agregar nota de evolución
              </button>
            </div>
          </section>

          {/* ================= VII. REPORTE DE ENFERMERÍA ================= */}
          <section className="hcsj-sec mb-5">
            <h2>
              <span className="hcsj-num">VII</span> Reporte de enfermería
            </h2>
            <div className="overflow-x-auto">
              <table className="hcsj-table">
                <thead>
                  <tr>
                    <th className="w-28">Fecha</th>
                    <th className="w-24">Turno</th>
                    <th>Reporte</th>
                    <th className="w-36">Enfermera/o</th>
                    <th className="w-8 no-print"></th>
                  </tr>
                </thead>
                <tbody>
                  {enfermeria.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="date"
                          value={row.fecha || ""}
                          onChange={(e) => handleRowChange("enf", idx, "fecha", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={row.turno || ""}
                          onChange={(e) => handleRowChange("enf", idx, "turno", e.target.value)}
                          placeholder="Mat./Vesp./Noche"
                        />
                      </td>
                      <td>
                        <textarea
                          rows={2}
                          value={row.reporte || ""}
                          onChange={(e) => handleRowChange("enf", idx, "reporte", e.target.value)}
                          placeholder="Reporte de cuidados y administración de tratamientos..."
                        />
                      </td>
                      <td>
                        <input
                          value={row.enfermera || ""}
                          onChange={(e) => handleRowChange("enf", idx, "enfermera", e.target.value)}
                          placeholder="Lic. / TSU"
                        />
                      </td>
                      <td className="no-print text-center">
                        <button
                          type="button"
                          onClick={() => delRow("enf", idx)}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                          title="Eliminar fila"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="no-print mt-2">
              <button
                type="button"
                onClick={() => addRow("enf")}
                className="text-xs font-semibold text-[#0b6b6b] hover:bg-[#e6f2f2] px-2.5 py-1 rounded border border-dashed border-[#9db0ba] transition"
              >
                + Agregar reporte de enfermería
              </button>
            </div>
          </section>

          {/* ================= VIII. ADJUNTOS (IndexedDB) ================= */}
          <section className="hcsj-sec mb-5 no-print">
            <h2>
              <span className="hcsj-num">VIII</span> Documentos adjuntos{" "}
              <span className="text-[9px] lowercase font-normal text-[#4a5b66]">
                — se guardan en este equipo, no se imprimen
              </span>
            </h2>
            <p className="text-xs text-[#4a5b66] mb-2">
              Escaneo o foto de la hoja firmada, resultados de laboratorio, RX, consentimientos.
              PDF, JPG o PNG · máximo 15 MB por archivo.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-[#0b6b6b] hover:bg-[#e6f2f2] px-3 py-1.5 rounded border border-dashed border-[#9db0ba] transition inline-flex items-center gap-1.5"
            >
              <Paperclip className="w-3.5 h-3.5" /> + Adjuntar archivo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              multiple
              onChange={handleAdjuntarArchivos}
              className="hidden"
            />

            <div className="grid gap-2 mt-3">
              {adjuntos.length === 0 ? (
                <p className="text-xs text-[#4a5b66] italic">Sin archivos adjuntos.</p>
              ) : (
                adjuntos.map((r) => (
                  <div
                    key={r.pk}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[#c9d6dd] bg-[#fbfcfc] text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#e6f2f2] text-[#0b6b6b] grid place-items-center font-bold text-[10px] shrink-0">
                        {extOf(r.name)}
                      </div>
                      <div className="min-w-0">
                        <b className="block text-xs text-slate-900 truncate">{r.name}</b>
                        <span className="text-[10px] text-[#4a5b66]">
                          {fmtSize(r.size)} · {(r.added || "").slice(0, 10)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAbrirAdjunto(r.pk)}
                        className="px-2.5 py-1 bg-white border border-[#c9d6dd] hover:border-[#0b6b6b] text-[#0b6b6b] rounded text-xs font-medium transition"
                      >
                        Abrir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBorrarAdjunto(r.pk)}
                        className="px-2.5 py-1 bg-white border border-[#c9d6dd] hover:border-red-600 text-red-600 rounded text-xs font-medium transition"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ================= FIRMAS ================= */}
          <div className="mt-8 pt-4 border-t border-[#c9d6dd] grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            <div>
              <div className="hcsj-f">
                <label>Médico responsable</label>
                <input
                  value={campos.medico || ""}
                  onChange={(e) => handleCampoChange("medico", e.target.value)}
                />
              </div>
              <div className="hcsj-f mt-2">
                <label>Colegiación</label>
                <input
                  value={campos.colegiacion || ""}
                  onChange={(e) => handleCampoChange("colegiacion", e.target.value)}
                />
              </div>
              <div className="border-t border-[#4a5b66] mt-8 pt-1 text-center text-[10.5px] text-[#4a5b66]">
                Firma y sello médico
              </div>
            </div>

            <div>
              <div className="hcsj-f">
                <label>Recibido por</label>
                <input
                  value={campos.recibido_por || ""}
                  onChange={(e) => handleCampoChange("recibido_por", e.target.value)}
                />
              </div>
              <div className="hcsj-f mt-2">
                <label>Parentesco</label>
                <input
                  value={campos.recibido_parentesco || ""}
                  onChange={(e) => handleCampoChange("recibido_parentesco", e.target.value)}
                />
              </div>
              <div className="border-t border-[#4a5b66] mt-8 pt-1 text-center text-[10.5px] text-[#4a5b66]">
                Firma del paciente / responsable
              </div>
            </div>
          </div>

          {/* Pie de página para impresión */}
          <div className="mt-6 pt-2 border-t border-dotted border-[#c9d6dd] text-[9.5px] text-[#6b7a84] hidden print:flex justify-between print-stamp">
            <span>{printDate || "Historia Clínica Digital"}</span>
            <span>Hospital de Clínicas San Jorge, S.A.</span>
          </div>
        </main>
      </div>

      {/* ================= Toast Flotante ================= */}
      <div
        className={`fixed left-1/2 bottom-6 -translate-x-1/2 bg-[#0f3d3d] text-[#eaf6f6] px-4 py-2 rounded-full text-xs font-medium shadow-xl pointer-events-none transition-all duration-300 z-50 flex items-center gap-2 ${
          toastOn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <CheckCircle2 className="w-4 h-4 text-teal-300" />
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}
