/**
 * Gets a personalized study spot recommendation from Claude AI
 * @param {Object} quizAnswers - User's study preferences from quiz
 * @param {Array} liveLocationData - Real-time status of all library locations
 * @returns {Object} Recommendation with primary/backup spots and reasoning
 */
const getRecommendation = async (quizAnswers, liveLocationData) => {
  
  // ✅ CRITICAL: Add location characteristics so Claude knows about each spot
  // This gives Claude context beyond just current status
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
    // ✅ FIXED: Correct API endpoint and headers
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ✅ CRITICAL: Use x-api-key, not Authorization header
        "x-api-key": process.env.CLAUDE_API_KEY,
        // ✅ REQUIRED: API version header
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        // ✅ FIXED: Correct model name (you had wrong format)
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
    
    // ✅ CRITICAL: Extract the actual text from Claude's response format
    // Claude API returns: { content: [{ type: "text", text: "..." }], ... }
    const responseText = data.content[0].text;
    
    // ✅ IMPORTANT: Parse the JSON from Claude's response
    // Strip any potential markdown formatting Claude might add despite instructions
    const cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    const recommendation = JSON.parse(cleanedResponse);
    
    // ✅ VALIDATION: Ensure the response has required fields
    if (!recommendation.primary || !recommendation.backup) {
      throw new Error("Invalid recommendation format from Claude");
    }
    
    return recommendation;

  } catch (error) {
    console.error("Error fetching recommendation:", error);
    
    // ✅ BETTER ERROR HANDLING: Return fallback instead of just error
    return {
      error: true,
      message: error.message,
      // Provide graceful fallback
      fallback: {
        primary: {
          location: liveLocationData[0]?.name || "Berry Library",
          reason: "Unable to get AI recommendation. This is the first available option."
        }
      }
    };
  }
};