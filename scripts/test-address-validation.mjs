import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../address-validation.js', import.meta.url), 'utf8'), context);
const validate = context.AIVerseAddressValidation.isAddressFormatValid;

test('accepts basic address shapes for supported networks', () => {
  const cases = [
    ['BTC', '1BoatSLRHtKNngkdXEeobR76b53LETtpyT'],
    ['BCH', 'bitcoincash:q' + 'p'.repeat(47)],
    ['XRP', 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6G3'],
    ['ADA', 'addr1' + 'q'.repeat(55)],
    ['TRON', 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'],
    ['ETH', '0x' + 'a'.repeat(40)],
    ['BSC', '0x' + '1'.repeat(40)],
    ['SOL', 'So11111111111111111111111111111111111111112'],
  ];
  for (const [network, address] of cases) assert.equal(validate(network, address), true, network);
});

test('rejects malformed, empty, unknown-network and wrong-network formats', () => {
  assert.equal(validate('BTC', ''), false);
  assert.equal(validate('BTC', 'not-an-address'), false);
  assert.equal(validate('ETH', '0x1234'), false);
  assert.equal(validate('TRON', '0x' + 'a'.repeat(40)), false);
  assert.equal(validate('UNKNOWN', '1BoatSLRHtKNngkdXEeobR76b53LETtpyT'), false);
  assert.equal(validate('SOL', '0'.repeat(40)), false);
});

test('trims surrounding whitespace but rejects overlong input', () => {
  assert.equal(validate('ETH', '  0x' + 'b'.repeat(40) + '  '), true);
  assert.equal(validate('SOL', 'A'.repeat(121)), false);
});
