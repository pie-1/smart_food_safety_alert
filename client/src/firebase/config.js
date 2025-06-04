import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5TgUlsmRlJZVvQPDMnHPqCBQa6S261oU",

  authDomain: "smart-food-safety-alert.firebaseapp.com",
  projectId: "smart-food-safety-alert",
  storageBucket: "smart-food-safety-alert.firebasestorage.app",
  messagingSenderId: "145945964054",
  appId: "1:145945964054:web:c881442d1496c59da80f37",
  measurementId: "G-BP1QH7DHM2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };


















 