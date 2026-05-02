import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, X, Settings, Flame, Activity, LogOut, UserX } from 'lucide-react';
import { simulateRandomForest } from '../NutritionUtils';

export default function ProfileModal({ 
  profile, 
  setProfile, 
  targetGoals, 
  metabolicStats, 
  onClose, 
  onLogout, 
  onDeleteAccount 
}) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col">
      <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-black uppercase flex items-center gap-2"><BrainCircuit size={20} className="text-cyan-500"/> Profil IA</h2>
        <div className="flex gap-3">
          <button onClick={() => setIsEditingProfile(!isEditingProfile)} className={`p-2 rounded-full ${isEditingProfile ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}><Settings size={20}/></button>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full"><X size={20}/></button>
        </div>
      </div>
      <div className="p-5 overflow-y-auto space-y-6 flex-1">
        {isEditingProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-4 rounded-2xl">
                <span className="text-[10px] uppercase text-zinc-500 font-bold">Poids (kg)</span>
                <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none text-white" />
              </div>
              <div className="bg-zinc-900 p-4 rounded-2xl">
                <span className="text-[10px] uppercase text-zinc-500 font-bold">Cible Jour</span>
                <input type="number" value={profile.manualCalorieGoal || targetGoals.targetCalories} onChange={e => setProfile({...profile, manualCalorieGoal: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none text-emerald-500" />
              </div>
            </div>
            <button onClick={() => setIsEditingProfile(false)} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-xs mt-6">Valider les changements</button>

            <div className="mt-8 pt-6 border-t border-zinc-800 space-y-3">
               <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Gestion du compte</h3>
               <button onClick={onLogout} className="w-full py-3.5 bg-zinc-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95">
                  <LogOut size={16} /> Me déconnecter
               </button>
               <button onClick={onDeleteAccount} className="w-full py-3.5 bg-red-900/10 text-red-500 border border-red-900/30 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95">
                  <UserX size={16} /> Supprimer mon compte
               </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/20 p-5 rounded-[24px] border border-cyan-500/30">
              <p className="text-2xl font-black text-white">{simulateRandomForest(profile).type}</p>
              <p className="text-xs text-cyan-200 mt-2 border-l-2 border-cyan-500 pl-2">{simulateRandomForest(profile).focus}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <Flame size={20} className="text-red-500 mb-2"/>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Objectif</p>
                <p className="text-xl font-black text-white">{targetGoals.targetCalories} kcal</p>
              </div>
              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <Activity size={20} className="text-blue-500 mb-2"/>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Maintenance</p>
                <p className="text-xl font-black text-white">{metabolicStats.tdee} kcal</p>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}