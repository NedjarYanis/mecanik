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
      <div className="bg-[#141814] border border-zinc-800 p-3 rounded-2xl shadow-xl flex flex-col gap-1">
        <span className="text-[9px] text-zinc-400 font-bold uppercase">{label}</span>
        <p className="font-black text-sm text-[#D4FC47]">{`${payload[0].value} kg`}</p>
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
     setProgram(prev => ({ ...prev, [activeDay]: { ...prev[activeDay], focus: newFocus } }));
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
      const day = prev[activeDay];
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full bg-[#0B0E0B] relative overflow-hidden text-white bg-muscular-watermark">
      <header className="px-5 pt-10 pb-4 bg-[#0B0E0B]/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold tracking-tight uppercase italic text-[#D4FC47]">Entraînement</h1>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#141814]">
              {saveStatus === 'saving' && <Loader2 size={12} className="text-[#D4FC47] animate-spin" />}
              {saveStatus === 'saved' && <Check size={12} className="text-[#D4FC47]" />}
              {saveStatus === 'idle' && !hasUnsavedChanges && <CloudLightning size={12} className="text-zinc-600" />}
              {saveStatus === 'idle' && hasUnsavedChanges && <div className="w-2 h-2 bg-[#D4FC47] rounded-full animate-pulse" />}
            </div>
          </div>
          <div className="flex gap-2">
            {!spotifyToken ? ( <button onClick={loginSpotify} className="p-2 bg-[#1DB954]/10 rounded-full text-[#1DB954] border border-[#1DB954]/20 active:scale-95"><Music size={18}/></button> ) : ( <button onClick={() => setShowSpotifyWidget(true)} className="p-2 bg-[#141814] rounded-full text-[#1DB954] border border-zinc-800 active:scale-95"><Music size={18}/></button> )}
          </div>
        </div>
         
        <div className="flex justify-between items-center bg-[#141814] p-2 rounded-2xl border border-zinc-800/80">
          <button onClick={() => changeDate(-1)} className="p-1 text-zinc-400 hover:text-white"><ChevronLeft size={18}/></button>
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4FC47] flex items-center gap-2">
            <Calendar size={12}/> 
            {currentDateStr === getTodayStr() ? "Aujourd'hui" : new Date(currentDateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <button onClick={() => changeDate(1)} className="p-1 text-zinc-400 hover:text-white"><ChevronRight size={18}/></button>
        </div>
      </header> 

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-5">
        <div className="mb-4 flex justify-between items-start border-l-2 border-[#D4FC47] pl-3">
          <div className="flex-1 pr-4">
            {isEditingDay ? (
                <input type="text" value={currentDay.focus || ''} onChange={(e) => handleUpdateDayFocus(e.target.value)} className="bg-transparent text-white font-extrabold text-xl uppercase tracking-tight outline-none border-b border-zinc-700 w-full mb-1" />
            ) : (
                <h2 className="text-xl font-extrabold leading-tight text-white uppercase tracking-tight">{currentDay.focus}</h2>
            )}
            <p className="text-zinc-400 text-[11px] mt-1 font-medium">{['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][activeDay-1]} • {currentDay.desc || ""}</p>
          </div>
          <button onClick={() => setIsEditingDay(!isEditingDay)} className={`p-2 rounded-full shadow-sm transition-colors ${isEditingDay ? 'bg-[#D4FC47] text-black' : 'bg-[#141814] text-zinc-400 active:scale-90'}`}>
            {isEditingDay ? <Check size={18}/> : <Settings2 size={18}/>}
          </button>
        </div>

        {isTired && (currentDay.type === 'lift' || currentDay.type === 'mixed') && (
          <div className="bg-red-900/10 border border-red-500/20 p-3 rounded-2xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <p className="text-[11px] text-red-200/80 font-medium">Fatigue détectée. Charge limite 75% du max.</p>
          </div>
        )}

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

        {isEditingDay && (
          <button onClick={() => { setSwapRefId(null); setShowCatalog(true); }} className="w-full py-4 border border-dashed border-zinc-700 rounded-[24px] text-zinc-400 font-bold text-sm flex justify-center items-center gap-2 hover:bg-[#141814] active:scale-95">
            <Plus size={18} /> Ajouter un exercice
          </button>
        )}

        {currentDay.cardio && <CardioCard data={currentDay.cardio} isFinisher={currentDay.type === 'mixed'} />}
        {currentDay.type === 'rest' && !isEditingDay && <RestCard data={currentDay} />}

        <div className="mt-8 mb-4">
          <button 
             onClick={saveToCloud}
             disabled={!hasUnsavedChanges || saveStatus === 'saving'}
             className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${ 
              saveStatus === 'saving' ? 'bg-[#D4FC47]/50 text-black cursor-not-allowed' : 
              saveStatus === 'saved' ? 'bg-[#D4FC47] text-black' :
              hasUnsavedChanges ? 'bg-[#D4FC47] text-black active:scale-95' : 
              'bg-[#141814] text-zinc-500 border border-zinc-800'
            }`}
          >
            {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : 
              saveStatus === 'saved' ? <Check size={16} /> : 
              <Save size={16} />}
            {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'saved' ? 'Sauvegardé !' : hasUnsavedChanges ? 'Sauvegarder' : 'Synchronisé'}
          </button>
        </div>
      </main>

      {/* CHRONOMÈTRE FLOTTANT */}
      <AnimatePresence>
        {targetTime && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <Timer size={48} className="text-[#D4FC47] mb-6 animate-pulse" />
            <span className="text-7xl font-mono font-bold tabular-nums tracking-tighter text-white mb-10">
              {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
            </span>
            <div className="flex items-center gap-4 w-full max-w-xs justify-center">
              <button onClick={() => adjustTime(-15)} className="w-14 h-14 bg-[#141814] rounded-full font-bold text-lg text-white border border-zinc-800 active:scale-95">-15</button>
              <button onClick={stopRest} className="flex-1 h-14 bg-[#D4FC47] rounded-full font-bold text-sm text-black shadow-lg active:scale-95">Passer</button>
              <button onClick={() => adjustTime(15)} className="w-14 h-14 bg-[#141814] rounded-full font-bold text-lg text-white border border-zinc-800 active:scale-95">+15</button>
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
    <div className={`bg-[#141814] rounded-[28px] border ${isEditing ? 'border-[#D4FC47]/40' : 'border-zinc-800/80'} overflow-hidden mb-5 flex flex-col shadow-xl`}>
      <div className="p-4 flex justify-between items-center border-b border-zinc-800/50 bg-[#0B0E0B]/30">
        <div>
          <h3 className="text-sm font-bold text-white leading-tight">{data.name}</h3>
          {isEditing ? (
              <div className="flex gap-2 mt-2 items-center">
                  <input type="number" value={data.sets} onChange={e => onUpdate({sets: e.target.value})} className="w-10 bg-black border border-zinc-700 py-0.5 rounded text-center text-xs font-bold text-[#D4FC47] outline-none" />
                  <span className="text-zinc-600 font-bold text-xs">x</span>
                  <input type="text" value={data.reps} onChange={e => onUpdate({reps: e.target.value})} className="w-14 bg-black border border-zinc-700 py-0.5 rounded text-center text-xs font-bold text-white outline-none" />
              </div>
          ) : (
              <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block mt-1.5 ${isTired ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-[#0B0E0B] text-[#D4FC47] border border-zinc-800'}`}>
                {isTired && <span className="mr-1">⚡ 75% MAX | </span>}
                {actualSets}x{displayReps}
              </div>
          )}
        </div>
        {isEditing && (
            <div className="flex gap-2">
                <button onClick={onSwap} className="w-8 h-8 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center active:scale-90"><Repeat size={14}/></button>
                <button onClick={onDelete} className="w-8 h-8 bg-red-900/20 text-red-400 rounded-full flex items-center justify-center active:scale-90"><Trash2 size={14}/></button>
            </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="h-36 bg-[#0B0E0B]/50 rounded-[20px] overflow-hidden border border-zinc-800/50 flex items-center justify-center relative">
          <img src={data.image || "https://cdn-icons-png.flaticon.com/512/3048/3048364.png"} alt="" className="w-full h-full object-contain opacity-80 pointer-events-none" />
          {!isEditing && (
            <button onClick={onSwap} className="absolute top-2 right-2 bg-black/60 backdrop-blur text-zinc-400 p-2 rounded-xl border border-zinc-800"><Repeat size={14} /></button>
          )}
        </div>
        
        <div className="flex gap-3">
            <div className="flex-1 bg-[#0B0E0B] p-3 rounded-[20px] border border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 uppercase font-bold mr-3">Kilos</span>
                <div className="flex items-center gap-2">
                  <input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder={isTired && limitWeight > 0 ? `~${limitWeight}` : "-"} className="bg-transparent font-bold text-white text-lg outline-none w-16 text-right" />
                  <button onClick={() => { if(weight) { onLogWeight(weight); setWeight(''); } }} className="p-2 bg-[#D4FC47]/20 text-[#D4FC47] rounded-xl active:scale-90"><Check size={16} strokeWidth={3} /></button>
                </div>
            </div>
        </div>

        <div className="flex justify-between items-center px-1 bg-[#0B0E0B] p-1.5 rounded-full border border-zinc-800">
            <div className="flex gap-1.5 pl-1">
              {[...Array(actualSets)].map((_, i) => (
                <button key={i} onClick={() => toggleSet(i)} className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${completedSets.includes(i) ? 'bg-[#D4FC47] text-black shadow-md' : 'bg-[#141814] text-zinc-400 border border-zinc-800'}`}>
                  {completedSets.includes(i) ? <Check size={14} strokeWidth={3} /> : i + 1}
                </button>
              ))}
            </div>
            <button onClick={onStartRest} className="w-10 h-10 bg-[#D4FC47] text-black rounded-full flex items-center justify-center active:scale-90 font-bold shadow-md">
              <Play size={16} fill="black" className="ml-0.5"/>
            </button>
        </div>

        {!isEditing && (
          <div className="pt-2 border-t border-zinc-800/50">
             <button onClick={() => setShowChart(!showChart)} className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-wider ${showChart ? 'text-[#D4FC47] bg-[#D4FC47]/10' : 'text-zinc-400'}`}>
               <TrendingUp size={14}/> Historique
             </button>
             <AnimatePresence>
               {showChart && (
                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 150, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full mt-3 overflow-hidden">
                    {history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <XAxis dataKey="date" hide />
                                <YAxis domain={['auto', 'auto']} hide />
                                <Line type="monotone" dataKey="weight" stroke="#D4FC47" strokeWidth={2.5} dot={{r: 4, fill: "#D4FC47", stroke: "#0B0E0B"}} activeDot={{r: 6}} />
                                <Tooltip content={<ChartTooltip />} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : ( <div className="h-full flex items-center justify-center"><p className="text-[10px] text-zinc-500">Aucun poids enregistré.</p></div> )}
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
    <article className="bg-[#141814] rounded-[28px] border border-zinc-800 p-6 mb-5 shadow-lg">
      <div className="flex items-center gap-2 mb-3"><HeartPulse size={16} className="text-[#D4FC47] animate-pulse" /><span className="text-[#D4FC47] text-[10px] font-bold uppercase tracking-widest">{isFinisher ? "Finisher Cardio" : "Cardio"}</span></div>
      <h3 className="text-lg font-bold text-white mb-4 italic uppercase tracking-tight">{data.name}</h3>
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-[#0B0E0B] rounded-[20px] p-4 border border-zinc-800 text-center"><span className="text-[9px] text-zinc-400 font-bold block mb-1">TEMPS</span><span className="font-bold text-sm text-white">{data.duration}</span></div>
        <div className="flex-1 bg-[#0B0E0B] rounded-[20px] p-4 border border-zinc-800 text-center"><span className="text-[9px] text-zinc-400 font-bold block mb-1">BPM CIBLE</span><span className="font-bold text-sm text-[#D4FC47]">{data.bpm}</span></div>
      </div>
      <div className="bg-[#0B0E0B] p-3 rounded-2xl flex gap-3 items-start border border-zinc-800/80"><Info size={14} className="text-zinc-500 shrink-0 mt-0.5" /><p className="text-[11px] text-zinc-400 leading-relaxed font-medium">{data.focus}</p></div>
    </article>
  );
}

function RestCard({ data }) {
  return (
    <div className="bg-[#141814] p-10 rounded-[36px] border border-zinc-800 text-center mt-6 shadow-2xl relative overflow-hidden bg-muscular-watermark flex flex-col items-center justify-center min-h-[320px]">
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-64 h-64 rounded-full border-[30px] border-[#D4FC47] blur-sm animate-pulse" />
      </div>
      <div className="w-20 h-20 bg-[#D4FC47]/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#D4FC47]/30 shadow-[0_0_30px_rgba(212,252,71,0.15)] relative z-10">
        <BedDouble size={36} className="text-[#D4FC47]" />
      </div>
      <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter relative z-10">{data.focus}</h3>
      <p className="text-xs text-zinc-400 max-w-xs leading-relaxed font-medium relative z-10">{data.desc}</p>
    </div>
  );
}