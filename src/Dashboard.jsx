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
       className="flex flex-col h-full w-full bg-[#0B0E0B] text-white p-6 overflow-y-auto pb-48 space-y-6 bg-muscular-watermark"
    >
      {/* HEADER AÉRÉ */}
      <header className="flex justify-between items-center pt-4 mb-2">
        <div>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">Tableau de Bord</p>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white mt-1">
            Salut, <span className="text-[#D4FC47]">{profile?.pseudo || currentUser?.email?.split('@')[0]}</span>
          </h1>
        </div>
        <div className="w-12 h-12 bg-[#141814] rounded-2xl border border-zinc-800 flex items-center justify-center relative shadow-lg">
          <User className="text-zinc-400" size={20} />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D4FC47] rounded-full border-2 border-[#0B0E0B] flex items-center justify-center">
            <Check className="text-black" size={10} strokeWidth={4} />
          </div>
        </div>
      </header>

      {/* TODAY'S CHALLENGE */}
      <div className="bg-[#D4FC47] text-black p-6 rounded-[32px] shadow-[0_10px_30px_rgba(212,252,71,0.15)] relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] font-black uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full">Aujourd'hui</span>
          <Sparkles size={18} className="text-black" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight italic">Today's Challenge</h3>
        <p className="text-xs font-bold mt-1 text-black/80">Do your plan before 9:00 AM</p>
      </div>

      {/* AI COACH */}
      <button 
         onClick={() => onNavigate('coach')}
        className="w-full bg-[#141814] hover:bg-[#1C221C] border border-zinc-800 p-5 rounded-[28px] flex items-center justify-between shadow-lg active:scale-[0.98] transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="bg-[#0B0E0B] p-3 rounded-2xl border border-zinc-800 text-[#D4FC47]">
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

      {/* DUO SYMÉTRIQUE : ÉNERGIE / EAU (Sans clipping de texte) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#141814] p-5 rounded-[28px] border border-zinc-800 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-[#D4FC47]/10 rounded-xl text-[#D4FC47]"><Flame size={16} /></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Énergie</span>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{stats.consumed} <span className="text-xs text-zinc-500 font-bold">kcal</span></p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4FC47]/30" />
        </div>
        
        <div className="bg-[#141814] p-5 rounded-[28px] border border-zinc-800 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400"><Droplet size={16} /></div>
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Eau</span>
          </div>
          <div>
            <p className="text-xl font-black text-white tracking-tight">{stats.water} <span className="text-xs text-zinc-500 font-bold">ml</span></p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-500/30" />
        </div>
      </div>

      {/* SÉANCE DU JOUR */}
      <div>
        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-3 flex items-center gap-2">
          <Calendar size={14} className="text-[#D4FC47]" /> Séance du Jour
        </h3>
        
        <div 
          onClick={() => onNavigate('workout')}
          className="bg-[#141814] border border-zinc-800 p-6 rounded-[32px] relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group shadow-xl"
        >
          <div className="absolute right-[-10px] bottom-[-20px] text-zinc-800/30 pointer-events-none select-none">
            <Dumbbell size={110} strokeWidth={2.5} />
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
      </div>
    </motion.div>
  );
}