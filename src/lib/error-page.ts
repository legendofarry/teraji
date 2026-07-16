export function renderErrorPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Something went wrong</title>

<style>
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

:root{
    --bg1:#0f172a;
    --bg2:#1e293b;
    --glass:rgba(255,255,255,.08);
    --border:rgba(255,255,255,.15);
    --text:#ffffff;
    --muted:rgba(255,255,255,.72);
    --accent:#6366f1;
    --accent2:#8b5cf6;
}

body{
    min-height:100vh;
    overflow:hidden;
    display:flex;
    justify-content:center;
    align-items:center;
    font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    color:var(--text);
    background:
        radial-gradient(circle at top left,#4338ca 0%,transparent 40%),
        radial-gradient(circle at bottom right,#7c3aed 0%,transparent 35%),
        linear-gradient(135deg,var(--bg1),var(--bg2));
    position:relative;
}

/* Animated background */

body::before,
body::after{
    content:"";
    position:absolute;
    width:520px;
    height:520px;
    border-radius:50%;
    filter:blur(90px);
    opacity:.45;
    animation:float 16s ease-in-out infinite;
}

body::before{
    background:#4f46e5;
    left:-180px;
    top:-180px;
}

body::after{
    background:#9333ea;
    right:-180px;
    bottom:-180px;
    animation-delay:-8s;
}

@keyframes float{
    0%,100%{
        transform:translate(0,0) scale(1);
    }
    50%{
        transform:translate(60px,-40px) scale(1.15);
    }
}

/* Card */

.card{
    position:relative;
    z-index:2;
    width:min(92%,520px);
    padding:56px;
    border-radius:28px;
    background:var(--glass);
    border:1px solid var(--border);
    backdrop-filter:blur(25px);
    text-align:center;
    overflow:hidden;
    box-shadow:
        0 30px 80px rgba(0,0,0,.45),
        inset 0 1px 0 rgba(255,255,255,.08);
}

/* Shimmer */

.card::before{
    content:"";
    position:absolute;
    inset:0;
    background:
        linear-gradient(
            120deg,
            transparent 0%,
            rgba(255,255,255,.08) 50%,
            transparent 100%);
    transform:translateX(-100%);
    animation:shine 5s linear infinite;
}

@keyframes shine{
    to{
        transform:translateX(200%);
    }
}

/* Icon */

.icon{
    width:92px;
    height:92px;
    margin:auto;
    margin-bottom:28px;
    border-radius:50%;
    display:grid;
    place-items:center;
    background:linear-gradient(135deg,var(--accent),var(--accent2));
    box-shadow:
        0 0 45px rgba(99,102,241,.55);
    animation:pulse 2.2s infinite;
}

.icon svg{
    width:42px;
    height:42px;
    stroke:white;
}

@keyframes pulse{
    0%,100%{
        transform:scale(1);
        box-shadow:0 0 40px rgba(99,102,241,.45);
    }
    50%{
        transform:scale(1.08);
        box-shadow:0 0 65px rgba(139,92,246,.8);
    }
}

h1{
    font-size:34px;
    font-weight:700;
    letter-spacing:-.03em;
    margin-bottom:14px;
}

p{
    color:var(--muted);
    font-size:16px;
    line-height:1.7;
    margin-bottom:34px;
}

/* Buttons */

.actions{
    display:flex;
    justify-content:center;
    gap:16px;
    flex-wrap:wrap;
}

button,
a{
    position:relative;
    overflow:hidden;
    border:none;
    outline:none;
    cursor:pointer;
    text-decoration:none;
    padding:14px 24px;
    border-radius:14px;
    font-weight:600;
    transition:.35s;
    font-size:15px;
}

.primary{
    color:white;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    box-shadow:0 10px 35px rgba(99,102,241,.45);
}

.primary:hover{
    transform:translateY(-4px);
    box-shadow:0 18px 50px rgba(99,102,241,.65);
}

.secondary{
    color:white;
    background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.12);
}

.secondary:hover{
    background:rgba(255,255,255,.12);
    transform:translateY(-4px);
}

/* Floating particles */

.particle{
    position:absolute;
    width:8px;
    height:8px;
    background:white;
    opacity:.18;
    border-radius:50%;
    animation:particle linear infinite;
}

@keyframes particle{
    from{
        transform:translateY(0);
    }
    to{
        transform:translateY(-120vh);
    }
}

@media(max-width:600px){

.card{
    padding:36px 24px;
}

h1{
    font-size:28px;
}

.actions{
    flex-direction:column;
}

button,
a{
    width:100%;
}

}
</style>
</head>

<body>

<div class="particle" style="left:10%;bottom:-20px;animation-duration:12s;"></div>
<div class="particle" style="left:25%;bottom:-30px;animation-duration:15s;"></div>
<div class="particle" style="left:42%;bottom:-10px;animation-duration:11s;"></div>
<div class="particle" style="left:60%;bottom:-50px;animation-duration:18s;"></div>
<div class="particle" style="left:75%;bottom:-25px;animation-duration:14s;"></div>
<div class="particle" style="left:90%;bottom:-35px;animation-duration:13s;"></div>

<div class="card">

<div class="icon">
<svg fill="none" viewBox="0 0 24 24" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round"
d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/>
</svg>
</div>

<h1>Oops! Something broke.</h1>

<p>
The page couldn't be loaded right now. This is usually temporary.
Try refreshing the page or head back to the home screen.
</p>

<div class="actions">
<button class="primary" onclick="location.reload()">
Try Again
</button>

<a href="/" class="secondary">
Go Home
</a>
</div>

</div>

</body>
</html>`;
}