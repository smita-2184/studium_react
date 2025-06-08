declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(modelParams: { model: string }): GenerativeModel;
  }

  export interface GenerativeModel {
    startChat(request?: StartChatParams): ChatSession;
    generateContent(request: string | GenerateContentRequest): Promise<GenerateContentResult>;
  }

  export interface StartChatParams {
    history?: Content[];
    generationConfig?: GenerationConfig;
    safetySettings?: SafetySetting[];
  }

  export interface Content {
    role: string;
    parts: Part[];
  }

  export interface Part {
    text: string;
  }

  export interface GenerateContentRequest {
    contents: Content[];
    generationConfig?: GenerationConfig;
    safetySettings?: SafetySetting[];
  }

  export interface GenerateContentResult {
    response: GenerateContentResponse;
  }

  export interface GenerateContentResponse {
    text(): string;
    candidates?: GenerateContentCandidate[];
  }

  export interface GenerateContentCandidate {
    content: Content;
    finishReason?: string;
    index: number;
    safetyRatings?: SafetyRating[];
  }

  export interface ChatSession {
    sendMessage(request: string | GenerateContentRequest): Promise<GenerateContentResult>;
    getHistory(): Content[];
  }

  export interface GenerationConfig {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  }

  export interface SafetySetting {
    category: HarmCategory;
    threshold: HarmBlockThreshold;
  }

  export interface SafetyRating {
    category: HarmCategory;
    probability: HarmProbability;
  }

  export enum HarmCategory {
    HARM_CATEGORY_UNSPECIFIED = "HARM_CATEGORY_UNSPECIFIED",
    HARM_CATEGORY_DEROGATORY = "HARM_CATEGORY_DEROGATORY",
    HARM_CATEGORY_TOXICITY = "HARM_CATEGORY_TOXICITY",
    HARM_CATEGORY_VIOLENCE = "HARM_CATEGORY_VIOLENCE",
    HARM_CATEGORY_SEXUAL = "HARM_CATEGORY_SEXUAL",
    HARM_CATEGORY_MEDICAL = "HARM_CATEGORY_MEDICAL",
    HARM_CATEGORY_DANGEROUS = "HARM_CATEGORY_DANGEROUS",
    HARM_CATEGORY_HARASSMENT = "HARM_CATEGORY_HARASSMENT",
    HARM_CATEGORY_HATE_SPEECH = "HARM_CATEGORY_HATE_SPEECH",
    HARM_CATEGORY_SEXUALLY_EXPLICIT = "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    HARM_CATEGORY_DANGEROUS_CONTENT = "HARM_CATEGORY_DANGEROUS_CONTENT",
  }

  export enum HarmBlockThreshold {
    HARM_BLOCK_THRESHOLD_UNSPECIFIED = "HARM_BLOCK_THRESHOLD_UNSPECIFIED",
    BLOCK_LOW_AND_ABOVE = "BLOCK_LOW_AND_ABOVE",
    BLOCK_MEDIUM_AND_ABOVE = "BLOCK_MEDIUM_AND_ABOVE",
    BLOCK_ONLY_HIGH = "BLOCK_ONLY_HIGH",
    BLOCK_NONE = "BLOCK_NONE",
  }

  export enum HarmProbability {
    HARM_PROBABILITY_UNSPECIFIED = "HARM_PROBABILITY_UNSPECIFIED",
    NEGLIGIBLE = "NEGLIGIBLE",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
  }
} 