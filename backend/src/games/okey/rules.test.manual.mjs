import { isWinningHand, computeOkeyTile, chooseAutoDiscardTile } from './rules.js';

function t(color, number) {
  return { id: `${color}-${number}-${Math.random()}`, color, number, isFakeOkey: false };
}
function joker() {
  return { id: `joker-${Math.random()}`, color: null, number: null, isFakeOkey: true };
}

const okeyTile = { color: 'kirmizi', number: 5 }; // gösterge 4 kırmızı ise okey 5 kırmızı

// Test 1: 5 set (aynı sayı farklı renk), joker yok
const hand1 = [
  t('kirmizi', 1), t('sari', 1), t('mavi', 1),
  t('kirmizi', 2), t('sari', 2), t('mavi', 2),
  t('kirmizi', 3), t('sari', 3), t('mavi', 3),
  t('kirmizi', 4), t('sari', 4), t('mavi', 4),
  t('kirmizi', 6), t('sari', 6), t('mavi', 6),
];
console.log('Test 1 (5 set, joker yok):', isWinningHand(hand1, okeyTile) === true ? 'PASS' : 'FAIL');

// Test 2: 5 run (ardışık aynı renk)
const hand2 = [
  t('kirmizi', 1), t('kirmizi', 2), t('kirmizi', 3),
  t('sari', 4), t('sari', 5), t('sari', 6),
  t('mavi', 7), t('mavi', 8), t('mavi', 9),
  t('siyah', 10), t('siyah', 11), t('siyah', 12),
  t('kirmizi', 8), t('kirmizi', 9), t('kirmizi', 10),
];
console.log('Test 2 (5 run):', isWinningHand(hand2, okeyTile) === true ? 'PASS' : 'FAIL');

// Test 3: pair hand (7 çift + 1 fazla)
const hand3 = [
  t('kirmizi', 1), t('kirmizi', 1),
  t('sari', 2), t('sari', 2),
  t('mavi', 3), t('mavi', 3),
  t('siyah', 4), t('siyah', 4),
  t('kirmizi', 5), t('kirmizi', 5),
  t('sari', 6), t('sari', 6),
  t('mavi', 7), t('mavi', 7),
  t('siyah', 9), // fazla tek taş
];
console.log('Test 3 (7 çift + fazla):', isWinningHand(hand3, okeyTile) === true ? 'PASS' : 'FAIL');

// Test 4: joker ile set tamamlama
const hand4 = [
  t('kirmizi', 1), t('sari', 1), joker(),
  t('kirmizi', 2), t('sari', 2), t('mavi', 2),
  t('kirmizi', 3), t('sari', 3), t('mavi', 3),
  t('kirmizi', 7), t('sari', 7), t('mavi', 7),
  t('kirmizi', 8), t('sari', 8), t('mavi', 8),
];
console.log('Test 4 (joker ile set):', isWinningHand(hand4, okeyTile) === true ? 'PASS' : 'FAIL');

// Test 5: gecersiz el (rastgele, kazanmamalı)
const hand5 = [
  t('kirmizi', 1), t('sari', 4), t('mavi', 9),
  t('kirmizi', 2), t('sari', 5), t('mavi', 10),
  t('kirmizi', 3), t('sari', 11), t('mavi', 12),
  t('siyah', 1), t('siyah', 2), t('siyah', 3),
  t('kirmizi', 13), t('sari', 12), t('mavi', 13),
];
console.log('Test 5 (gecersiz el):', isWinningHand(hand5, okeyTile) === false ? 'PASS' : 'FAIL');

// Test 6: okey esi gercek tas joker gibi davraniyor mu (2 tane 5 kirmizi hand'de)
const hand6 = [
  t('kirmizi', 5), t('kirmizi', 5), // ikisi de okey tasi (joker) sayilir
  t('sari', 1), t('sari', 1),
  t('mavi', 2), t('mavi', 2),
  t('siyah', 3), t('siyah', 3),
  t('kirmizi', 6), t('kirmizi', 6),
  t('sari', 7), t('sari', 7),
  t('mavi', 8), t('mavi', 8),
  t('siyah', 9),
];
console.log('Test 6 (okey esi joker/cift):', isWinningHand(hand6, okeyTile) === true ? 'PASS' : 'FAIL');

// Test 7: otomatik atma - izole (komsusuz) tas secilmeli, okey asla secilmemeli
const isolatedTile = t('siyah', 11);
const hand7 = [
  t('kirmizi', 1), t('kirmizi', 2), t('kirmizi', 3), // seri, komsulu
  t('sari', 7), t('sari', 7), // es cift
  isolatedTile, // komsusuz tek tas
  { id: 'okey-tas', color: okeyTile.color, number: okeyTile.number, isFakeOkey: false }, // okey esi (joker), asla secilmemeli
];
const chosen = chooseAutoDiscardTile(hand7, okeyTile);
console.log('Test 7 (otomatik atma izole tas):', chosen.id === isolatedTile.id ? 'PASS' : `FAIL (secilen: ${chosen.color}-${chosen.number})`);
