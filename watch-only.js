(() => {
  'use strict';

  const STORAGE_KEY = 'aiverse-wallet.watch-only.v1';
  const networks = [
    ['BTC', 'Bitcoin (BTC)'],
    ['BCH', 'Bitcoin Cash (BCH)'],
    ['XRP', 'XRP Ledger'],
    ['ADA', 'Cardano (ADA)'],
    ['TRON', 'TRON / TRC20'],
    ['ETH', 'Ethereum / ERC20'],
    ['BSC', 'BNB Smart Chain / BEP20'],
    ['SOL', 'Solana'],
  ];

  function loadEntries() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value)
        ? value.filter((item) => item && typeof item.id === 'string' &&
            typeof item.network === 'string' && typeof item.address === 'string' &&
            typeof item.label === 'string').map((item) => ({
              ...item, memo: typeof item.memo === 'string' ? item.memo : ''
            }))
        : [];
    } catch (_) {
      return [];
    }
  }

  function saveEntries(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch (_) {
      return false;
    }
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function init() {
    const main = document.querySelector('main');
    if (!main) return;

    const style = element('style');
    style.textContent = `
      .watch-panel{margin-top:20px;background:#1b293c;border:1px solid #2b3b52;border-radius:18px;padding:22px}
      .watch-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
      .watch-form label{display:flex;flex-direction:column;gap:7px;color:#b9c7dc;font-size:13px}
      .watch-form input,.watch-form select{width:100%;min-width:0;padding:12px;border-radius:10px;border:1px solid #44536a;background:#101827;color:#fff;font:inherit}
      .watch-form .wide{grid-column:1/-1}
      .watch-help{grid-column:1/-1;color:#9eacc2;font-size:12px;line-height:1.8}
      .watch-entry{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid #334158}
      .watch-entry:last-child{border-bottom:0}
      .watch-address{direction:ltr;text-align:left;overflow-wrap:anywhere;color:#dce7f8;font-size:13px;margin-top:5px}
      .watch-actions{display:flex;gap:7px;flex-shrink:0;flex-wrap:wrap}
      .watch-actions button{padding:9px 11px;font-size:12px}
      .watch-muted{color:#9eacc2;font-size:13px;line-height:1.8}
      .watch-status{min-height:22px;margin-top:10px;font-size:13px;color:#65e4c2}
      @media(max-width:560px){.watch-form{grid-template-columns:1fr}.watch-form .wide{grid-column:auto}.watch-entry{align-items:flex-start;flex-direction:column}.watch-actions{width:100%}}
    `;
    document.head.appendChild(style);

    const panel = element('section', 'watch-panel');
    panel.setAttribute('aria-labelledby', 'watch-title');
    panel.appendChild(element('h3', '', 'آدرس‌های عمومی (فقط‌خواندنی)'));
    panel.appendChild(element('p', 'watch-muted', 'در این بخش فقط آدرس عمومی کیف پول را ثبت می‌کنی؛ هیچ کلید خصوصی، عبارت بازیابی یا رمز عبوری دریافت یا ذخیره نمی‌شود. این نسخه هنوز موجودی بلاکچین را استعلام نمی‌کند.'));

    const form = element('form', 'watch-form');
    const networkLabel = element('label', '', 'شبکه');
    const networkSelect = element('select');
    networkSelect.name = 'network';
    networks.forEach(([value, label]) => {
      const option = element('option', '', label);
      option.value = value;
      networkSelect.appendChild(option);
    });
    networkLabel.appendChild(networkSelect);

    const labelLabel = element('label', '', 'نام دلخواه (اختیاری)');
    const labelInput = element('input');
    labelInput.name = 'label';
    labelInput.maxLength = 40;
    labelInput.placeholder = 'مثلاً کیف پول شخصی';
    labelLabel.appendChild(labelInput);

    const memoLabel = element('label', '', 'تگ / ممو (اختیاری)');
    const memoInput = element('input');
    memoInput.name = 'memo';
    memoInput.maxLength = 80;
    memoInput.autocomplete = 'off';
    memoInput.placeholder = 'مثلاً Destination Tag در XRP';
    memoLabel.appendChild(memoInput);

    const addressLabel = element('label', 'wide', 'آدرس عمومی');
    const addressInput = element('input');
    addressInput.name = 'address';
    addressInput.required = true;
    addressInput.maxLength = 180;
    addressInput.autocomplete = 'off';
    addressInput.spellcheck = false;
    addressInput.placeholder = 'آدرس عمومی را وارد کنید';
    addressLabel.appendChild(addressInput);

    const submit = element('button', 'primary wide', 'افزودن آدرس');
    submit.type = 'submit';
    const help = element('p', 'watch-help', 'بررسی فقط شکل ظاهری آدرس را کنترل می‌کند؛ صحت checksum، تعلق آدرس به شبکه یا وجود آن روی بلاکچین تأیید نمی‌شود. تگ/ممو نیز صرفاً برای یادداشت محلی است و در این نسخه تراکنشی انجام نمی‌شود.');
    form.append(networkLabel, labelLabel, addressLabel, memoLabel, submit, help);
    panel.appendChild(form);

    const status = element('p', 'watch-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    panel.appendChild(status);
    const list = element('div');
    list.id = 'watch-address-list';
    panel.appendChild(list);
    main.appendChild(panel);

    let entries = loadEntries();

    function render() {
      list.replaceChildren();
      if (!entries.length) {
        list.appendChild(element('p', 'watch-muted', 'هنوز آدرسی ثبت نشده است.'));
        return;
      }
      entries.forEach((entry) => {
        const row = element('div', 'watch-entry');
        const details = element('div');
        const networkName = networks.find(([value]) => value === entry.network)?.[1] || entry.network;
        details.appendChild(element('strong', '', entry.label || networkName));
        details.appendChild(element('div', 'watch-muted', networkName));
        details.appendChild(element('div', 'watch-address', entry.address));
        if (entry.memo) details.appendChild(element('div', 'watch-muted', 'تگ / ممو: ' + entry.memo));

        const actions = element('div', 'watch-actions');
        const copy = element('button', 'secondary', 'کپی آدرس');
        copy.type = 'button';
        copy.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(entry.address);
            status.textContent = 'آدرس در کلیپ‌بورد کپی شد.';
          } catch (_) {
            status.textContent = 'کپی خودکار در این مرورگر در دسترس نیست؛ آدرس را دستی انتخاب کنید.';
          }
        });
        const remove = element('button', 'secondary', 'حذف');
        remove.type = 'button';
        remove.addEventListener('click', () => {
          entries = entries.filter((item) => item.id !== entry.id);
          if (!saveEntries(entries)) {
            status.textContent = 'ذخیره‌سازی مرورگر در دسترس نیست؛ تغییرات ذخیره نشد.';
            entries = loadEntries();
          } else {
            status.textContent = 'آدرس از فهرست این مرورگر حذف شد.';
          }
          render();
        });
        actions.append(copy, remove);
        row.append(details, actions);
        list.appendChild(row);
      });
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const address = addressInput.value.trim();
      if (!address) {
        status.textContent = 'لطفاً آدرس عمومی را وارد کنید.';
        return;
      }
      const validator = window.AIVerseAddressValidation;
      if (!validator || !validator.isAddressFormatValid(networkSelect.value, address)) {
        status.textContent = 'قالب آدرس با شبکه انتخاب‌شده سازگار نیست؛ شبکه و آدرس را بررسی کنید.';
        return;
      }
      if (entries.some((item) => item.network === networkSelect.value && item.address === address)) {
        status.textContent = 'این آدرس برای همین شبکه قبلاً ثبت شده است.';
        return;
      }
      const next = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        network: networkSelect.value,
        label: labelInput.value.trim(),
        address,
        memo: memoInput.value.trim(),
      };
      const updated = [...entries, next];
      if (!saveEntries(updated)) {
        status.textContent = 'ذخیره‌سازی مرورگر ممکن نیست؛ فضای ذخیره‌سازی یا تنظیمات حریم خصوصی را بررسی کنید.';
        return;
      }
      entries = updated;
      addressInput.value = '';
      labelInput.value = '';
      memoInput.value = '';
      status.textContent = 'آدرس فقط‌خواندنی در همین مرورگر ذخیره شد.';
      render();
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
