import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, Droplet, Zap, BrainCircuit, ChevronRight, 
  Play, Target, Activity, Trophy, Calendar, 
  ArrowUpRight, Clock, Star, User, Check, Dumbbell, Sparkles
} from 'lucide-react';

// Assure-toi que les chemins d'importation sont corrects
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';

export default function DashboardTab({ onNavigate }) {
  const { currentUser } = useAuth();
  const { profile, journal, program } = useData();

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const todayData = useMemo(() => journal[getTodayStr()] || {}, [journal]);

  const stats = useMemo(() => {
    const meals = Object.values(todayData.meals || {});
    const consumed = meals.reduce((acc, m) => acc + (m.cals || 0), 0);
    const water = todayData.water || 0;
    return { consumed, water };
  }, [todayData]);

  const todayProgram = useMemo(() => {
    const day = new Date().getDay();
    const dayIndex = day === 0 ? 7 : day;
    return program[dayIndex] || { focus: "Repos", desc: "Récupération nécessaire" };
  }, [program, todayData]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex flex-col h-full w-full bg-black text-white p-5 overflow-y-auto pb-32"
    >
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 pt-4">
        <div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Tableau de Bord</p>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">
            Salut, <span className="text-blue-500">{profile?.pseudo || currentUser?.email?.split('@')[0]}</span>
          </h1>
        </div>
        <div className="w-12 h-12 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center relative">
          <User className="text-zinc-500" size={20} />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center">
            <Check className="text-black" size={10} strokeWidth={4} />
          </div>
        </div>
      </header>

      {/* BANNIÈRE AI COACH */}
      <button 
        onClick={() => onNavigate('coach')}
        className="w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-5 rounded-[32px] mb-8 flex items-center justify-between shadow-xl shadow-blue-900/30 active:scale-[0.98] transition-all relative overflow-hidden group"
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-black/20 p-3 rounded-2xl backdrop-blur-md border border-white/10">
            <BrainCircuit className="text-white" size={28} />
          </div>
          <div className="text-left">
            <p className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
              MÉCANIK AI <Sparkles size={12} className="text-blue-200" />
            </p>
            <p className="text-blue-100 text-[10px] font-bold mt-1">Analyse tes performances & conseils</p>
          </div>
        </div>
        <ChevronRight className="text-white/50 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#121214] p-5 rounded-[28px] border border-zinc-800/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Flame size={18} /></div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Énergie</span>
          </div>
          <p className="text-2xl font-black text-white">{stats.consumed} <span className="text-xs text-zinc-600">kcal</span></p>
        </div>

        <div className="bg-[#121214] p-5 rounded-[28px] border border-zinc-800/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-500"><Droplet size={18} /></div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Eau</span>
          </div>
          <p className="text-2xl font-black text-white">{stats.water} <span className="text-xs text-zinc-600">ml</span></p>
        </div>
      </div>

      {/* SÉANCE DU JOUR */}
      <h3 className="text-xs font-black uppercase text-zinc-500 tracking-[0.2em] mb-4 flex items-center gap-2">
        <Calendar size={14} /> Ta Séance du Jour
      </h3>
      
      <div 
        onClick={() => onNavigate('workout')}
        className="bg-[#121214] border border-zinc-800/80 p-6 rounded-[32px] relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group"
      >
        <div className="absolute top-0 right-0 p-6 text-zinc-800 group-hover:text-blue-500/20 transition-colors">
          <Dumbbell size={80} strokeWidth={3} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">SÉANCE PRÊTE</span>
          </div>
          <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-1">{todayProgram.focus}</h4>
          <p className="text-zinc-500 text-xs font-medium mb-6">{todayProgram.desc}</p>
          
          <div className="flex items-center justify-between">
             <div className="flex gap-2">
                <div className="px-3 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-2">
                  <Clock size={12} className="text-zinc-500" />
                  <span className="text-[10px] font-black text-white">~75 MIN</span>
                </div>
             </div>
             <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Play size={20} fill="white" className="ml-1" />
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}