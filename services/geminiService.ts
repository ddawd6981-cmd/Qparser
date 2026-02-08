
import { GoogleGenAI } from "@google/genai";
import { SearchResult, DomainStat } from "../types";

export class GeminiService {
  private normalizeUrl(url: string): string {
    try {
      const u = new URL(url);
      u.hash = '';
      return u.toString();
    } catch {
      return url;
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Balanced retry logic.
   * Increased initial delay slightly to give the API breathing room during batching.
   */
  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1200): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const isQuotaError = 
          error?.message?.includes('429') || 
          error?.message?.includes('RESOURCE_EXHAUSTED') ||
          error?.status === 'RESOURCE_EXHAUSTED';

        if (isQuotaError && i < maxRetries - 1) {
          // Use more aggressive delay if quota is hit to avoid immediate secondary failure
          const delay = (initialDelay * Math.pow(2, i)) + (Math.random() * 500);
          console.warn(`[QParser] API Throttled. Waiting ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async performSearch(query: string): Promise<{ results: SearchResult[], stats: DomainStat[] }> {
    return this.withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `QParser Query: ${query}`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const uniqueResults = new Map<string, SearchResult>();
      const domainCount: Record<string, number> = {};
      
      for (const chunk of chunks) {
        if (chunk.web && chunk.web.uri) {
          const cleanUri = this.normalizeUrl(chunk.web.uri);
          if (!uniqueResults.has(cleanUri)) {
            const domain = this.extractDomain(cleanUri);
            uniqueResults.set(cleanUri, {
              title: chunk.web.title || 'Extracted URL',
              uri: cleanUri,
              domain: domain,
              snippet: "Direct Extraction"
            });
            domainCount[domain] = (domainCount[domain] || 0) + 1;
          }
        }
      }

      const stats = Object.entries(domainCount)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count);

      return { results: Array.from(uniqueResults.values()), stats };
    });
  }

  async analyzeResults(query: string, results: SearchResult[]): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const context = results.slice(0, 10).map(r => r.uri).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze tech stack from URLs: ${context}`,
      });
      return response.text || "";
    } catch {
      return "";
    }
  }
}

export const geminiService = new GeminiService();
