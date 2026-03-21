import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Flame, Plus, Beef, Wheat, Droplet, 
  Coffee, Utensils, Moon, Cookie, Activity, X
} from 'lucide-react';

// --- CONFIGURATION DES OBJECTIFS (Modifiables plus tard) ---
const GOALS = {
  calories: 2600,
  carbs: 300,
  protein: 160,
  fat: 80,
  water: 2000 // en ml
};

// ==========================================
// COMPOSANTS VISUELS (Jauges)
// ==========================================
const CircularGauge = ({ value, max, color, size = 64, strokeWidth = 6, icon: Icon, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(value / max, 1);
  const strokeDashoffset = circumference - percent * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 absolute">
        <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-zinc-900" />
        <circle 
          cx={size/2} cy={size/2} r={radius} 
          stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
          className="transition-all duration-1000 ease-out" 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        {Icon && <Icon size={size * 0.3} color={color} />}
      </div>
      {label && <span className="absolute -bottom-6 text-[9px] font-black uppercase text-zinc-500 tracking-widest">{label}</span>}
    </div>
  );
};

// ==========================================
// COMPOSANT PRINCIPAL NUTRITION
// ==========================================
export default function Nutrition({ onBack }) {
  // 1. Initialisation de l'état avec le LocalStorage
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('mecanik_nutrition_data');
    return saved ? JSON.parse(saved) : {
      meals: {
        breakfast: { cals: 0, carbs: 0, prot: 0, fat: 0 },
        lunch: { cals: 0, carbs: 0, prot: 0, fat: 0 },
        dinner: { cals: 0, carbs: 0, prot: 0, fat: 0 },
        snacks: { cals: 0, carbs: 0, prot: 0, fat: 0 }
      },
      activity: 0,
      water: 0
    };
  });

  // Gestion du Modal d'ajout
  const [activeModal, setActiveModal] = useState(null); // 'breakfast', 'lunch', 'activity', etc.
  const [inputData, setInputData] = useState({ cals: "", carbs: "", prot: "", fat: "" });

  // 2. Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem('mecanik_nutrition_data', JSON.stringify(data));
  }, [data]);

  // 3. Calculs Dynamiques
  const totalConsumed = Object.values(data.meals).reduce((acc, meal) => acc + meal.cals, 0);
  const totalCarbs = Object.values(data.meals).reduce((acc, meal) => acc + meal.carbs, 0);
  const totalProt = Object.values(data.meals).reduce((acc, meal) => acc + meal.prot, 0);
  const totalFat = Object.values(data.meals).reduce((acc, meal) => acc + meal.fat, 0);
  
  // Mathématique : Restantes = Objectif - Consommé + Brûlé
  const remainingCals = GOALS.calories - totalConsumed + data.activity;

  // 4. Actions
  const handleAddWater = () => {
    setData(prev => ({ ...prev, water: Math.min(prev.water + 250, GOALS.water + 1000) }));
  };

  const handleRemoveWater = () => {
    setData(prev => ({ ...prev, water: Math.max(prev.water - 250, 0) }));
  };

  const saveModalData = () => {
    if (activeModal === 'activity') {
      setData(prev => ({ ...prev, activity: prev.activity + Number(inputData.cals || 0) }));
    } else {
      setData(prev => ({
        ...prev,
        meals: {
          ...prev.meals,
          [activeModal]: {
            cals: prev.meals[activeModal].cals + Number(inputData.cals || 0),
            carbs: prev.meals[activeModal].carbs + Number(inputData.carbs || 0),
            prot: prev.meals[activeModal].prot + Number(inputData.prot || 0),
            fat: prev.meals[activeModal].fat + Number(inputData.fat || 0),
          }
        }
      }));
    }
    setActiveModal(null);
    setInputData({ cals: "", carbs: "", prot: "", fat: "" });
  };

  // Rendu de l'interface
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      
      {/* HEADER GLOBALE */}
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95 border border-zinc-800 transition-transform">
            <ChevronLeft size={18}/>
          </button>
          <h1 className="text-xl font-black tracking-tight uppercase">Nutrition</h1>
          <div className="w-10 h-10"></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-32 space-y-8">
        
        {/* 1. TABLEAU DE BORD PRINCIPAL (HEADER) */}
        <section className="bg-[#151517] rounded-[32px] p-6 border border-[#222225] shadow-2xl">
          
          {/* Ligne 1 : Jauge Consommé | Restantes | Jauge Brûlé */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col items-center gap-2">
              <CircularGauge value={totalConsumed} max={GOALS.calories} color="#3B82F6" icon={Utensils} size={60} />
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest mt-2">{totalConsumed} kcal</span>
              <span className="text-[9px] text-zinc-500 uppercase">Consommé</span>
            </div>

            <div className="flex flex-col items-center justify-center relative mt-[-10px]">
              <span className="text-5xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">{remainingCals}</span>
              <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Kcal Restantes</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <CircularGauge value={data.activity} max={1000} color="#EF4444" icon={Flame} size={60} />
              <span className="text-[10px] font-black uppercase text-red-500 tracking-widest mt-2">{data.activity} kcal</span>
              <span className="text-[9px] text-zinc-500 uppercase">Brûlées</span>
            </div>
          </div>

          {/* Ligne 2 : Jauges Horizontales Macros */}
          <div className="grid grid-cols-3 gap-3 border-t border-zinc-800 pt-6">
            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Glucides</span>
               <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${Math.min((totalCarbs/GOALS.carbs)*100, 100)}%` }}/></div>
               <span className="text-xs font-bold">{totalCarbs} <span className="text-[9px] text-zinc-500">/ {GOALS.carbs}g</span></span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Protéines</span>
               <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min((totalProt/GOALS.protein)*100, 100)}%` }}/></div>
               <span className="text-xs font-bold">{totalProt} <span className="text-[9px] text-zinc-500">/ {GOALS.protein}g</span></span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Lipides</span>
               <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${Math.min((totalFat/GOALS.fat)*100, 100)}%` }}/></div>
               <span className="text-xs font-bold">{totalFat} <span className="text-[9px] text-zinc-500">/ {GOALS.fat}g</span></span>
            </div>
          </div>
        </section>

        {/* 2. JOURNAL ALIMENTAIRE (REPAS) */}
        <section>
          <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-widest mb-3 pl-2">Journal Alimentaire</h3>
          <div className="space-y-3">
            {[
              { id: 'breakfast', name: 'Petit-déjeuner', icon: Coffee },
              { id: 'lunch', name: 'Déjeuner', icon: Utensils },
              { id: 'dinner', name: 'Dîner', icon: Moon },
              { id: 'snacks', name: 'Snacks', icon: Cookie }
            ].map(meal => (
              <div key={meal.id} onClick={() => setActiveModal(meal.id)} className="bg-[#151517] border border-[#222225] rounded-[24px] p-4 flex items-center justify-between active:scale-95 transition-transform cursor-pointer shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800"><meal.icon size={20} className="text-zinc-400"/></div>
                  <div>
                    <p className="font-bold text-sm text-white">{meal.name}</p>
                    <p className="text-[11px] font-mono text-blue-500 font-bold mt-0.5">{data.meals[meal.id].cals} Kcal</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-500"><Plus size={16}/></div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. JOURNAL D'ACTIVITÉ */}
        <section>
          <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-widest mb-3 pl-2">Activité Physique</h3>
          <div onClick={() => setActiveModal('activity')} className="bg-[#151517] border border-red-900/30 rounded-[24px] p-4 flex items-center justify-between active:scale-95 transition-transform cursor-pointer shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-5"><Activity size={80}/></div>
             <div className="flex items-center gap-4 relative z-10">
               <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/20"><Flame size={20} className="text-red-500"/></div>
               <div>
                 <p className="font-bold text-sm text-white">Ajouter un exercice</p>
                 <p className="text-[11px] font-mono text-red-500 font-bold mt-0.5">{data.activity} Kcal Brûlées</p>
               </div>
             </div>
             <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center text-red-500 relative z-10"><Plus size={16}/></div>
          </div>
        </section>

        {/* 4. SUIVI D'HYDRATATION */}
        <section className="bg-[#151517] border border-[#222225] rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 opacity-5"><Droplet size={150}/></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
             <div>
               <h3 className="font-bold text-lg text-white mb-1">Suivi de l'eau</h3>
               <p className="text-[11px] font-black text-cyan-500 uppercase tracking-widest">{data.water} / {GOALS.water} ml</p>
             </div>
             {data.water > 0 && (
               <button onClick={handleRemoveWater} className="text-[10px] text-zinc-500 font-bold uppercase underline">Annuler</button>
             )}
          </div>
          
          <div className="flex justify-between items-center relative z-10 gap-1">
             {[...Array(8)].map((_, i) => {
               const isFilled = data.water >= (i + 1) * 250;
               return (
                 <button key={i} onClick={handleAddWater} className="active:scale-90 transition-transform p-1">
                   <Droplet size={28} fill={isFilled ? "#06B6D4" : "transparent"} stroke={isFilled ? "#06B6D4" : "#3f3f46"} strokeWidth={1.5} className="transition-colors duration-300"/>
                 </button>
               );
             })}
          </div>
          <p className="text-[9px] text-zinc-500 text-center mt-4 font-bold uppercase tracking-widest">1 Goutte = 250ml</p>
        </section>

      </main>

      {/* MODAL D'AJOUT RAPIDE (CALORIES / MACROS) */}
      <AnimatePresence>
        {activeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-end p-4 pb-12">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-[#151517] border border-zinc-800 rounded-[32px] p-6 shadow-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg uppercase tracking-tight">
                  {activeModal === 'activity' ? "Calories Brûlées" : "Ajouter un Repas"}
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-2 bg-zinc-900 rounded-full active:scale-90"><X size={18}/></button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-black p-4 rounded-2xl border border-zinc-800">
                  <Flame size={20} className={activeModal === 'activity' ? "text-red-500" : "text-zinc-500"}/>
                  <input type="number" placeholder="Kcal totales" value={inputData.cals} onChange={e => setInputData({...inputData, cals: e.target.value})} className="bg-transparent font-black text-xl outline-none w-full text-white placeholder:text-zinc-700" autoFocus />
                </div>

                {activeModal !== 'activity' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col bg-black p-3 rounded-2xl border border-zinc-800">
                      <span className="text-[9px] font-black uppercase text-yellow-500 tracking-widest mb-1">Glucides (g)</span>
                      <input type="number" placeholder="0" value={inputData.carbs} onChange={e => setInputData({...inputData, carbs: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" />
                    </div>
                    <div className="flex flex-col bg-black p-3 rounded-2xl border border-zinc-800">
                      <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-1">Protéines (g)</span>
                      <input type="number" placeholder="0" value={inputData.prot} onChange={e => setInputData({...inputData, prot: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" />
                    </div>
                    <div className="flex flex-col bg-black p-3 rounded-2xl border border-zinc-800">
                      <span className="text-[9px] font-black uppercase text-red-500 tracking-widest mb-1">Lipides (g)</span>
                      <input type="number" placeholder="0" value={inputData.fat} onChange={e => setInputData({...inputData, fat: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" />
                    </div>
                  </div>
                )}

                <button onClick={saveModalData} className="w-full py-4 mt-4 bg-blue-600 rounded-2xl font-black uppercase text-xs active:scale-95 transition-transform shadow-lg shadow-blue-900/30">
                  Valider
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}