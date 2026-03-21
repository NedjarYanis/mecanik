import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Timer, Check, ShieldAlert, Target, HeartPulse, 
  BedDouble, Info, Activity, X, TrendingUp, Star, Download, 
  StickyNote, Scan, Music, SkipForward, SkipBack, Pause, RefreshCw, 
  LogIn, LogOut, Minus, MonitorSpeaker, FastForward, Rewind
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';

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
// CONFIGURATION API SPOTIFY (SÉCURITÉ PKCE)
// ==========================================
const SPOTIFY_CLIENT_ID = "4673eade76a7419c9bad9eaf6ca902fe";
const REDIRECT_URI = window.location.origin + window.location.pathname; 
const SCOPES = "user-read-currently-playing user-modify-playback-state user-read-playback-state";

// Outils Cryptographiques
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
const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

// ==========================================
// BASE DE DONNÉES COMPLÈTE (7 JOURS)
// ==========================================
const programData = {
  1: { type: 'lift', dayName: "Lundi", focus: "Membres Inférieurs", desc: "Surstimulation globale. Vider le glycogène.",
    exercises: [
      { id: '1A', name: "Presse à Cuisses (45°)", sets: 4, reps: "12-15", tempo: "3-0-1-1", rest: 180, weight: "175 kg", muscle: "Quadriceps", safety: "Profondeur max SANS rétroversion.", image: imgPresse, alternative: { name: "Presse Horizontale Matrix", note: "Même ciblage, plus stable pour le dos." } },
      { id: '1B', name: "Hack Squat Machine", sets: 3, reps: "10-12", tempo: "3-1-1-0", rest: 150, weight: "~130 kg", muscle: "Quadriceps", safety: "Pause d'1s en bas.", image: imgHackSquat, alternative: { name: "V-Squat Machine", note: "Plus de focus sur la chaîne postérieure." } },
      { id: '1C', name: "Leg Extension (Assis)", sets: 4, reps: "15-20", tempo: "2-0-1-2", rest: 90, weight: "RIR 1-2", muscle: "Droit fémoral", safety: "Contraction 2s au sommet.", image: imgLegExtension, alternative: { name: "Sissy Squat Machine", note: "Alternative au poids du corps." } },
      { id: '1D', name: "Machine à Adducteurs", sets: 3, reps: "15-20", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Adducteurs", safety: "Stabilisation du grand trochanter.", image: imgAdducteur, alternative: { name: "Adducteurs Poulie", note: "Avec sangle cheville." } },
      { id: '1E', name: "Extension Mollets", sets: 4, reps: "12-15", tempo: "3-2-1-2", rest: 90, weight: "~120 kg", muscle: "Mollets", safety: "Étirement profond (2s) sous charge.", image: imgMollets, alternative: { name: "Mollets Assis", note: "Cible le muscle soléaire." } }
    ]
  },
  2: { type: 'mixed', dayName: "Mardi", focus: "Poussée Supérieure", desc: "Neutraliser la peur via la sécurité mécanique.",
    exercises: [
      { id: '2A', name: "DC Smith Machine", sets: 4, reps: "6-8", tempo: "3-0-1-0", rest: 180, weight: "64 kg", muscle: "Pectoraux", safety: "Routine 15s. Axe guidé.", image: imgDCSmith, alternative: { name: "Chest Press Matrix", note: "Si la Smith est occupée." } },
      { id: '2B', name: "Chest Press Convergente", sets: 3, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Pectoraux", safety: "Scapulas rétractées.", image: imgChestPress, alternative: { name: "Pec Deck (Écartés)", note: "Priorité à l'étirement." } },
      { id: '2C', name: "Shoulder Press", sets: 3, reps: "10-12", tempo: "3-0-1-0", rest: 120, weight: "RIR 2", muscle: "Épaules", safety: "Améliorer ratio V.", image: imgShoulderPress, alternative: { name: "Développé Haltères", note: "Plus grande liberté articulaire." } },
      { id: '2D', name: "Triceps Pushdown", sets: 4, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Triceps", safety: "Coudes scellés.", image: imgTriceps, alternative: { name: "Extension Nuque Poulie", note: "Cible le chef long du triceps." } },
      { id: '2E', name: "Élévations Latérales", sets: 3, reps: "15-20", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", muscle: "Deltoïde", safety: "Continu sans élan.", image: imgLateralRaise, alternative: { name: "Élévations Poulie", note: "Tension continue garantie." } }
    ],
    cardio: { name: "Vélo Assis (Recline)", duration: "30 min", bpm: "119-129", focus: "FATmax post-séance." }
  },
  3: { type: 'cardio', dayName: "Mercredi", focus: "Régénération & FATmax", desc: "Nettoyer les déchets et consommer la graisse viscérale.",
    cardio: { name: "Elliptique ou Marche Inclinée", duration: "45-60 min", bpm: "119-129", focus: "Ne JAMAIS courir. Interdiction de dépasser 130 bpm." }
  },
  4: { type: 'mixed', dayName: "Jeudi", focus: "Tirage Supérieur + FATmax", desc: "Épaisseur Dorsale & Ouverture cage thoracique.",
    exercises: [
      { id: '4A', name: "Lat Pulldown (Poulie Haute)", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Grand Dorsal", safety: "Abaisser omoplates.", image: imgLatPulldown, alternative: { name: "Hammer Strength High Row", note: "Excellente alternative convergente." } },
      { id: '4B', name: "Seated Cable Row", sets: 4, reps: "10-12", tempo: "3-0-1-1", rest: 120, weight: "RIR 2", muscle: "Rhomboïdes", safety: "Fixer le buste.", image: imgSeatedRow, alternative: { name: "Tirage Buste Penché", note: "Attention aux lombaires." } },
      { id: '4C', name: "Pull-over poulie haute", sets: 3, reps: "15", tempo: "2-0-1-0", rest: 90, weight: "RIR 1-2", muscle: "Dorsaux", safety: "Tension continue.", image: imgPullover, alternative: { name: "Pull-over Haltère", note: "Excellente ouverture thoracique." } },
      { id: '4D', name: "Curl Marteau (Haltères)", sets: 4, reps: "8-10", tempo: "3-0-1-1", rest: 90, weight: "18-20 kg", muscle: "Brachio-radial", safety: "Excentrique 3s.", image: imgHammerCurl, alternative: { name: "Curl Marteau Poulie", note: "Avec la corde." } },
      { id: '4E', name: "Curl Biceps Machine", sets: 3, reps: "12-15", tempo: "2-0-1-1", rest: 90, weight: "RIR 1-2", muscle: "Biceps", safety: "Pump massif.", image: imgCurlBiceps, alternative: { name: "Curl Pupitre EZ", note: "Maintient l'isolation." } }
    ],
    cardio: { name: "Marche Inclinée", duration: "30 min", bpm: "119-129", focus: "Inclinaison 8-12%. Aucun impact." }
  },
  5: { type: 'cardio', dayName: "Vendredi", focus: "Lavage Métabolique", desc: "Capitaliser sur l'état de sensibilité à l'insuline.",
    cardio: { name: "Protocole Croisé", duration: "60-75 min", bpm: "119-129", focus: "20' Vélo + 20' Elliptique + 20' Hand-Bike." }
  },
  6: { type: 'rest', dayName: "Samedi", focus: "Régénération Tissulaire", desc: "La croissance s'opère aujourd'hui. L'inflammation locale va se résorber." },
  7: { type: 'rest', dayName: "Dimanche", focus: "Repos Absolu", desc: "Restauration totale du système nerveux central avant la Semaine 2." }
};

// ==========================================
// COMPOSANT PRINCIPAL (APP)
// ==========================================
export default function MecanikApp() {
  const [activeDay, setActiveDay] = useState(1);
  const [restTime, setRestTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  
  // États de l'API Spotify
  const [spotifyToken, setSpotifyToken] = useState("");
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [showSpotifyWidget, setShowSpotifyWidget] = useState(false);
  
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('mecanik_v10_history')) || {});
  const timerRef = useRef(null);

  // AUTHENTIFICATION PKCE (Sécurisée)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('code');
    let token = window.localStorage.getItem("spotify_token");

    if (code && !token) {
      const codeVerifier = window.localStorage.getItem('spotify_code_verifier');
      fetch("https://accounts.spotify.com/api/token", {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier,
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          window.localStorage.setItem("spotify_token", data.access_token);
          setSpotifyToken(data.access_token);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    } else {
      setSpotifyToken(token);
    }
  }, []);

  const loginSpotify = async () => {
    const codeVerifier = generateRandomString(64);
    window.localStorage.setItem('spotify_code_verifier', codeVerifier);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: REDIRECT_URI,
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  const fetchCurrentlyPlaying = async () => {
    if (!spotifyToken) return;
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      if (response.status === 401) { 
        setSpotifyToken(""); window.localStorage.removeItem("spotify_token"); return; 
      }
      if (response.status === 200) {
        const data = await response.json();
        if(data && data.item) {
          setSpotifyTrack({ 
            title: data.item.name, 
            artist: data.item.artists[0].name, 
            isPlaying: data.is_playing,
            progress: data.progress_ms,
            duration: data.item.duration_ms,
            image: data.item.album.images[0]?.url,
            deviceId: data.device?.id
          });
        }
      } else { setSpotifyTrack(null); }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchCurrentlyPlaying();
    const interval = setInterval(fetchCurrentlyPlaying, 5000); 
    return () => clearInterval(interval);
  }, [spotifyToken]);

  // CHRONO INTELLIGENT
  useEffect(() => {
    if (restTime > 0) {
      timerRef.current = setInterval(() => setRestTime(t => t - 1), 1000);
    } else {
      if (restTime === 0 && timerRef.current) {
        window.navigator.vibrate?.([200, 100, 200]);
        if (spotifyToken && spotifyTrack?.isPlaying) {
          fetch("https://api.spotify.com/v1/me/player/pause", { method: "PUT", headers: { Authorization: `Bearer ${spotifyToken}` } });
        }
      }
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [restTime, spotifyToken, spotifyTrack]);

  // CAMERA FORCÉE
  const startCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setIsScanning(true);
    } catch (err) {
      alert("⚠️ Autorisez la caméra dans les paramètres de votre navigateur.");
    }
  };

  useEffect(() => {
    let scanner = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, false);
      scanner.render((decodedText) => {
          if (decodedText.startsWith("1")) setActiveDay(1);
          if (decodedText.startsWith("2")) setActiveDay(2);
          if (decodedText.startsWith("4")) setActiveDay(4);
          alert(`Cible verrouillée : ${decodedText}`);
          scanner.clear(); setIsScanning(false);
      }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(e => console.error(e)); };
  }, [isScanning]);

  const currentDay = programData[activeDay];
  
  const logWeight = (id, weight) => {
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const newHistory = {
      ...history,
      [id]: [...(history[id] || []).filter(h => h.date !== date), { date, weight: parseFloat(weight) }].slice(-10)
    };
    setHistory(newHistory);
    localStorage.setItem('mecanik_v10_history', JSON.stringify(newHistory));
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-black text-white font-sans relative overflow-hidden">
      
      {/* HEADER */}
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight uppercase">MÉCANIK</h1>
            <button onClick={startCamera} className="p-2 bg-blue-600 rounded-full text-white active:scale-95 shadow-lg shadow-blue-900/50"><Scan size={16}/></button>
          </div>
          
          {!spotifyToken ? (
            <button onClick={loginSpotify} className="bg-[#1DB954] px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase text-black active:scale-95">
               <LogIn size={14}/> Connect Spotify
            </button>
          ) : (
            <button onClick={() => setShowSpotifyWidget(true)} className="bg-zinc-900 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase text-[#1DB954] border border-zinc-800 active:scale-95">
               <Music size={14} className="animate-pulse" /> Ouvrir Lecteur
            </button>
          )}
        </div>
        
        <div className="flex justify-between gap-1 overflow-x-auto scrollbar-hide pb-1">
          {[1,2,3,4,5,6,7].map(d => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`flex-shrink-0 w-11 h-11 rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeDay === d ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(10,132,255,0.4)]' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}>
              {['LUN','MAR','MER','JEU','VEN','SAM','DIM'][d-1]}
            </button>
          ))}
        </div>
      </header>

      {/* ZONE CONTENU */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} key={activeDay}>
            <div className="mb-6 pl-1 border-l-2 border-blue-600">
              <h2 className="text-[26px] font-black leading-tight text-white uppercase tracking-tighter pl-3">{currentDay.focus}</h2>
              <p className="text-[#8E8E93] text-[12px] pl-3 mt-1">{currentDay.desc}</p>
            </div>

            {(currentDay.type === 'lift' || currentDay.type === 'mixed') && currentDay.exercises.map(exo => (
              <ExerciseCard key={exo.id} data={exo} onStartRest={() => setRestTime(exo.rest)} history={history[exo.id] || []} onLogWeight={(w) => logWeight(exo.id, w)} />
            ))}
            {currentDay.cardio && <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />}
            {currentDay.type === 'rest' && <RestCard data={currentDay} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* WIDGET FLOTTANT SPOTIFY */}
      {showSpotifyWidget && spotifyToken && (
        <FloatingSpotifyWidget 
          token={spotifyToken} track={spotifyTrack} 
          onClose={() => setShowSpotifyWidget(false)} 
          refreshTrack={fetchCurrentlyPlaying} 
        />
      )}

      {/* MODAL SCANNER */}
      <AnimatePresence>
        {isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl p-6 flex flex-col items-center justify-center">
            <h2 className="text-white mb-6 font-black uppercase tracking-widest text-lg">Scan Machine</h2>
            <div className="w-full max-w-sm rounded-[32px] overflow-hidden bg-black border-4 border-blue-600 shadow-[0_0_30px_rgba(10,132,255,0.3)] relative"><div id="reader" className="w-full"></div></div>
            <button onClick={() => setIsScanning(false)} className="mt-8 px-10 py-4 bg-zinc-900 rounded-full font-black uppercase text-xs text-white border border-zinc-800 active:scale-95">Fermer la caméra</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY CHRONO */}
      <AnimatePresence>
        {restTime > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="absolute inset-0 z-[90] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 cursor-pointer" onClick={() => setRestTime(0)}>
            <Timer size={56} className="text-blue-500 mb-8 animate-pulse" />
            <span className="text-8xl font-mono font-black tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(10,132,255,0.3)]">{Math.floor(restTime/60)}:{(restTime%60).toString().padStart(2,'0')}</span>
            <div className="mt-12 flex items-center gap-3 px-5 py-3 bg-zinc-900 rounded-full border border-zinc-800"><Music size={16} className="text-[#1DB954]" /><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Auto-Pause à la fin du repos</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// ==========================================
// WIDGET FLOTTANT SPOTIFY (NOUVEAU - TACTILE, ZOOM, MAGNÉTISME)
// ==========================================
function FloatingSpotifyWidget({ token, track, onClose, refreshTrack }) {
  const dragControls = useDragControls();
  const [minimized, setMinimized] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [devices, setDevices] = useState([]);
  const [localProgress, setLocalProgress] = useState(0);
  
  // États de manipulation Tactile
  const [scale, setScale] = useState(1);
  const pinchRef = useRef(null);

  useEffect(() => { setLocalProgress(track?.progress || 0); }, [track?.progress]);

  useEffect(() => {
    let int;
    if (track?.isPlaying) { int = setInterval(() => setLocalProgress(p => p + 1000), 1000); }
    return () => clearInterval(int);
  }, [track?.isPlaying]);

  const apiCall = async (endpoint, method = "POST", body = null) => {
    try {
      await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });
      setTimeout(refreshTrack, 600);
    } catch (e) { console.error(e); }
  };

  const getDevices = async () => {
    const res = await fetch("https://api.spotify.com/v1/me/player/devices", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setDevices(data.devices || []);
    setShowDevices(!showDevices);
  };

  const handleSeek = (e) => {
    const newMs = parseInt(e.target.value);
    setLocalProgress(newMs);
    apiCall(`seek?position_ms=${newMs}`, "PUT");
  };

  const formatTime = (ms) => {
    const total = Math.floor(ms / 1000);
    return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
  };

  // Logique PINCH-TO-ZOOM
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.stopPropagation(); // Bloque le scroll de la page web derrière
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (pinchRef.current) {
        const delta = dist - pinchRef.current;
        setScale(s => Math.min(Math.max(0.7, s + delta * 0.005), 1.3)); // Limites du zoom
      }
      pinchRef.current = dist;
    }
  };
  const handleTouchEnd = () => pinchRef.current = null;

  return (
    <motion.div 
      drag 
      dragControls={dragControls} 
      dragListener={false} 
      dragMomentum={true} // Active l'inertie physique
      // MAGNÉTISME : Limites de l'écran (Snap naturel)
      dragConstraints={{ left: -10, right: 10, top: -500, bottom: 20 }}
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
      
      // EMPÊCHER LE SCROLL LORS DU DRAG & APPLIQUER LE ZOOM
      style={{ scale, touchAction: 'none' }} 
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      
      className={`fixed bottom-24 right-4 z-[80] bg-black/85 backdrop-blur-2xl border border-zinc-800 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col transition-[width,height] origin-bottom-right ${minimized ? 'w-[250px] h-auto' : 'w-[320px] resize overflow-hidden min-h-[160px]'}`}
    >
      {/* Barre de titre "Draggable" */}
      <div 
        className="bg-zinc-900/60 p-3.5 flex justify-between items-center cursor-grab active:cursor-grabbing border-b border-zinc-800 touch-none" 
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Music size={14} className="text-[#1DB954]" />
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Lecteur</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setMinimized(!minimized)} className="p-1.5 hover:bg-zinc-800 rounded-xl transition-colors"><Minus size={14} className="text-zinc-400"/></button>
          <button onClick={onClose} className="p-1.5 hover:bg-red-900/40 rounded-xl transition-colors"><X size={14} className="text-zinc-400"/></button>
        </div>
      </div>

      {/* Contenu du Lecteur */}
      {!minimized && track && (
        <div className="p-5 flex flex-col gap-5 flex-1">
          
          {/* Info Track */}
          <div className="flex items-center gap-4">
            {track.image && <img src={track.image} alt="Album" className="w-16 h-16 rounded-2xl shadow-lg border border-zinc-800 pointer-events-none" />}
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-white text-sm truncate">{track.title}</span>
              <span className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">{track.artist}</span>
            </div>
          </div>

          {/* Barre de Progression interactive */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-500 font-mono w-7 text-right">{formatTime(localProgress)}</span>
            <input type="range" min="0" max={track.duration || 100} value={localProgress} onChange={handleSeek} className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-[#1DB954]" />
            <span className="text-[10px] text-zinc-500 font-mono w-7">{formatTime(track.duration)}</span>
          </div>

          {/* Contrôles Playback & Avance Rapide */}
          <div className="flex justify-between items-center px-1">
            <button onClick={() => apiCall(`seek?position_ms=${Math.max(0, localProgress - 10000)}`, "PUT")} className="p-2 text-zinc-500 hover:text-white transition-colors active:scale-90"><Rewind size={18}/></button>
            <button onClick={() => apiCall("previous")} className="p-2 text-zinc-300 hover:text-white transition-colors active:scale-90"><SkipBack size={20}/></button>
            
            <button onClick={() => apiCall(track.isPlaying ? "pause" : "play", "PUT")} className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all">
              {track.isPlaying ? <Pause size={22} fill="black" /> : <Play size={22} fill="black" className="ml-1" />}
            </button>
            
            <button onClick={() => apiCall("next")} className="p-2 text-zinc-300 hover:text-white transition-colors active:scale-90"><SkipForward size={20}/></button>
            <button onClick={() => apiCall(`seek?position_ms=${Math.min(track.duration, localProgress + 10000)}`, "PUT")} className="p-2 text-zinc-500 hover:text-white transition-colors active:scale-90"><FastForward size={18}/></button>
          </div>

          {/* Sortie Audio (Routing) */}
          <div className="mt-2 pt-4 border-t border-zinc-800/80 relative">
            <button onClick={getDevices} className="w-full py-3 bg-zinc-900 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-zinc-400 border border-zinc-800 active:scale-95 transition-transform">
              <MonitorSpeaker size={14}/> Sortie Audio
            </button>
            
            {/* Menu Déroulant des Périphériques */}
            <AnimatePresence>
              {showDevices && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-3 left-0 w-full bg-[#1a1a1c] border border-zinc-700 rounded-2xl p-2 flex flex-col gap-1 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                  {devices.map(dev => (
                    <button key={dev.id} onClick={() => { apiCall("", "PUT", { device_ids: [dev.id] }); setShowDevices(false); }}
                      className={`p-3 text-left text-xs font-bold rounded-xl transition-colors ${dev.is_active ? 'bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/20' : 'hover:bg-zinc-800 text-white'}`}>
                      {dev.name} {dev.is_active && " • Actif"}
                    </button>
                  ))}
                  {devices.length === 0 && <p className="text-xs text-center text-zinc-500 p-2 font-medium">Ouvrez Spotify sur un appareil</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Vue Minimisée */}
      {minimized && track && (
        <div className="p-4 flex items-center justify-between">
          <div className="flex flex-col truncate flex-1 pr-3">
            <span className="text-xs font-bold text-white truncate">{track.title}</span>
          </div>
          <button onClick={() => apiCall(track.isPlaying ? "pause" : "play", "PUT")} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95">
            {track.isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" className="ml-1" />}
          </button>
        </div>
      )}

      {!track && <div className="p-6 text-center text-xs text-zinc-500 font-bold uppercase tracking-widest">Ouvrez Spotify pour commencer</div>}
    </motion.div>
  );
}

// ==========================================
// COMPOSANTS SECONDAIRES (Exercices)
// ==========================================
function ExerciseCard({ data, onStartRest, history, onLogWeight }) {
  const [completedSets, setCompletedSets] = useState([]);
  const [weight, setWeight] = useState("");
  const [isAlt, setIsAlt] = useState(false);
  const [view, setView] = useState('main'); 

  const maxWeight = history.length > 0 ? Math.max(...history.map(h => h.weight)) : 0;
  const lastWeight = history.length > 0 ? history[history.length-1].weight : null;

  const toggleSet = (i) => {
    const done = !completedSets.includes(i);
    setCompletedSets(prev => done ? [...prev, i] : prev.filter(s => s !== i));
    if (done && weight) onLogWeight(weight);
  };

  return (
    <div className="bg-[#151517] rounded-[32px] border border-[#222225] overflow-hidden mb-6 flex flex-col shadow-2xl">
      <div className="p-5 flex justify-between items-center border-b border-[#222225] bg-[#1a1a1c]">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-[17px] font-bold text-white leading-tight">{isAlt ? data.alternative.name : data.name}</h3>
             {weight && parseFloat(weight) >= maxWeight && maxWeight > 0 && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
          </div>
          <div className="bg-black px-2.5 py-1 rounded-md text-[10px] font-black text-blue-500 inline-block uppercase tracking-widest border border-zinc-800 shadow-inner">{data.sets}x{data.reps} • {data.tempo}</div>
        </div>
        <div className="flex gap-1.5">
          {data.alternative && (
            <button onClick={() => setIsAlt(!isAlt)} className={`p-3 rounded-2xl transition-all ${isAlt ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'bg-[#222225] text-orange-500'}`}><RefreshCw size={16}/></button>
          )}
          <button onClick={() => setView(view === 'chart' ? 'main' : 'chart')} className={`p-3 rounded-2xl transition-all ${view === 'chart' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-[#222225] text-[#8E8E93]'}`}><TrendingUp size={16}/></button>
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {view === 'main' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="h-48 bg-black rounded-[24px] overflow-hidden border border-[#222225] relative flex items-center justify-center">
                  <img src={data.image} alt="" className="w-full h-full object-contain opacity-80" />
                  {isAlt && <div className="absolute inset-0 bg-orange-900/20 flex flex-col items-center justify-center backdrop-blur-[2px]"><span className="bg-black/90 px-5 py-2.5 rounded-full text-[11px] font-black uppercase text-orange-400 border border-orange-600/50 shadow-2xl">Mode Alternative</span></div>}
              </div>
              <div className="flex gap-3">
                  <div className="flex-1 bg-black p-4 rounded-[24px] border border-[#222225] flex items-center shadow-inner">
                    <span className="text-[11px] text-zinc-600 uppercase font-black mr-4 tracking-widest">Kilos</span>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={lastWeight ? `${lastWeight}kg` : "---"} className="bg-transparent font-black text-white text-xl outline-none w-full" />
                  </div>
              </div>
              <div className="flex justify-between items-center px-1 bg-zinc-900/30 p-2 rounded-full border border-zinc-800/50">
                  <div className="flex gap-2 pl-1">
                    {[...Array(parseInt(data.sets))].map((_, i) => (
                      <button key={i} onClick={() => toggleSet(i)} className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm transition-all ${completedSets.includes(i) ? 'bg-[#34C759] text-black shadow-[0_0_20px_rgba(52,199,89,0.4)] scale-105' : 'bg-[#222225] text-[#8E8E93]'}`}>
                        {completedSets.includes(i) ? <Check size={22} strokeWidth={4} /> : i + 1}
                      </button>
                    ))}
                  </div>
                  <button onClick={onStartRest} className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center active:scale-90 shadow-[0_0_20px_rgba(10,132,255,0.4)] mr-1"><Play size={24} fill="white" className="ml-1"/></button>
              </div>
              {isAlt && <p className="text-[11px] text-orange-400 font-bold bg-orange-500/10 p-4 rounded-[20px] border border-orange-500/20 text-center">{data.alternative.note}</p>}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}><XAxis dataKey="date" hide /><YAxis hide domain={['dataMin - 5', 'dataMax + 5']} /><Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{color: '#0A84FF'}} /><Line type="monotone" dataKey="weight" stroke="#0A84FF" strokeWidth={5} dot={{ fill: '#0A84FF', r: 6, strokeWidth: 2, stroke: '#000' }} activeDot={{ r: 8 }} /></LineChart>
                </ResponsiveContainer>
                <button onClick={() => setView('main')} className="w-full mt-4 py-3 bg-zinc-900 rounded-full text-[11px] text-zinc-400 uppercase font-black tracking-widest">Fermer le graphique</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CardioCard({ data, isFinisher }) {
  return (
    <article className="bg-[#1A1111] rounded-[32px] border border-[#3A1D1D] p-8 mb-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><HeartPulse size={120} /></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2"><HeartPulse size={18} className="text-[#FF453A] animate-pulse" /><span className="text-[#FF453A] text-[11px] font-black uppercase tracking-widest">{isFinisher ? "Finisher FATmax" : "Cardio Exclusif"}</span></div>
          <div className="flex items-center gap-2 bg-[#1DB954]/10 px-3 py-1.5 rounded-full border border-[#1DB954]/30"><Music size={12} className="text-[#1DB954]" /><span className="text-[9px] font-black text-[#1DB954] uppercase tracking-widest">BPM Sync</span></div>
        </div>
        <h3 className="text-2xl font-black text-white mb-6 tracking-tight">{data.name}</h3>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-black/80 rounded-[20px] p-5 border border-[#3A1D1D] text-center shadow-inner"><span className="text-[10px] text-zinc-500 font-black block mb-2 uppercase tracking-widest">Temps</span><span className="font-black text-xl text-white">{data.duration}</span></div>
          <div className="flex-1 bg-[#FF453A]/10 rounded-[20px] p-5 border border-[#FF453A]/30 text-center shadow-inner"><span className="text-[10px] text-[#FF453A] font-black block mb-2 uppercase tracking-widest">BPM Cible</span><span className="font-black text-xl text-[#FF453A] font-mono">{data.bpm}</span></div>
        </div>
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