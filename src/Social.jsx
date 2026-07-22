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
    if (personalBests.some(p => p.max >= 100)) b.push({ icon: <Dumbbell size={14}/>, label: "Club 100", color: "text-[#ADFF2F]", bg: "bg-[#ADFF2F]/10" });
    if (personalBests.length >= 5) b.push({ icon: <Star size={14}/>, label: "Polyvalent", color: "text-[#ADFF2F]", bg: "bg-[#ADFF2F]/10" });
    return b;
  }, [personalBests]);

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[150] bg-adaptive flex flex-col text-white">
      
      {/* Header Profil */}
      <div className="p-6 pt-12 flex items-center gap-5 z-10">
        <button onClick={onBack} className="p-3 glass-panel bubble-pill text-zinc-300 hover:text-white transition-all active:scale-95"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white drop-shadow-md">Profil Athlète</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32 space-y-8">
        
        {/* Avatar & Pseudo */}
        <div className="text-center">
          <div className="w-28 h-28 bg-gradient-to-tr from-[#ADFF2F] to-emerald-900 rounded-full mx-auto mb-5 p-1 shadow-[0_0_30px_rgba(173,255,47,0.2)]">
            <div className="w-full h-full bg-[#070908] rounded-full flex items-center justify-center">
              <User size={48} className="text-[#ADFF2F]/70" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">{user.pseudo}</h3>
          <p className="text-[10px] font-black text-[#ADFF2F] tracking-[0.3em] mt-2">ATHLÈTE MĘCANIK</p>
        </div>

        {/* Stats */}
        <div className="glass-panel p-6 bubble-1 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#ADFF2F]/5 blur-3xl rounded-full pointer-events-none" />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Exercices Maîtrisés</p>
          <p className="text-5xl font-black text-[#ADFF2F] drop-shadow-lg">{personalBests.length}</p>
        </div>

        {/* Distinctions */}
        {badges.length > 0 && (
          <div>
            <h4 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-4 flex items-center gap-2">
              <Star size={14} className="text-[#ADFF2F]"/> Distinctions
            </h4>
            <div className="flex flex-wrap gap-3">
              {badges.map((b, i) => (
                <div key={i} className={`glass-panel px-4 py-2.5 bubble-pill flex items-center gap-2 border border-[#ADFF2F]/20`}>
                  {React.cloneElement(b.icon, { className: "text-[#ADFF2F]" })}
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Records */}
        <div>
          <h4 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-4 flex items-center gap-2">
            <Trophy size={14} className="text-[#ADFF2F]"/> Records Personnels
          </h4>
          <div className="space-y-4">
            {personalBests.length === 0 && <p className="text-sm text-zinc-500 italic font-medium">Aucun record public.</p>}
            {personalBests.map((pb, i) => (
              <div key={i} className="glass-panel p-5 bubble-2 flex justify-between items-center shadow-lg hover:bg-[#141A16] transition-colors">
                <span className="text-sm font-bold text-zinc-200">{pb.name}</span>
                <span className="text-2xl font-black text-white">{pb.max} <span className="text-[#ADFF2F] text-xs uppercase tracking-widest">kg</span></span>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-adaptive text-white relative overflow-hidden">
      
      <AnimatePresence>
        {selectedUser && (
          <UserProfileView 
            user={selectedUser} 
            catalog={fullCatalog} 
            onBack={() => setSelectedUser(null)} 
          />
        )}
      </AnimatePresence>

      {/* Modal Pseudo en Glassmorphism */}
      <AnimatePresence>
        {needsPseudo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <div className="glass-panel w-full max-w-sm bubble-1 p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#ADFF2F]/10 blur-[40px] rounded-full pointer-events-none" />
              <User size={48} className="text-[#ADFF2F] mx-auto mb-6 glow-accent" />
              <h2 className="text-3xl font-black mb-3 text-white italic uppercase tracking-tighter">Ton Pseudo</h2>
              <p className="text-xs text-zinc-400 font-medium mb-8">Choisis ton nom d'athlète pour apparaître dans la ligue MĘCANIK.</p>
              
              <input
                 type="text" value={pseudoInput} onChange={e => setPseudoInput(e.target.value)}
                 className="w-full bg-[#070908]/80 border border-zinc-700 bubble-pill p-5 text-white font-black uppercase tracking-widest text-center mb-6 outline-none focus:border-[#ADFF2F] transition-colors shadow-inner"
                 maxLength={15}
                 placeholder="EX: RONNIE"
              />
              <button onClick={async () => {
                setIsSavingPseudo(true);
                await setDoc(doc(db, "users", currentUser.uid), { profile: { pseudo: pseudoInput } }, { merge: true });
                setNeedsPseudo(false); 
                fetchData();
              }} className="w-full py-5 bg-[#ADFF2F] text-black bubble-pill font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-transform glow-accent">
                {isSavingPseudo ? "Validation..." : "Entrer dans l'arène"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER AÉRÉ */}
      <header className="px-6 pt-12 pb-4 z-40 flex-shrink-0">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="p-3 glass-panel bubble-pill text-zinc-300 hover:text-white transition-all active:scale-95"><ChevronLeft size={20}/></button>
          <h1 className="text-2xl font-black uppercase flex items-center gap-3 italic tracking-tighter drop-shadow-md">
            <Trophy size={24} className="text-[#ADFF2F] glow-accent"/> Ligue
          </h1>
          <div className="w-12"></div>
        </div>

        {/* Menu déroulant organique */}
        <div className="glass-panel bubble-pill p-2 flex items-center gap-3 shadow-lg relative">
           <div className="w-10 h-10 bg-[#ADFF2F] bubble-pill flex items-center justify-center shrink-0">
             <Dumbbell size={20} className="text-black" />
           </div>
           <select value={selectedExoId} onChange={e => setSelectedExoId(e.target.value)} className="bg-transparent text-white font-black uppercase tracking-tight text-sm w-full outline-none cursor-pointer pr-4 appearance-none">
              {fullCatalog.map(exo => <option key={exo.id} value={exo.id} className="bg-[#070908] text-white uppercase">{exo.name}</option>)}
           </select>
           <ChevronRight size={18} className="text-zinc-500 absolute right-4 pointer-events-none" />
        </div>
      </header>

      {/* PADDING BOTTOM POUR L'ÎLE FLOTTANTE */}
      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-[160px] space-y-4 relative">
        {loading ? (
            <div className="flex justify-center py-24"><Activity size={36} className="text-[#ADFF2F] animate-pulse" /></div>
        ) : (
            leaderboard.length === 0 ? (
                /* ÉTAT VIDE ARTISTIQUE (Organic Empty State) */
                <div className="flex flex-col items-center justify-center py-24 text-center relative mt-4">
                    {/* Graphique de fond en fausses données estompées/morphes */}
                    <div className="absolute inset-0 flex items-end justify-center gap-4 px-6 pb-4 opacity-10 pointer-events-none select-none">
                        <div className="w-12 h-32 bg-white bubble-1" />
                        <div className="w-12 h-56 bg-white bubble-2" />
                        <div className="w-12 h-40 bg-white bubble-1" />
                        <div className="w-12 h-72 bg-[#ADFF2F] bubble-3 glow-accent" />
                    </div>

                    <div className="w-24 h-24 glass-panel bubble-pill flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(173,255,47,0.15)] relative z-10">
                        <Trophy size={48} className="text-[#ADFF2F] glow-accent" />
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-2 relative z-10 italic drop-shadow-md">Arène Vide</h3>
                    <p className="text-sm text-zinc-400 font-medium max-w-[260px] leading-relaxed relative z-10">
                        La compétition commence avec toi. Enregistre une charge sur cet exercice pour écrire l'histoire.
                    </p>
                </div>
            ) : (
                leaderboard.map((user, index) => {
                    const isMe = user.id === currentUser?.uid;
                    let badge = index === 0 ? <Crown size={20} className="text-[#ADFF2F]" /> : index === 1 ? <Medal size={20} className="text-zinc-300" /> : index === 2 ? <Medal size={20} className="text-amber-600" /> : <span className="font-black text-zinc-500 w-5 text-center text-sm">{index + 1}</span>;

                    return (
                        <motion.div 
                            key={user.id} 
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setSelectedUser(user)}
                            className={`p-5 glass-panel bubble-3 flex items-center gap-5 cursor-pointer transition-all shadow-lg overflow-hidden relative ${isMe ? 'border border-[#ADFF2F]/40 bg-[#ADFF2F]/5 glow-accent' : 'hover:bg-[#141A16]'}`}
                        >
                            {/* Halo subtil si c'est l'utilisateur courant */}
                            {isMe && <div className="absolute top-0 left-0 w-16 h-16 bg-[#ADFF2F]/20 blur-2xl rounded-full" />}
                            
                            <div className="w-10 h-10 bg-[#070908]/80 bubble-pill flex items-center justify-center shrink-0 border border-white/5 relative z-10">{badge}</div>
                            <div className="flex-1 relative z-10">
                                <p className={`font-black text-base truncate uppercase italic tracking-tight ${isMe ? 'text-[#ADFF2F]' : 'text-white'}`}>{user.pseudo}</p>
                            </div>
                            <div className="text-right relative z-10">
                                <span className="text-3xl font-black text-white">{user.maxWeight}</span>
                                <span className="text-[10px] text-[#ADFF2F] ml-1 font-black uppercase tracking-widest">KG</span>
                            </div>
                        </motion.div>
                    );
                })
            )
        )}
      </main>
    </motion.div>
  );
}