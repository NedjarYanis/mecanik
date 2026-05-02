import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Trophy, Medal, Crown, User, 
  Dumbbell, Star, ChevronRight, ArrowLeft, Activity
} from 'lucide-react';
import { collection, getDocs, getDoc, doc, setDoc, query, limit, orderBy } from "firebase/firestore";

const BASE_CATALOGUE = [
  { id: '2A', name: "Développé Couché (Smith)" },
  { id: '1A', name: "Presse à Cuisses" },
  { id: '1B', name: "Hack Squat" },
  { id: '2B', name: "Chest Press" },
  { id: '4A', name: "Tirage Vertical" },
  { id: '4B', name: "Tirage Horizontal" },
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

// ==========================================
// COMPOSANT : PROFIL DÉTAILLÉ
// ==========================================
function UserProfileView({ user, catalog, onBack }) {
  // Calcul des Records (PBs) basés sur la nouvelle architecture
  const personalBests = useMemo(() => {
    const prs = user.data.profile?.prs || {};
    return catalog
      .map(exo => ({ ...exo, max: prs[exo.id] || 0 }))
      .filter(e => e.max > 0)
      .sort((a, b) => b.max - a.max);
  }, [user, catalog]);

  // Badges simplifiés (puisqu'on ne télécharge plus le journal des autres utilisateurs)
  const badges = useMemo(() => {
    const b = [];
    if (personalBests.some(p => p.max >= 100)) b.push({ icon: <Dumbbell size={14}/>, label: "Club 100", color: "text-yellow-500", bg: "bg-yellow-500/10" });
    if (personalBests.length >= 5) b.push({ icon: <Star size={14}/>, label: "Polyvalent", color: "text-purple-500", bg: "bg-purple-500/10" });
    return b;
  }, [personalBests]);

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[150] bg-black flex flex-col">
      <div className="p-6 flex items-center gap-4 border-b border-zinc-900 bg-black/50 backdrop-blur-xl">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-lg font-black uppercase tracking-tighter">Profil Athlète</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-full mx-auto mb-4 p-1">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <User size={40} className="text-zinc-400" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white uppercase">{user.pseudo}</h3>
          <p className="text-[10px] font-bold text-zinc-500 tracking-widest mt-1">ATHLÈTE MÉCANIK</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#121214] p-4 rounded-2xl border border-zinc-800 text-center col-span-2">
            <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Exercices Maîtrisés</p>
            <p className="text-3xl font-black text-blue-500">{personalBests.length}</p>
          </div>
        </div>

        {badges.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase text-zinc-500 tracking-widest mb-4 flex items-center gap-2">
              <Star size={14} className="text-yellow-500"/> Distinctions
            </h4>
            <div className="flex flex-wrap gap-3">
              {badges.map((b, i) => (
                <div key={i} className={`${b.bg} ${b.color} px-3 py-2 rounded-xl flex items-center gap-2 border border-current/10`}>
                  {b.icon}
                  <span className="text-[10px] font-black uppercase tracking-tight">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-black uppercase text-zinc-500 tracking-widest mb-4 flex items-center gap-2">
            <Trophy size={14} className="text-blue-500"/> Records Personnels
          </h4>
          <div className="space-y-3">
            {personalBests.length === 0 && <p className="text-xs text-zinc-600">Aucun record public.</p>}
            {personalBests.map((pb, i) => (
              <div key={i} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-300">{pb.name}</span>
                <span className="font-black text-white">{pb.max} <span className="text-zinc-500 text-[10px]">KG</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Social({ onBack, currentUser, db }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullCatalog, setFullCatalog] = useState(BASE_CATALOGUE);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [needsPseudo, setNeedsPseudo] = useState(false);
  const [pseudoInput, setPseudoInput] = useState('');
  const [isSavingPseudo, setIsSavingPseudo] = useState(false);
  
  const [selectedExoId, setSelectedExoId] = useState('2A');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Charger le catalogue personnalisé
      const customSnap = await getDocs(collection(db, "custom_exercises"));
      const customExos = customSnap.docs.map(d => ({ id: d.id, name: d.data().name }));
      const merged = [...BASE_CATALOGUE, ...customExos];
      const uniqueCatalog = Array.from(new Map(merged.map(item => [item.id, item])).values());
      setFullCatalog(uniqueCatalog);

      // 2. 🟢 REQUÊTE FIREBASE OPTIMISÉE (Trie sur le serveur, limite à 10)
      const usersQuery = query(
        collection(db, "users"),
        orderBy(`profile.prs.${selectedExoId}`, "desc"),
        limit(10)
      );
      const usersSnap = await getDocs(usersQuery);
      
      const ranking = [];
      let currentUserInTop = false;

      usersSnap.forEach(docSnap => {
        const d = docSnap.data();
        if (docSnap.id === currentUser?.uid) currentUserInTop = true;
        
        ranking.push({
          id: docSnap.id,
          pseudo: d.profile?.pseudo || "Athlète",
          maxWeight: d.profile.prs[selectedExoId],
          data: d
        });
      });

      // 3. Vérifier si l'utilisateur actuel a besoin d'un pseudo (s'il n'était pas dans le top 10)
      if (!currentUserInTop && currentUser?.uid) {
        const myDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (myDoc.exists() && !myDoc.data().profile?.pseudo) {
          setNeedsPseudo(true);
        }
      }

      setLeaderboard(ranking);
    } catch (error) { 
        console.error("Erreur classement:", error); 
    }
    setLoading(false);
  };

  // On relance la requête optimisée à chaque fois qu'on change d'exercice !
  useEffect(() => { 
      fetchData(); 
  }, [db, currentUser, selectedExoId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      
      <AnimatePresence>
        {selectedUser && (
          <UserProfileView 
            user={selectedUser} 
            catalog={fullCatalog} 
            onBack={() => setSelectedUser(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {needsPseudo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
            <div className="bg-[#121214] w-full max-w-sm rounded-[24px] p-8 border border-blue-500/30 text-center">
              <User size={40} className="text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Choisir un Pseudo</h2>
              <input
                 type="text" value={pseudoInput} onChange={e => setPseudoInput(e.target.value)}
                 className="w-full bg-black border border-zinc-800 rounded-xl p-3.5 text-white font-bold uppercase text-center mb-6 outline-none"
                 maxLength={15}
              />
              <button onClick={async () => {
                setIsSavingPseudo(true);
                await setDoc(doc(db, "users", currentUser.uid), { profile: { pseudo: pseudoInput } }, { merge: true });
                setNeedsPseudo(false); 
                fetchData();
              }} className="w-full py-3.5 bg-blue-600 rounded-xl font-bold text-sm">
                {isSavingPseudo ? "Enregistrement..." : "C'est parti"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-zinc-400"><ChevronLeft size={18}/></button>
          <h1 className="text-lg font-bold uppercase flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> Ligue</h1>
          <div className="w-10"></div>
        </div>
        <div className="bg-[#121214] border border-zinc-800 p-3 rounded-2xl flex items-center gap-3">
           <Dumbbell size={18} className="text-blue-500" />
           <select value={selectedExoId} onChange={e => setSelectedExoId(e.target.value)} className="bg-transparent text-white font-bold text-sm w-full outline-none">
              {fullCatalog.map(exo => <option key={exo.id} value={exo.id}>{exo.name}</option>)}
           </select>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-3">
        {loading ? (
            <div className="flex justify-center py-10"><Activity size={24} className="text-blue-500 animate-pulse" /></div>
        ) : (
            leaderboard.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm font-bold">Aucun record enregistré pour cet exercice.</div>
            ) : (
                leaderboard.map((user, index) => {
                    const isMe = user.id === currentUser?.uid;
                    let badge = index === 0 ? <Crown size={18} className="text-yellow-500" /> : index === 1 ? <Medal size={18} className="text-gray-400" /> : index === 2 ? <Medal size={18} className="text-amber-600" /> : <span className="font-bold text-zinc-500 w-5 text-center text-xs">{index + 1}</span>;

                    return (
                        <motion.div 
                            key={user.id} 
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedUser(user)}
                            className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-colors ${isMe ? 'bg-blue-600/10 border-blue-500/30' : 'bg-[#121214] border-zinc-800'}`}
                        >
                            <div className="w-8 flex justify-center shrink-0">{badge}</div>
                            <div className="flex-1">
                                <p className={`font-bold text-sm truncate ${isMe ? 'text-blue-400' : 'text-white'}`}>{user.pseudo}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-black text-white">{user.maxWeight}</span>
                                <span className="text-[10px] text-zinc-500 ml-1 font-bold uppercase">KG</span>
                            </div>
                            <ChevronRight size={14} className="text-zinc-600" />
                        </motion.div>
                    );
                })
            )
        )}
      </main>
    </motion.div>
  );
}