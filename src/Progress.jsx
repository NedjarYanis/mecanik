import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Scale, Target, TrendingUp, HeartPulse, Activity, CheckCircle2, Info } from 'lucide-react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

const ChartTooltip = ({ active, payload, color }) => {
  if (active && payload && payload.length) {
    return ( <div className="bg-black border border-zinc-800 p-3 rounded-xl shadow-xl"><p className="font-bold text-sm" style={{color: color || '#10b981'}}>{`${payload[0].value} kg`}</p></div> );
  }
  return null;
};

export default function Progress({ onBack, dataContext }) {
  const { profile, setProfile, journal } = dataContext;

  // Gestion du poids
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState(profile?.weight || 75);
  const [targetWeight, setTargetWeight] = useState(profile?.targetWeight || 70);

  const startWeight = profile?.weightHistory?.[0]?.weight || profile?.weight || 0;
  const currentWeight = profile?.weight || 0;
  const actualTarget = profile?.targetWeight || 70;

  const weightDiff = currentWeight - startWeight;
  const isLoss = weightDiff <= 0;
  
  // Calcul du % de progression vers l'objectif
  const totalToLoseOrGain = Math.abs(startWeight - actualTarget);
  const currentProgress = Math.abs(startWeight - currentWeight);
  const progressPercent = totalToLoseOrGain === 0 ? 0 : Math.min(100, Math.max(0, (currentProgress / totalToLoseOrGain) * 100));

  const saveWeightData = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const w = parseFloat(newWeight);
    const t = parseFloat(targetWeight);
    
    if(w) {
      const hist = profile.weightHistory || [];
      const updatedHistory = [...hist.filter(h => h.date !== todayStr), { date: todayStr, weight: w }].slice(-30);
      setProfile(prev => ({ ...prev, weight: w, targetWeight: t, weightHistory: updatedHistory }));
    }
    setShowWeightModal(false);
  };

  // Calcul d'un "Life Score" basé sur les données du journal
  const lifeScore = useMemo(() => {
    let score = 50; // Base
    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = journal[todayStr];
    
    if (todayData) {
        if (todayData.readiness >= 7) score += 20;
        if (todayData.water >= 2000) score += 15;
        if (todayData.activity > 300) score += 15;
    }
    return Math.min(100, score);
  }, [journal]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden" style={{ touchAction: "pan-y" }}>
      
      <AnimatePresence>
        {showWeightModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
            <div className="bg-[#121214] w-full max-w-sm rounded-[24px] p-6 border border-emerald-500/20 shadow-2xl relative">
              <h2 className="text-xl font-bold tracking-tight mb-6 text-white text-center">Mettre à jour</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Poids Actuel (kg)</span>
                    <input type="number" step="0.1" value={newWeight} onChange={e=>setNewWeight(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white font-bold text-center outline-none focus:border-emerald-500" />
                </div>
                <div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Poids Cible (kg)</span>
                    <input type="number" step="0.1" value={targetWeight} onChange={e=>setTargetWeight(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white font-bold text-center outline-none focus:border-blue-500" />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setShowWeightModal(false)} className="flex-1 py-3.5 bg-zinc-900 text-zinc-400 rounded-xl font-bold text-sm active:scale-95 border border-zinc-800">Annuler</button>
                <button onClick={saveWeightData} className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-95">Valider</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95"><ChevronLeft size={18}/></button>
          <h1 className="text-xl font-extrabold tracking-tight uppercase flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500"/> Progrès</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-5">
        
        {/* CARTE 1 : OBJECTIF DE POIDS (Façon Lifesum mais Dark) */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-emerald-900/20 rounded-full flex items-center justify-center border border-emerald-500/30 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <Scale size={32} className="text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">
                    {weightDiff === 0 ? "Poids de départ" : `Vous avez ${isLoss ? 'perdu' : 'pris'} ${Math.abs(weightDiff).toFixed(1)} kg`}
                </h2>
                <p className="text-xs text-zinc-400 font-medium px-4">
                    {progressPercent >= 100 ? "Objectif atteint ! Incroyable." : "Ne lâchez rien, la constance est la clé de la réussite."}
                </p>
            </div>

            {/* Barre de progression */}
            <div className="mb-6">
                <div className="w-full bg-black border border-zinc-800 h-3 rounded-full overflow-hidden relative">
                    <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${progressPercent}%` }} 
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                    />
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{startWeight} kg</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1"><Target size={10}/> {actualTarget} kg</span>
                </div>
            </div>

            <button onClick={() => setShowWeightModal(true)} className="w-full py-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-colors hover:bg-emerald-500/20">
                Mettre à jour le poids
            </button>
        </div>

        {/* CARTE 2 : GRAPHIQUE (Progression de l'objectif) */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-[24px] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Évolution globale</h3>
                <div className="flex items-center gap-1.5 bg-black px-2 py-1 rounded-md border border-zinc-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">En direct</span>
                </div>
            </div>
            
            <div className="h-40 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profile?.weightHistory || []}>
                        <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: "#121214", stroke: "#10b981", strokeWidth: 2}} activeDot={{r: 6, fill: "#10b981"}} />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* CARTE 3 : SCORE HEBDOMADAIRE (Façon Lifesum Life Score) */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-[24px] p-6 shadow-xl text-center">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Score d'Assiduité du Jour</h3>
            
            {/* Jauge Circulaire Custom */}
            <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 absolute">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#000" strokeWidth="12" />
                    <motion.circle 
                        cx="80" cy="80" r="70" fill="none" 
                        stroke={lifeScore > 70 ? "#10b981" : lifeScore > 40 ? "#eab308" : "#ef4444"} 
                        strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={440}
                        initial={{ strokeDashoffset: 440 }}
                        animate={{ strokeDashoffset: 440 - (440 * lifeScore) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </svg>
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-white leading-none">{lifeScore}</span>
                    <span className="text-[10px] font-bold text-zinc-500 mt-1">/ 100</span>
                </div>
            </div>

            <h4 className="text-lg font-bold text-white mb-2">Bilan Journalier</h4>
            <p className="text-xs text-zinc-400 font-medium px-4">
                Ce score prend en compte votre hydratation, votre activité physique et votre état de forme déclaré.
            </p>
        </div>

      </main>
    </motion.div>
  );
}