/**
 * Quick automated test for recommendation system
 * No interactive input required
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

dotenv.config();
global.fetch = fetch;

const firebaseConfig = {
  apiKey: "AIzaSyAqeSCpUc9bP5s-ATMAE9_jK7cF4_5KXKk",
  authDomain: "libstatus-97ab1.firebaseapp.com",
  databaseURL: "https://libstatus-97ab1-default-rtdb.firebaseio.com",
  projectId: "libstatus-97ab1",
  storageBucket: "libstatus-97ab1.firebasestorage.app",
  messagingSenderId: "940250549229",
  appId: "1:940250549229:web:15b80dcd14988a92f075e4"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function getAllLocations() {
  const locationsRef = ref(database, 'locations');
  try {
    const snapshot = await get(locationsRef);
    return snapshot.exists() ? snapshot.val() : {};
  } catch (error) {
    console.error('Error fetching locations:', error);
    return {};
  }
}

const getRecommendation = async (quizAnswers, liveLocationData) => {
  const locationProfiles = {
    "first-floor-berry": { vibe: "social, bustling", bestFor: "group work", amenities: ["printers", "cafe"] },
    "second-floor-berry": { vibe: "moderate activity", bestFor: "flexible studying", amenities: ["outlets", "windows", "monitors"] },
    "third-floor-berry": { vibe: "quieter", bestFor: "focus work", amenities: ["study rooms"] },
    "fourth-floor-berry": { vibe: "silent", bestFor: "deep concentration", amenities: ["carrels"] },
    "sanborn": { vibe: "traditional", bestFor: "reading", amenities: ["comfortable seating"] },
    "novack": { vibe: "social hub", bestFor: "casual study", amenities: ["cafe", "collaboration"] },
    "blobby": { vibe: "modern, bright", bestFor: "creative work", amenities: ["natural light", "cafe"] },
    "1902-room": { vibe: "formal", bestFor: "focused study", amenities: ["reserved seating"] },
    "1913-room": { vibe: "quiet", bestFor: "individual work", amenities: ["study desks"] },
    "tower-room": { vibe: "scenic, quiet", bestFor: "concentration", amenities: ["views"] },
    "orozco-mural-rooms": { vibe: "artistic", bestFor: "inspiration", amenities: ["murals", "unique space"] },
    "stacks": { vibe: "silent, traditional", bestFor: "deep focus", amenities: ["carrels", "books"] }
  };

  const prompt = `You are a Dartmouth study spot expert. Based on this student's preferences and current library conditions, recommend the best 1-2 places to study RIGHT NOW.

STUDENT PREFERENCES:
${JSON.stringify(quizAnswers, null, 2)}

CURRENT LIBRARY STATUS (real-time data from last few minutes):
${JSON.stringify(liveLocationData, null, 2)}

LOCATION CHARACTERISTICS (what makes each spot unique):
${JSON.stringify(locationProfiles, null, 2)}

IMPORTANT INSTRUCTIONS:
- Consider BOTH current availability AND how well the spot matches their preferences
- If their preferred type is packed, suggest the next best alternative
- Be honest if conditions aren't ideal ("normally perfect but currently busy")
- Location names in your response must EXACTLY match the keys in the data

Respond with ONLY valid JSON (no markdown, no backticks, no extra text):
{
  "primary": {
    "location": "exact-location-key-from-data",
    "reason": "why it's perfect for them right now"
  },
  "backup": {
    "location": "exact-location-key-from-data",
    "reason": "why it's a good alternative"
  },
  "tip": "one helpful tip about timing, amenities, or strategy"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    const cleanedResponse = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const recommendation = JSON.parse(cleanedResponse);

    if (!recommendation.primary || !recommendation.backup) {
      throw new Error("Invalid recommendation format from Claude");
    }

    return recommendation;
  } catch (error) {
    console.error("Error:", error);
    return { error: true, message: error.message };
  }
};

async function runTest() {
  console.log('\n🧪 QUICK RECOMMENDATION TEST\n');

  // Test quiz answers
  const quizAnswers = {
    noisePreference: "quiet",
    studyType: "solo-focus",
    atmosphere: "minimal-distraction",
    duration: "2-4 hours",
    needs: ["outlets", "natural-light"]
  };

  console.log('✅ Fetching live location data...');
  const locationData = await getAllLocations();
  console.log(`✅ Found ${Object.keys(locationData).length} locations\n`);

  console.log('🤖 Getting AI recommendation...');
  const recommendation = await getRecommendation(quizAnswers, locationData);

  if (recommendation.error) {
    console.error('❌ FAILED:', recommendation.message);
    process.exit(1);
  }

  console.log('\n✅ SUCCESS! Recommendation system working!\n');
  console.log('Primary:', recommendation.primary.location);
  console.log('Backup:', recommendation.backup.location);
  console.log('\n');

  process.exit(0);
}

runTest();
