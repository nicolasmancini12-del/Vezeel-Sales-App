import { GoogleGenAI, Type } from "@google/genai";

export const analyzeTextForOrder = async (text: string) => {
  // Verificación segura para evitar que la App se rompa si process no existe en el navegador
  // Nota: Para que esto funcione en Vercel + Vite, asegúrate de que la variable de entorno
  // esté expuesta (usualmente requiere prefijo VITE_ o configuración en vite.config.ts)
  // Por ahora, esto evita el crash (pantalla blanca).
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : null;

  if (!apiKey) {
    console.warn("No API_KEY found for Gemini. AI features disabled.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract service order details from this text: "${text}". If a field is missing, leave it null or imply a reasonable default based on context.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            client: { type: Type.STRING, description: "Name of the client company" },
            serviceName: { type: Type.STRING, description: "Short description of the service or project" },
            unitOfMeasure: { type: Type.STRING, description: "e.g., Horas, Días, Story Points, Proyecto" },
            quantity: { type: Type.NUMBER, description: "Quantity of units" },
            observations: { type: Type.STRING, description: "Any relevant notes or summary" },
            poNumber: { type: Type.STRING, description: "Purchase Order code if present" }
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};