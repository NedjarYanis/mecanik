import React, { useState, useEffect } from 'react';
import { Play, Timer, Check, ShieldAlert, Target, Dumbbell, HeartPulse, BedDouble, Info, Activity, Calculator, X } from 'lucide-react';

// ==========================================
// 1. IMPORT DES IMAGES DEPUIS ASSETS
// ==========================================
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
// 2. BASE DE DONNÉES CLINIQUE MISE À JOUR
// ==========================================
const programData = {
  1: { type: 'lift', dayName: "Lundi", focus: "Membres Inférieurs", 
       desc: "Surstimulation Métabolique Globale. Vider le glycogène.",
       exercises: [
      { id: 'A', name: "Presse à Cuisses (45°)", sets: 4, reps: "12-15", tempo: "3-0-1-1", rest: 180, weight: "175 kg", muscle: "Quadriceps (70% 1RM)", safety: "Profondeur max SANS rétroversion du bassin. Pieds mi-plateau.", image: imgPresse },
      { id: 'B', name: "Hack Squat Machine", sets: 3, reps: "10-12", tempo: "3-1-1-0", rest: 150, weight: "~130 kg", muscle: "Quadriceps (Recrutement pur)", safety: "Pause d'1s en bas. Annule le réflexe myotatique élastique.", image: imgHackSquat },
      { id: 'C', name: "Leg Extension (Assis)", sets: 4, reps: "15-20", tempo: "2-0-1-2", rest: 90, weight: "RIR 1-2", muscle: "Droit fémoral", safety: "Contraction isométrique 2s en haut. Créer l'ischémie locale.", image: imgLegExtension },
      { id: 'D', name: "Machine à Adducteurs", sets: 3, reps: "15-20", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Plancher pelvien", safety: "Stabilisation du grand trochanter. Amplitude complète.", image: imgAdducteur },
      { id: 'E', name: "Extension Mollets", sets: 4, reps: "12-15", tempo: "3-2-1-2", rest: 90, weight: "~120 kg", muscle: "Mollets (Force latente)", safety: "Sur presse. Étirement profond (2s) sous charge lourde.", image: imgMollets }
    ]
  },
  2: { type: 'mixed', dayName: "Mardi", focus: "Poussée Supérieure + FATmax", 
       desc: "Ingénierie Neuro-Psychologique. Neutraliser la peur.",
       exercises: [
      { id: 'A', name: "Développé Couché Smith", sets: 4, reps: "6-8", tempo: "3-0-1-0", rest: 180, weight: "64 kg", muscle: "Pectoraux (80% 1RM)", safety: "Routine psyching-up 15s. L'axe guidé supprime l'inhibition.", image: imgDCSmith },
      { id: 'B', name: "Chest Press Convergente", sets: 3, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Pectoraux (Machine Aura)", safety: "Scapulas rétractées. L'arc convergent isole le muscle.", image: imgChestPress },
      { id: 'C', name: "Shoulder Press", sets: 3, reps: "10-12", tempo: "3-0-1-0", rest: 120, weight: "RIR 2", muscle: "Épaules (Ant/Lat)", safety: "Développer la carrure pour améliorer le ratio épaule/taille en V.", image: imgShoulderPress },
      { id: 'D', name: "Triceps Pushdown", sets: 4, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Triceps (Corde)", safety: "Poulie haute. Coudes scellés contre les flancs pour bloquer le dos.", image: imgTriceps },
      { id: 'E', name: "Élévations Latérales", sets: 3, reps: "15-20", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", muscle: "Deltoïde moyen", safety: "Mouvement continu sans élan. Saturation sans conflit sous-acromial.", image: imgLateralRaise }
    ],
       cardio: { id: 'F', name: "Vélo Assis (Recline)", duration: "30 min", bpm: "119-129 bpm", focus: "Maintenir la FC strictement dans le couloir FATmax." }
  },
  3: { type: 'cardio', dayName: "Mercredi", focus: "Régénération & FATmax", 
       desc: "Nettoyer les déchets et consommer la graisse viscérale.",
       cardio: { id: 'A', name: "Elliptique ou Marche Inclinée", duration: "45-60 min", bpm: "119-129 bpm", focus: "Ne JAMAIS courir. Tenir une conversation fluide." }
  },
  4: { type: 'mixed', dayName: "Jeudi", focus: "Tirage Supérieur + FATmax", 
       desc: "Épaisseur Dorsale & Ouverture cage thoracique.",
       exercises: [
      { id: 'A', name: "Lat Pulldown (Poulie Haute)", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Grand Dorsal", safety: "Tirer vers la poitrine en abaissant volontairement les omoplates.", image: imgLatPulldown },
      { id: 'B', name: "Seated Cable Row", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Rhomboïdes, Trapèzes", safety: "Prise triangle. Fixer le buste pour éviter de compenser l'extension lombaire.", image: imgSeatedRow },
      { id: 'C', name: "Pull-over poulie haute", sets: 3, reps: "15", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", muscle: "Grand Dorsal", safety: "Bras tendus. Tension continue sur l'arc de cercle.", image: imgPullover },
      { id: 'D', name: "Curl Marteau (Haltères)", sets: 4, reps: "8-10", tempo: "3-0-1-1", rest: 90, weight: "18-20 kg", muscle: "Brachio-radial", safety: "Retenue excentrique de 3 secondes OBLIGATOIRE.", image: imgHammerCurl },
      { id: 'E', name: "Curl Biceps Machine", sets: 3, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Biceps (Chef court)", safety: "Isolation terminale (Pump).", image: imgCurlBiceps }
    ],
       cardio: { id: 'F', name: "Marche Inclinée (Tapis)", duration: "30 min", bpm: "119-129 bpm", focus: "Post-séance immédiat. Aucun impact." }
  },
  5: { type: 'cardio', dayName: "Vendredi", focus: "Lavage Métabolique Prolongé", 
       desc: "Capitaliser sur l'état de sensibilité à l'insuline.",
       cardio: { id: 'A', name: "Protocole Croisé", duration: "60-75 min", bpm: "119-129 bpm", focus: "20' Vélo + 20' Elliptique + 20' Hand-Bike." }
  },
  6: { type: 'rest', dayName: "Samedi", focus: "Régénération Tissulaire", desc: "La croissance s'opère aujourd'hui." },
  7: { type: 'rest', dayName: "Dimanche", focus: "Repos Absolu", desc: "Restauration totale du système nerveux central." }
};

// ==========================================
// 3. COMPOSANTS UI
// ==========================================
export default function MecanikApp() {
  const [activeDay, setActiveDay] = useState(1);
  const [restTime, setRestTime] = useState(0);

  useEffect(() => {
    let interval = null;
    if (restTime > 0) interval = setInterval(() => setRestTime((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [restTime]);

  const currentDay = programData[activeDay];

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-[#000000] text-white font-sans relative shadow-2xl overflow-hidden">
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
          <ExerciseCard key={exo.id} data={exo} onStartRest={() => setRestTime(exo.rest)} />
        ))}

        {(currentDay.type === 'cardio' || currentDay.type === 'mixed') && (
          <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />
        )}

        {currentDay.type === 'rest' && <RestCard data={currentDay} />}
      </main>

      {restTime > 0 && (
        <div className="absolute inset-0 z-50 bg-[#000000]/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
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

function ExerciseCard({ data, onStartRest }) {
  const [completedSets, setCompletedSets] = useState([]);
  const [rmWeight, setRmWeight] = useState('');
  const [rmReps, setRmReps] = useState('');
  
  const toggleSet = (idx) => setCompletedSets(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  const calc1RM = () => {
    const w = parseFloat(rmWeight); const r = parseInt(rmReps);
    if (!w || !r || r > 36) return 0;
    return Math.round(w * (36 / (37 - r)));
  };

  return (
    <article className="bg-[#151517] rounded-[24px] border border-[#222225] overflow-hidden flex flex-col">
      <div className="p-4 flex justify-between items-start gap-2">
        <div>
          <span className="text-[#0A84FF] text-[11px] font-black uppercase tracking-wider mb-0.5 block">Séquence {data.id}</span>
          <h3 className="text-[18px] font-bold text-white leading-tight">{data.name}</h3>
        </div>
        <div className="bg-[#222225] px-2.5 py-1.5 rounded-lg text-[13px] font-black text-white">{data.weight}</div>
      </div>

      <div className="mx-4 mb-3 bg-[#000000] rounded-xl grid grid-cols-3 divide-x divide-[#222225] border border-[#222225]">
        <div className="py-2.5 flex flex-col items-center">
          <span className="text-[9px] text-[#8E8E93] uppercase font-bold">Séries</span>
          <span className="text-lg font-black text-white">{data.sets}<span className="text-xs text-[#636366] ml-0.5">x{data.reps}</span></span>
        </div>
        <div className="py-2.5 flex flex-col items-center">
          <span className="text-[9px] text-[#8E8E93] uppercase font-bold">Tempo</span>
          <span className="text-lg font-mono font-bold text-[#0A84FF]">{data.tempo}</span>
        </div>
        <div className="py-2.5 flex flex-col items-center">
          <span className="text-[9px] text-[#8E8E93] uppercase font-bold">Repos</span>
          <span className="text-lg font-mono font-bold text-white">{data.rest}s</span>
        </div>
      </div>

      {/* ZONE D'IMAGE MISE À JOUR */}
      <div className="mx-4 mb-3 h-48 bg-[#0C0C0E] rounded-xl flex items-center justify-center border border-[#1C1C1E] overflow-hidden">
        {data.image ? (
          <img src={data.image} alt={data.name} className="w-full h-full object-contain" />
        ) : (
          <Activity size={28} className="text-[#2C2C2E]" />
        )}
      </div>

      <div className="px-4 space-y-2 mb-4">
        <div className="flex items-start gap-2.5"><Target size={14} className="text-[#0A84FF] mt-0.5 shrink-0" /><p className="text-[12px] text-[#D1D1D6] leading-snug"><strong>{data.muscle}</strong></p></div>
        <div className="flex items-start gap-2.5"><ShieldAlert size={14} className="text-[#FF453A] mt-0.5 shrink-0" /><p className="text-[12px] text-[#FF453A] font-medium leading-snug">{data.safety}</p></div>
      </div>

      <div className="bg-[#0C0C0E] p-4 border-t border-[#222225] space-y-3">
        <div className="flex items-center gap-2 bg-[#151517] p-1.5 rounded-lg border border-[#1C1C1E]">
          <Calculator size={14} className="text-[#636366] ml-1 shrink-0" /><input type="number" placeholder="Kg" className="w-10 bg-transparent text-center text-xs text-white outline-none" onChange={e => setRmWeight(e.target.value)} /><span className="text-[#636366] text-xs">×</span><input type="number" placeholder="Rep" className="w-8 bg-transparent text-center text-xs text-white outline-none" onChange={e => setRmReps(e.target.value)} /><div className="bg-[#222225] px-2 py-1 rounded ml-auto min-w-[3rem] text-center"><span className="font-bold text-[#0A84FF] text-xs">{calc1RM() > 0 ? calc1RM() : '1RM'}</span></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[...Array(data.sets)].map((_, i) => (
              <button key={i} onClick={() => toggleSet(i)} className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold transition-all ${completedSets.includes(i) ? 'bg-[#34C759] text-[#000000]' : 'bg-[#222225] text-[#8E8E93]'}`}>{completedSets.includes(i) ? <Check size={18} strokeWidth={4} /> : i + 1}</button>
            ))}
          </div>
          <button onClick={onStartRest} className="bg-[#0A84FF] text-white w-[42px] h-[42px] rounded-full flex items-center justify-center active:scale-90 transition-transform"><Play size={18} fill="currentColor" /></button>
        </div>
      </div>
    </article>
  );
}

function CardioCard({ data, isFinisher }) {
  return (
    <article className="bg-[#1A1111] rounded-[24px] border border-[#3A1D1D] p-4 relative overflow-hidden">
      <div className="relative z-10">
        <span className="text-[#FF453A] text-[11px] font-black uppercase tracking-wider mb-0.5 block">{isFinisher ? `Finisher` : 'Séance Exclusive'}</span>
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
    <article className="bg-[#151517] rounded-[24px] border border-[#222225] p-6 text-center mt-10">
      <div className="w-16 h-16 bg-[#0A84FF]/10 rounded-full flex items-center justify-center mx-auto mb-4"><BedDouble size={28} className="text-[#0A84FF]" /></div>
      <h3 className="text-xl font-bold text-white mb-2">Régénération Active</h3>
      <p className="text-[13px] text-[#8E8E93] leading-relaxed mb-6">{data.desc}</p>
    </article>
  );
}