(function (root) {
  'use strict';

  const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
  const BECH32 = /^[ac-hj-np-z02-9]+$/i;

  function isAddressFormatValid(network, rawAddress) {
    if (typeof rawAddress !== 'string') return false;
    const address = rawAddress.trim();
    if (!address || address.length > 120) return false;

    switch (network) {
      case 'BTC':
        if (/^(bc1|BC1)/.test(address)) {
          return address.length >= 14 && address.length <= 74 &&
            !(/[a-z]/.test(address) && /[A-Z]/.test(address)) &&
            BECH32.test(address.slice(3));
        }
        return address.length >= 26 && address.length <= 35 && BASE58.test(address) &&
          /^[13]/.test(address);
      case 'BCH': {
        const cashAddress = address.toLowerCase().startsWith('bitcoincash:')
          ? address.slice('bitcoincash:'.length)
          : address;
        if (/^(q|p)/i.test(cashAddress)) {
          return cashAddress.length >= 20 && cashAddress.length <= 100 && BECH32.test(cashAddress);
        }
        return address.length >= 26 && address.length <= 35 && BASE58.test(address) &&
          /^[13]/.test(address);
      }
      case 'XRP':
        return address.length >= 25 && address.length <= 35 && /^r/.test(address) && BASE58.test(address);
      case 'ADA':
        return /^(addr1|addr_test1)/.test(address) && address.length >= 50 && address.length <= 120 &&
          !(/[a-z]/.test(address) && /[A-Z]/.test(address)) && BECH32.test(address.replace(/^addr(_test)?1/, ''));
      case 'TRON':
        return address.length === 34 && /^T/.test(address) && BASE58.test(address);
      case 'ETH':
      case 'BSC':
        return /^0x[0-9a-fA-F]{40}$/.test(address);
      case 'SOL':
        return address.length >= 32 && address.length <= 44 && BASE58.test(address);
      default:
        return false;
    }
  }

  root.AIVerseAddressValidation = Object.freeze({ isAddressFormatValid });
})(globalThis);
