import React, { useState, useEffect, createContext, useContext, Suspense, lazy } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Music, Minus, X, SkipBack, Pause, Play, SkipForward, LayoutDashboard, Dumbbell, Utensils, Trophy, Sparkles, ChevronRight, Plus, Activity } from 'lucide-react';

// ==========================================
// LAZY LOADING : Chargement à la demande
// ==========================================
const DashboardTab = lazy(() => import('./Dashboard'));
const WorkoutTab = lazy(() => import('./Workout'));
const Nutrition = lazy(() => import('./Nutrition'));
const Social = lazy(() => import('./Social'));
const AICoach = lazy(() => import('./AICoach'));

import { DataProvider, useData } from './context/DataContext';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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

// ==========================================
// AUTHENTIFICATION
// ==========================================
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => { setCurrentUser(user); setLoading(false); });
    return unsubscribe;
  }, []);

  const clearAppCache = () => {
    ['mecanik_program_v6', 'mecanik_history_v6', 'mecanik_profile_v6', 'mecanik_journal_v6', 'mecanik_program', 'mecanik_history', 'mecanik_profile', 'mecanik_journal'].forEach(k => localStorage.removeItem(k));
  };

  const login = async (email, password) => { clearAppCache(); return signInWithEmailAndPassword(auth, email, password); };
  const signup = async (email, password) => { clearAppCache(); return createUserWithEmailAndPassword(auth, email, password); };
  const loginWithGoogle = async () => { clearAppCache(); const provider = new GoogleAuthProvider(); return signInWithPopup(auth, provider); };
  const logout = async () => { await signOut(auth); clearAppCache(); window.location.reload(); };

  return <AuthContext.Provider value={{ currentUser, login, signup, loginWithGoogle, logout }}>{!loading && children}</AuthContext.Provider>;
}

// ==========================================
// SPOTIFY CONFIG
// ==========================================
const SPOTIFY_AUTH_URL = atob("aHR0cHM6Ly9hY2NvdW50cy5zcG90aWZ5LmNvbQ=="); 
const SPOTIFY_API_URL = atob("aHR0cHM6Ly9hcGkuc3BvdGlmeS5jb20vdjE="); 
const SPOTIFY_CLIENT_ID = "4673eade76a7419c9bad9eaf6ca902fe";
const REDIRECT_URI = window.location.origin + window.location.pathname; 
const SCOPES = "user-read-currently-playing user-modify-playback-state user-read-playback-state";

const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input) => btoa(String.fromCharCode(...new Uint8Array(input))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

// ==========================================
// COMPOSANTS GLOBAUX
// ==========================================
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

function UpdateModal({ onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      <div className="bg-[#121214] w-full max-w-sm rounded-[24px] p-6 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black rounded-full text-zinc-400 active:scale-90"><X size={16}/></button>
        <div className="flex justify-center mb-5"><div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30"><Sparkles size={24} className="text-emerald-500" /></div></div>
        <h2 className="text-lg font-bold tracking-tight mb-5 text-center text-white">Quoi de neuf ? (V4.0)</h2>
        <div className="space-y-4 mb-6">
          <div className="flex gap-3 items-start"><Trophy size={16} className="text-yellow-500 shrink-0 mt-0.5"/><p className="text-xs text-zinc-400 font-medium"><strong className="text-white">Simplification :</strong> Retour à l'essentiel : Train, Diète, Ligue.</p></div>
          <div className="flex gap-3 items-start"><Plus size={16} className="text-blue-500 shrink-0 mt-0.5"/><p className="text-xs text-zinc-400 font-medium"><strong className="text-white">Performances :</strong> Base de données ultra-rapide et nettoyée.</p></div>
        </div>
        <button onClick={onClose} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all">Génial !</button>
      </div>
    </motion.div>
  );
}

// ==========================================
// MOTEUR PRINCIPAL (ROUTER)
// ==========================================
function AppRouter() {
  const { currentUser } = useAuth();
  const dataContextValues = useData(); 

  const [currentTab, setCurrentTab] = useState('home');
  const [spotifyToken, setSpotifyToken] = useState("");
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [showSpotifyWidget, setShowSpotifyWidget] = useState(false);
  
  const [showUpdateNote, setShowUpdateNote] = useState(() => {
    return localStorage.getItem('mecanik_update_v4_0') !== 'true';
  });

  const closeUpdateNote = () => {
    localStorage.setItem('mecanik_update_v4_0', 'true');
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
        <Suspense fallback={
            <div className="h-full w-full bg-black flex flex-col items-center justify-center">
                <Activity size={40} className="text-blue-500 animate-pulse mb-4" />
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Chargement...</p>
            </div>
        }>
            <AnimatePresence mode="wait">
              {currentTab === 'home' && <DashboardTab key="home" onNavigate={setCurrentTab} />}
              {currentTab === 'workout' && <WorkoutTab key="workout" spotifyToken={spotifyToken} spotifyTrack={spotifyTrack} setShowSpotifyWidget={setShowSpotifyWidget} loginSpotify={loginSpotify} db={db} />}
              {currentTab === 'nutrition' && <Nutrition key="nutrition" onBack={() => setCurrentTab('home')} dataContext={dataContextValues} />}
              {currentTab === 'social' && <Social key="social" onBack={() => setCurrentTab('home')} currentUser={currentUser} db={db} />}
              {currentTab === 'coach' && <AICoach onBack={() => setCurrentTab('home')} dataContext={dataContextValues} />}
            </AnimatePresence>
        </Suspense>
      </div>

      {showSpotifyWidget && spotifyToken && <FloatingSpotifyWidget token={spotifyToken} track={spotifyTrack} onClose={() => setShowSpotifyWidget(false)} refreshTrack={fetchCurrentlyPlaying} setSpotifyToken={setSpotifyToken} />}
      
      {/* 🟢 BARRE DE NAVIGATION MODIFIÉE (Progrès supprimé, 4 boutons restants) */}
      <div className="fixed bottom-0 left-0 right-0 p-3 z-[90] pointer-events-none">
         <div className="max-w-md mx-auto bg-black/90 backdrop-blur-lg border border-zinc-800/80 rounded-2xl flex justify-between items-center p-1.5 shadow-2xl pointer-events-auto">
            <button onClick={() => setCurrentTab('home')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentTab === 'home' ? 'text-white bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}><LayoutDashboard size={18} className="mb-1" /><span className="text-[8px] font-bold uppercase tracking-widest">Accueil</span></button>
            <button onClick={() => setCurrentTab('workout')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentTab === 'workout' ? 'text-white bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}><Dumbbell size={18} className="mb-1" /><span className="text-[8px] font-bold uppercase tracking-widest">Train</span></button>
            <button onClick={() => setCurrentTab('nutrition')} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentTab === 'nutrition' ? 'text-white bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}><Utensils size={18} className="mb-1" /><span className="text-[8px] font-bold uppercase tracking-widest">Diète</span></button>
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