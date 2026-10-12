import {calendarWeeks} from './calendar.mjs';
import {eventOccursOn, languages, localTranslation, splitEventByWeeks} from './translation.mjs';

const $ = id => document.getElementById(id);
const fieldIds = ['event-en', 'event-es', 'event-zh'];
const monthNames = Array.from({length:12}, (_,i) => new Intl.DateTimeFormat('en',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,i,1))));
const weekdays = [['Sunday','Domingo','星期日'],['Monday','Lunes','星期一'],['Tuesday','Martes','星期二'],['Wednesday','Miércoles','星期三'],['Thursday','Jueves','星期四'],['Friday','Viernes','星期五'],['Saturday','Sábado','星期六']];
const grades = [['TK–1st Grade','TK–1er Grado','TK至一年级'],['2nd–3rd Grade','2do - 3er Grado','二至三年级'],['4th–5th Grade','4to - 5to Grado','四至五年级']];
let state = {month:10,year:2026,design:'classic',goals:[250,450,650],events:{}};
try {const saved=JSON.parse(localStorage.getItem('roadrunner-calendar')); if(saved && Number.isInteger(saved.month) && saved.month>=0 && saved.month<12 && Number.isInteger(saved.year) && saved.year>=1900 && saved.year<=2100 && ['classic','roomy'].includes(saved.design) && Array.isArray(saved.goals) && saved.goals.length===3 && saved.goals.every(v=>Number.isInteger(v)&&v>=0) && saved.events && typeof saved.events==='object') state=saved;} catch {}

const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines = (texts, separator = '') => texts.map((text,i)=>`<span lang="${['en','es','zh-Hans'][i]}">${escape(text)}</span>`).join(separator);
const currentKey = () => `${state.year}-${state.month}`;
function save(){try{localStorage.setItem('roadrunner-calendar',JSON.stringify(state));}catch{$('save-status').textContent='Browser storage is unavailable. Keep this tab open to retain your settings.';}}

function monthEvents() {
  const key=currentKey(); const stored=state.events[key] || [];
  if (Array.isArray(stored)) return stored;
  const migrated=Object.entries(stored).map(([day,texts],i)=>({id:`legacy-${day}-${i}`,start:Number(day),end:Number(day),texts}));
  state.events[key]=migrated;
  return migrated;
}

async function translate(text, source, target) {
  const local=localTranslation(text,source,target);
  if (local) return local;
  if ('Translator' in window) {
    const options={sourceLanguage:source,targetLanguage:target};
    const availability=await window.Translator.availability(options);
    if (availability==='unavailable') throw new Error('Language pair unavailable');
    const translator=await window.Translator.create(options);
    return translator.translate(text);
  }
  if (window.translation?.createTranslator) {
    const translator=await window.translation.createTranslator({sourceLanguage:source,targetLanguage:target});
    return translator.translate(text);
  }
  throw new Error('Browser translation unavailable');
}

async function fillTranslations(sourceInput) {
  const text=sourceInput.value.trim();
  if (!text) return;
  const source=sourceInput.dataset.language;
  const targets=fieldIds.map(id=>$(id)).filter(input=>input!==sourceInput && !input.value.trim());
  if (!targets.length) return;
  $('translation-status').textContent='Translating…';
  let completed=0;
  await Promise.all(targets.map(async input=>{try {input.value=await translate(text,source,input.dataset.language); completed++;} catch {}}));
  $('translation-status').textContent=completed===targets.length?'Translations added—please review them.':'Some translations need to be entered manually.';
}

function eventMarkup(events, day) {
  return events.filter(event=>event.start===event.end && eventOccursOn(event,day)).map(event=>`<div class="event-note">${lines(event.texts)}</div>`).join('');
}

function positionEventBars(events, weeks) {
  const wrap=document.querySelector('.calendar-table-wrap'); const layer=document.querySelector('.event-bars');
  if (!wrap || !layer) return;
  layer.replaceChildren();
  const wrapRect=wrap.getBoundingClientRect();
  const occupied=weeks.map(()=>[]);
  events.filter(event=>event.end>event.start).forEach(event=>{
    splitEventByWeeks(event,weeks).forEach(segment=>{
      const startCell=wrap.querySelector(`[data-day="${segment.start}"]`); const endCell=wrap.querySelector(`[data-day="${segment.end}"]`);
      if (!startCell || !endCell) return;
      let lane=0; while (occupied[segment.weekIndex][lane]>=segment.start) lane++;
      occupied[segment.weekIndex][lane]=segment.end;
      const startRect=startCell.getBoundingClientRect(); const endRect=endCell.getBoundingClientRect();
      const bar=document.createElement('div'); bar.className='event-bar';
      bar.style.left=`${startRect.left-wrapRect.left+8}px`; bar.style.width=`${endRect.right-startRect.left-16}px`;
      bar.style.top=`${startRect.top-wrapRect.top+startRect.height*.43+lane*35}px`;
      bar.innerHTML=`<span class="bar-line"></span><div class="event-bar-label">${lines(event.texts)}</div><span class="bar-line bar-line-end">➜</span>`;
      layer.append(bar);
    });
  });
}

function render(){
 const date=new Date(Date.UTC(state.year,state.month,1)); const es=new Intl.DateTimeFormat('es',{month:'long',timeZone:'UTC'}).format(date);
 const weeks=calendarWeeks(state.year,state.month); const events=monthEvents(); const lastDay=Math.max(...weeks.flat().filter(Boolean));
 $('event-start').max=lastDay; $('event-end').max=lastDay;
 $('calendar').className=state.design;
 $('design-description').textContent=state.design==='classic'?'Original structure: Sunday-first grid, goals on the right, and name fields below. Three languages are stacked within each section.':'A small layout shift: reading goals sit below the full-width grid, with one column per grade group and more writing space.';
 $('calendar').innerHTML=`<div class="paper-heading"><div class="bird" aria-hidden="true">🐦</div><div>${lines([`${monthNames[state.month]} ${state.year} Roadrunner Reading Calendar`,`Calendario de lectura de Roadrunner de ${es} de ${state.year}`,`${state.year}年${state.month+1}月 Roadrunner 阅读日历`])}</div><div class="bird" aria-hidden="true">🐦</div></div><div class="calendar-body"><div class="calendar-table-wrap"><table><thead><tr>${weekdays.map(d=>`<th scope="col">${lines(d)}</th>`).join('')}</tr></thead><tbody>${weeks.map(w=>`<tr>${w.map(day=>`<td class="${day?'':'empty'}"${day?` data-day="${day}"`:''}>${day?`<span class="date">${day}</span><div class="day-note">${eventMarkup(events,day)}</div>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="event-bars" aria-hidden="true"></div></div><section class="goals"><h2>${lines(['Reading minutes goal','Objetivo de minutos de lectura','阅读时长目标'], ' | ')}</h2><div class="goal-groups">${grades.map((g,i)=>`<div class="goal">${lines(g)}<strong>${state.goals[i]} <small>min / minutos / 分钟</small></strong></div>`).join('')}</div></section></div><footer class="paper-footer"><div>${lines(['Total minutes read','Minutos totales leídos','阅读总分钟数'], ' | ')}<span class="blank"></span></div><div>${lines(['Teacher name','Nombre del maestro/a','教师姓名'], ' | ')}<span class="blank"></span></div><div>${lines(['Student name','Nombre del estudiante','学生姓名'], ' | ')}<span class="blank"></span></div></footer>`;
 $('event-list').innerHTML=events.slice().sort((a,b)=>a.start-b.start).map(event=>`<div class="event-item"><span><b>${event.start}${event.end!==event.start?`–${event.end}`:''}</b> ${escape(event.texts.find(Boolean)||'')}</span><button type="button" data-remove="${escape(event.id)}" aria-label="Remove note for days ${event.start} to ${event.end}">×</button></div>`).join('');
 save();
 requestAnimationFrame(()=>positionEventBars(events,weeks));
}

$('month').innerHTML=monthNames.map((m,i)=>`<option value="${i}">${m}</option>`).join('');
$('month').value=state.month; $('year').value=state.year; $('design').value=state.design;
document.querySelectorAll('.goal-input').forEach(input=>{input.value=state.goals[input.dataset.index];input.addEventListener('input',()=>{if(input.value!==''&&input.checkValidity()){state.goals[input.dataset.index]=Number(input.value);render();}});});
$('month').addEventListener('change',()=>{state.month=Number($('month').value);render();});
$('year').addEventListener('input',()=>{if($('year').value!==''&&$('year').checkValidity()){state.year=Number($('year').value);render();}});
$('design').addEventListener('change',()=>{state.design=$('design').value;render();});
fieldIds.forEach(id=>$(id).addEventListener('blur',()=>fillTranslations($(id))));
$('event-start').addEventListener('input',()=>{if(Number($('event-end').value)<Number($('event-start').value)) $('event-end').value=$('event-start').value;});
$('event-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const source=fieldIds.map(id=>$(id)).find(input=>input.value.trim());
  if (!source) {$('translation-status').textContent='Enter the note in at least one language.'; return;}
  await fillTranslations(source);
  const start=Number($('event-start').value); const end=Number($('event-end').value);
  if (end<start) {$('translation-status').textContent='End day must be on or after start day.'; return;}
  state.events[currentKey()]??=[];
  const events=monthEvents();
  events.push({id:`event-${Date.now()}`,start,end,texts:fieldIds.map(id=>$(id).value.trim())});
  fieldIds.forEach(id=>$(id).value=''); $('translation-status').textContent='Note added.';
  render();
});
$('event-list').addEventListener('click',e=>{const button=e.target.closest('[data-remove]');if(button){state.events[currentKey()]=monthEvents().filter(event=>event.id!==button.dataset.remove);render();}});
$('print').addEventListener('click',()=>window.print());
window.addEventListener('resize',()=>positionEventBars(monthEvents(),calendarWeeks(state.year,state.month)));
window.addEventListener('beforeprint',()=>positionEventBars(monthEvents(),calendarWeeks(state.year,state.month)));
render();
