import { Ai } from '@cloudflare/ai';

// ==========================================
// 1. 定义前端网页 (HTML/CSS/JS)
// 我们把整个 index.html 的内容打包成一个字符串放在这里
// ==========================================
const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DreamCatcher AI</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f0f2f5; color: #333; }
        .container { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        h1 { text-align: center; margin-bottom: 0.5rem; }
        p.subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
        .row { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        input[type="text"], input[type="file"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #0070f3; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; transition: background 0.2s; }
        button:hover { background: #005bb5; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        #msg { text-align: center; margin-top: 15px; color: #555; min-height: 20px; }
        .preview { display: flex; gap: 20px; margin-top: 30px; flex-wrap: wrap; }
        .box { flex: 1; min-width: 300px; text-align: center; }
        img { max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: none; }
        img.show { display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌙 DreamCatcher</h1>
        <p class="subtitle">All-in-One Cloudflare Worker Demo</p>

        <div class="row">
            <label>1. 上传一张头像</label>
            <input type="file" id="fileIn" accept="image/*">
        </div>
        <div class="row">
            <label>2. 描述梦境 (英文推荐)</label>
            <input type="text" id="promptIn" placeholder="e.g. wearing a spacesuit on Mars">
        </div>
        
        <button id="btn" onclick="run()">开始生成</button>
        <p id="msg"></p>

        <div class="preview">
            <div class="box"><p>原图</p><img id="imgOrigin"></div>
            <div class="box"><p>生成结果</p><img id="imgResult"></div>
        </div>
    </div>

    <script>
        // 关键点：因为网页和API在同一个地方，URL直接留空，浏览器会自动请求当前地址
        const WORKER_URL = ""; 

        const fileIn = document.getElementById('fileIn');
        const imgOrigin = document.getElementById('imgOrigin');
        const imgResult = document.getElementById('imgResult');
        const msg = document.getElementById('msg');
        const btn = document.getElementById('btn');

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
            btn.innerText = "正在编织梦境...";
            msg.innerText = "AI 正在绘图，约需 5-10 秒...";
            imgResult.classList.remove('show');

            try {
                const buf = await fileIn.files[0].arrayBuffer();
                const uint8 = Array.from(new Uint8Array(buf));

                // 发送 POST 请求给当前 URL
                const res = await fetch(WORKER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: document.getElementById('promptIn').value,
                        image: uint8
                    })
                });
                
                if(!res.ok) throw new Error(await res.text());
                
                const blob = await res.blob();
                imgResult.src = URL.createObjectURL(blob);
                imgResult.classList.add('show');
                msg.innerText = "✨ 生成成功！";

            } catch(e) {
                console.error(e);
                alert("出错啦: " + e.message);
                msg.innerText = "生成失败，请重试";
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
    // ==========================================
    // 2. 路由逻辑：根据请求类型分发
    // ==========================================
    
    // 如果是浏览器访问 (GET)，直接返回网页 HTML
    if (request.method === 'GET') {
      return new Response(HTML_CONTENT, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
        },
      });
    }

    // 如果是 POST 请求，说明是前端在调用 AI
    if (request.method === 'POST') {
      try {
        const requestData = await request.json();
        const userPrompt = requestData.prompt;
        const imageArray = requestData.image;

        if (!userPrompt || !imageArray) {
          return new Response('Missing prompt or image', { status: 400 });
        }

        const ai = new Ai(env.AI);
        const refinedPrompt = `${userPrompt}, photorealistic, cinematic lighting, highly detailed face, 8k resolution, masterpiece, raw photo`;

        const inputs = {
          prompt: refinedPrompt,
          image: imageArray,
          strength: 0.6,
          guidance: 7.5
        };

        const response = await ai.run('@cf/runwayml/stable-diffusion-v1-5-img2img', inputs);

        return new Response(response, {
          headers: { 'Content-Type': 'image/png' },
        });

      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    // 其他请求方式
    return new Response('Method Not Allowed', { status: 405 });
  },
};
