import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  Play, Timer, Check, Target, HeartPulse, 
  BedDouble, Info, Activity, X, TrendingUp, Star, 
  Scan, Music, SkipForward, SkipBack, Pause, RefreshCw, 
  LogIn, LogOut, Minus, MonitorSpeaker, FastForward, Rewind, 
  Edit3, Plus, Trash2, ChevronLeft, Utensils, Dumbbell, 
  LayoutDashboard, Calendar, ArrowRight, CloudLightning
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';

import Nutrition from './Nutrition';

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

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
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

const CATALOGUE_EXERCICES = [];
Object.values(defaultProgramData).forEach(day => { if (day.exercises) { day.exercises.forEach(exo => { if (!CATALOGUE_EXERCICES.find(e => e.name === exo.name)) { CATALOGUE_EXERCICES.push(exo); } }); } });

const DataContext = createContext();
const useData = () => useContext(DataContext);

function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  
  const [program, setProgram] = useState(() => JSON.parse(localStorage.getItem('mecanik_program_v6')) || defaultProgramData);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('mecanik_history_v6')) || {});
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('mecanik_profile_v6')) || null);
  const [journal, setJournal] = useState(() => JSON.parse(localStorage.getItem('mecanik_journal_v6')) || { [getTodayStr()]: { meals: { breakfast: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, lunch: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, dinner: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, snacks: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 } }, activity: 0, water: 0 } });
  const [isSyncing, setIsSyncing] = useState(false);

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

  return <DataContext.Provider value={{ program, setProgram, history, setHistory, profile, setProfile, journal, setJournal, syncToCloud, isSyncing }}>{children}</DataContext.Provider>;
}

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
      <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="w-full max-w-sm bg-[#151517] p-8 rounded-[32px] border border-zinc-800 shadow-2xl relative z-10">
        <h2 className="text-2xl font-black text-center uppercase tracking-tighter mb-8">{isLogin ? 'Connexion' : 'Rejoindre MÉCANIK'}</h2>
        {error && <p className="text-[10px] text-red-500 bg-red-500/10 p-3 rounded-xl mb-4 text-center font-bold break-words">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:border-blue-500 font-bold text-white placeholder:text-zinc-600" required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:border-blue-500 font-bold text-white placeholder:text-zinc-600" required />
          <button type="submit" className="w-full py-4 bg-blue-600 rounded-full font-black uppercase text-xs shadow-[0_0_20px_rgba(10,132,255,0.4)] text-white">{isLogin ? 'Entrer' : 'Créer mon compte'}</button>
        </form>
        <div className="mt-6 border-t border-zinc-800 pt-6">
          <button onClick={handleGoogle} className="w-full py-4 bg-white rounded-full font-black uppercase text-xs text-black flex justify-center items-center gap-2 active:scale-95 shadow-lg">Google</button>
        </div>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{isLogin ? "Je n'ai pas de compte" : "J'ai déjà un compte"}</button>
      </motion.div>
    </div>
  );
}

function DashboardTab({ onNavigate, spotifyToken, loginSpotify, setShowSpotifyWidget }) {
  const { logout, currentUser } = useAuth();
  const { program, journal } = useData();
  const today = new Date().getDay() || 7; 
  const todaysWorkout = program[today];
  let nutritionCals = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  if (journal && journal[todayStr]) { nutritionCals = Object.values(journal[todayStr].meals).reduce((acc, meal) => acc + meal.cals, 0); }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="h-full w-full bg-black p-6 overflow-y-auto pb-32">
      <header className="pt-10 mb-8 flex justify-between items-start">
        <div className="flex-1 overflow-hidden pr-4"><h1 className="text-3xl font-black tracking-tighter uppercase mb-1">MÉCANIK</h1><p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest truncate">ID : {currentUser?.email}</p></div>
        <div className="flex gap-2 shrink-0"><button onClick={logout} className="bg-red-900/20 p-3 rounded-full text-red-500 border border-red-500/20 active:scale-95"><LogOut size={20}/></button></div>
      </header>
      <div className="space-y-4">
        {!spotifyToken ? (
          <div onClick={loginSpotify} className="bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-[32px] p-6 shadow-2xl cursor-pointer active:scale-95 flex items-center gap-4 group">
            <div className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(29,185,84,0.4)] shrink-0"><Music size={24} fill="black" className="text-black" /></div>
            <div><h2 className="text-xl font-black text-white uppercase tracking-tight">Connecter Spotify</h2><p className="text-[10px] text-[#1DB954] font-bold uppercase tracking-widest mt-1">Lancer le lecteur de musique</p></div>
          </div>
        ) : (
          <div onClick={() => setShowSpotifyWidget(true)} className="bg-zinc-900 border border-[#1DB954]/50 rounded-[32px] p-6 shadow-2xl cursor-pointer active:scale-95 flex items-center gap-4 group">
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center border border-[#1DB954] shrink-0"><Music size={24} className="text-[#1DB954] animate-pulse" /></div>
            <div><h2 className="text-xl font-black text-white uppercase tracking-tight">Spotify Connecté</h2><p className="text-[10px] text-[#1DB954] font-bold uppercase tracking-widest mt-1">Ouvrir le lecteur flottant</p></div>
          </div>
        )}
        <div onClick={() => onNavigate('workout')} className="bg-[#151517] border border-zinc-800 rounded-[32px] p-6 shadow-2xl cursor-pointer active:scale-95"><div className="flex items-center gap-2 mb-4"><Calendar size={16} className="text-blue-500" /><span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Séance du Jour • {todaysWorkout.dayName}</span></div><h2 className="text-2xl font-black uppercase tracking-tight mb-2">{todaysWorkout.focus}</h2><button className="w-full py-4 mt-6 bg-blue-600 rounded-full font-black uppercase text-xs shadow-[0_0_20px_rgba(10,132,255,0.3)] text-white">Ouvrir la séance</button></div>
        <div onClick={() => onNavigate('nutrition')} className="bg-[#151517] border border-zinc-800 rounded-[32px] p-6 shadow-2xl cursor-pointer active:scale-95"><div className="flex items-center gap-2 mb-4"><Activity size={16} className="text-green-500" /><span className="text-[10px] font-black uppercase tracking-widest text-green-500">Aperçu Nutrition</span></div><div className="flex items-end gap-2 mb-6"><span className="text-4xl font-black tracking-tighter">{Math.round(nutritionCals)}</span><span className="text-sm font-bold text-zinc-500 mb-1">kcal consommées</span></div><button className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-full font-black uppercase text-xs text-white">Ouvrir le journal</button></div>
      </div>
    </motion.div>
  );
}

function WorkoutTab({ spotifyToken, spotifyTrack, setShowSpotifyWidget, loginSpotify }) {
  const { program, setProgram, history, setHistory, syncToCloud, isSyncing } = useData(); 
  const [activeDay, setActiveDay] = useState(new Date().getDay() || 7);
  const [restTime, setRestTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isEditingDay, setIsEditingDay] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (restTime > 0) { timerRef.current = setInterval(() => setRestTime(t => t - 1), 1000); } 
    else { if (restTime === 0 && timerRef.current) { window.navigator.vibrate?.([200, 100, 200]); } clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [restTime]);

  const logWeight = (id, weight) => {
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    setHistory(prev => ({ ...prev, [id]: [...(prev[id] || []).filter(h => h.date !== date), { date, weight: parseFloat(weight) }].slice(-10) }));
  };

  const currentDay = program[activeDay];

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full w-full bg-black">
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-black tracking-tight uppercase">Entraînement</h1>
          <div className="flex gap-2">
            {!spotifyToken ? ( <button onClick={loginSpotify} className="p-2.5 bg-[#1DB954]/10 rounded-full text-[#1DB954] border border-[#1DB954]/20"><Music size={18}/></button> ) : ( <button onClick={() => setShowSpotifyWidget(true)} className="p-2.5 bg-zinc-900 rounded-full text-[#1DB954] border border-zinc-800"><Music size={18}/></button> )}
          </div>
        </div>
        <div className="flex justify-between gap-1 overflow-x-auto scrollbar-hide pb-1">
          {[1,2,3,4,5,6,7].map(d => ( <button key={d} onClick={() => setActiveDay(d)} className={`flex-shrink-0 w-11 h-11 rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeDay === d ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(10,132,255,0.4)]' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}>{['LUN','MAR','MER','JEU','VEN','SAM','DIM'][d-1]}</button> ))}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">
        <div className="mb-6 pl-1 flex justify-between items-start border-l-2 border-blue-600">
          <div><h2 className="text-[26px] font-black leading-tight text-white uppercase tracking-tighter pl-3">{currentDay.focus}</h2><p className="text-[#8E8E93] text-[12px] pl-3 mt-1">{currentDay.desc}</p></div>
        </div>
        {(currentDay.type === 'lift' || currentDay.type === 'mixed') && currentDay.exercises && currentDay.exercises.map(exo => (
          <ExerciseCard key={exo.id} data={exo} onStartRest={() => setRestTime(exo.rest)} history={history[exo.id] || []} onLogWeight={(w) => logWeight(exo.id, w)} />
        ))}
        {currentDay.cardio && <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />}
        {currentDay.type === 'rest' && <RestCard data={currentDay} />}
        <div className="mt-12 mb-4">
          <button onClick={syncToCloud} disabled={isSyncing} className={`w-full py-5 rounded-[24px] font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl ${isSyncing ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600/20 text-blue-500 border border-blue-500/30'}`}>
            {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CloudLightning size={18} />} Synchronisation Cloud...
          </button>
        </div>
      </div>
      <AnimatePresence>
        {restTime > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[90] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center cursor-pointer" onClick={() => setRestTime(0)}><Timer size={56} className="text-blue-500 mb-8 animate-pulse" /><span className="text-8xl font-mono font-black tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(10,132,255,0.3)]">{Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2,'0')}</span></motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExerciseCard({ data, onStartRest, history, onLogWeight }) {
  const [completedSets, setCompletedSets] = useState([]);
  const [weight, setWeight] = useState("");
  const toggleSet = (i) => {
    const done = !completedSets.includes(i);
    setCompletedSets(prev => done ? [...prev, i] : prev.filter(s => s !== i));
    if (done && weight) onLogWeight(weight);
  };
  return (
    <div className="bg-[#151517] rounded-[32px] border border-[#222225] overflow-hidden mb-6 flex flex-col shadow-2xl">
      <div className="p-5 flex justify-between items-center border-b border-[#222225] bg-[#1a1a1c]">
        <div><h3 className="text-[17px] font-bold text-white leading-tight mb-1">{data.name}</h3><div className="bg-black px-2.5 py-1 rounded-md text-[10px] font-black text-blue-500 inline-block uppercase tracking-widest border border-zinc-800">{data.sets}x{data.reps} • {data.tempo}</div></div>
      </div>
      <div className="p-5 space-y-5">
        <div className="h-48 bg-black rounded-[24px] overflow-hidden border border-[#222225] flex items-center justify-center"><img src={data.image} alt="" className="w-full h-full object-contain opacity-80" /></div>
        <div className="flex gap-3"><div className="flex-1 bg-black p-4 rounded-[24px] border border-[#222225] flex items-center"><span className="text-[11px] text-zinc-600 uppercase font-black mr-4 tracking-widest">Kilos</span><input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="---" className="bg-transparent font-black text-white text-xl outline-none w-full" /></div></div>
        <div className="flex justify-between items-center px-1 bg-zinc-900/30 p-2 rounded-full border border-zinc-800/50">
            <div className="flex gap-2 pl-1">{[...Array(parseInt(data.sets))].map((_, i) => (<button key={i} onClick={() => toggleSet(i)} className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm ${completedSets.includes(i) ? 'bg-[#34C759] text-black shadow-[0_0_20px_rgba(52,199,89,0.4)]' : 'bg-[#222225] text-[#8E8E93]'}`}>{completedSets.includes(i) ? <Check size={22} strokeWidth={4} /> : i + 1}</button>))}</div>
            <button onClick={onStartRest} className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.4)] mr-1"><Play size={24} fill="white" className="ml-1"/></button>
        </div>
      </div>
    </div>
  );
}

function CardioCard({ data, isFinisher }) {
  return (
    <article className="bg-[#1A1111] rounded-[32px] border border-[#3A1D1D] p-8 mb-6 shadow-2xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6"><HeartPulse size={18} className="text-[#FF453A] animate-pulse" /><span className="text-[#FF453A] text-[11px] font-black uppercase tracking-widest">{isFinisher ? "Finisher FATmax" : "Cardio Exclusif"}</span></div>
        <h3 className="text-2xl font-black text-white mb-6 tracking-tight">{data.name}</h3>
        <div className="flex gap-4 mb-6"><div className="flex-1 bg-black/80 rounded-[20px] p-5 border border-[#3A1D1D] text-center shadow-inner"><span className="text-[10px] text-zinc-500 font-black block mb-2 uppercase tracking-widest">Temps</span><span className="font-black text-xl text-white">{data.duration}</span></div><div className="flex-1 bg-[#FF453A]/10 rounded-[20px] p-5 border border-[#FF453A]/30 text-center shadow-inner"><span className="text-[10px] text-[#FF453A] font-black block mb-2 uppercase tracking-widest">BPM Cible</span><span className="font-black text-xl text-[#FF453A] font-mono">{data.bpm}</span></div></div>
        <div className="bg-black/60 p-4 rounded-[20px] flex gap-4 items-start border border-[#3A1D1D]/50"><Info size={18} className="text-[#FF453A] mt-0.5 shrink-0" /><p className="text-[12px] text-[#D1D1D6] leading-relaxed font-medium">{data.focus}</p></div>
      </div>
    </article>
  );
}

function RestCard({ data }) {
  return (
    <div className="bg-[#151517] p-10 rounded-[32px] border border-[#222225] text-center mt-8 shadow-2xl">
      <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-600/20"><BedDouble size={40} className="text-blue-500" /></div>
      <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">{data.focus}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed font-medium">{data.desc}</p>
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
// 7. CHEF D'ORCHESTRE GLOBAL (ROUTER)
// ==========================================
function AppRouter() {
  const { currentUser } = useAuth();
  const dataContextValues = useData(); 
  
  const [currentTab, setCurrentTab] = useState('home');
  const [spotifyToken, setSpotifyToken] = useState("");
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [showSpotifyWidget, setShowSpotifyWidget] = useState(false);

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
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {currentTab === 'home' && <DashboardTab key="home" onNavigate={setCurrentTab} spotifyToken={spotifyToken} loginSpotify={loginSpotify} setShowSpotifyWidget={setShowSpotifyWidget} />}
          {currentTab === 'workout' && <WorkoutTab key="workout" spotifyToken={spotifyToken} spotifyTrack={spotifyTrack} setShowSpotifyWidget={setShowSpotifyWidget} loginSpotify={loginSpotify} />}
          {currentTab === 'nutrition' && <Nutrition key="nutrition" onBack={() => setCurrentTab('home')} dataContext={dataContextValues} />}
        </AnimatePresence>
      </div>
      {showSpotifyWidget && spotifyToken && <FloatingSpotifyWidget token={spotifyToken} track={spotifyTrack} onClose={() => setShowSpotifyWidget(false)} refreshTrack={fetchCurrentlyPlaying} setSpotifyToken={setSpotifyToken} />}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-[90] pointer-events-none">
         <div className="max-w-md mx-auto bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-full flex justify-between items-center p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto">
            <button onClick={() => setCurrentTab('home')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-full transition-all ${currentTab === 'home' ? 'text-white bg-zinc-900 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}><LayoutDashboard size={20} className="mb-1" /><span className="text-[9px] font-bold uppercase tracking-widest">Accueil</span></button>
            <button onClick={() => setCurrentTab('workout')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-full transition-all ${currentTab === 'workout' ? 'text-white bg-zinc-900 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}><Dumbbell size={20} className="mb-1" /><span className="text-[9px] font-bold uppercase tracking-widest">Entraînement</span></button>
            <button onClick={() => setCurrentTab('nutrition')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-full transition-all ${currentTab === 'nutrition' ? 'text-white bg-zinc-900 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}><Utensils size={20} className="mb-1" /><span className="text-[9px] font-bold uppercase tracking-widest">Nutrition</span></button>
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