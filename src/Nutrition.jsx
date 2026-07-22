import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, Flame, Plus, Droplet, 
    Coffee, Utensils, Moon, Cookie, DatabaseZap, 
    User, Save, Loader2, Check, Sparkles 
} from 'lucide-react';
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from './context/AuthContext';
import { db } from './services/firebase';
import { 
    calculateMifflin, calculateTargetGoals, 
    CircularGauge, LiveBarcodeScanner, OnboardingWizard 
} from './NutritionUtils';
import FoodQuantityModal from './components/FoodQuantityModal';
import MealSearchModal from './components/MealSearchModal';
import ProfileModal from './components/ProfileModal';
import ContributeFoodModal from './components/ContributeFoodModal';
import { useToast } from './context/ToastContext';

const foodsCollection = collection(db, 'foods');

export default function Nutrition({ onBack, dataContext }) {
  const { profile, setProfile, journal, setJournal, saveToCloud, saveStatus, hasUnsavedChanges, program } = dataContext;
  const { logout } = useAuth();
  const { showToast } = useToast();

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [currentDateStr, setCurrentDateStr] = useState(getTodayStr());

  const emptyDay = { 
     meals: {
       breakfast: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 },
       lunch: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 },
       dinner: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 },
       snacks: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }
     },
     activity: 0, water: 0 
  };

  const currentData = useMemo(() => {
    const rawData = journal[currentDateStr];
    if (!rawData) return emptyDay;
    return { ...emptyDay, ...rawData, meals: { ...emptyDay.meals, ...(rawData.meals || {}) } };
  }, [journal, currentDateStr]);

  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('mecanik_favorites')) || []);
  const [recentFoods, setRecentFoods] = useState(() => JSON.parse(localStorage.getItem('mecanik_recents')) || []);
  const [globalDB, setGlobalFoodDB] = useState([]);
  const [activeMealModal, setActiveMealModal] = useState(null); 
  const [foodToQuantify, setFoodToQuantify] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [isScanningFood, setIsScanningFood] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");

  useEffect(() => { localStorage.setItem('mecanik_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('mecanik_recents', JSON.stringify(recentFoods)); }, [recentFoods]);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const snap = await getDocs(foodsCollection);
        setGlobalFoodDB(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.error("Erreur DB:", e); }
    };
    fetchFoods();
  }, []);

  const { totalConsumed, totalCarbs, totalProt, totalFat } = useMemo(() => {
    const meals = Object.values(currentData.meals);
    return {
      totalConsumed: meals.reduce((acc, m) => acc + (m?.cals || 0), 0),
      totalCarbs: meals.reduce((acc, m) => acc + (m?.carbs || 0), 0),
      totalProt: meals.reduce((acc, m) => acc + (m?.prot || 0), 0),
      totalFat: meals.reduce((acc, m) => acc + (m?.fat || 0), 0)
    };
  }, [currentData]);

  const metabolicStats = useMemo(() => calculateMifflin(profile), [profile]);
  const targetGoals = useMemo(() => calculateTargetGoals(profile, metabolicStats.tdee), [profile, metabolicStats.tdee]);
  const remainingCals = targetGoals.targetCalories - totalConsumed + currentData.activity;

  const updateCurrentJournal = (newData) => setJournal(prev => ({ ...prev, [currentDateStr]: { ...currentData, ...newData } }));

  const confirmAddFoodWithQuantity = (food, quantity) => {
    const ratio = quantity / 100;
    const adjustedFood = {
      ...food,
      cals: Math.round(food.cals * ratio),
      prot: Math.round(food.prot * ratio),
      carbs: Math.round(food.carbs * ratio),
      fat: Math.round(food.fat * ratio),
      quantity: quantity 
    };
    const meal = currentData.meals[activeMealModal];
    updateCurrentJournal({
      meals: { 
         ...currentData.meals, 
         [activeMealModal]: {
           items: [...(meal.items||[]), adjustedFood],
           cals: (meal.cals||0) + Number(adjustedFood.cals),
           carbs: (meal.carbs||0) + Number(adjustedFood.carbs),
           prot: (meal.prot||0) + Number(adjustedFood.prot),
           fat: (meal.fat||0) + Number(adjustedFood.fat)
         } 
       }
    });
    setRecentFoods(prev => [food, ...prev.filter(f => f.id !== food.id)].slice(0, 20));
    setFoodToQuantify(null);
  };

  const removeFoodFromMeal = (mealId, itemIndex) => {
    const meal = currentData.meals[mealId];
    const itemToRemove = meal.items[itemIndex];
    updateCurrentJournal({
      meals: {
        ...currentData.meals,
        [mealId]: {
          items: meal.items.filter((_, i) => i !== itemIndex),
          cals: Math.max(0, meal.cals - itemToRemove.cals),
          carbs: Math.max(0, meal.carbs - itemToRemove.carbs),
          prot: Math.max(0, meal.prot - itemToRemove.prot),
          fat: Math.max(0, meal.fat - itemToRemove.fat),
        }
      }
    });
  };

  const syncWorkoutActivity = () => {
    const d = new Date(currentDateStr).getDay();
    const activeDayIndex = d === 0 ? 7 : d;
    const dayProg = program[activeDayIndex];
    let burned = 0;
    if (dayProg) {
      if (dayProg.type === 'lift' || dayProg.type === 'mixed') burned += 300;
      if (dayProg.cardio) burned += 200;
    }
    updateCurrentJournal({ activity: burned });
    showToast(`Synchronisation : +${burned} kcal estimées !`, 'success');
  };

  const handleScanComplete = async (barcode) => {
    setIsScanningFood(false);
    const existing = globalDB.find(f => f.barcode === barcode);
    if (existing) { setFoodToQuantify(existing); return; }
    setScannedBarcode(barcode);
    setShowContributeModal(true);
  };

  if (!profile) return <OnboardingWizard onComplete={(p) => setProfile(p)} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full bg-[#0B0E0B] text-white relative overflow-hidden">
      
      {/* Header épuré sans lignes rigides */}
      <header className="px-6 pt-10 pb-4 bg-[#0B0E0B] z-40 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-3 bg-[#141814] hover:bg-[#1C221C] rounded-2xl text-zinc-300 active:scale-95 transition-all"><ChevronLeft size={18}/></button>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Nutrition Plan</p>
              <h1 className="text-xl font-black tracking-tight uppercase text-white italic">Espace Diète</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setScannedBarcode(""); setShowContributeModal(true); }} className="p-3 bg-[#141814] text-[#D4FC47] rounded-2xl border border-zinc-800/80 active:scale-95 transition-all"><DatabaseZap size={18} /></button>
            <button onClick={() => setShowProfileModal(true)} className="p-3 bg-[#141814] text-zinc-300 rounded-2xl border border-zinc-800/80 active:scale-95 transition-all"><User size={18} /></button>
          </div>
        </div>

        {/* Sélecteur de date organique flottant */}
        <div className="flex justify-between items-center bg-[#141814] p-2 rounded-2xl border border-zinc-800/60">
          <button onClick={() => { const d = new Date(currentDateStr); d.setDate(d.getDate() - 1); setCurrentDateStr(d.toISOString().split('T')[0]); }} className="p-1.5 text-zinc-400 hover:text-white"><ChevronLeft size={16}/></button>
          <span className="text-xs font-black uppercase tracking-widest text-[#D4FC47]">{currentDateStr}</span>
          <button onClick={() => { const d = new Date(currentDateStr); d.setDate(d.getDate() + 1); setCurrentDateStr(d.toISOString().split('T')[0]); }} className="p-1.5 text-zinc-400 hover:text-white"><ChevronRight size={16}/></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-48 space-y-6">
        
        {/* BENTO MASTER CARD : CALORIES & OBJECTIFS */}
        <section className="bg-[#141814] bento-organic-1 p-6 border border-zinc-800/60 shadow-2xl relative overflow-hidden">
          {/* Éléments de design flottants en arrière-plan */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#D4FC47]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col items-center gap-1">
              <CircularGauge value={totalConsumed} max={targetGoals.targetCalories} color="#D4FC47" icon={Utensils} size={64} />
              <span className="text-[9px] font-black text-zinc-400 mt-1 uppercase">Consommé</span>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black tracking-tighter text-white">{Math.round(remainingCals)}</span>
              <span className="text-[9px] font-black text-[#D4FC47] uppercase tracking-widest mt-0.5">Kcal Restantes</span>
            </div>
            
            <div className="flex flex-col items-center gap-1 cursor-pointer active:scale-90" onClick={syncWorkoutActivity}>
              <CircularGauge value={currentData.activity} max={1000} color="#FF453A" icon={Flame} size={64} />
              <span className="text-[9px] font-black text-red-400 mt-1 uppercase">Brûlées</span>
            </div>
          </div>

          {/* Barres de macros intégrées sans bordures rigides */}
          <div className="grid grid-cols-3 gap-3 bg-[#0B0E0B]/60 p-4 rounded-2xl">
            <div className="flex flex-col gap-1.5"><div className="flex justify-between text-[9px] font-black uppercase text-zinc-400"><span>GLU</span><span>{Math.round(totalCarbs)}g</span></div><div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="h-full bg-[#D4FC47]" style={{ width: `${Math.min((totalCarbs/targetGoals.carbs)*100, 100)}%` }}/></div></div>
            <div className="flex flex-col gap-1.5"><div className="flex justify-between text-[9px] font-black uppercase text-zinc-400"><span>PROT</span><span>{Math.round(totalProt)}g</span></div><div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="h-full bg-blue-400" style={{ width: `${Math.min((totalProt/targetGoals.protein)*100, 100)}%` }}/></div></div>
            <div className="flex flex-col gap-1.5"><div className="flex justify-between text-[9px] font-black uppercase text-zinc-400"><span>LIP</span><span>{Math.round(totalFat)}g</span></div><div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="h-full bg-red-400" style={{ width: `${Math.min((totalFat/targetGoals.fat)*100, 100)}%` }}/></div></div>
          </div>
        </section>

        {/* LIGNE BENTO SECONDAIRE : HYDRATATION & SYNCHRO */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-[#141814] p-4 rounded-3xl border border-zinc-800/60 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400"><Droplet size={20}/></div>
              <div><p className="font-black text-xs uppercase tracking-wider text-white">Hydratation</p><p className="text-[11px] text-zinc-400 font-bold mt-0.5">{currentData.water} ml / 2500 ml</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateCurrentJournal({ water: Math.max(0, currentData.water - 250) })} className="w-9 h-9 bg-[#0B0E0B] rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-800 active:scale-90">-</button>
              <button onClick={() => updateCurrentJournal({ water: currentData.water + 250 })} className="px-3 h-9 bg-[#D4FC47] text-black rounded-xl flex items-center justify-center font-black text-xs shadow-md active:scale-90">+250ml</button>
            </div>
          </div>
        </div>

        {/* BENTO DYNAMIQUE DES REPAS (Frise asymétrique fluide) */}
        <div className="pt-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 px-1 flex items-center gap-2">
            <Sparkles size={12} className="text-[#D4FC47]" /> Repas de la journée
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {[ 
              { id: 'breakfast', name: 'Petit-déjeuner', icon: Coffee, span: 'col-span-2' }, 
              { id: 'lunch', name: 'Déjeuner', icon: Utensils, span: 'col-span-1' }, 
              { id: 'dinner', name: 'Dîner', icon: Moon, span: 'col-span-1' }, 
              { id: 'snacks', name: 'Snacks', icon: Cookie, span: 'col-span-2' } 
            ].map(meal => {
              const mealCals = Math.round(currentData.meals?.[meal.id]?.cals || 0);
              const itemCount = currentData.meals?.[meal.id]?.items?.length || 0;
              
              return (
                <div 
                  key={meal.id} 
                  onClick={() => setActiveMealModal(meal.id)} 
                  className={`bg-[#141814] hover:bg-[#1C221C] border border-zinc-800/60 p-5 rounded-3xl flex flex-col justify-between active:scale-[0.98] cursor-pointer transition-all shadow-lg relative overflow-hidden group ${meal.span}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-[#0B0E0B] rounded-2xl flex items-center justify-center border border-zinc-800 text-[#D4FC47]">
                      <meal.icon size={18}/>
                    </div>
                    <div className="w-7 h-7 bg-[#0B0E0B] rounded-full flex items-center justify-center text-zinc-400 group-hover:text-[#D4FC47] group-hover:bg-[#D4FC47]/10 transition-colors">
                      <Plus size={14}/>
                    </div>
                  </div>

                  <div>
                    <p className="font-black text-sm text-white uppercase italic tracking-tight">{meal.name}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-black text-[#D4FC47]">{mealCals}</span>
                      <span className="text-[9px] font-bold uppercase text-zinc-500">Kcal</span>
                      {itemCount > 0 && <span className="text-[9px] text-zinc-400 font-bold ml-auto">• {itemCount} alim.</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bouton de sauvegarde cloud flottant et dynamique */}
        <div className="pt-4 pb-4">
          <button 
            onClick={saveToCloud} 
            disabled={!hasUnsavedChanges || saveStatus === 'saving'} 
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${ 
              saveStatus === 'saving' ? 'bg-[#D4FC47]/50 text-black cursor-not-allowed' : 
              saveStatus === 'saved' ? 'bg-[#D4FC47] text-black shadow-[0_0_20px_rgba(212,252,71,0.2)]' : 
              hasUnsavedChanges ? 'bg-[#D4FC47] text-black active:scale-95 shadow-[0_0_20px_rgba(212,252,71,0.3)]' : 
              'bg-[#141814] text-zinc-600 border border-zinc-800/80 cursor-not-allowed' 
            }`}
          >
            {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={16} /> : <Save size={16} />} 
            {saveStatus === 'saving' ? 'Synchronisation...' : saveStatus === 'saved' ? 'Modifications enregistrées !' : hasUnsavedChanges ? 'Enregistrer les modifications' : 'Tout est synchronisé'}
          </button>
        </div>
      </main>

      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal profile={profile} setProfile={setProfile} targetGoals={targetGoals} metabolicStats={metabolicStats} onClose={() => setShowProfileModal(false)} onLogout={logout} />
        )}
        {foodToQuantify && (
          <FoodQuantityModal food={foodToQuantify} onClose={() => setFoodToQuantify(null)} onConfirm={confirmAddFoodWithQuantity} />
        )}
        {activeMealModal && (
          <MealSearchModal mealId={activeMealModal} mealData={currentData.meals[activeMealModal]} onClose={() => setActiveMealModal(null)} onRemoveFood={removeFoodFromMeal} onScanClick={() => setIsScanningFood(true)} globalDB={globalDB} onFoodSelect={setFoodToQuantify} favorites={favorites} recentFoods={recentFoods} />
        )}
        {showContributeModal && (
          <ContributeFoodModal initialBarcode={scannedBarcode} onClose={() => setShowContributeModal(false)} onFoodAdded={(addedFood) => { setGlobalFoodDB(prev => [addedFood, ...prev]); setFoodToQuantify(addedFood); setShowContributeModal(false); }} />
        )}
      </AnimatePresence>
      {isScanningFood && <LiveBarcodeScanner onScanComplete={handleScanComplete} onClose={() => setIsScanningFood(false)} />}
    </motion.div>
  );
}