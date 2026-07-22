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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full bg-adaptive text-white relative overflow-hidden">
      
      {/* Header épuré sans fond rigide */}
      <header className="px-6 pt-12 pb-6 z-40 flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="p-3 glass-panel bubble-pill text-zinc-300 active:scale-95 transition-all"><ChevronLeft size={20}/></button>
          <div className="flex gap-3">
            <button onClick={() => { setScannedBarcode(""); setShowContributeModal(true); }} className="p-3 glass-panel bubble-pill text-[#ADFF2F] active:scale-95 transition-all glow-accent"><DatabaseZap size={20} /></button>
            <button onClick={() => setShowProfileModal(true)} className="p-3 glass-panel bubble-pill text-zinc-300 active:scale-95 transition-all"><User size={20} /></button>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-black tracking-tight uppercase italic text-white flex-1 drop-shadow-md">Diète</h1>
          <div className="flex items-center glass-panel bubble-pill px-4 py-2 gap-3 cursor-pointer">
            <button onClick={() => { const d = new Date(currentDateStr); d.setDate(d.getDate() - 1); setCurrentDateStr(d.toISOString().split('T')[0]); }} className="text-zinc-500 hover:text-white"><ChevronLeft size={16}/></button>
            <span className="text-xs font-black uppercase text-[#ADFF2F] tracking-widest">{currentDateStr}</span>
            <button onClick={() => { const d = new Date(currentDateStr); d.setDate(d.getDate() + 1); setCurrentDateStr(d.toISOString().split('T')[0]); }} className="text-zinc-500 hover:text-white"><ChevronRight size={16}/></button>
          </div>
        </div>
      </header>

      {/* PADDING BOTTOM MASSIF POUR SAUVER "SNACKS" DU DOCK */}
      <main className="flex-1 overflow-y-auto px-6 pt-2 pb-[160px] space-y-8">
        
        {/* BENTO MASTER CARD : CALORIES & OBJECTIFS */}
        <section className="glass-panel bubble-1 p-8 relative overflow-hidden">
          {/* Lueur d'arrière plan */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#ADFF2F]/10 blur-[40px] rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-center mb-10">
            <div className="flex flex-col items-center gap-2">
              <CircularGauge value={totalConsumed} max={targetGoals.targetCalories} color="#ADFF2F" icon={Utensils} size={64} />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Consommé</span>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-black tracking-tighter text-white drop-shadow-md">{Math.round(remainingCals)}</span>
              <span className="text-[10px] font-black text-[#ADFF2F] uppercase tracking-widest mt-1">Kcal Restantes</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform" onClick={syncWorkoutActivity}>
              <CircularGauge value={currentData.activity} max={1000} color="#FF453A" icon={Flame} size={64} />
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Brûlées</span>
            </div>
          </div>

          {/* MACROS ESPACÉES (Bento Dynamique) */}
          <div className="flex justify-between gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400"><span>GLU</span><span className="text-white">{Math.round(totalCarbs)}g</span></div>
              <div className="w-full bg-[#070908]/80 border border-white/5 h-2 bubble-pill overflow-hidden"><div className="h-full bg-[#ADFF2F]" style={{ width: `${Math.min((totalCarbs/targetGoals.carbs)*100, 100)}%` }}/></div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400"><span>PROT</span><span className="text-white">{Math.round(totalProt)}g</span></div>
              <div className="w-full bg-[#070908]/80 border border-white/5 h-2 bubble-pill overflow-hidden"><div className="h-full bg-[#4facfe]" style={{ width: `${Math.min((totalProt/targetGoals.protein)*100, 100)}%` }}/></div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400"><span>LIP</span><span className="text-white">{Math.round(totalFat)}g</span></div>
              <div className="w-full bg-[#070908]/80 border border-white/5 h-2 bubble-pill overflow-hidden"><div className="h-full bg-[#ff7b54]" style={{ width: `${Math.min((totalFat/targetGoals.fat)*100, 100)}%` }}/></div>
            </div>
          </div>
        </section>

        {/* LIGNE HYDRATATION */}
        <div className="glass-panel bubble-2 p-5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-cyan-500/10 bubble-pill flex items-center justify-center text-cyan-400 border border-cyan-500/20"><Droplet size={24}/></div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider text-white italic">Hydratation</p>
              <p className="text-[11px] text-zinc-400 font-bold mt-0.5">{currentData.water} ml <span className="text-zinc-600">/ 2500 ml</span></p>
            </div>
          </div>
          <div className="flex gap-2 relative z-10">
            <button onClick={() => updateCurrentJournal({ water: Math.max(0, currentData.water - 250) })} className="w-10 h-10 bg-[#070908] bubble-pill flex items-center justify-center text-zinc-500 active:scale-90 transition-transform">-</button>
            <button onClick={() => updateCurrentJournal({ water: currentData.water + 250 })} className="px-4 h-10 bg-[#ADFF2F] text-black bubble-pill flex items-center justify-center font-black text-xs active:scale-90 transition-transform glow-accent">+250</button>
          </div>
        </div>

        {/* BENTO DYNAMIQUE DES REPAS (Frise asymétrique fluide) */}
        <div className="pt-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-5 px-2 flex items-center gap-2">
            <Sparkles size={14} className="text-[#ADFF2F]" /> Repas de la journée
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {[ 
              { id: 'breakfast', name: 'Petit-déjeuner', icon: Coffee, span: 'col-span-2', shape: 'bubble-3' }, 
              { id: 'lunch', name: 'Déjeuner', icon: Utensils, span: 'col-span-1', shape: 'bubble-1' }, 
              { id: 'dinner', name: 'Dîner', icon: Moon, span: 'col-span-1', shape: 'bubble-2' }, 
              { id: 'snacks', name: 'Snacks', icon: Cookie, span: 'col-span-2', shape: 'bubble-1' } 
            ].map(meal => {
              const mealCals = Math.round(currentData.meals?.[meal.id]?.cals || 0);
              const itemCount = currentData.meals?.[meal.id]?.items?.length || 0;
              
              return (
                <div 
                  key={meal.id} 
                  onClick={() => setActiveMealModal(meal.id)} 
                  className={`glass-panel p-6 ${meal.shape} flex flex-col justify-between active:scale-[0.98] cursor-pointer transition-all relative overflow-hidden group ${meal.span} min-h-[130px]`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-[#070908]/80 bubble-pill flex items-center justify-center border border-white/5 text-[#ADFF2F]">
                      <meal.icon size={20}/>
                    </div>
                    <div className="w-8 h-8 bg-[#070908]/50 bubble-pill flex items-center justify-center text-zinc-400 group-hover:text-black group-hover:bg-[#ADFF2F] group-hover:glow-accent transition-all">
                      <Plus size={16}/>
                    </div>
                  </div>

                  <div>
                    <p className="font-black text-sm text-white uppercase italic tracking-tight">{meal.name}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-black text-[#ADFF2F]">{mealCals}</span>
                      <span className="text-[10px] font-bold uppercase text-zinc-500">Kcal</span>
                      {itemCount > 0 && <span className="text-[10px] text-zinc-400 font-bold ml-auto bg-[#070908]/50 px-2 py-0.5 bubble-pill">{itemCount} alim.</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bouton de sauvegarde cloud organique et dynamique */}
        <div className="pt-8">
          <button 
            onClick={saveToCloud} 
            disabled={!hasUnsavedChanges || saveStatus === 'saving'} 
            className={`w-full py-5 bubble-pill font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${ 
              saveStatus === 'saving' ? 'bg-[#ADFF2F]/50 text-black cursor-not-allowed' : 
              saveStatus === 'saved' ? 'bg-[#ADFF2F] text-black glow-accent' : 
              hasUnsavedChanges ? 'bg-[#ADFF2F] text-black active:scale-95 glow-accent' : 
              'glass-panel text-zinc-500 cursor-not-allowed' 
            }`}
          >
            {saveStatus === 'saving' ? <Loader2 size={18} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={18} /> : <Save size={18} />} 
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