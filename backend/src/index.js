import { Ai } from '@cloudflare/ai';

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DreamCatcher Ultimate (SDXL Fix)</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #0f0f12; color: #e0e0e0; }
        .container { background: #1e1e24; padding: 2rem; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid #333; }
        h1 { text-align: center; margin-bottom: 2rem; background: linear-gradient(135deg, #00c6ff, #0072ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2rem; }
        
        .tabs { display: flex; margin-bottom: 2rem; border-bottom: 2px solid #333; }
        .tab-btn { flex: 1; padding: 15px; background: none; border: none; color: #888; font-size: 1rem; cursor: pointer; transition: all 0.3s; font-weight: bold; }
        .tab-btn:hover { color: #ccc; background: #2a2a32; }
        .tab-btn.active { color: #0072ff; border-bottom: 2px solid #0072ff; background: #25252b; }
        
        .tab-content { display: none; animation: fadeIn 0.3s ease; }
        .tab-content.active { display: block; }
        
        .row { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #bbb; letter-spacing: 0.5px; }
        
        input[type="text"], textarea { width: 100%; padding: 14px; border: 1px solid #444; border-radius: 8px; box-sizing: border-box; background: #2a2a32; color: white; font-size: 1rem; transition: border-color 0.3s; }
        input[type="text"]:focus, textarea:focus { border-color: #0072ff; outline: none; }
        
        input[type="file"] { width: 100%; padding: 12px; background: #2a2a32; border-radius: 8px; border: 1px dashed #555; cursor: pointer; }
        
        .slider-container { display: flex; align-items: center; gap: 15px; background: #2a2a32; padding: 10px 15px; border-radius: 8px; }
        input[type="range"] { flex: 1; height: 6px; background: #444; border-radius: 3px; outline: none; -webkit-appearance: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #0072ff; border-radius: 50%; cursor: pointer; }
        .value-display { font-family: monospace; font-size: 1.1rem; color: #00c6ff; width: 40px; text-align: right; }
        
        button { width: 100%; padding: 16px; background: linear-gradient(135deg, #00c6ff, #0072ff); color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: all 0.2s; margin-top: 10px; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3); }
        button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 114, 255, 0.5); }
        button:disabled { background: #444; color: #888; transform: none; box-shadow: none; cursor: not-allowed; }
        
        #msg { text-align: center; margin-top: 20px; color: #888; min-height: 24px; font-size: 0.95rem; }
        
        .preview { display: flex; gap: 20px; margin-top: 30px; flex-wrap: wrap; justify-content: center; }
        .box { flex: 1; min-width: 350px; background: #18181b; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #333; }
        .box p { color: #666; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }
        img { width: 100%; border-radius: 8px; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        img.show { display: block; animation: fadeIn 0.5s ease; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="container">
        <h1>✨ DreamCatcher Ultimate</h1>
        
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('img2img')">📷 Img2Img (SDXL Lightning)</button>
            <button class="tab-btn" onclick="switchTab('txt2img')">🎨 Txt2Img (FLUX Schnell)</button>
        </div>

        <!-- Tab 1: Img2Img (SDXL Lightning) -->
        <div id="tab-img2img" class="tab-content active">
            <div class="row">
                <label>1. 上传参考图 (自动裁剪 1024px)</label>
                <input type="file" id="fileIn" accept="image/*">
            </div>
            <div class="row">
                <label>2. 描述画面 (英文)</label>
                <input type="text" id="promptImg" placeholder="e.g. wearing a spacesuit on Mars">
            </div>
            <div class="row">
                <label>3. 重绘幅度 (Strength)</label>
                <div class="slider-container">
                    <span style="font-size:0.8rem; color:#888;">微调</span>
                    <input type="range" id="strengthSlider" min="0.1" max="0.9" step="0.05" value="0.5">
                    <span id="strengthVal" class="value-display">0.5</span>
                </div>
            </div>
            <button id="btnImg" onclick="runImg2Img()">⚡ SDXL 启动 (图生图)</button>
        </div>

        <!-- Tab 2: Txt2Img (FLUX) -->
        <div id="tab-txt2img" class="tab-content">
            <div class="row">
                <label>1. 详细描述你的梦境 (FLUX)</label>
                <textarea id="promptTxt" rows="4" placeholder="A cinematic shot of a cyberpunk city at night..."></textarea>
            </div>
            <button id="btnTxt" onclick="runTxt2Img()">🚀 FLUX 启动</button>
        </div>
        
        <p id="msg"></p>

        <div class="preview">
            <div class="box" id="boxOrigin"><p>原图预览</p><img id="imgOrigin"></div>
            <div class="box"><p>生成结果</p><img id="imgResult"></div>
        </div>
    </div>

    <script>
        function switchTab(mode) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            if(mode === 'img2img') {
                document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
                document.getElementById('tab-img2img').classList.add('active');
                document.getElementById('boxOrigin').style.display = 'block'; 
            } else {
                document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
                document.getElementById('tab-txt2img').classList.add('active');
                document.getElementById('boxOrigin').style.display = 'none'; 
            }
            document.getElementById('msg').innerText = "";
        }

        const fileIn = document.getElementById('fileIn');
        const imgOrigin = document.getElementById('imgOrigin');
        const imgResult = document.getElementById('imgResult');
        const msg = document.getElementById('msg');
        const slider = document.getElementById('strengthSlider');
        const sliderVal = document.getElementById('strengthVal');
        let processedBlob = null;

        slider.oninput = () => sliderVal.innerText = slider.value;

        // 图片预处理 (SDXL Lightning 支持 1024px)
        fileIn.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    // 升级到 1024px
                    const SIZE = 1024;
                    canvas.width = SIZE; canvas.height = SIZE;
                    const minScale = Math.max(SIZE/img.width, SIZE/img.height);
                    const w = img.width*minScale; const h = img.height*minScale;
                    ctx.drawImage(img, (SIZE-w)/2, (SIZE-h)/2, w, h);
                    canvas.toBlob(blob => {
                        processedBlob = blob;
                        imgOrigin.src = URL.createObjectURL(blob);
                        imgOrigin.classList.add('show');
                    }, 'image/jpeg', 0.95);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };

        async function sendRequest(payload) {
            const res = await fetch("", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if(!res.ok) throw new Error(await res.text());
            
            const json = await res.json();
            if (json.image) {
                return "data:image/png;base64," + json.image;
            } else {
                throw new Error("No image data returned");
            }
        }

        async function runImg2Img() {
            if(!processedBlob) return alert("请先上传图片");
            if(!document.getElementById('promptImg').value) return alert("请输入描述");
            
            const btn = document.getElementById('btnImg');
            btn.disabled = true;
            msg.innerText = "SDXL Lightning 正在重绘...";
            imgResult.classList.remove('show');

            try {
                // Blob 转 Base64
                const buf = await processedBlob.arrayBuffer();
                let binary = '';
                const bytes = new Uint8Array(buf);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
                const base64Img = btoa(binary);

                const imageUrl = await sendRequest({
                    type: 'img2img',
                    prompt: document.getElementById('promptImg').value,
                    image_base64: base64Img, // 关键：前端发送 Base64 字符串
                    strength: parseFloat(slider.value)
                });
                
                imgResult.src = imageUrl;
                imgResult.classList.add('show');
                msg.innerText = "✨ SDXL 生成成功！";
            } catch(e) { console.error(e); msg.innerText = "❌ Error: " + e.message; }
            finally { btn.disabled = false; }
        }

        async function runTxt2Img() {
            const prompt = document.getElementById('promptTxt').value;
            if(!prompt) return alert("请输入描述");
            
            const btn = document.getElementById('btnTxt');
            btn.disabled = true;
            msg.innerText = "FLUX 正在生成...";
            imgResult.classList.remove('show');

            try {
                const imageUrl = await sendRequest({
                    type: 'txt2img',
                    prompt: prompt
                });
                
                imgResult.src = imageUrl;
                imgResult.classList.add('show');
                msg.innerText = "🚀 FLUX 生成完毕！";
            } catch(e) { console.error(e); msg.innerText = "❌ Error: " + e.message; }
            finally { btn.disabled = false; }
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
        let finalBase64 = "";

        // ==========================================
        // 模式 1: Img2Img (SDXL Lightning)
        // 关键修正：使用 image_b64 参数！
        // ==========================================
        if (data.type === 'img2img') {
            const MODEL_ID = '@cf/bytedance/stable-diffusion-xl-lightning';
            
            const response = await ai.run(MODEL_ID, {
                prompt: data.prompt + ", masterpiece, 8k, photorealistic",
                // 🚀 这里是关键！我们不再解码，直接把前端发来的 Base64 字符串传给 image_b64
                image_b64: data.image_base64, 
                strength: data.strength || 0.5,
                num_steps: 20, 
                guidance: 7.5
            });
            
            // Lightning 返回的是二进制流 -> 需要转 Base64 返回给前端
            const arrayBuffer = await new Response(response).arrayBuffer();
            let binary = '';
            const bufferBytes = new Uint8Array(arrayBuffer);
            for (let i = 0; i < bufferBytes.byteLength; i++) binary += String.fromCharCode(bufferBytes[i]);
            finalBase64 = btoa(binary);
        }

        // ==========================================
        // 模式 2: Txt2Img (FLUX Schnell)
        // ==========================================
        else if (data.type === 'txt2img') {
            const MODEL_ID = '@cf/black-forest-labs/flux-1-schnell';
            const response = await ai.run(MODEL_ID, {
                prompt: data.prompt,
                num_steps: 4
            });
            
            if (response.image) {
                finalBase64 = response.image;
            } else {
                 throw new Error("FLUX response missing image data");
            }
        }
        else {
            return new Response('Invalid type', { status: 400 });
        }

        return new Response(JSON.stringify({ image: finalBase64 }), {
            headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Method Not Allowed', { status: 405 });
  },
};
