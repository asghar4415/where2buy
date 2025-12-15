// test-model.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  console.log("Testing Key:", API_KEY ? "Loaded (Hidden)" : "MISSING!");
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
  );
  
  const data = await response.json();
  
  if (data.error) {
    console.error("❌ API Error:", JSON.stringify(data.error, null, 2));
  } else {
    console.log("✅ Success! Available Models:", data.models.map(m => m.name));
  }
}

listModels();