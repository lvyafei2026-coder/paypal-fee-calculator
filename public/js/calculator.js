let currentMode = 'receive';

function t() { return (window.__i18n && window.__i18n.t) || {}; }

const COUNTRY_RATES = {
  us:    { pct: 2.99, fixed: 0.49 },
  ca:    { pct: 2.99, fixed: 0.49 },
  uk:    { pct: 2.99, fixed: 0.39 },
  eu:    { pct: 2.99, fixed: 0.39 },
  au:    { pct: 2.99, fixed: 0.49 },
  intl:  { pct: 4.99, fixed: 0.49 },
  custom:{ pct: 2.99, fixed: 0.49 }
};

function fmt(n) {
  if (!isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  return sign + '$' + Math.abs(n).toFixed(2);
}

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  document.querySelectorAll('.mode-panel').forEach(p => p.style.display = 'none');
  document.getElementById('mode-' + mode).style.display = 'block';
  calculate();
}

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('mode')) {
    const m = params.get('mode');
    if (['receive','send','target'].includes(m)) switchMode(m);
  }
  if (params.has('amount')) {
    const el = document.getElementById('amount');
    if (el) el.value = params.get('amount');
  }
  if (params.has('country')) {
    const c = params.get('country');
    document.getElementById('country').value = c;
    applyCountry(c);
  }
  if (params.has('amount') || params.has('country')) calculate();
}

function applyCountry(country) {
  const rate = COUNTRY_RATES[country];
  if (!rate) return;
  if (country !== 'custom') {
    document.getElementById('feePct').value = rate.pct.toFixed(2);
    document.getElementById('feeFixed').value = rate.fixed.toFixed(2);
  }
}

function buildShareUrl() {
  const params = new URLSearchParams();
  params.set('mode', currentMode);
  if (currentMode === 'receive') params.set('amount', document.getElementById('amount').value);
  else if (currentMode === 'send') params.set('amount', document.getElementById('sendAmount').value);
  else params.set('amount', document.getElementById('targetAmount').value);
  const country = document.getElementById('country').value;
  if (country !== 'us') params.set('country', country);
  const base = window.location.origin + window.location.pathname;
  return base + '?' + params.toString();
}

function copyShareLink() {
  const url = buildShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    const el = document.getElementById('shareCopied');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }).catch(() => { prompt('Copy this link:', url); });
}

function calculate() {
  const tr = t();
  const pct = parseFloat(document.getElementById('feePct').value) || 0;
  const fixed = parseFloat(document.getElementById('feeFixed').value) || 0;
  const pctDec = pct / 100;

  let gross, fee, net, mainLabel, mainValue, subText;

  if (currentMode === 'receive') {
    gross = parseFloat(document.getElementById('amount').value) || 0;
    fee = gross * pctDec + fixed;
    net = gross - fee;
    document.getElementById('resultLabel').textContent = tr.resultNetLabel || 'You receive';
    document.getElementById('resultMain').textContent = fmt(net);
    document.getElementById('resultSub').textContent = fmt(fee) + ' ' + (tr.feeOn || 'fee on') + ' ' + fmt(gross);
    document.getElementById('bdNetLabel').textContent = tr.bdNet || 'Net amount received';
  } else if (currentMode === 'send') {
    const amount = parseFloat(document.getElementById('sendAmount').value) || 0;
    fee = amount * pctDec + fixed;
    gross = amount;
    net = amount + fee;
    document.getElementById('resultLabel').textContent = tr.resultTotalLabel || 'Total you pay';
    document.getElementById('resultMain').textContent = fmt(net);
    document.getElementById('resultSub').textContent = fmt(amount) + ' + ' + fmt(fee) + ' ' + (tr.fee || 'fee');
    document.getElementById('bdNetLabel').textContent = tr.bdTotalPaid || 'Total sent';
  } else {
    // target mode: solve for gross such that gross - (gross*pctDec + fixed) = target
    const target = parseFloat(document.getElementById('targetAmount').value) || 0;
    gross = (target + fixed) / (1 - pctDec);
    fee = gross * pctDec + fixed;
    net = gross - fee;
    document.getElementById('resultLabel').textContent = tr.resultGrossLabel || 'Sender must send';
    document.getElementById('resultMain').textContent = fmt(gross);
    document.getElementById('resultSub').textContent = (tr.toReceive || 'to net') + ' ' + fmt(target);
    document.getElementById('bdNetLabel').textContent = tr.bdTargetNet || 'Your net';
  }

  const grossEl = document.getElementById('bdGross');
  grossEl.textContent = fmt(gross);

  document.getElementById('bdPctFee').textContent = '-' + fmt(gross * pctDec);
  document.getElementById('bdFixedFee').textContent = '-' + fmt(fixed);
  document.getElementById('bdTotalFee').textContent = '-' + fmt(fee);
  document.getElementById('bdNet').textContent = fmt(currentMode === 'send' ? gross + fee : net);

  document.getElementById('result').classList.add('show');
}

window.switchMode = switchMode;
window.calculate = calculate;
window.copyShareLink = copyShareLink;
window.readUrlParams = readUrlParams;

document.addEventListener('DOMContentLoaded', function() {
  ['amount','sendAmount','targetAmount','feePct','feeFixed'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculate);
  });
  const country = document.getElementById('country');
  if (country) country.addEventListener('change', function() {
    applyCountry(this.value);
    calculate();
  });
  // init
  applyCountry('us');
  calculate();
});