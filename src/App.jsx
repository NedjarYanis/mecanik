import React, { useState, useEffect } from 'react';
import { Play, Timer, Check, ShieldAlert, Target, Dumbbell, HeartPulse, BedDouble, Info, Activity, Calculator, X } from 'lucide-react';

// ==========================================
// 1. BASE DE DONNÉES CLINIQUE (100% COMPLÈTE)
// ==========================================
const programData = {
  1: { type: 'lift', dayName: "Lundi", focus: "Membres Inférieurs", 
       desc: "Surstimulation Métabolique Globale. Vider le glycogène.",
       exercises: [
      { id: 'A', name: "Presse à Cuisses (45°)", sets: 4, reps: "12-15", tempo: "3-0-1-1", rest: 180, weight: "175 kg", 
        muscle: "Quadriceps (70% 1RM)", safety: "Profondeur max SANS rétroversion du bassin. Pieds mi-plateau." },
      { id: 'B', name: "Hack Squat Machine", sets: 3, reps: "10-12", tempo: "3-1-1-0", rest: 150, weight: "~130 kg", 
        muscle: "Quadriceps (Recrutement pur)", safety: "Pause d'1s en bas. Annule le réflexe myotatique élastique." },
      { id: 'C', name: "Leg Extension (Assis)", sets: 4, reps: "15-20", tempo: "2-0-1-2", rest: 90, weight: "RIR 1-2", 
        muscle: "Droit fémoral", safety: "Contraction isométrique 2s en haut. Créer l'ischémie locale." },
      { id: 'D', name: "Machine à Adducteurs", sets: 3, reps: "15-20", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", 
        muscle: "Plancher pelvien", safety: "Stabilisation du grand trochanter. Amplitude complète." },
      { id: 'E', name: "Extension Mollets", sets: 4, reps: "12-15", tempo: "3-2-1-2", rest: 90, weight: "~120 kg", 
        muscle: "Mollets (Force latente)", safety: "Sur presse. Étirement profond (2s) sous charge lourde." }
    ]
  },
  2: { type: 'mixed', dayName: "Mardi", focus: "Poussée Supérieure + FATmax", 
       desc: "Ingénierie Neuro-Psychologique. Neutraliser la peur.",
       exercises: [
      { id: 'A', name: "Développé Couché Smith", sets: 4, reps: "6-8", tempo: "3-0-1-0", rest: 180, weight: "64 kg", 
        muscle: "Pectoraux (80% 1RM)", safety: "Routine psyching-up 15s. L'axe guidé supprime l'inhibition." },
      { id: 'B', name: "Chest Press Convergente", sets: 3, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", 
        muscle: "Pectoraux (Machine Aura)", safety: "Scapulas rétractées. L'arc convergent isole le muscle." },
      { id: 'C', name: "Shoulder Press", sets: 3, reps: "10-12", tempo: "3-0-1-0", rest: 120, weight: "RIR 2", 
        muscle: "Épaules (Ant/Lat)", safety: "Développer la carrure pour améliorer le ratio épaule/taille en V." },
      { id: 'D', name: "Triceps Pushdown", sets: 4, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", 
        muscle: "Triceps (Corde)", safety: "Poulie haute. Coudes scellés contre les flancs pour bloquer le dos." },
      { id: 'E', name: "Élévations Latérales", sets: 3, reps: "15-20", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", 
        muscle: "Deltoïde moyen", safety: "Mouvement continu sans élan. Saturation sans conflit sous-acromial." }
    ],
       cardio: { id: 'F', name: "Vélo Assis (Recline)", duration: "30 min", bpm: "119-129 bpm", focus: "Exécuter immédiatement après la séance. Maintenir la FC strictement dans le couloir pour oxyder les graisses." }
  },
  3: { type: 'cardio', dayName: "Mercredi", focus: "Régénération & FATmax", 
       desc: "Nettoyer les déchets et consommer la graisse viscérale.",
       cardio: { id: 'A', name: "Elliptique ou Marche Inclinée", duration: "45-60 min", bpm: "119-129 bpm", focus: "Ne JAMAIS courir. Interdiction de dépasser 130 bpm. Le sujet doit pouvoir tenir une conversation fluide." }
  },
  4: { type: 'mixed', dayName: "Jeudi", focus: "Tirage Supérieur + FATmax", 
       desc: "Épaisseur Dorsale & Ouverture cage thoracique.",
       exercises: [
      { id: 'A', name: "Lat Pulldown (Poulie Haute)", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", 
        muscle: "Grand Dorsal", safety: "Prise > épaules. Tirer vers la poitrine en abaissant volontairement les omoplates." },
      { id: 'B', name: "Seated Cable Row", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", 
        muscle: "Rhomboïdes, Trapèzes", safety: "Prise triangle. Fixer le buste pour éviter de compenser avec l'extension lombaire." },
      { id: 'C', name: "Pull-over poulie haute", sets: 3, reps: "15", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", 
        muscle: "Grand Dorsal", safety: "Bras tendus (Barre/Corde). Maintenir sous tension continue sur l'arc de cercle." },
      { id: 'D', name: "Curl Marteau (Haltères)", sets: 4, reps: "8-10", tempo: "3-0-1-1", rest: 90, weight: "18-20 kg", 
        muscle: "Brachio-radial", safety: "Retenue excentrique de 3 secondes OBLIGATOIRE. Dévaste les fibres." },
      { id: 'E', name: "Curl Biceps Machine", sets: 3, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", 
        muscle: "Biceps (Chef court)", safety: "Isolation terminale pour saturer la zone en afflux sanguin (Pump)." }
    ],
       cardio: { id: 'F', name: "Marche Inclinée (Tapis)", duration: "30 min", bpm: "119-129 bpm", focus: "Post-séance immédiat. Inclinaison 8% à 12%, vitesse de marche lente. Aucun impact." }
  },
  5: { type: 'cardio', dayName: "Vendredi", focus: "Lavage Métabolique Prolongé", 
       desc: "Capitaliser sur l'état de sensibilité à l'insuline.",
       cardio: { id: 'A', name: "Protocole Croisé", duration: "60-75 min", bpm: "119-129 bpm", focus: "20' Vélo + 20' Elliptique + 20' Hand-Bike. Contrôle impitoyable du moniteur. Distribuer la fatigue périphérique." }
  },
  6: { type: 'rest', dayName: "Samedi", focus: "Régénération Tissulaire", 
       desc: "La croissance s'opère aujourd'hui. L'inflammation locale (DOMS) va se résorber." },
  7: { type: 'rest', dayName: "Dimanche", focus: "Repos Absolu", 
       desc: "Restauration totale du système nerveux central avant le début de la Semaine 2." }
};

// ==========================================
// 2. COMPOSANT PRINCIPAL (FORMAT MOBILE STRICT)
// ==========================================
export default function MecanikApp() {
  const [activeDay, setActiveDay] = useState(1);
  const [restTime, setRestTime] = useState(0);

  // Chronomètre global
  useEffect(() => {
    let interval = null;
    if (restTime > 0) interval = setInterval(() => setRestTime((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [restTime]);

  const currentDay = programData[activeDay];

  return (
    // CONTENEUR ULTRA-OPTIMISÉ : max-w-md centre l'app et garantit l'affichage mobile
    <div className="max-w-md mx-auto h-screen flex flex-col bg-[#000000] text-white font-sans relative shadow-2xl overflow-hidden selection:bg-[#0A84FF]/30">
      
      {/* HEADER FIXE : Navigation Intuitive */}
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
                  ${isActive ? 'bg-[#0A84FF] text-white shadow-[0_0_12px_rgba(10,132,255,0.4)]' : 'bg-[#1C1C1E] text-[#8E8E93]'}`}
              >
                {labels[dayNum - 1]}
              </button>
            );
          })}
        </div>
      </header>

      {/* ZONE SCROLLABLE : Fiches d'exercices */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">
        
        {/* Titre de la séance */}
        <div className="mb-4 pl-1">
          <h2 className="text-[26px] font-black leading-tight text-white">{currentDay.focus}</h2>
          <p className="text-[#8E8E93] text-[13px] leading-snug mt-1">{currentDay.desc}</p>
        </div>

        {/* Rendu Dynamique des Exercices */}
        {(currentDay.type === 'lift' || currentDay.type === 'mixed') && currentDay.exercises.map((exo) => (
          <ExerciseCard key={exo.id} data={exo} onStartRest={() => setRestTime(exo.rest)} />
        ))}

        {/* Rendu Dynamique du Cardio */}
        {(currentDay.type === 'cardio' || currentDay.type === 'mixed') && (
          <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />
        )}

        {/* Rendu Dynamique des Jours de Repos */}
        {currentDay.type === 'rest' && (
          <RestCard data={currentDay} />
        )}
      </main>

      {/* OVERLAY CHRONOMÈTRE (Totalement Immersif) */}
      {restTime > 0 && (
        <div className="absolute inset-0 z-50 bg-[#000000]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
          <button onClick={() => setRestTime(0)} className="absolute top-10 right-6 p-2 bg-[#1C1C1E] rounded-full text-[#8E8E93]"><X size={24}/></button>
          
          <Timer size={48} className="text-[#0A84FF] mb-6" strokeWidth={1.5} />
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#8E8E93] uppercase mb-2">Resynthèse ATP</span>
          
          {/* Tabular-nums pour que les chiffres ne bougent pas horizontalement */}
          <span className="font-mono text-7xl font-black tracking-tighter text-white tabular-nums">
            {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
          </span>
          
          <p className="mt-8 text-[13px] text-[#636366] font-medium text-center border-t border-[#1C1C1E] pt-6 w-full max-w-[200px]">
            Repos incompressible.<br/>Ne limite pas ta force nerveuse.
          </p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. CARTES D'EXERCICES (UI Sans Friction)
// ==========================================

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
      
      {/* 1. Header : Titre & Poids */}
      <div className="p-4 flex justify-between items-start gap-2">
        <div>
          <span className="text-[#0A84FF] text-[11px] font-black uppercase tracking-wider mb-0.5 block">Séquence {data.id}</span>
          <h3 className="text-[18px] font-bold text-white leading-tight">{data.name}</h3>
        </div>
        <div className="bg-[#222225] px-2.5 py-1.5 rounded-lg text-[13px] font-black text-white whitespace-nowrap shadow-inner border border-[#2C2C2E]">
          {data.weight}
        </div>
      </div>

      {/* 2. Grid des Vitales : Chiffres massifs au centre */}
      <div className="mx-4 mb-3 bg-[#000000] rounded-xl grid grid-cols-3 divide-x divide-[#222225] border border-[#222225]">
        <div className="py-2.5 flex flex-col items-center">
          <span className="text-[9px] text-[#8E8E93] uppercase font-bold tracking-wider">Séries</span>
          <span className="text-lg font-black text-white leading-none mt-1">{data.sets}<span className="text-xs text-[#636366] font-bold ml-0.5">x{data.reps}</span></span>
        </div>
        <div className="py-2.5 flex flex-col items-center">
          <span className="text-[9px] text-[#8E8E93] uppercase font-bold tracking-wider">Tempo</span>
          <span className="text-lg font-mono font-bold text-[#0A84FF] leading-none mt-1 tracking-tighter">{data.tempo}</span>
        </div>
        <div className="py-2.5 flex flex-col items-center">
          <span className="text-[9px] text-[#8E8E93] uppercase font-bold tracking-wider">Repos</span>
          <span className="text-lg font-mono font-bold text-white leading-none mt-1">{data.rest}s</span>
        </div>
      </div>

      {/* 3. Placeholder Visuel (Schéma Mouvement) */}
      <div className="mx-4 mb-3 h-28 bg-[#0C0C0E] rounded-xl flex items-center justify-center border border-[#1C1C1E] relative">
        <Activity size={28} className="text-[#1C1C1E]" />
        <span className="absolute bottom-2 right-2 text-[9px] font-bold text-[#2C2C2E] uppercase">Zone SVG</span>
      </div>

      {/* 4. Notes Cliniques (Scannables en 1 seconde) */}
      <div className="px-4 space-y-2 mb-4">
        <div className="flex items-start gap-2.5">
          <Target size={14} className="text-[#0A84FF] mt-0.5 shrink-0" />
          <p className="text-[12px] text-[#D1D1D6] leading-snug"><span className="font-bold text-white">{data.muscle}.</span></p>
        </div>
        <div className="flex items-start gap-2.5">
          <ShieldAlert size={14} className="text-[#FF453A] mt-0.5 shrink-0" />
          <p className="text-[12px] text-[#FF453A] font-medium leading-snug">{data.safety}</p>
        </div>
      </div>

      {/* 5. Panneau de Contrôle : 1RM, Checklists, Chrono */}
      <div className="bg-[#0C0C0E] p-4 border-t border-[#222225] space-y-3">
        
        {/* Ligne A : Calculateur 1RM Compact */}
        <div className="flex items-center gap-2 bg-[#151517] p-1.5 rounded-lg border border-[#1C1C1E]">
          <Calculator size={14} className="text-[#636366] ml-1 shrink-0" />
          <input type="number" placeholder="Kg" className="w-10 bg-transparent text-center font-mono text-xs text-white focus:outline-none" onChange={e => setRmWeight(e.target.value)} />
          <span className="text-[#636366] text-xs">×</span>
          <input type="number" placeholder="Rep" className="w-8 bg-transparent text-center font-mono text-xs text-white focus:outline-none" onChange={e => setRmReps(e.target.value)} />
          <div className="bg-[#222225] px-2 py-1 rounded text-center ml-auto min-w-[3rem]">
             <span className="font-bold text-[#0A84FF] text-xs">{calc1RM() > 0 ? calc1RM() : '1RM'}</span>
          </div>
        </div>

        {/* Ligne B : Checklists tactiles & Bouton Play */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[...Array(data.sets)].map((_, i) => (
              <button 
                key={i} onClick={() => toggleSet(i)} 
                className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${completedSets.includes(i) ? 'bg-[#34C759] text-[#000000] scale-95' : 'bg-[#222225] text-[#8E8E93]'}`}
              >
                {completedSets.includes(i) ? <Check size={18} strokeWidth={4} /> : i + 1}
              </button>
            ))}
          </div>
          
          <button 
            onClick={onStartRest} 
            className="bg-[#0A84FF] text-white w-[42px] h-[42px] rounded-full flex items-center justify-center shadow-[0_2px_15px_rgba(10,132,255,0.4)] active:scale-90 transition-transform"
          >
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

// ==========================================
// COMPOSANTS CARDIO & REPOS
// ==========================================

function CardioCard({ data, isFinisher }) {
  return (
    <article className="bg-[#1A1111] rounded-[24px] border border-[#3A1D1D] p-4 relative overflow-hidden">
      <div className="absolute top-[-10px] right-[-10px] opacity-[0.05]"><HeartPulse size={120} /></div>
      
      <div className="relative z-10">
        <span className="text-[#FF453A] text-[11px] font-black uppercase tracking-wider mb-0.5 block">
          {isFinisher ? `Séquence ${data.id} • Finisher` : 'Séance Exclusive'}
        </span>
        <h3 className="text-[18px] font-bold text-white leading-tight mb-4">{data.name}</h3>
        
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-[#000000]/60 rounded-xl p-3 border border-[#3A1D1D]/50 flex flex-col items-center">
            <span className="text-[9px] uppercase text-[#8E8E93] font-bold mb-1">Durée Prescrite</span>
            <span className="font-bold text-white text-base">{data.duration}</span>
          </div>
          <div className="flex-1 bg-[#FF453A]/10 rounded-xl p-3 border border-[#FF453A]/30 flex flex-col items-center">
            <span className="text-[9px] uppercase text-[#FF453A] font-bold mb-1">Cible Cardiaque</span>
            <span className="font-bold font-mono text-[#FF453A] text-base">{data.bpm}</span>
          </div>
        </div>

        <div className="bg-[#000000]/40 p-3 rounded-lg flex gap-2 items-start border border-[#3A1D1D]">
          <Info size={14} className="text-[#FF453A] shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#D1D1D6] leading-snug">{data.focus}</p>
        </div>
      </div>
    </article>
  );
}

function RestCard({ data }) {
  return (
    <article className="bg-[#151517] rounded-[24px] border border-[#222225] p-6 text-center shadow-lg mt-10">
      <div className="w-16 h-16 bg-[#0A84FF]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#0A84FF]/20">
        <BedDouble size={28} className="text-[#0A84FF]" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Régénération Active</h3>
      <p className="text-[13px] text-[#8E8E93] leading-relaxed mb-6">{data.desc}</p>
      
      <div className="space-y-2">
        <div className="bg-[#0C0C0E] rounded-xl p-3 flex justify-between items-center border border-[#1C1C1E]">
          <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Apport Protéines</span>
          <span className="text-xs font-bold text-[#34C759]">30-40g / Repas</span>
        </div>
        <div className="bg-[#0C0C0E] rounded-xl p-3 flex justify-between items-center border border-[#1C1C1E]">
          <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">Sommeil</span>
          <span className="text-xs font-bold text-[#0A84FF]">Pic HGH Max</span>
        </div>
      </div>
    </article>
  );
}