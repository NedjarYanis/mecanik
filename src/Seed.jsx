import React, { useState } from 'react';
import { collection, addDoc } from "firebase/firestore";
// On importe la connexion Firebase que tu as déjà configurée !
import { db } from './services/firebase'; 

// LES 50 ALIMENTS
const FOOD_DATABASE = [
  { name: "Blanc de Poulet (cru)", cals: 110, prot: 23, carbs: 0, fat: 1.5, verified: true },
  { name: "Riz Basmati (cru)", cals: 350, prot: 8, carbs: 77, fat: 1, verified: true },
  { name: "Flocons d'avoine", cals: 370, prot: 13, carbs: 60, fat: 7, verified: true },
  { name: "Oeuf entier", cals: 145, prot: 12, carbs: 1, fat: 10, verified: true },
  { name: "Pâtes (crues)", cals: 350, prot: 12, carbs: 72, fat: 1.5, verified: true },
  { name: "Whey Protein (Isolate)", cals: 360, prot: 85, carbs: 3, fat: 1, verified: true },
  { name: "Saumon (frais)", cals: 200, prot: 20, carbs: 0, fat: 13, verified: true },
  { name: "Bœuf haché 5%", cals: 125, prot: 21, carbs: 0, fat: 5, verified: true },
  { name: "Lentilles corail (crues)", cals: 360, prot: 25, carbs: 55, fat: 2, verified: true },
  { name: "Amandes", cals: 600, prot: 21, carbs: 9, fat: 50, verified: true },
  { name: "Avocat", cals: 160, prot: 2, carbs: 9, fat: 15, verified: true },
  { name: "Banane", cals: 89, prot: 1, carbs: 23, fat: 0.3, verified: true },
  { name: "Pomme", cals: 52, prot: 0.3, carbs: 14, fat: 0.2, verified: true },
  { name: "Beurre de cacahuète", cals: 590, prot: 25, carbs: 16, fat: 50, verified: true },
  { name: "Skyr 0%", cals: 57, prot: 10, carbs: 4, fat: 0, verified: true },
  { name: "Thon en boîte (eau)", cals: 110, prot: 25, carbs: 0, fat: 1, verified: true },
  { name: "Patate douce (crue)", cals: 86, prot: 1.6, carbs: 20, fat: 0.1, verified: true },
  { name: "Pomme de terre (crue)", cals: 77, prot: 2, carbs: 17, fat: 0.1, verified: true },
  { name: "Quinoa (cru)", cals: 370, prot: 14, carbs: 64, fat: 6, verified: true },
  { name: "Pois chiches (en boîte)", cals: 140, prot: 7, carbs: 20, fat: 2.5, verified: true },
  { name: "Haricots rouges (boîte)", cals: 110, prot: 8, carbs: 15, fat: 0.5, verified: true },
  { name: "Tofu ferme", cals: 144, prot: 15, carbs: 3, fat: 8, verified: true },
  { name: "Lait demi-écrémé", cals: 47, prot: 3.3, carbs: 4.8, fat: 1.5, verified: true },
  { name: "Lait d'amande (sans sucre)", cals: 15, prot: 0.5, carbs: 0.3, fat: 1.1, verified: true },
  { name: "Huile d'olive", cals: 884, prot: 0, carbs: 0, fat: 100, verified: true },
  { name: "Noix de cajou", cals: 553, prot: 18, carbs: 30, fat: 44, verified: true },
  { name: "Noix", cals: 654, prot: 15, carbs: 14, fat: 65, verified: true },
  { name: "Pain complet", cals: 250, prot: 10, carbs: 40, fat: 3, verified: true },
  { name: "Galette de riz", cals: 380, prot: 8, carbs: 80, fat: 3, verified: true },
  { name: "Blanc de Dinde", cals: 105, prot: 24, carbs: 0, fat: 1, verified: true },
  { name: "Bœuf (Steak 15%)", cals: 215, prot: 19, carbs: 0, fat: 15, verified: true },
  { name: "Maquereau", cals: 260, prot: 19, carbs: 0, fat: 20, verified: true },
  { name: "Sardines (huile)", cals: 210, prot: 24, carbs: 0, fat: 12, verified: true },
  { name: "Crevettes (cuites)", cals: 100, prot: 24, carbs: 0, fat: 0.3, verified: true },
  { name: "Yaourt nature", cals: 60, prot: 4, carbs: 5, fat: 3, verified: true },
  { name: "Mozzarella", cals: 280, prot: 28, carbs: 2, fat: 17, verified: true },
  { name: "Emmental", cals: 370, prot: 28, carbs: 0, fat: 29, verified: true },
  { name: "Riz complet (cru)", cals: 360, prot: 8, carbs: 74, fat: 3, verified: true },
  { name: "Semoule (crue)", cals: 360, prot: 12, carbs: 73, fat: 1.5, verified: true },
  { name: "Miel", cals: 304, prot: 0.3, carbs: 82, fat: 0, verified: true },
  { name: "Chocolat noir 70%", cals: 600, prot: 8, carbs: 35, fat: 42, verified: true },
  { name: "Framboises", cals: 52, prot: 1.2, carbs: 12, fat: 0.6, verified: true },
  { name: "Myrtilles", cals: 57, prot: 0.7, carbs: 14, fat: 0.3, verified: true },
  { name: "Brocoli", cals: 34, prot: 2.8, carbs: 7, fat: 0.4, verified: true },
  { name: "Haricots verts", cals: 31, prot: 1.8, carbs: 7, fat: 0.2, verified: true },
  { name: "Épinards", cals: 23, prot: 2.9, carbs: 3.6, fat: 0.4, verified: true },
  { name: "Courgette", cals: 17, prot: 1.2, carbs: 3.1, fat: 0.3, verified: true },
  { name: "Tomate", cals: 18, prot: 0.9, carbs: 3.9, fat: 0.2, verified: true },
  { name: "Carotte", cals: 41, prot: 0.9, carbs: 10, fat: 0.2, verified: true },
  { name: "Concombre", cals: 15, prot: 0.6, carbs: 3.6, fat: 0.1, verified: true }
];

export default function Seed() {
  const [progress, setProgress] = useState(0);
  const [isInjecting, setIsInjecting] = useState(false);

  const handleInject = async () => {
    setIsInjecting(true);
    let count = 0;
    const foodsCollection = collection(db, 'foods');

    for (const food of FOOD_DATABASE) {
      try {
        await addDoc(foodsCollection, food);
        count++;
        setProgress(count);
      } catch (error) {
        console.error("Erreur sur l'aliment :", food.name, error);
      }
    }
    
    alert("Injection terminée ! Tes 50 aliments sont dans Firebase.");
    setIsInjecting(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-black uppercase mb-4 text-center">Cloud Database</h1>
      <p className="text-zinc-400 mb-8 text-center text-sm">Ce script va envoyer 50 aliments directement dans ta base Firestore.</p>
      
      <button 
        onClick={handleInject} 
        disabled={isInjecting}
        className="w-full max-w-sm py-5 bg-blue-600 rounded-2xl font-black uppercase tracking-widest text-lg shadow-[0_0_30px_rgba(10,132,255,0.4)] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none transition-all"
      >
        {isInjecting ? `Injection... (${progress}/50)` : "INJECTER VERS FIREBASE"}
      </button>

      {progress === 50 && (
        <p className="mt-8 text-emerald-500 font-bold uppercase tracking-widest text-center">
          ✅ Succès ! Tu peux retourner sur l'application.
        </p>
      )}
    </div>
  );
}