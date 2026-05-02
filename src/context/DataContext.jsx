import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from '../App'; 

// --- IMPORTS IMAGES ---
import imgPresse from '../assets/presse-a-cuisses-inclinee.gif';
import imgRomain from '../assets/souleve-de-terre-roumain-kettlebell.gif';
import imgLegCurl from '../assets/leg-curl-allonge.gif'
import imgElevMol  from '../assets/extension-mollets-debout-machine.gif'
import imgHackSquat from '../assets/Sled-Hack-Squat.gif';
import imgLegExtension from '../assets/leg-extension.gif';
import imgAdducteur from '../assets/adducteur-machine-cuisse.png';
import imgMollets from '../assets/ExtensionMollets .jpg';
import imgDCSmith from '../assets/developpe-couche.gif';
import imgChestPress from '../assets/developpe-incline-machine-convergente-exercice-musculation.gif';
import imgShoulderPress from '../assets/SEAT_DB_SHD_PRESS.gif';
import imgTriceps from '../assets/02011301-Cable-Pushdown_Upper-Arms_720.gif';
import imgLateralRaise from '../assets/03341301-Dumbbell-Lateral-Raise_shoulder_720.gif';
import imgLatPulldown from '../assets/Tirage_Vertical_Poulie_Haute.png';
import imgSeatedRow from '../assets/Tirage_Horizontal_Assis.png';
import imgPullover from '../assets/pull-over-poulie.gif';
import imgHammerCurl from '../assets/Dumbbell-Hammer-Curl_Forearm.gif';
import imgCurlBiceps from '../assets/Curl_Biceps.png';

const DataContext = createContext();

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData doit être utilisé dans un DataProvider");
  return context;
}

const getTodayStr = () => new Date().toISOString().split('T')[0];
const defaultJournalDay = { meals: { breakfast: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, lunch: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, dinner: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 }, snacks: { items: [], cals: 0, carbs: 0, prot: 0, fat: 0 } }, activity: 0, water: 0, readiness: 10 };

export const CATALOGUE_EXERCICES = [
  { id: 'cat_presse', name: "Presse à Cuisses", image: imgPresse },
  { id: 'cat_soulver', name: "Soulevé de Terre Roumain aux Haltères ", image: imgRomain },
  { id: 'cat_LegCurl', name: "Leg Curl Allongé (Machine)", image: imgLegCurl },
  { id: 'cat_ElevMol', name: "Élévations Mollets Debout (Machine guidée)", image: imgElevMol },
  { id: 'cat_hacksquat', name: "Hack Squat", image: imgHackSquat },
  { id: 'cat_legext', name: "Leg Extension", image: imgLegExtension },
  { id: 'cat_adduct', name: "Adducteurs", image: imgAdducteur },
  { id: 'cat_mollets', name: "Mollets", image: imgMollets },
  { id: 'cat_dcsmith', name: "DC Smith Machine", image: imgDCSmith },
  { id: 'cat_chestpress', name: "Chest Press", image: imgChestPress },
  { id: 'cat_shoulderpress', name: "Shoulder Press", image: imgShoulderPress },
  { id: 'cat_triceps', name: "Triceps Pushdown", image: imgTriceps },
  { id: 'cat_latraise', name: "Élévations Latérales", image: imgLateralRaise },
  { id: 'cat_latpull', name: "Lat Pulldown", image: imgLatPulldown },
  { id: 'cat_seatedrow', name: "Seated Row", image: imgSeatedRow },
  { id: 'cat_pullover', name: "Pull-over poulie", image: imgPullover },
  { id: 'cat_hammercurl', name: "Curl Marteau", image: imgHammerCurl },
  { id: 'cat_curlbiceps', name: "Curl Biceps Machine", image: imgCurlBiceps }
];

const defaultProgramData = {};

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  
  const [profile, setProfileState] = useState(() => JSON.parse(localStorage.getItem('mecanik_profile')) || null);
  const [program, setProgramState] = useState(() => JSON.parse(localStorage.getItem('mecanik_program_v2')) || defaultProgramData);
  const [journal, setJournalState] = useState(() => JSON.parse(localStorage.getItem('mecanik_journal')) || { [getTodayStr()]: defaultJournalDay });
  const [history, setHistoryState] = useState(() => JSON.parse(localStorage.getItem('mecanik_history')) || {});
  const [customCatalog, setCustomCatalog] = useState([]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');

  // 🟢 CORRECTION : Retrait des useCallback pour éviter les fermetures obsolètes (stale closures)
  const setProfile = (data) => { 
    setProfileState(data); 
    setHasUnsavedChanges(true); 
  };
  const setProgram = (data) => { 
    setProgramState(data); 
    setHasUnsavedChanges(true); 
  };
  const setJournal = (data) => { 
    setJournalState(data); 
    setHasUnsavedChanges(true); 
  };
  const setHistory = (data) => { 
    setHistoryState(data); 
    setHasUnsavedChanges(true); 
  };

  useEffect(() => { 
    if (profile) localStorage.setItem('mecanik_profile', JSON.stringify(profile)); 
    localStorage.setItem('mecanik_program_v2', JSON.stringify(program));
    localStorage.setItem('mecanik_history', JSON.stringify(history));
    
    const cleanJournal = { ...journal };
    const dates = Object.keys(cleanJournal).sort();
    if (dates.length > 30) dates.slice(0, dates.length - 30).forEach(d => delete cleanJournal[d]);
    localStorage.setItem('mecanik_journal', JSON.stringify(cleanJournal)); 
  }, [profile, program, journal, history]);

  useEffect(() => {
    async function loadColdData() {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.profile) setProfileState(data.profile);
          if (data.program) setProgramState(data.program);
        }

        const journalSnap = await getDocs(collection(db, "users", currentUser.uid, "journal"));
        const cloudJournal = {};
        journalSnap.forEach(doc => { cloudJournal[doc.id] = doc.data(); });
        setJournalState(prev => ({ ...prev, ...cloudJournal }));

        const historySnap = await getDocs(collection(db, "users", currentUser.uid, "history"));
        const cloudHistory = {};
        historySnap.forEach(doc => { cloudHistory[doc.id] = doc.data().logs || []; });
        setHistoryState(cloudHistory);

        const customExosSnap = await getDocs(collection(db, "custom_exercises"));
        setCustomCatalog(customExosSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
      } catch (error) { console.error("Erreur de chargement Cloud:", error); }
    }
    loadColdData();
  }, [currentUser]);

  const saveToCloud = useCallback(async () => {
    if (!currentUser || !hasUnsavedChanges) return;
    
    setSaveStatus('saving');
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, "users", currentUser.uid);

      batch.set(userRef, { profile, program, lastSync: new Date().toISOString() }, { merge: true });

      Object.entries(journal).forEach(([dateStr, dayData]) => {
        const dayRef = doc(db, "users", currentUser.uid, "journal", dateStr);
        batch.set(dayRef, dayData, { merge: true });
      });

      Object.entries(history).forEach(([exoId, logs]) => {
        const exoRef = doc(db, "users", currentUser.uid, "history", exoId);
        batch.set(exoRef, { logs }, { merge: true });
      });

      await batch.commit();
      
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);

    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      setSaveStatus('error');
    }
  }, [currentUser, hasUnsavedChanges, profile, program, journal, history]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (hasUnsavedChanges) saveToCloud();
    }, 10000); 
    return () => clearInterval(timer);
  }, [hasUnsavedChanges, saveToCloud]);

  const getFullExerciseData = useCallback((exoConfig) => {
    const catalogExo = CATALOGUE_EXERCICES.find(e => e.id === exoConfig.refId) || customCatalog.find(e => e.id === exoConfig.refId);
    if(!catalogExo) return null;
    return { ...catalogExo, ...exoConfig }; 
  }, [customCatalog]);

  return (
    <DataContext.Provider value={{ 
        profile, setProfile, 
        journal, setJournal, 
        program, setProgram, 
        history, setHistory, 
        saveToCloud, 
        saveStatus,
        hasUnsavedChanges,
        customCatalog, 
        CATALOGUE_EXERCICES,
        getFullExerciseData
    }}>
      {children}
    </DataContext.Provider>
  );
}