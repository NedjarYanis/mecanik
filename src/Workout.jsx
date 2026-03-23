import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Calendar, Music, Settings2, Check, 
  AlertTriangle, Plus, Search, X, RefreshCw, CloudLightning, 
  Repeat, Trash2, Play, Timer, HeartPulse, Info, BedDouble, TrendingUp
} from 'lucide-react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from './App';
import { collection, addDoc } from "firebase/firestore";

const ChartTooltip = ({ active, payload, color }) => {
  if (active && payload && payload.length) {
    return ( <div className="bg-black border border-zinc-800 p-3 rounded-xl shadow-xl"><p className="font-bold text-sm" style={{color: color || '#3b82f6'}}>{`${payload[0].value} kg`}</p></div> );
  }
  return null;
};

export default function WorkoutTab({ spotifyToken, spotifyTrack, setShowSpotifyWidget, loginSpotify, db }) {
  const { program, setProgram, history, setHistory, syncToCloud, isSyncing, journal, customCatalog, CATALOGUE_EXERCICES } = useData(); 
  
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
        drag="x" dragConstraints={{ left: 0, right: 0 }} style={{ touchAction: "pan-y" }} 
        onDragEnd={(e, info) => { if (info.offset.x > 80) changeDate(-1); if (info.offset.x < -80) changeDate(1); }} 
        key={currentDateStr} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0.4 }} 
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
            key={exo.id} data={exo} isTired={isTired} isEditing={isEditingDay} history={history[exo.id] || []} 
            onStartRest={() => setRestTime(exo.rest)} onLogWeight={(w) => logWeight(exo.id, w)} 
            onUpdate={(newProps) => handleUpdateExo(exo.id, newProps)} onDelete={() => handleDeleteExo(exo.id)}
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
  
  const actualSets = parseInt(data.sets || 1);
  const maxHistoricalWeight = history && history.length > 0 ? Math.max(...history.map(h => parseFloat(h.weight) || 0)) : 0;
  const limitWeight = maxHistoricalWeight > 0 ? Math.round(maxHistoricalWeight * 0.75) : 0;

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