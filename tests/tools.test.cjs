const test = require('node:test');
const assert = require('node:assert/strict');
const tools = require('../tools.js');

test('argon-P0-5: raw points stay below total and written/oral thresholds', () => {
  assert.equal(tools.evaluateScore('goethe','A1',{listen:60,read:60,write:60,speak:58}).total,59.5);
  const a2=tools.evaluateScore('goethe','A2',{listen:60,read:60,write:59.99,speak:70});
  assert.equal(a2.verdict,'fail');assert.equal(a2.failedReason,'a2_written_min');assert.ok(a2.written<45);
  assert.equal(tools.evaluateScore('goethe','B1',{listen:59.999,read:70,write:70,speak:70}).verdict,'fail');
});
test('argon-P1-8: first-line greeting boundaries, Unicode and letter body sentences', () => {
  for(const text of ['Hier brauche ich Hilfe.','Hier sage ich hi.','Das ist eine wichtige Geschichte.','Ich sage dir heute hi.'])assert.equal(tools.analyzeWriting('a1-t2',text).hasOpening,false);
  assert.equal(tools.hasPhrase('Gru\u0308ße','grüße'),true);
  assert.equal(tools.hasPhrase('undicht','und'),false);
  const draft='Sehr geehrte Damen und Herren,\nIch schreibe Herrn Prof. Dr. Becker am 15. Mai z. B. wegen meiner Prüfung.\nMit freundlichen Grüßen\nTim Karl Friedrich';
  const result=tools.analyzeWriting('b2-t2',draft);
  assert.equal(result.sentences,1);assert.equal(result.hasOpening,true);assert.equal(result.hasSignoff,true);
});
