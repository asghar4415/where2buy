import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const searchShops = async (req, res) => {
  try {
    const { text, location } = req.body;

    // 1. Validate Input
    if (!text || !location) {
      return res.status(400).json({ error: "Text and user location are required" });
    }

    // 2. Validate Keys
    if (!GEMINI_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: "API keys are not configured" });
    }

    // --- Step 1: Use Gemini to Understand and Categorize ---
   const geminiResponse = await fetch(
      // UPDATED URL: Changed 'gemini-1.5-flash' to 'gemini-2.5-flash'
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this shopping list: "${text}". 
                     Return a valid JSON array where each object has:
                     - "query": The cleaned up item name (e.g., "Nike Air Max", "Milk").
                     - "category": Choose one from ["electronics", "fashion", "grocery", "pharmacy", "hardware", "general"].
                     
                     Example Output: [{"query": "Milk", "category": "grocery"}, {"query": "Iphone cable", "category": "electronics"}]
                     Do not include markdown formatting.`
            }]
          }]
        }),
      }
    );
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error Detail:", errorText); 
      throw new Error(`Gemini API Failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const cleanText = aiText.replace(/```json|```/g, "").trim();
    
    let processedItems = [];
    try {
      processedItems = JSON.parse(cleanText);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    if (!Array.isArray(processedItems) || processedItems.length === 0) {
      return res.status(400).json({ error: "No items identified" });
    }

    console.log("Processed Items:", processedItems);

    // --- Step 2: Process Online and Offline Results in Parallel ---
    
    const finalResults = await Promise.all(processedItems.map(async (itemObj) => {
      // 1. Get Online Smart Links (Synchronous generation)
      const onlineOptions = getOnlineLinks(itemObj);

      // 2. Get Offline Map Results (Async API call)
      const offlineOptions = await getOfflineLocations(itemObj, location);

      return {
        item: itemObj.query,
        category: itemObj.category,
        online: onlineOptions,
        offline: offlineOptions
      };
    }));

    // Send the unified response
    res.json({ results: finalResults });

  } catch (error) {
    console.error("Search shops error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// --- Helper: Generate Smart Online Links ---
// This doesn't use AI. It uses logic to give the best reliable links.
const getOnlineLinks = (itemObj) => {
  const q = encodeURIComponent(itemObj.query);
  const links = [];

  // 1. Category Specific Links
  if (itemObj.category === "electronics") {
    links.push({ platform: "Daraz", url: `https://www.daraz.pk/catalog/?q=${q}` });
    links.push({ platform: "PriceOye", url: `https://priceoye.pk/search?q=${q}` });
  } 
  else if (itemObj.category === "fashion") {
    links.push({ platform: "Daraz", url: `https://www.daraz.pk/catalog/?q=${q}` });
    links.push({ platform: "Outfitters (Search)", url: `https://outfitters.com.pk/search?q=${q}` });
  } 
  else if (itemObj.category === "grocery") {
    links.push({ platform: "Krave Mart", url: `https://kravemart.com.pk/search?q=${q}` });
    links.push({ platform: "PandaMart", url: `https://www.foodpanda.pk/` }); // Deep linking is hard for panda, generic link is safer
  }
  else if (itemObj.category === "pharmacy") {
    links.push({ platform: "Dawaai.pk", url: `https://dawaai.pk/search/index?search=${q}` });
  }

  // 2. Global Fallbacks (Always included)
  links.push({ platform: "Google Shopping", url: `https://www.google.com/search?tbm=shop&q=${q}` });
  links.push({ platform: "Amazon", url: `https://www.amazon.com/s?k=${q}` });
  
  // 3. Social Search
  const tagParams = itemObj.query.replace(/\s+/g, '');
  links.push({ platform: "Instagram Tags", url: `https://www.instagram.com/explore/tags/${tagParams}/` });

  return links;
};

// --- Helper: Fetch Offline Locations via Google Maps ---
const getOfflineLocations = async (itemObj, location) => {
  try {
    const lat = location.latitude;
    const lng = location.longitude;

    // SMART QUERY LOGIC:
    // If someone wants "Milk", searching "Milk" on maps is bad. Searching "Grocery Store" is good.
    // If someone wants "Nike Shoes", searching "Nike Shoes" is good.
    
    let mapQuery = itemObj.query;
    
    if (itemObj.category === "grocery") {
      // Prioritize finding the store type, not the specific item
      mapQuery = "grocery store super market"; 
    } else if (itemObj.category === "pharmacy") {
      mapQuery = "pharmacy medical store";
    } else {
      // For fashion/electronics, append "store" to find physical outlets
      mapQuery = `${itemObj.query} store`;
    }

    const mapsUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(mapQuery)}&location=${lat},${lng}&radius=5000&key=${GOOGLE_MAPS_API_KEY}`;

    const mapsRes = await fetch(mapsUrl);
    const mapsData = await mapsRes.json();

    if (mapsData.status !== "OK") {
      return []; // Return empty if no results or error
    }

    // Return top 3 results formatted cleanly
    return mapsData.results.slice(0, 3).map((s) => ({
      name: s.name,
      address: s.formatted_address,
      rating: s.rating || "N/A",
      openStatus: s.opening_hours?.open_now ? "Open Now" : "Closed/Unknown",
      directionLink: `https://www.google.com/maps/dir/?api=1&destination_place_id=${s.place_id}`
    }));

  } catch (error) {
    console.error(`Offline search error for ${itemObj.query}:`, error);
    return [];
  }
};