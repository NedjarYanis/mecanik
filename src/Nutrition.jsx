import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Flame, Plus, Droplet, 
  Coffee, Utensils, Moon, Cookie, DatabaseZap, 
  CloudLightning, User, Save, Loader2, Check
} from 'lucide-react';
import { collection, getDocs } from "firebase/firestore";
import { deleteUser } from "firebase/auth";

import { useAuth } from './App'; 
import { db, auth } from './services/firebase'; 
import { 
  calculateMifflin, calculateTargetGoals, 
  CircularGauge, LiveBarcodeScanner, OnboardingWizard 
} from './NutritionUtils'; 

// 🟢 NOUVEAUX COMPOSANTS IMPORTÉS
import FoodQuantityModal from './components/FoodQuantityModal';
import MealSearchModal from './components/MealSearchModal';
import ProfileModal from './components/ProfileModal';
import ContributeFoodModal from './components/ContributeFoodModal';

const foodsCollection = collection(db, 'foods');

export default function Nutrition({ onBack, dataContext }) {
  const { profile, setProfile, journal, setJournal, saveToCloud, saveStatus, hasUnsavedChanges, program } = dataContext;
  const { logout } = useAuth();
  
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
  
  // États des modales
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

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("⚠️ ATTENTION : Action irréversible.\n\nEs-tu sûr de vouloir supprimer ton compte MÉCANIK et toutes tes données ?");
    if (confirmDelete) {
      try {
        await deleteUser(auth.currentUser);
      } catch (error) {
        if (error.code === 'auth/requires-recent-login') alert("🔒 Sécurité : Tu dois te déconnecter puis te reconnecter une fois avant de pouvoir supprimer ton compte.");
        else alert("❌ Une erreur est survenue lors de la suppression du compte.");
      }
    }
  };

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
    const newItems = meal.items.filter((_, i) => i !== itemIndex);
    
    updateCurrentJournal({
      meals: {
        ...currentData.meals,
        [mealId]: {
          items: newItems,
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

    if (burned > 0) {
      updateCurrentJournal({ activity: burned });
      alert(`Synchronisation : +${burned} kcal estimées pour l'entraînement du jour !`);
    } else {
      alert("Aucun entraînement ou activité prévue pour ce jour.");
    }
  };

  const toggleFavorite = (food, e) => {
    e.stopPropagation();
    if(favorites.find(f => f.id === food.id)) setFavorites(prev => prev.filter(f => f.id !== food.id));
    else setFavorites(prev => [food, ...prev]);
  };

  const handleScanComplete = async (barcode) => {
    setIsScanningFood(false);
    const existing = globalDB.find(f => f.barcode === barcode);
    if (existing) { 
        setFoodToQuantify(existing); 
        return; 
    }
    
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1) {
        const nut = data.product.nutriments;
        const scanned = { 
          barcode, name: data.product.product_name || "Produit Inconnu", brand: data.product.brands || "",
          cals: Math.round(nut['energy-kcal_100g'] || 0), prot: Math.round(nut.proteins_100g || 0), 
          carbs: Math.round(nut.carbohydrates_100g || 0), fat: Math.round(nut.fat_100g || 0), verified: false 
        };
        const docRef = await addDoc(foodsCollection, scanned);
        const savedFood = { id: docRef.id, ...scanned };
        setGlobalFoodDB(prev => [savedFood, ...prev]);
        setFoodToQuantify(savedFood);
      } else { 
        setScannedBarcode(barcode);
        setShowContributeModal(true);
      }
    } catch (e) { 
        setScannedBarcode(barcode);
        setShowContributeModal(true); 
    }
  };

  if (!profile) return <OnboardingWizard onComplete={(p) => setProfile(p)} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95"><ChevronLeft size={18}/></button>
            <h1 className="text-xl font-black tracking-tight uppercase">Nutrition</h1>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900">
              {saveStatus === 'saving' && <Loader2 size={12} className="text-blue-500 animate-spin" />}
              {saveStatus === 'saved' && <Check size={12} className="text-emerald-500" />}
              {saveStatus === 'idle' && !hasUnsavedChanges && <CloudLightning size={12} className="text-zinc-600" />}
              {saveStatus === 'idle' && hasUnsavedChanges && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setScannedBarcode(""); setShowContributeModal(true); }} className="p-2.5 bg-orange-600/10 text-orange-500 rounded-full border border-orange-500/20"><DatabaseZap size={18} /></button>
            <button onClick={() => setShowProfileModal(true)} className="p-2.5 bg-cyan-600/10 text-cyan-500 rounded-full border border-cyan-500/20"><User size={18} /></button>
          </div>
        </div>
        <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-full border border-zinc-800">
          <button onClick={() => {
              const d = new Date(currentDateStr); d.setDate(d.getDate() - 1);
              setCurrentDateStr(d.toISOString().split('T')[0]);
          }} className="p-1 text-zinc-400"><ChevronLeft size={18}/></button>
          <span className="text-xs font-black uppercase tracking-widest text-blue-500">{currentDateStr}</span>
          <button onClick={() => {
              const d = new Date(currentDateStr); d.setDate(d.getDate() + 1);
              setCurrentDateStr(d.toISOString().split('T')[0]);
          }} className="p-1 text-zinc-400"><ChevronRight size={18}/></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">
        <section className="bg-[#151517] rounded-[32px] p-6 border border-[#222225] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col items-center gap-2"><CircularGauge value={totalConsumed} max={targetGoals.targetCalories} color="#3B82F6" icon={Utensils} size={60} /><span className="text-[10px] font-black text-blue-500 mt-2">{Math.round(totalConsumed)}</span></div>
            <div className="flex flex-col items-center justify-center"><span className="text-5xl font-black tracking-tighter">{Math.round(remainingCals)}</span><span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Kcal Restantes</span></div>
            <div className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform" onClick={syncWorkoutActivity}>
              <CircularGauge value={currentData.activity} max={1000} color="#EF4444" icon={Flame} size={60} />
              <span className="text-[10px] font-black text-red-500 mt-2">{currentData.activity}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-zinc-800 pt-6">
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-yellow-500 uppercase">GLU</span><div className="w-full bg-zinc-900 h-1.5 rounded-full"><div className="h-full bg-yellow-500" style={{ width: `${Math.min((totalCarbs/targetGoals.carbs)*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalCarbs)}g</span></div>
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-blue-500 uppercase">PROT</span><div className="w-full bg-zinc-900 h-1.5 rounded-full"><div className="h-full bg-blue-500" style={{ width: `${Math.min((totalProt/targetGoals.protein)*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalProt)}g</span></div>
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-red-500 uppercase">LIP</span><div className="w-full bg-zinc-900 h-1.5 rounded-full"><div className="h-full bg-red-500" style={{ width: `${Math.min((totalFat/targetGoals.fat)*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalFat)}g</span></div>
          </div>
        </section>

        <div className="bg-[#151517] p-4 rounded-[24px] border border-[#222225] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500"><Droplet size={20}/></div>
              <div><p className="font-bold text-white text-sm">Hydratation</p><p className="text-xs text-zinc-500 font-bold mt-0.5">{currentData.water} ml / 2500 ml</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateCurrentJournal({ water: Math.max(0, currentData.water - 250) })} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 active:scale-90">-</button>
              <button onClick={() => updateCurrentJournal({ water: currentData.water + 250 })} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-lg active:scale-90">+250</button>
            </div>
        </div>

        <section className="space-y-3">
          {[ { id: 'breakfast', name: 'Petit-déjeuner', icon: Coffee }, { id: 'lunch', name: 'Déjeuner', icon: Utensils }, { id: 'dinner', name: 'Dîner', icon: Moon }, { id: 'snacks', name: 'Snacks', icon: Cookie } ].map(meal => (
            <div key={meal.id} onClick={() => setActiveMealModal(meal.id)} className="bg-[#151517] border border-[#222225] rounded-[24px] p-4 flex items-center justify-between active:scale-95 transition-transform cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center"><meal.icon size={20} className="text-zinc-400"/></div>
                <div><p className="font-bold text-sm text-white">{meal.name}</p><p className="text-[11px] font-mono text-blue-500 font-bold">{Math.round(currentData.meals?.[meal.id]?.cals || 0)} Kcal</p></div>
              </div>
              <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-500"><Plus size={16}/></div>
            </div>
          ))}
        </section>

        <div className="mt-8 mb-4">
          <button onClick={saveToCloud} disabled={!hasUnsavedChanges || saveStatus === 'saving'} className={`w-full py-4 rounded-[20px] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${ saveStatus === 'saving' ? 'bg-blue-900/50 text-blue-400 cursor-not-allowed border border-blue-500/30' : saveStatus === 'saved' ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' : hasUnsavedChanges ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed' }`}>
            {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={16} /> : <Save size={16} />} 
            {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'saved' ? 'Sauvegardé !' : hasUnsavedChanges ? 'Sauvegarder maintenant' : 'Synchronisé'}
          </button>
        </div>
      </main>

      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal 
             profile={profile}
             setProfile={setProfile}
             targetGoals={targetGoals}
             metabolicStats={metabolicStats}
             onClose={() => setShowProfileModal(false)}
             onLogout={logout}
             onDeleteAccount={handleDeleteAccount}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {foodToQuantify && (
          <FoodQuantityModal 
            food={foodToQuantify} 
            onClose={() => setFoodToQuantify(null)} 
            onConfirm={confirmAddFoodWithQuantity} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMealModal && (
          <MealSearchModal 
            mealId={activeMealModal}
            mealData={currentData.meals[activeMealModal]}
            onClose={() => setActiveMealModal(null)}
            onRemoveFood={removeFoodFromMeal}
            onScanClick={() => setIsScanningFood(true)}
            globalDB={globalDB}
            onFoodSelect={setFoodToQuantify}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            recentFoods={recentFoods}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContributeModal && (
           <ContributeFoodModal 
              initialBarcode={scannedBarcode}
              onClose={() => setShowContributeModal(false)}
              onFoodAdded={(addedFood) => {
                 setGlobalFoodDB(prev => [addedFood, ...prev]);
                 setFoodToQuantify(addedFood);
                 setShowContributeModal(false);
              }}
           />
        )}
      </AnimatePresence>

      {isScanningFood && <LiveBarcodeScanner onScanComplete={handleScanComplete} onClose={() => setIsScanningFood(false)} />}
    </motion.div>
  );
}