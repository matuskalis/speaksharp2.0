import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results } = body;

    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Invalid results data' },
        { status: 400 }
      );
    }

    // Prepare data for AI analysis
    const assessmentData = results.map((r: any, i: number) => ({
      word: r.text,
      category: r.category,
      score: r.score,
      expectedIPA: r.expectedIPA,
      actualIPA: r.actualIPA,
      recognizedText: r.recognizedText,
      difficulty: r.difficulty
    }));

    // Calculate category averages
    const categoryScores: { [key: string]: number[] } = {};
    assessmentData.forEach(item => {
      if (!categoryScores[item.category]) categoryScores[item.category] = [];
      if (typeof item.score === 'number') categoryScores[item.category].push(item.score);
    });

    const categoryAverages = Object.entries(categoryScores).map(([category, scores]) => ({
      category,
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length
    }));

    // Build prompt for AI
    const prompt = `You are an expert pronunciation coach analyzing a student's English pronunciation assessment. The student read 10 complete sentences aloud, providing rich data on their pronunciation patterns, fluency, and rhythm. Provide personalized, specific feedback.

Assessment Results (Full Sentences):
${assessmentData.map((item, i) => `
${i + 1}. "${item.word}" (${item.category} - ${item.difficulty})
   - Score: ${item.score}%
   - Expected IPA: ${item.expectedIPA || 'N/A'}
   - Actual IPA: ${item.actualIPA || 'Not detected'}
   - What they said: "${item.recognizedText || 'N/A'}"
`).join('\n')}

Category Performance:
${categoryAverages.map(cat => `- ${cat.category}: ${cat.average.toFixed(0)}%`).join('\n')}

Provide feedback in this exact JSON format:
{
  "summary": "Brief 2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "improvements": [
    {
      "sound": "specific phoneme or sound pattern",
      "issue": "what they're doing wrong",
      "practice": "specific exercise or word to practice"
    }
  ],
  "encouragement": "motivational closing message"
}

Focus on:
1. Specific phoneme errors (θ/ð becoming t/d, ɹ/l confusion, v/w mixing)
2. Patterns across sentences (e.g., "drops 'th' at word boundaries", "struggles with consonant clusters")
3. Fluency issues (rhythm, linking, word stress) visible in sentence-level speech
4. Comparison between expected and recognized text to identify systematic errors
5. Actionable practice: specific sentences or exercises to improve

Give specific examples from their actual sentences, not generic advice.`;

    // Call AI API (using Anthropic Claude)
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
      // Fallback to basic feedback if no API key
      return NextResponse.json({
        summary: "Assessment complete! Review your scores above.",
        strengths: ["You completed all 10 items", "Shows commitment to improving"],
        improvements: categoryAverages
          .filter(cat => cat.average < 70)
          .slice(0, 3)
          .map(cat => ({
            sound: cat.category,
            issue: `Lower scores in this category`,
            practice: `Review and practice ${cat.category.toLowerCase()} sounds`
          })),
        encouragement: "Keep practicing! Consistent practice leads to improvement."
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error('AI API call failed');
    }

    const data = await response.json();
    const feedbackText = data.content[0].text;

    // Parse JSON from AI response
    const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const feedback = JSON.parse(jsonMatch[0]);

    return NextResponse.json(feedback);

  } catch (error: any) {
    console.error('Error generating feedback:', error);

    // Fallback feedback
    return NextResponse.json({
      summary: "Assessment complete! Your results are ready.",
      strengths: ["You completed the full assessment", "Shows dedication to improvement"],
      improvements: [
        {
          sound: "General pronunciation",
          issue: "Continue practicing regularly",
          practice: "Focus on the sounds that scored below 70%"
        }
      ],
      encouragement: "Every practice session makes you better. Keep it up!"
    });
  }
}
