import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Flame, Plus, Beef, Wheat, Droplet, 
  Coffee, Utensils, Moon, Cookie, Activity, X, 
  Search, CheckCircle2, Globe, DatabaseZap, CloudLightning, RefreshCw,
  User, Calendar as CalendarIcon, TrendingDown, BrainCircuit, Info, Settings, TrendingUp,
  History, Heart, Bookmark, ScanBarcode
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Html5QrcodeScanner } from 'html5-qrcode'; // IMPORT DU SCANNER

// ==========================================
// 1. CONFIGURATION CLOUD FIREBASE
// ==========================================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

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
const auth = getAuth(app);
const foodsCollection = collection(db, 'foods');

// ==========================================
// BASE DE DONNÉES INTÉGRÉE (LES 50 ALIMENTS)
// ==========================================
const INITIAL_GLOBAL_DB = [
  { id: '1', name: "Blanc de Poulet (cru)", cals: 110, prot: 23, carbs: 0, fat: 1.5, verified: true },
  { id: '2', name: "Riz Basmati (cru)", cals: 350, prot: 8, carbs: 77, fat: 1, verified: true },
  { id: '3', name: "Flocons d'avoine", cals: 370, prot: 13, carbs: 60, fat: 7, verified: true },
  { id: '4', name: "Oeuf entier", cals: 145, prot: 12, carbs: 1, fat: 10, verified: true },
  { id: '5', name: "Pâtes (crues)", cals: 350, prot: 12, carbs: 72, fat: 1.5, verified: true },
  { id: '6', name: "Whey Protein (Isolate)", cals: 360, prot: 85, carbs: 3, fat: 1, verified: true },
  { id: '7', name: "Saumon (frais)", cals: 200, prot: 20, carbs: 0, fat: 13, verified: true },
  { id: '8', name: "Bœuf haché 5%", cals: 125, prot: 21, carbs: 0, fat: 5, verified: true },
  { id: '9', name: "Lentilles corail (crues)", cals: 360, prot: 25, carbs: 55, fat: 2, verified: true },
  { id: '10', name: "Amandes", cals: 600, prot: 21, carbs: 9, fat: 50, verified: true },
  { id: '11', name: "Avocat", cals: 160, prot: 2, carbs: 9, fat: 15, verified: true },
  { id: '12', name: "Banane", cals: 89, prot: 1, carbs: 23, fat: 0.3, verified: true },
  { id: '13', name: "Pomme", cals: 52, prot: 0.3, carbs: 14, fat: 0.2, verified: true },
  { id: '14', name: "Beurre de cacahuète", cals: 590, prot: 25, carbs: 16, fat: 50, verified: true },
  { id: '15', name: "Skyr 0%", cals: 57, prot: 10, carbs: 4, fat: 0, verified: true },
  { id: '16', name: "Thon en boîte (eau)", cals: 110, prot: 25, carbs: 0, fat: 1, verified: true },
  { id: '17', name: "Patate douce (crue)", cals: 86, prot: 1.6, carbs: 20, fat: 0.1, verified: true },
  { id: '18', name: "Pomme de terre (crue)", cals: 77, prot: 2, carbs: 17, fat: 0.1, verified: true },
  { id: '19', name: "Quinoa (cru)", cals: 370, prot: 14, carbs: 64, fat: 6, verified: true },
  { id: '20', name: "Pois chiches (en boîte)", cals: 140, prot: 7, carbs: 20, fat: 2.5, verified: true },
  { id: '21', name: "Haricots rouges (boîte)", cals: 110, prot: 8, carbs: 15, fat: 0.5, verified: true },
  { id: '22', name: "Tofu ferme", cals: 144, prot: 15, carbs: 3, fat: 8, verified: true },
  { id: '23', name: "Lait demi-écrémé", cals: 47, prot: 3.3, carbs: 4.8, fat: 1.5, verified: true },
  { id: '24', name: "Lait d'amande (sans sucre)", cals: 15, prot: 0.5, carbs: 0.3, fat: 1.1, verified: true },
  { id: '25', name: "Huile d'olive", cals: 884, prot: 0, carbs: 0, fat: 100, verified: true },
  { id: '26', name: "Noix de cajou", cals: 553, prot: 18, carbs: 30, fat: 44, verified: true },
  { id: '27', name: "Noix", cals: 654, prot: 15, carbs: 14, fat: 65, verified: true },
  { id: '28', name: "Pain complet", cals: 250, prot: 10, carbs: 40, fat: 3, verified: true },
  { id: '29', name: "Galette de riz", cals: 380, prot: 8, carbs: 80, fat: 3, verified: true },
  { id: '30', name: "Blanc de Dinde", cals: 105, prot: 24, carbs: 0, fat: 1, verified: true },
  { id: '31', name: "Bœuf (Steak 15%)", cals: 215, prot: 19, carbs: 0, fat: 15, verified: true },
  { id: '32', name: "Maquereau", cals: 260, prot: 19, carbs: 0, fat: 20, verified: true },
  { id: '33', name: "Sardines (huile)", cals: 210, prot: 24, carbs: 0, fat: 12, verified: true },
  { id: '34', name: "Crevettes (cuites)", cals: 100, prot: 24, carbs: 0, fat: 0.3, verified: true },
  { id: '35', name: "Yaourt nature", cals: 60, prot: 4, carbs: 5, fat: 3, verified: true },
  { id: '36', name: "Mozzarella", cals: 280, prot: 28, carbs: 2, fat: 17, verified: true },
  { id: '37', name: "Emmental", cals: 370, prot: 28, carbs: 0, fat: 29, verified: true },
  { id: '38', name: "Riz complet (cru)", cals: 360, prot: 8, carbs: 74, fat: 3, verified: true },
  { id: '39', name: "Semoule (crue)", cals: 360, prot: 12, carbs: 73, fat: 1.5, verified: true },
  { id: '40', name: "Miel", cals: 304, prot: 0.3, carbs: 82, fat: 0, verified: true },
  { id: '41', name: "Chocolat noir 70%", cals: 600, prot: 8, carbs: 35, fat: 42, verified: true },
  { id: '42', name: "Framboises", cals: 52, prot: 1.2, carbs: 12, fat: 0.6, verified: true },
  { id: '43', name: "Myrtilles", cals: 57, prot: 0.7, carbs: 14, fat: 0.3, verified: true },
  { id: '44', name: "Brocoli", cals: 34, prot: 2.8, carbs: 7, fat: 0.4, verified: true },
  { id: '45', name: "Haricots verts", cals: 31, prot: 1.8, carbs: 7, fat: 0.2, verified: true },
  { id: '46', name: "Épinards", cals: 23, prot: 2.9, carbs: 3.6, fat: 0.4, verified: true },
  { id: '47', name: "Courgette", cals: 17, prot: 1.2, carbs: 3.1, fat: 0.3, verified: true },
  { id: '48', name: "Tomate", cals: 18, prot: 0.9, carbs: 3.9, fat: 0.2, verified: true },
  { id: '49', name: "Carotte", cals: 41, prot: 0.9, carbs: 10, fat: 0.2, verified: true },
  { id: '50', name: "Concombre", cals: 15, prot: 0.6, carbs: 3.6, fat: 0.1, verified: true }
];

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

const CircularGauge = ({ value, max, color, size = 64, strokeWidth = 6, icon: Icon }) => {
  const radius = (size - strokeWidth) / 2; const circumference = 2 * Math.PI * radius; const percent = Math.min(value / max, 1);
  const strokeDashoffset = circumference - percent * circumference;
  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 absolute"><circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-zinc-900" /><circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" /></svg>
      <div className="absolute flex flex-col items-center justify-center">{Icon && <Icon size={size * 0.3} color={color} />}</div>
    </div>
  );
};

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
// COMPOSANT PRINCIPAL NUTRITION 
// ==========================================
export default function Nutrition({ onBack, dataContext }) {
  const { profile, setProfile, journal, setJournal, syncToCloud, isSyncing } = dataContext;

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [currentDateStr, setCurrentDateStr] = useState(getTodayStr());

  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('mecanik_favorites_v1')) || []);
  const [recentFoods, setRecentFoods] = useState(() => JSON.parse(localStorage.getItem('mecanik_recents_v1')) || []);
  const [myFoods, setMyFoods] = useState(() => JSON.parse(localStorage.getItem('mecanik_my_foods_v1')) || []);
  const [activeSearchTab, setActiveSearchTab] = useState('recent'); 

  // ÉTAT DU SCANNER ALIMENTAIRE
  const [isScanningFood, setIsScanningFood] = useState(false);

  useEffect(() => { localStorage.setItem('mecanik_favorites_v1', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('mecanik_recents_v1', JSON.stringify(recentFoods)); }, [recentFoods]);
  useEffect(() => { localStorage.setItem('mecanik_my_foods_v1', JSON.stringify(myFoods)); }, [myFoods]);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [globalDB, setGlobalFoodDB] = useState(INITIAL_GLOBAL_DB);
  const [activeMealModal, setActiveMealModal] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [newFood, setNewFood] = useState({ name: "", cals: "", prot: "", carbs: "", fat: "" });
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchFoodsFromCloud = async () => {
      try {
        const snapshot = await getDocs(foodsCollection);
        const foodsFromFirebase = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGlobalFoodDB([...INITIAL_GLOBAL_DB, ...foodsFromFirebase]);
      } catch (error) { setGlobalFoodDB(INITIAL_GLOBAL_DB); }
    };
    fetchFoodsFromCloud();
  }, []);

  // LOGIQUE DU SCANNER OPENFOODFACTS
  useEffect(() => {
    let scanner = null;
    if (isScanningFood) {
      scanner = new Html5QrcodeScanner("food-reader", { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, false);
      scanner.render(async (text) => {
        scanner.clear();
        setIsScanningFood(false);
        try {
          const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${text}.json`);
          const data = await res.json();
          if (data.status === 1) {
            const p = data.product;
            const nut = p.nutriments;
            // On extrait les valeurs pour 100g
            const scannedFood = {
              id: `off-${text}`,
              name: p.product_name || "Produit Scanné",
              cals: Math.round(nut['energy-kcal_100g'] || nut['energy-kcal_serving'] || 0),
              prot: Math.round(nut['proteins_100g'] || 0),
              carbs: Math.round(nut['carbohydrates_100g'] || 0),
              fat: Math.round(nut['fat_100g'] || 0),
              verified: true // Code-barre officiel
            };
            
            // On l'ajoute dans la base de données et on auto-remplit la barre de recherche
            setGlobalFoodDB(prev => [scannedFood, ...prev.filter(f => f.id !== scannedFood.id)]);
            setSearchQuery(scannedFood.name);
          } else {
            alert("Ce code-barre n'existe pas dans la base de données mondiale.");
          }
        } catch (e) {
          alert("Erreur de connexion lors du scan.");
        }
      }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(e => console.error(e)); };
  }, [isScanningFood]);

  const currentData = journal[currentDateStr] || {
    meals: { breakfast: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, lunch: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, dinner: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, snacks: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 } },
    activity: 0, water: 0
  };

  const totalConsumed = Object.values(currentData.meals).reduce((acc, meal) => acc + meal.cals, 0);
  const totalCarbs = Object.values(currentData.meals).reduce((acc, meal) => acc + meal.carbs, 0);
  const totalProt = Object.values(currentData.meals).reduce((acc, meal) => acc + meal.prot, 0);
  const totalFat = Object.values(currentData.meals).reduce((acc, meal) => acc + meal.fat, 0);
  
  const metabolicStats = profile ? calculateMifflin(profile) : { bmr: 0, tdee: 2600 };
  const targetGoals = profile ? calculateTargetGoals(profile, metabolicStats.tdee) : { targetCalories: 2600, protein: 160, carbs: 300, fat: 80 };
  const waterGoal = profile ? Math.round(Number(profile.weight || 75) * 35) : 2500;
  const remainingCals = targetGoals.targetCalories - totalConsumed + currentData.activity;

  const updateCurrentJournal = (newData) => setJournal(prev => ({ ...prev, [currentDateStr]: { ...currentData, ...newData } }));
  const handleAddWater = () => updateCurrentJournal({ water: Math.min(currentData.water + 250, waterGoal + 1000) });
  const handleRemoveWater = () => updateCurrentJournal({ water: Math.max(currentData.water - 250, 0) });

  const handleAddFoodToMeal = (food) => {
    const meal = currentData.meals[activeMealModal];
    updateCurrentJournal({
      meals: { ...currentData.meals, [activeMealModal]: { items: [...meal.items, food], cals: meal.cals + food.cals, carbs: meal.carbs + food.carbs, prot: meal.prot + food.prot, fat: meal.fat + food.fat } }
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
    const foodItem = { name: newFood.name, cals: Number(newFood.cals), prot: Number(newFood.prot||0), carbs: Number(newFood.carbs||0), fat: Number(newFood.fat||0), verified: false };
    try {
      const docRef = await addDoc(foodsCollection, foodItem);
      const addedFood = { id: docRef.id, ...foodItem };
      setGlobalFoodDB([addedFood, ...globalDB]);
      setMyFoods([addedFood, ...myFoods]); 
      setNewFood({ name: "", cals: "", prot: "", carbs: "", fat: "" });
      setShowContributeModal(false);
    } catch (error) { console.error(error); } finally { setIsPublishing(false); }
  };

  const changeDate = (offset) => {
    const d = new Date(currentDateStr); d.setDate(d.getDate() + offset); setCurrentDateStr(d.toISOString().split('T')[0]);
  };

  if (!profile) return <OnboardingWizard onComplete={(p) => setProfile(p)} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95"><ChevronLeft size={18}/></button>
          <h1 className="text-xl font-black tracking-tight uppercase">Nutrition</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowContributeModal(true)} className="p-2.5 bg-orange-600/10 text-orange-500 rounded-full border border-orange-500/20 active:scale-95"><DatabaseZap size={18} /></button>
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
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Glucides</span><div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${Math.min((totalCarbs/targetGoals.carbs)*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalCarbs)} <span className="text-[9px] text-zinc-500">/ {targetGoals.carbs}g</span></span></div>
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Protéines</span><div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min((totalProt/targetGoals.protein)*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalProt)} <span className="text-[9px] text-zinc-500">/ {targetGoals.protein}g</span></span></div>
            <div className="flex flex-col items-center gap-2"><span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Lipides</span><div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${Math.min((totalFat/targetGoals.fat)*100, 100)}%` }}/></div><span className="text-xs font-bold">{Math.round(totalFat)} <span className="text-[9px] text-zinc-500">/ {targetGoals.fat}g</span></span></div>
          </div>
        </section>

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
        
        <div className="mt-8 mb-4">
          <button onClick={syncToCloud} disabled={isSyncing} className={`w-full py-5 rounded-[24px] font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${isSyncing ? 'bg-zinc-800 text-zinc-500' : 'bg-green-600/20 text-green-500 border border-green-500/30 hover:bg-green-600 hover:text-white'}`}>
            {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CloudLightning size={18} />}
            {isSyncing ? 'Synchronisation Cloud...' : 'Forcer la Sauvegarde Cloud'}
          </button>
        </div>
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
                      <option value="cut">Sèche / Perte de Poids (-15%)</option>
                      <option value="maintain">Maintien (Équilibre)</option>
                      <option value="bulk">Prise de Masse (+10%)</option>
                    </select>
                  </div>
                  <button onClick={() => setIsEditingProfile(false)} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-xs shadow-lg mt-6">Terminer l'édition</button>
                </div>
              ) : (
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
                      <p className={`text-sm font-bold ${simulateLinearRegression(profile, metabolicStats.tdee).trend === 'Baisse' ? 'text-emerald-500' : 'text-red-500'}`}>{simulateLinearRegression(profile, metabolicStats.tdee).trend}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL DE RECHERCHE AVEC SCANNER CODE BARRE           */}
      {/* ==================================================== */}
      <AnimatePresence>
        {activeMealModal && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col">
            
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-black uppercase">
                {activeMealModal === 'breakfast' ? 'Petit-déjeuner' : activeMealModal === 'lunch' ? 'Déjeuner' : activeMealModal === 'dinner' ? 'Dîner' : 'Snacks'}
              </h2>
              <button onClick={() => { setActiveMealModal(null); setSearchQuery(''); setActiveSearchTab('recent'); }} className="p-2 bg-zinc-800 rounded-full active:scale-90 transition-transform"><X size={20}/></button>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              
              {/* BARRE DE RECHERCHE & BOUTON SCANNER */}
              <div className="flex items-center gap-3 bg-zinc-900 p-4 rounded-2xl mb-4 border border-zinc-800">
                <Search size={20} className="text-zinc-500" />
                <input type="text" placeholder="Aliment, repas ou marque" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent font-bold text-white outline-none w-full placeholder:text-zinc-600" autoFocus />
                {/* BOUTON DU SCANNER */}
                <button onClick={() => setIsScanningFood(true)} className="active:scale-90 transition-transform p-1">
                  <ScanBarcode size={24} className="text-emerald-500" />
                </button>
              </div>

              {!searchQuery && (
                <div className="bg-[#151517] p-4 rounded-2xl border border-[#222225] mb-4 shadow-xl">
                  <div className="flex justify-between items-center mb-3 border-b border-zinc-800/50 pb-2">
                    <span className="text-[10px] font-black uppercase text-zinc-400">Total Journalier</span>
                    <span className="text-xs font-black text-white">{Math.round(totalConsumed)} / {targetGoals.targetCalories} kcal</span>
                  </div>
                  <div className="flex justify-between text-center px-2">
                    <div><p className="text-[9px] uppercase text-zinc-500 font-bold mb-1">Glucides</p><p className="text-xs font-black text-white">{Math.round(totalCarbs)} / {targetGoals.carbs}g</p></div>
                    <div><p className="text-[9px] uppercase text-zinc-500 font-bold mb-1">Protéines</p><p className="text-xs font-black text-white">{Math.round(totalProt)} / {targetGoals.protein}g</p></div>
                    <div><p className="text-[9px] uppercase text-zinc-500 font-bold mb-1">Graisses</p><p className="text-xs font-black text-white">{Math.round(totalFat)} / {targetGoals.fat}g</p></div>
                  </div>
                </div>
              )}

              {!searchQuery && (
                <div className="flex gap-2 mb-4 bg-[#151517] p-1.5 rounded-2xl border border-[#222225]">
                  <button onClick={() => setActiveSearchTab('recent')} className={`flex-1 py-3 rounded-xl flex justify-center items-center transition-all ${activeSearchTab === 'recent' ? 'bg-[#222225] text-white shadow-md border border-zinc-800' : 'text-zinc-500 hover:text-zinc-400'}`}><History size={18} /></button>
                  <button onClick={() => setActiveSearchTab('favorites')} className={`flex-1 py-3 rounded-xl flex justify-center items-center transition-all ${activeSearchTab === 'favorites' ? 'bg-[#222225] text-red-500 shadow-md border border-zinc-800' : 'text-zinc-500 hover:text-red-400/50'}`}><Heart size={18} fill={activeSearchTab === 'favorites' ? 'currentColor' : 'none'} /></button>
                  <button onClick={() => setActiveSearchTab('my')} className={`flex-1 py-3 rounded-xl flex justify-center items-center transition-all ${activeSearchTab === 'my' ? 'bg-[#222225] text-emerald-500 shadow-md border border-zinc-800' : 'text-zinc-500 hover:text-emerald-400/50'}`}><Bookmark size={18} fill={activeSearchTab === 'my' ? 'currentColor' : 'none'} /></button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                {(() => {
                  let listToRender = [];
                  
                  if (searchQuery) {
                    listToRender = globalDB.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 15);
                    if (listToRender.length === 0) return <p className="text-center text-zinc-500 font-bold text-xs mt-10">Aucun résultat trouvé.</p>;
                  } else {
                    if (activeSearchTab === 'recent') listToRender = recentFoods;
                    else if (activeSearchTab === 'favorites') listToRender = favorites;
                    else if (activeSearchTab === 'my') listToRender = myFoods;

                    if (listToRender.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center pt-16 opacity-50 text-zinc-500">
                          {activeSearchTab === 'recent' && <History size={40} className="mb-4" />}
                          {activeSearchTab === 'favorites' && <Heart size={40} className="mb-4" />}
                          {activeSearchTab === 'my' && <Bookmark size={40} className="mb-4" />}
                          <p className="text-center text-xs font-bold uppercase tracking-widest">
                            {activeSearchTab === 'recent' ? "Aucun historique récent" : activeSearchTab === 'favorites' ? "Aucun aliment en favoris" : "Vous n'avez créé aucun aliment"}
                          </p>
                        </div>
                      );
                    }
                  }

                  return listToRender.map((food, idx) => {
                    const isFav = favorites.some(f => f.id === food.id);
                    return (
                      <div key={`${food.id}-${idx}`} className="bg-[#151517] p-4 rounded-2xl flex justify-between items-center border border-zinc-800">
                        <div className="flex-1 pr-4">
                          <p className="font-bold text-sm text-white flex items-center gap-2">
                            {food.name} {food.verified ? <CheckCircle2 size={14} className="text-blue-500"/> : <Globe size={14} className="text-orange-500"/>}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{food.cals} Kcal • {food.carbs}g G • {food.prot}g P</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleFavorite(food)} className={`p-2 rounded-full transition-colors active:scale-90 ${isFav ? 'text-red-500 bg-red-500/10' : 'text-zinc-600 bg-zinc-800 hover:text-red-400'}`}>
                            <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                          </button>
                          <button onClick={() => handleAddFoodToMeal(food)} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                            <Plus size={20}/>
                          </button>
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

      {/* ==================================================== */}
      {/* CAMÉRA PLEIN ÉCRAN POUR SCANNER LES ALIMENTS         */}
      {/* ==================================================== */}
      <AnimatePresence>
        {isScanningFood && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-xl p-6 flex flex-col items-center justify-center">
            <h2 className="text-white mb-6 font-black uppercase tracking-widest text-lg text-center">Scanner un Code-Barre</h2>
            
            <div className="w-full max-w-sm rounded-[32px] overflow-hidden bg-black border-4 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative">
              {/* Le fond blanc permet de rendre le cadre de HTML5-QRCode lisible */}
              <div id="food-reader" className="w-full bg-white"></div>
            </div>
            
            <p className="text-xs text-zinc-500 mt-4 text-center font-bold uppercase tracking-widest">Connecté à OpenFoodFacts</p>
            <button onClick={() => setIsScanningFood(false)} className="mt-8 px-10 py-4 bg-zinc-900 rounded-full font-black uppercase text-xs text-white border border-zinc-800 active:scale-95">Annuler</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContributeModal && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-2"><h2 className="text-lg font-black uppercase tracking-tighter">Base Cloud</h2><CloudLightning size={16} className="text-orange-500" /></div>
              <button onClick={() => setShowContributeModal(false)} className="p-2 bg-zinc-800 rounded-full active:scale-90"><X size={20}/></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-6">
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-[20px] flex gap-3 items-start"><Globe size={20} className="text-orange-500 shrink-0 mt-0.5" /><p className="text-[11px] text-orange-200 leading-relaxed font-medium">Les aliments ajoutés ici seront synchronisés en temps réel et disponibles pour <strong>tous les utilisateurs</strong>.</p></div>
              <div className="space-y-4">
                <div className="flex flex-col bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-inner"><span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Nom</span><input type="text" placeholder="Ex: Avocat (cru)" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} className="bg-transparent font-bold text-white text-lg outline-none w-full placeholder:text-zinc-700" /></div>
                <div className="flex flex-col bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-inner"><span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Calories (Kcal)</span><input type="number" placeholder="0" value={newFood.cals} onChange={e => setNewFood({...newFood, cals: e.target.value})} className="bg-transparent font-black text-white text-xl outline-none w-full placeholder:text-zinc-700" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col bg-zinc-900 p-3 rounded-2xl border border-zinc-800"><span className="text-[9px] font-black uppercase text-yellow-500 tracking-widest mb-1">Glucides</span><input type="number" placeholder="0" value={newFood.carbs} onChange={e => setNewFood({...newFood, carbs: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" /></div>
                  <div className="flex flex-col bg-zinc-900 p-3 rounded-2xl border border-zinc-800"><span className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-1">Protéines</span><input type="number" placeholder="0" value={newFood.prot} onChange={e => setNewFood({...newFood, prot: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" /></div>
                  <div className="flex flex-col bg-zinc-900 p-3 rounded-2xl border border-zinc-800"><span className="text-[9px] font-black uppercase text-red-500 tracking-widest mb-1">Lipides</span><input type="number" placeholder="0" value={newFood.fat} onChange={e => setNewFood({...newFood, fat: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" /></div>
                </div>
              </div>
              <button onClick={handleContributeFood} disabled={isPublishing} className={`w-full py-5 rounded-full font-black uppercase text-xs shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2 ${newFood.name && newFood.cals ? 'bg-orange-500 text-black shadow-orange-900/50' : 'bg-zinc-800 text-zinc-500'}`}>
                {isPublishing ? <RefreshCw size={16} className="animate-spin" /> : "Publier sur le Cloud"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}