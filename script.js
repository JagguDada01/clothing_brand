const cartButton = document.getElementById("cartButton");
const cartCount = document.getElementById("cartCount");
const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const cartClose = document.getElementById("cartClose");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const placeOrder = document.getElementById("placeOrder");
const addButtons = document.querySelectorAll(".add-to-cart");

const cart = new Map();

function formatMoney(value) {
  return "$" + value.toFixed(2);
}

// open cart
function openCart() {
  cartPanel.classList.add("open");
  cartOverlay.classList.add("open");
}

// close cart
function closeCart() {
  cartPanel.classList.remove("open");
  cartOverlay.classList.remove("open");
}

// update item count
function updateCount() {
  let count = 0;
  cart.forEach(item => count += item.qty);
  cartCount.textContent = count;
}

// render cart
function renderCart() {

  cartItems.innerHTML = "";

  if (cart.size === 0) {
    cartItems.innerHTML = "Cart is empty";
    cartTotal.textContent = "$0";
    updateCount();
    return;
  }

  let total = 0;

  cart.forEach(item => {

    total += item.price * item.qty;

    const div = document.createElement("div");

    div.innerHTML = `
      ${item.name} - ${formatMoney(item.price * item.qty)}
      <button data-name="${item.name}" data-action="dec">-</button>
      ${item.qty}
      <button data-name="${item.name}" data-action="inc">+</button>
      <br>
    `;

    cartItems.appendChild(div);

  });

  cartTotal.textContent = formatMoney(total);

  updateCount();
}

// add item
function addItem(name, price) {

  if (cart.has(name)) {
    cart.get(name).qty++;
  } else {
    cart.set(name, {name: name, price: price, qty: 1});
  }

  renderCart();
}

// add to cart buttons
addButtons.forEach(button => {

  button.onclick = function () {

    const name = button.dataset.name;
    const price = Number(button.dataset.price);

    addItem(name, price);

    openCart();

  };

});

// increase decrease
cartItems.onclick = function (e) {

  const name = e.target.dataset.name;
  const action = e.target.dataset.action;

  if (!name) return;

  if (action === "inc") cart.get(name).qty++;

  if (action === "dec") {

    cart.get(name).qty--;

    if (cart.get(name).qty <= 0)
      cart.delete(name);

  }

  renderCart();

};

// open close
cartButton.onclick = openCart;
cartOverlay.onclick = closeCart;
cartClose.onclick = closeCart;

// place order
placeOrder.onclick = function () {

  if (cart.size === 0) {
    alert("Cart empty");
    return;
  }

  alert("Order placed");

  cart.clear();

  renderCart();

  closeCart();

};

// initial render
renderCart();