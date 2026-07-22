import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
   Music, Minus, X, SkipBack, Pause, Play, SkipForward, 
   LayoutDashboard, Dumbbell, Utensils, Trophy, Activity 
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { db } from './services/firebase';

const DashboardTab = lazy(() => import('./Dashboard'));
const WorkoutTab = lazy(() => import('./Workout'));
const Nutrition = lazy(() => import('./Nutrition'));
const Social = lazy(() => import('./Social'));
const AICoach = lazy(() => import('./AICoach'));

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "4673eade76a7419c9bad9eaf6ca902fe";
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

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) await login(email, password);
      else await signup(email, password);
    } catch (err) {
      if (err.code === 'auth/weak-password') setError("Mot de passe trop court (6 min).");
      else if (err.code === 'auth/email-already-in-use') setError("Cet email est déjà utilisé.");
      else setError("Erreur d'authentification. Vérifiez vos identifiants.");
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0B0E0B] p-6 relative overflow-hidden">
      <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="w-full max-w-sm bg-[#1A1E1A] p-8 rounded-[36px] border border-zinc-800 shadow-2xl relative z-10 shape-asym-1">
        <h2 className="text-xl font-black text-center tracking-tight mb-8 text-[#D4FC47] uppercase italic">{isLogin ? 'Connexion' : 'Rejoindre MĘCANIK'}</h2>
        {error && <p className="text-[10px] text-red-400 bg-red-500/10 p-3 rounded-2xl mb-4 text-center font-bold break-words">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-[#0B0E0B] p-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#D4FC47] font-medium text-sm text-white placeholder:text-zinc-600" required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-[#0B0E0B] p-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#D4FC47] font-medium text-sm text-white placeholder:text-zinc-600" required />
          <button type="submit" className="w-full py-4 bg-[#D4FC47] text-black rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform">{isLogin ? 'Entrer' : 'Créer mon compte'}</button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-xs text-zinc-400 font-bold">{isLogin ? "Je n'ai pas de compte" : "J'ai déjà un compte"}</button>
      </motion.div>
    </div>
  );
}

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
          window.localStorage.setItem("spotify_token", data.access_token);
          setSpotifyToken(data.access_token);
          setShowSpotifyWidget(true);
          window.history.replaceState({}, document.title, window.location.pathname);
          setCurrentTab('workout');
        }
      });
    } else if (token) { setSpotifyToken(token); }
  }, []);

  if (!currentUser) return <AuthScreen />;

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-[#0B0E0B] text-white font-sans relative overflow-hidden">
      <div className="flex-1 relative overflow-hidden" style={{ touchAction: "pan-y" }}>
        <Suspense fallback={
            <div className="h-full w-full bg-[#0B0E0B] flex flex-col items-center justify-center">
                <Activity size={40} className="text-[#D4FC47] animate-pulse mb-4" />
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Chargement...</p>
            </div>
        }>
            <AnimatePresence mode="wait">
              {currentTab === 'home' && <DashboardTab key="home" onNavigate={setCurrentTab} />}
              {currentTab === 'workout' && <WorkoutTab key="workout" db={db} />}
              {currentTab === 'nutrition' && <Nutrition key="nutrition" onBack={() => setCurrentTab('home')} dataContext={dataContextValues} />}
              {currentTab === 'social' && <Social key="social" onBack={() => setCurrentTab('home')} currentUser={currentUser} db={db} />}
              {currentTab === 'coach' && <AICoach onBack={() => setCurrentTab('home')} dataContext={dataContextValues} />}
            </AnimatePresence>
        </Suspense>
      </div>

      // Bloc de navigation dans App.jsx
      <div className="fixed bottom-6 left-6 right-6 z-[90] pointer-events-none flex justify-center">
        <div className="bg-[#141814]/95 backdrop-blur-2xl border border-zinc-800/80 rounded-full flex justify-between items-center px-5 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.9)] pointer-events-auto gap-2 w-full max-w-sm">
            <button onClick={() => setCurrentTab('home')} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-full transition-all ${currentTab === 'home' ? 'bg-[#D4FC47] text-black font-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'}`}>
              <LayoutDashboard size={16} className="mb-0.5" />
              <span className="text-[7px] uppercase tracking-widest font-black">Accueil</span>
            </button>
            <button onClick={() => setCurrentTab('workout')} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-full transition-all ${currentTab === 'workout' ? 'bg-[#D4FC47] text-black font-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'}`}>
              <Dumbbell size={16} className="mb-0.5" />
              <span className="text-[7px] uppercase tracking-widest font-black">Train</span>
            </button>
            <button onClick={() => setCurrentTab('nutrition')} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-full transition-all ${currentTab === 'nutrition' ? 'bg-[#D4FC47] text-black font-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'}`}>
              <Utensils size={16} className="mb-0.5" />
              <span className="text-[7px] uppercase tracking-widest font-black">Diète</span>
            </button>
            <button onClick={() => setCurrentTab('social')} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-full transition-all ${currentTab === 'social' ? 'bg-[#D4FC47] text-black font-black shadow-lg scale-105' : 'text-zinc-400 hover:text-white'}`}>
              <Trophy size={16} className="mb-0.5" />
              <span className="text-[7px] uppercase tracking-widest font-black">Ligue</span>
            </button>
        </div>
      </div>
    </div>
  );
}

export default function MecanikApp() {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
}