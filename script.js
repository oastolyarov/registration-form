const form = document.getElementById('signupForm');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('submitBtn');

const phoneError = document.getElementById('phoneError');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');
const successMessage = document.getElementById('successMessage');

const strengthBar = document.getElementById('strengthBar');
const strengthLabel = document.getElementById('strengthLabel');
const passwordRulesList = document.getElementById('passwordRules');

// Телефон: строго "+7" и ровно 10 цифр после кода страны.
const PHONE_PREFIX = '+7';
const PHONE_DIGITS = 10;
const PHONE_PATTERN = /^\+7\d{10}$/;

function validatePhone(value) {
  return PHONE_PATTERN.test(value);
}

// Приводит ввод к виду "+7XXXXXXXXXX": убирает всё, кроме цифр,
// отбрасывает код страны (+7, 7 или 8 в начале) и обрезает лишние цифры.
function normalizePhone(raw) {
  if (raw === '') return '';
  let digits = raw.replace(/\D/g, '');
  // Первая цифра 7 или 8 — это код страны ("+7…", "7…", "8…"), её отбрасываем
  if (digits[0] === '7' || digits[0] === '8') digits = digits.slice(1);
  return PHONE_PREFIX + digits.slice(0, PHONE_DIGITS);
}

function formatPhoneInput() {
  const raw = phoneInput.value;
  const caret = phoneInput.selectionStart ?? raw.length;
  // Сколько цифр абонента было слева от курсора — чтобы курсор не прыгал в конец
  const normalizedLeft = normalizePhone(raw.slice(0, caret));
  const digitsLeft = Math.max(0, normalizedLeft.length - PHONE_PREFIX.length);

  const formatted = normalizePhone(raw);
  if (formatted !== raw) {
    phoneInput.value = formatted;
    const pos = formatted ? Math.min(PHONE_PREFIX.length + digitsLeft, formatted.length) : 0;
    phoneInput.setSelectionRange(pos, pos);
  }
}

// Критерии надёжного пароля. Пароль считается безопасным только
// при выполнении ВСЕХ критериев.
const PASSWORD_RULES = [
  { id: 'length', test: (v) => v.length >= 8 },
  { id: 'lower', test: (v) => /\p{Ll}/u.test(v) },
  { id: 'upper', test: (v) => /\p{Lu}/u.test(v) },
  { id: 'digit', test: (v) => /\d/.test(v) },
  // Спецсимвол — любой символ, который не буква, не цифра и не пробел.
  // (Раньше кириллица ошибочно засчитывалась как спецсимвол.)
  { id: 'special', test: (v) => /[^\p{L}\p{N}\s]/u.test(v) },
  { id: 'noSpaces', test: (v) => v.length > 0 && !/\s/.test(v) },
];

function getPasswordChecks(value) {
  return PASSWORD_RULES.map((rule) => ({ id: rule.id, passed: rule.test(value) }));
}

function getPasswordStrength(value) {
  if (value.length === 0) return 0;

  const checks = getPasswordChecks(value);
  const passedCount = checks.filter((c) => c.passed).length;

  if (passedCount === PASSWORD_RULES.length) return 3; // Сильный
  if (value.length < 8) return 1; // короткий пароль не может быть даже «средним»
  if (passedCount >= PASSWORD_RULES.length - 2) return 2; // Средний
  return 1; // Слабый
}

function isPasswordValid(value) {
  return getPasswordChecks(value).every((c) => c.passed);
}

function doPasswordsMatch(password, confirm) {
  return password === confirm && confirm.length > 0;
}

function updateStrengthUI(value) {
  const strength = getPasswordStrength(value);
  const widths = ['0%', '33%', '66%', '100%'];
  const colors = ['#eaeaea', '#e5484d', '#f5a623', '#1a7f37'];
  const labels = ['', 'Слабый', 'Средний', 'Сильный'];

  strengthBar.style.width = widths[strength];
  strengthBar.style.background = colors[strength];
  strengthLabel.textContent = labels[strength];
  strengthLabel.style.color = strength === 0 ? '' : colors[strength];

  getPasswordChecks(value).forEach(({ id, passed }) => {
    const item = passwordRulesList.querySelector(`[data-rule="${id}"]`);
    if (item) item.classList.toggle('passed', passed);
  });
}

function setFieldError(input, errorEl, message) {
  errorEl.textContent = message;
  input.classList.toggle('invalid', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function isFormValid() {
  const phoneOk = validatePhone(phoneInput.value);
  const passwordOk = isPasswordValid(passwordInput.value);
  const confirmOk = doPasswordsMatch(passwordInput.value, confirmInput.value);
  return phoneOk && passwordOk && confirmOk;
}

function updateSubmitButtonState() {
  submitBtn.disabled = !isFormValid();
}

function clearSuccess() {
  successMessage.textContent = '';
}

const PHONE_ERROR = 'Введите номер в формате +7XXXXXXXXXX: +7 и 10 цифр';

function showPhoneError() {
  const v = phoneInput.value;
  setFieldError(phoneInput, phoneError, v && v !== PHONE_PREFIX && !validatePhone(v) ? PHONE_ERROR : '');
}

// При фокусе сразу подставляем "+7", чтобы оставалось ввести только 10 цифр
phoneInput.addEventListener('focus', () => {
  if (phoneInput.value === '') {
    phoneInput.value = PHONE_PREFIX;
    phoneInput.setSelectionRange(PHONE_PREFIX.length, PHONE_PREFIX.length);
  }
});

phoneInput.addEventListener('input', () => {
  clearSuccess();
  formatPhoneInput();
  // Пока номер набирается, не ругаемся; ошибку убираем, как только номер стал верным
  if (validatePhone(phoneInput.value)) setFieldError(phoneInput, phoneError, '');
  updateSubmitButtonState();
});

phoneInput.addEventListener('blur', () => {
  if (phoneInput.value === PHONE_PREFIX) phoneInput.value = '';
  showPhoneError();
});

passwordInput.addEventListener('input', () => {
  clearSuccess();
  updateStrengthUI(passwordInput.value);

  if (passwordInput.value.length === 0) {
    setFieldError(passwordInput, passwordError, '');
  } else if (!isPasswordValid(passwordInput.value)) {
    setFieldError(passwordInput, passwordError, 'Пароль недостаточно надёжный: выполните все требования ниже');
  } else {
    setFieldError(passwordInput, passwordError, '');
  }

  if (confirmInput.value.length > 0) {
    setFieldError(
      confirmInput,
      confirmError,
      doPasswordsMatch(passwordInput.value, confirmInput.value) ? '' : 'Пароли не совпадают'
    );
  }

  updateSubmitButtonState();
});

confirmInput.addEventListener('input', () => {
  clearSuccess();
  if (confirmInput.value.length === 0) {
    setFieldError(confirmInput, confirmError, '');
  } else if (!doPasswordsMatch(passwordInput.value, confirmInput.value)) {
    setFieldError(confirmInput, confirmError, 'Пароли не совпадают');
  } else {
    setFieldError(confirmInput, confirmError, '');
  }
  updateSubmitButtonState();
});

// Кнопка-глаз: показать / скрыть пароль
function setPasswordVisible(button, visible) {
  const input = document.getElementById(button.dataset.target);
  input.type = visible ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(visible));
  const label = visible ? 'Скрыть пароль' : 'Показать пароль';
  button.setAttribute('aria-label', label);
  button.title = label;
}

document.querySelectorAll('.toggle-password').forEach((button) => {
  button.addEventListener('click', () => {
    setPasswordVisible(button, button.getAttribute('aria-pressed') !== 'true');
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!isFormValid()) return;

  form.reset();
  [phoneInput, passwordInput, confirmInput].forEach((input) => {
    input.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
  });
  document.querySelectorAll('.toggle-password').forEach((b) => setPasswordVisible(b, false));
  updateStrengthUI('');
  updateSubmitButtonState();
  successMessage.textContent = 'Регистрация прошла успешно!';
});

updateStrengthUI('');
updateSubmitButtonState();
