/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message } from "./ChatSocket";

export class AIService {
  // private ai: GoogleGenAI; // Removed to avoid API key requirement
  private modelId = 'gemini-2.5-flash';

  constructor() {
    // API Key removed as per user request
    // this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateResponse(
    history: Message[], 
    userPrompt: string, 
    personaName: string,
    personaBio: string
  ): Promise<string> {
    try {
      // Mock response since API key is removed
      console.log(`[Mock AI] Generating response for ${personaName} with prompt: ${userPrompt}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return `(Mock Response from ${personaName}) That's interesting! Tell me more.`;
    } catch (error) {
      console.error("AI Generation Error:", error);
      return "Error: Network unreachable.";
    }
  }
}