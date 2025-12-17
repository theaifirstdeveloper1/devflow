/**
 * Test script to verify Gemini API is working
 * Run with: npx tsx src/ai/test-gemini.ts
 */

// Load environment variables from .env file
import 'dotenv/config';

import { autoTagEntry } from './flows/auto-tagging-entries';

async function testGeminiAPI() {
    console.log('🧪 Testing Gemini API...\n');

    // Check environment variable
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found in environment!');
        console.log('Make sure you have GEMINI_API_KEY in your .env file');
        process.exit(1);
    }

    console.log('✅ GEMINI_API_KEY found');
    console.log(`Key starts with: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`);
    console.log('');

    // Test simple English input
    console.log('Test 1: Simple English task');
    try {
        const result = await autoTagEntry('get milk by tomorrow');
        console.log('✅ Success!');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Failed:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
}

testGeminiAPI();
