import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  
  // ==========================================
  // ÉTATS "CHAUDS" (Zéro Latence, via LocalStorage)
  // ==========================================
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('mecanik_profile')) || null);
  const [journal, setJournal] = useState(() => JSON.parse(localStorage.getItem('mecanik_journal')) || {});
  const [isSyncing, setIsSyncing] = useState(false);

  // Sauvegarde locale instantanée à chaque modification
  useEffect(() => { if (profile) localStorage.setItem('mecanik_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('mecanik_journal', JSON.stringify(journal)); }, [journal]);

  // ==========================================
  // CHARGEMENT "FROID" (Au démarrage si connecté)
  // ==========================================
  useEffect(() => {
    async function loadColdData() {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const cloudData = userDoc.data();
            // On écrase le local avec le cloud au démarrage
            if (cloudData.profile) setProfile(cloudData.profile);
            if (cloudData.journal) setJournal(cloudData.journal);
          }
        } catch (error) {
          console.error("Erreur chargement Froid:", error);
        }
      }
    }
    loadColdData();
  }, [currentUser]);

  // ==========================================
  // FONCTION DE PUSH MANUEL VERS LE CLOUD
  // ==========================================
  const syncToCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        profile,
        journal,
        lastSync: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
      alert("Échec de la sauvegarde Cloud.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <DataContext.Provider value={{ profile, setProfile, journal, setJournal, syncToCloud, isSyncing }}>
      {children}
    </DataContext.Provider>
  );
}