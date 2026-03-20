import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Timer, Check, ShieldAlert, Target, Dumbbell, HeartPulse, 
  BedDouble, Info, Activity, X, TrendingUp, Star, Download, 
  StickyNote, ChevronRight, Calculator, Scan, Music, SkipForward, Pause, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner } from "html5-qrcode";

// --- Assets ---
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
// 1. BASE DE DONNÉES AVEC ALTERNATIVES BASIC-FIT
// ==========================================
const programData = {
  1: { type: 'lift', dayName: "Lundi", focus: "Membres Inférieurs", desc: "Surstimulation globale.",
    exercises: [
      { id: '1A', name: "Presse à Cuisses (45°)", sets: 4, reps: "12-15", tempo: "3-0-1-1", rest: 180, weight: "175 kg", muscle: "Quadriceps", safety: "Profondeur max SANS rétroversion.", image: imgPresse, alternative: { name: "Presse Horizontale Matrix", note: "Même ciblage, plus stable pour le dos." } },
      { id: '1B', name: "Hack Squat Machine", sets: 3, reps: "10-12", tempo: "3-1-1-0", rest: 150, weight: "~130 kg", muscle: "Quadriceps", safety: "Pause d'1s en bas.", image: imgHackSquat, alternative: { name: "V-Squat Machine", note: "Plus de focus sur la chaîne postérieure." } },
      { id: '1C', name: "Leg Extension (Assis)", sets: 4, reps: "15-20", tempo: "2-0-1-2", rest: 90, weight: "RIR 1-2", muscle: "Droit fémoral", safety: "Contraction 2s au sommet.", image: imgLegExtension, alternative: { name: "Sissy Squat Machine", note: "Isolation pure du quadriceps." } },
      { id: '1D', name: "Machine à Adducteurs", sets: 3, reps: "15-20", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Adducteurs", safety: "Stabilisation du grand trochanter.", image: imgAdducteur },
      { id: '1E', name: "Extension Mollets", sets: 4, reps: "12-15", tempo: "3-2-1-2", rest: 90, weight: "~120 kg", muscle: "Mollets", safety: "Étirement profond (2s) sous charge.", image: imgMollets }
    ]
  },
  2: { type: 'mixed', dayName: "Mardi", focus: "Poussée Supérieure", desc: "Neuro-Psychologique.",
    exercises: [
      { id: '2A', name: "DC Smith Machine", sets: 4, reps: "6-8", tempo: "3-0-1-0", rest: 180, weight: "64 kg", muscle: "Pectoraux", safety: "Routine 15s. Axe guidé.", image: imgDCSmith, alternative: { name: "Chest Press Matrix", note: "Si la Smith est occupée." } },
      { id: '2B', name: "Chest Press Convergente", sets: 3, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Pectoraux", safety: "Scapulas rétractées.", image: imgChestPress, alternative: { name: "Pec Deck (Écartés)", note: "Priorité à l'étirement." } },
      { id: '2C', name: "Shoulder Press", sets: 3, reps: "10-12", tempo: "3-0-1-0", rest: 120, weight: "RIR 2", muscle: "Épaules", safety: "Améliorer ratio V.", image: imgShoulderPress },
      { id: '2D', name: "Triceps Pushdown", sets: 4, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Triceps", safety: "Coudes scellés.", image: imgTriceps },
      { id: '2E', name: "Élévations Latérales", sets: 3, reps: "15-20", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", muscle: "Deltoïde", safety: "Continu sans élan.", image: imgLateralRaise }
    ],
    cardio: { name: "Vélo Assis (Recline)", duration: "30 min", bpm: "119-129", focus: "Spotify BPM Sync: 120 BPM." }
  },
  // ... (Garder les autres jours 3, 5, 6, 7 comme précédemment)
  4: { type: 'mixed', dayName: "Jeudi", focus: "Tirage & Épaisseur", desc: "Ouverture cage thoracique.",
    exercises: [
      { id: '4A', name: "Lat Pulldown (Poulie Haute)", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Dorsaux", safety: "Abaisser omoplates.", image: imgLatPulldown, alternative: { name: "Hammer Strength High Row", note: "Excellente alternative convergente." } },
      { id: '4B', name: "Seated Cable Row", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Rhomboïdes", safety: "Fixer le buste.", image: imgSeatedRow },
      { id: '4C', name: "Pull-over poulie haute", sets: 3, reps: "15", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", muscle: "Dorsaux", safety: "Tension continue.", image: imgPullover },
      { id: '4D', name: "Curl Marteau (Haltères)", sets: 4, reps: "8-10", tempo: "3-0-1-1", rest: 90, weight: "18-20 kg", muscle: "Brachio-radial", safety: "Excentrique 3s.", image: imgHammerCurl },
      { id: '4E', name: "Curl Biceps Machine", sets: 3, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Biceps", safety: "Pump massif.", image: imgCurlBiceps }
    ],
    cardio: { name: "Marche Inclinée", duration: "30 min", bpm: "119-129", focus: "Spotify BPM Sync: 125 BPM." }
  }
};

export default function MecanikApp() {
  const [activeDay, setActiveDay] = useState(1);
  const [restTime, setRestTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [spotifyTrack, setSpotifyTrack] = useState({ title: "Pump Up", artist: "Mecanik Mix", bpm: 124 });
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('mecanik_v5_history')) || {});
  
  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('mecanik_v5_history', JSON.stringify(history));
  }, [history]);

  // Audio Control & Timer end
  useEffect(() => {
    if (restTime > 0) {
      timerRef.current = setInterval(() => setRestTime(t => t - 1), 1000);
    } else {
      if (restTime === 0 && timerRef.current) {
        // Intelligence Audio : Baisser le son ou pause
        console.log("Audio Control: Fin du repos - Retour au volume normal");
        window.navigator.vibrate?.([200, 100, 200]);
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

  const currentDay = programData[activeDay];

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-black text-white font-sans relative overflow-hidden">
      
      {/* 2. HEADER AVEC WIDGET SPOTIFY & SCANNER */}
      <header className="px-5 pt-10 pb-4 bg-black/80 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight uppercase">MÉCANIK</h1>
            <button onClick={() => setIsScanning(true)} className="p-2 bg-blue-600 rounded-full text-white active:scale-95"><Scan size={16}/></button>
          </div>
          
          {/* Mini-lecteur Spotify discret */}
          <div className="bg-zinc-900 px-3 py-1.5 rounded-full flex items-center gap-3 border border-zinc-800">
            <Music size={14} className="text-green-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-white truncate max-w-[80px]">{spotifyTrack.title}</span>
              <span className="text-[8px] text-zinc-500">{spotifyTrack.bpm} BPM</span>
            </div>
            <div className="flex gap-1.5 ml-1">
              <SkipForward size={14} className="text-zinc-400" />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between gap-1 overflow-x-auto scrollbar-hide">
          {[1,2,3,4,5,6,7].map(d => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`flex-shrink-0 w-[42px] h-[42px] rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeDay === d ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(10,132,255,0.4)]' : 'bg-zinc-900 text-zinc-500'}`}>
              {['LUN','MAR','MER','JEU','VEN','SAM','DIM'][d-1]}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={activeDay}>
          <div className="mb-4 pl-1">
            <h2 className="text-[24px] font-black leading-tight text-white uppercase tracking-tighter">{currentDay.focus}</h2>
            <p className="text-[#8E8E93] text-[12px]">{currentDay.desc}</p>
          </div>

          {(currentDay.type === 'lift' || currentDay.type === 'mixed') && currentDay.exercises.map(exo => (
            <ExerciseCard 
              key={exo.id} data={exo} onStartRest={() => setRestTime(exo.rest)}
              history={history[exo.id] || []} onLogWeight={logWeight}
            />
          ))}
          {currentDay.cardio && <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />}
          {currentDay.type === 'rest' && <RestCard data={currentDay} />}
        </motion.div>
      </main>

      {/* MODAL SCANNER QR CODE */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black p-6 flex flex-col items-center justify-center">
          <div id="reader" className="w-full rounded-2xl overflow-hidden border border-zinc-800"></div>
          <button onClick={() => setIsScanning(false)} className="mt-10 px-8 py-3 bg-zinc-900 rounded-2xl font-bold uppercase text-xs">Fermer</button>
        </div>
      )}

      {/* OVERLAY CHRONO */}
      <AnimatePresence>
        {restTime > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 cursor-pointer"
            onClick={() => setRestTime(0)}>
            <Timer size={48} className="text-blue-500 mb-6" />
            <span className="text-7xl font-mono font-black tabular-nums">{Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2,'0')}</span>
            <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
               <Music size={14} className="text-zinc-500" />
               <span className="text-[10px] text-zinc-400 font-bold uppercase">Volume réduit pendant le repos</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExerciseCard({ data, onStartRest, history, onLogWeight }) {
  const [completedSets, setCompletedSets] = useState([]);
  const [weight, setWeight] = useState("");
  const [isAlt, setIsAlt] = useState(false);
  const [view, setView] = useState('main');

  const toggleSet = (i) => {
    const done = !completedSets.includes(i);
    setCompletedSets(prev => done ? [...prev, i] : prev.filter(s => s !== i));
    if (done && weight) onLogWeight(data.id, weight);
  };

  return (
    <div className="bg-[#151517] rounded-[28px] border border-[#222225] overflow-hidden mb-6 flex flex-col">
      <div className="p-5 flex justify-between items-center border-b border-[#222225]">
        <div>
          <h3 className="text-[17px] font-bold text-white">{isAlt ? data.alternative.name : data.name}</h3>
          <div className="bg-[#222225] px-2 py-0.5 rounded text-[10px] font-black text-blue-400 inline-block uppercase mt-1">{data.sets}x{data.reps} • {data.tempo}</div>
        </div>
        <div className="flex gap-1">
          {data.alternative && (
            <button onClick={() => setIsAlt(!isAlt)} className={`p-2.5 rounded-xl transition-all ${isAlt ? 'bg-orange-600 text-white' : 'bg-[#222225] text-orange-500'}`} title="Machine occupée ?">
              <RefreshCw size={18}/>
            </button>
          )}
          <button onClick={() => setView(view === 'chart' ? 'main' : 'chart')} className={`p-2.5 rounded-xl transition-all ${view === 'chart' ? 'bg-blue-600' : 'bg-[#222225] text-[#8E8E93]'}`}><TrendingUp size={18}/></button>
        </div>
      </div>

      <div className="p-4">
        {view === 'main' ? (
          <div className="space-y-4">
            <div className="h-44 bg-black rounded-[20px] overflow-hidden border border-[#222225] relative">
               <img src={data.image} alt="" className="w-full h-full object-contain opacity-90" />
               {isAlt && <div className="absolute inset-0 bg-orange-600/20 flex items-center justify-center backdrop-blur-[2px]"><span className="bg-black/80 px-4 py-2 rounded-full text-[10px] font-black uppercase text-orange-400 border border-orange-600/40">Alternative active</span></div>}
            </div>
            
            <div className="flex gap-2">
               <div className="flex-1 bg-[#0C0C0E] p-3 rounded-2xl border border-[#222225] flex items-center">
                  <span className="text-[10px] text-zinc-600 uppercase font-black mr-3">Kg</span>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="---" className="bg-transparent font-bold text-white text-lg outline-none w-full" />
               </div>
            </div>

            <div className="flex justify-between items-center px-1">
                <div className="flex gap-2">
                  {[...Array(parseInt(data.sets))].map((_, i) => (
                    <button key={i} onClick={() => toggleSet(i)} 
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all ${completedSets.includes(i) ? 'bg-[#34C759] text-black shadow-[0_0_15px_rgba(52,199,89,0.3)]' : 'bg-[#222225] text-[#8E8E93]'}`}>
                      {completedSets.includes(i) ? <Check size={20} strokeWidth={3} /> : i + 1}
                    </button>
                  ))}
                </div>
                <button onClick={onStartRest} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center active:scale-90 transition-transform"><Play size={22} fill="white" className="ml-1"/></button>
            </div>
            
            {isAlt && <p className="text-[10px] text-orange-500 font-bold bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 leading-snug">{data.alternative.note}</p>}
          </div>
        ) : (
          <div className="h-48 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip contentStyle={{ background: '#111', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="weight" stroke="#0A84FF" strokeWidth={4} dot={{ fill: '#0A84FF', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <button onClick={() => setView('main')} className="w-full mt-4 py-2 text-[10px] text-zinc-600 uppercase font-black">Retour</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CardioCard({ data, isFinisher }) {
  return (
    <article className="bg-[#1A1111] rounded-[28px] border border-[#3A1D1D] p-6 relative overflow-hidden mb-6">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <HeartPulse size={16} className="text-[#FF453A] animate-pulse" />
            <span className="text-[#FF453A] text-[10px] font-black uppercase tracking-widest">Finisher FATmax</span>
          </div>
          <div className="flex items-center gap-2 bg-green-600/10 px-2 py-1 rounded-full border border-green-600/20">
             <Music size={12} className="text-green-500" />
             <span className="text-[9px] font-black text-green-500 uppercase">BPM Sync Active</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-5">{data.name}</h3>
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-black/60 rounded-2xl p-4 border border-[#3A1D1D]/50 text-center"><span className="text-[10px] text-zinc-600 font-bold block mb-1 uppercase">Temps</span><span className="font-black text-white">{data.duration}</span></div>
          <div className="flex-1 bg-[#FF453A]/10 rounded-2xl p-4 border border-[#FF453A]/20 text-center"><span className="text-[10px] text-[#FF453A] font-bold block mb-1 uppercase">Cible BPM</span><span className="font-black text-[#FF453A] font-mono">{data.bpm}</span></div>
        </div>
        <p className="text-[11px] text-[#D1D1D6] leading-snug border-l-2 border-[#FF453A] pl-4">{data.focus}</p>
      </div>
    </article>
  );
}

function RestCard({ data }) {
  return (
    <div className="bg-[#151517] p-10 rounded-[32px] border border-[#222225] text-center mt-10">
      <BedDouble size={56} className="text-blue-500 mx-auto mb-6" />
      <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">{data.focus}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{data.desc}</p>
    </div>
  );
}