import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Flame, Plus, Beef, Wheat, Droplet, Coffee } from 'lucide-react';

export default function Nutrition({ onBack }) {
  // Valeurs simulées (en attendant la vraie logique de calcul)
  const [caloriesGoal] = useState(2600);
  const [caloriesConsumed] = useState(1450);

  const macros = {
    carbs: { name: "Glucides", total: 300, consumed: 150, color: "#F59E0B", icon: Wheat },
    protein: { name: "Protéines", total: 160, consumed: 110, color: "#3B82F6", icon: Beef },
    fat: { name: "Lipides", total: 80, consumed: 45, color: "#EF4444", icon: Droplet }
  };

  // Calcul pour la jauge SVG circulaire
  const percentage = Math.min((caloriesConsumed / caloriesGoal) * 100, 100);
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden"
    >
      {/* HEADER */}
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <button onClick={onBack} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95 border border-zinc-800 transition-transform">
            <ChevronLeft size={16}/>
          </button>
          <h1 className="text-xl font-black tracking-tight uppercase">Nutrition</h1>
          <div className="w-10 h-10"></div> {/* Spacer pour centrer le titre */}
        </div>
      </header>

      {/* CONTENU */}
      <main className="flex-1 overflow-y-auto px-5 pt-8 pb-24 space-y-10">
        
        {/* JAUGE CIRCULAIRE (Style Lifesum) */}
        <div className="flex justify-center items-center relative">
          <svg className="w-56 h-56 transform -rotate-90">
            <circle cx="112" cy="112" r={radius} stroke="currentColor" strokeWidth="14" fill="transparent" className="text-zinc-900" />
            <circle 
              cx="112" cy="112" r={radius} 
              stroke="#10B981" strokeWidth="14" fill="transparent" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
              className="transition-all duration-1000 ease-out" 
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <Flame size={28} className="text-[#10B981] mb-1" />
            <span className="text-4xl font-black tracking-tighter">{caloriesGoal - caloriesConsumed}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Kcal Restantes</span>
          </div>
        </div>

        {/* MACRONUTRIMENTS */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(macros).map(([key, macro]) => {
            const Icon = macro.icon;
            const macroPercent = (macro.consumed / macro.total) * 100;
            return (
              <div key={key} className="bg-[#151517] border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full bg-zinc-900 h-1">
                  <div className="h-full transition-all duration-1000" style={{ width: `${macroPercent}%`, backgroundColor: macro.color }} />
                </div>
                <Icon size={20} color={macro.color} className="mb-2" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{macro.name}</span>
                <span className="font-black text-sm">{macro.consumed} <span className="text-zinc-500 text-[10px]">/ {macro.total}g</span></span>
              </div>
            );
          })}
        </div>

        {/* SECTION REPAS (Placeholder) */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-zinc-400">Repas d'aujourd'hui</h3>
            <button className="p-2 bg-green-600/20 text-green-500 rounded-full active:scale-95"><Plus size={16}/></button>
          </div>
          
          <div className="space-y-3">
            <div className="bg-[#151517] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center"><Coffee size={16} className="text-zinc-500"/></div>
                <div><p className="font-bold text-sm">Petit-déjeuner</p><p className="text-[10px] text-zinc-500 uppercase tracking-widest">450 Kcal</p></div>
              </div>
              <Plus size={16} className="text-zinc-600"/>
            </div>
            
            <div className="bg-[#151517] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center"><Utensils size={16} className="text-zinc-500"/></div>
                <div><p className="font-bold text-sm">Déjeuner</p><p className="text-[10px] text-zinc-500 uppercase tracking-widest">Ajouter</p></div>
              </div>
              <Plus size={16} className="text-zinc-600"/>
            </div>
          </div>
        </div>

      </main>
    </motion.div>
  );
}