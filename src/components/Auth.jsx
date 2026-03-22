import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Dumbbell, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) await login(email, password);
      else await signup(email, password);
    } catch (err) {
      setError("Erreur d'authentification. Vérifiez vos identifiants.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-[#151517] p-8 rounded-[32px] border border-zinc-800 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20">
            <Dumbbell size={32} className="text-blue-500" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-center uppercase tracking-tighter mb-8">
          {isLogin ? 'Connexion' : 'Créer un compte'}
        </h2>
        
        {error && <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:border-blue-500 font-bold" required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:border-blue-500 font-bold" required />
          
          <button type="submit" className="w-full py-4 bg-blue-600 rounded-full font-black uppercase text-xs shadow-[0_0_20px_rgba(10,132,255,0.4)] flex justify-center items-center gap-2">
            {isLogin ? 'Entrer' : 'Rejoindre'} <ArrowRight size={16} />
          </button>
        </form>
        
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-[10px] text-zinc-500 uppercase font-bold tracking-widest hover:text-white transition-colors">
          {isLogin ? "Je n'ai pas de compte" : "J'ai déjà un compte"}
        </button>
      </motion.div>
    </div>
  );
}