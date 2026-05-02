import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function FoodQuantityModal({ food, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(100);

  const handleConfirm = () => {
    onConfirm(food, quantity);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      <div className="bg-[#121214] w-full max-w-sm rounded-[24px] p-6 border border-blue-500/20 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black rounded-full text-zinc-400 active:scale-90"><X size={16}/></button>
        <h2 className="text-lg font-bold tracking-tight mb-2 text-white text-center">{food.name}</h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase text-center mb-6">Saisir la quantité</p>
        
        <div className="flex items-center justify-center gap-4 mb-8">
          <input 
            type="number" 
            value={quantity} 
            onChange={e => setQuantity(Number(e.target.value))} 
            className="bg-black border border-zinc-800 w-32 py-3 text-3xl font-black text-center text-blue-500 rounded-xl outline-none focus:border-blue-500" 
            autoFocus
          />
          <span className="text-xl font-bold text-zinc-400">g/ml</span>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-6 opacity-70">
          <div className="text-center"><p className="text-[9px] font-black text-white uppercase">KCAL</p><p className="text-xs font-bold text-zinc-400">{Math.round(food.cals * (quantity/100))}</p></div>
          <div className="text-center"><p className="text-[9px] font-black text-blue-500 uppercase">PROT</p><p className="text-xs font-bold text-zinc-400">{Math.round(food.prot * (quantity/100))}g</p></div>
          <div className="text-center"><p className="text-[9px] font-black text-yellow-500 uppercase">GLU</p><p className="text-xs font-bold text-zinc-400">{Math.round(food.carbs * (quantity/100))}g</p></div>
          <div className="text-center"><p className="text-[9px] font-black text-red-500 uppercase">LIP</p><p className="text-xs font-bold text-zinc-400">{Math.round(food.fat * (quantity/100))}g</p></div>
        </div>

        <button onClick={handleConfirm} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-xs active:scale-95 transition-transform">Ajouter au repas</button> 
      </div>
    </motion.div>
  );
}