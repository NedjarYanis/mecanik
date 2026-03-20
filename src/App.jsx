import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Timer, Check, ShieldAlert, Target, Dumbbell, HeartPulse, 
  BedDouble, Info, Activity, X, TrendingUp, Star, Download, Upload, 
  StickyNote, ChevronRight, Volume2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- Assets (Garder tes imports actuels) ---
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

const programData = {
  1: { type: 'lift', dayName: "Lundi", focus: "Membres Inférieurs", 
       exercises: [
      { id: '1A', name: "Presse à Cuisses (45°)", sets: 4, reps: "12-15", tempo: "3-0-1-1", rest: 180, weight: "175 kg", muscle: "Quadriceps", safety: "Profondeur max SANS rétroversion.", image: imgPresse, altExo: "Hack Squat" },
      { id: '1B', name: "Hack Squat Machine", sets: 3, reps: "10-12", tempo: "3-1-1-0", rest: 150, weight: "~130 kg", muscle: "Quadriceps", safety: "Pause d'1s en bas.", image: imgHackSquat, altExo: "Presse Horizontale" },
      { id: '1C', name: "Leg Extension (Assis)", sets: 4, reps: "15-20", tempo: "2-0-1-2", rest: 90, weight: "RIR 1-2", muscle: "Droit fémoral", safety: "Contraction 2s en haut.", image: imgLegExtension },
      { id: '1D', name: "Machine à Adducteurs", sets: 3, reps: "15-20", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Plancher pelvien", safety: "Stabilisation trochanter.", image: imgAdducteur },
      { id: '1E', name: "Extension Mollets", sets: 4, reps: "12-15", tempo: "3-2-1-2", rest: 90, weight: "~120 kg", muscle: "Mollets", safety: "Étirement profond (2s).", image: imgMollets }
    ]
  },
  // ... (Garder la structure des autres jours du fichier original)
  2: { type: 'mixed', dayName: "Mardi", focus: "Poussée Supérieure + FATmax", exercises: [
      { id: '2A', name: "DC Smith Machine", sets: 4, reps: "6-8", tempo: "3-0-1-0", rest: 180, weight: "64 kg", muscle: "Pectoraux", safety: "Routine 15s pre-série.", image: imgDCSmith },
      { id: '2B', name: "Chest Press", sets: 3, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Pectoraux", safety: "Scapulas rétractées.", image: imgChestPress }
  ], cardio: { name: "Vélo Recline", duration: "30 min", bpm: "119-129" } },
  3: { type: 'cardio', dayName: "Mercredi", focus: "FATmax Pur", cardio: { name: "Elliptique", duration: "60 min", bpm: "119-129" } },
  4: { type: 'mixed', dayName: "Jeudi", focus: "Tirage Supérieur", exercises: [
      { id: '4A', name: "Lat Pulldown", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Dorsaux", safety: "Abaisser omoplates.", image: imgLatPulldown }
  ], cardio: { name: "Marche Inclinée", duration: "30 min", bpm: "119-129" } },
  5: { type: 'cardio', dayName: "Vendredi", focus: "Lavage Métabolique", cardio: { name: "Protocole Croisé", duration: "75 min", bpm: "119-129" } },
  6: { type: 'rest', dayName: "Samedi", focus: "Croissance", desc: "Repos absolu." },
  7: { type: 'rest', dayName: "Dimanche", focus: "Récupération SNC", desc: "Sommeil profond." }
};

export default function MecanikApp() {
  const [activeDay, setActiveDay] = useState(1);
  const [restTime, setRestTime] = useState(0);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('mecanik_v2_history')) || {});
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('mecanik_v2_notes')) || {});
  
  const timerRef = useRef(null);

  // Sync LocalStorage
  useEffect(() => localStorage.setItem('mecanik_v2_history', JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem('mecanik_v2_notes', JSON.stringify(notes)), [notes]);

  // Timer logic
  useEffect(() => {
    if (restTime > 0) {
      timerRef.current = setInterval(() => setRestTime(t => t - 1), 1000);
    } else {
      if (restTime === 0 && timerRef.current) {
        // Haptic & Sound Feedback
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
    const data = JSON.stringify({ history, notes });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mecanik_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const currentDay = programData[activeDay];

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-black text-white font-sans relative overflow-hidden">
      <header className="px-5 pt-10 pb-4 bg-black/80 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black tracking-tight uppercase">MÉCANIK</h1>
          <button onClick={exportData} className="p-2 bg-zinc-900 rounded-full text-zinc-400"><Download size={18}/></button>
        </div>
        
        <div className="flex justify-between items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[1,2,3,4,5,6,7].map(d => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`flex-shrink-0 w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeDay === d ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
              {['L','M','M','J','V','S','D'][d-1]}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={activeDay}>
          <div className="flex justify-between items-start mb-4">
             <div>
                <h2 className="text-2xl font-black leading-tight">{currentDay.focus || currentDay.dayName}</h2>
                <p className="text-zinc-500 text-xs">{currentDay.desc || ""}</p>
             </div>
             {/* Simple Muscle Heatmap Indicator */}
             <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800">
                <Activity size={24} className={currentDay.type === 'lift' ? "text-blue-500" : "text-red-500"} />
             </div>
          </div>

          {(currentDay.type === 'lift' || currentDay.type === 'mixed') && currentDay.exercises.map(exo => (
            <ExerciseCard 
              key={exo.id} 
              data={exo} 
              onStartRest={() => setRestTime(exo.rest)}
              history={history[exo.id] || []}
              note={notes[exo.id] || ""}
              onLogWeight={logWeight}
              onSaveNote={saveNote}
            />
          ))}
          {currentDay.type === 'cardio' && <CardioCard data={currentDay.cardio} />}
          {currentDay.type === 'rest' && <RestCard data={currentDay} />}
        </motion.div>
      </main>

      {/* Timer Overlay */}
      <AnimatePresence>
        {restTime > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 cursor-pointer"
            onClick={() => setRestTime(0)}
          >
            <Timer size={48} className="text-blue-500 mb-6 animate-pulse" />
            <span className="text-7xl font-mono font-black">{Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2,'0')}</span>
            <p className="mt-4 text-zinc-500 text-xs uppercase tracking-widest">Touche pour ignorer</p>
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
    setCompletedSets(prev => prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i]);
    if (!completedSets.includes(i) && weight) onLogWeight(data.id, weight);
  };

  return (
    <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-zinc-800/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{data.name}</h3>
            {weight && parseFloat(weight) >= maxWeight && maxWeight > 0 && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
          </div>
          <p className="text-xs text-zinc-500">{data.sets}x{data.reps} • {data.tempo}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView(view === 'chart' ? 'main' : 'chart')} className={`p-2 rounded-lg ${view === 'chart' ? 'bg-blue-600' : 'bg-zinc-800 text-zinc-500'}`}><TrendingUp size={16}/></button>
          <button onClick={() => setView(view === 'note' ? 'main' : 'note')} className={`p-2 rounded-lg ${view === 'note' ? 'bg-blue-600' : 'bg-zinc-800 text-zinc-500'}`}><StickyNote size={16}/></button>
        </div>
      </div>

      {/* Views */}
      <div className="p-4">
        {view === 'main' && (
          <div className="space-y-4">
            <div className="h-40 bg-black rounded-2xl overflow-hidden border border-zinc-800">
               <img src={data.image} alt="" className="w-full h-full object-contain opacity-80" />
            </div>
            
            <div className="flex gap-2">
               <div className="flex-1 bg-black p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-600 uppercase font-black block mb-1">Kilos</span>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={lastWeight ? `Dernier: ${lastWeight}kg` : "Saisir..."} className="w-full bg-transparent font-bold text-blue-500 outline-none" />
               </div>
               <button onClick={() => setView('warmup')} className="px-4 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400">Warm-up</button>
            </div>

            <div className="flex justify-between items-center bg-black/40 p-2 rounded-2xl border border-zinc-800/50">
              <div className="flex gap-1.5 pl-1">
                {[...Array(parseInt(data.sets))].map((_, i) => (
                  <button key={i} onClick={() => toggleSet(i)} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${completedSets.includes(i) ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    {completedSets.includes(i) ? <Check size={18} strokeWidth={3} /> : i + 1}
                  </button>
                ))}
              </div>
              <button onClick={onStartRest} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/40"><Play size={20} fill="white" className="ml-1"/></button>
            </div>
          </div>
        )}

        {view === 'chart' && (
          <div className="h-48 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip contentStyle={{ background: '#111', border: 'none', borderRadius: '10px', fontSize: '10px' }} />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <button onClick={() => setView('main')} className="w-full mt-2 py-2 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Fermer</button>
          </div>
        )}

        {view === 'warmup' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-xs font-black uppercase text-zinc-500">Séries d'échauffement</h4>
            <div className="grid grid-cols-3 gap-2">
               {[0.5, 0.7, 0.9].map((p, i) => (
                 <div key={i} className="bg-black p-3 rounded-xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-600 block mb-1">{p*100}%</span>
                    <span className="font-bold text-sm">{weight ? Math.round(weight * p) : "--"} kg</span>
                 </div>
               ))}
            </div>
            <button onClick={() => setView('main')} className="w-full py-3 bg-zinc-800 rounded-xl text-xs font-bold">Retour</button>
          </div>
        )}

        {view === 'note' && (
          <div className="space-y-3">
            <textarea value={note} onChange={e => onSaveNote(data.id, e.target.value)} placeholder="Notes sur la séance, réglages machine..." 
              className="w-full h-32 bg-black rounded-xl p-3 text-sm text-zinc-300 border border-zinc-800 outline-none focus:border-blue-500 transition-colors" />
            <button onClick={() => setView('main')} className="w-full py-3 bg-blue-600 rounded-xl text-xs font-bold">Sauvegarder</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep Cardio/Rest cards simple for mobile fit
function CardioCard({ data }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 text-center relative overflow-hidden">
      <HeartPulse size={48} className="text-red-500 mx-auto mb-4 opacity-50" />
      <h3 className="text-xl font-bold mb-2">{data.name}</h3>
      <div className="flex justify-center gap-4 text-sm mb-4">
        <div className="bg-black px-4 py-2 rounded-full border border-zinc-800">{data.duration}</div>
        <div className="bg-black px-4 py-2 rounded-full border border-zinc-800 text-red-500 font-mono">{data.bpm} BPM</div>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">{data.focus}</p>
    </div>
  );
}

function RestCard({ data }) {
  return (
    <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center">
      <BedDouble size={48} className="text-blue-500 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">{data.focus}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{data.desc}</p>
    </div>
  );
}