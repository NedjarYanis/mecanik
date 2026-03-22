import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trophy, Medal, Crown, Share2, Activity, User, Dumbbell } from 'lucide-react';
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

// On recrée le catalogue pour que le menu déroulant affiche les vrais noms
const CATALOGUE_EXERCICES = [
  { id: '2A', name: "Développé Couché (Smith)" },
  { id: '1A', name: "Presse à Cuisses" },
  { id: '1B', name: "Hack Squat" },
  { id: '2B', name: "Chest Press" },
  { id: '4A', name: "Tirage Vertical (Lat Pulldown)" },
  { id: '4B', name: "Tirage Horizontal (Seated Row)" },
  { id: '2C', name: "Shoulder Press" },
  { id: '1C', name: "Leg Extension" },
  { id: '1D', name: "Adducteurs" },
  { id: '1E', name: "Mollets" },
  { id: '2D', name: "Triceps Pushdown" },
  { id: '2E', name: "Élévations Latérales" },
  { id: '4C', name: "Pull-over poulie" },
  { id: '4D', name: "Curl Marteau" },
  { id: '4E', name: "Curl Biceps" }
];

export default function Social({ onBack, currentUser, db }) {
  const [allUsersData, setAllUsersData] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // ÉTATS POUR LE PSEUDO
  const [needsPseudo, setNeedsPseudo] = useState(false);
  const [pseudoInput, setPseudoInput] = useState('');
  const [isSavingPseudo, setIsSavingPseudo] = useState(false);

  // ÉTAT POUR L'EXERCICE SÉLECTIONNÉ
  const [selectedExoId, setSelectedExoId] = useState('2A'); // Par défaut : DC Smith Machine

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const users = [];
      let hasPseudo = false;

      usersSnap.forEach(docSnap => {
        const data = docSnap.data();
        // Vérifie si l'utilisateur actuel a déjà un pseudo enregistré
        if (docSnap.id === currentUser?.uid) {
          if (data.profile && data.profile.pseudo) {
            hasPseudo = true;
          }
        }
        users.push({ id: docSnap.id, data });
      });

      setAllUsersData(users);
      if (!hasPseudo) setNeedsPseudo(true);

    } catch (error) {
      console.error("Erreur classement:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [db, currentUser]);

  // RECALCUL DU CLASSEMENT À CHAQUE CHANGEMENT D'EXERCICE
  useEffect(() => {
    if (allUsersData.length === 0) return;

    const ranking = allUsersData.map(u => {
      const historyLogs = u.data.history?.[selectedExoId] || [];
      // Trouve le poids maximum enregistré pour cet exercice
      const maxWeight = historyLogs.reduce((max, log) => Math.max(max, Number(log.weight || 0)), 0);

      return {
        id: u.id,
        pseudo: u.data.profile?.pseudo || (u.id === currentUser?.uid ? "Moi (Sans pseudo)" : "Athlète Anonyme"),
        maxWeight
      };
    })
    .filter(u => u.maxWeight > 0) // On retire ceux qui n'ont jamais fait l'exercice
    .sort((a, b) => b.maxWeight - a.maxWeight);

    setLeaderboard(ranking);
  }, [allUsersData, selectedExoId, currentUser]);

  const savePseudo = async () => {
    if (!pseudoInput.trim()) return;
    setIsSavingPseudo(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      // On utilise { merge: true } pour ne pas écraser le reste du profil (poids, objectif...)
      await setDoc(userRef, { profile: { pseudo: pseudoInput.trim() } }, { merge: true });
      setNeedsPseudo(false);
      fetchData(); // On recharge les données pour afficher le nouveau pseudo
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la sauvegarde du pseudo.");
    }
    setIsSavingPseudo(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MÉCANIK App',
        text: 'Viens battre mon record sur MÉCANIK !',
        url: window.location.href,
      });
    } else {
      alert("Lien copié dans le presse-papier !");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      
      {/* POPUP DE CRÉATION DE PSEUDO */}
      <AnimatePresence>
        {needsPseudo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
            <div className="bg-[#151517] w-full max-w-sm rounded-[32px] p-8 border border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.2)] text-center relative overflow-hidden">
              <User size={48} className="text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-white">Créer un Pseudo</h2>
              <p className="text-xs text-zinc-400 font-medium mb-6 leading-relaxed">Pour apparaître dans le classement général des records, choisissez un nom d'athlète.</p>
              
              <input
                 type="text"
                 placeholder="Ex: Titan91, SarahFit..."
                 value={pseudoInput}
                 onChange={e => setPseudoInput(e.target.value)}
                 className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white font-black uppercase tracking-widest text-center mb-6 outline-none focus:border-blue-500"
                 maxLength={15}
              />
              
              <button onClick={savePseudo} disabled={isSavingPseudo || !pseudoInput.trim()} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 disabled:opacity-50 transition-all">
                {isSavingPseudo ? "Sauvegarde..." : "Rejoindre la Ligue"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95"><ChevronLeft size={18}/></button>
          <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2"><Trophy size={20} className="text-yellow-500"/> Classement</h1>
          <button onClick={handleShare} className="p-2.5 bg-blue-600/10 text-blue-500 rounded-full border border-blue-500/20 active:scale-95"><Share2 size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-4">
        
        {/* SÉLECTEUR D'EXERCICE */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg relative">
           <Dumbbell size={20} className="text-blue-500 shrink-0" />
           <select
              value={selectedExoId}
              onChange={e => setSelectedExoId(e.target.value)}
              className="bg-transparent text-white font-black uppercase tracking-tight w-full outline-none appearance-none cursor-pointer"
           >
              {CATALOGUE_EXERCICES.map(exo => (
                 <option key={exo.id} value={exo.id} className="bg-zinc-900 text-white font-bold">{exo.name}</option>
              ))}
           </select>
           <div className="absolute right-4 pointer-events-none text-zinc-500">▼</div>
        </div>

        {loading ? (
            <div className="flex justify-center py-10"><Activity size={32} className="text-blue-500 animate-pulse" /></div>
        ) : (
            <div className="space-y-3">
                {leaderboard.length === 0 && (
                    <div className="text-center py-10 bg-[#151517] rounded-[24px] border border-zinc-800 mt-4">
                        <p className="text-sm text-zinc-500 font-black uppercase tracking-widest">Aucune donnée.</p>
                        <p className="text-[10px] text-zinc-600 mt-2 font-bold uppercase">Soyez le premier à enregistrer un record !</p>
                    </div>
                )}

                {leaderboard.map((user, index) => {
                    const isMe = user.id === currentUser?.uid;
                    let badge = null;
                    let bgClass = "bg-[#151517] border-[#222225]";
                    
                    if (index === 0) { badge = <Crown size={20} className="text-yellow-500" />; bgClass = "bg-yellow-500/10 border-yellow-500/30"; }
                    else if (index === 1) { badge = <Medal size={20} className="text-gray-400" />; bgClass = "bg-gray-400/10 border-gray-400/30"; }
                    else if (index === 2) { badge = <Medal size={20} className="text-amber-600" />; bgClass = "bg-amber-600/10 border-amber-600/30"; }
                    else { badge = <span className="font-black text-zinc-500 w-5 text-center">{index + 1}</span>; }

                    if (isMe) bgClass = "bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]";

                    return (
                        <div key={user.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${bgClass}`}>
                            <div className="w-8 flex justify-center shrink-0">{badge}</div>
                            <div className="flex-1">
                                <p className={`font-bold text-sm ${isMe ? 'text-blue-400' : 'text-white'}`}>{user.pseudo}</p>
                                <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-widest">Max 1RM</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-black text-white">{user.maxWeight}</span>
                                <span className="text-[10px] text-zinc-500 ml-1 font-bold">KG</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </main>
    </motion.div>
  );
}