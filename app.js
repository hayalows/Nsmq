const D = window.NSMQ_DATA;
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>[...document.querySelectorAll(s)];

function canonical(n){
  const map={"Presbyterian Boys' Secondary, Legon":"PRESEC, Legon","Presbyterian Boys' Secondary School":"PRESEC, Legon","Ghana Secondary Technical School (GSTS)":"GSTS"};
  return map[n]||n;
}
const champs=D.champions.map(x=>({...x,winner:x.winner&&canonical(x.winner),runner:x.runner.map(canonical)}));

function titleCounts(){
  const m={};
  champs.filter(x=>x.winner).forEach(x=>m[x.winner]=(m[x.winner]||0)+1);
  return m;
}
function finalistCounts(since=1994){
  const m={};
  champs.filter(x=>x.year>=since&&x.winner).forEach(x=>{
    [x.winner,...x.runner].forEach((s,i)=>m[s]=(m[s]||0)+(i===0?1.25:1));
  });
  return m;
}
function recentForm(){
  const m={};
  D.finals.forEach(f=>f.schools.forEach((s,i)=>{
    const final=s.rounds[4]??0;
    const seasonWeight=Math.exp(-(2025-f.year)/4);
    m[s.name]=(m[s.name]||0)+seasonWeight*(final/10 + (i===0?2:0));
  }));
  return m;
}
const titles=titleCounts(), finals10=finalistCounts(2016), form=recentForm();
const allSchools=[...new Set(champs.flatMap(x=>[x.winner,...x.runner]).filter(Boolean))].sort();

function strength(name){
  const t=titles[name]||0, f=finals10[name]||0, r=form[name]||0;
  const recency = Math.max(...champs.filter(x=>x.winner===name).map(x=>x.year), 1990);
  const recencyScore=Math.max(0,(recency-2010)/15);
  return 100 + 14*t + 7*f + 5*r + 10*recencyScore;
}
function softmax(names){
  const max=Math.max(...names.map(strength));
  const raw=names.map(n=>Math.exp((strength(n)-max)/22));
  const sum=raw.reduce((a,b)=>a+b,0);
  return names.map((n,i)=>({name:n,p:raw[i]/sum,score:strength(n)})).sort((a,b)=>b.p-a.p);
}
function pct(n){return `${(n*100).toFixed(1)}%`}

function renderMetrics(){
  const schools=new Set(champs.flatMap(x=>[x.winner,...x.runner]).filter(Boolean)).size;
  $("#metrics").innerHTML=[
    ["30","championship seasons","1994–2025, excluding two no-contest years"],
    [String(schools),"finalist schools","represented in official history"],
    [String(D.finals.length),"detailed finals","round-level coverage in this build"],
    [String(D.sources.length),"core sources","primary and high-trust secondary"]
  ].map(x=>`<div class="metric"><strong>${x[0]}</strong><span>${x[1]}</span><small>${x[2]}</small></div>`).join("");
}
function renderArchive(){
  $("#archive").innerHTML=champs.slice().reverse().map(x=>`<article class="year-card ${!x.winner?'muted':''}">
    <div class="year">${x.year}</div>
    <div><b>${x.winner||x.note}</b>${x.runner.length?`<p>${x.runner.join(" · ")}</p>`:""}</div>
  </article>`).join("");
}
function renderFinals(){
  const select=$("#yearSelect");
  select.innerHTML=D.finals.slice().reverse().map(f=>`<option>${f.year}</option>`).join("");
  const draw=()=>{
    const f=D.finals.find(x=>x.year===+select.value);
    $("#quality").textContent=f.quality==="verified"?"Verified round data":"Partial round data";
    $("#quality").className=`pill ${f.quality}`;
    const roundNames=["General","Speed","Problem","True/False","Riddles"];
    $("#finalPanel").innerHTML=`
      <div class="score-grid">
        ${f.schools.map((s,i)=>`<div class="score-card ${i===0?'winner':''}">
          <div class="rank">${i===0?'Champion':i===1?'Runner-up':'Third'}</div>
          <h3>${s.name}</h3>
          <div class="final-score">${s.rounds[4]??"—"}<span>pts</span></div>
          <div class="rounds">${roundNames.map((r,j)=>`<span><i>${r}</i><b>${s.rounds[j]??"—"}</b></span>`).join("")}</div>
        </div>`).join("")}
      </div>
      ${f.note?`<div class="data-note">${f.note}</div>`:""}
      ${f.contestants?.length?`<div class="contestants"><h3>Named contestants / substitutions in source</h3>${f.contestants.map(c=>`<p><b>${c.school}:</b> ${c.names.join(", ")} <span>${c.note}</span></p>`).join("")}</div>`:""}
      <p class="source-line">Source basis: ${f.source}</p>`;
  };
  select.onchange=draw; draw();
}
function renderRankings(){
  const rows=allSchools.map(n=>({n,s:strength(n),t:titles[n]||0,f:finals10[n]||0})).sort((a,b)=>b.s-a.s).slice(0,12);
  $("#rankings").innerHTML=rows.map((r,i)=>`<div class="rank-row"><span class="num">${i+1}</span><div><b>${r.n}</b><small>${r.t} titles · ${r.f.toFixed(2)} weighted finalist appearances since 2016</small></div><strong>${r.s.toFixed(0)}</strong></div>`).join("");
}
function setupForecast(){
  const sels=["#schoolA","#schoolB","#schoolC"].map($);
  sels.forEach(s=>s.innerHTML=allSchools.map(n=>`<option>${n}</option>`).join(""));
  sels[0].value="PRESEC, Legon"; sels[1].value="Mfantsipim School"; sels[2].value="Prempeh College";
  const run=()=>{
    const names=[...new Set(sels.map(s=>s.value))];
    if(names.length<3){$("#forecastResult").innerHTML='<div class="data-note">Choose three different schools.</div>';return;}
    const res=softmax(names);
    $("#forecastResult").innerHTML=res.map((r,i)=>`<div class="forecast-row"><div><span>${i+1}</span><b>${r.name}</b></div><div class="bar"><i style="width:${r.p*100}%"></i></div><strong>${pct(r.p)}</strong></div>`).join("")+`<p class="model-note">Exploratory probability, not a claim about the next draw. It currently weights historical titles, recent finalist frequency, recent final scores and championship recency. It does not yet include contestant-level form, draw difficulty, regional qualifiers or question-topic strength.</p>`;
  };
  sels.forEach(s=>s.onchange=run); $("#runForecast").onclick=run; run();
}
function renderSources(){
  $("#sources").innerHTML=D.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener"><span>${s.tier}</span><b>${s.label}</b><i>↗</i></a>`).join("");
}
function tabs(){
  $$(".nav button").forEach(b=>b.onclick=()=>{
    $$(".nav button").forEach(x=>x.classList.remove("active")); b.classList.add("active");
    document.querySelector(b.dataset.target).scrollIntoView({behavior:"smooth",block:"start"});
  });
}
renderMetrics(); renderArchive(); renderFinals(); renderRankings(); setupForecast(); renderSources(); tabs();