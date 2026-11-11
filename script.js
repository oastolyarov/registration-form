const form = document.getElementById('signupForm');
const phoneInput = document.getElementById('phone');
const phoneControl = document.getElementById('phoneControl');
const phoneClear = document.getElementById('phoneClear');
const passwordInput = document.getElementById('password');
const passwordControl = document.getElementById('passwordControl');
const confirmInput = document.getElementById('confirmPassword');
const confirmControl = document.getElementById('confirmControl');
const submitBtn = document.getElementById('submitBtn');

const phoneError = document.getElementById('phoneError');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');

const strengthMeter = document.getElementById('strengthMeter');
const strengthLabel = document.getElementById('strengthLabel');
const ruleItems = document.querySelectorAll('#passwordRules [data-rule]');

const successView = document.getElementById('successView');
const successMessage = document.getElementById('successMessage');
const restartBtn = document.getElementById('restartBtn');

// Поля, которые пользователь уже покинул: ошибки «не дописал» показываем только после этого.
const touched = { phone: false, password: false, confirm: false };

/* ---------- Телефон ---------- */

// Код страны +7 стоит в поле всегда, пользователь вводит только 10 цифр номера.
const PHONE_PREFIX = '+7';
const PHONE_DIGITS = 10;
const PHONE_MASK = '(###) ###-##-##';

// Телефон принимается только в формате +7 и ровно 10 цифр после кода страны.
function validatePhone(value) {
  return /^\+7[0-9]{10}$/.test(value);
}

// Цифры номера после +7. Номер, вставленный целиком (+7 999… или 8 999…), теряет код страны.
function extractPhoneDigits(raw) {
  let digits = raw.replace(/\D/g, '');
  if (digits.length > PHONE_DIGITS && /^[78]/.test(digits)) digits = digits.slice(1);
  return digits.slice(0, PHONE_DIGITS);
}

// 9991234567 -> (999) 123-45-67; неполный номер форматируется по мере набора.
function formatPhoneDigits(digits) {
  let out = '';
  let i = 0;
  for (const ch of PHONE_MASK) {
    if (i >= digits.length) break;
    out += ch === '#' ? digits[i++] : ch;
  }
  return out;
}

// Полный номер в виде +7XXXXXXXXXX.
function getPhoneValue() {
  return PHONE_PREFIX + phoneInput.value.replace(/\D/g, '');
}

// Переформатирует поле и оставляет курсор после той же по счёту цифры.
function formatPhoneInput() {
  const raw = phoneInput.value;
  const caret = phoneInput.selectionStart ?? raw.length;
  const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;

  const digits = extractPhoneDigits(raw);
  phoneInput.value = formatPhoneDigits(digits);

  if (document.activeElement !== phoneInput) return;
  const target = Math.min(digitsBeforeCaret, digits.length);
  let pos = 0;
  for (let seen = 0; pos < phoneInput.value.length && seen < target; pos++) {
    if (/\d/.test(phoneInput.value[pos])) seen++;
  }
  phoneInput.setSelectionRange(pos, pos);
}

function renderPhoneState() {
  const digitCount = phoneInput.value.replace(/\D/g, '').length;
  const show = touched.phone && digitCount > 0 && !validatePhone(getPhoneValue());
  phoneError.textContent = show ? `Номер неполный: нужно 10 цифр после +7, сейчас ${digitCount}` : '';
  phoneControl.classList.toggle('invalid', show);
  phoneClear.hidden = phoneInput.value.length === 0;
}

/* ---------- Пароль ---------- */

// Критерии надёжности: минимум 8 символов, строчная и заглавная латинская буква,
// цифра и спецсимвол. Кириллица и пробелы в пароле не допускаются.
const PASSWORD_MIN_LENGTH = 8;
const ALLOWED_PASSWORD_CHARS = /^[!-~]*$/; // печатные ASCII-символы без пробела
const SPECIAL_CHAR = /[!-\/:-@\[-`{-~]/; // ASCII-пунктуация: !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~

const PASSWORD_RULES = {
  length: { test: (v) => v.length >= PASSWORD_MIN_LENGTH, hint: `минимум ${PASSWORD_MIN_LENGTH} символов` },
  lower: { test: (v) => /[a-z]/.test(v), hint: 'строчная латинская буква' },
  upper: { test: (v) => /[A-Z]/.test(v), hint: 'заглавная латинская буква' },
  digit: { test: (v) => /[0-9]/.test(v), hint: 'цифра' },
  special: { test: (v) => SPECIAL_CHAR.test(v), hint: 'спецсимвол' },
};

function getPasswordChecks(value) {
  const checks = {};
  for (const [name, rule] of Object.entries(PASSWORD_RULES)) checks[name] = rule.test(value);
  return checks;
}

function getPasswordError(value) {
  if (!ALLOWED_PASSWORD_CHARS.test(value)) {
    return 'Только латинские буквы, цифры и спецсимволы, без пробелов и кириллицы';
  }

  const checks = getPasswordChecks(value);
  const missing = Object.keys(checks).filter((name) => !checks[name]).map((name) => PASSWORD_RULES[name].hint);
  return missing.length > 0 ? `Пароль слишком слабый, нужно: ${missing.join(', ')}` : '';
}

// 0 — пусто, 1 — слабый, 2 — средний, 3 — надёжный (выполнены все требования).
function getPasswordStrength(value) {
  if (value.length === 0) return 0;
  if (!ALLOWED_PASSWORD_CHARS.test(value)) return 1;

  const passed = Object.values(getPasswordChecks(value)).filter(Boolean).length;
  if (passed === Object.keys(PASSWORD_RULES).length) return 3;
  if (passed >= 3) return 2;
  return 1;
}

function isPasswordValid(value) {
  return value.length > 0 && getPasswordError(value) === '';
}

function renderPasswordState() {
  const value = passwordInput.value;
  const strength = getPasswordStrength(value);
  strengthMeter.dataset.level = String(strength);
  strengthLabel.textContent = ['', 'Слабый', 'Средний', 'Надёжный'][strength];

  const checks = getPasswordChecks(value);
  ruleItems.forEach((item) => {
    const ok = checks[item.dataset.rule];
    item.classList.toggle('ok', ok);
    item.querySelector('.rule-state').textContent = ok ? ': выполнено' : ': не выполнено';
  });

  // Запрещённые символы подсвечиваем сразу, недописанный пароль — когда пользователь ушёл из поля.
  const error = value ? getPasswordError(value) : '';
  const show = error !== '' && (touched.password || !ALLOWED_PASSWORD_CHARS.test(value));
  passwordError.textContent = show ? error : '';
  passwordControl.classList.toggle('invalid', show);
}

/* ---------- Совпадение паролей (по хэшу) ---------- */

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Пароли сравниваются по SHA-256 от их байтов в UTF-8. Заглавная и строчная буква,
// латинская «a» и кириллическая «а» — разные символы Юникода и дают разные хэши.
async function doPasswordsMatch(password, confirm) {
  if (confirm.length === 0) return false;
  if (!window.crypto || !crypto.subtle) return password === confirm; // Web Crypto недоступен: строгое сравнение
  const [passwordHash, confirmHash] = await Promise.all([sha256(password), sha256(confirm)]);
  return passwordHash === confirmHash;
}

let passwordsMatch = false;
let matchCheckId = 0;

// Хэш считается асинхронно: пока идёт проверка, считаем, что пароли не совпадают,
// а результат устаревшей проверки (пользователь успел ввести ещё символ) отбрасываем.
async function refreshPasswordsMatch() {
  const checkId = ++matchCheckId;
  passwordsMatch = false;
  updateSubmitButtonState();

  const match = await doPasswordsMatch(passwordInput.value, confirmInput.value);
  if (checkId !== matchCheckId) return;

  passwordsMatch = match;
  renderConfirmState();
  updateSubmitButtonState();
}

function renderConfirmState() {
  const confirm = confirmInput.value;
  const finishedTyping = touched.confirm || confirm.length >= passwordInput.value.length;
  const mismatch = confirm.length > 0 && !passwordsMatch && finishedTyping;
  confirmError.textContent = mismatch ? 'Пароли не совпадают' : '';
  confirmControl.classList.toggle('invalid', mismatch);
  confirmControl.classList.toggle('matched', passwordsMatch);
}

/* ---------- Форма ---------- */

function isFormValid() {
  return validatePhone(getPhoneValue()) && isPasswordValid(passwordInput.value) && passwordsMatch;
}

function updateSubmitButtonState() {
  submitBtn.disabled = !isFormValid();
}

phoneInput.addEventListener('keydown', (e) => {
  // Backspace сразу за скобкой, пробелом или дефисом удаляет предыдущую цифру, а не «застревает».
  if (e.key !== 'Backspace') return;
  const { selectionStart: start, selectionEnd: end, value } = phoneInput;
  if (start !== end) return;
  let pos = start;
  while (pos > 0 && /\D/.test(value[pos - 1])) pos--;
  if (pos !== start) phoneInput.setSelectionRange(pos, pos);
});

phoneInput.addEventListener('input', () => {
  formatPhoneInput();
  renderPhoneState();
  updateSubmitButtonState();
});

phoneInput.addEventListener('blur', () => {
  if (phoneInput.value) touched.phone = true;
  renderPhoneState();
});

phoneClear.addEventListener('click', () => {
  phoneInput.value = '';
  touched.phone = false;
  renderPhoneState();
  updateSubmitButtonState();
  phoneInput.focus();
});

passwordInput.addEventListener('input', () => {
  renderPasswordState();
  refreshPasswordsMatch();
});

passwordInput.addEventListener('blur', () => {
  if (passwordInput.value) touched.password = true;
  renderPasswordState();
});

confirmInput.addEventListener('input', refreshPasswordsMatch);

confirmInput.addEventListener('blur', () => {
  if (confirmInput.value) touched.confirm = true;
  renderConfirmState();
});

const visibilityToggles = document.querySelectorAll('[data-toggle]');

function setPasswordVisible(button, visible) {
  document.getElementById(button.dataset.toggle).type = visible ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(visible));
  button.setAttribute('aria-label', visible ? 'Скрыть пароль' : 'Показать пароль');
}

visibilityToggles.forEach((button) => {
  button.addEventListener('click', () => {
    setPasswordVisible(button, button.getAttribute('aria-pressed') !== 'true');
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isFormValid()) return;

  // Перед регистрацией ещё раз сверяем хэши — поле могли изменить в последний момент.
  if (!(await doPasswordsMatch(passwordInput.value, confirmInput.value))) {
    refreshPasswordsMatch();
    return;
  }

  successMessage.replaceChildren('Аккаунт для ', Object.assign(document.createElement('b'), {
    textContent: `${PHONE_PREFIX} ${phoneInput.value}`,
  }), ' создан.');
  form.hidden = true;
  successView.hidden = false;
  restartBtn.focus();
});

restartBtn.addEventListener('click', () => {
  form.reset();
  visibilityToggles.forEach((button) => setPasswordVisible(button, false));
  Object.keys(touched).forEach((field) => { touched[field] = false; });
  successView.hidden = true;
  form.hidden = false;
  syncForm();
  phoneInput.focus();
});

// Синхронизирует интерфейс с текущими значениями (в том числе восстановленными браузером).
function syncForm() {
  formatPhoneInput();
  renderPhoneState();
  renderPasswordState();
  renderConfirmState();
  refreshPasswordsMatch();
}

syncForm();
