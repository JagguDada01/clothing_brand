/**
 * Velmora Store Logic & Cart State Management
 */

// DOM Elements
const cartButton = document.getElementById("cartButton");
const cartCount = document.getElementById("cartCount");
const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const cartClose = document.getElementById("cartClose");
const cartItems = document.getElementById("cartItems");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartTotal = document.getElementById("cartTotal");
const placeOrder = document.getElementById("placeOrder");
const authActions = document.getElementById("authActions");

// Modals
const authRequiredModal = document.getElementById("authRequiredModal");
const modalLoginBtn = document.getElementById("modalLoginBtn");
const modalSignupBtn = document.getElementById("modalSignupBtn");
const modalCancelBtn = document.getElementById("modalCancelBtn");

const orderConfirmModal = document.getElementById("orderConfirmModal");
const orderDetailsBox = document.getElementById("orderDetailsBox");
const orderDoneBtn = document.getElementById("orderDoneBtn");

const toastContainer = document.getElementById("toastContainer");

// Filter tabs
const categoryTabs = document.querySelectorAll(".cat-tab");
const productCards = document.querySelectorAll(".product-card");
const collectionSections = document.querySelectorAll(".collection-section");

// Pending item when unauthenticated
let pendingAddToCart = null;

// Cart State (Persisted in localStorage)
const CART_STORAGE_KEY = "velmora_cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cartArray) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartArray));
}

let cart = loadCart();

// Currency formatter
function formatMoney(value) {
  return "$" + Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Toast Notifications
function showToast(message, type = "normal") {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "✨";
  if (type === "success") icon = "✓";
  if (type === "warning") icon = "⚠️";

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

// Auth Header Sync
function updateAuthHeader() {
  if (!authActions) return;
  const activeUser = typeof getActiveUser === "function" ? getActiveUser() : null;

  if (activeUser) {
    const initial = (activeUser.name || "U")[0].toUpperCase();
    const firstName = (activeUser.name || "Member").split(" ")[0];

    authActions.innerHTML = `
      <div class="user-pill" title="Signed in as ${activeUser.email}">
        <span class="user-avatar">${initial}</span>
        <span>Hi, ${firstName}</span>
        <button class="btn-logout" id="logoutBtn" type="button">Log out</button>
      </div>
    `;

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      if (typeof logoutUser === "function") logoutUser();
      showToast("You have been signed out.", "normal");
      updateAuthHeader();
    });
  } else {
    authActions.innerHTML = `
      <a class="btn ghost" href="login.html" id="headerLoginBtn">Login</a>
      <a class="btn" href="signup.html" id="headerSignupBtn">Sign up</a>
    `;
  }
}

// Cart UI Controls
function openCart() {
  cartPanel.classList.add("open");
  cartOverlay.classList.add("open");
  cartPanel.setAttribute("aria-hidden", "false");
  cartOverlay.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartPanel.classList.remove("open");
  cartOverlay.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
  cartOverlay.setAttribute("aria-hidden", "true");
}

// Render Cart
function renderCart() {
  if (!cartItems) return;
  cartItems.innerHTML = "";

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCount) cartCount.textContent = totalCount;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🧺</div>
        <h4>Your shopping bag is empty</h4>
        <p class="muted" style="font-size:13px;">Explore our small-batch garments and reserve your piece.</p>
        <button class="btn sm ghost" style="margin-top:10px;" id="continueShoppingBtn">Explore Collection</button>
      </div>
    `;
    if (cartSubtotal) cartSubtotal.textContent = "$0.00";
    if (cartTotal) cartTotal.textContent = "$0.00";

    document.getElementById("continueShoppingBtn")?.addEventListener("click", () => {
      closeCart();
      const featured = document.getElementById("featured");
      if (featured) featured.scrollIntoView({ behavior: "smooth" });
    });
    return;
  }

  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.qty;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="cart-item-thumb" style="background-image: url('${item.image || 'assets/drop-arc-coat.jpg'}');"></div>
      <div class="cart-item-details">
        <h4 class="cart-item-title">${item.name}</h4>
        <div class="cart-item-meta">
          <span class="cart-size-badge">Size: ${item.size || 'M'}</span>
          <span>${formatMoney(item.price)}</span>
        </div>
        <div class="cart-item-price">${formatMoney(item.price * item.qty)}</div>
      </div>
      <div class="cart-item-actions">
        <div class="cart-stepper">
          <button class="qty-btn" data-key="${item.key}" data-action="dec" aria-label="Decrease quantity">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-key="${item.key}" data-action="inc" aria-label="Increase quantity">+</button>
        </div>
        <button class="cart-item-remove" data-key="${item.key}" data-action="remove" type="button">Remove</button>
      </div>
    `;
    cartItems.appendChild(div);
  });

  if (cartSubtotal) cartSubtotal.textContent = formatMoney(subtotal);
  if (cartTotal) cartTotal.textContent = formatMoney(subtotal);
}

// Add Item To Cart
function addItem(name, price, image, size = "M") {
  const itemKey = `${name}__${size}`;
  const existing = cart.find(item => item.key === itemKey);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      key: itemKey,
      name: name,
      price: Number(price),
      image: image,
      size: size,
      qty: 1
    });
  }

  saveCart(cart);
  renderCart();
}

// Handle Add to Cart Button Click
function handleAddToCart(btn) {
  const activeUser = typeof getActiveUser === "function" ? getActiveUser() : null;
  const name = btn.dataset.name;
  const price = Number(btn.dataset.price);
  const image = btn.dataset.image || "assets/drop-arc-coat.jpg";

  // Find selected size chip in the same product card
  const card = btn.closest(".product-card");
  let selectedSize = "M";
  if (card) {
    const selectedChip = card.querySelector(".size-chip.selected");
    if (selectedChip && selectedChip.dataset.size) {
      selectedSize = selectedChip.dataset.size;
    }
  }

  // Auth requirement check
  if (!activeUser) {
    pendingAddToCart = { name, price, image, size: selectedSize };
    openAuthModal(name);
    showToast("Sign in required to add items to bag.", "warning");
    return;
  }

  // If authenticated, add to cart
  addItem(name, price, image, selectedSize);
  showToast(`Added ${name} (${selectedSize}) to bag`, "success");
  openCart();
}

// Auth Required Modal Handlers
function openAuthModal(itemName = "") {
  if (!authRequiredModal) return;
  const title = document.getElementById("authModalTitle");
  if (title && itemName) {
    title.textContent = `Sign in to reserve "${itemName}"`;
  }
  authRequiredModal.classList.add("open");
}

function closeAuthModal() {
  if (!authRequiredModal) return;
  authRequiredModal.classList.remove("open");
}

if (modalCancelBtn) modalCancelBtn.onclick = closeAuthModal;

if (modalLoginBtn) {
  modalLoginBtn.onclick = () => {
    let dest = "login.html?redirect=index.html&reason=cart";
    if (pendingAddToCart) {
      dest += `&item=${encodeURIComponent(pendingAddToCart.name)}`;
    }
    window.location.href = dest;
  };
}

if (modalSignupBtn) {
  modalSignupBtn.onclick = () => {
    window.location.href = "signup.html?redirect=index.html";
  };
}

// Close modals when clicking backdrop
[authRequiredModal, orderConfirmModal].forEach(modal => {
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");
      }
    });
  }
});

// Stepper & Remove Actions in Cart
if (cartItems) {
  cartItems.onclick = function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const key = btn.dataset.key;
    const action = btn.dataset.action;
    if (!key || !action) return;

    const itemIndex = cart.findIndex(i => i.key === key);
    if (itemIndex === -1) return;

    if (action === "inc") {
      cart[itemIndex].qty += 1;
    } else if (action === "dec") {
      cart[itemIndex].qty -= 1;
      if (cart[itemIndex].qty <= 0) {
        cart.splice(itemIndex, 1);
        showToast("Item removed from bag.", "normal");
      }
    } else if (action === "remove") {
      cart.splice(itemIndex, 1);
      showToast("Item removed from bag.", "normal");
    }

    saveCart(cart);
    renderCart();
  };
}

// Place Order Flow
if (placeOrder) {
  placeOrder.onclick = function () {
    const activeUser = typeof getActiveUser === "function" ? getActiveUser() : null;

    if (cart.length === 0) {
      showToast("Your bag is empty. Please add items before checkout.", "warning");
      return;
    }

    if (!activeUser) {
      openAuthModal("Checkout");
      showToast("Please sign in to place your order.", "warning");
      return;
    }

    // Prepare order confirmation
    const orderId = "VEL-" + Math.floor(100000 + Math.random() * 900000);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (orderDetailsBox) {
      const itemsList = cart.map(i => `${i.qty}× ${i.name} (${i.size})`).join(", ");
      orderDetailsBox.innerHTML = `
        <div class="order-detail-line">
          <strong>Order Reference:</strong>
          <span>${orderId}</span>
        </div>
        <div class="order-detail-line">
          <strong>Client:</strong>
          <span>${activeUser.name}</span>
        </div>
        <div class="order-detail-line">
          <strong>Email:</strong>
          <span>${activeUser.email}</span>
        </div>
        <div class="order-detail-line">
          <strong>Garments:</strong>
          <span style="max-width:240px; text-align:right;">${itemsList}</span>
        </div>
        <div class="order-detail-line" style="border-top:1px dashed var(--border); padding-top:6px; font-weight:700;">
          <strong>Total Paid:</strong>
          <span>${formatMoney(subtotal)}</span>
        </div>
        <div class="order-detail-line" style="color:#27ae60;">
          <strong>Delivery:</strong>
          <span>Complimentary (Estimated 3-5 business days)</span>
        </div>
      `;
    }

    // Clear cart
    cart = [];
    saveCart(cart);
    renderCart();
    closeCart();

    // Show order confirmation modal
    if (orderConfirmModal) orderConfirmModal.classList.add("open");
  };
}

if (orderDoneBtn) {
  orderDoneBtn.onclick = () => {
    if (orderConfirmModal) orderConfirmModal.classList.remove("open");
  };
}

// Cart Drawer open/close buttons
if (cartButton) cartButton.onclick = openCart;
if (cartOverlay) cartOverlay.onclick = closeCart;
if (cartClose) cartClose.onclick = closeCart;

// Keyboard accessibility: ESC key to close open panels/modals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeCart();
    closeAuthModal();
    if (orderConfirmModal) orderConfirmModal.classList.remove("open");
  }
});

// Category Filter Tabs
categoryTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    categoryTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const filter = tab.dataset.filter;

    if (filter === "all") {
      // Show all sections and all cards
      collectionSections.forEach(sec => sec.style.display = "");
      productCards.forEach(card => card.style.display = "");
    } else {
      // Filter sections: show section if its data-section-category matches or has matching cards
      collectionSections.forEach(sec => {
        const secCat = sec.dataset.sectionCategory;
        if (secCat === filter) {
          sec.style.display = "";
          sec.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          sec.style.display = "none";
        }
      });
    }
  });
});

// Size Chips Selection
document.addEventListener("click", (e) => {
  const chip = e.target.closest(".size-chip");
  if (!chip) return;

  const container = chip.closest(".size-chips");
  if (!container) return;

  container.querySelectorAll(".size-chip").forEach(c => c.classList.remove("selected"));
  chip.classList.add("selected");
});

// Wire up all Add to Cart buttons
function setupAddToCartButtons() {
  const addButtons = document.querySelectorAll(".add-to-cart");
  addButtons.forEach(button => {
    button.onclick = function () {
      handleAddToCart(button);
    };
  });
}

// Initialization on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  updateAuthHeader();
  renderCart();
  setupAddToCartButtons();

  // Check if query param requested cart opening
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("openCart") === "true") {
    openCart();
  }
});