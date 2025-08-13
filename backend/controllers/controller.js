import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

let userLocation = null;


export const inputText = async (req, res) => {
  try {
    const { text } = req.body;


    if (!text || !userLocation) {
      return res.status(400).json({ error: "Text and user location are required" });
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
                  text: `Extract individual shopping items from this list: "${text}" and return them as a JSON array of strings only.`
                }
              ]
            }
          ]
        })
      }
    );
    console.log("Gemini API response status:", geminiResponse);

    const geminiData = await geminiResponse.json();
    
    const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    let cleanText = aiText.replace(/```json|```/g, "").trim();

    let items = [];
try {
  items = JSON.parse(cleanText || "[]");
    } catch (e) {
      console.error("Failed to parse AI response:", aiText);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    // Step 2: Search for nearby offline shops using Google Maps API
    const offlineResults = [];
    for (const item of items) {
      const mapsUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        item
      )}&location=${userLocation.lat},${userLocation.lng}&radius=5000&key=${GOOGLE_MAPS_API_KEY}`;

      const mapsRes = await fetch(mapsUrl);
      const mapsData = await mapsRes.json();

      offlineResults.push({
        item,
        shops: mapsData.results.map((s) => ({
          name: s.name,
          address: s.formatted_address,
          rating: s.rating,
          openNow: s.opening_hours?.open_now ?? null
        }))
      });
    }

    // Step 3: Prepare online shop results
    // const onlineResults = items.map((item) => ({
    //   item,
    //   links: [
    //     `https://www.daraz.pk/catalog/?q=${encodeURIComponent(item)}`,
    //     `https://www.amazon.com/s?k=${encodeURIComponent(item)}`
    //   ]
    // }));

    res.json({
      items,
      offline: offlineResults,
    //   online: onlineResults
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getLocation = (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }

  // Store user's location as an object
  userLocation = {
    lat: latitude,
    lng: longitude
  };

  res.json({
    message: "Location received successfully",
    location: userLocation
  });
};
