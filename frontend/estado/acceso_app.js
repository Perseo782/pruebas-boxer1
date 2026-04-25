(function () {
  "use strict";

  var form = document.getElementById("access-form");
  var userInput = document.getElementById("access-user");
  var passwordInput = document.getElementById("access-password");
  var submitButton = document.getElementById("access-submit");
  var toggleButton = document.getElementById("password-toggle");
  var userHelp = document.getElementById("user-help");
  var passwordHelp = document.getElementById("password-help");
  var formMessage = document.getElementById("form-message");
  var toast = document.getElementById("access-toast");
  var BACKEND_URL = "https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api";
  var APP_TARGET = "./gestion_registros.html";
  var MAX_FAILED_ATTEMPTS = 3;
  var LOCK_MS = 5 * 60 * 1000;
  var FAILS_KEY = "alergenos_access_failed_attempts";
  var LOCK_KEY = "alergenos_access_lock_until";
  var SESSION_TOKEN_KEY = "alergenos_session_token";
  var RUNTIME_TOKEN_KEY = "fase5_visible_session_token";
  var RUNTIME_BACKEND_KEY = "fase5_visible_backend_url";
  var lockTimer = 0;

  if (!form || !userInput || !passwordInput || !submitButton || !toggleButton) {
    return;
  }

  function setHelp(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-error", kind === "error");
    el.classList.toggle("is-warning", kind === "warning");
  }

  function setMessage(text, kind) {
    if (!formMessage) return;
    formMessage.textContent = text;
    formMessage.classList.toggle("is-error", kind === "error");
  }

  function showToast(text, kind) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.toggle("is-error", kind === "error");
    toast.classList.toggle("is-warning", kind === "warning");
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 4500);
  }

  function readNumber(key) {
    try {
      return Number(window.localStorage.getItem(key) || "0") || 0;
    } catch (error) {
      return 0;
    }
  }

  function writeNumber(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (error) {
      return false;
    }
    return true;
  }

  function clearAccessGuard() {
    try {
      window.localStorage.removeItem(FAILS_KEY);
      window.localStorage.removeItem(LOCK_KEY);
    } catch (error) {
      return false;
    }
    return true;
  }

  function persistSessionToken(token) {
    var safeToken = String(token || "").trim();
    try {
      window.sessionStorage.setItem(SESSION_TOKEN_KEY, safeToken);
      window.localStorage.setItem(RUNTIME_TOKEN_KEY, safeToken);
      window.localStorage.setItem(RUNTIME_BACKEND_KEY, BACKEND_URL);
    } catch (error) {
      return false;
    }
    return true;
  }

  function formatRemaining(ms) {
    var totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  function getLockRemainingMs() {
    var until = readNumber(LOCK_KEY);
    return Math.max(0, until - Date.now());
  }

  function extractBackendMessage(payload) {
    if (!payload) return "Error desconocido.";
    if (typeof payload.error === "string") return payload.error;
    if (payload.error && typeof payload.error.mensaje === "string") return payload.error.mensaje;
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.mensaje === "string") return payload.mensaje;
    return "Error desconocido.";
  }

  async function loginFirebase(usuario, password) {
    var response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduloOrigen: "Web_Operativa",
        moduloDestino: "Seguridad",
        accion: "login",
        payload: {
          usuario: usuario,
          password: password
        }
      })
    });
    var raw = await response.text();
    var payload;
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch (error) {
      payload = { ok: false, error: raw || "Respuesta no JSON de Firebase." };
    }
    payload.__httpStatus = response.status;
    return payload;
  }

  function setLockedState() {
    var remaining = getLockRemainingMs();
    var locked = remaining > 0;

    userInput.disabled = locked;
    passwordInput.disabled = locked;
    toggleButton.disabled = locked;
    submitButton.disabled = locked || !getUserValue() || !getPasswordValue();

    if (locked) {
      var text = "Acceso bloqueado. Podras intentarlo de nuevo en " + formatRemaining(remaining) + ".";
      setMessage(text, "error");
      setHelp(passwordHelp, "Demasiados intentos incorrectos.", "error");
      window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(setLockedState, 1000);
      return true;
    }

    window.clearTimeout(lockTimer);
    return false;
  }

  function getUserValue() {
    return userInput.value.trim();
  }

  function getPasswordValue() {
    return passwordInput.value;
  }

  function validateFields(showMessages) {
    if (setLockedState()) return false;

    var userRaw = userInput.value;
    var user = getUserValue();
    var password = getPasswordValue();
    var hasUserSpaces = userRaw.length > 0 && userRaw !== user;
    var valid = true;

    if (!user) {
      valid = false;
      if (showMessages) {
        setHelp(userHelp, "Falta el usuario.", "error");
      } else {
        setHelp(userHelp, "Sin espacios al inicio ni al final.", "");
      }
    } else if (hasUserSpaces) {
      setHelp(userHelp, "He quitado espacios sobrantes para evitar errores.", "warning");
    } else {
      setHelp(userHelp, "Usuario preparado.", "");
    }

    if (!password) {
      valid = false;
      if (showMessages) {
        setHelp(passwordHelp, "Falta la contraseÃ±a.", "error");
      } else {
        setHelp(passwordHelp, "La contraseÃ±a queda oculta mientras escribes.", "");
      }
    } else {
      setHelp(passwordHelp, "ContraseÃ±a introducida.", "");
    }

    submitButton.disabled = !valid;
    if (!showMessages && valid) {
      setMessage("", "");
    }
    return valid;
  }

  function handleInput() {
    validateFields(false);
  }

  userInput.addEventListener("blur", function () {
    userInput.value = getUserValue();
    validateFields(false);
  });

  userInput.addEventListener("input", handleInput);
  passwordInput.addEventListener("input", handleInput);

  passwordInput.addEventListener("keydown", function (event) {
    if (event.getModifierState && event.getModifierState("CapsLock")) {
      setHelp(passwordHelp, "Mayusculas activadas.", "warning");
    }
  });

  passwordInput.addEventListener("keyup", function (event) {
    if (event.getModifierState && event.getModifierState("CapsLock")) {
      setHelp(passwordHelp, "Mayusculas activadas.", "warning");
    } else if (passwordInput.value) {
      setHelp(passwordHelp, "ContraseÃ±a introducida.", "");
    }
  });

  toggleButton.addEventListener("click", function () {
    var visible = passwordInput.type === "text";
    passwordInput.type = visible ? "password" : "text";
    toggleButton.textContent = visible ? "Ver" : "Ocultar";
    toggleButton.setAttribute("aria-pressed", String(!visible));
    passwordInput.focus();
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    userInput.value = getUserValue();

    if (setLockedState()) {
      showToast("Acceso bloqueado temporalmente. Espera a que termine la cuenta atras.", "error");
      return;
    }

    if (!validateFields(true)) {
      setMessage("Revisa los campos marcados antes de entrar.", "error");
      showToast("Faltan datos para poder entrar.", "warning");
      if (!getUserValue()) {
        userInput.focus();
      } else {
        passwordInput.focus();
      }
      return;
    }

    submitButton.disabled = true;
    setMessage("Comprobando credenciales.", "");

    try {
      var payload = await loginFirebase(getUserValue(), getPasswordValue());
      if (!payload || payload.ok !== true) {
        var backendMessage = extractBackendMessage(payload);
        var failedAttempts = readNumber(FAILS_KEY) + 1;
        var remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts);
        writeNumber(FAILS_KEY, failedAttempts);

        if (backendMessage === "Acceso bloqueado temporalmente" || failedAttempts >= MAX_FAILED_ATTEMPTS) {
          writeNumber(LOCK_KEY, Date.now() + LOCK_MS);
          setLockedState();
          showToast(backendMessage + ". Podras intentarlo de nuevo en 5 minutos.", "error");
          return;
        }

        setMessage(backendMessage + ". Quedan " + remainingAttempts + " intento" + (remainingAttempts === 1 ? "" : "s") + ".", "error");
        showToast(backendMessage + ". Quedan " + remainingAttempts + " intento" + (remainingAttempts === 1 ? "" : "s") + ".", "error");
        passwordInput.focus();
        submitButton.disabled = false;
        return;
      }

      clearAccessGuard();
      window.sessionStorage.setItem("alergenos_access_ok", "1");
      window.sessionStorage.setItem("alergenos_access_user", getUserValue());
      persistSessionToken(payload.token || "");
    } catch (error) {
      setMessage("No se pudo comprobar el acceso con Firebase: " + (error && error.message ? error.message : "error desconocido"), "error");
      showToast("No se pudo comprobar el acceso con Firebase.", "error");
      validateFields(false);
      return;
    }

    setMessage("Acceso correcto. Abriendo Gestion de alergenos.", "");
    showToast("Acceso correcto. Abriendo Gestion de alergenos.", "");
    window.location.href = APP_TARGET;
  });

  setLockedState();
  validateFields(false);
})();

