const displayEl = document.getElementById('display');
const historyEl = document.getElementById('history');

let currentValue = '0';
let previousValue = null;
let pendingOp = null;
let justEvaluated = false;
let lastSecondOperand = null;

const opButtons = document.querySelectorAll('.op');

function updateDisplay() {
  // Trim to a reasonable length so it never overflows the screen
  let text = currentValue;
  if (text.length > 11) {
    const num = parseFloat(text);
    text = num.toExponential(5);
  }
  displayEl.textContent = text;

  if (pendingOp && previousValue !== null) {
    historyEl.textContent = `${previousValue} ${pendingOp}`;
  } else {
    historyEl.textContent = '\u00A0';
  }
}

function inputDigit(digit) {
  if (justEvaluated) {
    currentValue = digit === '.' ? '0.' : digit;
    justEvaluated = false;
    previousValue = null;
    pendingOp = null;
    updateDisplay();
    return;
  }

  if (digit === '.') {
    if (currentValue.includes('.')) return;
    currentValue += '.';
    updateDisplay();
    return;
  }

  if (currentValue === '0') {
    currentValue = digit;
  } else {
    currentValue += digit;
  }
  updateDisplay();
}

function clearAll() {
  currentValue = '0';
  previousValue = null;
  pendingOp = null;
  justEvaluated = false;
  clearActiveOp();
  updateDisplay();
}

function backspace() {
  if (justEvaluated) return;
  if (currentValue.length <= 1 || (currentValue.length === 2 && currentValue.startsWith('-'))) {
    currentValue = '0';
  } else {
    currentValue = currentValue.slice(0, -1);
  }
  updateDisplay();
}

function toggleSignOrPercent() {
  if (currentValue === '0') return;
  const num = parseFloat(currentValue) / 100;
  currentValue = trimNumber(num);
  updateDisplay();
}

function trimNumber(num) {
  if (Number.isInteger(num)) return num.toString();
  return parseFloat(num.toFixed(10)).toString();
}

function compute(a, b, op) {
  a = parseFloat(a);
  b = parseFloat(b);
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
    default: return b;
  }
}

function setOperator(op) {
  if (pendingOp && previousValue !== null && !justEvaluated) {
    // Chain: evaluate the pending operation first
    const result = compute(previousValue, currentValue, pendingOp);
    previousValue = handleResult(result);
  } else {
    previousValue = currentValue;
  }
  pendingOp = op;
  justEvaluated = false;
  currentValue = '0';
  highlightOp(op);
  updateDisplay();
}

function handleResult(result) {
  if (isNaN(result) || !isFinite(result)) {
    currentValue = 'Error';
    previousValue = null;
    pendingOp = null;
    justEvaluated = true;
    clearActiveOp();
    updateDisplay();
    return null;
  }
  const str = trimNumber(result);
  currentValue = str;
  return str;
}

function equalsWrapper() {
  if (pendingOp === null || previousValue === null) return;
  lastSecondOperand = currentValue;
  const result = compute(previousValue, currentValue, pendingOp);
  const usedOp = pendingOp;
  const usedPrev = previousValue;
  const finalVal = handleResult(result);
  if (finalVal !== null) {
    justEvaluated = true;
    previousValue = usedPrev;
    pendingOp = usedOp;
    clearActiveOp();
    updateDisplay();
    historyEl.textContent = `${usedPrev} ${usedOp} ${lastSecondOperand}`;
  }
}

function highlightOp(op) {
  clearActiveOp();
  opButtons.forEach(btn => {
    if (btn.dataset.op === op) btn.classList.add('active');
  });
}

function clearActiveOp() {
  opButtons.forEach(btn => btn.classList.remove('active'));
}

document.querySelectorAll('[data-num]').forEach(btn => {
  btn.addEventListener('click', () => inputDigit(btn.dataset.num));
});

document.querySelectorAll('[data-op]').forEach(btn => {
  btn.addEventListener('click', () => setOperator(btn.dataset.op));
});

document.querySelector('[data-action="clear"]').addEventListener('click', clearAll);
document.querySelector('[data-action="backspace"]').addEventListener('click', backspace);
document.querySelector('[data-action="percent"]').addEventListener('click', toggleSignOrPercent);
document.querySelector('[data-action="equals"]').addEventListener('click', equalsWrapper);

// Keyboard support
window.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') {
    inputDigit(e.key);
    flashKey(`[data-num="${e.key}"]`);
  } else if (e.key === '.') {
    inputDigit('.');
    flashKey('[data-num="."]');
  } else if (e.key === '+') {
    setOperator('+');
    flashKey('[data-op="+"]');
  } else if (e.key === '-') {
    setOperator('−');
    flashKey('[data-op="−"]');
  } else if (e.key === '*') {
    setOperator('×');
    flashKey('[data-op="×"]');
  } else if (e.key === '/') {
    e.preventDefault();
    setOperator('÷');
    flashKey('[data-op="÷"]');
  } else if (e.key === 'Enter' || e.key === '=') {
    equalsWrapper();
    flashKey('[data-action="equals"]');
  } else if (e.key === 'Backspace') {
    backspace();
    flashKey('[data-action="backspace"]');
  } else if (e.key === 'Escape') {
    clearAll();
    flashKey('[data-action="clear"]');
  } else if (e.key === '%') {
    toggleSignOrPercent();
    flashKey('[data-action="percent"]');
  }
});

function flashKey(selector) {
  const btn = document.querySelector(selector);
  if (!btn) return;
  btn.style.filter = 'brightness(1.4)';
  setTimeout(() => { btn.style.filter = ''; }, 100);
}

updateDisplay();