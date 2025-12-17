

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { DetectedLanguage, Priority, CodeType, SlangTerm } from '@/lib/types';

// Input/Output Schemas
const AutoTagEntryInputSchema = z.string()
  .describe('The content of the entry to be tagged (any language: English, Hindi, Marathi, Hinglish)');

export type AutoTagEntryInput = z.infer<typeof AutoTagEntryInputSchema>;

export const AutoTagEntryOutputSchema = z.object({
  detectedLanguage: z.enum(['en', 'hi', 'mr', 'hinglish', 'mixed'])
    .describe('Detected language of the input'),
  translatedContent: z.string()
    .describe('English translation if input is not in English, otherwise same as input'),
  category: z.enum(['code_snippet', 'learning_note', 'idea', 'bug_fix', 'general', 'task'])
    .describe('The predicted category of the entry'),
  tags: z.array(z.string())
    .describe('Relevant tags extracted from the content (up to 5)'),
  dueDate: z.string().optional()
    .describe('Parsed due date in YYYY-MM-DD format if mentioned'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
    .describe('Priority level based on urgency keywords'),
  actionItems: z.array(z.string()).optional()
    .describe('Action items extracted for tasks'),
  language: z.string().optional()
    .describe('Programming language if code_snippet category'),
  codeType: z.enum(['function', 'class', 'snippet', 'config', 'other']).optional()
    .describe('Type of code if code_snippet'),
  containsSlang: z.boolean().optional().default(false)
    .describe('Whether the entry contains slang or informal terms'),
  slangTerms: z.array(z.object({
    original: z.string(),
    meaning: z.string(),
    confidence: z.number()
  })).optional()
    .describe('Detected slang terms with meanings'),
  confidence: z.number().optional().default(0.8)
    .describe('Confidence score of the categorization (0-1)'),
  reasoning: z.string().optional()
    .describe('Brief explanation of the categorization decision'),
  isCompleted: z.boolean().optional()
    .describe('Whether the item is marked as done/completed (e.g. "- done", "✓")'),
});

export type AutoTagEntryOutput = z.infer<typeof AutoTagEntryOutputSchema>;

// Main export function
export async function autoTagEntry(input: AutoTagEntryInput): Promise<AutoTagEntryOutput> {
  return autoTagEntryFlow(input);
}

// Genkit Flow with improved prompting and error handling
const autoTagEntryFlow = ai.defineFlow(
  {
    name: 'multiLanguageAutoTagFlow',
    inputSchema: AutoTagEntryInputSchema,
    outputSchema: AutoTagEntryOutputSchema,
  },
  async (input) => {
    // Enhanced retry configuration
    const maxRetries = 3;
    const baseDelay = 1000;
    const maxDelay = 10000; // Cap exponential backoff at 10s

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await ai.generate({
          model: 'googleai/gemini-2.5-flash',
          output: { schema: AutoTagEntryOutputSchema },
          config: {
            temperature: 0.3, // Lower temperature for more consistent categorization
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          prompt: buildEnhancedPrompt(input),
        });

        // Validate and enhance output
        const output = result.output || getFallbackResult(input);
        return validateAndEnhanceOutput(output, input);

      } catch (error: any) {
        const isRateLimitError =
          error?.status === 503 ||
          error?.message?.includes('503') ||
          error?.message?.includes('overloaded') ||
          error?.message?.includes('quota') ||
          error?.message?.includes('RESOURCE_EXHAUSTED');

        const isRetryableError =
          isRateLimitError ||
          error?.message?.includes('timeout') ||
          error?.message?.includes('DEADLINE_EXCEEDED');

        // Retry logic with jittered exponential backoff
        if (isRetryableError && attempt < maxRetries - 1) {
          const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          const jitter = Math.random() * 500; // Add randomness to prevent thundering herd
          const delay = exponentialDelay + jitter;

          console.warn(`⏳ AI service issue (${error?.message?.substring(0, 50)}). Retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Non-retryable error or final attempt
        console.error('AI generation failed after retries:', {
          message: error?.message,
          status: error?.status,
          attempt: attempt + 1,
        });
        return getFallbackResult(input);
      }
    }

    return getFallbackResult(input);
  }
);

// Enhanced prompt builder with better structure
function buildEnhancedPrompt(input: string): string {
  const currentDate = new Date().toISOString().split('T')[0];

  return `You are an expert multilingual AI assistant specializing in developer workflow analysis and intelligent categorization.

# TASK
Analyze the following developer entry and provide comprehensive structured metadata including category, tags, priorities, and language detection.

# SUPPORTED LANGUAGES
- English, Hindi (हिंदी), Marathi (मराठी), Hinglish (mixed Hindi-English), Code-switched text

# CATEGORIZATION RULES (Apply in this strict order)

## 1️⃣ IDEA (Highest Priority - Creative/Development Intent)
**Trigger Keywords:**
- English: develop, build, create, design, architect, implement, app, project, website, system, platform, tool, feature, product, prototype, MVP
- Hindi: बनाना (banana), विकसित (viksit), डिज़ाइन (design), ऐप (app), प्रोजेक्ट (project)
- Hinglish: "app banana", "project banana", "develop karna", "build karna", "design karna"

**Rule:** If the entry mentions creating/building software, apps, or projects → IDEA (even if it contains action verbs like "karna hai")

**Examples:**
✅ "Cylerace app develop karna hai" → IDEA
✅ "kal se fitness tracker project start" → IDEA  
✅ "new authentication feature banana" → IDEA

## 2️⃣ CODE_SNIPPET (Code Presence)
**Triggers:** Any code syntax detected (function definitions, imports, classes, variables, code blocks)
**Note:** Can have multilingual comments

## 3️⃣ LEARNING_NOTE (Knowledge Acquisition)
**Trigger Keywords:**
- English: TIL, learned, discovered, read, found out, realized
- Hindi: सीखा (seekha), पता चला (pata chala), जाना (jana)
- Hinglish: "aaj seekha", "pata chala ki", "interesting find"

## 4️⃣ BUG_FIX (Problem Resolution)
**Trigger Keywords:**
- English: bug, fix, solved, resolved, error, issue, debug, patch
- Hindi: ठीक किया (theek kiya), समस्या (samasya)
- Hinglish: "bug fix kiya", "error solve kiya", "issue resolve hua"

## 5️⃣ TASK (Action Items - Non-Development)
**Triggers:** Simple errands and administrative actions ONLY
- buy, get, pay, call, remind, meeting, submit, purchase, book
**Exclusions:** Development work, coding tasks, app creation

**Examples:**
✅ "doodh lana hai" → TASK (errand)
✅ "rent pay karna 15th tak" → TASK (payment)
❌ "app banana hai" → IDEA (not TASK)

## 6️⃣ GENERAL (Default Fallback)
Everything else that doesn't fit the above categories.

---

# EXTRACTION REQUIREMENTS

1. **Language Detection:** Identify primary language (en/hi/mr/hinglish/mixed)
2. **Translation:** Translate to English if input is non-English (preserve meaning, handle code-switching)
3. **Tags:** Extract 3-5 highly relevant tags (use for validation - if tags = ["app", "development"] → likely IDEA)
4. **Due Dates:** Parse temporal references:
   - "kal" / "tomorrow" → next day
   - "15th" / "next week" → calculate from current date
   - Output format: YYYY-MM-DD
5. **Priority:** Detect urgency signals:
   - urgent/ASAP/critical → "urgent"
   - important/high-priority → "high"  
   - normal/regular → "medium"
   - later/someday → "low"
6. **Action Items:** For TASK category, extract concrete to-dos
7. **Code Metadata:** For CODE_SNIPPET, detect programming language and type
8. **Slang Detection:** Identify Indian slang/informal terms:
   - jugaad, timepass, kar dena, abhi, jaldi, chalega, etc.
   - Provide original term + meaning + confidence (0-1)

---

# CURRENT CONTEXT
- **Date:** ${currentDate}
- **Use for relative date calculations** ("tomorrow", "next Friday", etc.)

---

# INPUT ENTRY
\`\`\`
${input}
\`\`\`

---

# OUTPUT GUIDELINES
- **Confidence Score:** 0.8-1.0 for clear matches, 0.5-0.7 for ambiguous, <0.5 for uncertain
- **Reasoning:** Briefly explain your categorization decision (1-2 sentences)
- **Tag Validation:** Ensure tags align with chosen category
- **Be Decisive:** Prefer clear categorization over ambiguity

# IMPORTANT EDGE CASES
- Mixed code + text → CODE_SNIPPET (code wins)
- "app banana" with action verbs → IDEA (development intent wins)
- Vague entries → GENERAL with low confidence
- Multiple categories → Choose primary one based on hierarchy`;
}

// Validate and enhance output quality
function validateAndEnhanceOutput(output: AutoTagEntryOutput, originalInput: string): AutoTagEntryOutput {
  // Ensure confidence is reasonable
  if (!output.confidence || output.confidence < 0 || output.confidence > 1) {
    output.confidence = 0.7; // Default moderate confidence
  }

  // Validate tags aren't empty
  if (!output.tags || output.tags.length === 0) {
    output.tags = extractBasicTags(originalInput);
  }

  // Ensure translation exists
  if (!output.translatedContent || output.translatedContent.trim() === '') {
    output.translatedContent = originalInput;
  }

  // Add reasoning if missing
  if (!output.reasoning) {
    output.reasoning = `Categorized as ${output.category} based on content analysis`;
  }

  return output;
}

// Basic tag extraction fallback
function extractBasicTags(input: string): string[] {
  const keywords = input.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 5);
  return keywords.length > 0 ? keywords : ['general'];
}

// Enhanced fallback with basic heuristics
function getFallbackResult(input: string): AutoTagEntryOutput {
  const lowerInput = input.toLowerCase();

  // Basic heuristic categorization
  let category: AutoTagEntryOutput['category'] = 'general';
  let confidence = 0.4;

  if (lowerInput.includes('function') || lowerInput.includes('const') || lowerInput.includes('import')) {
    category = 'code_snippet';
    confidence = 0.6;
  } else if (lowerInput.includes('app') || lowerInput.includes('build') || lowerInput.includes('develop')) {
    category = 'idea';
    confidence = 0.5;
  } else if (lowerInput.includes('learn') || lowerInput.includes('til') || lowerInput.includes('discovered')) {
    category = 'learning_note';
    confidence = 0.5;
  } else if (lowerInput.includes('bug') || lowerInput.includes('fix') || lowerInput.includes('error')) {
    category = 'bug_fix';
    confidence = 0.5;
  } else if (lowerInput.includes('task') || lowerInput.includes('todo') || lowerInput.includes('reminder')) {
    category = 'task';
    confidence = 0.5;
  }

  return {
    detectedLanguage: 'en' as DetectedLanguage,
    translatedContent: input,
    category,
    tags: extractBasicTags(input),
    containsSlang: false,
    confidence,
    reasoning: 'AI service unavailable - used rule-based fallback categorization with basic heuristics',
  };
}