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

// ==========================================
// IMPORTS DES IMAGES (ASSETS)
// ==========================================
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

// ==========================================
// 1. CONFIGURATION CLOUD FIREBASE
// ==========================================
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

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

// ==========================================
// 2. CONTEXTE D'AUTHENTIFICATION (STATE MANAGEMENT)
// ==========================================
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => { setCurrentUser(user); setLoading(false); });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return <AuthContext.Provider value={{ currentUser, login, signup, logout }}>{!loading && children}</AuthContext.Provider>;
}

// ==========================================
// 3. CONTEXTE DES DONNÉES : LE CHAUD ET LE FROID
// ==========================================
const defaultProgramData = {
  1: { type: 'lift', dayName: "Lundi", focus: "Membres Inférieurs", desc: "Surstimulation globale. Vider le glycogène.", exercises: [ { id: '1A', name: "Presse à Cuisses", sets: 4, reps: "12-15", tempo: "3-0-1-1", rest: 180, image: imgPresse }, { id: '1B', name: "Hack Squat", sets: 3, reps: "10-12", tempo: "3-1-1-0", rest: 150, image: imgHackSquat }, { id: '1C', name: "Leg Extension", sets: 4, reps: "15-20", tempo: "2-0-1-2", rest: 90, image: imgLegExtension }, { id: '1D', name: "Adducteurs", sets: 3, reps: "15-20", tempo: "2-0-1-1", rest: 90, image: imgAdducteur }, { id: '1E', name: "Mollets", sets: 4, reps: "12-15", tempo: "3-2-1-2", rest: 90, image: imgMollets } ] },
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
  
  // LE CHAUD (Mémoire locale immédiate)
  const [program, setProgram] = useState(() => JSON.parse(localStorage.getItem('mecanik_program_v6')) || defaultProgramData);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('mecanik_history_v6')) || {});
  const [isSyncing, setIsSyncing] = useState(false);

  // Sauvegarde locale automatique (Zéro latence)
  useEffect(() => { localStorage.setItem('mecanik_program_v6', JSON.stringify(program)); }, [program]);
  useEffect(() => { localStorage.setItem('mecanik_history_v6', JSON.stringify(history)); }, [history]);

  // LE FROID : Chargement initial depuis Firebase
  useEffect(() => {
    if (currentUser) {
      getDoc(doc(db, "users", currentUser.uid)).then(docSnap => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData.program) setProgram(cloudData.program);
          if (cloudData.history) setHistory(cloudData.history);
        }
      });
    }
  }, [currentUser]);

  // LE FROID : Push manuel vers Firebase (Action Utilisateur)
  const syncToCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      await setDoc(doc(db, "users", currentUser.uid), { program, history, lastSync: new Date().toISOString() }, { merge: true });
    } catch (e) { console.error("Erreur de synchronisation:", e); }
    setIsSyncing(false);
  };

  return <DataContext.Provider value={{ program, setProgram, history, setHistory, syncToCloud, isSyncing }}>{children}</DataContext.Provider>;
}

// ==========================================
// CONFIGURATION API SPOTIFY
// ==========================================
const SPOTIFY_CLIENT_ID = "4673eade76a7419c9bad9eaf6ca902fe";
const REDIRECT_URI = window.location.origin + window.location.pathname; 
const SCOPES = "user-read-currently-playing user-modify-playback-state user-read-playback-state";
const generateRandomString = (length) => { const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; const values = crypto.getRandomValues(new Uint8Array(length)); return values.reduce((acc, x) => acc + possible[x % possible.length], ""); };
const sha256 = async (plain) => { const encoder = new TextEncoder(); const data = encoder.encode(plain); return window.crypto.subtle.digest('SHA-256', data); };
const base64encode = (input) => btoa(String.fromCharCode(...new Uint8Array(input))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
// ==========================================
// 4. ÉCRAN D'AUTHENTIFICATION (LOGIN/SIGNUP)
// ==========================================
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (isLogin) await login(email, password);
      else await signup(email, password);
    } catch (err) { setError("Erreur d'authentification. Vérifiez vos identifiants (mot de passe 6 car. min)."); }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-black p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="w-full max-w-sm bg-[#151517] p-8 rounded-[32px] border border-zinc-800 shadow-2xl relative z-10">
        <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20"><Dumbbell size={32} className="text-blue-500" /></div></div>
        <h2 className="text-2xl font-black text-center uppercase tracking-tighter mb-8">{isLogin ? 'Connexion' : 'Rejoindre MÉCANIK'}</h2>
        {error && <p className="text-[10px] text-red-500 bg-red-500/10 p-3 rounded-xl mb-4 text-center font-bold">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:border-blue-500 font-bold text-white placeholder:text-zinc-600" required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:border-blue-500 font-bold text-white placeholder:text-zinc-600" required />
          <button type="submit" className="w-full py-4 bg-blue-600 rounded-full font-black uppercase text-xs shadow-[0_0_20px_rgba(10,132,255,0.4)] text-white flex justify-center items-center gap-2">{isLogin ? 'Entrer' : 'Créer mon compte'} <ArrowRight size={16}/></button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-[10px] text-zinc-500 uppercase font-bold tracking-widest hover:text-white transition-colors">{isLogin ? "Je n'ai pas de compte" : "J'ai déjà un compte"}</button>
      </motion.div>
    </div>
  );
}

// ==========================================
// 5. COMPOSANTS DE L'APPLICATION (VUES)
// ==========================================
function DashboardTab({ onNavigate, spotifyToken, loginSpotify, setShowSpotifyWidget }) {
  const { logout, currentUser } = useAuth();
  const { program } = useData();
  const today = new Date().getDay() || 7; 
  const todaysWorkout = program[today];
  
  let nutritionCals = 0;
  try {
    const journal = JSON.parse(localStorage.getItem('mecanik_nutrition_journal_v4'));
    const todayStr = new Date().toISOString().split('T')[0];
    if (journal && journal[todayStr]) { nutritionCals = Object.values(journal[todayStr].meals).reduce((acc, meal) => acc + meal.cals, 0); }
  } catch(e) {}

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="h-full w-full bg-black p-6 overflow-y-auto pb-32 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <header className="pt-10 mb-8 flex justify-between items-start relative z-10">
        <div><h1 className="text-3xl font-black tracking-tighter uppercase mb-1">MÉCANIK</h1><p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Connecté : {currentUser?.email}</p></div>
        <div className="flex gap-2">
          {!spotifyToken ? ( <button onClick={loginSpotify} className="bg-[#1DB954]/10 p-3 rounded-full text-[#1DB954] border border-[#1DB954]/20 active:scale-95"><LogIn size={20}/></button> ) : ( <button onClick={() => setShowSpotifyWidget(true)} className="bg-zinc-900 p-3 rounded-full text-[#1DB954] border border-zinc-800 active:scale-95"><Music size={20} className="animate-pulse" /></button> )}
          <button onClick={logout} className="bg-red-900/20 p-3 rounded-full text-red-500 border border-red-500/20 active:scale-95"><LogOut size={20}/></button>
        </div>
      </header>

      <div className="space-y-4 relative z-10">
        <div onClick={() => onNavigate('workout')} className="bg-[#151517] border border-zinc-800 rounded-[32px] p-6 shadow-2xl cursor-pointer active:scale-95 transition-transform relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5"><Dumbbell size={100} /></div>
           <div className="flex items-center gap-2 mb-4"><Calendar size={16} className="text-blue-500" /><span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Séance du Jour • {todaysWorkout.dayName}</span></div>
           <h2 className="text-2xl font-black uppercase tracking-tight mb-2">{todaysWorkout.focus}</h2>
           <p className="text-xs text-zinc-400 font-medium mb-6 line-clamp-2">{todaysWorkout.desc}</p>
           <button className="w-full py-4 bg-blue-600 rounded-full font-black uppercase text-xs shadow-[0_0_20px_rgba(10,132,255,0.3)] text-white">Ouvrir la séance</button>
        </div>
        <div onClick={() => onNavigate('nutrition')} className="bg-[#151517] border border-zinc-800 rounded-[32px] p-6 shadow-2xl cursor-pointer active:scale-95 transition-transform relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5"><Utensils size={100} /></div>
           <div className="flex items-center gap-2 mb-4"><Activity size={16} className="text-green-500" /><span className="text-[10px] font-black uppercase tracking-widest text-green-500">Aperçu Nutrition</span></div>
           <div className="flex items-end gap-2 mb-6"><span className="text-4xl font-black tracking-tighter">{Math.round(nutritionCals)}</span><span className="text-sm font-bold text-zinc-500 mb-1">kcal consommées</span></div>
           <button className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-full font-black uppercase text-xs text-white">Ouvrir le journal</button>
        </div>
      </div>
    </motion.div>
  );
}

function WorkoutTab({ spotifyToken, spotifyTrack }) {
  const { program, setProgram, history, setHistory, syncToCloud, isSyncing } = useData(); // LE CHAUD ET LE FROID
  const [activeDay, setActiveDay] = useState(new Date().getDay() || 7);
  const [restTime, setRestTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isEditingDay, setIsEditingDay] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (restTime > 0) { timerRef.current = setInterval(() => setRestTime(t => t - 1), 1000); } 
    else {
      if (restTime === 0 && timerRef.current) {
        window.navigator.vibrate?.([200, 100, 200]);
        if (spotifyToken && spotifyTrack?.isPlaying) { fetch("https://api.spotify.com/v1/me/player/pause", { method: "PUT", headers: { Authorization: `Bearer ${spotifyToken}` } }); }
      }
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [restTime, spotifyToken, spotifyTrack]);

  const startCamera = async () => { try { await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); setIsScanning(true); } catch (err) { alert("⚠️ Caméra bloquée."); } };
  useEffect(() => {
    let scanner = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, false);
      scanner.render((text) => { if(text.startsWith("1"))setActiveDay(1); if(text.startsWith("2"))setActiveDay(2); if(text.startsWith("4"))setActiveDay(4); scanner.clear(); setIsScanning(false); }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(e => console.error(e)); };
  }, [isScanning]);

  const logWeight = (id, weight) => {
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    setHistory(prev => ({ ...prev, [id]: [...(prev[id] || []).filter(h => h.date !== date), { date, weight: parseFloat(weight) }].slice(-10) }));
  };

  const handleSaveDay = (dayId, newExercises) => {
    setProgram(prev => {
      const updated = { ...prev };
      updated[dayId] = { ...updated[dayId], exercises: newExercises, type: newExercises.length > 0 ? (updated[dayId].cardio ? 'mixed' : 'lift') : (updated[dayId].cardio ? 'cardio' : 'rest') };
      return updated;
    });
    setIsEditingDay(false);
  };

  const currentDay = program[activeDay];

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full w-full relative bg-black">
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-black tracking-tight uppercase">Entraînement</h1>
          <button onClick={startCamera} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95 border border-zinc-800"><Scan size={18}/></button>
        </div>
        <div className="flex justify-between gap-1 overflow-x-auto scrollbar-hide pb-1">
          {[1,2,3,4,5,6,7].map(d => ( <button key={d} onClick={() => setActiveDay(d)} className={`flex-shrink-0 w-11 h-11 rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeDay === d ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(10,132,255,0.4)]' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}>{['LUN','MAR','MER','JEU','VEN','SAM','DIM'][d-1]}</button> ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key={`day-${activeDay}`}>
            <div className="mb-6 pl-1 flex justify-between items-start border-l-2 border-blue-600">
              <div><h2 className="text-[26px] font-black leading-tight text-white uppercase tracking-tighter pl-3">{currentDay.focus}</h2><p className="text-[#8E8E93] text-[12px] pl-3 mt-1">{currentDay.desc}</p></div>
              <button onClick={() => setIsEditingDay(true)} className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white border border-zinc-800 shadow-lg"><Edit3 size={18} /></button>
            </div>
            
            {(currentDay.type === 'lift' || currentDay.type === 'mixed') && currentDay.exercises && currentDay.exercises.map(exo => (
              <ExerciseCard key={exo.id} data={exo} onStartRest={() => setRestTime(exo.rest)} history={history[exo.id] || []} onLogWeight={(w) => logWeight(exo.id, w)} />
            ))}
            {currentDay.cardio && <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />}
            {currentDay.type === 'rest' && <RestCard data={currentDay} />}

            {/* BOUTON DE SYNCHRONISATION CLOUD */}
            <div className="mt-12 mb-4">
              <button onClick={syncToCloud} disabled={isSyncing} className={`w-full py-5 rounded-[24px] font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${isSyncing ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600/20 text-blue-500 border border-blue-500/30 hover:bg-blue-600 hover:text-white'}`}>
                {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CloudLightning size={18} />}
                {isSyncing ? 'Synchronisation Cloud...' : 'Sauvegarder dans le Cloud'}
              </button>
              <p className="text-center text-[9px] text-zinc-500 mt-3 font-bold uppercase tracking-widest leading-relaxed px-4">Vos données sont enregistrées en local. Poussez-les vers le cloud à la fin de la séance pour sécuriser votre historique.</p>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isEditingDay && <EditDayModal dayId={activeDay} dayData={currentDay} catalog={CATALOGUE_EXERCICES} onClose={() => setIsEditingDay(false)} onSave={(newExercises) => handleSaveDay(activeDay, newExercises)} />}
      </AnimatePresence>
      <AnimatePresence>
        {isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl p-6 flex flex-col items-center justify-center"><h2 className="text-white mb-6 font-black uppercase tracking-widest text-lg">Scan Machine</h2><div className="w-full max-w-sm rounded-[32px] overflow-hidden bg-black border-4 border-blue-600 shadow-[0_0_30px_rgba(10,132,255,0.3)] relative"><div id="reader" className="w-full"></div></div><button onClick={() => setIsScanning(false)} className="mt-8 px-10 py-4 bg-zinc-900 rounded-full font-black uppercase text-xs text-white border border-zinc-800 active:scale-95">Fermer</button></motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {restTime > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="absolute inset-0 z-[90] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 cursor-pointer" onClick={() => setRestTime(0)}><Timer size={56} className="text-blue-500 mb-8 animate-pulse" /><span className="text-8xl font-mono font-black tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(10,132,255,0.3)]">{Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2,'0')}</span><div className="mt-12 flex items-center gap-3 px-5 py-3 bg-zinc-900 rounded-full border border-zinc-800"><Music size={16} className="text-[#1DB954]" /><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Auto-Pause</span></div></motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}