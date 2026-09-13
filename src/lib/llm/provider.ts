import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type LLMProviderType = "openai" | "anthropic" | "gemini" | "demo";

export interface LLMCompletionOptions {
  system?: string;
  json?: boolean;
  temperature?: number;
}

export class LLMService {
  private providerType: LLMProviderType = "demo";
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private geminiClient?: GoogleGenerativeAI;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.providerType = "openai";
      this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.providerType = "anthropic";
      this.anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    } else if (process.env.GEMINI_API_KEY) {
      this.providerType = "gemini";
      this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } else {
      this.providerType = "demo";
    }
  }

  public getProviderType(): LLMProviderType {
    return this.providerType;
  }

  public isDemoMode(): boolean {
    return this.providerType === "demo";
  }

  public getProviderDisplayName(): string {
    switch (this.providerType) {
      case "openai":
        return "OpenAI (GPT-4o)";
      case "anthropic":
        return "Anthropic (Claude 3.5)";
      case "gemini":
        return "Google Gemini (1.5 Flash)";
      default:
        return "Demo Mode (Rule-based Heuristics)";
    }
  }

  public async complete(prompt: string, options: LLMCompletionOptions = {}): Promise<string> {
    const { system = "You are a professional NGO and grant funding intelligence assistant.", json = false, temperature = 0.2 } = options;

    if (this.providerType === "openai" && this.openaiClient) {
      try {
        const response = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          response_format: json ? { type: "json_object" } : undefined,
          temperature,
        });
        return response.choices[0]?.message?.content || "";
      } catch (err) {
        console.warn("OpenAI call failed, falling back to heuristic engine:", err);
      }
    }

    if (this.providerType === "anthropic" && this.anthropicClient) {
      try {
        const response = await this.anthropicClient.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 2000,
          system,
          messages: [{ role: "user", content: prompt }],
          temperature,
        });
        const firstBlock = response.content[0];
        return firstBlock && "text" in firstBlock ? firstBlock.text : "";
      } catch (err) {
        console.warn("Anthropic call failed, falling back to heuristic engine:", err);
      }
    }

    if (this.providerType === "gemini" && this.geminiClient) {
      try {
        const model = this.geminiClient.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: system,
        });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: json ? "application/json" : "text/plain",
          },
        });
        return result.response.text();
      } catch (err) {
        console.warn("Gemini call failed, falling back to heuristic engine:", err);
      }
    }

    // Default: return empty string so caller uses heuristic fallback
    return "";
  }
}

export const llmService = new LLMService();
