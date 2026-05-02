import { createWorker } from 'tesseract.js';

let worker = null;

export const getOcrWorker = async () => {
  if (worker) return worker;

  // Initialisation unique du worker
  worker = await createWorker('fra');
  return worker;
};

/**
 * Note : On ne termine pas le worker ici (pas de worker.terminate()) 
 * pour qu'il reste disponible instantanément pour le prochain scan.
 */