import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
// Need the firebase config. I can read it from src/firebase.ts
import fs from 'fs';
const firebaseTs = fs.readFileSync('src/firebase.ts', 'utf8');
const configMatch = firebaseTs.match(/const firebaseConfig = ({[\s\S]*?});/);
if (configMatch) {
  console.log(configMatch[1]);
}
