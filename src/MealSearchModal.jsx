import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, ScanBarcode, CheckCircle2, Heart, Plus, Trash2 } from 'lucide-react';

export default function MealSearchModal({ 
  mealId, 
  mealData, 
  onClose, 
  onRemoveFood, 
  onScanClick, 
  globalDB, 
  onFoodSelect, 
  favorites, 
  onToggleFavorite, 
  recentFoods 
}) {
  const [activeSearchTab, setActiveSearchTab] = useState('today'); 
  const [searchQuery, setSearchQuery] = useState("");

  const mealTitles = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snacks: 'Snacks'
  };

  return (
    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col">
      <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <h2 className="text-lg font-black uppercase">{mealTitles[mealId]}</h2>
        <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full active:scale-90"><X size={20}/></button>
      </div>
      
      <div className="flex gap-2 p-4 overflow-x-auto border-b border-zinc-800 hide-scrollbar">
        <button onClick={() => setActiveSearchTab('today')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeSearchTab === 'today' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>Aujourd'hui</button>
        <button onClick={() => setActiveSearchTab('search')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeSearchTab === 'search' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>Recherche</button>
        <button onClick={() => setActiveSearchTab('recent')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeSearchTab === 'recent' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>Récents</button>
        <button onClick={() => setActiveSearchTab('favorites')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-colors ${activeSearchTab === 'favorites' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}><Heart size={12} className={activeSearchTab === 'favorites' ? 'fill-current' : ''}/> Favoris</button>
      </div>

      <div className="p-4 flex-1 flex flex-col min-h-0">
        
        {activeSearchTab === 'today' && (
          <div className="flex-1 overflow-y-auto space-y-2">
            {(!mealData?.items || mealData.items.length === 0) && (
              <div className="text-center text-zinc-500 font-bold text-xs mt-10">
                Aucun aliment ajouté pour ce repas. <br/><br/>
                <span className="font-normal text-[10px]">Utilisez les onglets "Recherche" ou "Récents" pour ajouter des aliments.</span>
              </div>
            )}
            {mealData?.items?.map((item, i) => (
              <div key={i} className="bg-zinc-900/30 p-4 rounded-2xl flex justify-between items-center border border-zinc-800">
                <div className="flex-1">
                    <p className="font-bold text-sm text-white">{item.name}</p>
                    <p className="text-[10px] text-emerald-500 font-bold mt-1">{item.quantity}g <span className="text-zinc-500">| {item.cals} Kcal</span></p>
                </div>
                <button onClick={() => onRemoveFood(mealId, i)} className="p-3 bg-red-900/20 rounded-xl text-red-500 active:scale-90 transition-transform">
                   <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeSearchTab === 'search' && (
          <>
            <div className="flex items-center gap-3 bg-zinc-900 p-4 rounded-2xl mb-4 border border-zinc-800 shadow-inner">
              <Search size={20} className="text-zinc-500" />
              <input type="text" placeholder="Aliment..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent font-bold text-white outline-none w-full" autoFocus />
              <button onClick={onScanClick} className="p-1 bg-emerald-500/10 rounded-lg active:scale-90"><ScanBarcode size={24} className="text-emerald-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {globalDB.filter(f => f.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20).map(item => (
                <div key={item.id} onClick={() => onFoodSelect(item)} className="bg-[#151517] p-4 rounded-2xl flex justify-between items-center border border-zinc-800 cursor-pointer active:scale-95">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-white flex items-center gap-1">
                      {item.name}
                      {item.verified && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-1">{item.cals} Kcal • {item.prot}g P</p>
                  </div>
                  <button onClick={(e) => onToggleFavorite(item, e)} className="p-3 active:scale-90">
                     <Heart size={18} className={favorites.find(f => f.id === item.id) ? "text-red-500 fill-current" : "text-zinc-600"} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeSearchTab === 'recent' && (
          <div className="flex-1 overflow-y-auto space-y-2">
            {recentFoods.length === 0 && <p className="text-center text-zinc-500 font-bold text-xs mt-10">Aucun aliment récent.</p>}
            {recentFoods.map((item, i) => (
              <div key={i} onClick={() => onFoodSelect(item)} className="bg-[#151517] p-4 rounded-2xl flex justify-between items-center border border-zinc-800 cursor-pointer active:scale-95">
                <div className="flex-1">
                    <p className="font-bold text-sm text-white flex items-center gap-1">
                      {item.name}
                      {item.verified && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-1">{item.cals} Kcal • {item.prot}g P</p>
                </div>
                <Plus size={20} className="text-blue-500" />
              </div>
            ))}
          </div>
        )}

        {activeSearchTab === 'favorites' && (
          <div className="flex-1 overflow-y-auto space-y-2">
            {favorites.length === 0 && <p className="text-center text-zinc-500 font-bold text-xs mt-10">Aucun favori enregistré.</p>}
            {favorites.map((item, i) => (
              <div key={i} onClick={() => onFoodSelect(item)} className="bg-[#151517] p-4 rounded-2xl flex justify-between items-center border border-zinc-800 cursor-pointer active:scale-95">
                <div className="flex-1">
                    <p className="font-bold text-sm text-white flex items-center gap-1">
                      {item.name}
                      {item.verified && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-1">{item.cals} Kcal • {item.prot}g P</p>
                </div>
                <button onClick={(e) => onToggleFavorite(item, e)} className="p-3 active:scale-90"><Heart size={18} className="text-red-500 fill-current" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}