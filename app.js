import {calendarWeeks} from './calendar.mjs';
import {eventOccursOn, languages, localTranslation, splitEventByWeeks} from './translation.mjs';

const $ = id => document.getElementById(id);
const fieldIds = ['event-en', 'event-es', 'event-zh'];
const monthNames = Array.from({length:12}, (_,i) => new Intl.DateTimeFormat('en',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,i,1))));
const weekdays = [['Sunday','Domingo','星期日'],['Monday','Lunes','星期一'],['Tuesday','Martes','星期二'],['Wednesday','Miércoles','星期三'],['Thursday','Jueves','星期四'],['Friday','Viernes','星期五'],['Saturday','Sábado','星期六']];
const grades = [['TK – 1st Grade','TK – 1er Grado','TK 至 一年级'],['2nd – 3rd Grade','2do – 3er Grado','二 至 三年级'],['4th – 5th Grade','4to – 5to Grado','四 至 五年级']];
let state = {month:10,year:2026,design:'classic',goals:[250,450,650],events:{}};
try {const saved=JSON.parse(localStorage.getItem('roadrunner-calendar')); if(saved && Number.isInteger(saved.month) && saved.month>=0 && saved.month<12 && Number.isInteger(saved.year) && saved.year>=1900 && saved.year<=2100 && ['classic','roomy'].includes(saved.design) && Array.isArray(saved.goals) && saved.goals.length===3 && saved.goals.every(v=>Number.isInteger(v)&&v>=0) && saved.events && typeof saved.events==='object') state=saved;} catch {}

const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines = (texts, separator = '') => texts.map((text,i)=>`<span lang="${['en','es','zh-Hans'][i]}">${escape(text)}</span>`).join(separator);
const currentKey = () => `${state.year}-${state.month}`;
let mascotDraft = null;
let uploadVersion = 0;
function mascotControls() {
  $('mascot-review').hidden = !mascotDraft;
  $('adjust-mascot').hidden = !state.mascot || !!mascotDraft;
  $('remove-mascot').hidden = !state.mascot || !!mascotDraft;
  if (mascotDraft) {
    $('mascot-size').value = mascotDraft.size;
    $('mascot-size-value').value = `${mascotDraft.size}%`;
    $('mascot-mirror').checked = mascotDraft.mirror;
    for (const axis of ['x','y']) {
      $( `mascot-${axis}`).value = mascotDraft[axis] || 0;
      $(`mascot-${axis}-value`).value = `${mascotDraft[axis] || 0} mm`;
    }
  }
}
function renderMascot() {
  const mascot = mascotDraft || state.mascot;
  document.querySelectorAll('.paper-heading .bird').forEach((container, index) => {
    container.replaceChildren();
    container.style.flex = mascot ? `0 0 ${mascot.size}%` : '';
    container.style.transform = mascot ? `translate(${(mascot.x || 0) * (index === 0 ? 1 : -1)}mm, ${mascot.y || 0}mm)` : '';
    if (!mascot) return;
    const img = document.createElement('img');
    img.src = mascot.src;
    img.alt = '';
    img.className = index === 1 && mascot.mirror ? 'mascot mirrored' : 'mascot';
    container.append(img);
  });
  mascotControls();
}
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

const generatedTranslations = new Map();
const translationRequests = new Map();
let lastNoteSource = null;
let translationTimer;
async function fillTranslations(sourceInput) {
  const text=sourceInput.value.trim();
  if (!text) return;
  const source=sourceInput.dataset.language;
  const targets=fieldIds.map(id=>$(id)).filter(input=>input!==sourceInput && (!input.value.trim() || generatedTranslations.get(input.id)===input.value));
  if (!targets.length) { $('translation-status').textContent='Manual translations kept. Clear a field to translate it again.'; return; }
  $('translation-status').textContent='Translating…';
  let completed=0;
  await Promise.all(targets.map(async input=>{
    const previous=input.value; const ticket=Symbol(); translationRequests.set(input.id,ticket);
    try {
      const result=await translate(text,source,input.dataset.language);
      if (translationRequests.get(input.id)!==ticket || sourceInput.value.trim()!==text || input.value!==previous) return;
      input.value=result; generatedTranslations.set(input.id,result); completed++;
    } catch {}
  }));
  if (sourceInput.value.trim()===text) $('translation-status').textContent=completed===targets.length?'Translations added—edit any field to make corrections.':'Automatic translation is unavailable for some text in this browser. Use Google Translator or enter the missing translations manually.';
}

function eventMarkup(events, day) {
  return `<div class="notes-content">${events.filter(event=>event.start===event.end && eventOccursOn(event,day)).map(event=>`<div class="event-note">${lines(event.texts)}</div>`).join('')}</div>`;
}
function stabilizeCalendarGrid() {
  const table=document.querySelector('.calendar-table-wrap table');
  const mapping={TABLE:['calendar-grid','table'],THEAD:['calendar-weekdays','rowgroup'],TBODY:['calendar-weeks','rowgroup'],TR:['calendar-week','row'],TH:['calendar-day-heading','columnheader'],TD:['calendar-cell','cell']};
  function convert(node) {
    if (!mapping[node.nodeName]) return node.cloneNode(true);
    const [name,role]=mapping[node.nodeName]; const replacement=document.createElement('div');
    for (const attr of node.attributes) replacement.setAttribute(attr.name,attr.value);
    replacement.classList.add(name); replacement.setAttribute('role',role);
    for (const child of node.childNodes) replacement.append(convert(child));
    return replacement;
  }
  table.replaceWith(convert(table));
}

function fitText(element, width, height, maximum = 16) {
  let low = 1, high = maximum;
  for (let i = 0; i < 12; i++) {
    const size = (low + high) / 2;
    element.style.fontSize = `${size}px`;
    if (element.scrollWidth <= width + 1 && element.scrollHeight <= height + 1) low = size;
    else high = size;
  }
  element.style.fontSize = `${low}px`;
}
function fitDayNotes() {
  document.querySelectorAll('.day-note').forEach(note => {
    const content = note.firstElementChild;
    if (!content) return;
    fitText(content, note.clientWidth, note.clientHeight);
  });
}
let calendarResizeObserver;
function positionEventBars(events, weeks) {
  const wrap=document.querySelector('.calendar-table-wrap'); const layer=document.querySelector('.event-bars');
  if (!wrap || !layer) return;
  layer.replaceChildren();
  layer.style.top=`${wrap.querySelector('.calendar-weekdays').getBoundingClientRect().height}px`;
  const rowLayers=weeks.map(()=>{
    const row=document.createElement('div'); row.className='event-week-layer'; layer.append(row); return row;
  });
  const occupied=weeks.map(()=>[]);
  events.filter(event=>event.end>event.start).forEach(event=>{
    splitEventByWeeks(event,weeks).forEach(segment=>{
      const startCell=wrap.querySelector(`[data-day="${segment.start}"]`); const endCell=wrap.querySelector(`[data-day="${segment.end}"]`);
      if (!startCell || !endCell) return;
      let lane=0; while (occupied[segment.weekIndex][lane]>=segment.start) lane++;
      occupied[segment.weekIndex][lane]=segment.end;
      const startRect=startCell.getBoundingClientRect();
      const bar=document.createElement('div'); bar.className='event-bar';
      const column=weeks[segment.weekIndex].indexOf(segment.start);
      const span=segment.end-segment.start+1;
      bar.style.left=`calc(${column * 100 / 7}% + 8px)`;
      bar.style.width=`calc(${span * 100 / 7}% - 16px)`;
      bar.style.top='50%';
      bar.style.setProperty('--lane-offset',`${lane*35}px`);
      bar.style.transform=`translateY(calc(-50% + ${lane*35}px))`;
      bar.innerHTML=`<span class="bar-line"></span><div class="event-bar-label">${lines(event.texts)}</div><span class="bar-arrow" aria-hidden="true"></span>`;
      rowLayers[segment.weekIndex].append(bar);
      const label = bar.querySelector('.event-bar-label');
      fitText(label, label.clientWidth, Math.max(1, startRect.height - 30), 16);
    });
  });
  fitDayNotes();
}

function render(){
 const date=new Date(Date.UTC(state.year,state.month,1)); const es=new Intl.DateTimeFormat('es',{month:'long',timeZone:'UTC'}).format(date);
 const weeks=calendarWeeks(state.year,state.month); const events=monthEvents(); const lastDay=Math.max(...weeks.flat().filter(Boolean));
 $('event-start').max=lastDay; $('event-end').max=lastDay;
 $('calendar').className=state.design;
 $('calendar').style.setProperty('--weeks', weeks.length);
 $('design-description').textContent=state.design==='classic'?'Original structure: Sunday-first grid, goals on the right, and name fields below. Three languages are stacked within each section.':'A small layout shift: reading goals sit below the full-width grid, with one column per grade group and more writing space.';
 $('calendar').innerHTML=`<div class="paper-heading"><div class="bird" aria-hidden="true">🐦</div><div>${lines([`${monthNames[state.month]} ${state.year} Roadrunner Reading Calendar`,`Calendario de lectura de Roadrunner de ${es} de ${state.year}`,`${state.year}年${state.month+1}月 Roadrunner 阅读日历`])}</div><div class="bird" aria-hidden="true">🐦</div></div><div class="calendar-body"><div class="calendar-table-wrap"><table><thead><tr>${weekdays.map(d=>`<th scope="col">${lines(d)}</th>`).join('')}</tr></thead><tbody>${weeks.map(w=>`<tr>${w.map(day=>`<td class="${day?'':'empty'}"${day?` data-day="${day}"`:''}>${day?`<span class="date">${day}</span><div class="day-note">${eventMarkup(events,day)}</div>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="event-bars" aria-hidden="true"></div></div><section class="goals"><h2>${lines(['Reading minutes goal','Objetivo de minutos de lectura','阅读时长目标'], ' | ')}</h2><div class="goal-groups">${grades.map((g,i)=>`<div class="goal">${lines(g)}<strong>${state.goals[i]} <small>min / minutos / 分钟</small></strong></div>`).join('')}</div></section></div><footer class="paper-footer"><div>${lines(['Total minutes read','Minutos totales leídos','阅读总分钟数'], ' | ')}<span class="blank"></span></div><div>${lines(['Teacher name','Nombre del maestro/a','教师姓名'], ' | ')}<span class="blank"></span></div><div>${lines(['Student name','Nombre del estudiante','学生姓名'], ' | ')}<span class="blank"></span></div></footer>`;
 $('event-list').innerHTML=events.slice().sort((a,b)=>a.start-b.start).map(event=>`<div class="event-item"><span><b>${event.start}${event.end!==event.start?`–${event.end}`:''}</b> ${escape(event.texts.find(Boolean)||'')}</span><button type="button" data-remove="${escape(event.id)}" aria-label="Remove note for days ${event.start} to ${event.end}">×</button></div>`).join('');
 stabilizeCalendarGrid();
 renderMascot();
 save();
 if (!calendarResizeObserver) calendarResizeObserver = new ResizeObserver(() => positionEventBars(monthEvents(), calendarWeeks(state.year,state.month)));
 calendarResizeObserver.disconnect();
 calendarResizeObserver.observe(document.querySelector('.calendar-table-wrap'));
 requestAnimationFrame(()=>positionEventBars(events,weeks));
}

$('month').innerHTML=monthNames.map((m,i)=>`<option value="${i}">${m}</option>`).join('');
$('month').value=state.month; $('year').value=state.year; $('design').value=state.design;
document.querySelectorAll('.goal-input').forEach(input=>{input.value=state.goals[input.dataset.index];input.addEventListener('input',()=>{if(input.value!==''&&input.checkValidity()){state.goals[input.dataset.index]=Number(input.value);render();}});});
$('month').addEventListener('change',()=>{state.month=Number($('month').value);render();});
$('year').addEventListener('input',()=>{if($('year').value!==''&&$('year').checkValidity()){state.year=Number($('year').value);render();}});
$('design').addEventListener('change',()=>{state.design=$('design').value;render();});
$('event-form').previousElementSibling.textContent='Choose one day or a date range. Enter a note in any language.';
const googleTranslatorLink = document.createElement('a');
googleTranslatorLink.href = 'https://translate.google.com/?sl=auto&tl=zh-CN&op=translate';
googleTranslatorLink.target = '_blank';
googleTranslatorLink.rel = 'noopener noreferrer';
googleTranslatorLink.className = 'google-translator-button';
googleTranslatorLink.textContent = 'Use Google Translator';
googleTranslatorLink.setAttribute('aria-label', 'Use Google Translator (opens in a new tab)');
$('translation-status').before(googleTranslatorLink);
fieldIds.forEach(id=>{
  $(id).addEventListener('input',()=>{
    lastNoteSource=$(id); generatedTranslations.delete(id); translationRequests.delete(id);
    clearTimeout(translationTimer);
    translationTimer=setTimeout(()=>fillTranslations($(id)),700);
  });
  $(id).addEventListener('blur',()=>{clearTimeout(translationTimer);fillTranslations($(id));});
});
$('event-start').addEventListener('input',()=>{if(Number($('event-end').value)<Number($('event-start').value)) $('event-end').value=$('event-start').value;});
$('event-form').addEventListener('submit',async e=>{
  e.preventDefault();
  clearTimeout(translationTimer);
  const source=lastNoteSource?.value.trim()?lastNoteSource:fieldIds.map(id=>$(id)).find(input=>input.value.trim());
  if (!source) {$('translation-status').textContent='Enter the note in at least one language.'; return;}
  await fillTranslations(source);
  const start=Number($('event-start').value); const end=Number($('event-end').value);
  if (end<start) {$('translation-status').textContent='End day must be on or after start day.'; return;}
  state.events[currentKey()]??=[];
  const events=monthEvents();
  events.push({id:`event-${Date.now()}`,start,end,texts:fieldIds.map(id=>$(id).value.trim())});
  fieldIds.forEach(id=>$(id).value=''); generatedTranslations.clear(); translationRequests.clear(); lastNoteSource=null; $('translation-status').textContent='Note added.';
  render();
});
$('event-list').addEventListener('click',e=>{const button=e.target.closest('[data-remove]');if(button){state.events[currentKey()]=monthEvents().filter(event=>event.id!==button.dataset.remove);render();}});
$('print').addEventListener('click',()=>window.print());
$('upload-mascot').addEventListener('click', () => $('mascot-file').click());
$('mascot-file').addEventListener('change', async () => {
  const version = ++uploadVersion;
  const file = $('mascot-file').files[0];
  $('mascot-file').value = '';
  if (!file) return;
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
    $('mascot-status').textContent = 'Choose a PNG, JPEG or WebP up to 2 MB.';
    return;
  }
  try {
    const src = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result);
      reader.onerror = reject; reader.readAsDataURL(file);
    });
    const img = new Image(); img.src = src; await img.decode();
    if (version !== uploadVersion) return;
    mascotDraft = {src, size: state.mascot?.size || 10, mirror: state.mascot?.mirror ?? true, x: state.mascot?.x || 0, y: state.mascot?.y || 0};
    $('mascot-status').textContent = 'Preview only: adjust the size on the calendar, then confirm or cancel. Image proportions are preserved.';
    render();
  } catch { $('mascot-status').textContent = 'This image could not be opened. Please choose another file.'; }
});
$('mascot-size').addEventListener('input', () => {
  if (!mascotDraft) return;
  mascotDraft.size = Number($('mascot-size').value); render();
});
$('mascot-mirror').addEventListener('change', () => {
  if (!mascotDraft) return;
  mascotDraft.mirror = $('mascot-mirror').checked; render();
});
for (const axis of ['x','y']) {
  $(`mascot-${axis}`).addEventListener('input', () => {
    if (!mascotDraft) return;
    mascotDraft[axis] = Number($(`mascot-${axis}`).value); render();
  });
}
$('confirm-mascot').addEventListener('click', () => {
  if (!mascotDraft) return;
  state.mascot = {...mascotDraft}; mascotDraft = null;
  $('mascot-status').textContent = 'Mascot confirmed. It will appear on your printed calendar.';
  render();
});
$('cancel-mascot').addEventListener('click', () => {
  ++uploadVersion; mascotDraft = null; $('mascot-status').textContent = 'Preview canceled.'; render();
});
$('adjust-mascot').addEventListener('click', () => {
  mascotDraft = {...state.mascot}; $('mascot-status').textContent = 'Adjust the preview, then confirm or cancel.'; render();
});
$('remove-mascot').addEventListener('click', () => {
  delete state.mascot; $('mascot-status').textContent = 'Mascot removed. Upload an image to add it again.'; render();
});
window.addEventListener('resize',()=>positionEventBars(monthEvents(),calendarWeeks(state.year,state.month)));
window.addEventListener('beforeprint',()=>positionEventBars(monthEvents(),calendarWeeks(state.year,state.month)));
window.addEventListener('afterprint',()=>positionEventBars(monthEvents(),calendarWeeks(state.year,state.month)));
render();
