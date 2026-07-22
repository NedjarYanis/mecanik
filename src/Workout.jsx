import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, Calendar, Music, Settings2, Check, 
    AlertTriangle, Plus, Search, X, RefreshCw, CloudLightning, 
    Repeat, Trash2, Play, Timer, HeartPulse, Info, BedDouble, TrendingUp, 
    Save, Loader2 
} from 'lucide-react';
import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useData } from './context/DataContext'; 
import { useToast } from './context/ToastContext';
import { collection, addDoc } from "firebase/firestore";

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel border border-zinc-800/50 p-4 bubble-2 shadow-2xl flex flex-col gap-1">
        <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{label}</span>
        <p className="font-black text-base text-[#ADFF2F]">{`${payload[0].value} kg`}</p>
      </div>
    );
  }
  return null;
};

export default function WorkoutTab({ spotifyToken, spotifyTrack, setShowSpotifyWidget, loginSpotify, db }) {
  const { 
     profile, setProfile, 
     program, setProgram, 
     history, setHistory, 
     saveToCloud, saveStatus, 
     hasUnsavedChanges, journal, 
     customCatalog, CATALOGUE_EXERCICES, 
     getFullExerciseData 
  } = useData(); 

  const { showToast } = useToast();
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

  const [targetTime, setTargetTime] = useState(null); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const wakeLockRef = useRef(null);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) { console.log("Wake Lock non supporté."); }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current !== null) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (err) { console.log(err); }
  };

  const startRest = (seconds) => {
    requestWakeLock();
    setTargetTime(Date.now() + seconds * 1000);
    setTimeLeft(seconds);
  };

  const adjustTime = (secondsToAdd) => {
    if (!targetTime) return;
    setTargetTime(prev => prev + (secondsToAdd * 1000));
    setTimeLeft(prev => Math.max(1, prev + secondsToAdd));
  };

  const stopRest = () => {
    setTargetTime(null);
    setTimeLeft(0);
    releaseWakeLock();
  };

  useEffect(() => {
    if (!targetTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((targetTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        stopRest();
        if (window.navigator?.vibrate) window.navigator.vibrate([200, 100, 200]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [targetTime]);

  const [isEditingDay, setIsEditingDay] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [swapRefId, setSwapRefId] = useState(null); 
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isCreatingExo, setIsCreatingExo] = useState(false);
  const [newExo, setNewExo] = useState({ name: '', focus: '', image: '' });
  const [isSavingExo, setIsSavingExo] = useState(false);

  const readiness = journal[currentDateStr]?.readiness || 10;
  const isTired = readiness <= 4; 

  const logWeight = (refId, weight) => {
    if (!weight || isNaN(weight)) return; 
    const numWeight = parseFloat(weight);
    const dateObj = new Date(currentDateStr);
    const dateFormatted = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const rawTimestamp = dateObj.getTime();

    setHistory(prev => {
      const currentHistory = prev[refId] || [];
      const filteredHistory = currentHistory.filter(h => h.date !== dateFormatted);
      const updatedHistory = [...filteredHistory, { date: dateFormatted, weight: numWeight, timestamp: rawTimestamp }]
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-30);
      return { ...prev, [refId]: updatedHistory };
    }); 

    if (profile) {
      const currentPR = profile.prs?.[refId] || 0;
      if (numWeight > currentPR) {
        setProfile({
          ...profile,
          prs: { ...(profile.prs || {}), [refId]: numWeight }
        });
      }
    }
  };

  const currentDay = program[activeDay] || { focus: "Repos", type: "rest" };

  const handleUpdateDayFocus = (newFocus) => {
     setProgram(prev => ({ 
       ...prev, 
       [activeDay]: { ...(prev[activeDay] || { type: 'mixed', exercises: [] }), focus: newFocus } 
     }));
   };

  const handleUpdateExo = (refId, newProps) => {
     setProgram(prev => {
       const day = prev[activeDay];
       const newExercises = day.exercises.map(e => e.refId === refId ? { ...e, ...newProps } : e);
       return { ...prev, [activeDay]: { ...day, exercises: newExercises } };
     });
   };

  const handleDeleteExo = (refId) => {
     setProgram(prev => {
       const day = prev[activeDay];
       const newExercises = day.exercises.filter(e => e.refId !== refId);
       return { ...prev, [activeDay]: { ...day, exercises: newExercises } };
     });
   };

  const handleSelectFromCatalog = (catalogItem) => {
    const newExoConfig = { refId: catalogItem.id, sets: 4, reps: "10-12", rest: 90 }; 
    setProgram(prev => {
      // CORRECTION DU BUG : On initialise un jour par défaut si celui-ci est vide
      const day = prev[activeDay] || { focus: "Nouvelle Séance", type: "mixed", exercises: [] };
      
      let newExercises = [...(day.exercises || [])];
      const newType = (day.type === 'rest' || day.type === 'cardio') ? 'mixed' : day.type; 

      if (swapRefId) {
        const index = newExercises.findIndex(e => e.refId === swapRefId);
        if (index !== -1) newExercises[index] = newExoConfig;
      } else { 
        newExercises.push(newExoConfig);
       }
      return { ...prev, [activeDay]: { ...day, type: newType, exercises: newExercises } };
    });
    setShowCatalog(false); setIsCreatingExo(false); setSwapRefId(null); setCatalogSearch('');
  };

  const handleCreateCustomExo = async () => {
    if (!newExo.name) {
      showToast("Le nom est obligatoire !", "error");
      return;
    }
    setIsSavingExo(true);
    const exoCatalogObj = { 
        name: newExo.name, focus: newExo.focus || "Général", 
        image: newExo.image || "https://cdn-icons-png.flaticon.com/512/3048/3048364.png"
    };
    try {
      const docRef = await addDoc(collection(db, "custom_exercises"), exoCatalogObj);
      handleSelectFromCatalog({ ...exoCatalogObj, id: docRef.id }); 
      setNewExo({name:'', focus:'', image:''});
      showToast("Exercice créé !", "success");
    } catch (e) { 
      showToast("Erreur réseau", "error"); 
    } finally { 
      setIsSavingExo(false); 
    }
  };

  const FULL_CATALOG = [...CATALOGUE_EXERCICES, ...(customCatalog || [])];
  const filteredCatalog = FULL_CATALOG.filter(e => e.name.toLowerCase().includes(catalogSearch.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full bg-adaptive relative overflow-hidden text-white">
      
      {/* HEADER BIO-NUMÉRIQUE */}
      <header className="px-6 pt-12 pb-4 z-40 flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white drop-shadow-md">Entraînement</h1>
            <div className="flex items-center justify-center w-8 h-8 rounded-full glass-panel glow-accent">
              {saveStatus === 'saving' && <Loader2 size={14} className="text-[#ADFF2F] animate-spin" />}
              {saveStatus === 'saved' && <Check size={14} className="text-[#ADFF2F]" />}
              {saveStatus === 'idle' && !hasUnsavedChanges && <CloudLightning size={14} className="text-zinc-500" />}
              {saveStatus === 'idle' && hasUnsavedChanges && <div className="w-3 h-3 bg-[#ADFF2F] rounded-full animate-pulse" />}
            </div>
          </div>
          <div className="flex gap-2">
            {!spotifyToken ? ( 
              <button onClick={loginSpotify} className="p-3 glass-panel bubble-pill text-[#1DB954] active:scale-95 transition-transform">
                <Music size={20}/>
              </button> 
            ) : ( 
              <button onClick={() => setShowSpotifyWidget(true)} className="p-3 glass-panel bubble-pill text-[#1DB954] border border-[#1DB954]/20 active:scale-95 transition-transform glow-accent">
                <Music size={20}/>
              </button> 
            )}
          </div>
        </div>
         
        <div className="flex justify-between items-center glass-panel p-2 bubble-pill">
          <button onClick={() => changeDate(-1)} className="p-2 text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={18}/></button>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#ADFF2F] flex items-center gap-2">
            <Calendar size={14}/> 
            {currentDateStr === getTodayStr() ? "Aujourd'hui" : new Date(currentDateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <button onClick={() => changeDate(1)} className="p-2 text-zinc-400 hover:text-white transition-colors"><ChevronRight size={18}/></button>
        </div>
      </header> 

      {/* CONTENU PRINCIPAL AÉRÉ */}
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-[160px] space-y-6 hide-scrollbar">
        
        {/* TITRE DE LA SÉANCE */}
        <div className="mb-6 flex justify-between items-start border-l-4 border-[#ADFF2F] pl-4">
          <div className="flex-1 pr-4">
            {isEditingDay ? (
                <input type="text" value={currentDay.focus || ''} onChange={(e) => handleUpdateDayFocus(e.target.value)} className="bg-transparent text-white font-black text-2xl uppercase tracking-tighter outline-none border-b border-zinc-700 w-full mb-1" />
            ) : (
                <h2 className="text-2xl font-black leading-tight text-white uppercase tracking-tighter italic drop-shadow-md">{currentDay.focus}</h2>
            )}
            <p className="text-zinc-400 text-xs mt-2 font-bold tracking-widest uppercase">{['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][activeDay-1]} • {currentDay.desc || ""}</p>
          </div>
          <button onClick={() => setIsEditingDay(!isEditingDay)} className={`p-3 bubble-pill shadow-lg transition-all ${isEditingDay ? 'bg-[#ADFF2F] text-black glow-accent' : 'glass-panel text-zinc-300 active:scale-90'}`}>
            {isEditingDay ? <Check size={20}/> : <Settings2 size={20}/>}
          </button>
        </div>

        {/* ALERTE FATIGUE */}
        {isTired && (currentDay.type === 'lift' || currentDay.type === 'mixed') && (
          <div className="glass-panel border border-red-500/30 p-4 bubble-2 flex items-center gap-4 bg-red-900/10">
            <AlertTriangle size={24} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-200/80 font-bold uppercase tracking-widest">Fatigue détectée. Charge limite 75% du max.</p>
          </div>
        )}

        {/* LISTE DES EXERCICES */}
        {(currentDay.type === 'lift' || currentDay.type === 'mixed') && currentDay.exercises && currentDay.exercises.map(exoConfig => {
          const fullExo = getFullExerciseData(exoConfig); 
          if (!fullExo) return null;
          
          return (
            <ExerciseCard 
               key={fullExo.refId}
               data={fullExo}
               isTired={isTired}
               isEditing={isEditingDay}
               history={history[fullExo.refId] || []}
               onStartRest={() => startRest(fullExo.rest || 90)}
               onLogWeight={(w) => logWeight(fullExo.refId, w)}
               onUpdate={(newProps) => handleUpdateExo(fullExo.refId, newProps)}
               onDelete={() => handleDeleteExo(fullExo.refId)}
               onSwap={() => { setSwapRefId(fullExo.refId); setShowCatalog(true); }}
             />
          );
        })}

        {/* BOUTON AJOUTER (Visible en édition) */}
        {isEditingDay && (
          <button onClick={() => { setSwapRefId(null); setShowCatalog(true); }} className="w-full py-6 glass-panel border border-dashed border-[#ADFF2F]/30 bubble-pill text-[#ADFF2F] font-black text-xs uppercase tracking-[0.2em] flex justify-center items-center gap-3 active:scale-95 transition-all glow-accent hover:bg-[#ADFF2F]/5">
            <Plus size={20} /> Ajouter un exercice
          </button>
        )}

        {currentDay.cardio && <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />}
        {currentDay.type === 'rest' && !isEditingDay && <RestCard data={currentDay} />}

        {/* BOUTON SAUVEGARDE */}
        <div className="pt-8">
          <button 
             onClick={saveToCloud}
             disabled={!hasUnsavedChanges || saveStatus === 'saving'}
             className={`w-full py-5 bubble-pill font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl ${ 
              saveStatus === 'saving' ? 'bg-[#ADFF2F]/50 text-black cursor-not-allowed' : 
              saveStatus === 'saved' ? 'bg-[#ADFF2F] text-black glow-accent' :
              hasUnsavedChanges ? 'bg-[#ADFF2F] text-black active:scale-95 glow-accent' : 
              'glass-panel text-zinc-500 cursor-not-allowed'
            }`}
          >
            {saveStatus === 'saving' ? <Loader2 size={18} className="animate-spin" /> : 
              saveStatus === 'saved' ? <Check size={18} /> : 
              <Save size={18} />}
            {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'saved' ? 'Sauvegardé !' : hasUnsavedChanges ? 'Enregistrer' : 'Synchronisé'}
          </button>
        </div>
      </main>

      {/* CHRONOMÈTRE FLOTTANT GLASSMORPHISM */}
      <AnimatePresence>
        {targetTime && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#070908]/90 backdrop-blur-3xl flex flex-col items-center justify-center p-6">
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#ADFF2F]/20 rounded-full blur-[60px] pointer-events-none" />

            <Timer size={56} className="text-[#ADFF2F] mb-8 animate-pulse relative z-10 glow-accent" />
            <span className="text-8xl font-black tabular-nums tracking-tighter text-white mb-16 relative z-10 drop-shadow-2xl">
              {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
            </span>
            
            <div className="flex items-center gap-5 w-full max-w-sm justify-center relative z-10">
              <button onClick={() => adjustTime(-15)} className="w-16 h-16 glass-panel bubble-pill font-black text-xl text-white active:scale-95 transition-transform">-15</button>
              <button onClick={stopRest} className="flex-1 h-16 bg-[#ADFF2F] bubble-pill font-black text-sm uppercase tracking-widest text-black active:scale-95 transition-transform glow-accent">Passer</button>
              <button onClick={() => adjustTime(15)} className="w-16 h-16 glass-panel bubble-pill font-black text-xl text-white active:scale-95 transition-transform">+15</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================= */}
      {/* CATALOGUE (Modale Bio-Numérique)            */}
      {/* ========================================= */}
      <AnimatePresence>
        {showCatalog && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[250] bg-[#070908]/90 backdrop-blur-2xl flex flex-col">
            
            <div className="p-6 pt-12 pb-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3 drop-shadow-md">
                <Search size={24} className="text-[#ADFF2F] glow-accent"/> Catalogue
              </h2>
              <button onClick={() => { setShowCatalog(false); setSwapRefId(null); setIsCreatingExo(false); }} className="p-3 glass-panel bubble-pill text-zinc-300 hover:text-white active:scale-90 transition-all">
                <X size={20}/>
              </button>
            </div>
            
            <div className="px-6 pb-6 flex-1 flex flex-col min-h-0">
              {isCreatingExo ? (
                <div className="flex-1 overflow-y-auto space-y-6 pb-32">
                   <div className="glass-panel p-8 bubble-1 shadow-2xl relative overflow-hidden mt-2">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-[#ADFF2F]/10 blur-[40px] rounded-full pointer-events-none" />
                       <h3 className="text-xl font-black uppercase italic mb-6 text-white relative z-10">Nouvel Exercice</h3>
                       
                       <div className="space-y-5 relative z-10">
                         <div>
                           <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block mb-2">Nom de l'exercice *</span>
                           <input type="text" value={newExo.name} onChange={e=>setNewExo({...newExo, name: e.target.value})} className="w-full bg-[#070908]/80 border border-zinc-800/80 p-4 bubble-pill text-white font-bold outline-none focus:border-[#ADFF2F] transition-colors" placeholder="Ex: Soulevé de terre" />
                         </div>
                         <div>
                           <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block mb-2">Muscles ciblés</span>
                           <input type="text" value={newExo.focus} onChange={e=>setNewExo({...newExo, focus: e.target.value})} className="w-full bg-[#070908]/80 border border-zinc-800/80 p-4 bubble-pill text-white font-bold outline-none focus:border-[#ADFF2F] transition-colors" placeholder="Ex: Dos / Ischios" />
                         </div>
                         
                         <div className="pt-4 flex gap-3">
                           <button onClick={() => setIsCreatingExo(false)} className="px-6 py-4 glass-panel text-zinc-300 hover:text-white bubble-pill font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Retour</button>
                           <button onClick={handleCreateCustomExo} disabled={isSavingExo} className="flex-1 py-4 bg-[#ADFF2F] text-black bubble-pill font-black text-xs uppercase tracking-widest active:scale-95 transition-all glow-accent flex items-center justify-center gap-2">
                             {isSavingExo ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />} Créer
                           </button>
                         </div>
                       </div>
                   </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 glass-panel p-2 bubble-pill mb-6 shadow-inner relative z-10 mt-2">
                    <div className="w-12 h-12 bg-[#ADFF2F]/10 bubble-pill flex items-center justify-center shrink-0">
                      <Search size={20} className="text-[#ADFF2F]" />
                    </div>
                    <input type="text" placeholder="Rechercher un exercice..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} className="bg-transparent font-black text-white outline-none w-full placeholder:text-zinc-600 uppercase tracking-wide text-sm" autoFocus />
                  </div>
                  
                  <button onClick={() => setIsCreatingExo(true)} className="w-full py-5 mb-6 glass-panel border border-[#ADFF2F]/30 bubble-pill text-[#ADFF2F] font-black text-xs uppercase tracking-[0.2em] flex justify-center items-center gap-2 active:scale-95 transition-all glow-accent hover:bg-[#ADFF2F]/5">
                    <Plus size={18} /> Nouvel Exercice
                  </button>

                  <div className="flex-1 overflow-y-auto space-y-4 pb-32 hide-scrollbar">
                      {filteredCatalog.map((exo, idx) => (
                          <div key={idx} onClick={() => handleSelectFromCatalog(exo)} className="glass-panel p-4 bubble-2 flex items-center gap-5 cursor-pointer active:scale-[0.98] transition-all hover:bg-[#141A16] group shadow-lg">
                              <div className="w-16 h-16 bg-[#070908]/80 bubble-pill shrink-0 flex items-center justify-center border border-white/5 overflow-hidden">
                                <img src={exo.image || "https://cdn-icons-png.flaticon.com/512/3048/3048364.png"} className="w-10 h-10 object-contain opacity-70 group-hover:opacity-100 transition-opacity" alt="" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-black text-white text-sm italic uppercase tracking-tight">{exo.name}</h3>
                              </div>
                              <div className="w-12 h-12 bg-[#ADFF2F]/10 bubble-pill flex items-center justify-center text-[#ADFF2F] group-hover:bg-[#ADFF2F] group-hover:text-black transition-all glow-accent">
                                <Plus size={20}/>
                              </div>
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

// ==========================================
// COMPOSANTS SECONDAIRES (CARTES)
// ==========================================

function ExerciseCard({ data, isTired, isEditing, onStartRest, history, onLogWeight, onUpdate, onDelete, onSwap }) {
  const [completedSets, setCompletedSets] = useState([]);
  const [weight, setWeight] = useState("");
  const [showChart, setShowChart] = useState(false); 

  const actualSets = parseInt(data.sets || 1);
  const maxHistoricalWeight = history && history.length > 0 ? Math.max(...history.map(h => parseFloat(h.weight) || 0)) : 0;
  const limitWeight = maxHistoricalWeight > 0 ? Math.round(maxHistoricalWeight * 0.75) : 0;

  const parseReps = (repStr) => {
    if(!repStr) return "8";
    if(repStr.toString().includes('-')) return repStr.split('-').map(r => Math.max(1, parseInt(r)-2)).join('-');
    return Math.max(1, parseInt(repStr)-2);
  };

  const displayReps = isTired ? parseReps(data.reps) : data.reps;

  const toggleSet = (i) => {
    const done = !completedSets.includes(i);
    setCompletedSets(prev => done ? [...prev, i] : prev.filter(s => s !== i));
  };

  return (
    <div className={`glass-panel bubble-1 ${isEditing ? 'border-[#ADFF2F]/40 glow-accent' : 'border-zinc-800/80'} overflow-hidden mb-6 flex flex-col shadow-2xl`}>
      <div className="p-6 flex justify-between items-center border-b border-zinc-800/50 bg-[#070908]/40">
        <div>
          <h3 className="text-base font-black text-white uppercase italic tracking-tight">{data.name}</h3>
          {isEditing ? (
              <div className="flex gap-3 mt-3 items-center">
                  <input type="number" value={data.sets} onChange={e => onUpdate({sets: e.target.value})} className="w-12 bg-black border border-zinc-700 py-1 rounded-xl text-center text-sm font-black text-[#ADFF2F] outline-none" />
                  <span className="text-zinc-600 font-bold text-sm">x</span>
                  <input type="text" value={data.reps} onChange={e => onUpdate({reps: e.target.value})} className="w-16 bg-black border border-zinc-700 py-1 rounded-xl text-center text-sm font-black text-white outline-none" />
              </div>
          ) : (
              <div className={`px-3 py-1.5 bubble-pill text-[10px] font-black inline-block mt-2 tracking-widest ${isTired ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#070908] text-[#ADFF2F] border border-zinc-800'}`}>
                {isTired && <span className="mr-1">⚡ 75% MAX | </span>}
                {actualSets}x{displayReps}
              </div>
          )}
        </div>
        {isEditing && (
            <div className="flex flex-col gap-2">
                <button onClick={onSwap} className="w-10 h-10 glass-panel bubble-pill text-zinc-300 flex items-center justify-center active:scale-90 transition-transform"><Repeat size={16}/></button>
                <button onClick={onDelete} className="w-10 h-10 bg-red-900/20 border border-red-500/30 text-red-400 bubble-pill flex items-center justify-center active:scale-90 transition-transform"><Trash2 size={16}/></button>
            </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="h-40 bg-[#070908]/80 bubble-2 overflow-hidden border border-zinc-800/50 flex items-center justify-center relative shadow-inner">
          <img src={data.image || "https://cdn-icons-png.flaticon.com/512/3048/3048364.png"} alt="" className="w-full h-full object-contain opacity-80 pointer-events-none p-2" />
          {!isEditing && (
            <button onClick={onSwap} className="absolute top-3 right-3 bg-[#070908]/80 backdrop-blur text-zinc-400 p-2.5 bubble-pill border border-zinc-800 hover:text-white transition-colors"><Repeat size={16} /></button>
          )}
        </div>
        
        <div className="flex gap-4">
            <div className="flex-1 bg-[#070908]/60 p-4 bubble-pill border border-zinc-800/80 flex items-center justify-between shadow-inner">
                <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest ml-2">Kilos</span>
                <div className="flex items-center gap-3">
                  <input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder={isTired && limitWeight > 0 ? `~${limitWeight}` : "-"} className="bg-transparent font-black text-white text-xl outline-none w-16 text-right" />
                  <button onClick={() => { if(weight) { onLogWeight(weight); setWeight(''); } }} className="w-10 h-10 bg-[#ADFF2F]/20 text-[#ADFF2F] bubble-pill flex items-center justify-center active:scale-90 transition-transform"><Check size={18} strokeWidth={3} /></button>
                </div>
            </div>
        </div>

        <div className="flex justify-between items-center p-2 bg-[#070908]/40 bubble-pill border border-zinc-800">
            <div className="flex gap-2 pl-2 overflow-x-auto hide-scrollbar">
              {[...Array(actualSets)].map((_, i) => (
                <button key={i} onClick={() => toggleSet(i)} className={`w-10 h-10 shrink-0 bubble-pill flex items-center justify-center font-black text-sm transition-all ${completedSets.includes(i) ? 'bg-[#ADFF2F] text-black glow-accent' : 'glass-panel text-zinc-400 hover:text-white'}`}>
                  {completedSets.includes(i) ? <Check size={16} strokeWidth={3} /> : i + 1}
                </button>
              ))}
            </div>
            <button onClick={onStartRest} className="w-12 h-12 shrink-0 bg-[#ADFF2F] text-black bubble-pill flex items-center justify-center active:scale-90 transition-transform glow-accent shadow-xl ml-2">
              <Play size={20} fill="black" className="ml-1"/>
            </button>
        </div>

        {!isEditing && (
          <div className="pt-2">
             <button onClick={() => setShowChart(!showChart)} className={`w-full py-3 bubble-pill flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-colors ${showChart ? 'text-[#ADFF2F] bg-[#ADFF2F]/10' : 'text-zinc-500 hover:text-white glass-panel'}`}>
               <TrendingUp size={16}/> Historique
             </button>
             <AnimatePresence>
               {showChart && (
                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 160, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full mt-4 overflow-hidden">
                    {history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <XAxis dataKey="date" hide />
                                <YAxis domain={['auto', 'auto']} hide />
                                <Line type="monotone" dataKey="weight" stroke="#ADFF2F" strokeWidth={3} dot={{r: 5, fill: "#ADFF2F", stroke: "#070908", strokeWidth: 2}} activeDot={{r: 7, fill: "#FFF"}} />
                                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : ( <div className="h-full flex items-center justify-center"><p className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">Aucun poids enregistré.</p></div> )}
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
    <article className="glass-panel bubble-2 border border-zinc-800 p-8 mb-6 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ADFF2F]/10 blur-[40px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <HeartPulse size={20} className="text-[#ADFF2F] animate-pulse glow-accent" />
        <span className="text-[#ADFF2F] text-[10px] font-black uppercase tracking-[0.2em]">{isFinisher ? "Finisher Cardio" : "Cardio"}</span>
      </div>
      
      <h3 className="text-2xl font-black text-white mb-6 italic uppercase tracking-tighter relative z-10">{data.name}</h3>
      
      <div className="flex gap-4 mb-6 relative z-10">
        <div className="flex-1 bg-[#070908]/80 bubble-1 p-5 border border-zinc-800/50 text-center shadow-inner">
          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Temps</span>
          <span className="font-black text-xl text-white">{data.duration}</span>
        </div>
        <div className="flex-1 bg-[#070908]/80 bubble-2 p-5 border border-zinc-800/50 text-center shadow-inner">
          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-2">BPM Cible</span>
          <span className="font-black text-xl text-[#ADFF2F] drop-shadow-md">{data.bpm}</span>
        </div>
      </div>
      
      <div className="glass-panel p-4 bubble-pill flex gap-3 items-center border border-zinc-800 relative z-10">
        <Info size={16} className="text-zinc-400 shrink-0" />
        <p className="text-[11px] text-zinc-300 font-medium">{data.focus}</p>
      </div>
    </article>
  );
}

function RestCard({ data }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] w-full px-6 relative mt-4">
      {/* Ondes de respiration organiques en arrière-plan */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} 
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute w-64 h-64 border border-[#ADFF2F] bubble-pill pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.1, 0.05] }} 
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
        className="absolute w-80 h-80 border-[20px] border-[#ADFF2F] bubble-pill blur-[40px] pointer-events-none"
      />

      {/* Cœur de l'icône */}
      <div className="w-28 h-28 glass-panel bubble-pill flex items-center justify-center mb-10 relative z-10 glow-accent shadow-2xl">
        <BedDouble size={48} className="text-[#ADFF2F]" />
      </div>

      <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter text-center relative z-10 drop-shadow-lg mb-4">{data.focus}</h3>
      <p className="text-sm text-zinc-400 font-medium max-w-[280px] text-center relative z-10 leading-relaxed">{data.desc}</p>
    </div>
  );
}