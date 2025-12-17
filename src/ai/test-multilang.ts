/**
 * Manual Test Script for Multi-Language AI Categorization
 * 
 * Run with: npx tsx src/ai/test-multilang.ts
 * 
 * This tests:
 * - English, Hindi, Marathi, Hinglish inputs
 * - Due date parsing
 * - Priority detection
 * - Slang detection
 * - Code snippet detection
 */

import { autoTagEntry } from './flows/auto-tagging-entries';

const testCases = [
    {
        name: 'Hinglish Task with Due Date',
        input: 'doodh le aana kal tak, bohot zaroori hai',
        expected: {
            category: 'task',
            detectedLanguage: 'hinglish',
            priority: 'high',
            containsSlang: true,
        }
    },
    {
        name: 'Hindi Learning Note',
        input: 'आज React के नए hooks के बारे में सीखा',
        expected: {
            category: 'learning_note',
            detectedLanguage: 'hi',
        }
    },
    {
        name: 'English Code Snippet',
        input: 'function debounce(fn, delay) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => fn(...args), delay); }; }',
        expected: {
            category: 'code_snippet',
            detectedLanguage: 'en',
            language: 'javascript',
        }
    },
    {
        name: 'Marathi Task',
        input: 'rent भरायचा आहे 15 तारखेला - URGENT',
        expected: {
            category: 'task',
            detectedLanguage: 'mr',
            priority: 'urgent',
        }
    },
    {
        name: 'Hingl ish Bug Fix',
        input: 'login page ka bug fix kar diya, password validation theek kar liya',
        expected: {
            category: 'bug_fix',
            detectedLanguage: 'hinglish',
            containsSlang: true,
        }
    },
    {
        name: 'English Idea',
        input: 'idea for a VS Code extension that uses AI to automatically write documentation',
        expected: {
            category: 'idea',
            detectedLanguage: 'en',
        }
    },
    {
        name: 'Urgent Hinglish Task',
        input: 'call karna hai client ko abhi - ASAP regarding deployment issue',
        expected: {
            category: 'task',
            detectedLanguage: 'hinglish',
            priority: 'urgent',
        }
    },
];

async function runTests() {
    console.log('🧪 Testing Multi-Language AI Categorization\n');
    console.log('='.repeat(80));

    for (const test of testCases) {
        console.log(`\n📝 Test: ${test.name}`);
        console.log(`Input: "${test.input}"\n`);

        try {
            const result = await autoTagEntry(test.input);

            console.log('✅ Result:');
            console.log(`  Language: ${result.detectedLanguage}`);
            console.log(`  Translated: "${result.translatedContent}"`);
            console.log(`  Category: ${result.category}`);
            console.log(`  Tags: ${result.tags.join(', ')}`);

            if (result.dueDate) {
                console.log(`  Due Date: ${result.dueDate}`);
            }

            if (result.priority) {
                console.log(`  Priority: ${result.priority}`);
            }

            if (result.actionItems && result.actionItems.length > 0) {
                console.log(`  Action Items: ${result.actionItems.join(', ')}`);
            }

            if (result.language) {
                console.log(`  Programming Language: ${result.language}`);
            }

            if (result.containsSlang && result.slangTerms) {
                console.log(`  Slang Detected:`);
                result.slangTerms.forEach(slang => {
                    console.log(`    - "${slang.original}" → ${slang.meaning} (confidence: ${slang.confidence})`);
                });
            }

            console.log(`  Confidence: ${result.confidence}`);
            console.log(`  Reasoning: ${result.reasoning}`);

            // Validation
            let passed = true;
            if (test.expected.category && result.category !== test.expected.category) {
                console.log(`  ⚠️  Expected category: ${test.expected.category}, got: ${result.category}`);
                passed = false;
            }

            if (test.expected.detectedLanguage && result.detectedLanguage !== test.expected.detectedLanguage) {
                console.log(`  ⚠️  Expected language: ${test.expected.detectedLanguage}, got: ${result.detectedLanguage}`);
                passed = false;
            }

            if (test.expected.priority && result.priority !== test.expected.priority) {
                console.log(`  ⚠️  Expected priority: ${test.expected.priority}, got: ${result.priority}`);
            }

            if (test.expected.containsSlang !== undefined && result.containsSlang !== test.expected.containsSlang) {
                console.log(`  ⚠️  Expected slang: ${test.expected.containsSlang}, got: ${result.containsSlang}`);
            }

            if (passed) {
                console.log(`\n  ✅ Test PASSED`);
            } else {
                console.log(`\n  ❌ Test FAILED`);
            }

        } catch (error) {
            console.log(`❌ Error: ${error}`);
        }

        console.log('\n' + '-'.repeat(80));
    }

    console.log('\n🎉 Tests completed!\n');
}

// Run tests
runTests().catch(console.error);
