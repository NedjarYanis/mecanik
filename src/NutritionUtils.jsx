import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ChevronLeft, TrendingDown, Activity, TrendingUp } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export const calculateMifflin = (profile) => {
  if (!profile) return { bmr: 0, tdee: 2600 };
  const w = Number(profile.weight) || 75; const h = Number(profile.height) || 175; const a = Number(profile.age) || 25;
  let bmr = (10 * w) + (6.25 * h) - (5 * a); bmr += profile.gender === 'M' ? 5 : -161;
  const multipliers = { 'Sédentaire': 1.2, 'Léger': 1.375, 'Modéré': 1.55, 'Intense': 1.725 };
  const tdee = bmr * (multipliers[profile.activityLevel || 'Modéré'] || 1.55);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee) };
};

export const calculateTargetGoals = (profile, tdee) => {
  let targetCalories;
  if (profile?.manualCalorieGoal) {
    targetCalories = Number(profile.manualCalorieGoal);
  } else {
    let multiplier = 1; 
    const goal = profile?.goal || 'maintain';
    if (goal === 'cut') multiplier = 0.85; 
    if (goal === 'bulk') multiplier = 1.10; 
    targetCalories = Math.round(tdee * multiplier);
  }
  const w = Number(profile?.weight) || 75;
  const protein = Math.round(w * 2.2); 
  const fat = Math.round((targetCalories * 0.25) / 9); 
  const remainingCals = targetCalories - (protein * 4) - (fat * 9);
  const carbs = Math.max(0, Math.round(remainingCals / 4)); 
  return { targetCalories, protein, fat, carbs };
};

export const simulateRandomForest = (profile) => {
  if (!profile) return { type: "Inconnu", risk: "?", focus: "Remplissez votre profil." };
  const fat = Number(profile.bodyFat) || 15; const w = Number(profile.weight) || 75; const h = Number(profile.height) || 175;
  const bmi = w / Math.pow(h / 100, 2);
  if (fat > 25 && bmi > 25) return { type: "Endomorphe Lourd", risk: "Élevé", focus: "Déficit strict, Lipides bas." };
  if (fat <= 15 && bmi < 22) return { type: "Ectomorphe Rapide", risk: "Faible", focus: "Surplus calorique, Hyper-protéiné." };
  return { type: "Mésomorphe Équilibré", risk: "Modéré", focus: "Recomposition corporelle." };
};

export const CircularGauge = React.memo(({ value, max, color, size = 64, strokeWidth = 6, icon: Icon }) => {
  const radius = (size - strokeWidth) / 2; const circumference = 2 * Math.PI * radius; const percent = Math.min((value || 0) / (max || 1), 1);
  const strokeDashoffset = circumference - percent * circumference;
  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 absolute"><circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-zinc-900" /><circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" /></svg>
      <div className="absolute flex flex-col items-center justify-center">{Icon && <Icon size={size * 0.3} color={color} />}</div>
    </div>
  );
});

export const LiveBarcodeScanner = ({ onScanComplete, onClose }) => {
  const scannerRef = useRef(null);
  useEffect(() => {
    scannerRef.current = new Html5Qrcode("live-reader");
    scannerRef.current.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
        scannerRef.current.stop().then(() => onScanComplete(text));
    }, () => {});
    return () => { if (scannerRef.current?.isScanning) scannerRef.current.stop(); };
  }, [onScanComplete]);
  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6">
      <div id="live-reader" className="w-full max-w-sm aspect-square bg-zinc-900 rounded-3xl overflow-hidden border-4 border-emerald-500"></div>
      <button onClick={onClose} className="mt-8 px-8 py-3 bg-zinc-800 rounded-full font-bold uppercase text-xs text-white">Annuler</button>
    </div>
  );
};

export function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ age: 25, gender: 'M', weight: 75, height: 175, activityLevel: 'Modéré', bodyFat: 15, goal: 'maintain', manualCalorieGoal: null });
  const metabolicStats = calculateMifflin(profile);
  const targetGoals = calculateTargetGoals(profile, metabolicStats.tdee);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black text-white flex flex-col p-6 overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        <div className="text-center"><BrainCircuit size={48} className="text-blue-500 mx-auto mb-4 animate-pulse" /><h1 className="text-3xl font-black uppercase tracking-tighter">Configuration</h1></div>
        {step === 1 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">1. Données de Base</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Âge</span><input type="number" value={profile.age} onChange={e=>setProfile({...profile, age: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
              <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Genre</span><select value={profile.gender} onChange={e=>setProfile({...profile, gender: e.target.value})} className="bg-transparent w-full font-black text-xl outline-none"><option value="M">M</option><option value="F">F</option></select></div>
              <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Poids (kg)</span><input type="number" value={profile.weight} onChange={e=>setProfile({...profile, weight: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
              <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Taille (cm)</span><input type="number" value={profile.height} onChange={e=>setProfile({...profile, height: Number(e.target.value)})} className="bg-transparent w-full font-black text-xl outline-none" /></div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl"><span className="text-[10px] uppercase text-zinc-500 font-bold">Activité</span><select value={profile.activityLevel} onChange={e=>setProfile({...profile, activityLevel: e.target.value})} className="bg-transparent w-full font-black text-lg outline-none"><option>Sédentaire</option><option>Léger</option><option>Modéré</option><option>Intense</option></select></div>
            <button onClick={() => setStep(2)} className="w-full py-4 bg-blue-600 rounded-full font-black uppercase text-xs">Suivant</button>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500">2. Stratégie</h2>
            <div className="space-y-3">
              <div onClick={() => setProfile({...profile, goal: 'cut'})} className={`p-4 rounded-2xl border cursor-pointer transition-all ${profile.goal === 'cut' ? 'bg-emerald-900/40 border-emerald-500' : 'bg-zinc-900 border-zinc-800'}`}><div className="flex justify-between items-center mb-1"><span className="font-black text-white">Sèche</span><TrendingDown size={18} className="text-emerald-500"/></div><p className="text-[10px] text-zinc-400 font-bold">Déficit de -15%</p></div>
              <div onClick={() => setProfile({...profile, goal: 'maintain'})} className={`p-4 rounded-2xl border cursor-pointer transition-all ${profile.goal === 'maintain' ? 'bg-blue-900/40 border-blue-500' : 'bg-zinc-900 border-zinc-800'}`}><div className="flex justify-between items-center mb-1"><span className="font-black text-white">Maintien</span><Activity size={18} className="text-blue-500"/></div><p className="text-[10px] text-zinc-400 font-bold">Équilibre énergétique</p></div>
              <div onClick={() => setProfile({...profile, goal: 'bulk'})} className={`p-4 rounded-2xl border cursor-pointer transition-all ${profile.goal === 'bulk' ? 'bg-red-900/40 border-red-500' : 'bg-zinc-900 border-zinc-800'}`}><div className="flex justify-between items-center mb-1"><span className="font-black text-white">Prise de Masse</span><TrendingUp size={18} className="text-red-500"/></div><p className="text-[10px] text-zinc-400 font-bold">Surplus de +10%</p></div>
            </div>
            <div className="flex gap-2"><button onClick={() => setStep(1)} className="p-4 bg-zinc-800 rounded-2xl"><ChevronLeft size={20}/></button><button onClick={() => setStep(3)} className="flex-1 py-4 bg-emerald-600 rounded-full font-black uppercase text-xs">Calculer mon objectif</button></div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 text-center">
            <h2 className="text-xs font-black uppercase tracking-widest text-cyan-500">3. Résultat & Ajustement</h2>
            <div className="bg-[#121214] p-8 rounded-[32px] border border-zinc-800 shadow-2xl">
                <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-2 block">Objectif Journalier</span>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <input type="number" value={profile.manualCalorieGoal || targetGoals.targetCalories} onChange={e => setProfile({...profile, manualCalorieGoal: Number(e.target.value)})} className="bg-black border border-zinc-800 w-32 py-2 text-3xl font-black text-center text-emerald-500 rounded-xl outline-none focus:border-emerald-500" />
                    <span className="text-xl font-bold text-zinc-400">kcal</span>
                </div>
            </div>
            <div className="flex gap-2"><button onClick={() => setStep(2)} className="p-4 bg-zinc-800 rounded-2xl"><ChevronLeft size={20}/></button><button onClick={() => onComplete(profile)} className="flex-1 py-4 bg-blue-600 rounded-full font-black uppercase text-xs">Démarrer</button></div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}