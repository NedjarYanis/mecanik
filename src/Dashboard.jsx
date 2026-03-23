import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, BrainCircuit, Download, LogOut, TrendingUp, Calendar, Activity, ArrowRight } from 'lucide-react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth, useData } from './App';

const ChartTooltip = ({ active, payload, color }) => {
  if (active && payload && payload.length) {
    return ( <div className="bg-black border border-zinc-800 p-3 rounded-xl shadow-xl"><p className="font-bold text-sm" style={{color: color || '#10b981'}}>{`${payload[0].value} kg`}</p></div> );
  }
  return null;
};

export default function DashboardTab({ onNavigate }) {
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
                    <h2 className="text-sm font-bold text-white leading-tight">{todaysWorkout?.focus || "Repos"}</h2>
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