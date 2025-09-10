import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;


export const searchShops = async (req, res) => {
  try {
    const { text, location } = req.body;
    const userLocation = location;

    console.log("userLocation", userLocation);

    if (!text || !userLocation) {
      return res
        .status(400)
        .json({ error: "Text and user location are required" });
    }

    if (!GEMINI_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return res
        .status(500)
        .json({ error: "API keys are not configured" });
    }

    // Step 1: Use Gemini API to extract individual items
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract individual shopping items from this list: "${text}" and return them as a JSON array of strings only.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", geminiResponse.status, geminiResponse.statusText);
      return res.status(500).json({ error: "Failed to process request with AI" });
    }

    const geminiData = await geminiResponse.json();

    const aiText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    let cleanText = aiText.replace(/```json|```/g, "").trim();

    let items = [];
    try {
      items = JSON.parse(cleanText || "[]");
    } catch (e) {
      console.error("Failed to parse AI response:", aiText);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No valid items found in the request" });
    }

    // Step 2: Get online shop results using Gemini API
    const onlineResults = await getOnlineShops(items, userLocation);

    // Step 3: Get offline shop results using Google Maps API
    const offlineResults = await getOfflineShops(items, userLocation);

    res.json({
      items,
      online: onlineResults,
      offline: offlineResults,
    });
  } catch (error) {
    console.error("Search shops error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Helper function to get online shop results using Gemini API
const getOnlineShops = async (items, location) => {
  const onlineResults = [];
  
  for (const item of items) {
    try {
      // Use Gemini API to suggest online shopping platforms based on item and location
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `For the item "${item}" in location with coordinates ${location.lat}, ${location.lng}, suggest the best online shopping platforms and return them as a JSON array with objects containing platform name and search URL. Include popular platforms like Amazon, eBay, local e-commerce sites, etc.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!geminiResponse.ok) {
        console.error(`Gemini API error for online shops "${item}":`, geminiResponse.status);
        onlineResults.push({
          item,
          platforms: [],
          error: "Failed to get online shop suggestions"
        });
        continue;
      }

      const geminiData = await geminiResponse.json();
      const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      let cleanText = aiText.replace(/```json|```/g, "").trim();

      let platforms = [];
      try {
        platforms = JSON.parse(cleanText || "[]");
      } catch (e) {
        console.error("Failed to parse online shops AI response:", aiText);
        // Fallback to default platforms
        platforms = [
          {
            name: "Amazon",
            url: `https://www.amazon.com/s?k=${encodeURIComponent(item)}`
          },
          {
            name: "eBay",
            url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(item)}`
          }
        ];
      }

      onlineResults.push({
        item,
        platforms: platforms
      });
    } catch (error) {
      console.error(`Error getting online shops for item "${item}":`, error);
      onlineResults.push({
        item,
        platforms: [],
        error: "Error occurred while getting online shop suggestions"
      });
    }
  }

  return onlineResults;
};

// Helper function to get offline shop results using Google Maps API
const getOfflineShops = async (items, location) => {
  const offlineResults = [];
  
  for (const item of items) {
    try {
      const mapsUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        item
      )}&location=${location.lat},${
        location.lng
      }&radius=5000&key=${GOOGLE_MAPS_API_KEY}`;

      const mapsRes = await fetch(mapsUrl);
      
      if (!mapsRes.ok) {
        console.error(`Google Maps API error for item "${item}":`, mapsRes.status);
        offlineResults.push({
          item,
          shops: [],
          error: "Failed to fetch nearby shops"
        });
        continue;
      }

      const mapsData = await mapsRes.json();

      if (mapsData.status !== 'OK' && mapsData.status !== 'ZERO_RESULTS') {
        console.error(`Google Maps API error for item "${item}":`, mapsData.status);
        offlineResults.push({
          item,
          shops: [],
          error: mapsData.error_message || "Failed to fetch nearby shops"
        });
        continue;
      }

      offlineResults.push({
        item,
        shops: (mapsData.results || []).map((s) => ({
          name: s.name,
          address: s.formatted_address,
          rating: s.rating || null,
          openNow: s.opening_hours?.open_now ?? null,
          placeId: s.place_id,
          types: s.types || []
        })),
      });
    } catch (error) {
      console.error(`Error searching for item "${item}":`, error);
      offlineResults.push({
        item,
        shops: [],
        error: "Error occurred while searching"
      });
    }
  }

  return offlineResults;
};

