import { Ai } from '@cloudflare/ai';

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DreamCatcher Ultra (SDXL)</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #0f0f12; color: #e0e0e0; }
        .container { background: #1e1e24; padding: 2rem; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid #333; }
        h1 { text-align: center; margin-bottom: 0.5rem; background: linear-gradient(135deg, #00c6ff, #0072ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2rem; }
        p.subtitle { text-align: center; color: #888; margin-bottom: 2rem; font-size: 0.9rem; }
        
        .row { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #bbb; letter-spacing: 0.5px; }
        
        input[type="text"] { width: 100%; padding: 14px; border: 1px solid #444; border-radius: 8px; box-sizing: border-box; background: #2a2a32; color: white; font-size: 1rem; transition: border-color 0.3s; }
        input[type="text"]:focus { border-color: #0072ff; outline: none; }
        
        input[type="file"] { width: 100%; padding: 12px; background: #2a2a32; border-radius: 8px; border: 1px dashed #555; cursor: pointer; }
        
        /* 滑块高级样式 */
        .slider-container { display: flex; align-items: center; gap: 15px; background: #2a2a32; padding: 10px 15px; border-radius: 8px; }
        input[type="range"] { flex: 1; height: 6px; background: #444; border-radius: 3px; outline: none; -webkit-appearance: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #0072ff; border-radius: 50%; cursor: pointer; transition: transform 0.1s; }
        input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .value-display { font-family: monospace; font-size: 1.1rem; color: #00c6ff; width: 40px; text-align: right; }
        
        [...](asc_slot://start-slot-3)button { width: 100%; padding: 16px; background: linear-gradient(135deg, #00c6ff, #0072ff); color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: all 0.2s; margin-top: 10px; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3); }
        button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 114, 255, 0.5); }
        button:disabled { background: #444; color: #888; transform: none; box-shadow: none; cursor: not-allowed; }
        
        #msg { text-align: center; margin-top: 20px; color: #888; min-height: 24px; font-size: 0.95rem; }
        
        .preview { display: flex; gap: 20px; margin-top: 30px; flex-wrap: wrap; justify-content: center; }
        .box { flex: 1; min-width: 350px; background: #18181b; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #333; }
        .box p { color: #666; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }
        img { width: 100%; border-radius: 8px; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        img.show { display: block; animation: fadeIn 0.5s ease; }
        
        [...](asc_slot://start-slot-5)@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="container">
        <h1>✨ DreamCatcher Ultra</h1>
        <p class="subtitle">Powered by Stable Diffusion XL (SDXL)</p>

        <div class="row">
            <label>1. 上传照片 (自动优化为 1024px)</label>
            <input type="file" id="fileIn" accept="image/*">
        </div>

        <div class="row">
            <label>2. 梦境描述 (SDXL 对短语理解更好)</label>
            <input type="text" id="promptIn" value="cyberpunk city, neon lights, cinematic lighting, 8k, masterpiece" placeholder="Prompt...">
        </div>

        <div class="row">
            <label>3. 重绘幅度 (Strength)</label>
            <div class="slider-container">
                <span style="font-size:0.8rem; color:#888;">微调</span>
                <input type="range" id="strengthSlider" min="0.1" max="0.9" step="0.05" value="0.6">
                <span style="font-size:0.8rem; color:#888;">重造</span>
                <span id="strengthVal" class="value-display">0.6</span>
            </div>
            <p style="font-size: 0.75rem; color: #666; margin-top: 8px; margin-left: 5px;">
                💡 推荐值: 0.5-0.7。SDXL 的 0.6 相当于旧版的 0.5，更智能。
            </p>
        </div>
        
        <button id="btn" onclick="run()">🚀 启动 SDXL 引擎</button>
        <p id="msg"></p>

        <div class="preview">
            <div class="box"><p>Pre-processed (1024px)</p><img id="imgOrigin"></div>
            <div class="box"><p>SDXL Result</p><img id="imgResult"></div>
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
        let processedBlob = null;

        slider.oninput = () => sliderVal.innerText = slider.value;

        fileIn.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 🔥 SDXL 核心升级：使用 1024x1024 分辨率
                    const TARGET_SIZE = 1024;
                    canvas.width = TARGET_SIZE;
                    canvas.height = TARGET_SIZE;

                    // 智能裁剪 (Cover模式)
                    const minScale = Math.max(TARGET_SIZE / img.width, TARGET_SIZE / img.height);
                    const w = img.width * minScale;
                    const h = img.height * minScale;
                    const x = (TARGET_SIZE - w) / 2;
                    const y = (TARGET_SIZE - h) / 2;

                    ctx.fillStyle = "#1e1e24";
                    ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
                    ctx.drawImage(img, x, y, w, h);

                    canvas.toBlob((blob) => {
                        processedBlob = blob;
                        imgOrigin.src = URL.createObjectURL(blob);
                        imgOrigin.classList.add('show');
                        msg.innerText = "✅ 影像已升级为 SDXL 标准 (1024px)";
                    }, 'image/jpeg', 0.95); // 提高 JPEG 质量
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };

        async function run() {
            if(!processedBlob) return alert("请先上传图片");
            if(!document.getElementById('promptIn').value) return alert("请输入描述");
            
            btn.disabled = true;
            btn.innerText = "SDXL 渲染中 (需 15-20秒)...";
            msg.innerText = "正在调用 Cloudflare SDXL Base 1.0 模型...";
            imgResult.classList.remove('show');

            try {
                const buf = await processedBlob.arrayBuffer();
                const uint8 = Array.from(new Uint8Array(buf));

                const res = await fetch("", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: document.getElementById('promptIn').value,
                        image: uint8,
                        strength: parseFloat(slider.value)
                    })
                });
                
                if(!res.ok) throw new Error(await res.text());
                
                const blob = await res.blob();
                imgResult.src = URL.createObjectURL(blob);
                imgResult.classList.add('show');
                msg.innerText = "✨ SDXL 渲染完成！";

            } catch(e) {
                console.error(e);
                msg.innerText = "❌ Error: " + e.message;
            } finally {
                btn.disabled = false;
                btn.innerText = "🚀 再次启动";
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
        const ai = new Ai(env.AI);

        // 🟢 使用更先进的 SDXL 模型
        const MODEL_ID = '@cf/stabilityai/stable-diffusion-xl-base-1.0';

        const inputs = {
          // SDXL 只需要简单的 Prompt 就能理解得很好
          prompt: data.prompt + ", masterpiece, cinematic lighting, 8k, photorealistic", 
          image: data.image,
          strength: data.strength,
          
          // SDXL 不需要像 v1.5 那样写几百个负面词，简单的就够了
          negative_prompt: "blurry, distortion, low quality, ugly, deformed",
          
          // SDXL 推荐参数
          guidance: 7.5,
          num_steps: 20
        };

        const response = await ai.run(MODEL_ID, inputs);

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
