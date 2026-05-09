import{i as g,g as d}from"./theme.CeBQQ4cc.js";g();function h(r){const n=new Date(r),e=new Date().getTime()-n.getTime(),t=Math.floor(e/6e4),o=Math.floor(e/36e5),s=Math.floor(e/864e5);return t<1?"Just now":t<60?`${t}m ago`:o<24?`${o}h ago`:s<7?`${s}d ago`:s<30?`${Math.floor(s/7)}w ago`:s<365?`${Math.floor(s/30)}mo ago`:`${Math.floor(s/365)}y ago`}async function f(){const r=d(),e=(await(await fetch("/novels/index.json")).json()).novels.filter(s=>r[s.slug]).map(s=>({...s,progress:r[s.slug]})).sort((s,a)=>new Date(a.progress.lastReadAt).getTime()-new Date(s.progress.lastReadAt).getTime()),t=document.getElementById("history-list"),o=document.getElementById("empty-state");if(!(!t||!o)){if(e.length===0){t.style.display="none",o.style.display="flex";return}t.innerHTML=e.map((s,a)=>{const l=Math.round(s.progress.lastChapter/s.totalChapters*100),c=h(s.progress.lastReadAt);return`
        <a href="/novel/${s.slug}" class="history-item" style="animation-delay: ${a*40}ms">
          <img src="${s.cover}" alt="${s.title}" class="history-cover" loading="lazy" />
          <div class="history-info">
            <span class="history-title">${s.title}</span>
            <span class="history-chapter">Chapter ${s.progress.lastChapter} of ${s.totalChapters}</span>
            <div class="progress-bar-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${l}%"></div>
              </div>
            </div>
            <span class="history-date">${c}</span>
          </div>
          <svg class="chevron-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      `}).join("")}}f();
