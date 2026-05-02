import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Flame, Plus, Droplet, 
  Coffee, Utensils, Moon, Cookie, DatabaseZap, 
  CloudLightning, User, Save, Loader2, Check 
} from 'lucide-react';
import { collection, getDocs, addDoc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { useAuth } from './App'; 
import { db, auth } from './services/firebase'; 
import { 
  calculateMifflin, calculateTargetGoals, 
  CircularGauge, LiveBarcodeScanner, OnboardingWizard 
} from './NutritionUtils'; 

// Import des composants modulaires
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

  // ... (Calculs des macros et fonctions de suppression identiques au code source)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
         {/* Navigation par date */}
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">
        {/* Gauge de calories et macros */}
        {/* Section Hydratation */}
        {/* Liste des repas (Breakfast, Lunch, etc.) */}

        <div className="mt-8 mb-4">
          <button onClick={saveToCloud} disabled={!hasUnsavedChanges || saveStatus === 'saving'} className={`w-full py-4 rounded-[20px] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${ saveStatus === 'saving' ? 'bg-blue-900/50 text-blue-400 cursor-not-allowed border border-blue-500/30' : saveStatus === 'saved' ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' : hasUnsavedChanges ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed' }`}>
            {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={16} /> : <Save size={16} />} 
            {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'saved' ? 'Sauvegardé !' : hasUnsavedChanges ? 'Sauvegarder maintenant' : 'Synchronisé'}
          </button>
        </div>
      </main>

      <AnimatePresence>
        {/* Rendu conditionnel des modales (Search, Quantity, Profile, Contribute) */}
      </AnimatePresence>
    </motion.div>
  );
}