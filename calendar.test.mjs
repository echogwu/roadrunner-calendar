import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarWeeks} from './calendar.mjs';
import {eventOccursOn, localTranslation} from './translation.mjs';
test('November 2026 matches the supplied Sunday-first calendar',()=>{const w=calendarWeeks(2026,10);assert.equal(w.length,5);assert.deepEqual(w[0],[1,2,3,4,5,6,7]);assert.deepEqual(w[4],[29,30,null,null,null,null,null]);});
test('Leap years and century rules',()=>{assert.equal(calendarWeeks(2024,1).flat().filter(Boolean).length,29);assert.equal(calendarWeeks(1900,1).flat().filter(Boolean).length,28);assert.equal(calendarWeeks(2000,1).flat().filter(Boolean).length,29);});
test('Six-week month and every date appears exactly once',()=>{assert.equal(calendarWeeks(2026,7).length,6);for(let year=1900;year<=2100;year++)for(let month=0;month<12;month++){const days=calendarWeeks(year,month).flat().filter(Boolean);const count=new Date(Date.UTC(year,month+1,0)).getUTCDate();assert.deepEqual(days,Array.from({length:count},(_,i)=>i+1));assert.equal(calendarWeeks(year,month)[0].indexOf(1),new Date(Date.UTC(year,month,1)).getUTCDay());}});
test('Multi-day events include both endpoints',()=>{const event={start:12,end:15};assert.equal(eventOccursOn(event,11),false);assert.equal(eventOccursOn(event,12),true);assert.equal(eventOccursOn(event,15),true);assert.equal(eventOccursOn(event,16),false);});
test('School phrases translate from any supported language',()=>{assert.equal(localTranslation('No school','en','zh-CN'),'不上课');assert.equal(localTranslation('¡Entrega de libros!','es','en'),'Book delivery!');assert.equal(localTranslation('寒假','zh-CN','es'),'Vacaciones de invierno');});
