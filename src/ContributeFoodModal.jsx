import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, X, Camera, Loader2, RefreshCw } from 'lucide-react';
import { getOcrWorker } from '../services/ocrService'; // Import du service singleton
import { collection, addDoc } from "firebase/firestore";
import { db } from '../services/firebase';

const foodsCollection = collection(db, 'foods');

export default function ContributeFoodModal({ onClose, onFoodAdded, initialBarcode = "" }) {
  const [newFood, setNewFood] = useState({ 
    name: "", 
    brand: "", 
    cals: "", 
    prot: "", 
    carbs: "", 
    fat: "", 
    barcode: initialBarcode 
  });
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const fileInputRef = useRef(null);

  // Pré-chargement silencieux du worker IA dès l'ouverture de la modale
  useEffect(() => {
    getOcrWorker();
  }, []);

  const handleOcrScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsOcrScanning(true);
    try {
      // Utilisation de l'instance partagée (Singleton) au lieu de createWorker()[cite: 22]
      const worker = await getOcrWorker();
      const { data: { text } } = await worker.recognize(file);
      
      const clean = text.toLowerCase().replace(/\n/g, ' ');
      const extract = (regex) => { 
        const m = clean.match(regex); 
        return m ? parseFloat(m[1].replace(',', '.')) : 0; 
      };

      // Analyse intelligente des valeurs nutritionnelles via Regex[cite: 22]
      setNewFood(prev => ({
        ...prev,
        cals: Math.round(extract(/(?:kcal|calories|énergie|energie|kj).*?(\d+[.,]?\d*)/i)) || prev.cals,
        prot: Math.round(extract(/(?:protéines|proteines|protein).*?(\d+[.,]?\d*)/i)) || prev.prot,
        carbs: Math.round(extract(/(?:glucides|carbs|dont sucres).*?(\d+[.,]?\d*)/i)) || prev.carbs,
        fat: Math.round(extract(/(?:lipides|fat|matières grasses).*?(\d+[.,]?\d*)/i)) || prev.fat
      }));
    } catch (err) {
      console.error("Erreur OCR:", err);
      alert("Impossible d'analyser l'image. Assurez-vous que les macros sont bien visibles.");
    } finally {
      setIsOcrScanning(false);
    }
  };

  const handleContributeFood = async () => {
    if (!newFood.name || !newFood.cals) {
      alert("Le nom et les calories sont obligatoires.");
      return;
    }

    setIsPublishing(true);
    const item = { 
      ...newFood, 
      cals: Number(newFood.cals), 
      prot: Number(newFood.prot || 0), 
      carbs: Number(newFood.carbs || 0), 
      fat: Number(newFood.fat || 0), 
      verified: false 
    };

    try {
      // Ajout de l'aliment à la collection Firebase 'foods'
      const docRef = await addDoc(foodsCollection, item);
      onFoodAdded({ id: docRef.id, ...item });
      onClose();
    } catch (e) {
      console.error("Erreur lors de l'ajout Firebase:", e);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex flex-col"
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-xl font-black italic tracking-tighter text-white">CONTRIBUER</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Section Scanner IA[cite: 22] */}
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
          <BrainCircuit className="w-12 h-12 text-blue-400 mb-2" />
          <h3 className="text-white font-bold mb-1">Scanner de Macros IA</h3>
          <p className="text-blue-200/60 text-sm mb-4">
            Prenez une photo du tableau nutritionnel pour remplir les champs automatiquement.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleOcrScan} 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={isOcrScanning}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isOcrScanning ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Camera className="w-6 h-6" />
                DÉCHIFFRER L'ÉTIQUETTE
              </>
            )}
          </button>
        </div>

        {/* Formulaire de saisie[cite: 26] */}
        <div className="space-y-4 text-white">
          <div className="grid grid-cols-1 gap-4">
            <input 
              placeholder="Nom de l'aliment (ex: Poulet Fumé)" 
              className="bg-white/5 border border-white/10 p-4 rounded-xl w-full focus:border-blue-500 outline-none transition-all"
              value={newFood.name} 
              onChange={e => setNewFood({...newFood, name: e.target.value})}
            />
            <input 
              placeholder="Marque (Optionnel)" 
              className="bg-white/5 border border-white/10 p-4 rounded-xl w-full focus:border-blue-500 outline-none transition-all"
              value={newFood.brand} 
              onChange={e => setNewFood({...newFood, brand: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-white">
              <label className="text-xs font-bold text-white/40 ml-1 uppercase italic">Calories / 100g</label>
              <input 
                type="number" 
                placeholder="0" 
                className="bg-white/5 border border-white/10 p-4 rounded-xl w-full focus:border-blue-500 outline-none transition-all font-mono text-xl"
                value={newFood.cals} 
                onChange={e => setNewFood({...newFood, cals: e.target.value})}
              />
            </div>
            <div className="space-y-2 text-white">
              <label className="text-xs font-bold text-white/40 ml-1 uppercase italic">Protéines / 100g</label>
              <input 
                type="number" 
                placeholder="0" 
                className="bg-white/5 border border-white/10 p-4 rounded-xl w-full focus:border-blue-500 outline-none transition-all font-mono text-xl"
                value={newFood.prot} 
                onChange={e => setNewFood({...newFood, prot: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-white">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 ml-1 uppercase italic">Glucides / 100g</label>
              <input 
                type="number" 
                placeholder="0" 
                className="bg-white/5 border border-white/10 p-4 rounded-xl w-full focus:border-blue-500 outline-none transition-all font-mono text-xl"
                value={newFood.carbs} 
                onChange={e => setNewFood({...newFood, carbs: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 ml-1 uppercase italic">Lipides / 100g</label>
              <input 
                type="number" 
                placeholder="0" 
                className="bg-white/5 border border-white/10 p-4 rounded-xl w-full focus:border-blue-500 outline-none transition-all font-mono text-xl"
                value={newFood.fat} 
                onChange={e => setNewFood({...newFood, fat: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-black border-t border-white/10">
        <button 
          onClick={handleContributeFood}
          disabled={isPublishing || !newFood.name || !newFood.cals}
          className="w-full bg-white text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-30 active:scale-95"
        >
          {isPublishing ? <Loader2 className="w-6 h-6 animate-spin" /> : "PUBLIER DANS LA BASE"}
        </button>
      </div>
    </motion.div>
  );
}