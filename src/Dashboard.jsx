import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Droplet, BrainCircuit, Play, Calendar, User, Sparkles } from 'lucide-react';
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full p-6 overflow-y-auto pb-40 space-y-8">
      
      {/* HEADER ULTRA AÉRÉ */}
      <header className="flex justify-between items-center pt-8">
        <div className="space-y-1">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Tableau de Bord</p>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">
            Salut, <br/><span className="text-[#ADFF2F] italic">{profile?.pseudo || currentUser?.email?.split('@')[0]}</span>
          </h1>
        </div>
        <div className="w-14 h-14 glass-panel rounded-full flex items-center justify-center">
          <User className="text-[#ADFF2F]" size={24} />
        </div>
      </header>

      {/* TODAY'S CHALLENGE : BULLE ORGANIQUE ÉTIRÉE */}
      <div className="bg-[#ADFF2F] text-black p-8 bubble-1 glow-accent relative">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest bg-black/10 px-3 py-1.5 bubble-pill">Aujourd'hui</span>
          <Sparkles size={20} className="text-black/60" />
        </div>
        <h3 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">Today's <br/>Challenge</h3>
        <p className="text-sm font-bold text-black/70">Do your plan before 9:00 AM</p>
      </div>

      {/* DUO LIQUIDE : ÉNERGIE / EAU (Bug du texte résolu grâce au flex étendu) */}
      <div className="grid grid-cols-2 gap-5">
        <div className="glass-panel p-6 bubble-2 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#ADFF2F]/10 bubble-pill text-[#ADFF2F]"><Flame size={18} /></div>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Énergie</span>
            <p className="text-3xl font-black text-white">{stats.consumed} <span className="text-sm text-zinc-600">kcal</span></p>
          </div>
        </div>
        
        <div className="glass-panel p-6 bubble-1 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-cyan-500/10 bubble-pill text-cyan-400"><Droplet size={18} /></div>
          </div>
          <div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Eau</span>
            {/* Flex-wrap et dimensions adaptatives pour empêcher le texte de couper */}
            <p className="text-3xl font-black text-white flex items-baseline gap-1 flex-wrap">{stats.water} <span className="text-sm text-zinc-600">ml</span></p>
          </div>
        </div>
      </div>

      {/* SÉANCE DU JOUR AÉRÉE */}
      <div>
        <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-4 flex items-center gap-2 px-2">
          <Calendar size={14} className="text-[#ADFF2F]" /> Séance du Jour
        </h3>
        
        <div onClick={() => onNavigate('workout')} className="glass-panel p-8 bubble-3 cursor-pointer group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2.5 h-2.5 bg-[#ADFF2F] rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-[#ADFF2F] uppercase tracking-widest">PRÊTE</span>
          </div>
          <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-white">{todayProgram.focus}</h4>
          <p className="text-zinc-400 text-sm mb-8">{todayProgram.desc}</p>
          
          <div className="flex justify-end">
             <div className="w-14 h-14 bg-[#ADFF2F] text-black rounded-full flex items-center justify-center glow-accent group-active:scale-90 transition-transform">
                <Play size={20} fill="black" className="ml-1" />
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}