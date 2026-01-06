/**
 * Shared JSON output schema and rules for all intake parsing prompts
 * This ensures consistent output format across all source types
 */

export const JSON_OUTPUT_SCHEMA = `## Your Output Format

You MUST return a valid JSON object with this exact structure:

{
  "personas": [
    {
      "name": "Product Manager",
      "role": "Product Manager at mid-size SaaS company",
      "description": "Detailed description of who this person is and their context",
      "goals": ["Goal 1", "Goal 2"],
      "painPoints": ["Pain point 1", "Pain point 2"],
      "demographics": {
        "education": "MBA or equivalent (if mentioned)",
        "experience": "5+ years (if mentioned)",
        "industry": "SaaS / Technology (if mentioned)"
      },
      "quotes": ["Exact quote from transcript supporting this persona"]
    }
  ],
  "useCases": [
    {
      "name": "Workflow Automation",
      "description": "Detailed description of what the user is trying to accomplish",
      "quotes": ["Exact quote from transcript describing this use case"],
      "linkedPersonaIndexes": [0]
    }
  ],
  "feedback": [
    {
      "type": "suggestion",
      "content": "Clear summary of the feedback",
      "quotes": ["Exact quote from transcript"],
      "linkedPersonaIndexes": [0],
      "linkedUseCaseIndexes": [0]
    }
  ]
}`;

export const IMPORTANT_RULES = `## Important Rules
1. Return ONLY valid JSON - no markdown code blocks, no explanations, no text before or after
2. NEVER include real human names from the transcript, whether they are participants or mentioned. You MUST replace all names with role-based identifiers, in summaries, context, direct quotes, etc. EVERYWHERE. This is not optional, and is important for privacy.
3. Use exact quotes from the transcript, but anonymize any human names within them as described in 2.
4. Use array indexes (0, 1, 2...) for linkedPersonaIndexes and linkedUseCaseIndexes
5. If no personas/use cases/feedback found in a category, return an empty array []
6. Focus on actionable product insights that inform product decisions
7. Do not invent or assume information not present in the transcript`;
