/**
 * Velmora Authentication System
 * Handles user registration, sign-in, session state, and redirection
 */

const STORAGE_USERS_KEY = "velmora_users";
const STORAGE_ACTIVE_USER_KEY = "velmora_active_user";

// Default seed accounts for immediate testing
const DEFAULT_USERS = [
  {
    name: "Eleanor Vance",
    email: "eleanor@velmora.in",
    password: "password123"
  },
  {
    name: "Julian Rivera",
    email: "julian@velmora.in",
    password: "password123"
  }
];

function initUsers() {
  const existing = localStorage.getItem(STORAGE_USERS_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
  }
}

initUsers();

function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY)) || DEFAULT_USERS;
  } catch (e) {
    return DEFAULT_USERS;
  }
}

function getActiveUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_ACTIVE_USER_KEY)) || null;
  } catch (e) {
    return null;
  }
}

function setActiveUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify({
      name: user.name,
      email: user.email
    }));
  } else {
    localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
  }
}

function logoutUser() {
  localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
}

function loginUser(email, password) {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!found) {
    return { success: false, message: "No account found with this email address." };
  }

  if (found.password !== password) {
    return { success: false, message: "Incorrect password. Please try again." };
  }

  const activeProfile = { name: found.name, email: found.email };
  setActiveUser(activeProfile);
  return { success: true, user: activeProfile };
}

function registerUser(name, email, password) {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, message: "An account with this email already exists." };
  }

  const newUser = {
    name: name.trim(),
    email: normalizedEmail,
    password: password
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));

  const activeProfile = { name: newUser.name, email: newUser.email };
  setActiveUser(activeProfile);
  return { success: true, user: activeProfile };
}

// URL parameters helper
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Auto-wire forms if present on login or signup pages
document.addEventListener("DOMContentLoaded", () => {
  // Login Form Handling
  const loginForm = document.querySelector(".auth-form#loginForm") || document.querySelector("body.auth-page .auth-form");
  const isLoginPage = window.location.pathname.endsWith("login.html") || document.title.includes("Login");

  if (isLoginPage && loginForm) {
    // Show alert banner for errors or redirect notices
    let notice = document.getElementById("authNotice");
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "authNotice";
      notice.className = "auth-notice";
      loginForm.parentNode.insertBefore(notice, loginForm);
    }

    const redirectReason = getQueryParam("reason");
    const itemAttempt = getQueryParam("item");
    if (redirectReason === "cart") {
      notice.className = "auth-notice info visible";
      notice.textContent = itemAttempt 
        ? `Please sign in to add "${decodeURIComponent(itemAttempt)}" to your cart.`
        : "Please sign in to access your cart and place orders.";
    }

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("loginEmail");
      const passwordInput = document.getElementById("loginPassword");
      
      const res = loginUser(emailInput.value, passwordInput.value);
      if (res.success) {
        notice.className = "auth-notice success visible";
        notice.textContent = `Welcome back, ${res.user.name}! Redirecting...`;
        
        setTimeout(() => {
          const redirect = getQueryParam("redirect");
          if (redirect) {
            window.location.href = decodeURIComponent(redirect);
          } else {
            window.location.href = "index.html";
          }
        }, 900);
      } else {
        notice.className = "auth-notice error visible";
        notice.textContent = res.message;
      }
    });
  }

  // Signup Form Handling
  const isSignupPage = window.location.pathname.endsWith("signup.html") || document.title.includes("Sign up");
  if (isSignupPage) {
    const signupForm = document.querySelector("body.auth-page .auth-form");
    if (signupForm) {
      let notice = document.getElementById("authNotice");
      if (!notice) {
        notice = document.createElement("div");
        notice.id = "authNotice";
        notice.className = "auth-notice";
        signupForm.parentNode.insertBefore(notice, signupForm);
      }

      signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("signupName");
        const emailInput = document.getElementById("signupEmail");
        const passwordInput = document.getElementById("signupPassword");
        const confirmInput = document.getElementById("signupConfirm");

        if (passwordInput.value.length < 6) {
          notice.className = "auth-notice error visible";
          notice.textContent = "Password must be at least 6 characters long.";
          return;
        }

        if (passwordInput.value !== confirmInput.value) {
          notice.className = "auth-notice error visible";
          notice.textContent = "Passwords do not match. Please re-enter.";
          return;
        }

        const res = registerUser(nameInput.value, emailInput.value, passwordInput.value);
        if (res.success) {
          notice.className = "auth-notice success visible";
          notice.textContent = `Account created! Welcome to Velmora, ${res.user.name}. Redirecting...`;
          
          setTimeout(() => {
            const redirect = getQueryParam("redirect");
            if (redirect) {
              window.location.href = decodeURIComponent(redirect);
            } else {
              window.location.href = "index.html";
            }
          }, 1000);
        } else {
          notice.className = "auth-notice error visible";
          notice.textContent = res.message;
        }
      });
    }
  }
});
