import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { config } from "../config/env";

const app = getApps().length > 0 ? getApp() : initializeApp(config.firebase);

export const db = getFirestore(app);
export const auth = getAuth(app);