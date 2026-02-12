import { Ai } from '@cloudflare/ai';

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DreamCatcher Pro</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #1a1a1a; color: #fff; }
        .container { background: #2d2d2d; padding: 2rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        h1 { text-align: center; margin-bottom: 0.5rem; background: linear-gradient(90deg, #ff00cc, #3333ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p.subtitle { text-align: center; color: #aaa; margin-bottom: 2rem; }
        
        .row { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: bold; color: #ddd; }
        input[type="text"] { width: 100%; padding: 12px; border: 1px solid #444; border-radius: 8px; box-sizing: border-box; background: #333; color: white; }
        input[type="file"] { width: 100%; padding: 10px; background: #333; border-radius: 8px; }
        
        /* 滑块样式 */
        .slider-container { display: flex; align-items: center; gap: 10px; }
        input[type="range"] { flex: 1; accent-color: #3333ff; }
        .value-display { font-weight: bold; color: #3333ff; width: 40px; text-align: right; }
        
        button { width: 100%; padding: 14px; background: linear-gradient(90deg, #ff00cc, #3333ff); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: transform 0.1s; margin-top: 10px; }
        button:hover { opacity: 0.9; }
        button:active { transform: scale(0.98); }
        button:disabled { background: #555; cursor: not-allowed; }
        
        #msg { text-align: center; margin-top: 15px; color: #bbb; min-height: 20px; font-size: 0.9rem; }
        
        .preview { display: flex; gap: 20px; margin-top: 30px; flex-wrap: wrap; }
        .box { flex: 1; min-width: 300px; background: #222; padding: 10px; border-radius: 10px; text-align: center; }
        .box p { color: #888; margin-bottom: 10px; font-size: 0.8rem; }
        img { max-width: 100%; border-radius: 8px; display: none; }
        img.show { display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✨ DreamCatcher Pro</h1>
        <p class="subtitle">AI 梦境重绘 (Stable Diffusion v1.5)</p>

        <div class="row">
            <label>1. 上传照片 (建议正方形/半身照)</label>
            <input type="file" id="fileIn" accept="image/*">
        </div>

        <div class="row">
            <label>2. 梦境描述 (英文, 越详细越好)</label>
            <input type="text" id="promptIn" value="cyberpunk city, neon lights, futuristic armor, cinematic lighting" placeholder="输入英文提示词...">
        </div>

        <div class="row">
            <label>3. 想象力幅度 (重要！)</label>
            <div class="slider-container">
                <span style="font-size:0.8rem; color:#888;">保留原图</span>
                <input type="range" id="strengthSlider" min="0.1" max="0.9" step="0.05" value="0.55">
                <span style="font-size:0.8rem; color:#888;">放飞自我</span>
                <span id="strengthVal" class="value-display">0.55</span>
            </div>
            <p style="font-size: 0.75rem; color: #888; margin-top: 5px;">
                * 0.3-0.5: 脸很像，背景微调。<br>
                * 0.6-0.8: 换脸风险高，但画面更震撼。
            </p>
        </div>
        
        <button id="btn" onclick="run()">开始生成</button>
        <p id="msg"></p>

        <div class="preview">
            <div class="box"><p>原始照片</p><img id="imgOrigin"></div>
            <div class="box"><p>AI 重绘</p><img id="imgResult"></div>
        </div>
    </div>

    <script>
        const fileIn = document.getElementById('fileIn');
        const imgOrigin = document.getElementById('imgOrigin');
        const imgResult = document.getElementById('imgResult');
        const msg = document.getElementById('msg');
        const btn = document.getElementById('btn');
        const slider = document.getElementById('strengthSlider');
        const sliderVal = document.getElementById('strengthVal');

        // 滑块数值显示
        slider.oninput = () => sliderVal.innerText = slider.value;

        fileIn.onchange = e => {
            const f = e.target.files[0];
            if(f) {
                imgOrigin.src = URL.createObjectURL(f);
                imgOrigin.classList.add('show');
            }
        };

        async function run() {
            if(!fileIn.files[0]) return alert("请先上传图片");
            if(!document.getElementById('promptIn').value) return alert("请输入描述");
            
            btn.disabled = true;
            btn.innerText = "AI 正在重绘 (约 5-10秒)...";
            msg.innerText = "正在上传并计算...";
            imgResult.classList.remove('show');

            try {
                const buf = await fileIn.files[0].arrayBuffer();
                const uint8 = Array.from(new Uint8Array(buf));

                const res = await fetch("", { // 请求当前 Worker
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: document.getElementById('promptIn').value,
                        image: uint8,
                        strength: parseFloat(slider.value) // 传回滑块的值
                    })
                });
                
                if(!res.ok) throw new Error(await res.text());
                
                const blob = await res.blob();
                imgResult.src = URL.createObjectURL(blob);
                imgResult.classList.add('show');
                msg.innerText = "✨ 生成完成！如果不满意，试着调整一下滑块。";

            } catch(e) {
                console.error(e);
                msg.innerText = "❌ 失败: " + e.message;
            } finally {
                btn.disabled = false;
                btn.innerText = "开始生成";
            }
        }
    </script>
</body>
</html>
`;

export default {
  async fetch(request, env) {
    if (request.method === 'GET') {
      return new Response(HTML_CONTENT, {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      });
    }

    if (request.method === 'POST') {
      try {
        const data = await request.json();
        
        // 1. 强力负向提示词 (Negative Prompt)
        // 这是提升画质的关键！告诉 AI 排除这些低质量特征。
        const NEGATIVE_PROMPT = "blurry, low quality, distortion, deformed hands, ugly face, extra fingers, bad anatomy, long neck, watermark, text, signature, bad proportions, mutation, mutated, gross proportions, duplicate, cropped, worst quality, lowres, jpeg artifacts";

        // 2. 优化正向提示词
        const finalPrompt = `${data.prompt}, masterpiece, best quality, 8k resolution, photorealistic, highly detailed, cinematic lighting, sharp focus, hdr`;

        const inputs = {
          prompt: finalPrompt,
          negative_prompt: NEGATIVE_PROMPT, // 👈 注入负向提示词
          image: data.image,
          strength: data.strength || 0.6,   // 👈 使用前端传来的滑块值
          guidance: 7.5,                    // 7-8 是最稳的范围
          num_steps: 20                     // 步数，v1.5 默认通常是 20，设多也没用
        };

        const ai = new Ai(env.AI);
        const response = await ai.run('@cf/runwayml/stable-diffusion-v1-5-img2img', inputs);

        return new Response(response, {
          headers: { 'Content-Type': 'image/png' },
        });

      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    return new Response('Method Not Allowed', { status: 405 });
  },
};
