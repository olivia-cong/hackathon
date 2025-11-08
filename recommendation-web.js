/**
 * Web-compatible recommendation engine
 * Gets personalized study spot recommendations from Claude AI
 */

export async function getRecommendation(quizAnswers, liveLocationData, apiKey) {

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

CURRENT LIBRARY STATUS (real-time data):
${JSON.stringify(liveLocationData, null, 2)}

LOCATION CHARACTERISTICS:
${JSON.stringify(locationProfiles, null, 2)}

INSTRUCTIONS:
- Consider BOTH availability AND preference match
- Suggest alternatives if preferred spots are packed
- Location names must EXACTLY match the keys in the data

Respond with ONLY valid JSON (no markdown):
{
  "primary": {
    "location": "exact-location-key",
    "reason": "why it's perfect now"
  },
  "backup": {
    "location": "exact-location-key",
    "reason": "alternative option"
  },
  "tip": "helpful tip"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    const cleanedResponse = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const recommendation = JSON.parse(cleanedResponse);

    if (!recommendation.primary || !recommendation.backup) {
      throw new Error("Invalid format");
    }

    return recommendation;
  } catch (error) {
    console.error("Recommendation error:", error);
    return { error: true, message: error.message };
  }
}
