import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarWeeks} from './calendar.mjs';
test('November 2026 matches the supplied Sunday-first calendar',()=>{const w=calendarWeeks(2026,10);assert.equal(w.length,5);assert.deepEqual(w[0],[1,2,3,4,5,6,7]);assert.deepEqual(w[4],[29,30,null,null,null,null,null]);});
test('Leap years and century rules',()=>{assert.equal(calendarWeeks(2024,1).flat().filter(Boolean).length,29);assert.equal(calendarWeeks(1900,1).flat().filter(Boolean).length,28);assert.equal(calendarWeeks(2000,1).flat().filter(Boolean).length,29);});
test('Six-week month and every date appears exactly once',()=>{assert.equal(calendarWeeks(2026,7).length,6);for(let year=1900;year<=2100;year++)for(let month=0;month<12;month++){const days=calendarWeeks(year,month).flat().filter(Boolean);const count=new Date(Date.UTC(year,month+1,0)).getUTCDate();assert.deepEqual(days,Array.from({length:count},(_,i)=>i+1));assert.equal(calendarWeeks(year,month)[0].indexOf(1),new Date(Date.UTC(year,month,1)).getUTCDay());}});
