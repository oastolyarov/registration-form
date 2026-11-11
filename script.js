
const form = document.getElementById('signupForm');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('submitBtn');

const phoneError = document.getElementById('phoneError');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

const strengthBar = document.getElementById('strengthBar');
const strengthLabel = document.getElementById('strengthLabel');
const pashaPop = document.getElementById('pashaPop');
const sashaPop = document.getElementById('sashaPop');

let phoneHasInvalidInput = false;

function normalizePhone(value) {
  const allowedCharacters = /^[0-9+() -]*$/;

  if (!allowedCharacters.test(value)) {
    return null;
  }

  if ((value.match(/\+/g) || []).length > 1) {
    return null;
  }

  if (value.includes('+') && !value.startsWith('+')) {
    return null;
  }

  if (value.startsWith('+') && !value.startsWith('+7')) {
    return null;
  }

  let digits = value.replace(/\D/g, '');

  if (digits.length === 0) {
    return '';
  }

  if (digits[0] === '8') {
    digits = '7' + digits.slice(1);
  }

  // Разрешаем ввод десятизначного номера с 9,
  // но не подменяем произвольный код страны.
  if (digits[0] === '9') {
    if (value.startsWith('+')) return null;
    digits = '7' + digits;
  }

  if (digits[0] !== '7' || digits.length > 11) {
    return null;
  }

  return digits;
}

function validatePhone(value) {
  if (phoneHasInvalidInput) return false;

  const digits = normalizePhone(value);

  return digits !== null &&
    /^79\d{9}$/.test(digits);
}

function formatPhone(digits) {
  if (!digits) return '';

  const rest = digits.slice(1);
  let result = '+7';

  if (rest.length > 0) {
    result += ' (' + rest.slice(0, 3);
  }

  if (rest.length > 3) {
    result += ') ' + rest.slice(3, 6);
  }

  if (rest.length > 6) {
    result += '-' + rest.slice(6, 8);
  }

  if (rest.length > 8) {
    result += '-' + rest.slice(8, 10);
  }

  return result;
}

function getPasswordStrength(value) {
  if (value.length === 0) return 0;
  if (value.length < 8) return 1;

  let score = 0;

  if (value.length >= 8) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`~]/.test(value)) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;

  if (score <= 1) return 1;
  if (score <= 2) return 2;

  return 3;
}

function isPasswordValid(value) {
  return (
    getPasswordStrength(value) >= 2 &&
    value.length >= 8 &&
    !/\s/.test(value)
  );
}

function doPasswordsMatch(password, confirm) {
  return password === confirm && confirm.length > 0;
}

function updateStrengthUI(value) {
  const strength = getPasswordStrength(value);

  const widths = ['0%', '33%', '66%', '100%'];
  const colors = [
    '#eaeaea',
    '#e5484d',
    '#f5a623',
    '#1a7f37'
  ];
  const labels = ['', 'Слабый', 'Средний', 'Сильный'];

  strengthBar.style.width = widths[strength];
  strengthBar.style.background = colors[strength];
  strengthLabel.textContent = labels[strength];
}

function isFormValid() {
  const phoneOk = validatePhone(phoneInput.value);
  const passwordOk = isPasswordValid(passwordInput.value);
  const confirmOk = doPasswordsMatch(
    passwordInput.value,
    confirmInput.value
  );

  return phoneOk && passwordOk && confirmOk;
}

function updateSubmitButtonState() {
  submitBtn.disabled = !isFormValid();

  submitBtn.style.opacity = submitBtn.disabled
    ? '0.5'
    : '1';

  submitBtn.style.cursor = submitBtn.disabled
    ? 'not-allowed'
    : 'pointer';
}

phoneInput.addEventListener('focus', () => {
  if (phoneInput.value.trim() === '') {
    phoneInput.value = '+7';
  }
});

phoneInput.addEventListener('input', () => {
  // Удаляем все буквы и недопустимые символы
  const cleanedValue = phoneInput.value.replace(/[^0-9+() -]/g, '');

  phoneInput.value = cleanedValue;

  const digits = normalizePhone(cleanedValue);

  if (digits === null) {
    phoneHasInvalidInput = true;
    phoneError.textContent = 'Некорректный номер телефона';
  } else {
    phoneHasInvalidInput = false;
    phoneInput.value = formatPhone(digits);

    if (digits.length < 11) {
      phoneError.textContent = '';
    } else {
      phoneError.textContent = validatePhone(phoneInput.value)
        ? ''
        : 'Введите корректный номер телефона';
    }
  }

  updateSubmitButtonState();
});

phoneInput.addEventListener('blur', () => {
  if (
    phoneInput.value !== '' &&
    !validatePhone(phoneInput.value)
  ) {
    phoneError.textContent =
      'Введите номер в формате +7 (999) 123-45-67';
  }

  if (phoneInput.value === '+7') {
    phoneInput.value = '';
    phoneError.textContent = '';
  }

  updateSubmitButtonState();
});

passwordInput.addEventListener('input', () => {
  updateStrengthUI(passwordInput.value);

  if (passwordInput.value.length === 0) {
    passwordError.textContent = '';
  } else if (!isPasswordValid(passwordInput.value)) {
    passwordError.textContent =
      'Пароль слишком слабый: минимум 8 символов, добавьте цифры или спецсимволы';
  } else {
    passwordError.textContent = '';
  }

  if (confirmInput.value.length > 0) {
    confirmError.textContent = doPasswordsMatch(
      passwordInput.value,
      confirmInput.value
    )
      ? ''
      : 'Пароли не совпадают';
  }

  updateSubmitButtonState();
});

confirmInput.addEventListener('input', () => {
  if (confirmInput.value.length === 0) {
    confirmError.textContent = '';
  } else if (!doPasswordsMatch(
    passwordInput.value,
    confirmInput.value
  )) {
    confirmError.textContent = 'Пароли не совпадают';
  } else {
    confirmError.textContent = '';
  }

  updateSubmitButtonState();
});

let toastTimer;
let pashaTimer;
let sashaTimer;

function showSuccessToast() {
  successText.textContent =
    'Регистрация прошла успешно!';

  successMessage.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    successMessage.classList.remove('show');
  }, 3500);
}

function showPasha() {
  pashaPop.classList.add('show');

  clearTimeout(pashaTimer);
  pashaTimer = setTimeout(() => {
    pashaPop.classList.remove('show');
  }, 4500);
}

function showSasha() {
  sashaPop.classList.add('show');

  clearTimeout(sashaTimer);
  sashaTimer = setTimeout(() => {
    sashaPop.classList.remove('show');
  }, 4500);
}

function resetForm() {
  form.reset();

  phoneHasInvalidInput = false;

  phoneError.textContent = '';
  passwordError.textContent = '';
  confirmError.textContent = '';

  updateStrengthUI('');
  updateSubmitButtonState();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (isFormValid()) {
    showSuccessToast();
    showPasha();
    showSasha();
    resetForm();
  }
});

updateStrengthUI(passwordInput.value);
updateSubmitButtonState();
