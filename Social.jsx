import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, Medal, Crown, Share2, Activity } from 'lucide-react';
import { collection, getDocs } from "firebase/firestore";

export default function Social({ onBack, currentUser, db }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = [];
        
        usersSnap.forEach(doc => {
          const data = doc.data();
          let xp = 0;
          if (data.history) {
            Object.values(data.history).forEach(exoLogs => {
              xp += (exoLogs.length * 50); // 50 XP par série
            });
          }
          if (data.profile?.weight) xp += 100;
          
          usersData.push({
            id: doc.id,
            email: doc.id === currentUser?.uid ? "Moi (Vous)" : "Athlète Anonyme",
            xp: xp
          });
        });
        
        usersData.sort((a, b) => b.xp - a.xp);
        setLeaderboard(usersData);
      } catch (error) {
        console.error("Erreur classement:", error);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [db, currentUser]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MÉCANIK App',
        text: 'Rejoins-moi sur MÉCANIK, l\'application IA de musculation !',
        url: window.location.href,
      });
    } else {
      alert("Partage copié dans le presse-papier !");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      <header className="px-5 pt-10 pb-4 bg-black/90 backdrop-blur-xl z-40 border-b border-zinc-900 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-2.5 bg-zinc-900 rounded-full text-zinc-400 active:scale-95"><ChevronLeft size={18}/></button>
          <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2"><Trophy size={20} className="text-yellow-500"/> Classement</h1>
          <button onClick={handleShare} className="p-2.5 bg-blue-600/10 text-blue-500 rounded-full border border-blue-500/20 active:scale-95"><Share2 size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-4">
        <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/20 p-6 rounded-[32px] border border-yellow-500/30 mb-8 text-center shadow-[0_0_30px_rgba(234,179,8,0.1)]">
            <Crown size={40} className="text-yellow-500 mx-auto mb-3" />
            <h2 className="text-2xl font-black uppercase tracking-tighter">Ligue Mécanik</h2>
            <p className="text-xs text-yellow-200 mt-2 font-medium">Gagnez de l'XP à chaque entraînement sauvegardé.</p>
        </div>

        {loading ? (
            <div className="flex justify-center py-10"><Activity size={32} className="text-blue-500 animate-pulse" /></div>
        ) : (
            <div className="space-y-3">
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
                                <p className={`font-bold text-sm ${isMe ? 'text-blue-400' : 'text-white'}`}>{user.email}</p>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">{user.xp} XP</p>
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