
import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, RotateCcw, Copy, Share2, FileText, ChevronDown, ChevronUp, Plus, Minus, Trash2, Ambulance, MapPin, ClipboardList, Stethoscope, List, X, Pencil } from 'lucide-react';
import { Counter } from './components/Counter';
import { Section } from './components/Section';
import { generatePDF } from './utils/pdf';

// Types
interface Hospital {
  id: string;
  name: string;
  count: number;
  isCustom?: boolean;
}

interface MethaneData {
  M: string;
  E: string;
  T: string;
  H: string;
  A: string;
  N: string;
  E2: string;
}

const HOSPITAL_OPTIONS = [
  "HOSPITAL PENNA", "HOSPITAL ARGERICH", "HOSPITAL RAMOS MEJIA", "HOSPITAL FERNANDEZ",
  "HOSPITAL RIVADAVIA", "HOSPITAL PIROVANO", "HOSPITAL TORNU", "HOSPITAL SANTOJANNI",
  "HOSPITAL PIÑERO", "HOSPITAL GRIERSON", "HOSPITAL ZUBIZARRETA", "HOSPITAL VELEZ SARSFIELD",
  "HOSPITAL ALVAREZ", "HOSPITAL DURAND", "HOSPITAL MUÑIZ", "HOSPITAL SANTA LUCIA",
  "HOSPITAL GUTIERREZ", "HOSPITAL ELIZALDE", "OTROS"
];

function App() {
  // --- State ---
  const [darkMode, setDarkMode] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [showMethane, setShowMethane] = useState(false);
  const [showObitos, setShowObitos] = useState(false);
  const [showEvacuados, setShowEvacuados] = useState(false); // New state for Evacuados
  const [highlightSD, setHighlightSD] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'error' } | null>(null);

  // Form Fields
  const [incidente, setIncidente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [intervencion, setIntervencion] = useState('');
  const [notas, setNotas] = useState('');
  const [methane, setMethane] = useState<MethaneData>({ M: '', E: '', T: '', H: '', A: '', N: '', E2: '' });

  // Counters
  const [counts, setCounts] = useState({
    atendidos: 0,
    trasladados: 0,
    masculino: 0,
    femenino: 0,
    sexoSD: 0,
    menores: 0,
    mayores: 0,
    edadSD: 0,
    moviles: 0,
    aereo: 0,
    obitos: 0,
    evacuados: 0 // New counter
  });

  const [hospitals, setHospitals] = useState<Hospital[]>([
    { id: '1', name: '', count: 0 }
  ]);

  // --- Effects ---
  useEffect(() => {
    // Dark mode init
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'enabled' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'enabled');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'disabled');
    }
  }, [darkMode]);

  // --- Logic ---

  const showToast = (msg: string, type: 'info' | 'error' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerHighlight = () => {
    setHighlightSD(true);
    setTimeout(() => setHighlightSD(false), 2000);
  };

  // Core logic: Updating patients updates Sex/Age SD categories automatically
  const handlePatientChange = (type: 'atendidos' | 'trasladados', change: number) => {
    setCounts(prev => {
      const newVal = prev[type] + change;
      if (newVal < 0) return prev; // Safety check

      const diff = change; // +1 or -1
      
      let newSexoSD = prev.sexoSD;
      let newEdadSD = prev.edadSD;

      // Logic: If adding patient, add to SD. If removing, remove from SD if possible.
      if (diff > 0) {
        newSexoSD += diff;
        newEdadSD += diff;
        triggerHighlight();
      } else {
        // Decrease only if SD has value, otherwise user has categorized them already
        // Note: The original logic forced removal from SD if available. 
        if (prev.sexoSD > 0) newSexoSD += diff; 
        if (prev.edadSD > 0) newEdadSD += diff;
      }

      // Hospital sync for traslados
      if (type === 'trasladados') {
        setHospitals(currHospitals => {
          const newHosp = [...currHospitals];
          // Simple logic from original: add/remove from first hospital
          if (newHosp.length > 0 && newHosp[0].name) {
             if (diff > 0) newHosp[0].count += diff;
             else if (diff < 0 && newHosp[0].count > 0) newHosp[0].count += diff;
          }
          return newHosp;
        });
      }

      return {
        ...prev,
        [type]: newVal,
        sexoSD: newSexoSD,
        edadSD: newEdadSD
      };
    });
  };

  // Redistribute from SD to a specific category (e.g., Male)
  const handleDistribution = (category: 'masculino' | 'femenino' | 'menores' | 'mayores', change: number) => {
    setCounts(prev => {
      const isSex = ['masculino', 'femenino'].includes(category);
      const sdKey = isSex ? 'sexoSD' : 'edadSD';
      
      if (change > 0) {
        // Moving from SD to Category
        if (prev[sdKey] > 0) {
          return { ...prev, [category]: prev[category] + 1, [sdKey]: prev[sdKey] - 1 };
        } else {
          showToast(`No hay pacientes en S/D (${isSex ? 'Sexo' : 'Edad'}) para clasificar.`, 'error');
          return prev;
        }
      } else {
        // Moving back to SD
        if (prev[category] > 0) {
          return { ...prev, [category]: prev[category] - 1, [sdKey]: prev[sdKey] + 1 };
        }
        return prev;
      }
    });
  };

  const handleSDDirectChange = (type: 'sexoSD' | 'edadSD', change: number) => {
    // Only allow decrementing manually if user wants to correct counts
    if (change < 0 && counts[type] > 0) {
       setCounts(prev => ({ ...prev, [type]: prev[type] - 1 }));
       showToast('Paciente retirado de S/D manualmente.', 'info');
    } else if (change > 0) {
       showToast('Use "Atendidos" o "Trasladados" para agregar pacientes.', 'error');
    }
  };

  const handleHospitalChange = (id: string, field: 'name' | 'count', value: string | number) => {
    setHospitals(prev => prev.map(h => {
      if (h.id !== id) return h;
      
      if (field === 'count') {
        const newValue = Number(value);
        const change = newValue - h.count; // +1 or -1
        // Validate total vs traslados
        const currentTotalHosp = prev.reduce((sum, item) => sum + item.count, 0);
        // If we are adding, check if we exceed total traslados
        if (change > 0 && currentTotalHosp + change > counts.trasladados) {
          showToast('No puede asignar más que el total de traslados.', 'error');
          return h;
        }
        return { ...h, count: newValue };
      }
      
      if (field === 'name') {
        const strVal = String(value);
        if (!h.isCustom && strVal === 'OTROS') {
            return { ...h, name: '', isCustom: true };
        }
        return { ...h, name: strVal };
      }

      return h;
    }));
  };

  const revertCustomHospital = (id: string) => {
    setHospitals(prev => prev.map(h => h.id === id ? { ...h, isCustom: false, name: '' } : h));
  };

  const addHospital = () => {
    setHospitals([...hospitals, { id: Math.random().toString(36).substr(2, 9), name: '', count: 0 }]);
  };

  const removeHospital = (id: string) => {
    setHospitals(hospitals.filter(h => h.id !== id));
  };

  const resetAll = () => {
    if (window.confirm('¿Reiniciar todo?')) {
      setCounts({
        atendidos: 0, trasladados: 0, masculino: 0, femenino: 0, sexoSD: 0,
        menores: 0, mayores: 0, edadSD: 0, moviles: 0, aereo: 0, obitos: 0, evacuados: 0
      });
      setHospitals([{ id: '1', name: '', count: 0 }]);
      setIncidente('');
      setDireccion('');
      setIntervencion('');
      setNotas('');
      setMethane({ M: '', E: '', T: '', H: '', A: '', N: '', E2: '' });
      setIsFinal(false);
      showToast('Aplicación reiniciada', 'info');
    }
  };

  // --- Output Generators ---

  const getSummaryText = () => {
    const total = counts.atendidos + counts.trasladados;
    let hospText = hospitals.filter(h => h.name && h.count > 0)
      .map(h => `- ${h.name}: ${h.count}`).join('\n');
    if (!hospText) hospText = 'Ninguno';

    let methaneText = '';
    if (Object.values(methane).some(v => v)) {
      methaneText = `METHANE:\nM: ${methane.M}\nE: ${methane.E}\nT: ${methane.T}\nH: ${methane.H}\nA: ${methane.A}\nN: ${methane.N}\nE: ${methane.E2}\n\n`;
    }

    return `${methaneText}*Incidente: ${incidente || 'N/A'}*
*Dirección: ${direccion || 'N/A'}*

*${isFinal ? 'FINAL' : 'Hasta ahora'} ${total} pacientes*

Pacientes:
- Total: ${total}
- Óbitos: ${counts.obitos}
- Evacuados: ${counts.evacuados}

Sexo:
- Masc: ${counts.masculino} | Fem: ${counts.femenino}
- S/D: ${counts.sexoSD}

Edad:
- Menores: ${counts.menores} | Mayores: ${counts.mayores}
- S/D: ${counts.edadSD}

Procedimiento:
- Atendidos: ${counts.atendidos}
- Trasladados: ${counts.trasladados}

Destinos:
${hospText}

Dotación:
- Móviles: ${counts.moviles} | Aéreo: ${counts.aereo}

Intervención:
${intervencion}

Notas:
${notas}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getSummaryText()).then(() => showToast('Copiado al portapapeles'));
  };

  const sendWhatsApp = () => {
    const text = encodeURIComponent(getSummaryText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePDF = () => {
    generatePDF({
      incidente, direccion, intervencion, notas, methane, counts, hospitals, isFinal
    });
  };

  const totalPatients = counts.atendidos + counts.trasladados;

  return (
    <div className="min-h-screen pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Ambulance size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-blue-500 dark:from-emerald-400 dark:to-blue-400">
                ECUES
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                <span className={isFinal ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>
                  {isFinal ? 'FINAL' : 'EN CURSO'}
                </span>
                <span>•</span>
                <span>{totalPatients} Pacientes</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsFinal(!isFinal)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isFinal ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}
            >
              {isFinal ? 'FINALIZADO' : 'MARCAR FINAL'}
            </button>
            <button 
              onClick={resetAll}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        
        {/* Buttons Row */}
        <div className="flex flex-wrap justify-center gap-3">
          <button 
            onClick={() => setShowMethane(!showMethane)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-sm hover:bg-blue-200 transition-colors"
          >
            {showMethane ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            METHANE
          </button>
          <button 
            onClick={() => setShowObitos(!showObitos)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-300 transition-colors"
          >
            {showObitos ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            ÓBITOS
          </button>
          <button 
            onClick={() => setShowEvacuados(!showEvacuados)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold text-sm hover:bg-orange-200 transition-colors"
          >
            {showEvacuados ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            EVACUADOS
          </button>
        </div>

        {/* METHANE Section */}
        {showMethane && (
          <Section title="METHANE Report">
            <div className="grid grid-cols-1 gap-3">
              {[
                { k: 'M', l: 'Major Incident (Sí/No)', p: 'Declaración' },
                { k: 'E', l: 'Exact Location', p: 'Dirección exacta' },
                { k: 'T', l: 'Type of Incident', p: 'Tipo (Incendio, Choque...)' },
                { k: 'H', l: 'Hazards', p: 'Peligros presentes' },
                { k: 'A', l: 'Access', p: 'Rutas de acceso' },
                { k: 'N', l: 'Number of Casualties', p: 'Número estimado' },
                { k: 'E2', l: 'Emergency Services', p: 'Servicios requeridos' }
              ].map((field) => (
                <div key={field.k} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                    {field.k === 'E2' ? 'E' : field.k}
                  </div>
                  <input
                    type="text"
                    placeholder={field.p}
                    value={(methane as any)[field.k]}
                    onChange={e => setMethane({...methane, [field.k]: e.target.value})}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* General Info */}
        <Section title="Información General">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ClipboardList className="mt-2 text-gray-400" size={20} />
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1">INCIDENTE</label>
                <input 
                  type="text" 
                  value={incidente} 
                  onChange={e => setIncidente(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  placeholder="Descripción del incidente..."
                />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-2 text-gray-400" size={20} />
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1">DIRECCIÓN</label>
                <input 
                  type="text" 
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  placeholder="Ubicación exacta..."
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Procedimiento (Main Counters) */}
        <Section title="Procedimiento">
          <div className="grid grid-cols-2 gap-4">
            <Counter 
              label="Atendidos" 
              value={counts.atendidos} 
              onChange={(val) => handlePatientChange('atendidos', val)} 
            />
            <Counter 
              label="Trasladados" 
              value={counts.trasladados} 
              onChange={(val) => handlePatientChange('trasladados', val)} 
            />
          </div>
        </Section>

        {/* Obitos Section */}
        {showObitos && (
          <Section title="Óbitos" className="border-l-gray-800">
            <div className="flex justify-center">
              <Counter 
                label="Fallecidos" 
                value={counts.obitos} 
                onChange={(val) => setCounts(p => ({...p, obitos: Math.max(0, p.obitos + val)}))}
              />
            </div>
          </Section>
        )}

        {/* Evacuados Section */}
        {showEvacuados && (
          <Section title="Evacuados" className="border-l-orange-500 dark:border-l-orange-600">
            <div className="flex justify-center">
              <Counter 
                label="Evacuados" 
                value={counts.evacuados} 
                onChange={(val) => setCounts(p => ({...p, evacuados: Math.max(0, p.evacuados + val)}))}
              />
            </div>
          </Section>
        )}

        {/* Demographics Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Sexo">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Counter label="Masculino" value={counts.masculino} onChange={(val) => handleDistribution('masculino', val)} />
                <Counter label="Femenino" value={counts.femenino} onChange={(val) => handleDistribution('femenino', val)} />
              </div>
              <Counter label="S/D" value={counts.sexoSD} onChange={(val) => handleSDDirectChange('sexoSD', val)} highlight={highlightSD} />
            </div>
          </Section>

          <Section title="Edad">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Counter label="Menores" value={counts.menores} onChange={(val) => handleDistribution('menores', val)} />
                <Counter label="Mayores" value={counts.mayores} onChange={(val) => handleDistribution('mayores', val)} />
              </div>
              <Counter label="S/D" value={counts.edadSD} onChange={(val) => handleSDDirectChange('edadSD', val)} highlight={highlightSD} />
            </div>
          </Section>
        </div>

        {/* Resources */}
        <Section title="Dotación">
          <div className="grid grid-cols-2 gap-4">
            <Counter 
              label="Móviles" 
              value={counts.moviles} 
              onChange={(val) => setCounts(p => ({...p, moviles: Math.max(0, p.moviles + val)}))} 
            />
            <Counter 
              label="Aéreos" 
              value={counts.aereo} 
              onChange={(val) => setCounts(p => ({...p, aereo: Math.max(0, p.aereo + val)}))} 
            />
          </div>
        </Section>

        {/* Hospitals */}
        <Section title="Destinos (Hospitales)">
          <div className="space-y-3">
            {hospitals.map((h, idx) => (
              <div key={h.id} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex-1 w-full">
                  {h.isCustom ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={h.name} 
                        onChange={(e) => handleHospitalChange(h.id, 'name', e.target.value)}
                        placeholder="Nombre del hospital..."
                        className="w-full bg-white dark:bg-darkcard border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        autoFocus
                      />
                      <button 
                        onClick={() => revertCustomHospital(h.id)}
                        className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex-shrink-0"
                        title="Volver a lista"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  ) : (
                    <select 
                      value={h.name}
                      onChange={(e) => handleHospitalChange(h.id, 'name', e.target.value)}
                      className="w-full bg-white dark:bg-darkcard border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm"
                    >
                      <option value="">Seleccionar Hospital...</option>
                      {HOSPITAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleHospitalChange(h.id, 'count', Math.max(0, h.count - 1))} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300"><Minus size={14}/></button>
                  <span className="w-8 text-center font-bold text-lg">{h.count}</span>
                  <button onClick={() => handleHospitalChange(h.id, 'count', h.count + 1)} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300"><Plus size={14}/></button>
                  {hospitals.length > 1 && (
                    <button onClick={() => removeHospital(h.id)} className="ml-2 text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  )}
                </div>
              </div>
            ))}
            <button 
              onClick={addHospital}
              className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:border-emerald-500 hover:text-emerald-500 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Agregar Destino
            </button>
          </div>
        </Section>

        {/* Text Areas */}
        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Intervención">
            <textarea 
              value={intervencion}
              onChange={e => setIntervencion(e.target.value)}
              className="w-full h-32 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              placeholder="Detalles de la intervención..."
            ></textarea>
          </Section>
          <Section title="Notas">
            <textarea 
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className="w-full h-32 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              placeholder="Notas adicionales..."
            ></textarea>
          </Section>
        </div>

      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <button 
          onClick={handlePDF}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/40 flex items-center justify-center transition-transform hover:scale-110"
          title="Generar PDF"
        >
          <FileText size={24} />
        </button>
        <button 
          onClick={sendWhatsApp}
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/40 flex items-center justify-center transition-transform hover:scale-110"
          title="WhatsApp"
        >
          <Share2 size={24} />
        </button>
        <button 
          onClick={copyToClipboard}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/40 flex items-center justify-center transition-transform hover:scale-110"
          title="Copiar"
        >
          <Copy size={24} />
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl text-white font-medium text-sm animate-in fade-in slide-in-from-top-5 z-50 ${toast.type === 'error' ? 'bg-red-500' : 'bg-gray-800'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default App;
