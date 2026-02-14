import { GoogleGenAI, Type } from "@google/genai";

// ✅ VANTA_BLINDAGE: no Vite, NÃO use process.env. Use import.meta.env.
// ✅ Não instancia o cliente sem key (evita crash).
const apiKey =
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY ||
  (import.meta as any)?.env?.GEMINI_API_KEY ||
  (import.meta as any)?.env?.API_KEY ||
  "";

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// geminiService.ts
export const getVantaConciergeResponse = async (
  userPrompt: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[] = []
): Promise<string> => {
  try {
    // ✅ sem key: não chama IA, não crasha
    if (!ai) {
      return "Concierge indisponível no ambiente local (sem GEMINI API KEY).";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: history.length > 0
        ? (history.concat([{ role: 'user', parts: [{ text: userPrompt }] }]) as any)
        : (userPrompt as any),
      config: {
        systemInstruction: "Você é o Vanta Concierge, um assistente de elite para membros de um clube exclusivo.",
      }
    });

    return response.text ?? "Lamento, Membro. Não consegui gerar uma resposta agora.";
  } catch (error) {
    console.error("Concierge fetch error:", error);
    return "Lamento, Membro. Tivemos uma instabilidade em nossos servidores de elite. Tente novamente em breve.";
  }
};

// Fixed: Exporting geminiService to resolve "Module has no exported member" error in ProjectDashboard.tsx
export const geminiService = {
  analyzeProject: async (manifest: string, structure: string): Promise<any> => {
    try {
      // ✅ sem key: não chama IA, não crasha
      if (!ai) {
        return {
          summary: "Concierge indisponível no ambiente local (sem GEMINI API KEY).",
          recommendations: [],
          potentialIssues: [],
          techStack: []
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise o seguinte manifesto e estrutura de projeto: Manifesto: ${manifest}, Estrutura: ${structure}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              potentialIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
              techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["summary", "recommendations", "potentialIssues", "techStack"]
          }
        }
      });

      const text = response.text || '{}';
      return JSON.parse(text);
    } catch (error) {
      console.error("Analysis error:", error);
      return {
        summary: "Falha na análise técnica do projeto.",
        recommendations: [],
        potentialIssues: ["Instabilidade temporária no motor de IA"],
        techStack: []
      };
    }
  }
};
