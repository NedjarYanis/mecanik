import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, X, Camera, Loader2, RefreshCw } from 'lucide-react';
import { createWorker } from 'tesseract.js'; 
import { collection, addDoc } from "firebase/firestore";
import { db } from '../services/firebase';

const foodsCollection = collection(db, 'foods');

export default function ContributeFoodModal({ onClose, onFoodAdded, initialBarcode = "" }) {
  const [newFood, setNewFood] = useState({ name: "", brand: "", cals: "", prot: "", carbs: "", fat: "", barcode: initialBarcode });
  const [isPublishing, setIsPublishing] = useState(false);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const fileInputRef = useRef(null);

  const handleOcrScan = async (e) => {
    const file = e.target.files[0]; 
    if (!file) return;
    setIsOcrScanning(true);
    try {
      const worker = await createWorker('fra');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      const clean = text.toLowerCase().replace(/\n/g, ' ');
      const extract = (regex) => { const m = clean.match(regex); return m ? parseFloat(m[1].replace(',', '.')) : 0; };
      
      setNewFood(prev => ({ 
        ...prev, 
        cals: Math.round(extract(/(?:kcal|calories|énergie|energie|kj).*?(\d+[.,]?\d*)/i)) || prev.cals, 
        prot: Math.round(extract(/(?:protéines|proteines|protein).*?(\d+[.,]?\d*)/i)) || prev.prot, 
        carbs: Math.round(extract(/(?:glucides|carbs|dont sucres).*?(\d+[.,]?\d*)/i)) || prev.carbs, 
        fat: Math.round(extract(/(?:lipides|fat|matières grasses).*?(\d+[.,]?\d*)/i)) || prev.fat 
      }));
    } catch (err) {
      console.error(err);
    } finally { 
      setIsOcrScanning(false); 
    }
  };

  const handleContributeFood = async () => {
    if (!newFood.name || !newFood.cals) return;
    setIsPublishing(true);
    const item = { ...newFood, cals: Number(newFood.cals), prot: Number(newFood.prot||0), carbs: Number(newFood.carbs||0), fat: Number(newFood.fat||0), verified: false };
    try {
      const docRef = await addDoc(foodsCollection, item);
      const added = { id: docRef.id, ...item };
      onFoodAdded(added);
    } catch (e) {
      console.error(e);
    } finally { 
      setIsPublishing(false); 
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex flex-col">
      <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <h2 className="text-lg font-black uppercase text-white">Ajout Manuel</h2>
        <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full active:scale-90"><X size={20} className="text-white"/></button>
      </div>
      
      <div className="p-5 overflow-y-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/20 border border-blue-500/30 rounded-[24px] p-5">
          <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleOcrScan} />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/50"><BrainCircuit size={24} className="text-blue-400" /></div>
            <div><h3 className="font-black text-white text-sm uppercase">Scanner via IA</h3><p className="text-[10px] text-blue-200 mt-1">Prenez en photo le tableau nutritionnel.</p></div>
          </div>
          <button onClick={() => fileInputRef.current.click()} disabled={isOcrScanning} className="w-full mt-4 py-3 bg-blue-600 rounded-full font-black uppercase text-[10px] text-white active:scale-95 flex items-center justify-center gap-2">
            {isOcrScanning ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {isOcrScanning ? "Analyse..." : "Photographier l'étiquette"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><span className="text-[10px] font-black uppercase text-zinc-500 mb-2 block">Nom du produit</span><input type="text" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" /></div>
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"><span className="text-[10px] font-black uppercase text-zinc-500 mb-2 block">Calories (pour 100g ou 1 portion)</span><input type="number" value={newFood.cals} onChange={e => setNewFood({...newFood, cals: e.target.value})} className="bg-transparent font-black text-white outline-none w-full" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-[9px] font-black text-yellow-500 uppercase block mb-1">GLU</span><input type="number" value={newFood.carbs} onChange={e => setNewFood({...newFood, carbs: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" /></div>
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-[9px] font-black text-blue-500 uppercase block mb-1">PROT</span><input type="number" value={newFood.prot} onChange={e => setNewFood({...newFood, prot: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" /></div>
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-[9px] font-black text-red-500 uppercase block mb-1">LIP</span><input type="number" value={newFood.fat} onChange={e => setNewFood({...newFood, fat: e.target.value})} className="bg-transparent font-bold text-white outline-none w-full" /></div>
          </div>
        </div>

        <button onClick={handleContributeFood} disabled={isPublishing} className={`w-full py-5 rounded-full font-black uppercase text-xs active:scale-95 transition-colors ${newFood.name && newFood.cals ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
          {isPublishing ? <RefreshCw size={16} className="animate-spin mx-auto" /> : "Sauvegarder l'aliment"}
        </button>
      </div>
    </motion.div>
  );
}