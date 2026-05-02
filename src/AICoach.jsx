import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, Sparkles, TrendingUp, TrendingDown, AlertCircle, 
  CheckCircle2, Apple, Droplet, ArrowLeft, Loader2, Target, Activity
} from 'lucide-react';

// Fonction locale pour calculer le besoin calorique de maintien (TDEE)
const getTDEE = (prof) => {
  if (!prof) return 2600;
  const w = Number(prof.weight) || 75;
  const h = Number(prof.height) || 175;
  const a = Number(prof.age) || 25;
  let bmr = (10 * w) + (6.25 * h) - (5 * a) + (prof.gender === 'M' ? 5 : -161);
  const multipliers = { 'Sédentaire': 1.2, 'Léger': 1.375, 'Modéré': 1.55, 'Intense': 1.725 };
  return bmr * (multipliers[prof.activityLevel || 'Modéré'] || 1.55);
};

export default function AICoach({ onBack, dataContext }) {
  const { journal, profile } = dataContext;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  // MOTEUR D'INFÉRENCE (Le "Cerveau" du coach)
  const runAnalysis = () => {
    setIsAnalyzing(true);
    
    // On simule un temps de calcul pour l'UX
    setTimeout(() => {
      const last7Days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (journal[dateStr]) last7Days.push(journal[dateStr]);
      }

      const daysLogged = last7Days.length;

      // 1. GESTION DE L'ABSENCE DE DONNÉES
      if (daysLogged === 0) {
        setAnalysis({
          status: 'error',
          score: 0,
          avgCals: 0,
          avgProt: 0,
          insights: [{
            type: 'error', 
            title: 'Données insuffisantes', 
            desc: "Tu n'as rien enregistré ces 7 derniers jours. Je ne peux pas analyser du vide, champion ! Commence par remplir ton journal.", 
            icon: <AlertCircle className="text-red-500" />,
            status: "warning"
          }]
        });
        setIsAnalyzing(false);
        return;
      }

      // 2. CALCUL DES MOYENNES RÉELLES
      const avgCals = last7Days.reduce((acc, day) => acc + Object.values(day.meals || {}).reduce((s, m) => s + (m.cals || 0), 0), 0) / daysLogged;
      const avgProt = last7Days.reduce((acc, day) => acc + Object.values(day.meals || {}).reduce((s, m) => s + (m.prot || 0), 0), 0) / daysLogged;
      const avgWater = last7Days.reduce((acc, day) => acc + (day.water || 0), 0) / daysLogged;
      const avgReadiness = last7Days.reduce((acc, day) => acc + (day.readiness || 10), 0) / daysLogged;

      // 3. CALCUL DES CIBLES MATHÉMATIQUES
      const tdee = getTDEE(profile);
      let targetCals = profile?.manualCalorieGoal;
      if (!targetCals) {
        const goal = profile?.goal || 'maintain';
        targetCals = goal === 'cut' ? tdee * 0.85 : goal === 'bulk' ? tdee * 1.10 : tdee;
      }
      const targetProt = Math.round((Number(profile?.weight) || 75) * 2.2);

      // 4. GÉNÉRATION DES INSIGHTS (CONSEILS)
      const insights = [];
      let finalScore = Math.round((daysLogged / 7) * 40); // 40 points pour la constance

      // Insight Constance
      if (daysLogged < 4) {
        insights.push({ title: "Manque de régularité", desc: `Tu n'as tracké que ${daysLogged} jours sur 7. La constance est la seule vraie variable de la réussite.`, icon: <Activity className="text-orange-500"/>, status: 'warning' });
      } else {
        insights.push({ title: "Assiduité Parfaite", desc: `Tu as été rigoureux sur tes entrées (${daysLogged}/7 jours). C'est excellent.`, icon: <CheckCircle2 className="text-emerald-500"/>, status: 'success' });
      }

      // Insight Calories
      const calDiff = avgCals - targetCals;
      if (Math.abs(calDiff) <= 150) {
        insights.push({ title: "Cible Calorique Millimétrée", desc: `Ta moyenne de ${Math.round(avgCals)} kcal est parfaite par rapport à ton objectif. Reste sur cette ligne.`, icon: <Target className="text-emerald-500"/>, status: 'success' });
        finalScore += 30;
      } else if (calDiff > 150) {
        insights.push({ title: "Surplus Détecté", desc: `Tu consommes environ ${Math.round(calDiff)} kcal de trop par rapport à ton plan. Attention à la prise de masse grasse inutile.`, icon: <TrendingUp className="text-red-500"/>, status: 'warning' });
        finalScore += 10;
      } else {
        insights.push({ title: "Déficit Marqué", desc: `Tu es en dessous de ta cible d'environ ${Math.round(Math.abs(calDiff))} kcal. Mange un peu plus pour ne pas crasher ton métabolisme.`, icon: <TrendingDown className="text-blue-500"/>, status: 'warning' });
        finalScore += 15;
      }

      // Insight Protéines
      if (avgProt >= targetProt * 0.9) {
        insights.push({ title: "Anabolisme Sécurisé", desc: `Avec ${Math.round(avgProt)}g de protéines par jour, tes fibres musculaires ont de quoi se reconstruire.`, icon: <CheckCircle2 className="text-emerald-500"/>, status: 'success' });
        finalScore += 30;
      } else {
        insights.push({ title: "Alerte Protéines", desc: `Il te manque des protéines (Moyenne: ${Math.round(avgProt)}g / Cible: ${targetProt}g). Tu risques le catabolisme musculaire.`, icon: <Apple className="text-orange-500"/>, status: 'warning' });
        finalScore += 5;
      }

      // Insight Récupération & Hydratation
      if (avgReadiness <= 5) {
        insights.push({ title: "Fatigue Nerveuse", desc: "Tes scores de forme sont bas. Un jour de repos complet ou une nuit plus longue est obligatoire.", icon: <AlertCircle className="text-red-500"/>, status: 'warning' });
      } else if (avgWater < 1500) {
        insights.push({ title: "Hydratation Critique", desc: `Tu ne bois que ${Math.round(avgWater)}ml en moyenne. Ton volume sanguin baisse, tes perfs aussi.`, icon: <Droplet className="text-blue-500"/>, status: 'warning' });
      }

      setAnalysis({
        avgCals: Math.round(avgCals),
        avgProt: Math.round(avgProt),
        insights,
        score: finalScore,
        status: finalScore > 75 ? 'success' : 'warning'
      });
      
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black text-white relative">
      
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl border-b border-zinc-900 flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full active:scale-90 transition-transform"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <BrainCircuit className="text-blue-500" /> AI Coach
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        
        {!analysis && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                <Sparkles size={40} className="text-blue-400 animate-pulse" />
            </div>
            <div>
                <h2 className="text-2xl font-black uppercase">Bilan Métabolique</h2>
                <p className="text-zinc-500 text-sm mt-2 px-6">L'algorithme va croiser tes données nutritionnelles et tes métriques de la semaine pour générer un rapport expert.</p>
            </div>
            <button 
              onClick={runAnalysis}
              className="px-8 py-4 bg-blue-600 rounded-full font-black uppercase text-xs shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 transition-transform"
            >
              Lancer l'Analyse
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
             <Loader2 size={48} className="text-blue-500 animate-spin" />
             <div className="text-center">
                <p className="text-blue-400 font-black uppercase text-xs tracking-widest animate-pulse">Analyse de la data...</p>
                <p className="text-zinc-600 text-[10px] mt-2 italic font-mono">Calcul des deltas caloriques...</p>
             </div>
          </div>
        )}

        {analysis && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
            
            {/* Header Score */}
            <div className="flex items-center justify-between bg-[#121214] p-5 rounded-3xl border border-zinc-800">
                <div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Score Global</span>
                    <span className={`text-3xl font-black ${analysis.score > 75 ? 'text-emerald-500' : analysis.score > 40 ? 'text-yellow-500' : 'text-red-500'}`}>{analysis.score}/100</span>
                </div>
                <div className="w-12 h-12 bg-black rounded-full border border-zinc-800 flex items-center justify-center">
                    <Activity size={20} className={analysis.score > 75 ? 'text-emerald-500' : 'text-zinc-500'} />
                </div>
            </div>

            {/* Résumé Chiffré */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#121214] p-5 rounded-3xl border border-zinc-800">
                  <span className="text-[10px] font-black text-zinc-500 uppercase block mb-1">Moyenne Cal.</span>
                  <p className="text-2xl font-black text-white">{analysis.avgCals} <span className="text-xs text-zinc-500">kcal</span></p>
               </div>
               <div className="bg-[#121214] p-5 rounded-3xl border border-zinc-800">
                  <span className="text-[10px] font-black text-zinc-500 uppercase block mb-1">Moyenne Prot.</span>
                  <p className="text-2xl font-black text-blue-500">{analysis.avgProt} <span className="text-xs text-zinc-500">g</span></p>
               </div>
            </div>

            {/* Liste des Insights */}
            <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest mt-8">Rapport de l'algorithme</h3>
            <div className="space-y-4">
              {analysis.insights.map((insight, i) => (
                <div key={i} className={`p-5 rounded-[24px] border ${insight.status === 'warning' ? 'bg-orange-500/5 border-orange-500/20' : insight.status === 'error' ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'} flex gap-4`}>
                   <div className="mt-1 shrink-0">{insight.icon}</div>
                   <div>
                      <h4 className="font-bold text-sm text-white mb-1">{insight.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{insight.desc}</p>
                   </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setAnalysis(null)}
              className="w-full py-4 text-zinc-500 font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-transform mt-4"
            >
              Refaire une analyse
            </button>
          </motion.div>
        )}

      </main>
    </motion.div>
  );
}