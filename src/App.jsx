import React, { useState, useEffect } from 'react';
import { Play, Timer, Check, ShieldAlert, Target, Dumbbell, HeartPulse, BedDouble, Info, Activity, Calculator, X, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Import des images depuis vos assets
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

// Base de données clinique complète issue de votre code
const programData = {
  1: { type: 'lift', dayName: "Lundi", focus: "Membres Inférieurs", 
       desc: "Surstimulation Métabolique Globale. Vider le glycogène.",
       exercises: [
      { id: '1A', name: "Presse à Cuisses (45°)", sets: 4, reps: "12-15", tempo: "3-0-1-1", rest: 180, weight: "175 kg", muscle: "Quadriceps (70% 1RM)", safety: "Profondeur max SANS rétroversion du bassin.", image: imgPresse },
      { id: '1B', name: "Hack Squat Machine", sets: 3, reps: "10-12", tempo: "3-1-1-0", rest: 150, weight: "~130 kg", muscle: "Quadriceps", safety: "Pause d'1s en bas.", image: imgHackSquat },
      { id: '1C', name: "Leg Extension (Assis)", sets: 4, reps: "15-20", tempo: "2-0-1-2", rest: 90, weight: "RIR 1-2", muscle: "Droit fémoral", safety: "Contraction isométrique 2s en haut.", image: imgLegExtension },
      { id: '1D', name: "Machine à Adducteurs", sets: 3, reps: "15-20", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Plancher pelvien", safety: "Stabilisation du grand trochanter.", image: imgAdducteur },
      { id: '1E', name: "Extension Mollets", sets: 4, reps: "12-15", tempo: "3-2-1-2", rest: 90, weight: "~120 kg", muscle: "Mollets", safety: "Étirement profond (2s) sous charge lourde.", image: imgMollets }
    ]
  },
  2: { type: 'mixed', dayName: "Mardi", focus: "Poussée Supérieure + FATmax", 
       desc: "Ingénierie Neuro-Psychologique. Neutraliser la peur.",
       exercises: [
      { id: '2A', name: "Développé Couché Smith", sets: 4, reps: "6-8", tempo: "3-0-1-0", rest: 180, weight: "64 kg", muscle: "Pectoraux", safety: "Routine psyching-up 15s.", image: imgDCSmith },
      { id: '2B', name: "Chest Press Convergente", sets: 3, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Pectoraux", safety: "Scapulas rétractées.", image: imgChestPress },
      { id: '2C', name: "Shoulder Press", sets: 3, reps: "10-12", tempo: "3-0-1-0", rest: 120, weight: "RIR 2", muscle: "Épaules", safety: "Améliorer le ratio épaule/taille en V.", image: imgShoulderPress },
      { id: '2D', name: "Triceps Pushdown", sets: 4, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Triceps", safety: "Coudes scellés contre les flancs.", image: imgTriceps },
      { id: '2E', name: "Élévations Latérales", sets: 3, reps: "15-20", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", muscle: "Deltoïde moyen", safety: "Saturation sans conflit sous-acromial.", image: imgLateralRaise }
    ],
       cardio: { id: '2F', name: "Vélo Assis (Recline)", duration: "30 min", bpm: "119-129 bpm", focus: "Oxyder les graisses." }
  },
  3: { type: 'cardio', dayName: "Mercredi", focus: "Régénération & FATmax", 
       desc: "Nettoyer les déchets et consommer la graisse viscérale.",
       cardio: { id: '3A', name: "Elliptique ou Marche Inclinée", duration: "45-60 min", bpm: "119-129 bpm", focus: "Tenir une conversation fluide." }
  },
  4: { type: 'mixed', dayName: "Jeudi", focus: "Tirage Supérieur + FATmax", 
       desc: "Épaisseur Dorsale & Ouverture cage thoracique.",
       exercises: [
      { id: '4A', name: "Lat Pulldown (Poulie Haute)", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Grand Dorsal", safety: "Abaisser volontairement les omoplates.", image: imgLatPulldown },
      { id: '4B', name: "Seated Cable Row", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Rhomboïdes", safety: "Pas d'extension lombaire.", image: imgSeatedRow },
      { id: '4C', name: "Pull-over poulie haute", sets: 3, reps: "15", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", muscle: "Grand Dorsal", safety: "Tension continue sur l'arc de cercle.", image: imgPullover },
      { id: '4D', name: "Curl Marteau (Haltères)", sets: 4, reps: "8-10", tempo: "3-0-1-1", rest: 90, weight: "18-20 kg", muscle: "Brachio-radial", safety: "Retenue excentrique de 3s.", image: imgHammerCurl },
      { id: '4E', name: "Curl Biceps Machine", sets: 3, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Biceps", safety: "Isolation terminale (Pump).", image: imgCurlBiceps }
    ],
       cardio: { id: '4F', name: "Marche Inclinée (Tapis)", duration: "30 min", bpm: "119-129 bpm", focus: "Aucun impact." }
  },
  5: { type: 'cardio', dayName: "Vendredi", focus: "Lavage Métabolique Prolongé", 
       desc: "Capitaliser sur l'état de sensibilité à l'insuline.",
       cardio: { id: '5A', name: "Protocole Croisé", duration: "60-75 min", bpm: "119-129 bpm", focus: "20' Vélo + 20' Elliptique + 20' Hand-Bike." }
  },
  6: { type: 'rest', dayName: "Samedi", focus: "Régénération Tissulaire", desc: "La croissance s'opère aujourd'hui." },
  7: { type: 'rest', dayName: "Dimanche", focus: "Repos Absolu", desc: "Restauration totale du système nerveux central." }
};

export default function MecanikApp() {
  const [activeDay, setActiveDay] = useState(1);
  const [restTime, setRestTime] = useState(0);
  
  // Chargement de l'historique depuis le localStorage
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('mecanik_history');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('mecanik_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    let interval = null;
    if (restTime > 0) interval = setInterval(() => setRestTime((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [restTime]);

  // Fonction pour enregistrer le poids
  const logPerformance = (exoId, weight) => {
    if (!weight) return;
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    setHistory(prev => {
      const exoHistory = prev[exoId] || [];
      const filteredHistory = exoHistory.filter(h => h.date !== date);
      return {
        ...prev,
        [exoId]: [...filteredHistory, { date, weight: parseFloat(weight) }].slice(-10)
      };
    });
  };

  const currentDay = programData[activeDay];

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-[#000000] text-white font-sans relative shadow-2xl overflow-hidden selection:bg-[#0A84FF]/30">
      <header className="px-5 pt-10 pb-4 bg-[#000000]/80 backdrop-blur-xl z-40 border-b border-[#1C1C1E] flex-shrink-0">
        <h1 className="text-2xl font-black tracking-tight uppercase mb-4 text-white">MÉCANIK</h1>
        <div className="flex justify-between items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {Object.keys(programData).map((key) => {
            const dayNum = parseInt(key);
            const isActive = activeDay === dayNum;
            const labels = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
            return (
              <button 
                key={dayNum} onClick={() => setActiveDay(dayNum)}
                className={`flex-shrink-0 w-[42px] h-[42px] rounded-full font-bold text-xs flex items-center justify-center transition-colors
                  ${isActive ? 'bg-[#0A84FF] text-white' : 'bg-[#1C1C1E] text-[#8E8E93]'}`}
              >
                {labels[dayNum - 1]}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">
        <div className="mb-4 pl-1">
          <h2 className="text-[26px] font-black leading-tight text-white">{currentDay.focus}</h2>
          <p className="text-[#8E8E93] text-[13px] leading-snug mt-1">{currentDay.desc}</p>
        </div>

        {(currentDay.type === 'lift' || currentDay.type === 'mixed') && currentDay.exercises.map((exo) => (
          <ExerciseCard 
            key={exo.id} 
            data={exo} 
            onStartRest={() => setRestTime(exo.rest)} 
            history={history[exo.id] || []}
            onLogWeight={(w) => logPerformance(exo.id, w)}
          />
        ))}

        {(currentDay.type === 'cardio' || currentDay.type === 'mixed') && (
          <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />
        )}

        {currentDay.type === 'rest' && <RestCard data={currentDay} />}
      </main>

      {restTime > 0 && (
        <div className="absolute inset-0 z-50 bg-[#000000]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
          <button onClick={() => setRestTime(0)} className="absolute top-10 right-6 p-2 bg-[#1C1C1E] rounded-full text-[#8E8E93]"><X size={24}/></button>
          <Timer size={48} className="text-[#0A84FF] mb-6" strokeWidth={1.5} />
          <span className="font-mono text-7xl font-black tracking-tighter text-white tabular-nums">
            {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ data, onStartRest, history, onLogWeight }) {
  const [completedSets, setCompletedSets] = useState([]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [showChart, setShowChart] = useState(false);
  
  const toggleSet = (idx) => {
    const isNowCompleted = !completedSets.includes(idx);
    setCompletedSets(prev => isNowCompleted ? [...prev, idx] : prev.filter(i => i !== idx));
    
    // Enregistrement auto lors de la validation d'une série
    if (isNowCompleted && currentWeight) {
      onLogWeight(currentWeight);
    }
  };

  return (
    <article className="bg-[#151517] rounded-[24px] border border-[#222225] overflow-hidden flex flex-col shadow-lg">
      <div className="p-4 flex justify-between items-start gap-2">
        <div>
          <span className="text-[#0A84FF] text-[11px] font-black uppercase tracking-wider mb-0.5 block">Séquence {data.id}</span>
          <h3 className="text-[18px] font-bold text-white leading-tight">{data.name}</h3>
        </div>
        <button 
          onClick={() => setShowChart(!showChart)} 
          className={`p-2 rounded-lg transition-colors ${showChart ? 'bg-[#0A84FF] text-white' : 'bg-[#222225] text-[#8E8E93]'}`}
        >
          <TrendingUp size={18} />
        </button>
      </div>

      {/* Graphique d'évolution */}
      {showChart && history.length > 0 ? (
        <div className="px-4 h-32 mb-4 animate-in slide-in-from-top duration-300">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={{ backgroundColor: '#1C1C1E', borderRadius: '12px', border: 'none', fontSize: '12px' }} itemStyle={{ color: '#0A84FF' }} />
              <Line type="monotone" dataKey="weight" stroke="#0A84FF" strokeWidth={3} dot={{ fill: '#0A84FF', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : showChart && <p className="text-center text-[10px] text-zinc-500 mb-4">Aucune donnée pour le graphique</p>}

      <div className="mx-4 mb-3 h-48 bg-[#0C0C0E] rounded-xl flex items-center justify-center border border-[#1C1C1E] overflow-hidden relative">
        {data.image ? (
          <img src={data.image} alt={data.name} className="w-full h-full object-contain" />
        ) : (
          <Activity size={28} className="text-[#2C2C2E]" />
        )}
      </div>

      <div className="bg-[#0C0C0E] p-4 border-t border-[#222225] space-y-3">
        {/* Champ Kilos simplifié */}
        <div className="flex items-center gap-3 bg-[#151517] p-3 rounded-xl border border-[#1C1C1E]">
          <span className="text-[10px] text-[#636366] uppercase font-black">Kilos</span>
          <input 
            type="number" 
            value={currentWeight}
            onChange={(e) => setCurrentWeight(e.target.value)}
            placeholder="Poids utilisé..." 
            className="flex-1 bg-transparent text-sm text-white outline-none font-bold placeholder:text-zinc-700"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[...Array(data.sets)].map((_, i) => (
              <button 
                key={i} onClick={() => toggleSet(i)} 
                className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${completedSets.includes(i) ? 'bg-[#34C759] text-[#000000]' : 'bg-[#222225] text-[#8E8E93]'}`}
              >
                {completedSets.includes(i) ? <Check size={18} strokeWidth={4} /> : i + 1}
              </button>
            ))}
          </div>
          <button 
            onClick={onStartRest} 
            className="bg-[#0A84FF] text-white w-[42px] h-[42px] rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <Play size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    </article>
  );
}

// Composants Cardio et Rest inchangés
function CardioCard({ data, isFinisher }) {
  return (
    <article className="bg-[#1A1111] rounded-[24px] border border-[#3A1D1D] p-4 relative overflow-hidden">
      <div className="relative z-10">
        <span className="text-[#FF453A] text-[11px] font-black uppercase mb-0.5 block">{isFinisher ? `Finisher` : 'Séance Exclusive'}</span>
        <h3 className="text-[18px] font-bold text-white mb-4">{data.name}</h3>
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-[#000000]/60 rounded-xl p-3 flex flex-col items-center"><span className="text-[9px] text-[#8E8E93] font-bold uppercase">Durée</span><span className="font-bold text-white text-base">{data.duration}</span></div>
          <div className="flex-1 bg-[#FF453A]/10 rounded-xl p-3 flex flex-col items-center"><span className="text-[9px] text-[#FF453A] font-bold uppercase">Cible FC</span><span className="font-bold font-mono text-[#FF453A] text-base">{data.bpm}</span></div>
        </div>
        <p className="text-[12px] text-[#D1D1D6] leading-snug">{data.focus}</p>
      </div>
    </article>
  );
}

function RestCard({ data }) {
  return (
    <article className="bg-[#151517] rounded-[24px] border border-[#222225] p-6 text-center mt-10 shadow-lg">
      <div className="w-16 h-16 bg-[#0A84FF]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#0A84FF]/20"><BedDouble size={28} className="text-[#0A84FF]" /></div>
      <h3 className="text-xl font-bold text-white mb-2 text-center">Régénération Active</h3>
      <p className="text-[13px] text-[#8E8E93] leading-relaxed mb-6 text-center">{data.desc}</p>
    </article>
  );
}