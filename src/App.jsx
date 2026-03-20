import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Timer, Check, ShieldAlert, Target, Dumbbell, HeartPulse, 
  BedDouble, Info, Activity, X, TrendingUp, Star, Download, 
  StickyNote, ChevronRight, Calculator, Volume2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- Imports des images (Assets) ---
import imgPresse from './assets/presse-a-cuisses-inclinee.gif';
import imgHackSquat from './assets/Sled-Hack-Squat.gif';
import imgLegExtension from './assets/leg-extension.gif';
import imgAdducteur from './assets/adducteur-machine-cuisse.png';
import imgMollets from './assets/ExtensionMollets .jpg';
import imgDCSmith from './assets/developpe-couche.gif';
import imgChestPress from './assets/developpe-incline-machine-convergente-exercice-musculation.gif';
import imgShoulderPress from './assets/SEAT_DB_SHD_PRESS.gif';
import imgTriceps from './assets/02011301-Cable-Pushdown_Upper-Arms_720.gif';
import imgLateralRaise from './assets/03341301-Dumbbell-Lateral-Raise_shoulder_720.gif';
import imgLatPulldown from './assets/Tirage_Vertical_Poulie_Haute.png';
import imgSeatedRow from './assets/Tirage_Horizontal_Assis.png';
import imgPullover from './assets/pull-over-poulie.gif';
import imgHammerCurl from './assets/Dumbbell-Hammer-Curl_Forearm.gif';
import imgCurlBiceps from './assets/Curl_Biceps.png';

// ==========================================
// 1. BASE DE DONNÉES CLINIQUE INTÉGRALE
// ==========================================
const programData = {
  1: { type: 'lift', dayName: "Lundi", focus: "Membres Inférieurs", desc: "Surstimulation globale. Vider le glycogène.",
    exercises: [
      { id: '1A', name: "Presse à Cuisses (45°)", sets: 4, reps: "12-15", tempo: "3-0-1-1", rest: 180, weight: "175 kg", muscle: "Quadriceps", safety: "Profondeur max SANS rétroversion.", image: imgPresse },
      { id: '1B', name: "Hack Squat Machine", sets: 3, reps: "10-12", tempo: "3-1-1-0", rest: 150, weight: "~130 kg", muscle: "Quadriceps", safety: "Pause d'1s en bas. Annule le réflexe.", image: imgHackSquat },
      { id: '1C', name: "Leg Extension (Assis)", sets: 4, reps: "15-20", tempo: "2-0-1-2", rest: 90, weight: "RIR 1-2", muscle: "Droit fémoral", safety: "Contraction 2s au sommet.", image: imgLegExtension },
      { id: '1D', name: "Machine à Adducteurs", sets: 3, reps: "15-20", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Adducteurs", safety: "Stabilisation du grand trochanter.", image: imgAdducteur },
      { id: '1E', name: "Extension Mollets", sets: 4, reps: "12-15", tempo: "3-2-1-2", rest: 90, weight: "~120 kg", muscle: "Mollets", safety: "Étirement profond (2s) sous charge.", image: imgMollets }
    ]
  },
  2: { type: 'mixed', dayName: "Mardi", focus: "Poussée Supérieure", desc: "Neutraliser la peur via la sécurité mécanique.",
    exercises: [
      { id: '2A', name: "DC Smith Machine", sets: 4, reps: "6-8", tempo: "3-0-1-0", rest: 180, weight: "64 kg", muscle: "Pectoraux", safety: "Routine 15s pre-série. Axe guidé.", image: imgDCSmith },
      { id: '2B', name: "Chest Press Convergente", sets: 3, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Pectoraux", safety: "Scapulas rétractées.", image: imgChestPress },
      { id: '2C', name: "Shoulder Press", sets: 3, reps: "10-12", tempo: "3-0-1-0", rest: 120, weight: "RIR 2", muscle: "Épaules", safety: "Améliorer le ratio épaule/taille en V.", image: imgShoulderPress },
      { id: '2D', name: "Triceps Pushdown", sets: 4, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Triceps", safety: "Coudes scellés contre les flancs.", image: imgTriceps },
      { id: '2E', name: "Élévations Latérales", sets: 3, reps: "15-20", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", muscle: "Deltoïde moyen", safety: "Mouvement continu sans élan.", image: imgLateralRaise }
    ],
    cardio: { name: "Vélo Assis (Recline)", duration: "30 min", bpm: "119-129", focus: "Oxyder les graisses post-séance." }
  },
  3: { type: 'cardio', dayName: "Mercredi", focus: "FATmax Exclusif", desc: "Régénération et consommation de graisse viscérale.",
    cardio: { name: "Elliptique ou Marche Inclinée", duration: "45-60 min", bpm: "119-129", focus: "Zéro impact. Tenir conversation fluide." }
  },
  4: { type: 'mixed', dayName: "Jeudi", focus: "Tirage & Épaisseur", desc: "Ouverture cage thoracique et équilibre postural.",
    exercises: [
      { id: '4A', name: "Tirage Vertical (Lat Pull)", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Grand Dorsal", safety: "Tirer vers le haut en abaissant les omoplates.", image: imgLatPulldown },
      { id: '4B', name: "Tirage Horizontal Assis", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Rhomboïdes", safety: "Fixer le buste. Pas d'extension lombaire.", image: imgSeatedRow },
      { id: '4C', name: "Pull-over poulie haute", sets: 3, reps: "15", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", muscle: "Grand Dorsal", safety: "Bras tendus. Tension continue sur tout l'arc.", image: imgPullover },
      { id: '4D', name: "Curl Marteau (Haltères)", sets: 4, reps: "8-10", tempo: "3-0-1-1", rest: 90, weight: "18-20 kg", muscle: "Brachio-radial", safety: "Retenue excentrique de 3s OBLIGATOIRE.", image: imgHammerCurl },
      { id: '4E', name: "Curl Biceps Machine", sets: 3, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Biceps", safety: "Isolation terminale (Pump massif).", image: imgCurlBiceps }
    ],
    cardio: { name: "Marche Inclinée (Tapis)", duration: "30 min", bpm: "119-129", focus: "Inclinaison 8-12%. Aucun impact." }
  },
  5: { type: 'cardio', dayName: "Vendredi", focus: "Lavage Métabolique", desc: "Capitaliser sur la sensibilité à l'insuline.",
    cardio: { name: "Protocole Croisé (20'x3)", duration: "60-75 min", bpm: "119-129", focus: "Vélo + Elliptique + Hand-Bike." }
  },
  6: { type: 'rest', dayName: "Samedi", focus: "Régénération Tissulaire", desc: "La croissance s'opère aujourd'hui." },
  7: { type: 'rest', dayName: "Dimanche", focus: "Repos Absolu", desc: "Restauration du système nerveux central." }
};

export default function MecanikApp() {
  const [activeDay, setActiveDay] = useState(1);
  const [restTime, setRestTime] = useState(0);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('mecanik_v4_history')) || {});
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('mecanik_v4_notes')) || {});
  
  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('mecanik_v4_history', JSON.stringify(history));
    localStorage.setItem('mecanik_v4_notes', JSON.stringify(notes));
  }, [history, notes]);

  useEffect(() => {
    if (restTime > 0) {
      timerRef.current = setInterval(() => setRestTime(t => t - 1), 1000);
    } else {
      if (restTime === 0 && timerRef.current) {
        window.navigator.vibrate?.([200, 100, 200]);
        new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(() => {});
      }
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [restTime]);

  const logWeight = (id, weight) => {
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    setHistory(prev => ({
      ...prev,
      [id]: [...(prev[id] || []).filter(h => h.date !== date), { date, weight: parseFloat(weight) }].slice(-10)
    }));
  };

  const saveNote = (id, text) => setNotes(prev => ({ ...prev, [id]: text }));
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ history, notes })], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `mecanik_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
  };

  const currentDay = programData[activeDay];

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-black text-white font-sans relative overflow-hidden">
      <header className="px-5 pt-10 pb-4 bg-black/80 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black tracking-tight uppercase">MÉCANIK</h1>
          <button onClick={exportData} className="p-2 bg-zinc-900 rounded-full text-zinc-400 active:scale-95"><Download size={18}/></button>
        </div>
        <div className="flex justify-between items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[1,2,3,4,5,6,7].map(d => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`flex-shrink-0 w-11 h-11 rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeDay === d ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-zinc-900 text-zinc-500'}`}>
              {['LUN','MAR','MER','JEU','VEN','SAM','DIM'][d-1]}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={activeDay}>
          <div className="mb-6 px-1 flex justify-between items-start">
            <div>
              <h2 className="text-[26px] font-black leading-tight text-white mb-1 uppercase tracking-tighter">{currentDay.focus}</h2>
              <p className="text-[#8E8E93] text-[13px] leading-snug">{currentDay.desc}</p>
            </div>
            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                <Activity size={24} className={currentDay.type === 'lift' ? "text-blue-500" : "text-red-500"} />
            </div>
          </div>

          {(currentDay.type === 'lift' || currentDay.type === 'mixed') && currentDay.exercises.map(exo => (
            <ExerciseCard 
              key={exo.id} data={exo} onStartRest={() => setRestTime(exo.rest)}
              history={history[exo.id] || []} note={notes[exo.id] || ""}
              onLogWeight={logWeight} onSaveNote={saveNote}
            />
          ))}
          {currentDay.cardio && <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />}
          {currentDay.type === 'rest' && <RestCard data={currentDay} />}
        </motion.div>
      </main>

      <AnimatePresence>
        {restTime > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 cursor-pointer"
            onClick={() => setRestTime(0)}>
            <Timer size={48} className="text-blue-500 mb-6 animate-pulse" />
            <span className="text-7xl font-mono font-black tabular-nums">{Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2,'0')}</span>
            <p className="mt-8 text-xs text-zinc-600 uppercase font-bold tracking-[0.2em]">Récupération nerveuse...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExerciseCard({ data, onStartRest, history, note, onLogWeight, onSaveNote }) {
  const [completedSets, setCompletedSets] = useState([]);
  const [weight, setWeight] = useState("");
  const [view, setView] = useState('main'); // 'main', 'chart', 'warmup', 'note'

  const maxWeight = history.length > 0 ? Math.max(...history.map(h => h.weight)) : 0;
  const lastWeight = history.length > 0 ? history[history.length-1].weight : null;

  const toggleSet = (i) => {
    const isNowDone = !completedSets.includes(i);
    setCompletedSets(prev => isNowDone ? [...prev, i] : prev.filter(s => s !== i));
    if (isNowDone && weight) onLogWeight(data.id, weight);
  };

  return (
    <div className="bg-[#151517] rounded-[28px] border border-[#222225] overflow-hidden mb-6 flex flex-col shadow-xl">
      <div className="p-5 flex justify-between items-center border-b border-[#222225]">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-[17px] font-bold text-white">{data.name}</h3>
             {weight && parseFloat(weight) >= maxWeight && maxWeight > 0 && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
          </div>
          <div className="bg-[#222225] px-2 py-0.5 rounded text-[10px] font-black text-blue-400 inline-block uppercase tracking-wider">{data.sets}x{data.reps} • {data.tempo}</div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setView(view === 'chart' ? 'main' : 'chart')} className={`p-2.5 rounded-xl transition-all ${view === 'chart' ? 'bg-blue-600' : 'bg-[#222225] text-[#8E8E93]'}`}><TrendingUp size={18}/></button>
          <button onClick={() => setView(view === 'note' ? 'main' : 'note')} className={`p-2.5 rounded-xl transition-all ${view === 'note' ? 'bg-blue-600' : 'bg-[#222225] text-[#8E8E93]'}`}><StickyNote size={18}/></button>
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {view === 'main' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="h-44 bg-black rounded-[20px] overflow-hidden border border-[#222225]">
                 <img src={data.image} alt="" className="w-full h-full object-contain opacity-90" />
              </div>
              
              <div className="flex gap-2">
                 <div className="flex-1 bg-[#0C0C0E] p-3 rounded-2xl border border-[#222225] flex items-center">
                    <span className="text-[10px] text-zinc-600 uppercase font-black mr-3">Kg</span>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={lastWeight ? `${lastWeight}kg` : "---"} className="bg-transparent font-bold text-white text-lg outline-none w-full" />
                 </div>
                 <button onClick={() => setView('warmup')} className="px-4 bg-[#222225] rounded-2xl border border-[#2c2c2e] text-[10px] font-black uppercase text-zinc-400 active:bg-zinc-800">Warm-up</button>
              </div>

              <div className="flex justify-between items-center mt-2 px-1">
                <div className="flex gap-2">
                  {[...Array(parseInt(data.sets))].map((_, i) => (
                    <button key={i} onClick={() => toggleSet(i)} 
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all ${completedSets.includes(i) ? 'bg-[#34C759] text-black shadow-[0_0_15px_rgba(52,199,89,0.3)]' : 'bg-[#222225] text-[#8E8E93]'}`}>
                      {completedSets.includes(i) ? <Check size={20} strokeWidth={3} /> : i + 1}
                    </button>
                  ))}
                </div>
                <button onClick={onStartRest} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/50 active:scale-90 transition-transform"><Play size={22} fill="white" className="ml-1"/></button>
              </div>

              <div className="pt-2 flex items-start gap-2.5">
                <ShieldAlert size={14} className="text-[#FF453A] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[#FF453A] font-medium leading-snug">{data.safety}</p>
              </div>
            </motion.div>
          )}

          {view === 'chart' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-48 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip contentStyle={{ background: '#111', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="weight" stroke="#0A84FF" strokeWidth={4} dot={{ fill: '#0A84FF', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <button onClick={() => setView('main')} className="w-full mt-4 py-2 text-[10px] text-zinc-600 uppercase font-black">Retour</button>
            </motion.div>
          )}

          {view === 'warmup' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 py-2">
              <h4 className="text-[11px] font-black uppercase text-zinc-500 tracking-widest text-center">Calculateur d'échauffement</h4>
              <div className="grid grid-cols-3 gap-3">
                 {[0.5, 0.7, 0.9].map((p, i) => (
                   <div key={i} className="bg-black p-4 rounded-2xl border border-[#222225] text-center">
                      <span className="text-[10px] text-zinc-600 block mb-1 font-black">{p*100}%</span>
                      <span className="font-black text-lg text-white">{weight ? Math.round(weight * p) : "--"} <span className="text-[10px] text-zinc-600">kg</span></span>
                   </div>
                 ))}
              </div>
              <button onClick={() => setView('main')} className="w-full py-4 bg-[#222225] rounded-2xl text-xs font-black uppercase">Fermer</button>
            </motion.div>
          )}

          {view === 'note' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <textarea value={note} onChange={e => onSaveNote(data.id, e.target.value)} placeholder="Prise, sensations, réglages machine..." 
                className="w-full h-36 bg-black rounded-2xl p-4 text-sm text-zinc-300 border border-[#222225] outline-none focus:border-blue-600 transition-all" />
              <button onClick={() => setView('main')} className="w-full py-4 bg-blue-600 rounded-2xl text-xs font-black uppercase shadow-lg shadow-blue-900/30">Sauvegarder</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CardioCard({ data, isFinisher }) {
  return (
    <article className="bg-[#1A1111] rounded-[28px] border border-[#3A1D1D] p-6 relative overflow-hidden mb-6 shadow-xl">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <HeartPulse size={16} className="text-[#FF453A] animate-pulse" />
          <span className="text-[#FF453A] text-[10px] font-black uppercase tracking-widest">{isFinisher ? "Finisher FATmax" : "Session Cardio"}</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-5">{data.name}</h3>
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-black/60 rounded-2xl p-4 border border-[#3A1D1D]/50 text-center"><span className="text-[10px] text-zinc-600 font-bold block mb-1 uppercase tracking-tighter">Temps</span><span className="font-black text-white">{data.duration}</span></div>
          <div className="flex-1 bg-[#FF453A]/10 rounded-2xl p-4 border border-[#FF453A]/20 text-center"><span className="text-[10px] text-[#FF453A] font-bold block mb-1 uppercase tracking-tighter">Cible BPM</span><span className="font-black text-[#FF453A] font-mono">{data.bpm}</span></div>
        </div>
        <div className="bg-black/40 p-3 rounded-xl flex gap-3 items-start border border-[#3A1D1D]/30">
          <Info size={16} className="text-[#FF453A] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[#D1D1D6] leading-snug">{data.focus || "Maintenir la FC strictement dans le couloir 119-129 bpm pour oxyder les graisses."}</p>
        </div>
      </div>
    </article>
  );
}

function RestCard({ data }) {
  return (
    <div className="bg-[#151517] p-10 rounded-[32px] border border-[#222225] text-center shadow-2xl mt-10">
      <BedDouble size={56} className="text-blue-500 mx-auto mb-6" />
      <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">{data.focus}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed px-2">{data.desc}</p>
      <div className="mt-8 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <p className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Conseil</p>
        <p className="text-xs text-zinc-400 mt-1 italic">"La croissance s'opère durant le repos, pas à la salle."</p>
      </div>
    </div>
  );
}