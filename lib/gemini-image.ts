/**
 * Gemini image generation client
 * Uses gemini-3.1-flash-image-preview to generate featured images for blog articles.
 */

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent";

export interface GeneratedImage {
  base64: string;
  mimeType: string;
  prompt: string;
}

export async function generateFeaturedImage(
  articleTitle: string,
  keyword: string,
  companyName: string,
): Promise<GeneratedImage> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const prompt =
    `Create a clean, modern featured image for a B2B tech blog article. ` +
    `Topic: "${keyword}" for ${companyName}. ` +
    `Style: abstract, professional digital design with geometric shapes and gradients. ` +
    `Color palette: deep blues, teals, and soft whites suggesting technology and trust. ` +
    `The image should visually represent the concept of ${keyword} through abstract iconography. ` +
    `No text, letters, numbers, or words anywhere in the image. ` +
    `Suitable as a 16:9 blog header image. ` +
    `High quality, clean composition, suitable for a professional B2B audience.`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  };

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API error ${response.status}: ${errorText}`,
    );
  }

  const responseData = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<
          | { text: string }
          | { inlineData: { mimeType: string; data: string } }
        >;
      };
    }>;
  };

  const parts = responseData.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error("Gemini API returned no content parts");
  }

  for (const part of parts) {
    if ("inlineData" in part && part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
        prompt,
      };
    }
  }

  throw new Error("Gemini API response contained no image data");
}
