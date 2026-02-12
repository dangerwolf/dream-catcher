import { Ai } from '@cloudflare/ai';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    try {
      const requestData = await request.json();
      const userPrompt = requestData.prompt;
      // 前端传来的 image 数组
      const imageArray = requestData.image; 

      if (!userPrompt || !imageArray) {
        return new Response('Missing prompt or image', { status: 400, headers: CORS_HEADERS });
      }

      const ai = new Ai(env.AI);

      // 核心 Prompt 优化
      const refinedPrompt = `${userPrompt}, photorealistic, cinematic lighting, highly detailed face, 8k resolution, masterpiece, raw photo`;

      const inputs = {
        prompt: refinedPrompt,
        image: imageArray,
        strength: 0.6, // 0.6 是平衡点
        guidance: 7.5
      };

      const response = await ai.run('@cf/runwayml/stable-diffusion-v1-5-img2img', inputs);

      return new Response(response, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'image/png',
        },
      });

    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500, headers: CORS_HEADERS });
    }
  },
};
