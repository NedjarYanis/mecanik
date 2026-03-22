import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Flame, Plus, Droplet, 
  Coffee, Utensils, Moon, Cookie, Activity, X, 
  Search, CheckCircle2, Globe, DatabaseZap, CloudLightning, RefreshCw,
  User, Calendar as CalendarIcon, TrendingDown, BrainCircuit, Info, Settings, TrendingUp,
  History, Heart, Bookmark, ScanBarcode
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode'; 

// ==========================================
// 1. CONFIGURATION CLOUD FIREBASE
// ==========================================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgWfWXpAV6ZHHrlE4q1EC3mFeZAJOV5wc",
  authDomain: "mecanik-21fad.firebaseapp.com",
  projectId: "mecanik-21fad",
  storageBucket: "mecanik-21fad.firebasestorage.app",
  messagingSenderId: "669005036732",
  appId: "1:669005036732:web:a998919f7b462fe19fe4b9"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const foodsCollection = collection(db, 'foods');

// ==========================================
// 2. MOTEUR D'ANALYSE MÉTABOLIQUE
// ==========================================
const calculateMifflin = (profile) => {
  if (!profile) return { bmr: 0, tdee: 2600 };
  const w = Number(profile.weight) || 75; const h = Number(profile.height) || 175; const a = Number(profile.age) || 25;
  let bmr = (10 * w) + (6.25 * h) - (5 * a); bmr += profile.gender === 'M' ? 5 : -161;
  const multipliers = { 'Sédentaire': 1.2, 'Léger': 1.375, 'Modéré': 1.55, 'Intense': 1.725 };
  const tdee = bmr * (multipliers[profile.activityLevel || 'Modéré'] || 1.55);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee) };
};

const calculateTargetGoals = (profile, tdee) => {
  let targetCalories = tdee; let multiplier = 1; const goal = profile?.goal || 'maintain';
  if (goal === 'cut') multiplier = 0.85; if (goal === 'bulk') multiplier = 1.10; 
  targetCalories = Math.round(tdee * multiplier);
  const w = Number(profile?.weight) || 75;
  const protein = Math.round(w * 2.2); const fat = Math.round((targetCalories * 0.25) / 9); 
  const remainingCals = targetCalories - (protein * 4) - (fat * 9);
  const carbs = Math.max(0, Math.round(remainingCals / 4)); 
  return { targetCalories, protein, fat, carbs, multiplier };
};

const simulateRandomForest = (profile) => {
  if (!profile) return { type: "Inconnu", risk: "?", focus: "Remplissez votre profil." };
  const fat = Number(profile.bodyFat) || 15; const w = Number(profile.weight) || 75; const h = Number(profile.height) || 175;
  const bmi = w / Math.pow(h / 100, 2);
  if (fat > 25 && bmi > 25) return { type: "Endomorphe Lourd", risk: "Élevé", focus: "Déficit strict, Lipides bas." };
  if (fat <= 15 && bmi < 22) return { type: "Ectomorphe Rapide", risk: "Faible", focus: "Surplus calorique, Hyper-protéiné." };
  if (fat >= 15 && fat <= 25 && bmi >= 22 && bmi <= 25) return { type: "Mésomorphe Équilibré", risk: "Modéré", focus: "Recomposition corporelle." };
  return { type: "Profil Atypique", risk: "À surveiller", focus: "Ajustement progressif." };
};

const simulateLinearRegression = (profile, tdee) => {
  if (!profile) return { prediction30Days: 0, trend: 'Stagnation' };
  const target = calculateTargetGoals(profile, tdee).targetCalories;
  const dailyDiff = target - tdee; const weeklyChange = (dailyDiff * 7) / 7000; const w = Number(profile.weight) || 75;
  const prediction30Days = (w + (weeklyChange * 4.2)).toFixed(1);
  return { prediction30Days, trend: dailyDiff < 0 ? 'Baisse' : dailyDiff > 0 ? 'Hausse' : 'Stagnation' };
};

const CircularGauge = React.memo(({ value, max, color, size = 64, strokeWidth = 6, icon: Icon }) => {
  const radius = (size - strokeWidth) / 2; const circumference = 2 * Math.PI * radius; const percent = Math.min((value || 0) / (max || 1), 1);
  const strokeDashoffset = circumference - percent * circumference;
  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 absolute"><circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-zinc-900" /><circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" /></svg>
      <div className="absolute flex flex-col items-center justify-center">{Icon && <Icon size={size * 0.3} color={color} />}</div>
    </div>
  );
});

// ==========================================
// 3. SCANNER LIVE
// ==========================================
const LiveBarcodeScanner = ({ onScanComplete, onClose }) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("live-reader");
    let isScanning = true;

    html5QrCode.start(
      { facingMode: "environment", width: { ideal: 1920 } }, 
      { fps: 15, qrbox: { width: 280, height: 150 }, aspectRatio: 1.0, disableFlip: false },
      (decodedText) => {
        if (!isScanning) return;
        isScanning = false;
        html5QrCode.stop().then(() => onScanComplete(decodedText)).catch(() => onScanComplete(decodedText));
      },
      (error) => {}
    ).catch(err => {
      console.error("Camera Error:", err);
      alert("Impossible d'accéder à la caméra.");
      onClose();
    });

    return () => { isScanning = false; if (html5QrCode.isScanning) html5QrCode.stop().catch(console.error); };
  }, [onScanComplete, onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl p-6 flex flex-col items-center justify-center">
      <h2 className="text-white mb-6 font-black uppercase tracking-widest text-lg text-center">Détection Automatique</h2>
      <div className="w-full max-w-sm rounded-[32px] overflow-hidden bg-black border-4 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] relative">
        <div id="live-reader" className="w-full h-[300px] object-cover flex items-center justify-center bg-zinc-900"></div>
        <motion.div animate={{ y: [0, 300, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_20px_#10b981]" />
      </div>
      <button onClick={onClose} className="mt-12 px-10 py-4 bg-zinc-900 rounded-full font-black uppercase text-xs text-white border border-zinc-800 active:scale-95 shadow-lg">Annuler</button>
    </motion.div>
  );
};

// ==========================================
// 4. ONBOARDING WIZARD
// ==========================================
function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ age: 25, gender: 'M', weight: 75, height: 175, activityLevel: 'Modéré', bodyFat: 15, muscleMass: 40, boneMass: 3, hydration: 60, goal: 'maintain' });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black text-white flex flex-col p-6 overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        <div className="text-center"><BrainCircuit size={48} className="text-blue-500 mx-auto mb-4 animate-pulse" /><h1 className="text-3xl font-black uppercase tracking-tighter">Étalonnage<br/>Métabolique</h1><p className="text-zinc-400 text-sm mt-2">L'IA a besoin de vos biométries.</p></div>
        {step === 1 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">1. Données de Base</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Âge</span><input type="number" value={profile.age} onChange={e=>setProfile({...profile, age: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
              <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Genre</span><select value={profile.gender} onChange={e=>setProfile({...profile, gender: e.target.value})} className="bg-transparent w-full font-black text-xl outline-none"><option value="M">M</option><option value="F">F</option></select></div>
              <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Poids (kg)</span><input type="number" value={profile.weight} onChange={e=>setProfile({...profile, weight: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
              <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Taille (cm)</span><input type="number" value={profile.height} onChange={e=>setProfile({...profile, height: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Activité</span><select value={profile.activityLevel} onChange={e=>setProfile({...profile, activityLevel: e.target.value})} className="bg-transparent w-full font-black text-lg outline-none"><option>Sédentaire</option><option>Léger</option><option>Modéré</option><option>Intense</option></select></div>
            <button onClick={() => setStep(2)} className="w-full py-4 bg-blue-600 rounded-full font-black uppercase text-xs">Suivant</button>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-cyan-500">2. Composition (Optionnel)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-4 rounded-2xl border border-blue-900/30"><span className="text-[10px] uppercase text-zinc-500 font-bold">Gras (%)</span><input type="number" value={profile.bodyFat} onChange={e=>setProfile({...profile, bodyFat: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none text-blue-400" /></div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-red-900/30"><span className="text-[10px] uppercase text-zinc-500 font-bold">Muscle (kg)</span><input type="number" value={profile.muscleMass} onChange={e=>setProfile({...profile, muscleMass: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none text-red-400" /></div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-700/50"><span className="text-[10px] uppercase text-zinc-500 font-bold">Os (kg)</span><input type="number" value={profile.boneMass} onChange={e=>setProfile({...profile, boneMass: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-cyan-900/30"><span className="text-[10px] uppercase text-zinc-500 font-bold">Eau (%)</span><input type="number" value={profile.hydration} onChange={e=>setProfile({...profile, hydration: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none text-cyan-400" /></div>
            </div>
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex gap-2"><button onClick={() => setStep(1)} className="p-4 bg-zinc-800 rounded-2xl"><ChevronLeft size={20}/></button><button onClick={() => setStep(3)} className="flex-1 py-4 bg-cyan-600 text-black rounded-2xl font-black uppercase text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)]">Valider ces données</button></div>
              <button onClick={() => { setProfile({...profile, bodyFat: 15, muscleMass: 0, boneMass: 0, hydration: 60}); setStep(3); }} className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95">Je n'ai pas ces données (Passer)</button>
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500">3. Stratégie Nutritionnelle</h2>
            <div className="space-y-3">
              <div onClick={() => setProfile({...profile, goal: 'cut'})} className={`p-4 rounded-2xl border cursor-pointer transition-all ${profile.goal === 'cut' ? 'bg-emerald-900/40 border-emerald-500' : 'bg-zinc-900 border-zinc-800'}`}><div className="flex justify-between items-center mb-1"><span className="font-black text-white">Sèche / Perte</span><TrendingDown size={18} className={profile.goal === 'cut' ? 'text-emerald-500' : 'text-zinc-500'}/></div><p className="text-[10px] text-zinc-400 font-bold">Déficit contrôlé de -15%</p></div>
              <div onClick={() => setProfile({...profile, goal: 'maintain'})} className={`p-4 rounded-2xl border cursor-pointer transition-all ${profile.goal === 'maintain' ? 'bg-blue-900/40 border-blue-500' : 'bg-zinc-900 border-zinc-800'}`}><div className="flex justify-between items-center mb-1"><span className="font-black text-white">Maintien</span><Activity size={18} className={profile.goal === 'maintain' ? 'text-blue-500' : 'text-zinc-500'}/></div><p className="text-[10px] text-zinc-400 font-bold">Calories = Dépense Journalière</p></div>
              <div onClick={() => setProfile({...profile, goal: 'bulk'})} className={`p-4 rounded-2xl border cursor-pointer transition-all ${profile.goal === 'bulk' ? 'bg-red-900/40 border-red-500' : 'bg-zinc-900 border-zinc-800'}`}><div className="flex justify-between items-center mb-1"><span className="font-black text-white">Lean Bulk</span><TrendingUp size={18} className={profile.goal === 'bulk' ? 'text-red-500' : 'text-zinc-500'}/></div><p className="text-[10px] text-zinc-400 font-bold">Surplus contrôlé de +10%</p></div>
            </div>
            <div className="flex gap-2 mt-6"><button onClick={() => setStep(2)} className="p-4 bg-zinc-800 rounded-2xl"><ChevronLeft size={20}/></button><button onClick={() => onComplete(profile)} className="flex-1 py-4 bg-emerald-600 text-black rounded-2xl font-black uppercase text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)]">Générer mon profil IA</button></div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
// ==========================================
// 5. COMPOSANT PRINCIPAL NUTRITION (BLINDÉ)
// ==========================================
export default function Nutrition({ onBack, dataContext }) {
  const { profile, setProfile, journal, setJournal, syncToCloud, isSyncing } = dataContext;

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [currentDateStr, setCurrentDateStr] = useState(getTodayStr());

  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem('mecanik_favorites_v1')) || []; } catch(e){ return []; }});
  const [recentFoods, setRecentFoods] = useState(() => { try { return JSON.parse(localStorage.getItem('mecanik_recents_v1')) || []; } catch(e){ return []; }});
  const [myFoods, setMyFoods] = useState(() => { try { return JSON.parse(localStorage.getItem('mecanik_my_foods_v1')) || []; } catch(e){ return []; }});
  const [activeSearchTab, setActiveSearchTab] = useState('recent'); 
  
  const [isScanningFood, setIsScanningFood] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [globalDB, setGlobalFoodDB] = useState([]); 
  const [activeMealModal, setActiveMealModal] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [newFood, setNewFood] = useState({ name: "", brand: "", cals: "", prot: "", carbs: "", fat: "", barcode: "" });
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => { localStorage.setItem('mecanik_favorites_v1', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('mecanik_recents_v1', JSON.stringify(recentFoods)); }, [recentFoods]);
  useEffect(() => { localStorage.setItem('mecanik_my_foods_v1', JSON.stringify(myFoods)); }, [myFoods]);

  useEffect(() => {
    const fetchFoodsFromCloud = async () => {
      try {
        const snapshot = await getDocs(foodsCollection);
        const foodsFromFirebase = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGlobalFoodDB(foodsFromFirebase);
      } catch (error) { console.error("Erreur DB:", error); }
    };
    fetchFoodsFromCloud();
  }, []);

  // SECURITÉ ANTI-CRASH SUR LES DONNÉES
  const currentData = useMemo(() => {
    const j = journal[currentDateStr];
    if (j && j.meals) return j;
    return {
      meals: { breakfast: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, lunch: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, dinner: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, snacks: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 } },
      activity: 0, water: 0
    };
  }, [journal, currentDateStr]);

  const { totalConsumed, totalCarbs, totalProt, totalFat } = useMemo(() => {
    const meals = Object.values(currentData?.meals || {});
    return {
      totalConsumed: meals.reduce((acc, meal) => acc + (meal?.cals || 0), 0),
      totalCarbs: meals.reduce((acc, meal) => acc + (meal?.carbs || 0), 0),
      totalProt: meals.reduce((acc, meal) => acc + (meal?.prot || 0), 0),
      totalFat: meals.reduce((acc, meal) => acc + (meal?.fat || 0), 0)
    };
  }, [currentData]);
  
  const metabolicStats = useMemo(() => profile ? calculateMifflin(profile) : { bmr: 0, tdee: 2600 }, [profile]);
  const targetGoals = useMemo(() => profile ? calculateTargetGoals(profile, metabolicStats.tdee) : { targetCalories: 2600, protein: 160, carbs: 300, fat: 80 }, [profile, metabolicStats.tdee]);
  const waterGoal = useMemo(() => profile ? Math.round(Number(profile.weight || 75) * 35) : 2500, [profile]);
  const remainingCals = targetGoals.targetCalories - totalConsumed + currentData.activity;

  const updateCurrentJournal = useCallback((newData) => setJournal(prev => ({ ...prev, [currentDateStr]: { ...currentData, ...newData } })), [currentDateStr, currentData, setJournal]);
  const handleAddWater = () => updateCurrentJournal({ water: Math.min(currentData.water + 250, waterGoal + 1000) });
  const handleRemoveWater = () => updateCurrentJournal({ water: Math.max(currentData.water - 250, 0) });

  const handleAddFoodToMeal = (food) => {
    const meal = currentData.meals[activeMealModal];
    updateCurrentJournal({
      meals: { ...currentData.meals, [activeMealModal]: { items: [...(meal.items||[]), food], cals: (meal.cals||0) + Number(food.cals||0), carbs: (meal.carbs||0) + Number(food.carbs||0), prot: (meal.prot||0) + Number(food.prot||0), fat: (meal.fat||0) + Number(food.fat||0) } }
    });
    setRecentFoods(prev => { const filtered = prev.filter(f => f.id !== food.id); return [food, ...filtered].slice(0, 20); });
    setSearchQuery("");
  };

  const toggleFavorite = (food) => {
    if (favorites.some(f => f.id === food.id)) setFavorites(favorites.filter(f => f.id !== food.id));
    else setFavorites([...favorites, food]);
  };

  const handleContributeFood = async () => {
    if (!newFood.name || !newFood.cals) return;
    setIsPublishing(true);
    const foodItem = { name: newFood.name, brand: newFood.brand, cals: Number(newFood.cals), prot: Number(newFood.prot||0), carbs: Number(newFood.carbs||0), fat: Number(newFood.fat||0), barcode: newFood.barcode || null, verified: false };
    try {
      const docRef = await addDoc(foodsCollection, foodItem);
      const addedFood = { id: docRef.id, ...foodItem };
      setGlobalFoodDB([addedFood, ...globalDB]);
      setMyFoods([addedFood, ...myFoods]); 
      if (newFood.barcode) handleAddFoodToMeal(addedFood);
      setNewFood({ name: "", brand: "", cals: "", prot: "", carbs: "", fat: "", barcode: "" });
      setShowContributeModal(false);
    } catch (error) { console.error(error); } finally { setIsPublishing(false); }
  };

  const handleScanComplete = async (barcode) => {
    setIsScanningFood(false);
    const existingInDb = globalDB.find(f => f.barcode === barcode || f.id === `off-${barcode}`);
    if (existingInDb) { handleAddFoodToMeal(existingInDb); alert(`⚡ ${existingInDb.name} ajouté !`); return; }

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1) {
        const p = data.product; const nut = p.nutriments;
        const scannedFood = {
          id: `off-${barcode}`, barcode: barcode, name: p.product_name || "Produit Scanné",
          cals: Math.round(nut['energy-kcal_100g'] || nut['energy-kcal_serving'] || 0),
          prot: Math.round(nut['proteins_100g'] || 0), carbs: Math.round(nut['carbohydrates_100g'] || 0), fat: Math.round(nut['fat_100g'] || 0), verified: true 
        };
        setGlobalFoodDB(prev => [scannedFood, ...prev]);
        handleAddFoodToMeal(scannedFood);
        alert(`✅ ${scannedFood.name} ajouté à ton repas !`);
      } else { 
        alert("Aliment introuvable. Veuillez le créer.");
        setNewFood({ name: "", brand: "", cals: "", prot: "", carbs: "", fat: "", barcode: barcode });
        setShowContributeModal(true);
      }
    } catch (e) { 
      alert("Erreur réseau. Ajout manuel."); 
      setNewFood({ name: "", brand: "", cals: "", prot: "", carbs: "", fat: "", barcode: barcode });
      setShowContributeModal(true);
    }
  };

  const changeDate = (offset) => { const d = new Date(currentDateStr); d.setDate(d.getDate() + offset); setCurrentDateStr(d.toISOString().split('T')[0]); };

  if (!profile) return <OnboardingWizard onComplete={(p) => setProfile(p)} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95"><ChevronLeft size={18}/></button>
          <h1 className="text-xl font-black tracking-tight uppercase">Nutrition</h1>
          <div className="flex gap-2">
            <button onClick={() => { setNewFood({ name: "", brand: "", cals: "", prot: "", carbs: "", fat: "", barcode: "" }); setShowContributeModal(true); }} className="p-2.5 bg-orange-600/10 text-orange-500 rounded-full border border-orange-500/20 active:scale-95"><DatabaseZap size={18} /></button>
            <button onClick={() => setShowProfileModal(true)} className="p-2.5 bg-cyan-600/10 text-cyan-500 rounded-full border border-cyan-500/20 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.2)]"><User size={18} /></button>
          </div>
        </div>
        <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-full border border-zinc-800">
          <button onClick={() => changeDate(-1)} className="p-1 text-zinc-400 hover:text-white"><ChevronLeft size={18}/></button>
          <span className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2"><CalendarIcon size={12}/> {currentDateStr === getTodayStr() ? "Aujourd'hui" : new Date(currentDateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <button onClick={() => changeDate(1)} className="p-1 text-zinc-400 hover:text-white"><ChevronRight size={18}/></button>
        </div>
      </header>

      <motion.main drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(e, info) => { if (info.offset.x > 100) changeDate(-1); if (info.offset.x < -100) changeDate(1); }} key={currentDateStr} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0.4 }} className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">
        <section className="bg-[#151517] rounded-[32px] p-6 border border-[#222225] shadow-2xl pointer-events-none">
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col items-center gap-2"><CircularGauge value={totalConsumed} max={targetGoals.targetCalories} color="#3B82F6" icon={Utensils} size={60} /><span className="text-[10px] font-black uppercase text-blue-500 mt-2">{Math.round(totalConsumed)}</span></div>
            <div className="flex flex-col items-center justify-center"><span className="text-5xl font-black tracking-tighter">{Math.round(remainingCals)}</span><span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Kcal Restantes</span></div>
            <div className="flex flex-col items-center gap-2"><CircularGauge value={currentData.activity} max={1000} color="#EF4444" icon={Flame} size={60} /><span className="text-[10px] font-black uppercase text-red-500 mt-2">{currentData.activity}</span></div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-zinc-800 pt-6">
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Glucides</span><div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${Math.min((totalCarbs/(targetGoals.carbs||1))*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalCarbs)} <span className="text-[9px] text-zinc-500">/ {targetGoals.carbs}g</span></span></div>
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Protéines</span><div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min((totalProt/(targetGoals.protein||1))*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalProt)} <span className="text-[9px] text-zinc-500">/ {targetGoals.protein}g</span></span></div>
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Lipides</span><div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${Math.min((totalFat/(targetGoals.fat||1))*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalFat)} <span className="text-[9px] text-zinc-500">/ {targetGoals.fat}g</span></span></div>
          </div>
        </section>

        <section>
          <div className="space-y-3">
            {[ { id: 'breakfast', name: 'Petit-déjeuner', icon: Coffee }, { id: 'lunch', name: 'Déjeuner', icon: Utensils }, { id: 'dinner', name: 'Dîner', icon: Moon }, { id: 'snacks', name: 'Snacks', icon: Cookie } ].map(meal => (
              <div key={meal.id} onClick={() => setActiveMealModal(meal.id)} className="bg-[#151517] border border-[#222225] rounded-[24px] p-4 flex flex-col active:scale-95 transition-transform cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4"><div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center"><meal.icon size={20} className="text-zinc-400"/></div><div><p className="font-bold text-sm text-white">{meal.name}</p><p className="text-[11px] font-mono text-blue-500 font-bold">{Math.round(currentData.meals[meal.id]?.cals || 0)} Kcal</p></div></div>
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-500"><Plus size={16}/></div>
                </div>
                {(currentData.meals[meal.id]?.items?.length > 0) && <p className="text-[10px] text-zinc-500 mt-3 truncate">{currentData.meals[meal.id].items.map(i => i.name).join(", ")}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#151517] border border-[#222225] rounded-[32px] p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
             <div><h3 className="font-bold text-lg mb-1">Hydratation</h3><p className="text-[11px] font-black text-cyan-500 uppercase">{currentData.water} / {waterGoal} ml</p></div>
             {currentData.water > 0 && <button onClick={handleRemoveWater} className="text-[10px] text-zinc-500 underline uppercase">Annuler</button>}
          </div>
          <div className="flex justify-between items-center gap-1">
             {[...Array(8)].map((_, i) => {
               const isFilled = currentData.water >= (i + 1) * (waterGoal/8);
               return <button key={i} onClick={handleAddWater} className="active:scale-90 p-1"><Droplet size={28} fill={isFilled ? "#06B6D4" : "transparent"} stroke={isFilled ? "#06B6D4" : "#3f3f46"} /></button>
             })}
          </div>
        </section>
      </motion.main>

      <AnimatePresence>
        {showProfileModal && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-black uppercase flex items-center gap-2"><BrainCircuit size={20} className="text-cyan-500"/> Fiche IA</h2>
              <div className="flex gap-3">
                <button onClick={() => setIsEditingProfile(!isEditingProfile)} className={`p-2 rounded-full transition-colors ${isEditingProfile ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}><Settings size={20}/></button>
                <button onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); }} className="p-2 bg-zinc-800 rounded-full"><X size={20}/></button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Poids (kg)</span><input type="number" value={profile.weight} onChange={e=>setProfile({...profile, weight: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
                    <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Gras (%)</span><input type="number" value={profile.bodyFat} onChange={e=>setProfile({...profile, bodyFat: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-2xl">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold mb-2 block">Stratégie Nutritionnelle</span>
                    <select value={profile.goal} onChange={e=>setProfile({...profile, goal: e.target.value})} className="bg-transparent w-full font-black text-lg outline-none text-blue-400">
                      <option value="cut">Sèche / Perte (-15%)</option>
                      <option value="maintain">Maintien (Équilibre)</option>
                      <option value="bulk">Prise Masse (+10%)</option>
                    </select>
                  </div>
                  <button onClick={() => setIsEditingProfile(false)} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-xs shadow-lg mt-6">Terminer l'édition</button>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/20 p-5 rounded-[24px] border border-cyan-500/30">
                    <div className="flex justify-between items-start">
                       <span className="text-[10px] uppercase font-black tracking-widest text-cyan-500">Profil IA</span>
                       <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded font-bold uppercase">{profile.goal}</span>
                    </div>
                    <p className="text-2xl font-black mt-1 text-white">{simulateRandomForest(profile).type}</p>
                    <p className="text-xs text-cyan-200 mt-2 border-l-2 border-cyan-500 pl-2">{simulateRandomForest(profile).focus}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><Flame size={20} className="text-red-500 mb-2"/><p className="text-[10px] text-zinc-500 uppercase font-bold">Cible Jour</p><p className="text-xl font-black">{targetGoals.targetCalories} kcal</p></div>
                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><Activity size={20} className="text-blue-500 mb-2"/><p className="text-[10px] text-zinc-500 uppercase font-bold">TDEE</p><p className="text-xl font-black">{metabolicStats.tdee} kcal</p></div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMealModal && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-black uppercase">Recherche</h2>
              <button onClick={() => { setActiveMealModal(null); setSearchQuery(''); setActiveSearchTab('recent'); }} className="p-2 bg-zinc-800 rounded-full active:scale-90 transition-transform"><X size={20}/></button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-3 bg-zinc-900 p-4 rounded-2xl mb-4 border border-zinc-800 shadow-inner">
                <Search size={20} className="text-zinc-500" />
                <input type="text" placeholder="Aliment, repas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent font-bold text-white outline-none w-full placeholder:text-zinc-600" autoFocus />
                <button onClick={() => setIsScanningFood(true)} className="active:scale-90 transition-transform p-1 bg-emerald-500/10 rounded-lg"><ScanBarcode size={24} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" /></button>
              </div>

              {!searchQuery && (
                <>
                  <div className="bg-[#151517] p-4 rounded-2xl border border-[#222225] mb-4 shadow-xl">
                    <div className="flex justify-between items-center mb-3 border-b border-zinc-800/50 pb-2"><span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Aperçu Jour</span><span className="text-xs font-black text-blue-500">{Math.round(totalConsumed)} / {targetGoals.targetCalories} kcal</span></div>
                    <div className="flex justify-between text-center px-2">
                      <div><p className="text-[9px] uppercase text-zinc-500 font-bold mb-1">G</p><p className="text-xs font-black text-white">{Math.round(totalCarbs)}</p></div>
                      <div><p className="text-[9px] uppercase text-zinc-500 font-bold mb-1">P</p><p className="text-xs font-black text-white">{Math.round(totalProt)}</p></div>
                      <div><p className="text-[9px] uppercase text-zinc-500 font-bold mb-1">L</p><p className="text-xs font-black text-white">{Math.round(totalFat)}</p></div>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4 bg-[#151517] p-1.5 rounded-2xl border border-[#222225] shadow-inner">
                    <button onClick={() => setActiveSearchTab('recent')} className={`flex-1 py-3 rounded-xl flex justify-center transition-all ${activeSearchTab === 'recent' ? 'bg-[#222225] text-white border border-zinc-800' : 'text-zinc-500'}`}><History size={18} /></button>
                    <button onClick={() => setActiveSearchTab('favorites')} className={`flex-1 py-3 rounded-xl flex justify-center transition-all ${activeSearchTab === 'favorites' ? 'bg-[#222225] text-red-500 border border-zinc-800' : 'text-zinc-500'}`}><Heart size={18} fill={activeSearchTab === 'favorites' ? 'currentColor' : 'none'} /></button>
                    <button onClick={() => setActiveSearchTab('my')} className={`flex-1 py-3 rounded-xl flex justify-center transition-all ${activeSearchTab === 'my' ? 'bg-[#222225] text-emerald-500 border border-zinc-800' : 'text-zinc-500'}`}><Bookmark size={18} fill={activeSearchTab === 'my' ? 'currentColor' : 'none'} /></button>
                  </div>
                </>
              )}

              <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                {(() => {
                  let listToRender = [];
                  if (searchQuery) {
                    listToRender = globalDB.filter(f => f?.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20);
                    if (listToRender.length === 0) return <p className="text-center text-zinc-500 font-bold text-xs mt-10 uppercase tracking-widest">Aucun résultat trouvé.</p>;
                  } else {
                    if (activeSearchTab === 'recent') listToRender = recentFoods;
                    else if (activeSearchTab === 'favorites') listToRender = favorites;
                    else if (activeSearchTab === 'my') listToRender = myFoods;
                    if (listToRender.length === 0) return <p className="text-center text-zinc-500 font-bold text-xs mt-10 uppercase tracking-widest">Liste vide.</p>;
                  }

                  return listToRender.map((food, idx) => {
                    const isFav = favorites.some(f => f.id === food.id);
                    return (
                      <div key={`${food.id}-${idx}`} className="bg-[#151517] p-4 rounded-2xl flex justify-between items-center border border-zinc-800">
                        <div className="flex-1 pr-4">
                          <p className="font-bold text-sm text-white flex items-center gap-2">{food.name} {food.verified && <CheckCircle2 size={14} className="text-blue-500"/>}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{food.cals} Kcal • {food.carbs}g G • {food.prot}g P</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleFavorite(food)} className={`p-2 rounded-full active:scale-90 ${isFav ? 'text-red-500 bg-red-500/10' : 'text-zinc-600 bg-zinc-800'}`}><Heart size={16} fill={isFav ? "currentColor" : "none"} /></button>
                          <button onClick={() => handleAddFoodToMeal(food)} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center active:scale-90"><Plus size={20}/></button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isScanningFood && <LiveBarcodeScanner onScanComplete={handleScanComplete} onClose={() => setIsScanningFood(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showContributeModal && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-2"><h2 className="text-lg font-black uppercase tracking-tighter">Ajout Manuel</h2></div>
              <button onClick={() => setShowContributeModal(false)} className="p-2 bg-zinc-800 rounded-full active:scale-90"><X size={20}/></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-6">
              {newFood.barcode && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-3">
                  <ScanBarcode size={20} className="text-emerald-500" />
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Code-barres lié : {newFood.barcode}</p>
                </div>
              )}
              <div className="space-y-4">
                <div className="flex flex-col bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Nom</span><input type="text" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} className="bg-transparent font-bold text-white text-lg outline-none w-full" /></div>
                <div className="flex flex-col bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Calories (Kcal)</span><input type="number" value={newFood.cals} onChange={e => setNewFood({...newFood, cals: e.target.value})} className="bg-transparent font-black text-white text-xl outline-none w-full" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col bg-zinc-900 p-3 rounded-2xl border border-zinc-800"><span className="text-[9px] font-black uppercase text-yellow-500 mb-1">Glucides</span><input type="number" value={newFood.carbs} onChange={e => setNewFood({...newFood, carbs: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" /></div>
                  <div className="flex flex-col bg-zinc-900 p-3 rounded-2xl border border-zinc-800"><span className="text-[9px] font-black uppercase text-blue-500 mb-1">Protéines</span><input type="number" value={newFood.prot} onChange={e => setNewFood({...newFood, prot: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" /></div>
                  <div className="flex flex-col bg-zinc-900 p-3 rounded-2xl border border-zinc-800"><span className="text-[9px] font-black uppercase text-red-500 mb-1">Lipides</span><input type="number" value={newFood.fat} onChange={e => setNewFood({...newFood, fat: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" /></div>
                </div>
              </div>
              <button onClick={handleContributeFood} disabled={isPublishing} className={`w-full py-5 rounded-full font-black uppercase text-xs shadow-xl active:scale-95 ${newFood.name && newFood.cals ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                {isPublishing ? <RefreshCw size={16} className="animate-spin" /> : "Sauvegarder l'aliment"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
