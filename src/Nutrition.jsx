import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, Flame, Plus, Droplet, 
    Coffee, Utensils, Moon, Cookie, DatabaseZap, 
    User, Save, Loader2, Check 
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
      <header className="px-5 pt-10 pb-4 bg-[#0B0E0B]/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2.5 bg-[#1A1E1A] rounded-full text-zinc-300 active:scale-95"><ChevronLeft size={18}/></button>
            <h1 className="text-xl font-black tracking-tight uppercase text-[#D4FC47]">Diète</h1>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1A1E1A]">
              {saveStatus === 'saving' && <Loader2 size={12} className="text-[#D4FC47] animate-spin" />}
              {saveStatus === 'saved' && <Check size={12} className="text-[#D4FC47]" />}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setScannedBarcode(""); setShowContributeModal(true); }} className="p-2.5 bg-[#D4FC47]/10 text-[#D4FC47] rounded-full border border-[#D4FC47]/20"><DatabaseZap size={18} /></button>
            <button onClick={() => setShowProfileModal(true)} className="p-2.5 bg-[#D0BFFF]/20 text-[#D0BFFF] rounded-full border border-[#D0BFFF]/30"><User size={18} /></button>
          </div>
        </div>

        <div className="flex justify-between items-center bg-[#1A1E1A] p-2 rounded-full border border-zinc-800">
          <button onClick={() => { const d = new Date(currentDateStr); d.setDate(d.getDate() - 1); setCurrentDateStr(d.toISOString().split('T')[0]); }} className="p-1 text-zinc-400"><ChevronLeft size={18}/></button>
          <span className="text-xs font-black uppercase tracking-widest text-[#D4FC47]">{currentDateStr}</span>
          <button onClick={() => { const d = new Date(currentDateStr); d.setDate(d.getDate() + 1); setCurrentDateStr(d.toISOString().split('T')[0]); }} className="p-1 text-zinc-400"><ChevronRight size={18}/></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-5">
        {/* CARTE PRINCIPALE CALORIES (Fond Lavande #D0BFFF et accents sombres) */}
        <section className="bg-[#D0BFFF] text-black rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col items-center gap-1">
              <CircularGauge value={totalConsumed} max={targetGoals.targetCalories} color="#0B0E0B" icon={Utensils} size={56} />
              <span className="text-[9px] font-black mt-1 text-black/70">{Math.round(totalConsumed)}</span>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black tracking-tighter text-black">{Math.round(remainingCals)}</span>
              <span className="text-[9px] font-black text-black/70 uppercase tracking-widest mt-0.5">Kcal Restantes</span>
            </div>
            
            <div className="flex flex-col items-center gap-1 cursor-pointer active:scale-90" onClick={syncWorkoutActivity}>
              <CircularGauge value={currentData.activity} max={1000} color="#FF453A" icon={Flame} size={56} />
              <span className="text-[9px] font-black text-red-600 mt-1">{currentData.activity}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-black/10 pt-4">
            <div className="flex flex-col items-center gap-1"><span className="text-[8px] font-black uppercase">GLU</span><div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-black" style={{ width: `${Math.min((totalCarbs/targetGoals.carbs)*100, 100)}%` }}/></div><span className="text-[10px] font-bold">{Math.round(totalCarbs)}g</span></div>
            <div className="flex flex-col items-center gap-1"><span className="text-[8px] font-black uppercase">PROT</span><div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-black" style={{ width: `${Math.min((totalProt/targetGoals.protein)*100, 100)}%` }}/></div><span className="text-[10px] font-bold">{Math.round(totalProt)}g</span></div>
            <div className="flex flex-col items-center gap-1"><span className="text-[8px] font-black uppercase">LIP</span><div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-black" style={{ width: `${Math.min((totalFat/targetGoals.fat)*100, 100)}%` }}/></div><span className="text-[10px] font-bold">{Math.round(totalFat)}g</span></div>
          </div>
        </section>

        {/* HYDRATATION */}
        <div className="bg-[#1A1E1A] p-4 rounded-[24px] border border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400"><Droplet size={20}/></div>
            <div><p className="font-bold text-white text-sm">Hydratation</p><p className="text-[11px] text-zinc-400 font-bold mt-0.5">{currentData.water} ml / 2500 ml</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateCurrentJournal({ water: Math.max(0, currentData.water - 250) })} className="w-9 h-9 bg-[#0B0E0B] rounded-2xl flex items-center justify-center text-zinc-400 border border-zinc-800 active:scale-90">-</button>
            <button onClick={() => updateCurrentJournal({ water: currentData.water + 250 })} className="w-11 h-9 bg-[#D4FC47] text-black rounded-2xl flex items-center justify-center font-black text-xs shadow-md active:scale-90">+250</button>
          </div>
        </div>

        {/* LISTE DES REPAS */}
        <section className="space-y-3">
          {[ { id: 'breakfast', name: 'Petit-déjeuner', icon: Coffee }, { id: 'lunch', name: 'Déjeuner', icon: Utensils }, { id: 'dinner', name: 'Dîner', icon: Moon }, { id: 'snacks', name: 'Snacks', icon: Cookie } ].map(meal => (
            <div key={meal.id} onClick={() => setActiveMealModal(meal.id)} className="bg-[#1A1E1A] border border-zinc-800 rounded-[24px] p-4 flex items-center justify-between active:scale-95 cursor-pointer shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0B0E0B] rounded-2xl flex items-center justify-center border border-zinc-800"><meal.icon size={20} className="text-[#D4FC47]"/></div>
                <div><p className="font-bold text-sm text-white">{meal.name}</p><p className="text-[11px] font-mono text-[#D4FC47] font-bold">{Math.round(currentData.meals?.[meal.id]?.cals || 0)} Kcal</p></div>
              </div>
              <div className="w-8 h-8 bg-[#D4FC47]/10 rounded-full flex items-center justify-center text-[#D4FC47]"><Plus size={16}/></div>
            </div>
          ))}
        </section>

        <div className="mt-8 mb-4">
          <button onClick={saveToCloud} disabled={!hasUnsavedChanges || saveStatus === 'saving'} className={`w-full py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${ saveStatus === 'saving' ? 'bg-[#D4FC47]/50 text-black cursor-not-allowed' : saveStatus === 'saved' ? 'bg-[#D4FC47] text-black' : hasUnsavedChanges ? 'bg-[#D4FC47] text-black active:scale-95' : 'bg-[#1A1E1A] text-zinc-500 border border-zinc-800' }`}>
            {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={16} /> : <Save size={16} />}
            {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'saved' ? 'Sauvegardé !' : hasUnsavedChanges ? 'Sauvegarder maintenant' : 'Synchronisé'}
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