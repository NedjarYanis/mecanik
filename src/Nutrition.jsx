import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Flame, Plus, Beef, Wheat, Droplet, 
  Coffee, Utensils, Moon, Cookie, Activity, X, 
  Search, CheckCircle2, Globe, DatabaseZap, CloudLightning, RefreshCw,
  User, Calendar as CalendarIcon, TrendingDown, BrainCircuit, Info, Settings, TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
// 2. MOTEUR D'ANALYSE MÉTABOLIQUE (IA & MATHS)
// ==========================================

// Équation de Mifflin-St Jeor
const calculateMifflin = (profile) => {
  let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
  bmr += profile.gender === 'M' ? 5 : -161;
  const multipliers = { 'Sédentaire': 1.2, 'Léger': 1.375, 'Modéré': 1.55, 'Intense': 1.725 };
  const tdee = bmr * (multipliers[profile.activityLevel] || 1.55);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee) };
};

// Calculateur d'Objectifs (Sèche, Maintien, Prise de masse)
const calculateTargetGoals = (profile, tdee) => {
  let targetCalories = tdee;
  let multiplier = 1;
  if (profile.goal === 'cut') multiplier = 0.85; // Déficit 15%
  if (profile.goal === 'bulk') multiplier = 1.10; // Surplus 10%
  
  targetCalories = Math.round(tdee * multiplier);

  // Macros Scientifiques
  const protein = Math.round(profile.weight * 2.2); // 2.2g par kg de poids de corps pour préserver/construire le muscle
  const fat = Math.round((targetCalories * 0.25) / 9); // 25% des calories allouées aux lipides
  const remainingCals = targetCalories - (protein * 4) - (fat * 9);
  const carbs = Math.max(0, Math.round(remainingCals / 4)); // Le reste en glucides

  return { targetCalories, protein, fat, carbs, multiplier };
};

// Classification Random Forest (Arbre de décision)
const simulateRandomForest = (profile) => {
  const fat = profile.bodyFat;
  const bmi = profile.weight / Math.pow(profile.height / 100, 2);
  
  if (fat > 25 && bmi > 25) return { type: "Endomorphe Lourd", risk: "Élevé", focus: "Déficit calorique strict, Focus Lipides bas." };
  if (fat <= 15 && bmi < 22) return { type: "Ectomorphe Rapide", risk: "Faible", focus: "Surplus calorique, Hyper-protéiné." };
  if (fat >= 15 && fat <= 25 && bmi >= 22 && bmi <= 25) return { type: "Mésomorphe Équilibré", risk: "Modéré", focus: "Recomposition corporelle." };
  return { type: "Profil Atypique", risk: "À surveiller", focus: "Ajustement progressif des macros." };
};

// Régression Linéaire Multiple (Prédiction de poids)
const simulateLinearRegression = (profile, tdee) => {
  const target = calculateTargetGoals(profile, tdee).targetCalories;
  const dailyDiff = target - tdee; // Négatif si déficit, Positif si surplus
  // 7000 kcal = ~1kg de tissu adipeux/musculaire
  const weeklyChange = (dailyDiff * 7) / 7000; 
  const prediction30Days = (profile.weight + (weeklyChange * 4.2)).toFixed(1);

  return {
    prediction30Days,
    trend: dailyDiff < 0 ? 'Baisse' : dailyDiff > 0 ? 'Hausse' : 'Stagnation',
    weeklyChange: Math.abs(weeklyChange).toFixed(2)
  };
};

// ==========================================
// COMPOSANTS VISUELS
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
// ONBOARDING WIZARD (Première Connexion)
// ==========================================
function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    age: 25, gender: 'M', weight: 75, height: 175, activityLevel: 'Modéré',
    bodyFat: 15, muscleMass: 40, boneMass: 3, hydration: 60, goal: 'maintain'
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black text-white flex flex-col p-6 overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        <div className="text-center">
          <BrainCircuit size={48} className="text-blue-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-black uppercase tracking-tighter">Étalonnage<br/>Métabolique</h1>
          <p className="text-zinc-400 text-sm mt-2">L'IA de MÉCANIK a besoin de vos biométries.</p>
        </div>

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
            <h2 className="text-xs font-black uppercase tracking-widest text-cyan-500">2. Composition (Options)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-4 rounded-2xl border border-blue-900/30"><span className="text-[10px] uppercase text-zinc-500 font-bold">Masse Grasse (%)</span><input type="number" value={profile.bodyFat} onChange={e=>setProfile({...profile, bodyFat: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none text-blue-400" /></div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-red-900/30"><span className="text-[10px] uppercase text-zinc-500 font-bold">Muscle (kg)</span><input type="number" value={profile.muscleMass} onChange={e=>setProfile({...profile, muscleMass: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none text-red-400" /></div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-700/50"><span className="text-[10px] uppercase text-zinc-500 font-bold">Os (kg)</span><input type="number" value={profile.boneMass} onChange={e=>setProfile({...profile, boneMass: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-cyan-900/30"><span className="text-[10px] uppercase text-zinc-500 font-bold">Eau (%)</span><input type="number" value={profile.hydration} onChange={e=>setProfile({...profile, hydration: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none text-cyan-400" /></div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setStep(1)} className="p-4 bg-zinc-800 rounded-2xl"><ChevronLeft size={20}/></button>
               <button onClick={() => setStep(3)} className="flex-1 py-4 bg-cyan-600 text-black rounded-2xl font-black uppercase text-xs">Suivant</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500">3. Stratégie Nutritionnelle</h2>
            
            <div className="space-y-3">
              <div onClick={() => setProfile({...profile, goal: 'cut'})} className={`p-4 rounded-2xl border cursor-pointer transition-all ${profile.goal === 'cut' ? 'bg-emerald-900/40 border-emerald-500' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex justify-between items-center mb-1"><span className="font-black text-white">Sèche / Perte de Poids</span><TrendingDown size={18} className={profile.goal === 'cut' ? 'text-emerald-500' : 'text-zinc-500'}/></div>
                <p className="text-[10px] text-zinc-400 font-bold">Déficit contrôlé de -15%</p>
              </div>
              <div onClick={() => setProfile({...profile, goal: 'maintain'})} className={`p-4 rounded-2xl border cursor-pointer transition-all ${profile.goal === 'maintain' ? 'bg-blue-900/40 border-blue-500' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex justify-between items-center mb-1"><span className="font-black text-white">Maintien (Stabilité)</span><Activity size={18} className={profile.goal === 'maintain' ? 'text-blue-500' : 'text-zinc-500'}/></div>
                <p className="text-[10px] text-zinc-400 font-bold">Calories = Dépense Journalière</p>
              </div>
              <div onClick={() => setProfile({...profile, goal: 'bulk'})} className={`p-4 rounded-2xl border cursor-pointer transition-all ${profile.goal === 'bulk' ? 'bg-red-900/40 border-red-500' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex justify-between items-center mb-1"><span className="font-black text-white">Prise de Masse (Lean Bulk)</span><TrendingUp size={18} className={profile.goal === 'bulk' ? 'text-red-500' : 'text-zinc-500'}/></div>
                <p className="text-[10px] text-zinc-400 font-bold">Surplus contrôlé de +10%</p>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex gap-3 items-start mt-4">
              <Info size={20} className="text-zinc-500 shrink-0" />
              <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                <strong>Justification Scientifique :</strong> MÉCANIK plafonne le surplus à +10/15% pour éviter la lipogenèse excessive (Dirty Bulk), et limite le déficit à -15/20% pour prévenir le catabolisme musculaire et le ralentissement métabolique.
              </p>
            </div>

            <div className="flex gap-2 mt-6">
               <button onClick={() => setStep(2)} className="p-4 bg-zinc-800 rounded-2xl"><ChevronLeft size={20}/></button>
               <button onClick={() => onComplete(profile)} className="flex-1 py-4 bg-emerald-600 text-black rounded-2xl font-black uppercase text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)]">Générer mon profil IA</button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
// ==========================================
// COMPOSANT PRINCIPAL NUTRITION
// ==========================================
export default function Nutrition({ onBack }) {
  // 1. ÉTATS : Profil Utilisateur
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('mecanik_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false); // Mode édition

  // 2. ÉTATS : Journal Temporel (Navigation par Jour)
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [currentDateStr, setCurrentDateStr] = useState(getTodayStr());
  
  const [journal, setJournal] = useState(() => {
    const saved = localStorage.getItem('mecanik_nutrition_journal_v3');
    if (saved) return JSON.parse(saved);
    return {
      [getTodayStr()]: {
        meals: { breakfast: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, lunch: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, dinner: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, snacks: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 } },
        activity: 0, water: 0
      }
    };
  });

  const currentData = journal[currentDateStr] || {
    meals: { breakfast: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, lunch: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, dinner: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, snacks: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 } },
    activity: 0, water: 0
  };

  // Sauvegardes locales
  useEffect(() => { if (profile) localStorage.setItem('mecanik_user_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('mecanik_nutrition_journal_v3', JSON.stringify(journal)); }, [journal]);

  // 3. ÉTATS : Cloud & Recherche
  const [globalDB, setGlobalFoodDB] = useState([]);
  const [activeMealModal, setActiveMealModal] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFoodsFromCloud = async () => {
      try {
        const snapshot = await getDocs(foodsCollection);
        const foodsFromFirebase = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGlobalFoodDB(foodsFromFirebase.length === 0 ? [] : foodsFromFirebase);
      } catch (error) { console.error(error); }
    };
    fetchFoodsFromCloud();
  }, []);

  // 4. CALCULS GLOBAUX & DYNAMIQUES DU JOUR ACTUEL
  const totalConsumed = Object.values(currentData.meals).reduce((acc, meal) => acc + meal.cals, 0);
  const totalCarbs = Object.values(currentData.meals).reduce((acc, meal) => acc + meal.carbs, 0);
  const totalProt = Object.values(currentData.meals).reduce((acc, meal) => acc + meal.prot, 0);
  const totalFat = Object.values(currentData.meals).reduce((acc, meal) => acc + meal.fat, 0);
  
  // IA & MATHS : Recalcul en direct selon le profil et la stratégie
  const metabolicStats = profile ? calculateMifflin(profile) : { bmr: 0, tdee: 2600 };
  const targetGoals = profile ? calculateTargetGoals(profile, metabolicStats.tdee) : { targetCalories: 2600, protein: 160, carbs: 300, fat: 80 };
  const waterGoal = profile ? Math.round(profile.weight * 35) : 2500;
  
  // Reste à manger = Objectif Ciblé - Consommé + Brûlé (Le sport redonne des calories à manger)
  const remainingCals = targetGoals.targetCalories - totalConsumed + currentData.activity;

  // 5. ACTIONS NUTRITION
  const updateCurrentJournal = (newData) => setJournal(prev => ({ ...prev, [currentDateStr]: { ...currentData, ...newData } }));
  const handleAddWater = () => updateCurrentJournal({ water: Math.min(currentData.water + 250, waterGoal + 1000) });
  const handleRemoveWater = () => updateCurrentJournal({ water: Math.max(currentData.water - 250, 0) });

  const handleAddFoodToMeal = (food) => {
    const meal = currentData.meals[activeMealModal];
    updateCurrentJournal({
      meals: { ...currentData.meals, [activeMealModal]: { items: [...meal.items, food], cals: meal.cals + food.cals, carbs: meal.carbs + food.carbs, prot: meal.prot + food.prot, fat: meal.fat + food.fat } }
    });
    setSearchQuery("");
  };

  // 6. GESTION DU SWIPE TEMPOREL (Changement de date)
  const changeDate = (offset) => {
    const d = new Date(currentDateStr); d.setDate(d.getDate() + offset); setCurrentDateStr(d.toISOString().split('T')[0]);
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) changeDate(-1); 
    if (info.offset.x < -100) changeDate(1); 
  };

  // --- RENDU ---
  if (!profile) return <OnboardingWizard onComplete={(p) => setProfile(p)} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      
      {/* HEADER AVEC BOUTONS ACCÈS RAPIDE */}
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95"><ChevronLeft size={18}/></button>
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-black tracking-tight uppercase">Nutrition</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowProfileModal(true)} className="p-2.5 bg-cyan-600/10 text-cyan-500 rounded-full border border-cyan-500/20 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <User size={18} />
            </button>
          </div>
        </div>

        {/* NAVIGATION TEMPORELLE */}
        <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-full border border-zinc-800">
          <button onClick={() => changeDate(-1)} className="p-1 text-zinc-400 hover:text-white"><ChevronLeft size={18}/></button>
          <span className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
            <CalendarIcon size={12}/> 
            {currentDateStr === getTodayStr() ? "Aujourd'hui" : new Date(currentDateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <button onClick={() => changeDate(1)} className="p-1 text-zinc-400 hover:text-white"><ChevronRight size={18}/></button>
        </div>
      </header>

      {/* ZONE SWIPEABLE (Le journal du jour) */}
      <motion.main drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleDragEnd} key={currentDateStr} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0.4 }} className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">
        
        {/* 1. TABLEAU DE BORD (CALORIES & MACROS DYNAMIQUES) */}
        <section className="bg-[#151517] rounded-[32px] p-6 border border-[#222225] shadow-2xl pointer-events-none">
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col items-center gap-2">
              <CircularGauge value={totalConsumed} max={targetGoals.targetCalories} color="#3B82F6" icon={Utensils} size={60} />
              <span className="text-[10px] font-black uppercase text-blue-500 mt-2">{Math.round(totalConsumed)}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-5xl font-black tracking-tighter">{Math.round(remainingCals)}</span>
              <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">Kcal Restantes</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CircularGauge value={currentData.activity} max={1000} color="#EF4444" icon={Flame} size={60} />
              <span className="text-[10px] font-black uppercase text-red-500 mt-2">{currentData.activity}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-zinc-800 pt-6">
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Glucides</span><div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${Math.min((totalCarbs/targetGoals.carbs)*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalCarbs)} <span className="text-[9px] text-zinc-500">/ {targetGoals.carbs}g</span></span></div>
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Protéines</span><div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min((totalProt/targetGoals.protein)*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalProt)} <span className="text-[9px] text-zinc-500">/ {targetGoals.protein}g</span></span></div>
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Lipides</span><div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${Math.min((totalFat/targetGoals.fat)*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalFat)} <span className="text-[9px] text-zinc-500">/ {targetGoals.fat}g</span></span></div>
          </div>
        </section>

        {/* 2. REPAS */}
        <section>
          <div className="space-y-3">
            {[ { id: 'breakfast', name: 'Petit-déj', icon: Coffee }, { id: 'lunch', name: 'Déjeuner', icon: Utensils }, { id: 'dinner', name: 'Dîner', icon: Moon }, { id: 'snacks', name: 'Snacks', icon: Cookie } ].map(meal => (
              <div key={meal.id} onClick={() => setActiveMealModal(meal.id)} className="bg-[#151517] border border-[#222225] rounded-[24px] p-4 flex flex-col active:scale-95 transition-transform cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4"><div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center"><meal.icon size={20} className="text-zinc-400"/></div><div><p className="font-bold text-sm text-white">{meal.name}</p><p className="text-[11px] font-mono text-blue-500 font-bold">{Math.round(currentData.meals[meal.id].cals)} Kcal</p></div></div>
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-500"><Plus size={16}/></div>
                </div>
                {currentData.meals[meal.id].items.length > 0 && <p className="text-[10px] text-zinc-500 mt-3 truncate">{currentData.meals[meal.id].items.map(i => i.name).join(", ")}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* 3. EAU */}
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

      {/* ==================================================== */}
      {/* MODAL 1 : FICHE MÉTABOLIQUE & ÉDITION (IA)             */}
      {/* ==================================================== */}
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
              
              {/* MODE ÉDITION EN TEMPS RÉEL */}
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="bg-blue-900/20 p-4 rounded-2xl border border-blue-500/30 flex gap-3"><Info size={20} className="text-blue-500 shrink-0"/><p className="text-[10px] text-blue-200">Les modifications ci-dessous recalculent instantanément vos objectifs caloriques et algorithmes.</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Poids (kg)</span><input type="number" value={profile.weight} onChange={e=>setProfile({...profile, weight: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
                    <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Gras (%)</span><input type="number" value={profile.bodyFat} onChange={e=>setProfile({...profile, bodyFat: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-2xl">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold mb-2 block">Stratégie Nutritionnelle</span>
                    <select value={profile.goal} onChange={e=>setProfile({...profile, goal: e.target.value})} className="bg-transparent w-full font-black text-lg outline-none text-blue-400">
                      <option value="cut">Sèche / Perte de Poids (-15%)</option>
                      <option value="maintain">Maintien (Équilibre)</option>
                      <option value="bulk">Prise de Masse (+10%)</option>
                    </select>
                  </div>
                  <button onClick={() => setIsEditingProfile(false)} className="w-full py-4 bg-white text-black rounded-full font-black uppercase text-xs">Terminer l'édition</button>
                </div>
              ) : (
                /* MODE AFFICHAGE IA */
                <>
                  <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/20 p-5 rounded-[24px] border border-cyan-500/30">
                    <div className="flex justify-between items-start">
                       <span className="text-[10px] uppercase font-black tracking-widest text-cyan-500">Profil Random Forest</span>
                       <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded font-bold uppercase">{profile.goal === 'cut' ? 'Sèche' : profile.goal === 'bulk' ? 'Bulk' : 'Maintien'}</span>
                    </div>
                    <p className="text-2xl font-black mt-1 text-white">{simulateRandomForest(profile).type}</p>
                    <p className="text-xs text-cyan-200 mt-2 border-l-2 border-cyan-500 pl-2">{simulateRandomForest(profile).focus}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><Flame size={20} className="text-red-500 mb-2"/><p className="text-[10px] text-zinc-500 uppercase font-bold">Cible Journalière</p><p className="text-xl font-black">{targetGoals.targetCalories} kcal</p></div>
                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><Activity size={20} className="text-blue-500 mb-2"/><p className="text-[10px] text-zinc-500 uppercase font-bold">Maintien (TDEE)</p><p className="text-xl font-black">{metabolicStats.tdee} kcal</p></div>
                  </div>

                  <div className="bg-zinc-900 p-5 rounded-[24px] border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1"><TrendingDown size={12}/> Prédiction à 30 Jours</span>
                      <p className="text-xl font-black text-white mt-1">{simulateLinearRegression(profile, metabolicStats.tdee).prediction30Days} kg</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 uppercase">Tendance</span>
                      <p className={`text-sm font-bold ${simulateLinearRegression(profile, metabolicStats.tdee).trend === 'Baisse' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {simulateLinearRegression(profile, metabolicStats.tdee).trend}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL 2 : RECHERCHE (Aliments)                         */}
      {/* ==================================================== */}
      <AnimatePresence>
        {activeMealModal && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-black uppercase">Recherche</h2>
              <button onClick={() => setActiveMealModal(null)} className="p-2 bg-zinc-800 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-3 bg-zinc-900 p-4 rounded-2xl mb-4"><Search size={20} className="text-zinc-500" /><input type="text" placeholder="Poulet, Flocons..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent font-bold text-white outline-none w-full" autoFocus /></div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {globalDB.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10).map(food => (
                  <div key={food.id} className="bg-[#151517] p-4 rounded-2xl flex justify-between items-center border border-zinc-800">
                    <div><p className="font-bold text-sm text-white flex gap-2">{food.name} {food.verified ? <CheckCircle2 size={14} className="text-blue-500"/> : <Globe size={14} className="text-orange-500"/>}</p><p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{food.cals} Kcal • {food.carbs}g G • {food.prot}g P</p></div>
                    <button onClick={() => handleAddFoodToMeal(food)} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"><Plus size={20}/></button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}