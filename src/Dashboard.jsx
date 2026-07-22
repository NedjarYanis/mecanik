import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
   Flame, Droplet, BrainCircuit, ChevronRight, 
   Play, Calendar, Clock, User, Check, Dumbbell, Sparkles 
} from 'lucide-react';
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
  }, [program]);

  return (
    <motion.div 
       initial={{ opacity: 0, y: 10 }} 
       animate={{ opacity: 1, y: 0 }} 
       className="flex flex-col h-full w-full bg-[#0B0E0B] text-white p-5 overflow-y-auto pb-32"
    >
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6 pt-4">
        <div>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">Tableau de Bord</p>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">
            Salut, <span className="text-[#D4FC47]">{profile?.pseudo || currentUser?.email?.split('@')[0]}</span>
          </h1>
        </div>
        <div className="w-12 h-12 bg-[#1A1E1A] rounded-full border border-zinc-800 flex items-center justify-center relative">
          <User className="text-zinc-400" size={20} />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D4FC47] rounded-full border-2 border-[#0B0E0B] flex items-center justify-center">
            <Check className="text-black" size={10} strokeWidth={4} />
          </div>
        </div>
      </header>

      {/* BANNIÈRE DÉFI DU JOUR (Néon/Citron #D4FC47 comme sur l'image) */}
      <div className="bg-[#D4FC47] text-black p-5 mb-6 shape-asym-1 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] font-black uppercase tracking-widest bg-black/10 px-2.5 py-1 rounded-full">Aujourd'hui</span>
          <Sparkles size={16} className="text-black" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight italic">Today's Challenge</h3>
        <p className="text-xs font-bold mt-1 text-black/80">Do your plan before 9:00 AM</p>
      </div>

      {/* BANNIÈRE AI COACH SECONDAIRE */}
      <button 
         onClick={() => onNavigate('coach')}
        className="w-full bg-[#1A1E1A] border border-zinc-800 p-5 mb-6 shape-asym-2 flex items-center justify-between shadow-lg active:scale-[0.98] transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="bg-black/40 p-3 rounded-2xl border border-white/10 text-[#D4FC47]">
            <BrainCircuit size={24} />
          </div>
          <div className="text-left">
            <p className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
              MĘCANIK AI <Sparkles size={12} className="text-[#D4FC47]" />
            </p>
            <p className="text-zinc-400 text-[10px] font-bold mt-0.5">Analyse tes performances</p>
          </div>
        </div>
        <ChevronRight className="text-zinc-500 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* STATS : ENERGIE & EAU (Cartes asymétriques en Lavande/Gris mat #D0BFFF et #1A1E1A) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#D0BFFF] text-black p-5 rounded-[28px] border border-white/20 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-black/10 rounded-xl text-black"><Flame size={16} /></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-black/70">Énergie</span>
          </div>
          <p className="text-2xl font-black">{stats.consumed} <span className="text-xs text-black/60 font-bold">kcal</span></p>
        </div>
        
        <div className="bg-[#1A1E1A] p-5 rounded-[28px] border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400"><Droplet size={16} /></div>
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Eau</span>
          </div>
          <p className="text-2xl font-black text-white">{stats.water} <span className="text-xs text-zinc-500">ml</span></p>
        </div>
      </div>

      {/* SÉANCE DU JOUR */}
      <h3 className="text-xs font-black uppercase text-zinc-400 tracking-[0.2em] mb-3 flex items-center gap-2">
        <Calendar size={14} /> Séance du Jour
      </h3>
      
      <div 
        onClick={() => onNavigate('workout')}
        className="bg-[#1A1E1A] border border-zinc-800 p-6 shape-asym-1 relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group mb-6"
      >
        <div className="absolute top-0 right-0 p-6 text-zinc-800/40 group-hover:text-[#D4FC47]/20 transition-colors pointer-events-none">
          <Dumbbell size={70} strokeWidth={3} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#D4FC47] rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-[#D4FC47] uppercase tracking-widest">PRÊTE</span>
          </div>
          <h4 className="text-xl font-black uppercase italic tracking-tighter mb-1 text-white">{todayProgram.focus}</h4>
          <p className="text-zinc-400 text-xs font-medium mb-5">{todayProgram.desc}</p>
          
          <div className="flex items-center justify-between">
             <div className="px-3 py-1.5 bg-[#0B0E0B] rounded-xl border border-zinc-800 flex items-center gap-2">
               <Clock size={12} className="text-zinc-500" />
               <span className="text-[9px] font-black text-white">~75 MIN</span>
             </div>
             <div className="w-11 h-11 bg-[#D4FC47] text-black rounded-full flex items-center justify-center shadow-lg active:scale-95">
                <Play size={18} fill="black" className="ml-0.5" />
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}