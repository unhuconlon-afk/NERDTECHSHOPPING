const PRODUCTS_URL = "products.json";

async function fetchProducts() {
  try {
    const response = await fetch(PRODUCTS_URL);
    if (!response.ok) {
      throw new Error("Failed to load products.json");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Cart utilities
function getCart() {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  saveCart(cart);
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const el = document.getElementById("cart-count");
  if (el) {
    el.textContent = String(count);
  }
}

// Rendering helpers
function formatCurrency(value) {
  return value.toLocaleString("vi-VN") + "₫";
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";

  const badge = document.createElement("div");
  badge.className = "badge-hot";
  badge.textContent = "Quà tặng HOT";
  card.appendChild(badge);

  const imgWrap = document.createElement("a");
  imgWrap.href = `product-detail.html?id=${encodeURIComponent(product.id)}`;
  imgWrap.className = "product-image-wrapper";
  const img = document.createElement("img");
  img.src = product.image;
  img.alt = product.name;
  imgWrap.appendChild(img);
  card.appendChild(imgWrap);

  const nameLink = document.createElement("a");
  nameLink.href = imgWrap.href;
  const name = document.createElement("h3");
  name.className = "product-name";
  name.textContent = product.name;
  nameLink.appendChild(name);
  card.appendChild(nameLink);

  const specsBox = document.createElement("div");
  specsBox.className = "specs-box";
  if (Array.isArray(product.specs)) {
    product.specs.slice(0, 4).forEach((spec) => {
      const pill = document.createElement("span");
      pill.className = "spec-pill";
      pill.textContent = spec;
      specsBox.appendChild(pill);
    });
  }
  card.appendChild(specsBox);

  const prices = document.createElement("div");
  prices.className = "product-prices";
  const original = document.createElement("span");
  original.className = "price-original";
  original.textContent = formatCurrency(product.originalPrice);
  const finalPrice = document.createElement("span");
  finalPrice.className = "price-final";
  finalPrice.textContent = formatCurrency(product.price);
  prices.appendChild(original);
  prices.appendChild(finalPrice);
  card.appendChild(prices);

  if (product.stock < 3 && product.stock > 0) {
    const stock = document.createElement("p");
    stock.className = "stock-warning";
    stock.textContent = `Only ${product.stock} left!`;
    card.appendChild(stock);
  }

  const footer = document.createElement("div");
  footer.className = "product-card-footer";
  const addBtn = document.createElement("button");
  addBtn.className = "btn-primary";
  addBtn.type = "button";
  addBtn.textContent = "Add to Cart";
  addBtn.addEventListener("click", () => addToCart(product.id));
  footer.appendChild(addBtn);
  card.appendChild(footer);

  return card;
}

async function initHomePage() {
  const bestGrid = document.getElementById("best-selling-grid");
  if (!bestGrid) return;

  const products = await fetchProducts();
  const pcProducts = products.filter((p) => p.category === "pc");

  function renderByCpu(cpuTag) {
    bestGrid.innerHTML = "";
    const filtered = pcProducts.filter((p) =>
      Array.isArray(p.specs) ? p.specs.some((s) => s.toLowerCase().includes(cpuTag.toLowerCase())) : false
    );
    filtered.slice(0, 5).forEach((p) => {
      bestGrid.appendChild(createProductCard(p));
    });
  }

  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cpu = btn.getAttribute("data-cpu");
      renderByCpu(cpu || "i5");
    });
  });

  // Default tab
  renderByCpu("i5");
}

async function initShopPage() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;
  const products = await fetchProducts();
  grid.innerHTML = "";
  products.forEach((p) => grid.appendChild(createProductCard(p)));
}

async function initSalesPage() {
  const grid = document.getElementById("sales-grid");
  if (!grid) return;
  const products = await fetchProducts();
  const discounted = products.filter((p) => p.price < p.originalPrice);
  grid.innerHTML = "";
  discounted.forEach((p) => grid.appendChild(createProductCard(p)));
}

async function initProductDetailPage() {
  const page = document.getElementById("product-detail-page");
  if (!page) return;

  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");
  const id = idParam ? Number(idParam) : NaN;
  const products = await fetchProducts();
  const product = products.find((p) => p.id === id);
  if (!product) {
    page.innerHTML = "<p>Product not found.</p>";
    return;
  }

  const imgEl = document.getElementById("detail-image");
  const nameEl = document.getElementById("detail-name");
  const descEl = document.getElementById("detail-description");
  const specsEl = document.getElementById("detail-specs");
  const originalEl = document.getElementById("detail-original-price");
  const priceEl = document.getElementById("detail-price");
  const stockEl = document.getElementById("detail-stock");
  const addBtn = document.getElementById("detail-add-to-cart");

  imgEl.src = product.image;
  imgEl.alt = product.name;
  nameEl.textContent = product.name;
  descEl.textContent = product.description || "";
  specsEl.innerHTML = "";
  if (Array.isArray(product.specs)) {
    product.specs.forEach((spec) => {
      const pill = document.createElement("span");
      pill.className = "spec-pill";
      pill.textContent = spec;
      specsEl.appendChild(pill);
    });
  }
  originalEl.textContent = formatCurrency(product.originalPrice);
  priceEl.textContent = formatCurrency(product.price);

  if (product.stock === 0) {
    stockEl.textContent = "Out of Stock";
    stockEl.classList.add("out-of-stock");
    addBtn.disabled = true;
  } else {
    stockEl.textContent = `In stock: ${product.stock}`;
    addBtn.disabled = false;
  }

  addBtn.addEventListener("click", () => addToCart(product.id));
}

function initCartPage() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  const cart = getCart();
  if (cart.length === 0) {
    container.textContent = "Your cart is empty.";
    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.textContent = "0₫";
    return;
  }

  fetchProducts().then((products) => {
    container.innerHTML = "";
    let total = 0;
    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) return;
      const row = document.createElement("div");
      row.className = "cart-row";
      const lineTotal = product.price * item.quantity;
      total += lineTotal;
      row.textContent = `${product.name} x ${item.quantity} = ${formatCurrency(lineTotal)}`;
      container.appendChild(row);
    });
    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.textContent = formatCurrency(total);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  initHomePage();
  initShopPage();
  initSalesPage();
  initProductDetailPage();
  initCartPage();
});


