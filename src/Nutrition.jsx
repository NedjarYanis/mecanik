import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Flame, Plus, Beef, Wheat, Droplet, 
  Coffee, Utensils, Moon, Cookie, Activity, X, 
  Search, CheckCircle2, Globe, DatabaseZap
} from 'lucide-react';

// --- CONFIGURATION DES OBJECTIFS ---
const GOALS = { calories: 2600, carbs: 300, protein: 160, fat: 80, water: 2000 };

// --- BASE DE DONNÉES GLOBALE (Simulée "Cloud") ---
const INITIAL_GLOBAL_DB = [
  { id: '1', name: 'Flocons d\'avoine', cals: 389, prot: 16.9, carbs: 66.3, fat: 6.9, verified: true },
  { id: '2', name: 'Poulet (Blanc)', cals: 165, prot: 31, carbs: 0, fat: 3.6, verified: true },
  { id: '3', name: 'Riz Basmati (Cuit)', cals: 130, prot: 2.7, carbs: 28, fat: 0.3, verified: true },
  { id: '4', name: 'Oeuf entier', cals: 155, prot: 13, carbs: 1.1, fat: 11, verified: true },
  { id: '5', name: 'Amandes', cals: 579, prot: 21, carbs: 22, fat: 50, verified: false },
  { id: '6', name: 'Pâtes (Crues)', cals: 350, prot: 12, carbs: 72, fat: 1.5, verified: true },
  { id: '7', name: 'Whey Protein', cals: 115, prot: 24, carbs: 2, fat: 1.5, verified: true }
];

// ==========================================
// COMPOSANTS VISUELS (Jauges)
// ==========================================
const CircularGauge = ({ value, max, color, size = 64, strokeWidth = 6, icon: Icon }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(value / max, 1);
  const strokeDashoffset = circumference - percent * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 absolute">
        <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-zinc-900" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">{Icon && <Icon size={size * 0.3} color={color} />}</div>
    </div>
  );
};

// ==========================================
// COMPOSANT PRINCIPAL NUTRITION
// ==========================================
export default function Nutrition({ onBack }) {
  // 1. ÉTATS : Base de Données Globale (Communauté)
  const [globalDB, setGlobalFoodDB] = useState(() => {
    const savedDB = localStorage.getItem('mecanik_global_food_db');
    return savedDB ? JSON.parse(savedDB) : INITIAL_GLOBAL_DB;
  });

  useEffect(() => { localStorage.setItem('mecanik_global_food_db', JSON.stringify(globalDB)); }, [globalDB]);

  // 2. ÉTATS : Journal Personnel de l'Utilisateur
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('mecanik_nutrition_journal');
    return saved ? JSON.parse(saved) : {
      meals: {
        breakfast: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 },
        lunch: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 },
        dinner: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 },
        snacks: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }
      },
      activity: 0, water: 0
    };
  });

  useEffect(() => { localStorage.setItem('mecanik_nutrition_journal', JSON.stringify(data)); }, [data]);

  // 3. ÉTATS : Modals et Recherche
  const [activeMealModal, setActiveMealModal] = useState(null); 
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFood, setNewFood] = useState({ name: "", cals: "", prot: "", carbs: "", fat: "" });

  // 4. CALCULS GLOBAUX
  const totalConsumed = Object.values(data.meals).reduce((acc, meal) => acc + meal.cals, 0);
  const totalCarbs = Object.values(data.meals).reduce((acc, meal) => acc + meal.carbs, 0);
  const totalProt = Object.values(data.meals).reduce((acc, meal) => acc + meal.prot, 0);
  const totalFat = Object.values(data.meals).reduce((acc, meal) => acc + meal.fat, 0);
  const remainingCals = GOALS.calories - totalConsumed + data.activity;

  // 5. ACTIONS : Contribution (Crowdsourcing)
  const handleContributeFood = () => {
    if (!newFood.name || !newFood.cals) return;
    const foodItem = {
      id: `custom_${Date.now()}`,
      name: newFood.name,
      cals: Number(newFood.cals), prot: Number(newFood.prot || 0),
      carbs: Number(newFood.carbs || 0), fat: Number(newFood.fat || 0),
      verified: false // Tag "Communauté"
    };
    setGlobalFoodDB([foodItem, ...globalDB]);
    setNewFood({ name: "", cals: "", prot: "", carbs: "", fat: "" });
    setShowContributeModal(false);
  };

  // 6. ACTIONS : Ajouter au journal
  const handleAddFoodToMeal = (food) => {
    setData(prev => {
      const meal = prev.meals[activeMealModal];
      return {
        ...prev,
        meals: {
          ...prev.meals,
          [activeMealModal]: {
            items: [...meal.items, food],
            cals: meal.cals + food.cals, carbs: meal.carbs + food.carbs,
            prot: meal.prot + food.prot, fat: meal.fat + food.fat
          }
        }
      };
    });
    setSearchQuery(""); // Reset la barre de recherche après ajout
  };

  const handleAddWater = () => setData(p => ({ ...p, water: Math.min(p.water + 250, GOALS.water + 1000) }));
  const handleRemoveWater = () => setData(p => ({ ...p, water: Math.max(p.water - 250, 0) }));

  // Filtrage intelligent de la barre de recherche
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return globalDB.filter(food => food.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10);
  }, [searchQuery, globalDB]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      
      {/* HEADER */}
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95 border border-zinc-800 transition-transform"><ChevronLeft size={18}/></button>
          <h1 className="text-xl font-black tracking-tight uppercase">Nutrition</h1>
          <button onClick={() => setShowContributeModal(true)} className="p-2.5 bg-blue-600/10 text-blue-500 rounded-full border border-blue-500/20 active:scale-95" title="Base de données communautaire">
            <DatabaseZap size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">
        
        {/* 1. TABLEAU DE BORD PRINCIPAL */}
        <section className="bg-[#151517] rounded-[32px] p-6 border border-[#222225] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col items-center gap-2">
              <CircularGauge value={totalConsumed} max={GOALS.calories} color="#3B82F6" icon={Utensils} size={60} />
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest mt-2">{Math.round(totalConsumed)}</span>
              <span className="text-[9px] text-zinc-500 uppercase font-bold">Consommé</span>
            </div>
            <div className="flex flex-col items-center justify-center relative mt-[-10px]">
              <span className="text-5xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">{Math.round(remainingCals)}</span>
              <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Kcal Restantes</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CircularGauge value={data.activity} max={1000} color="#EF4444" icon={Flame} size={60} />
              <span className="text-[10px] font-black uppercase text-red-500 tracking-widest mt-2">{data.activity}</span>
              <span className="text-[9px] text-zinc-500 uppercase font-bold">Brûlées</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-zinc-800 pt-6">
            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Glucides</span>
               <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${Math.min((totalCarbs/GOALS.carbs)*100, 100)}%` }}/></div>
               <span className="text-xs font-bold">{Math.round(totalCarbs)} <span className="text-[9px] text-zinc-500">/ {GOALS.carbs}g</span></span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Protéines</span>
               <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min((totalProt/GOALS.protein)*100, 100)}%` }}/></div>
               <span className="text-xs font-bold">{Math.round(totalProt)} <span className="text-[9px] text-zinc-500">/ {GOALS.protein}g</span></span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Lipides</span>
               <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${Math.min((totalFat/GOALS.fat)*100, 100)}%` }}/></div>
               <span className="text-xs font-bold">{Math.round(totalFat)} <span className="text-[9px] text-zinc-500">/ {GOALS.fat}g</span></span>
            </div>
          </div>
        </section>

        {/* 2. JOURNAL ALIMENTAIRE (REPAS) */}
        <section>
          <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-widest mb-3 pl-2">Journal Alimentaire</h3>
          <div className="space-y-3">
            {[ { id: 'breakfast', name: 'Petit-déjeuner', icon: Coffee }, { id: 'lunch', name: 'Déjeuner', icon: Utensils }, { id: 'dinner', name: 'Dîner', icon: Moon }, { id: 'snacks', name: 'Snacks', icon: Cookie } ].map(meal => (
              <div key={meal.id} onClick={() => setActiveMealModal(meal.id)} className="bg-[#151517] border border-[#222225] rounded-[24px] p-4 flex flex-col active:scale-95 transition-transform cursor-pointer shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800"><meal.icon size={20} className="text-zinc-400"/></div>
                    <div>
                      <p className="font-bold text-sm text-white">{meal.name}</p>
                      <p className="text-[11px] font-mono text-blue-500 font-bold mt-0.5">{Math.round(data.meals[meal.id].cals)} Kcal</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-500"><Plus size={16}/></div>
                </div>
                {/* Aperçu des aliments ajoutés */}
                {data.meals[meal.id].items.length > 0 && (
                  <p className="text-[10px] text-zinc-500 mt-3 pl-1 truncate">
                    {data.meals[meal.id].items.map(i => i.name).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 3. HYDRATATION */}
        <section className="bg-[#151517] border border-[#222225] rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none"><Droplet size={150}/></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
             <div>
               <h3 className="font-bold text-lg text-white mb-1">Suivi de l'eau</h3>
               <p className="text-[11px] font-black text-cyan-500 uppercase tracking-widest">{data.water} / {GOALS.water} ml</p>
             </div>
             {data.water > 0 && <button onClick={handleRemoveWater} className="text-[10px] text-zinc-500 font-bold uppercase underline">Annuler</button>}
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
        </section>
      </main>
      {/* ==================================================== */}
      {/* MODAL 1 : RECHERCHE INTELLIGENTE DANS UN REPAS         */}
      {/* ==================================================== */}
      <AnimatePresence>
        {activeMealModal && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-black uppercase tracking-tighter">Ajouter : {activeMealModal}</h2>
              <button onClick={() => { setActiveMealModal(null); setSearchQuery(""); }} className="p-2 bg-zinc-800 rounded-full active:scale-90"><X size={20}/></button>
            </div>

            <div className="p-4 flex-1 flex flex-col overflow-hidden">
              {/* Barre de recherche */}
              <div className="flex items-center gap-3 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-6 shrink-0 shadow-inner">
                <Search size={20} className="text-zinc-500" />
                <input type="text" placeholder="Rechercher un aliment..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent text-sm font-bold text-white outline-none w-full placeholder:text-zinc-600" autoFocus />
              </div>

              {/* Résultats de recherche */}
              <div className="flex-1 overflow-y-auto space-y-3 pb-6">
                {searchQuery ? (
                  searchResults.length > 0 ? searchResults.map(food => (
                    <div key={food.id} className="bg-[#151517] p-4 rounded-[20px] border border-zinc-800 flex justify-between items-center shadow-lg">
                      <div className="flex-1 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm text-white truncate">{food.name}</p>
                          {/* Badges de Base de Données */}
                          {food.verified ? (
                            <CheckCircle2 size={14} className="text-blue-500 shrink-0" title="Base Vérifiée" />
                          ) : (
                            <Globe size={14} className="text-orange-500 shrink-0" title="Ajouté par la Communauté" />
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                          {food.cals} Kcal • <span className="text-yellow-500">{food.carbs}g G</span> • <span className="text-blue-500">{food.prot}g P</span> • <span className="text-red-500">{food.fat}g L</span>
                        </p>
                        <p className="text-[9px] text-zinc-600 mt-1 italic">Portion : 100g / 1 unité</p>
                      </div>
                      <button onClick={() => handleAddFoodToMeal(food)} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(10,132,255,0.3)] active:scale-90 transition-transform shrink-0">
                        <Plus size={20} />
                      </button>
                    </div>
                  )) : (
                    <div className="text-center py-10">
                      <Search size={40} className="text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-500 text-sm font-bold">Aucun aliment trouvé.</p>
                      <button onClick={() => { setShowContributeModal(true); setActiveMealModal(null); setSearchQuery(""); }} className="mt-4 px-6 py-3 bg-zinc-900 rounded-full text-xs font-black uppercase text-blue-500 border border-zinc-800">Contribuer à la base</button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10 text-zinc-600 text-xs font-bold uppercase tracking-widest">
                    Tapez pour chercher dans la base globale
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL 2 : CROWDSOURCING (AJOUTER À LA BDD GLOBALE)     */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showContributeModal && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-black uppercase tracking-tighter">Base Communautaire</h2>
              <button onClick={() => setShowContributeModal(false)} className="p-2 bg-zinc-800 rounded-full active:scale-90"><X size={20}/></button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-[20px] flex gap-3 items-start">
                <Globe size={20} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-orange-200 leading-relaxed font-medium">Les aliments que vous ajoutez ici seront synchronisés et disponibles pour <strong>tous les utilisateurs</strong> lors de leurs recherches. Soyez précis ! (Valeurs pour 100g).</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-inner">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Nom de l'aliment</span>
                  <input type="text" placeholder="Ex: Avocat (cru)" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} className="bg-transparent font-bold text-white text-lg outline-none w-full placeholder:text-zinc-700" />
                </div>

                <div className="flex flex-col bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-inner">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Calories (Kcal)</span>
                  <input type="number" placeholder="0" value={newFood.cals} onChange={e => setNewFood({...newFood, cals: e.target.value})} className="bg-transparent font-black text-white text-xl outline-none w-full placeholder:text-zinc-700" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[9px] font-black uppercase text-yellow-500 tracking-widest mb-1">Glucides</span>
                    <input type="number" placeholder="0g" value={newFood.carbs} onChange={e => setNewFood({...newFood, carbs: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" />
                  </div>
                  <div className="flex flex-col bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-1">Protéines</span>
                    <input type="number" placeholder="0g" value={newFood.prot} onChange={e => setNewFood({...newFood, prot: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" />
                  </div>
                  <div className="flex flex-col bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[9px] font-black uppercase text-red-500 tracking-widest mb-1">Lipides</span>
                    <input type="number" placeholder="0g" value={newFood.fat} onChange={e => setNewFood({...newFood, fat: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" />
                  </div>
                </div>
              </div>

              <button onClick={handleContributeFood} className={`w-full py-5 rounded-full font-black uppercase text-xs shadow-xl transition-all active:scale-95 ${newFood.name && newFood.cals ? 'bg-orange-500 text-black shadow-orange-900/50' : 'bg-zinc-800 text-zinc-500'}`}>
                Publier dans la base
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}