import {calendarWeeks} from './calendar.mjs';
const $ = id => document.getElementById(id);
const monthNames = Array.from({length:12}, (_,i) => new Intl.DateTimeFormat('en',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,i,1))));
const weekdays = [['Sunday','Domingo','星期日'],['Monday','Lunes','星期一'],['Tuesday','Martes','星期二'],['Wednesday','Miércoles','星期三'],['Thursday','Jueves','星期四'],['Friday','Viernes','星期五'],['Saturday','Sábado','星期六']];
const grades = [['TK–1st Grade','TK–1er grado','过渡幼儿园至一年级'],['2nd–3rd Grade','2.º–3.er grado','二至三年级'],['4th–5th Grade','4.º–5.º grado','四至五年级']];
let state = {month:10,year:2026,design:'classic',goals:[250,450,650],events:{}};
try {const saved=JSON.parse(localStorage.getItem('roadrunner-calendar')); if(saved && Number.isInteger(saved.month) && saved.month>=0 && saved.month<12 && Number.isInteger(saved.year) && saved.year>=1900 && saved.year<=2100 && ['classic','roomy'].includes(saved.design) && Array.isArray(saved.goals) && saved.goals.length===3 && saved.goals.every(v=>Number.isInteger(v)&&v>=0) && saved.events && typeof saved.events==='object') state=saved;} catch {}
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines = texts => texts.map((text,i)=>`<span lang="${['en','es','zh-Hans'][i]}">${escape(text)}</span>`).join('');
function save(){try{localStorage.setItem('roadrunner-calendar',JSON.stringify(state));}catch{$('save-status').textContent='Browser storage is unavailable. Keep this tab open to retain your settings.';}}
function render(){
 const date=new Date(Date.UTC(state.year,state.month,1)); const es=new Intl.DateTimeFormat('es',{month:'long',timeZone:'UTC'}).format(date);
 const weeks=calendarWeeks(state.year,state.month); const key=`${state.year}-${state.month}`; const events=state.events[key]||{};
 $('event-day').max=Math.max(...weeks.flat().filter(Boolean));
 $('calendar').className=state.design;
 $('design-description').textContent=state.design==='classic'?'Original structure: Sunday-first grid, goals on the right, and name fields below. Three languages are stacked within each section.':'A small layout shift: reading goals sit below the full-width grid, with one column per grade group and more writing space.';
 $('calendar').innerHTML=`<div class="paper-heading"><div class="bird" aria-hidden="true">🐦</div><div>${lines([`${monthNames[state.month]} ${state.year} Roadrunner Reading Calendar`,`Calendario de lectura de Roadrunner de ${es} de ${state.year}`,`${state.year}年${state.month+1}月 Roadrunner 阅读日历`])}</div><div class="bird" aria-hidden="true">🐦</div></div><div class="calendar-body"><table><thead><tr>${weekdays.map(d=>`<th scope="col">${lines(d)}</th>`).join('')}</tr></thead><tbody>${weeks.map(w=>`<tr>${w.map(day=>`<td class="${day?'':'empty'}">${day?`<span class="date">${day}</span><div class="day-note">${lines(Array.isArray(events[day])?events[day]:[])}</div>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table><section class="goals"><h2>${lines(['Reading minutes goal','Objetivo de minutos de lectura','阅读时长目标'])}</h2><div class="goal-groups">${grades.map((g,i)=>`<div class="goal">${lines(g)}<strong>${state.goals[i]} <small>min / minutos / 分钟</small></strong></div>`).join('')}</div></section></div><footer class="paper-footer"><div>${lines(['Total minutes read','Minutos totales leídos','阅读总分钟数'])}<span class="blank"></span></div><div>${lines(['Teacher name','Nombre del maestro/a','教师姓名'])}<span class="blank"></span></div><div>${lines(['Student name','Nombre del estudiante','学生姓名'])}<span class="blank"></span></div></footer>`;
 $('event-list').innerHTML=Object.entries(events).sort((a,b)=>a[0]-b[0]).map(([day,texts])=>`<div class="event-item"><span><b>${day}</b> ${escape(texts[0])}</span><button type="button" data-remove="${day}" aria-label="Remove note for day ${day}">×</button></div>`).join('');
 save();
}
$('month').innerHTML=monthNames.map((m,i)=>`<option value="${i}">${m}</option>`).join('');
$('month').value=state.month; $('year').value=state.year; $('design').value=state.design;
document.querySelectorAll('.goal-input').forEach(input=>{input.value=state.goals[input.dataset.index];input.addEventListener('input',()=>{if(input.value!==''&&input.checkValidity()){state.goals[input.dataset.index]=Number(input.value);render();}});});
$('month').addEventListener('change',()=>{state.month=Number($('month').value);render();});
$('year').addEventListener('input',()=>{if($('year').value!==''&&$('year').checkValidity()){state.year=Number($('year').value);render();}});
$('design').addEventListener('change',()=>{state.design=$('design').value;render();});
$('event-form').addEventListener('submit',e=>{e.preventDefault();const key=`${state.year}-${state.month}`;state.events[key]??={};state.events[key][Number($('event-day').value)]=[$('event-en').value,$('event-es').value,$('event-zh').value];render();});
$('event-list').addEventListener('click',e=>{const button=e.target.closest('[data-remove]');if(button){delete state.events[`${state.year}-${state.month}`][button.dataset.remove];render();}});
$('print').addEventListener('click',()=>window.print());
render();
