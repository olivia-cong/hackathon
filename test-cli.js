/**
 * CLI Test Script for Lib-Status Board
 * Tests the integration between database and recommendation.js
 *
 * Usage: node test-cli.js
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import readlineSync from 'readline-sync';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

// Load environment variables from .env file
dotenv.config();

// Make fetch available globally for recommendation.js
global.fetch = fetch;

// Firebase configuration (from database file)
const firebaseConfig = {
  apiKey: "AIzaSyAqeSCpUc9bP5s-ATMAE9_jK7cF4_5KXKk",
  authDomain: "libstatus-97ab1.firebaseapp.com",
  databaseURL: "https://libstatus-97ab1-default-rtdb.firebaseio.com",
  projectId: "libstatus-97ab1",
  storageBucket: "libstatus-97ab1.firebasestorage.app",
  messagingSenderId: "940250549229",
  appId: "1:940250549229:web:15b80dcd14988a92f075e4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * Fetch all locations from Firebase
 */
async function getAllLocations() {
  const locationsRef = ref(database, 'locations');
  try {
    const snapshot = await get(locationsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return {};
    }
  } catch (error) {
    console.error('❌ Error fetching locations:', error);
    return {};
  }
}

/**
 * Gets a personalized study spot recommendation from Claude AI
 * (Copied from recommendation.js with location IDs fixed)
 */
const getRecommendation = async (quizAnswers, liveLocationData) => {

  const locationProfiles = {
    "first-floor-berry": { vibe: "social, bustling", bestFor: "group work", amenities: ["printers", "cafe"] },
    "second-floor-berry": { vibe: "moderate activity", bestFor: "flexible studying", amenities: ["outlets", "windows"] },
    "third-floor-berry": { vibe: "quieter", bestFor: "focus work", amenities: ["study rooms"] },
    "fourth-floor-berry": { vibe: "silent", bestFor: "deep concentration", amenities: ["carrels"] },
    "sanborn": { vibe: "traditional", bestFor: "reading", amenities: ["comfortable seating"] },
    "novack": { vibe: "social hub", bestFor: "casual study", amenities: ["cafe", "collaboration"] },
    "blobby": { vibe: "modern, bright", bestFor: "creative work", amenities: ["natural light"] },
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
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    const cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const recommendation = JSON.parse(cleanedResponse);

    if (!recommendation.primary || !recommendation.backup) {
      throw new Error("Invalid recommendation format from Claude");
    }

    return recommendation;

  } catch (error) {
    console.error("Error fetching recommendation:", error);
    return {
      error: true,
      message: error.message,
      fallback: {
        primary: {
          location: Object.keys(liveLocationData)[0] || "first-floor-berry",
          reason: "Unable to get AI recommendation. This is the first available option."
        }
      }
    };
  }
};

/**
 * Interactive quiz function - collects user preferences
 */
function runQuiz() {
  console.log('\n📝 STUDY PREFERENCES QUIZ\n');
  console.log('Answer a few questions to get personalized recommendations!\n');

  // Question 1: Noise Preference
  const noiseIndex = readlineSync.keyInSelect(
    ['Silent (absolute quiet)', 'Quiet (whispers okay)', 'Moderate (some chatter)', 'Social (collaborative buzz)'],
    'How much noise can you tolerate?',
    { cancel: false }
  );
  const noiseMap = ['silent', 'quiet', 'moderate', 'social'];
  const noisePreference = noiseMap[noiseIndex];

  // Question 2: Study Type
  const studyIndex = readlineSync.keyInSelect(
    ['Solo deep focus', 'Solo with breaks', 'Group collaboration', 'Flexible/mixed'],
    'What type of studying are you doing?',
    { cancel: false }
  );
  const studyMap = ['solo-focus', 'solo-flexible', 'group-work', 'mixed'];
  const studyType = studyMap[studyIndex];

  // Question 3: Atmosphere
  const atmosphereIndex = readlineSync.keyInSelect(
    ['Minimal distraction (carrels, private)', 'Open & bright (natural light)', 'Cozy & traditional (library feel)', 'Modern & creative'],
    'What atmosphere do you prefer?',
    { cancel: false }
  );
  const atmosphereMap = ['minimal-distraction', 'open-bright', 'traditional', 'modern'];
  const atmosphere = atmosphereMap[atmosphereIndex];

  // Question 4: Duration
  const durationIndex = readlineSync.keyInSelect(
    ['Quick (<1 hour)', 'Medium (1-2 hours)', 'Long (2-4 hours)', 'Marathon (4+ hours)'],
    'How long will you be studying?',
    { cancel: false }
  );
  const durationMap = ['quick', '1-2 hours', '2-4 hours', '4+ hours'];
  const duration = durationMap[durationIndex];

  // Question 5: Special Needs (multi-select)
  console.log('\n5. What amenities do you need? (separate with commas, or press Enter for none)');
  console.log('   Options: outlets, natural-light, printers, cafe, monitors, study-rooms, whiteboards');
  const needsInput = readlineSync.question('Your needs: ').trim();
  const needs = needsInput ? needsInput.split(',').map(n => n.trim()) : [];

  return {
    noisePreference,
    studyType,
    atmosphere,
    duration,
    needs
  };
}

/**
 * Main test function
 */
async function runTest() {
  console.log('\n🧪 LIB-STATUS BOARD - CLI TEST\n');
  console.log('=' .repeat(60));

  // Step 1: Check API key
  console.log('\n📋 Step 1: Checking Claude API Key...');
  if (!process.env.CLAUDE_API_KEY) {
    console.error('❌ ERROR: CLAUDE_API_KEY environment variable not set!');
    console.log('\n💡 Set it with: export CLAUDE_API_KEY=your-api-key-here\n');
    process.exit(1);
  }
  console.log('✅ API key found');

  // Step 2: Fetch live data from Firebase
  console.log('\n📋 Step 2: Fetching live location data from Firebase...');
  const locationData = await getAllLocations();

  if (Object.keys(locationData).length === 0) {
    console.error('❌ No locations found in database!');
    console.log('💡 Database might be empty. Initialize it first.');
    process.exit(1);
  }

  console.log(`✅ Found ${Object.keys(locationData).length} locations:`);
  Object.entries(locationData).forEach(([id, data]) => {
    const stale = (Date.now() - data.lastUpdated) > 30 * 60 * 1000 ? '⚠️ STALE' : '✓';
    console.log(`   ${stale} ${data.name}: ${data.busyness} / ${data.noise}`);
  });

  // Step 3: Interactive Quiz
  console.log('\n📋 Step 3: Answer quiz questions...');
  const quizAnswers = runQuiz();

  console.log('\n✅ Your preferences:');
  console.log(JSON.stringify(quizAnswers, null, 2));

  // Step 4: Get recommendation from Claude
  console.log('\n📋 Step 4: Getting recommendation from Claude AI...');
  console.log('⏳ Please wait (this may take 5-10 seconds)...\n');

  const recommendation = await getRecommendation(quizAnswers, locationData);

  // Step 5: Display results
  console.log('=' .repeat(60));
  console.log('\n🎯 CLAUDE\'S RECOMMENDATION:\n');

  if (recommendation.error) {
    console.error('❌ ERROR:', recommendation.message);
    if (recommendation.fallback) {
      console.log('\n📍 Fallback:', recommendation.fallback.primary.location);
      console.log('   Reason:', recommendation.fallback.primary.reason);
    }
  } else {
    console.log('🥇 PRIMARY RECOMMENDATION:');
    console.log(`   Location: ${recommendation.primary.location}`);
    console.log(`   Reason: ${recommendation.primary.reason}\n`);

    console.log('🥈 BACKUP RECOMMENDATION:');
    console.log(`   Location: ${recommendation.backup.location}`);
    console.log(`   Reason: ${recommendation.backup.reason}\n`);

    console.log('💡 TIP:');
    console.log(`   ${recommendation.tip}\n`);
  }

  console.log('=' .repeat(60));
  console.log('\n✅ Test complete!\n');

  process.exit(0);
}

// Run the test
runTest();
