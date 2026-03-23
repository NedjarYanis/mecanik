import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  Play, Timer, Check, Target, HeartPulse, 
  BedDouble, Info, Activity, X, TrendingUp, Star, 
  Scan, Music, SkipForward, SkipBack, Pause, RefreshCw, 
  LogIn, LogOut, Minus, MonitorSpeaker, FastForward, Rewind, 
  Edit3, Plus, Trash2, ChevronLeft, ChevronRight, Utensils, Dumbbell, 
  LayoutDashboard, Calendar, ArrowRight, CloudLightning, AlertTriangle,
  Repeat, Settings2, Search, Download, Trophy, BrainCircuit, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

import Nutrition from './Nutrition';
import Social from './Social'; 
import Progress from './Progress';

// IMPORTS DES IMAGES
import imgPresse from './assets/presse-a-cuisses-inclinee.gif';
import imgHackSquat from './assets/Sled-Hack-Squat.gif';
import imgLegExtension from './assets/leg-extension.gif';
import imgAdducteur from './assets/adducteur-machine-cuisse.png';
import imgMollets from './assets/ExtensionMollets .jpg';
import imgDCSmith from './assets/developpe-couche.gif';
import imgChestPress from './assets/developpe-incline-machine-convergente-exercice-musculation.gif';
import imgShoulderPress from './assets/SEAT_DB_SHD_PRESS.gif';
import imgTriceps from './assets/02011301-Cable-Pushdown_Upper-Arms_720.gif';
import imgLateralRaise from './assets/03341301-Dumbbell-Lateral-Raise_shoulder_720.gif';
import imgLatPulldown from './assets/Tirage_Vertical_Poulie_Haute.png';
import imgSeatedRow from './assets/Tirage_Horizontal_Assis.png';
import imgPullover from './assets/pull-over-poulie.gif';
import imgHammerCurl from './assets/Dumbbell-Hammer-Curl_Forearm.gif';
import imgCurlBiceps from './assets/Curl_Biceps.png';

// IMPORT FIRESTORE COMPLET
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDgWfWXpAV6ZHHrlE4q1EC3mFeZAJOV5wc",
  authDomain: "mecanik-21fad.firebaseapp.com",
  projectId: "mecanik-21fad",
  storageBucket: "mecanik-21fad.firebasestorage.app",
  messagingSenderId: "669005036732",
  appId: "1:669005036732:web:a998919f7b462fe19fe4b9"
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => { setCurrentUser(user); setLoading(false); });
    return unsubscribe;
  }, []);

  const clearAppCache = () => {
    ['mecanik_program_v6', 'mecanik_history_v6', 'mecanik_profile_v6', 'mecanik_journal_v6'].forEach(k => localStorage.removeItem(k));
  };

  const login = async (email, password) => { clearAppCache(); return signInWithEmailAndPassword(auth, email, password); };
  const signup = async (email, password) => { clearAppCache(); return createUserWithEmailAndPassword(auth, email, password); };
  const loginWithGoogle = async () => { clearAppCache(); const provider = new GoogleAuthProvider(); return signInWithPopup(auth, provider); };
  const logout = async () => { await signOut(auth); clearAppCache(); window.location.reload(); };

  return <AuthContext.Provider value={{ currentUser, login, signup, loginWithGoogle, logout }}>{!loading && children}</AuthContext.Provider>;
}

const defaultProgramData = {
  1: { type: 'lift', dayName: "Lundi", focus: "Membres Inférieurs", desc: "Surstimulation globale.", exercises: [ { id: '1A', name: "Presse à Cuisses", sets: 4, reps: "12-15", tempo: "3-0-1-1", rest: 180, image: imgPresse }, { id: '1B', name: "Hack Squat", sets: 3, reps: "10-12", tempo: "3-1-1-0", rest: 150, image: imgHackSquat }, { id: '1C', name: "Leg Extension", sets: 4, reps: "15-20", tempo: "2-0-1-2", rest: 90, image: imgLegExtension }, { id: '1D', name: "Adducteurs", sets: 3, reps: "15-20", tempo: "2-0-1-1", rest: 90, image: imgAdducteur }, { id: '1E', name: "Mollets", sets: 4, reps: "12-15", tempo: "3-2-1-2", rest: 90, image: imgMollets } ] },
  2: { type: 'mixed', dayName: "Mardi", focus: "Poussée Supérieure", desc: "Sécurité mécanique.", exercises: [ { id: '2A', name: "DC Smith Machine", sets: 4, reps: "6-8", tempo: "3-0-1-0", rest: 180, image: imgDCSmith }, { id: '2B', name: "Chest Press", sets: 3, reps: "10-12", tempo: "3-0-1-1", rest: 120, image: imgChestPress }, { id: '2C', name: "Shoulder Press", sets: 3, reps: "10-12", tempo: "3-0-1-0", rest: 120, image: imgShoulderPress }, { id: '2D', name: "Triceps Pushdown", sets: 4, reps: "12-15", tempo: "2-0-1-1", rest: 90, image: imgTriceps }, { id: '2E', name: "Élévations Latérales", sets: 3, reps: "15-20", tempo: "2-0-1-0", rest: 90, image: imgLateralRaise } ], cardio: { name: "Vélo Assis", duration: "30 min", bpm: "119-129", focus: "FATmax post-séance." } },
  3: { type: 'cardio', dayName: "Mercredi", focus: "Régénération", desc: "Consommer la graisse viscérale.", cardio: { name: "Elliptique", duration: "45-60 min", bpm: "119-129", focus: "Ne JAMAIS courir." } },
  4: { type: 'mixed', dayName: "Jeudi", focus: "Tirage Supérieur", desc: "Épaisseur Dorsale.", exercises: [ { id: '4A', name: "Lat Pulldown", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, image: imgLatPulldown }, { id: '4B', name: "Seated Row", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, image: imgSeatedRow }, { id: '4C', name: "Pull-over poulie", sets: 3, reps: "15", tempo: "2-0-1-0", rest: 90, image: imgPullover }, { id: '4D', name: "Curl Marteau", sets: 4, reps: "8-10", tempo: "3-0-1-1", rest: 90, image: imgHammerCurl }, { id: '4E', name: "Curl Biceps Machine", sets: 3, reps: "12-15", tempo: "2-0-1-1", rest: 90, image: imgCurlBiceps } ], cardio: { name: "Marche Inclinée", duration: "30 min", bpm: "119-129", focus: "Inclinaison 8-12%." } },
  5: { type: 'cardio', dayName: "Vendredi", focus: "Lavage Métabolique", desc: "Sensibilité à l'insuline.", cardio: { name: "Protocole Croisé", duration: "60-75 min", bpm: "119-129", focus: "20' Vélo + 20' Elliptique + 20' Hand-Bike." } },
  6: { type: 'rest', dayName: "Samedi", focus: "Croissance Tissulaire", desc: "L'inflammation locale va se résorber." },
  7: { type: 'rest', dayName: "Dimanche", focus: "Repos Absolu", desc: "Restauration du SNC." }
};

const CATALOGUE_EXERCICES = [
  { id: 'NEW1', name: "Développé Couché Haltères", sets: 4, reps: "8-12", tempo: "3-0-1-0", rest: 120, image: imgDCSmith },
  { id: 'NEW2', name: "Développé Incliné Barre", sets: 4, reps: "8-12", tempo: "3-0-1-0", rest: 120, image: imgDCSmith },
  { id: 'NEW3', name: "Pec Deck Fly (Écartés)", sets: 3, reps: "12-15", tempo: "2-0-1-1", rest: 90, image: imgChestPress }
];

Object.values(defaultProgramData).forEach(day => { 
  if (day.exercises) { 
    day.exercises.forEach(exo => { 
      if (!CATALOGUE_EXERCICES.find(e => e.name === exo.name)) { 
        CATALOGUE_EXERCICES.push(exo); 
      } 
    }); 
  } 
});

const DataContext = createContext();
export const useData = () => useContext(DataContext);

function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  
  const [program, setProgram] = useState(() => JSON.parse(localStorage.getItem('mecanik_program_v6')) || defaultProgramData);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('mecanik_history_v6')) || {});
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('mecanik_profile_v6')) || null);
  const [journal, setJournal] = useState(() => JSON.parse(localStorage.getItem('mecanik_journal_v6')) || { [getTodayStr()]: { meals: { breakfast: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, lunch: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, dinner: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, snacks: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 } }, activity: 0, water: 0 } });
  const [isSyncing, setIsSyncing] = useState(false);

  const [customCatalog, setCustomCatalog] = useState([]);

  useEffect(() => { localStorage.setItem('mecanik_program_v6', JSON.stringify(program)); }, [program]);
  useEffect(() => { localStorage.setItem('mecanik_history_v6', JSON.stringify(history)); }, [history]);
  useEffect(() => { if (profile) localStorage.setItem('mecanik_profile_v6', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('mecanik_journal_v6', JSON.stringify(journal)); }, [journal]);

  useEffect(() => {
    if (currentUser) {
      getDoc(doc(db, "users", currentUser.uid)).then(docSnap => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData.program) setProgram(cloudData.program);
          if (cloudData.history) setHistory(cloudData.history);
          if (cloudData.profile) setProfile(cloudData.profile);
          if (cloudData.journal) setJournal(cloudData.journal);
        }
      });
      getDocs(collection(db, "custom_exercises")).then(snap => {
        setCustomCatalog(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(() => console.log("Aucun exercice custom trouvé."));
    }
  }, [currentUser]);

  const syncToCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try { await setDoc(doc(db, "users", currentUser.uid), { program, history, profile, journal, lastSync: new Date().toISOString() }, { merge: true }); } 
    catch (e) {}
    setIsSyncing(false);
  };

  const stateRef = useRef({ program, history, profile, journal });
  useEffect(() => { stateRef.current = { program, history, profile, journal }; }, [program, history, profile, journal]);

  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(async () => {
      setIsSyncing(true);
      try { await setDoc(doc(db, "users", currentUser.uid), { ...stateRef.current, autoSyncDate: new Date().toISOString() }, { merge: true }); } 
      catch (e) {}
      setIsSyncing(false);
    }, 120000); 
    return () => clearInterval(timer);
  }, [currentUser]);

  return <DataContext.Provider value={{ program, setProgram, history, setHistory, profile, setProfile, journal, setJournal, syncToCloud, isSyncing, customCatalog }}>{children}</DataContext.Provider>;
}

const ChartTooltip = ({ active, payload, color }) => {
  if (active && payload && payload.length) {
    return ( <div className="bg-black border border-zinc-800 p-3 rounded-xl shadow-xl"><p className="font-bold text-sm" style={{color: color || '#3b82f6'}}>{`${payload[0].value} kg`}</p></div> );
  }
  return null;
};

const SPOTIFY_AUTH_URL = atob("aHR0cHM6Ly9hY2NvdW50cy5zcG90aWZ5LmNvbQ=="); 
const SPOTIFY_API_URL = atob("aHR0cHM6Ly9hcGkuc3BvdGlmeS5jb20vdjE="); 
const SPOTIFY_CLIENT_ID = "4673eade76a7419c9bad9eaf6ca902fe";
const REDIRECT_URI = window.location.origin + window.location.pathname; 
const SCOPES = "user-read-currently-playing user-modify-playback-state user-read-playback-state";
const generateRandomString = (length) => { const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; const values = crypto.getRandomValues(new Uint8Array(length)); return values.reduce((acc, x) => acc + possible[x % possible.length], ""); };
const sha256 = async (plain) => { const encoder = new TextEncoder(); const data = encoder.encode(plain); return window.crypto.subtle.digest('SHA-256', data); };
const base64encode = (input) => btoa(String.fromCharCode(...new Uint8Array(input))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (isLogin) await login(email, password);
      else await signup(email, password);
    } catch (err) { setError("Erreur d'authentification."); }
  };

  const handleGoogle = async () => {
    setError('');
    try { await loginWithGoogle(); } catch (err) { setError("Google a bloqué la connexion."); }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-black p-6 relative overflow-hidden">
      <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="w-full max-w-sm bg-[#111113] p-8 rounded-[32px] border border-zinc-800 shadow-2xl relative z-10">
        <h2 className="text-xl font-extrabold text-center tracking-tight mb-8">{isLogin ? 'Connexion' : 'Rejoindre MÉCANIK'}</h2>
        {error && <p className="text-[10px] text-red-500 bg-red-500/10 p-3 rounded-xl mb-4 text-center font-bold break-words">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-black p-4 rounded-2xl border border-zinc-800/80 outline-none focus:border-blue-500 font-medium text-sm text-white placeholder:text-zinc-600" required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-black p-4 rounded-2xl border border-zinc-800/80 outline-none focus:border-blue-500 font-medium text-sm text-white placeholder:text-zinc-600" required />
          <button type="submit" className="w-full py-3.5 bg-blue-600 rounded-2xl font-bold text-sm text-white">{isLogin ? 'Entrer' : 'Créer mon compte'}</button>
        </form>
        <div className="mt-6 border-t border-zinc-800/50 pt-6">
          <button onClick={handleGoogle} className="w-full py-3.5 bg-white rounded-2xl font-bold text-sm text-black flex justify-center items-center gap-2 active:scale-95 shadow-sm">Google</button>
        </div>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-xs text-zinc-500 font-medium">{isLogin ? "Je n'ai pas de compte" : "J'ai déjà un compte"}</button>
      </motion.div>
    </div>
  );
}

function DashboardTab({ onNavigate }) {
  const { logout, currentUser } = useAuth();
  const { program, journal, setJournal, profile, setProfile, history } = useData();
  const today = new Date().getDay() || 7; 
  const todaysWorkout = program[today];
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayJournal = journal[todayStr] || {};
  let nutritionCals = 0;
  if (todayJournal.meals) { nutritionCals = Object.values(todayJournal.meals).reduce((acc, meal) => acc + (meal?.cals || 0), 0); }

  const [showReadiness, setShowReadiness] = useState(todayJournal.readiness === undefined);
  const logReadiness = (score) => {
    setJournal(prev => ({ ...prev, [todayStr]: { ...(prev[todayStr] || {}), readiness: score } }));
    setShowReadiness(false);
  };

  const isSunday = new Date().getDay() === 0;
  const [showWeeklyReview, setShowWeeklyReview] = useState(isSunday && profile?.lastReviewDate !== todayStr);

  const handleReviewDecision = (action) => {
    let newGoal = profile.goal;
    if (action === 'cut') {
        alert("L'IA a réduit vos calories cibles (-15%).");
        newGoal = 'cut';
    } else {
        alert("Objectif maintenu.");
    }
    setProfile(prev => ({ ...prev, lastReviewDate: todayStr, goal: newGoal }));
    setShowWeeklyReview(false);
  };

  const [newWeight, setNewWeight] = useState(profile?.weight || 75);
  const logWeight = () => {
    const w = parseFloat(newWeight);
    if(w) {
      const hist = profile.weightHistory || [];
      const updatedHistory = [...hist.filter(h => h.date !== todayStr), { date: todayStr, weight: w }].slice(-30);
      setProfile(prev => ({ ...prev, weight: w, weightHistory: updatedHistory }));
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ profile, history, journal }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MECANIK_Export_${todayStr}.json`;
    link.click();
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="h-full w-full bg-black p-5 overflow-y-auto pb-32" style={{ touchAction: "pan-y" }}>
      
      <AnimatePresence>
        {showReadiness && !showWeeklyReview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
            <div className="bg-[#121214] w-full max-w-sm rounded-[24px] p-8 border border-zinc-800/80 shadow-2xl text-center">
              <HeartPulse size={40} className="text-red-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-xl font-bold tracking-tight mb-2 text-white">État de Forme</h2>
              <p className="text-xs text-zinc-400 font-medium mb-8">De 1 (Épuisé) à 10 (Pleine forme), comment te sens-tu aujourd'hui ?</p>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                  <button key={score} onClick={() => logReadiness(score)} className={`h-10 rounded-xl font-bold text-sm transition-all active:scale-95 ${score <= 4 ? 'bg-red-900/20 text-red-500 border border-red-500/20' : score <= 7 ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-500/20' : 'bg-emerald-900/20 text-emerald-500 border border-emerald-500/20'}`}>
                    {score}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWeeklyReview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
            <div className="bg-gradient-to-b from-blue-900/30 to-[#121214] w-full max-w-sm rounded-[24px] p-8 border border-blue-500/20 shadow-2xl text-center relative overflow-hidden">
              <BrainCircuit size={40} className="text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold tracking-tight mb-2 text-white">Bilan IA</h2>
              <p className="text-xs text-blue-200 font-medium mb-8 leading-relaxed">Il est l'heure de faire le point. Si votre poids stagne, l'IA recommande un ajustement.</p>
              <div className="space-y-3">
                  <button onClick={() => handleReviewDecision('cut')} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95">Diminuer Calories (-15%)</button>
                  <button onClick={() => handleReviewDecision('keep')} className="w-full py-3.5 bg-black text-zinc-400 border border-zinc-800 rounded-xl font-bold text-sm active:scale-95">Maintenir la stratégie</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="pt-8 mb-6 flex justify-between items-center">
        <div className="flex-1 overflow-hidden pr-4">
            <h1 className="text-xl font-extrabold tracking-tight uppercase text-white">Mécanik</h1>
            <p className="text-zinc-500 text-[10px] font-medium truncate">{currentUser?.email}</p>
        </div>
        <div className="flex gap-2 shrink-0">
            <button onClick={exportData} className="bg-zinc-900 p-2.5 rounded-full text-zinc-400 hover:text-white transition-colors active:scale-95"><Download size={18}/></button>
            <button onClick={logout} className="bg-red-900/10 p-2.5 rounded-full text-red-500 hover:bg-red-900/20 transition-colors active:scale-95"><LogOut size={18}/></button>
        </div>
      </header>

      <div className="space-y-4">
        <div className="bg-[#121214] border border-zinc-800/50 rounded-[24px] p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2"><TrendingUp size={16} className="text-emerald-500" /><span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Poids</span></div>
            <div className="flex bg-black rounded-xl border border-zinc-800/50 p-1 pl-2">
              <input type="number" step="0.1" value={newWeight} onChange={e=>setNewWeight(e.target.value)} className="w-12 bg-transparent text-white font-bold outline-none text-xs" />
              <button onClick={logWeight} className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-bold uppercase active:scale-95">OK</button>
            </div>
          </div>
          <div className="h-28 w-full mt-2 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profile?.weightHistory || []}>
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{r: 3, fill: "#10b981", stroke: "#000", strokeWidth: 1.5}} activeDot={{r: 5}} />
                <Tooltip content={<ChartTooltip color="#10b981" />} cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '4 4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {(!profile?.weightHistory || profile.weightHistory.length === 0) && <p className="text-center text-[10px] text-zinc-600 font-medium mt-2">Aucun poids enregistré.</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div onClick={() => onNavigate('workout')} className="bg-[#121214] border border-zinc-800/50 rounded-[24px] p-4 cursor-pointer active:scale-95 flex flex-col justify-between transition-transform">
                <div>
                    <div className="flex items-center gap-2 mb-3"><Calendar size={14} className="text-blue-500" /><span className="text-[9px] font-bold uppercase tracking-widest text-blue-500">Training</span></div>
                    <h2 className="text-sm font-bold text-white leading-tight">{todaysWorkout.focus}</h2>
                    <p className="text-[10px] text-zinc-500 mt-1 font-medium">{['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][today-1]}</p>
                </div>
                <div className="mt-5 flex items-center justify-between text-blue-500">
                    <span className="text-[10px] font-bold uppercase tracking-wide">Ouvrir</span>
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center"><ArrowRight size={12} /></div>
                </div>
            </div>

            <div onClick={() => onNavigate('nutrition')} className="bg-[#121214] border border-zinc-800/50 rounded-[24px] p-4 cursor-pointer active:scale-95 flex flex-col justify-between transition-transform">
                <div>
                    <div className="flex items-center gap-2 mb-3"><Activity size={14} className="text-green-500" /><span className="text-[9px] font-bold uppercase tracking-widest text-green-500">Diète</span></div>
                    <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-white leading-none">{Math.round(nutritionCals)}</span><span className="text-[10px] text-zinc-500 font-medium">kcal</span></div>
                </div>
                <div className="mt-5 flex items-center justify-between text-green-500">
                    <span className="text-[10px] font-bold uppercase tracking-wide">Journal</span>
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center"><ArrowRight size={12} /></div>
                </div>
            </div>
        </div>

      </div>
    </motion.div>
  );
}

function WorkoutTab({ spotifyToken, spotifyTrack, setShowSpotifyWidget, loginSpotify }) {
  const { program, setProgram, history, setHistory, syncToCloud, isSyncing, journal, customCatalog } = useData(); 
  
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [currentDateStr, setCurrentDateStr] = useState(getTodayStr());

  const activeDay = React.useMemo(() => {
    const d = new Date(currentDateStr).getDay();
    return d === 0 ? 7 : d;
  }, [currentDateStr]);

  const changeDate = (offset) => { 
    const d = new Date(currentDateStr); 
    d.setDate(d.getDate() + offset); 
    setCurrentDateStr(d.toISOString().split('T')[0]); 
  };

  const [restTime, setRestTime] = useState(0);
  const timerRef = useRef(null);

  const [isEditingDay, setIsEditingDay] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [swapId, setSwapId] = useState(null); 
  const [catalogSearch, setCatalogSearch] = useState('');
  
  const [isCreatingExo, setIsCreatingExo] = useState(false);
  const [newExo, setNewExo] = useState({ name: '', focus: '', image: '' });
  const [isSavingExo, setIsSavingExo] = useState(false);

  const readiness = journal[currentDateStr]?.readiness || 10;
  const isTired = readiness <= 4; 

  useEffect(() => {
    if (restTime > 0) { timerRef.current = setInterval(() => setRestTime(t => t - 1), 1000); } 
    else { if (restTime === 0 && timerRef.current) { window.navigator.vibrate?.([200, 100, 200]); } clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [restTime]);

  const logWeight = (id, weight) => {
    const dateObj = new Date(currentDateStr);
    const dateFormatted = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    setHistory(prev => ({ ...prev, [id]: [...(prev[id] || []).filter(h => h.date !== dateFormatted), { date: dateFormatted, weight: parseFloat(weight) }].slice(-30) })); 
  };

  const currentDay = program[activeDay];

  const handleUpdateDayFocus = (newFocus) => { setProgram(prev => ({ ...prev, [activeDay]: { ...prev[activeDay], focus: newFocus } })); };
  const handleUpdateExo = (exoId, newProps) => { setProgram(prev => { const day = prev[activeDay]; const newExercises = day.exercises.map(e => e.id === exoId ? { ...e, ...newProps } : e); return { ...prev, [activeDay]: { ...day, exercises: newExercises } }; }); };
  const handleDeleteExo = (exoId) => { setProgram(prev => { const day = prev[activeDay]; const newExercises = day.exercises.filter(e => e.id !== exoId); return { ...prev, [activeDay]: { ...day, exercises: newExercises } }; }); };

  const handleSelectFromCatalog = (exoTemplate) => {
    const newExoId = exoTemplate.id.startsWith('CUST-') ? exoTemplate.id : Date.now().toString();
    const newExo = { ...exoTemplate, id: newExoId }; 

    setProgram(prev => {
      const day = prev[activeDay];
      let newExercises = [...(day.exercises || [])];
      const newType = (day.type === 'rest' || day.type === 'cardio') ? 'mixed' : day.type; 

      if (swapId) {
        const index = newExercises.findIndex(e => e.id === swapId);
        if (index !== -1) newExercises[index] = newExo;
      } else { newExercises.push(newExo); }
      return { ...prev, [activeDay]: { ...day, type: newType, exercises: newExercises } };
    });
    setShowCatalog(false);
    setIsCreatingExo(false);
    setSwapId(null);
    setCatalogSearch('');
  };

  const handleCreateCustomExo = async () => {
    if (!newExo.name) return alert("Le nom de l'exercice est obligatoire !");
    setIsSavingExo(true);
    const exoObj = {
       name: newExo.name,
       focus: newExo.focus || "Général",
       image: newExo.image || "https://cdn-icons-png.flaticon.com/512/3048/3048364.png",
       sets: 4, reps: "10-12", tempo: "2-0-1-1", rest: 90
    };
    try {
      const docRef = await addDoc(collection(db, "custom_exercises"), exoObj);
      const completeExo = { ...exoObj, id: docRef.id };
      handleSelectFromCatalog(completeExo); 
      setNewExo({name:'', focus:'', image:''});
    } catch (e) {
      console.error(e);
      alert("Erreur réseau");
    } finally {
      setIsSavingExo(false);
    }
  };

  const FULL_CATALOG = [...CATALOGUE_EXERCICES, ...(customCatalog || [])];
  const filteredCatalog = FULL_CATALOG.filter(e => e.name.toLowerCase().includes(catalogSearch.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black relative overflow-hidden">
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-extrabold tracking-tight uppercase">Entraînement</h1>
          <div className="flex gap-2">
            {!spotifyToken ? ( <button onClick={loginSpotify} className="p-2 bg-[#1DB954]/10 rounded-full text-[#1DB954] border border-[#1DB954]/20 active:scale-95"><Music size={18}/></button> ) : ( <button onClick={() => setShowSpotifyWidget(true)} className="p-2 bg-zinc-900 rounded-full text-[#1DB954] border border-zinc-800 active:scale-95"><Music size={18}/></button> )}
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-full border border-zinc-800">
          <button onClick={() => changeDate(-1)} className="p-1 text-zinc-400 hover:text-white"><ChevronLeft size={18}/></button>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-500 flex items-center gap-2">
            <Calendar size={12}/> 
            {currentDateStr === getTodayStr() ? "Aujourd'hui" : new Date(currentDateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <button onClick={() => changeDate(1)} className="p-1 text-zinc-400 hover:text-white"><ChevronRight size={18}/></button>
        </div>
      </header>
      
      <motion.main 
        drag="x" 
        dragConstraints={{ left: 0, right: 0 }} 
        style={{ touchAction: "pan-y" }} 
        onDragEnd={(e, info) => { if (info.offset.x > 80) changeDate(-1); if (info.offset.x < -80) changeDate(1); }} 
        key={currentDateStr} 
        initial={{ opacity: 0, x: 50 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ type: "spring", bounce: 0.4 }} 
        className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-5"
      >
        <div className="mb-4 flex justify-between items-start border-l-2 border-blue-500 pl-3">
          <div className="flex-1 pr-4">
            {isEditingDay ? (
                <input type="text" value={currentDay.focus} onChange={(e) => handleUpdateDayFocus(e.target.value)} className="bg-transparent text-white font-extrabold text-xl uppercase tracking-tight outline-none border-b border-zinc-700 w-full mb-1" />
            ) : (
                <h2 className="text-xl font-extrabold leading-tight text-white uppercase tracking-tight">{currentDay.focus}</h2>
            )}
            <p className="text-zinc-500 text-[11px] mt-1 font-medium">{['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][activeDay-1]} • {currentDay.desc}</p>
          </div>
          <button onClick={() => setIsEditingDay(!isEditingDay)} className={`p-2 rounded-full shadow-sm transition-colors ${isEditingDay ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 active:scale-90'}`}>
            {isEditingDay ? <Check size={18}/> : <Settings2 size={18}/>}
          </button>
        </div>

        {isTired && (currentDay.type === 'lift' || currentDay.type === 'mixed') && (
          <div className="bg-red-900/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <p className="text-[11px] text-red-200/80 font-medium">Fatigue détectée. Charge limitée à 75% du max et répétitions ajustées.</p>
          </div>
        )}

        {(currentDay.type === 'lift' || currentDay.type === 'mixed') && currentDay.exercises && currentDay.exercises.map(exo => (
          <ExerciseCard 
            key={exo.id} 
            data={exo} 
            isTired={isTired} 
            isEditing={isEditingDay}
            history={history[exo.id] || []} 
            onStartRest={() => setRestTime(exo.rest)} 
            onLogWeight={(w) => logWeight(exo.id, w)} 
            onUpdate={(newProps) => handleUpdateExo(exo.id, newProps)}
            onDelete={() => handleDeleteExo(exo.id)}
            onSwap={() => { setSwapId(exo.id); setShowCatalog(true); setIsCreatingExo(false); }}
          />
        ))}

        {isEditingDay && (
          <button onClick={() => { setSwapId(null); setShowCatalog(true); setIsCreatingExo(false); }} className="w-full py-4 border border-dashed border-zinc-700 rounded-[20px] text-zinc-400 font-bold text-sm flex justify-center items-center gap-2 hover:bg-zinc-900 transition-colors active:scale-95">
            <Plus size={18} /> Ajouter un exercice
          </button>
        )}

        {currentDay.cardio && <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />}
        {currentDay.type === 'rest' && !isEditingDay && <RestCard data={currentDay} />}
        
        <div className="mt-8 mb-4">
          <button onClick={syncToCloud} disabled={isSyncing} className={`w-full py-3.5 rounded-[20px] font-bold text-xs flex items-center justify-center gap-2 shadow-sm ${isSyncing ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-900 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors active:scale-95'}`}>
            {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <CloudLightning size={16} />} Synchro Cloud
          </button>
        </div>
      </motion.main>

      <AnimatePresence>
        {restTime > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <Timer size={48} className="text-blue-500 mb-6 animate-pulse" />
            <span className="text-7xl font-mono font-bold tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(10,132,255,0.3)] mb-10">
              {Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2,'0')}
            </span>
            <div className="flex items-center gap-4 w-full max-w-xs justify-center">
              <button onClick={() => setRestTime(t => Math.max(1, t - 15))} className="w-14 h-14 bg-zinc-900 rounded-full font-bold text-lg text-white border border-zinc-800 active:scale-95 flex items-center justify-center">-15</button>
              <button onClick={() => setRestTime(0)} className="flex-1 h-14 bg-blue-600 rounded-full font-bold text-sm text-white shadow-[0_0_15px_rgba(10,132,255,0.3)] active:scale-95">Passer</button>
              <button onClick={() => setRestTime(t => t + 15)} className="w-14 h-14 bg-zinc-900 rounded-full font-bold text-lg text-white border border-zinc-800 active:scale-95 flex items-center justify-center">+15</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCatalog && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-extrabold uppercase flex items-center gap-2"><Search size={18} className="text-blue-500"/> Catalogue</h2>
              <button onClick={() => { setShowCatalog(false); setSwapId(null); }} className="p-2 bg-zinc-800 rounded-full active:scale-90"><X size={18}/></button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col min-h-0">
              {isCreatingExo ? (
                <div className="flex-1 overflow-y-auto space-y-4 pb-32" style={{ touchAction: "pan-y" }}>
                   <div className="bg-[#121214] p-5 rounded-[24px] border border-zinc-800/80 shadow-lg space-y-4">
                       <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Nom de l'exercice *</span>
                          <input type="text" value={newExo.name} onChange={e=>setNewExo({...newExo, name: e.target.value})} className="w-full bg-black border border-zinc-800 p-3.5 rounded-xl text-white font-medium text-sm outline-none focus:border-blue-500" placeholder="Ex: Soulevé de terre" />
                       </div>
                       <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Focus (Muscle)</span>
                          <input type="text" value={newExo.focus} onChange={e=>setNewExo({...newExo, focus: e.target.value})} className="w-full bg-black border border-zinc-800 p-3.5 rounded-xl text-white font-medium text-sm outline-none focus:border-blue-500" placeholder="Ex: Dos / Ischios" />
                       </div>
                       <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Lien Image (Optionnel)</span>
                          <input type="text" value={newExo.image} onChange={e=>setNewExo({...newExo, image: e.target.value})} className="w-full bg-black border border-zinc-800 p-3.5 rounded-xl text-white font-medium text-sm outline-none focus:border-blue-500" placeholder="https://..." />
                       </div>
                       <button onClick={handleCreateCustomExo} disabled={isSavingExo} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 flex items-center justify-center gap-2 mt-2">
                           {isSavingExo ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                           {isSavingExo ? "Création..." : "Créer et Ajouter"}
                       </button>
                       <button onClick={() => setIsCreatingExo(false)} className="w-full py-3.5 bg-zinc-900 text-zinc-400 rounded-xl font-bold text-sm active:scale-95 border border-zinc-800">
                           Retour
                       </button>
                   </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 bg-zinc-900/80 p-3.5 rounded-2xl mb-4 border border-zinc-800">
                    <Search size={18} className="text-zinc-500" />
                    <input type="text" placeholder="Rechercher une machine..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} className="bg-transparent font-medium text-sm text-white outline-none w-full placeholder:text-zinc-600" autoFocus />
                  </div>
                  
                  <button onClick={() => setIsCreatingExo(true)} className="w-full py-3.5 mb-4 bg-zinc-900/50 border border-dashed border-zinc-700 rounded-xl text-blue-400 font-bold text-sm flex justify-center items-center gap-2 active:scale-95">
                      <Plus size={16} /> Créer un exercice manuel
                  </button>

                  <div className="flex-1 overflow-y-auto space-y-2 pb-32" style={{ touchAction: "pan-y" }}>
                      {filteredCatalog.length === 0 && <p className="text-center text-zinc-500 font-medium text-xs mt-8">Aucun résultat trouvé.</p>}
                      {filteredCatalog.map((exo, idx) => (
                          <div key={idx} onClick={() => handleSelectFromCatalog(exo)} className="bg-[#121214] p-3 rounded-xl border border-zinc-800/80 flex items-center gap-4 cursor-pointer active:scale-95">
                              <div className="w-12 h-12 bg-black rounded-lg p-1 shrink-0 flex items-center justify-center border border-zinc-800/50">
                                <img src={exo.image || "https://cdn-icons-png.flaticon.com/512/3048/3048364.png"} className="max-w-full max-h-full object-contain" alt="" />
                              </div>
                              <div className="flex-1"><h3 className="font-bold text-white text-sm">{exo.name}</h3></div>
                              <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500"><Plus size={16}/></div>
                          </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExerciseCard({ data, isTired, isEditing, onStartRest, history, onLogWeight, onUpdate, onDelete, onSwap }) {
  const [completedSets, setCompletedSets] = useState([]);
  const [weight, setWeight] = useState("");
  const [showChart, setShowChart] = useState(false); 
  
  // PLUS DE REDUCTION DE SERIES
  const actualSets = parseInt(data.sets || 1);

  // IA FATIGUE : CALCUL DU POIDS MAX ET DU 75%
  const maxHistoricalWeight = history && history.length > 0 ? Math.max(...history.map(h => parseFloat(h.weight) || 0)) : 0;
  const limitWeight = maxHistoricalWeight > 0 ? Math.round(maxHistoricalWeight * 0.75) : 0;

  // IA FATIGUE : REDUCTION DES REPS
  const parseReps = (repStr) => {
    if(!repStr) return "8";
    if(repStr.toString().includes('-')) {
      return repStr.split('-').map(r => Math.max(1, parseInt(r)-2)).join('-');
    }
    return Math.max(1, parseInt(repStr)-2);
  };
  const displayReps = isTired ? parseReps(data.reps) : data.reps;

  const toggleSet = (i) => {
    const done = !completedSets.includes(i);
    setCompletedSets(prev => done ? [...prev, i] : prev.filter(s => s !== i));
    if (done && weight) onLogWeight(weight);
  };
  return (
    <div className={`bg-[#121214] rounded-[24px] border ${isEditing ? 'border-blue-500/30' : 'border-zinc-800/80'} overflow-hidden mb-5 flex flex-col transition-all`}>
      <div className="p-4 flex justify-between items-center border-b border-zinc-800/50 bg-zinc-900/20">
        <div>
          <h3 className="text-sm font-bold text-white leading-tight">{data.name}</h3>
          {isEditing ? (
              <div className="flex gap-2 mt-2 items-center">
                  <input type="number" value={data.sets} onChange={e => onUpdate({sets: e.target.value})} className="w-10 bg-black border border-zinc-700 py-0.5 rounded text-center text-xs font-bold text-blue-400 outline-none" />
                  <span className="text-zinc-600 font-bold text-xs">x</span>
                  <input type="text" value={data.reps} onChange={e => onUpdate({reps: e.target.value})} className="w-14 bg-black border border-zinc-700 py-0.5 rounded text-center text-xs font-bold text-white outline-none" />
              </div>
          ) : (
              <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-block mt-1.5 ${isTired ? 'bg-red-900/20 text-red-400 border border-red-500/20' : 'bg-black text-blue-400 border border-zinc-800/50'}`}>
                {isTired && <span className="mr-1">⚠️ 75% MAX | </span>}
                {actualSets}x{displayReps}
              </div>
          )}
        </div>

        {isEditing && (
            <div className="flex gap-2">
                <button onClick={onSwap} className="w-8 h-8 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center hover:bg-zinc-700 active:scale-90"><Repeat size={14}/></button>
                <button onClick={onDelete} className="w-8 h-8 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center hover:bg-red-900/40 active:scale-90"><Trash2 size={14}/></button>
            </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="h-40 bg-black/50 rounded-[16px] overflow-hidden border border-zinc-800/50 flex items-center justify-center relative" style={{ touchAction: "pan-y" }}>
          <img src={data.image || "https://cdn-icons-png.flaticon.com/512/3048/3048364.png"} draggable={false} alt="" className="w-full h-full object-contain opacity-70 pointer-events-none" style={{ touchAction: "none" }} />
          {!isEditing && (
            <button onClick={onSwap} className="absolute top-2 right-2 bg-black/60 backdrop-blur text-zinc-400 p-2 rounded-lg hover:text-white active:scale-90 border border-zinc-800">
              <Repeat size={14} />
            </button>
          )}
        </div>
        
        <div className="flex gap-3">
            <div className="flex-1 bg-black p-3 rounded-[16px] border border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold mr-3">Kilos</span>
                </div>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={isTired && limitWeight > 0 ? `~${limitWeight}kg` : "-"} className="bg-transparent font-bold text-white text-lg outline-none w-20 text-right" />
            </div>
        </div>
        
        <div className="flex justify-between items-center px-1 bg-black/40 p-1.5 rounded-full border border-zinc-800/50">
            <div className="flex gap-1.5 pl-1">{[...Array(actualSets)].map((_, i) => (<button key={i} onClick={() => toggleSet(i)} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${completedSets.includes(i) ? 'bg-[#10b981] text-black shadow-sm' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>{completedSets.includes(i) ? <Check size={16} strokeWidth={3} /> : i + 1}</button>))}</div>
            <button onClick={onStartRest} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center active:scale-90"><Play size={16} fill="white" className="ml-0.5"/></button>
        </div>

        {!isEditing && (
          <div className="pt-2 border-t border-zinc-800/30">
             <button onClick={() => setShowChart(!showChart)} className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-wider transition-colors ${showChart ? 'text-blue-400 bg-blue-900/10' : 'text-zinc-500'}`}>
                 <TrendingUp size={14}/> Historique
             </button>
             
             <AnimatePresence>
               {showChart && (
                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 120, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full mt-3 overflow-hidden" style={{ touchAction: "pan-y" }}>
                    {history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{r: 3, fill: "#3b82f6", stroke: "#000", strokeWidth: 1}} activeDot={{r: 5}} />
                                <Tooltip content={<ChartTooltip color="#3b82f6" />} cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                       <div className="h-full flex items-center justify-center"><p className="text-[10px] text-zinc-600 font-medium">Aucun poids enregistré.</p></div>
                    )}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function CardioCard({ data, isFinisher }) {
  return (
    <article className="bg-[#121214] rounded-[24px] border border-zinc-800/80 p-6 mb-5">
      <div className="flex items-center gap-2 mb-4"><HeartPulse size={16} className="text-[#FF453A] animate-pulse" /><span className="text-[#FF453A] text-[10px] font-bold uppercase tracking-widest">{isFinisher ? "Finisher Cardio" : "Cardio"}</span></div>
      <h3 className="text-lg font-bold text-white mb-4">{data.name}</h3>
      <div className="flex gap-3 mb-4"><div className="flex-1 bg-black rounded-2xl p-4 border border-zinc-800/50 text-center"><span className="text-[10px] text-zinc-500 font-bold block mb-1">TEMPS</span><span className="font-bold text-sm text-white">{data.duration}</span></div><div className="flex-1 bg-black rounded-2xl p-4 border border-zinc-800/50 text-center"><span className="text-[10px] text-zinc-500 font-bold block mb-1">BPM CIBLE</span><span className="font-bold text-sm text-[#FF453A]">{data.bpm}</span></div></div>
      <div className="bg-black/50 p-3 rounded-xl flex gap-3 items-start"><Info size={14} className="text-zinc-500 shrink-0 mt-0.5" /><p className="text-[11px] text-zinc-400 leading-relaxed font-medium">{data.focus}</p></div>
    </article>
  );
}

function RestCard({ data }) {
  return (
    <div className="bg-[#121214] p-8 rounded-[24px] border border-zinc-800/80 text-center mt-6">
      <div className="w-16 h-16 bg-blue-900/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-900/20"><BedDouble size={32} className="text-blue-500" /></div>
      <h3 className="text-lg font-bold text-white mb-2">{data.focus}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed font-medium">{data.desc}</p>
    </div>
  );
}

function FloatingSpotifyWidget({ token, track, onClose, refreshTrack, setSpotifyToken }) {
  const dragControls = useDragControls();
  const [minimized, setMinimized] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  useEffect(() => { setLocalProgress(track?.progress || 0); }, [track?.progress]);
  useEffect(() => { let int; if (track?.isPlaying) { int = setInterval(() => setLocalProgress(p => p + 1000), 1000); } return () => clearInterval(int); }, [track?.isPlaying]);

  const apiCall = async (endpoint, method = "POST", body = null) => { 
    try { 
      const res = await fetch(`${SPOTIFY_API_URL}/me/player/${endpoint}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : null }); 
      if (res.status === 401) { window.localStorage.removeItem("spotify_token"); setSpotifyToken(""); onClose(); return; }
      setTimeout(refreshTrack, 600); 
    } catch (e) { window.localStorage.removeItem("spotify_token"); setSpotifyToken(""); onClose(); } 
  };
  
  const handleSeek = (e) => { const newMs = parseInt(e.target.value); setLocalProgress(newMs); apiCall(`seek?position_ms=${newMs}`, "PUT"); };
  const formatTime = (ms) => { const total = Math.floor(ms / 1000); return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`; };

  return (
    <motion.div drag dragControls={dragControls} dragListener={false} dragMomentum={true} dragConstraints={{ left: -10, right: 10, top: -500, bottom: 20 }} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className={`fixed bottom-24 right-4 z-[150] bg-black/85 backdrop-blur-2xl border border-zinc-800 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col transition-[width,height] origin-bottom-right ${minimized ? 'w-[250px] h-auto' : 'w-[320px] min-h-[160px]'}`}>
      <div className="bg-zinc-900/60 p-3.5 flex justify-between items-center cursor-grab active:cursor-grabbing border-b border-zinc-800 touch-none" onPointerDown={(e) => dragControls.start(e)}>
        <div className="flex items-center gap-2 pointer-events-none"><Music size={14} className="text-[#1DB954]" /><span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Lecteur</span></div>
        <div className="flex items-center gap-3"><button onClick={() => setMinimized(!minimized)} className="p-1.5 hover:bg-zinc-800 rounded-xl"><Minus size={14} className="text-zinc-400"/></button><button onClick={onClose} className="p-1.5 hover:bg-red-900/40 rounded-xl"><X size={14} className="text-zinc-400"/></button></div>
      </div>
      {!minimized && track && (
        <div className="p-5 flex flex-col gap-5 flex-1">
          <div className="flex items-center gap-4">
            {track.image && <img src={track.image} alt="Album" className="w-16 h-16 rounded-2xl shadow-lg border border-zinc-800 pointer-events-none" />}
            <div className="flex flex-col overflow-hidden"><span className="font-bold text-white text-sm truncate">{track.title}</span><span className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">{track.artist}</span></div>
          </div>
          <div className="flex items-center gap-3"><span className="text-[10px] text-zinc-500 font-mono w-7 text-right">{formatTime(localProgress)}</span><input type="range" min="0" max={track.duration || 100} value={localProgress} onChange={handleSeek} className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-[#1DB954]" /><span className="text-[10px] text-zinc-500 font-mono w-7">{formatTime(track.duration)}</span></div>
          <div className="flex justify-between items-center px-1">
            <button onClick={() => apiCall("previous")} className="p-2 text-zinc-300 active:scale-90"><SkipBack size={20}/></button>
            <button onClick={() => apiCall(track.isPlaying ? "pause" : "play", "PUT")} className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95">{track.isPlaying ? <Pause size={22} fill="black" /> : <Play size={22} fill="black" className="ml-1" />}</button>
            <button onClick={() => apiCall("next")} className="p-2 text-zinc-300 active:scale-90"><SkipForward size={20}/></button>
          </div>
        </div>
      )}
      {minimized && track && (<div className="p-4 flex items-center justify-between"><div className="flex flex-col truncate flex-1 pr-3"><span className="text-xs font-bold text-white truncate">{track.title}</span></div><button onClick={() => apiCall(track.isPlaying ? "pause" : "play", "PUT")} className="w-10 h-10 bg-white rounded-full flex items-center justify-center active:scale-95">{track.isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" className="ml-1" />}</button></div>)}
      {!track && <div className="p-6 text-center text-xs text-zinc-500 font-bold uppercase tracking-widest">Lancez Spotify en fond pour l'utiliser.</div>}
    </motion.div>
  );
}

// ==========================================
// 🔔 COMPOSANT DE MISE A JOUR V3 (POPUP UNIQUE)
// ==========================================
function UpdateModal({ onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      <div className="bg-[#121214] w-full max-w-sm rounded-[24px] p-6 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black rounded-full text-zinc-400 active:scale-90"><X size={16}/></button>
        <div className="flex justify-center mb-5"><div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30"><Sparkles size={24} className="text-emerald-500" /></div></div>
        <h2 className="text-lg font-bold tracking-tight mb-5 text-center text-white">Quoi de neuf ? (V3.0)</h2>
        <div className="space-y-4 mb-6">
          <div className="flex gap-3 items-start"><Trophy size={16} className="text-yellow-500 shrink-0 mt-0.5"/><p className="text-xs text-zinc-400 font-medium"><strong className="text-white">Ligue ciblée :</strong> Classement mondial par exercice (Max 1RM).</p></div>
          <div className="flex gap-3 items-start"><Plus size={16} className="text-blue-500 shrink-0 mt-0.5"/><p className="text-xs text-zinc-400 font-medium"><strong className="text-white">Machines Custom :</strong> Créez vos propres exercices dans le builder.</p></div>
          <div className="flex gap-3 items-start"><ChevronRight size={16} className="text-emerald-500 shrink-0 mt-0.5"/><p className="text-xs text-zinc-400 font-medium"><strong className="text-white">Swipe UI :</strong> Glissez l'écran pour naviguer facilement dans les jours.</p></div>
        </div>
        <button onClick={onClose} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all">Génial !</button>
      </div>
    </motion.div>
  );
}

function AppRouter() {
  const { currentUser } = useAuth();
  const dataContextValues = useData(); 
  
  const [currentTab, setCurrentTab] = useState('home');
  const [spotifyToken, setSpotifyToken] = useState("");
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [showSpotifyWidget, setShowSpotifyWidget] = useState(false);

  const [showUpdateNote, setShowUpdateNote] = useState(() => {
    return localStorage.getItem('mecanik_update_v3_2') !== 'true';
  });

  const closeUpdateNote = () => {
    localStorage.setItem('mecanik_update_v3_2', 'true');
    setShowUpdateNote(false);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('code');
    let token = window.localStorage.getItem("spotify_token");
    if (code && !token) {
      const codeVerifier = window.localStorage.getItem('spotify_code_verifier');
      fetch(`${SPOTIFY_AUTH_URL}/api/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier })
      }).then(res => res.json()).then(data => {
        if (data.access_token) { 
          window.localStorage.setItem("spotify_token", data.access_token); setSpotifyToken(data.access_token); setShowSpotifyWidget(true); window.history.replaceState({}, document.title, window.location.pathname); setCurrentTab('workout'); 
        }
      });
    } else if (token) { setSpotifyToken(token); }
  }, []);

  const loginSpotify = async () => {
    const codeVerifier = generateRandomString(64); window.localStorage.setItem('spotify_code_verifier', codeVerifier);
    const hashed = await sha256(codeVerifier); const codeChallenge = base64encode(hashed);
    const params = new URLSearchParams({ response_type: 'code', client_id: SPOTIFY_CLIENT_ID, scope: SCOPES, code_challenge_method: 'S256', code_challenge: codeChallenge, redirect_uri: REDIRECT_URI });
    window.location.href = `${SPOTIFY_AUTH_URL}/authorize?${params.toString()}`;
  };

  const fetchCurrentlyPlaying = async () => {
    if (!spotifyToken) return;
    try {
      const response = await fetch(`${SPOTIFY_API_URL}/me/player`, { headers: { Authorization: `Bearer ${spotifyToken}` } });
      if (response.status === 401) { setSpotifyToken(""); window.localStorage.removeItem("spotify_token"); setShowSpotifyWidget(false); return; }
      if (response.status === 200) { 
        const data = await response.json(); 
        if(data && data.item) { setSpotifyTrack({ title: data.item.name, artist: data.item.artists[0].name, isPlaying: data.is_playing, progress: data.progress_ms, duration: data.item.duration_ms, image: data.item.album.images[0]?.url, deviceId: data.device?.id }); } 
      } else { setSpotifyTrack(null); }
    } catch (e) { setSpotifyToken(""); window.localStorage.removeItem("spotify_token"); setShowSpotifyWidget(false); }
  };

  useEffect(() => { fetchCurrentlyPlaying(); const interval = setInterval(fetchCurrentlyPlaying, 5000); return () => clearInterval(interval); }, [spotifyToken]);

  if (!currentUser) return <AuthScreen />;

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-black text-white font-sans relative overflow-hidden">
      
      <AnimatePresence>
        {showUpdateNote && <UpdateModal onClose={closeUpdateNote} />}
      </AnimatePresence>

      <div className="flex-1 relative overflow-hidden" style={{ touchAction: "pan-y" }}>
        <AnimatePresence mode="wait">
          {currentTab === 'home' && <DashboardTab key="home" onNavigate={setCurrentTab} />}
          {currentTab === 'workout' && <WorkoutTab key="workout" spotifyToken={spotifyToken} spotifyTrack={spotifyTrack} setShowSpotifyWidget={setShowSpotifyWidget} loginSpotify={loginSpotify} />}
          {currentTab === 'nutrition' && <Nutrition key="nutrition" onBack={() => setCurrentTab('home')} dataContext={dataContextValues} />}
          {currentTab === 'progress' && <Progress key="progress" onBack={() => setCurrentTab('home')} dataContext={dataContextValues} />}
          {currentTab === 'social' && <Social key="social" onBack={() => setCurrentTab('home')} currentUser={currentUser} db={db} />}
        </AnimatePresence>
      </div>
      {showSpotifyWidget && spotifyToken && <FloatingSpotifyWidget token={spotifyToken} track={spotifyTrack} onClose={() => setShowSpotifyWidget(false)} refreshTrack={fetchCurrentlyPlaying} setSpotifyToken={setSpotifyToken} />}
      
      {/* NOUVELLE BARRE DE NAVIGATION A 5 BOUTONS */}
      <div className="fixed bottom-0 left-0 right-0 p-3 z-[90] pointer-events-none">
         <div className="max-w-md mx-auto bg-black/90 backdrop-blur-lg border border-zinc-800/80 rounded-2xl flex justify-between items-center p-1.5 shadow-2xl pointer-events-auto">
            <button onClick={() => setCurrentTab('home')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentTab === 'home' ? 'text-white bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}><LayoutDashboard size={18} className="mb-1" /><span className="text-[8px] font-bold uppercase tracking-widest">Accueil</span></button>
            <button onClick={() => setCurrentTab('workout')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentTab === 'workout' ? 'text-white bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}><Dumbbell size={18} className="mb-1" /><span className="text-[8px] font-bold uppercase tracking-widest">Train</span></button>
            <button onClick={() => setCurrentTab('nutrition')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentTab === 'nutrition' ? 'text-white bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}><Utensils size={18} className="mb-1" /><span className="text-[8px] font-bold uppercase tracking-widest">Diète</span></button>
            <button onClick={() => setCurrentTab('progress')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentTab === 'progress' ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}><TrendingUp size={18} className="mb-1" /><span className="text-[8px] font-bold uppercase tracking-widest">Progrès</span></button>
            <button onClick={() => setCurrentTab('social')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentTab === 'social' ? 'text-yellow-500 bg-yellow-500/10 border border-yellow-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}><Trophy size={18} className="mb-1" /><span className="text-[8px] font-bold uppercase tracking-widest">Ligue</span></button>
         </div>
      </div>
    </div>
  );
}

export default function MecanikApp() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppRouter />
      </DataProvider>
    </AuthProvider>
  );
}