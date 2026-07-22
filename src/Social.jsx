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
  const personalBests = useMemo(() => {
    const prs = user.data.profile?.prs || {};
    return catalog
      .map(exo => ({ ...exo, max: prs[exo.id] || 0 }))
      .filter(e => e.max > 0)
      .sort((a, b) => b.max - a.max);
  }, [user, catalog]);

  const badges = useMemo(() => {
    const b = [];
    if (personalBests.some(p => p.max >= 100)) b.push({ icon: <Dumbbell size={14}/>, label: "Club 100", color: "text-[#D4FC47]", bg: "bg-[#D4FC47]/10" });
    if (personalBests.length >= 5) b.push({ icon: <Star size={14}/>, label: "Polyvalent", color: "text-[#D4FC47]", bg: "bg-[#D4FC47]/10" });
    return b;
  }, [personalBests]);

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[150] bg-[#0B0E0B] flex flex-col text-white">
      <div className="p-6 flex items-center gap-4 border-b border-zinc-800 bg-[#0B0E0B]/80 backdrop-blur-xl">
        <button onClick={onBack} className="p-3 bg-[#141814] hover:bg-[#1C221C] rounded-2xl text-zinc-300 transition-all"><ArrowLeft size={18}/></button>
        <h2 className="text-lg font-black uppercase tracking-tighter italic text-white">Profil Athlète</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-[#D4FC47] to-emerald-700 rounded-full mx-auto mb-4 p-1 shadow-[0_0_20px_rgba(212,252,71,0.2)]">
            <div className="w-full h-full bg-[#0B0E0B] rounded-full flex items-center justify-center">
              <User size={40} className="text-zinc-400" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white uppercase italic">{user.pseudo}</h3>
          <p className="text-[10px] font-bold text-zinc-500 tracking-widest mt-1">ATHLÈTE MĘCANIK</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#141814] p-5 rounded-[24px] border border-zinc-800 text-center col-span-2 shadow-lg">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Exercices Maîtrisés</p>
            <p className="text-3xl font-black text-[#D4FC47]">{personalBests.length}</p>
          </div>
        </div>

        {badges.length > 0 && (
          <div>
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4 flex items-center gap-2">
              <Star size={14} className="text-[#D4FC47]"/> Distinctions
            </h4>
            <div className="flex flex-wrap gap-3">
              {badges.map((b, i) => (
                <div key={i} className={`${b.bg} ${b.color} px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-[#D4FC47]/20`}>
                  {b.icon}
                  <span className="text-[10px] font-black uppercase tracking-tight">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4 flex items-center gap-2">
            <Trophy size={14} className="text-[#D4FC47]"/> Records Personnels
          </h4>
          <div className="space-y-3">
            {personalBests.length === 0 && <p className="text-xs text-zinc-500 italic">Aucun record public.</p>}
            {personalBests.map((pb, i) => (
              <div key={i} className="bg-[#141814] p-4 rounded-2xl border border-zinc-800 flex justify-between items-center shadow-md">
                <span className="text-xs font-bold text-zinc-200">{pb.name}</span>
                <span className="font-black text-white">{pb.max} <span className="text-[#D4FC47] text-[10px]">KG</span></span>
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
      const customSnap = await getDocs(collection(db, "custom_exercises"));
      const customExos = customSnap.docs.map(d => ({ id: d.id, name: d.data().name }));
      const merged = [...BASE_CATALOGUE, ...customExos];
      const uniqueCatalog = Array.from(new Map(merged.map(item => [item.id, item])).values());
      setFullCatalog(uniqueCatalog);

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

  useEffect(() => { 
      fetchData(); 
  }, [db, currentUser, selectedExoId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-[#0B0E0B] text-white relative overflow-hidden bg-muscular-watermark">
      
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
            <div className="bg-[#141814] w-full max-w-sm rounded-[32px] p-8 border border-zinc-800 text-center shadow-2xl">
              <User size={40} className="text-[#D4FC47] mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2 text-white italic uppercase tracking-tight">Choisir un Pseudo</h2>
              <input
                 type="text" value={pseudoInput} onChange={e => setPseudoInput(e.target.value)}
                 className="w-full bg-[#0B0E0B] border border-zinc-800 rounded-2xl p-4 text-white font-bold uppercase text-center mb-6 outline-none focus:border-[#D4FC47]"
                 maxLength={15}
                 placeholder="Votre pseudo"
              />
              <button onClick={async () => {
                setIsSavingPseudo(true);
                await setDoc(doc(db, "users", currentUser.uid), { profile: { pseudo: pseudoInput } }, { merge: true });
                setNeedsPseudo(false); 
                fetchData();
              }} className="w-full py-4 bg-[#D4FC47] text-black rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-md">
                {isSavingPseudo ? "Enregistrement..." : "C'est parti"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER AÉRÉ ET FLOTTANT */}
      <header className="px-5 pt-10 pb-4 bg-[#0B0E0B]/90 backdrop-blur-xl z-40 border-b border-zinc-900/60 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-3 bg-[#141814] hover:bg-[#1C221C] rounded-2xl text-zinc-300 transition-all"><ChevronLeft size={18}/></button>
          <h1 className="text-lg font-black uppercase flex items-center gap-2 italic tracking-tight"><Trophy size={18} className="text-[#D4FC47]"/> Ligue</h1>
          <div className="w-10"></div>
        </div>

        {/* Menu déroulant aéré avec des marges nettes (mx-1) */}
        <div className="bg-[#141814] border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3 shadow-lg mx-1">
           <Dumbbell size={18} className="text-[#D4FC47]" />
           <select value={selectedExoId} onChange={e => setSelectedExoId(e.target.value)} className="bg-transparent text-white font-bold text-sm w-full outline-none cursor-pointer">
              {fullCatalog.map(exo => <option key={exo.id} value={exo.id} className="bg-[#141814] text-white">{exo.name}</option>)}
           </select>
        </div>
      </header>

      {/* CONTENU PRINCIPAL AVEC PADDING-BOTTOM CONSÉQUENT POUR ÉVITER LE MASQUAGE PAR LE DOCK */}
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-48 space-y-3">
        {loading ? (
            <div className="flex justify-center py-20"><Activity size={28} className="text-[#D4FC47] animate-pulse" /></div>
        ) : (
            leaderboard.length === 0 ? (
                /* ÉTAT VIDE (EMPTY STATE) ARTISTIQUE ET IMMERSIF */
                <div className="flex flex-col items-center justify-center py-20 text-center px-6 relative overflow-hidden bg-[#141814] rounded-[36px] border border-zinc-800/80 shadow-2xl mt-4">
                    {/* Graphique de fond en fausses données estompées */}
                    <div className="absolute inset-0 opacity-10 flex items-end justify-around px-6 pb-4 pointer-events-none select-none">
                        <div className="w-8 h-24 bg-[#D4FC47] rounded-t-xl" />
                        <div className="w-8 h-40 bg-[#D4FC47] rounded-t-xl" />
                        <div className="w-8 h-32 bg-[#D4FC47] rounded-t-xl" />
                        <div className="w-8 h-52 bg-[#D4FC47] rounded-t-xl" />
                        <div className="w-8 h-48 bg-[#D4FC47] rounded-t-xl" />
                    </div>

                    <div className="w-16 h-16 bg-[#D4FC47]/10 rounded-2xl flex items-center justify-center text-[#D4FC47] border border-[#D4FC47]/30 mb-4 shadow-[0_0_25px_rgba(212,252,71,0.2)] relative z-10">
                        <Trophy size={32} />
                    </div>
                    <h3 className="text-base font-black uppercase tracking-tight text-white mb-1 relative z-10 italic">Aucun record enregistré</h3>
                    <p className="text-xs text-zinc-400 max-w-xs leading-relaxed relative z-10 font-medium">
                        Enregistre tes premières charges sur cet exercice pour débloquer ton classement dans la ligue MĘCANIK.
                    </p>
                </div>
            ) : (
                leaderboard.map((user, index) => {
                    const isMe = user.id === currentUser?.uid;
                    let badge = index === 0 ? <Crown size={18} className="text-[#D4FC47]" /> : index === 1 ? <Medal size={18} className="text-zinc-400" /> : index === 2 ? <Medal size={18} className="text-amber-600" /> : <span className="font-bold text-zinc-500 w-5 text-center text-xs">{index + 1}</span>;

                    return (
                        <motion.div 
                            key={user.id} 
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedUser(user)}
                            className={`p-4 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all shadow-md ${isMe ? 'bg-[#D4FC47]/10 border-[#D4FC47]/40' : 'bg-[#141814] border-zinc-800/80 hover:bg-[#1C221C]'}`}
                        >
                            <div className="w-8 flex justify-center shrink-0">{badge}</div>
                            <div className="flex-1">
                                <p className={`font-black text-sm truncate uppercase italic ${isMe ? 'text-[#D4FC47]' : 'text-white'}`}>{user.pseudo}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-black text-white">{user.maxWeight}</span>
                                <span className="text-[10px] text-[#D4FC47] ml-1 font-black uppercase">KG</span>
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