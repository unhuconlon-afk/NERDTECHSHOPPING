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

// Simple front-end "auth" using localStorage
function getStoredAccount() {
  try {
    const raw = localStorage.getItem("userAccount");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredAccount(user) {
  localStorage.setItem("userAccount", JSON.stringify(user));
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("currentUser");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity: quantity });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
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

function clearCart() {
  saveCart([]);
  initCartPage();
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
  
  // Use the first image if it's an array
  const imageUrl = Array.isArray(product.image) ? product.image[0] : product.image;
  img.src = imageUrl || 'assets/images/placeholder.png';
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

  const priceBox = document.createElement("div");
  priceBox.className = "price-box";
  
  const oldPrice = document.createElement("div");
  oldPrice.className = "old-price";
  oldPrice.textContent = formatCurrency(product.originalPrice);
  priceBox.appendChild(oldPrice);
  
  const newPrice = document.createElement("div");
  newPrice.className = "new-price";
  newPrice.textContent = formatCurrency(product.price);
  
  if (product.originalPrice && product.price < product.originalPrice) {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    const discountTag = document.createElement("span");
    discountTag.className = "discount-tag";
    discountTag.textContent = `-${discount}%`;
    newPrice.appendChild(discountTag);
  }
  
  priceBox.appendChild(newPrice);
  card.appendChild(priceBox);

  if (product.stock < 5 && product.stock > 0) {
     const stock = document.createElement("div");
     stock.className = "stock-warning";
     stock.textContent = `Chỉ còn ${product.stock} ! duy nhất`;
     priceBox.appendChild(stock);
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

function renderRecentlyViewed(products) {
    const grid = document.getElementById("recently-viewed-grid");
    if (!grid) return;

    const recentlyViewedIds = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    
    if (recentlyViewedIds.length === 0) {
        if(grid.parentElement) grid.parentElement.style.display = 'none'; // Hide the whole section if empty
        return;
    }
    
    // Get product objects from the IDs, maintaining the order from the recently viewed list
    const recentlyViewedProducts = recentlyViewedIds.map(id => products.find(p => p.id === id)).filter(Boolean); // filter(Boolean) removes any undefined products

    grid.innerHTML = "";
    recentlyViewedProducts.forEach(p => {
        grid.appendChild(createProductCard(p));
    });
}

async function initHomePage() {
  const products = await fetchProducts();

  renderRecentlyViewed(products);

  // Handle Best-selling PCs with tabs
  const bestGrid = document.getElementById("best-selling-grid");
  if (bestGrid) {
    const pcProducts = products.filter((p) => p.category === "pc_gvn");

    function renderByCpu(cpuTag) {
      bestGrid.innerHTML = "";
      const searchTerms = cpuTag.toLowerCase().split(' ').filter(t => t !== 'series');

      const filtered = pcProducts.filter((p) =>
        Array.isArray(p.specs) ? p.specs.some((s) => {
            const lowerSpec = s.toLowerCase();
            return searchTerms.every(term => lowerSpec.includes(term));
        }) : false
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
    renderByCpu("Core i5");
  }
  
  // Generic renderer for other best-selling categories
  function renderCategory(category, gridId, count = 5) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    const categoryProducts = products.filter(p => p.category === category);
    grid.innerHTML = "";
    categoryProducts.slice(0, count).forEach(p => {
        grid.appendChild(createProductCard(p));
    });
  }
  
  // Render new sections
  renderCategory("laptop", "best-selling-laptops-grid", 5);
  renderCategory("monitor", "best-selling-monitors-grid", 5);
}

async function initShopPage() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;

  const allProducts = await fetchProducts();
  let currentCategory = "all";

  const categoryContainer = document.getElementById("category-filters");
  const pcFilters = document.getElementById("pc-filters");
  const phoneFilters = document.getElementById("phone-filters");

  function getActiveValues(groupName) {
    const group = document.querySelector(`.filter-chips[data-filter-group="${groupName}"]`);
    if (!group) return [];
    return Array.from(group.querySelectorAll(".filter-chip.active")).map((btn) =>
      btn.getAttribute("data-value")
    );
  }

  function matchesPcFilters(product) {
    const cpuValues = getActiveValues("cpu");
    const vgaValues = getActiveValues("vga");
    const ramValues = getActiveValues("ram");

    const specs = Array.isArray(product.specs) ? product.specs.join(" ").toLowerCase() : "";

    if (cpuValues.length && !cpuValues.some((v) => specs.includes(v.toLowerCase()))) {
      return false;
    }
    if (vgaValues.length && !vgaValues.some((v) => specs.includes(v.toLowerCase()))) {
      return false;
    }
    if (ramValues.length && !ramValues.some((v) => specs.includes(v.toLowerCase()))) {
      return false;
    }
    return true;
  }

  function matchesPhoneFilters(product) {
    const storageValues = getActiveValues("storage");
    const screenValues = getActiveValues("screen");

    if (storageValues.length && !storageValues.includes(product.storage)) {
      return false;
    }

    if (screenValues.length) {
      const size = product.screenSize || 0;
      const wantSmall = screenValues.includes("small");
      const wantLarge = screenValues.includes("large");
      const isSmall = size && size < 6.5;
      const isLarge = size && size >= 6.5;
      if (
        (wantSmall && !isSmall) &&
        (wantLarge && !isLarge) &&
        !(wantSmall && wantLarge)
      ) {
        return false;
      }
    }

    return true;
  }

  function renderProducts() {
    grid.innerHTML = "";
    const filtered = allProducts.filter((p) => {
      if (currentCategory === "pc") {
        if (p.category !== "pc" && p.category !== "laptop") return false;
        return matchesPcFilters(p);
      }
      if (currentCategory === "phone") {
        if (p.category !== "phone") return false;
        return matchesPhoneFilters(p);
      }
      // all
      if (p.category === "phone") {
        return matchesPhoneFilters(p);
      }
      if (p.category === "pc" || p.category === "laptop") {
        return matchesPcFilters(p);
      }
      return true;
    });

    filtered.forEach((p) => grid.appendChild(createProductCard(p)));
  }

  function updateFilterVisibility() {
    if (pcFilters) pcFilters.style.display = currentCategory === "phone" ? "none" : "block";
    if (phoneFilters) phoneFilters.style.display = currentCategory === "phone" ? "block" : "none";
  }

  if (categoryContainer) {
    categoryContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      const category = btn.getAttribute("data-category");
      if (!category) return;
      currentCategory = category;
      Array.from(categoryContainer.querySelectorAll(".filter-chip")).forEach((b) =>
        b.classList.remove("active")
      );
      btn.classList.add("active");
      updateFilterVisibility();
      renderProducts();
    });
  }

  document.querySelectorAll(".filter-chips[data-filter-group]").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      btn.classList.toggle("active");
      renderProducts();
    });
  });

  updateFilterVisibility();
  renderProducts();
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
    const productId = params.get("id") ? Number(params.get("id")) : NaN;
    
    if (isNaN(productId)) {
        page.innerHTML = "<h1>Product not found</h1><p>Invalid product ID.</p>";
        return;
    }

    const allProducts = await fetchProducts();
    const product = allProducts.find((p) => p.id === productId);

    if (!product) {
        page.innerHTML = "<h1>Product not found</h1><p>Sorry, we couldn't find this product.</p>";
        return;
    }

    // --- Add to Recently Viewed ---
    const MAX_RECENTLY_VIEWED = 5;
    let recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    // Remove any existing instance of this product ID
    recentlyViewed = recentlyViewed.filter(id => id !== product.id);
    // Add the new product ID to the front
    recentlyViewed.unshift(product.id);
    // Trim the list to the max size
    const trimmedList = recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem("recentlyViewed", JSON.stringify(trimmedList));

    // --- Populate Page Elements ---
    document.title = `NERDTechStore - ${product.name}`;
    
    // Breadcrumbs
    const bcCategory = document.getElementById("bc-category");
    const bcProductName = document.getElementById("bc-product-name");
    if (bcCategory) {
        bcCategory.textContent = product.category;
        bcCategory.href = `shop.html?category=${product.category}`;
    }
    if (bcProductName) bcProductName.textContent = product.name;

    // Gallery
    const mainImage = document.getElementById("main-product-image");
    const thumbnailsContainer = document.getElementById("thumbnail-gallery");
    const images = Array.isArray(product.image) ? product.image : [product.image];
    
    if (mainImage) mainImage.src = images[0] || 'assets/images/placeholder.png';
    
    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = "";
        images.forEach((imgSrc, index) => {
            const thumbDiv = document.createElement("div");
            thumbDiv.className = "thumbnail-item";
            if (index === 0) thumbDiv.classList.add("active");

            const thumbImg = document.createElement("img");
            thumbImg.src = imgSrc;
            thumbImg.alt = `Thumbnail ${index + 1}`;
            
            thumbDiv.appendChild(thumbImg);
            thumbnailsContainer.appendChild(thumbDiv);

            thumbDiv.addEventListener("click", () => {
                if (mainImage) mainImage.src = imgSrc;
                document.querySelectorAll(".thumbnail-item.active").forEach(activeThumb => activeThumb.classList.remove("active"));
                thumbDiv.classList.add("active");
            });
        });
    }

    // Product Info
    document.getElementById("detail-name").textContent = product.name;
    document.getElementById("detail-brand").textContent = product.brand || "N/A";
    document.getElementById("detail-price").textContent = formatCurrency(product.price);
    
    const originalPriceEl = document.getElementById("detail-original-price");
    if (product.originalPrice && product.originalPrice > product.price) {
        originalPriceEl.textContent = formatCurrency(product.originalPrice);
        originalPriceEl.style.display = "inline";
    } else {
        originalPriceEl.style.display = "none";
    }

    const stockEl = document.getElementById("detail-stock");
    if (product.stock > 0) {
        stockEl.textContent = `In Stock (${product.stock} available)`;
        stockEl.className = "stock-status in-stock";
    } else {
        stockEl.textContent = "Out of Stock";
        stockEl.className = "stock-status out-of-stock";
    }

    // Descriptions
    document.getElementById("detail-description").innerHTML = `<p>${product.description}</p>`;
    document.querySelector("#tab-description p").innerHTML = product.longDescription || product.description;

    // Specifications Tab
    const specsList = document.getElementById("specs-list");
    specsList.innerHTML = "";
    if (product.specs && typeof product.specs === 'object' && !Array.isArray(product.specs)) {
        for (const [key, value] of Object.entries(product.specs)) {
            const li = document.createElement("li");
            li.innerHTML = `<span class="spec-key">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                            <span class="spec-value">${value}</span>`;
            specsList.appendChild(li);
        }
    } else if (Array.isArray(product.specs)) { // Fallback for old array format
        product.specs.forEach(spec => {
             const li = document.createElement("li");
             li.innerHTML = `<span class="spec-value">${spec}</span>`;
             specsList.appendChild(li);
        });
    }


    // --- Interactivity ---

    // Quantity Selector
    const qtyMinus = document.getElementById("quantity-minus");
    const qtyPlus = document.getElementById("quantity-plus");
    const qtyInput = document.getElementById("quantity-input");
    
    qtyMinus.addEventListener("click", () => {
        let current = parseInt(qtyInput.value, 10);
        if (current > 1) qtyInput.value = current - 1;
    });

    qtyPlus.addEventListener("click", () => {
        let current = parseInt(qtyInput.value, 10);
        if (current < product.stock) qtyInput.value = current + 1;
    });
    
    qtyInput.addEventListener("change", () => {
        let current = parseInt(qtyInput.value, 10);
        if (isNaN(current) || current < 1) qtyInput.value = 1;
        if (current > product.stock) qtyInput.value = product.stock;
    });

    // Add to Cart Button
    const addToCartBtn = document.getElementById("detail-add-to-cart");
    if (product.stock === 0) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = "Out of Stock";
    } else {
        addToCartBtn.addEventListener("click", () => {
            const quantity = parseInt(qtyInput.value, 10);
            addToCart(product.id, quantity);
        });
    }

    // Tabs
    const tabHeaders = document.querySelectorAll(".tab-link");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabHeaders.forEach(header => {
        header.addEventListener("click", () => {
            const targetTab = header.getAttribute("data-tab");

            tabHeaders.forEach(h => h.classList.remove("active"));
            header.classList.add("active");

            tabPanes.forEach(pane => {
                if (pane.id === `tab-${targetTab}`) {
                    pane.classList.add("active");
                } else {
                    pane.classList.remove("active");
                }
            });
        });
    });

    // --- Related Products ---
    const relatedGrid = document.getElementById("related-products-grid");
    if (relatedGrid) {
const relatedProducts = allProducts.filter(p => p.brand === product.brand && p.id !== product.id).slice(0, 4);
        relatedGrid.innerHTML = "";
        if (relatedProducts.length > 0) {
            relatedProducts.forEach(p => relatedGrid.appendChild(createProductCard(p)));
        } else {
            relatedGrid.innerHTML = "<p>No related products found.</p>";
        }
    }
}


function initCartPage() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  const clearCartBtn = document.getElementById('clear-cart-btn');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
  }

  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>"; // Use innerHTML for consistent rendering
    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.textContent = formatCurrency(0);
    
    // Hide buttons if cart is empty
    const checkoutButton = document.querySelector('a[href="checkout.html"]');
    if (checkoutButton) checkoutButton.style.display = 'none';
    if (clearCartBtn) clearCartBtn.style.display = 'none';
    
    return;
  } else {
    // Ensure buttons are visible if cart is not empty
    const checkoutButton = document.querySelector('a[href="checkout.html"]');
    if (checkoutButton) checkoutButton.style.display = 'inline-block';
    if (clearCartBtn) clearCartBtn.style.display = 'inline-block';
  }

  fetchProducts().then((products) => {
    container.innerHTML = ""; // Clear previous content
    let total = 0;
    
    // Create table structure
    const table = document.createElement('table');
    table.className = 'cart-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    `;
    const tbody = table.querySelector('tbody');

    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) return;

      const lineTotal = product.price * item.quantity;
      total += lineTotal;

      const row = document.createElement("tr");
      row.className = "cart-item-row";
      row.innerHTML = `
        <td class="cart-item-product">
          <img src="${Array.isArray(product.image) ? product.image[0] : product.image}" alt="${product.name}" class="cart-item-image">
          <span>${product.name}</span>
        </td>
        <td class="cart-item-quantity">${item.quantity}</td>
        <td class="cart-item-price">${formatCurrency(product.price)}</td>
        <td class="cart-item-total">${formatCurrency(lineTotal)}</td>
        <td class="cart-item-remove">
          <button class="remove-item-btn" data-product-id="${product.id}">&times;</button>
        </td>
      `;
      
      tbody.appendChild(row);
    });

    container.appendChild(table);

    // Add event listeners to remove buttons
    container.querySelectorAll('.remove-item-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const productId = Number(event.target.dataset.productId);
        removeFromCart(productId);
        initCartPage();
      });
    });

    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.textContent = formatCurrency(total);
  });
}

function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById("hamburgerMenu");
  const mobileDrawer = document.getElementById("mobileDrawer");
  const mobileOverlay = document.getElementById("mobileOverlay");
  const drawerClose = document.getElementById("drawerClose");
  const drawerLinks = document.querySelectorAll(".drawer-link");
  const mobileSearchToggle = document.getElementById("mobileSearchToggle");
  const searchContainer = document.getElementById("searchContainer");

  if (!hamburgerBtn || !mobileDrawer) return;

  function toggleDrawer() {
    hamburgerBtn.classList.toggle("active");
    mobileDrawer.classList.toggle("active");
    mobileOverlay.classList.toggle("active");
  }

  function toggleMobileSearch() {
    if (searchContainer) {
      searchContainer.classList.toggle("active");
    }
  }

  hamburgerBtn.addEventListener("click", toggleDrawer);

  if (drawerClose) {
    drawerClose.addEventListener("click", toggleDrawer);
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener("click", toggleDrawer);
  }

  if (mobileSearchToggle) {
    mobileSearchToggle.addEventListener("click", toggleMobileSearch);
  }

  drawerLinks.forEach((link) => {
    link.addEventListener("click", toggleDrawer);
  });

  // Close mobile search when clicking on search input
  if (searchContainer) {
    const searchInput = searchContainer.querySelector(".search-input");
    if (searchInput) {
      searchInput.addEventListener("focus", () => {
        if (window.innerWidth <= 640) {
          searchContainer.classList.add("active");
        }
      });
    }
  }
}

// Enable click-to-open behavior for sidebar mega items (useful on touch/mobile)
function initSidebarMenu() {
  const sidebar = document.querySelector('.sidebar-menu');
  if (!sidebar) return;

  // Toggle open class on click for items that have mega panels
  const toggles = sidebar.querySelectorAll('li.has-mega > a');
  toggles.forEach((link) => {
    link.addEventListener('click', (e) => {
      // On small screens, toggle the panel instead of following the link
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const li = link.parentElement;
        if (!li) return;
        li.classList.toggle('open');
      }
    });
  });

  // Close open mega panels when clicking outside
  document.addEventListener('click', (e) => {
    const inside = e.target.closest('.sidebar-menu');
    if (!inside) {
      sidebar.querySelectorAll('li.open').forEach((li) => li.classList.remove('open'));
    }
  });
}

function initAuthForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value.trim();
      const errorEl = document.getElementById("register-error");

      if (!name || !email || !password) {
        if (errorEl) errorEl.textContent = "Vui lòng điền đầy đủ thông tin.";
        return;
      }

      const user = { name, email, password };
      setStoredAccount(user);
      setCurrentUser({ name, email });
      if (errorEl) errorEl.textContent = "";
      window.location.href = "index.html";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const errorEl = document.getElementById("login-error");
      const stored = getStoredAccount();

      if (!stored || stored.email !== email || stored.password !== password) {
        if (errorEl) errorEl.textContent = "Tài khoản hoặc mật khẩu không đúng.";
        return;
      }

      setCurrentUser({ name: stored.name, email: stored.email });
      if (errorEl) errorEl.textContent = "";
      window.location.href = "index.html";
    });
  }
}

function initSearchBar() {
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  
  if (!searchInput || !searchResults) return;

  let allProducts = [];
  
  // Load products on init
  fetchProducts().then((products) => {
    allProducts = products;
  });

  function renderSearchResults(query) {
    if (!query.trim()) {
      searchResults.classList.remove("active");
      return;
    }

    const lowerQuery = query.toLowerCase();
    const keywords = lowerQuery.split(' ').filter(k => k);
    
    const categories = ['laptop', 'pc', 'phone', 'vga', 'cpu', 'mainboard', 'ram', 'ssd', 'monitor', 'mouse', 'keyboard', 'headset', 'chair'];
    let detectedCategory = '';
    const remainingKeywords = [];

    keywords.forEach(k => {
      if (categories.includes(k)) {
        detectedCategory = k;
      } else {
        remainingKeywords.push(k);
      }
    });

    const searchKeyword = remainingKeywords.join(' ');

    const filtered = allProducts.filter((product) => {
      let matchesKeyword = true;
      if (searchKeyword) {
        const nameMatch = product.name.toLowerCase().includes(searchKeyword);
        const specsMatch = Array.isArray(product.specs)
          ? product.specs.some((spec) => spec.toLowerCase().includes(searchKeyword))
          : false;
        const brandMatch = product.brand ? product.brand.toLowerCase().includes(searchKeyword) : false;
        matchesKeyword = nameMatch || specsMatch || brandMatch;
      }

      let matchesCategory = true;
      if (detectedCategory) {
        matchesCategory = product.category.toLowerCase() === detectedCategory;
      }

      return matchesKeyword && matchesCategory;
    }).slice(0, 6);

    if (filtered.length === 0) {
      searchResults.innerHTML = '<div class="search-no-results">Không tìm thấy sản phẩm</div>';
      searchResults.classList.add("active");
      return;
    }

    searchResults.innerHTML = filtered
      .map((product) => `
        <a href="product-detail.html?id=${encodeURIComponent(product.id)}" class="search-item">
          <img src="${product.image}" alt="${product.name}" />
          <div class="search-item-info">
            <h4 class="search-item-name">${product.name}</h4>
            <span class="search-item-price">${formatCurrency(product.price)}</span>
          </div>
        </a>
      `)
      .join("");
    
    searchResults.classList.add("active");
  }

  searchInput.addEventListener("input", (e) => {
    renderSearchResults(e.target.value);
  });

  // Handle Enter key to redirect to search page
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      // On search.html, the search is handled dynamically by initSearchPage
      if (window.location.pathname.includes("search.html")) {
        e.preventDefault();
        return;
      }
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `search.html?keyword=${encodeURIComponent(query)}`;
      }
      e.preventDefault();
    }
  });

  // Hide search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.remove("active");
    }
  });

  // Show search results when clicking on input
  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) {
      searchResults.classList.add("active");
    }
  });
}

function initMobileMenu() {
  const hamburger = document.getElementById("hamburger-btn");
  const drawer = document.getElementById("mobile-drawer");
  const overlay = document.getElementById("mobile-drawer-overlay");

  if (!hamburger || !drawer || !overlay) return;

  function closeDrawer() {
    drawer.classList.remove("open");
    overlay.classList.remove("active");
  }

  hamburger.addEventListener("click", () => {
    drawer.classList.toggle("open");
    overlay.classList.toggle("active");
  });

  overlay.addEventListener("click", () => {
    closeDrawer();
  });

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeDrawer());
  });
}

function updateUserNav() {
  const navList = document.querySelector(".main-nav ul");
  if (!navList) return;

  const loginLink = document.querySelector('.main-nav a[href="login.html"]');
  const registerLink = document.querySelector('.main-nav a[href="register.html"]');
  let userItem = document.getElementById("user-nav-item");
  const currentUser = getCurrentUser();

  if (currentUser) {
    if (loginLink && loginLink.parentElement) loginLink.parentElement.style.display = "none";
    if (registerLink && registerLink.parentElement) registerLink.parentElement.style.display = "none";

    if (!userItem) {
      userItem = document.createElement("li");
      userItem.id = "user-nav-item";
      const cartLi = navList.querySelector(".cart-link");
      navList.insertBefore(userItem, cartLi || null);
    }

    userItem.innerHTML = `Xin chào, <strong>${currentUser.name || currentUser.email}</strong>
      <button type="button" class="link-button" id="logout-btn">Đăng xuất</button>`;

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        clearCurrentUser();
        window.location.href = "index.html";
      });
    }
  } else {
    if (loginLink && loginLink.parentElement) loginLink.parentElement.style.display = "";
    if (registerLink && registerLink.parentElement) registerLink.parentElement.style.display = "";
    if (userItem) {
      userItem.remove();
    }
  }
}

async function initSearchPage() {
  const searchResultsContainer = document.getElementById("search-results-container");
  const noResults = document.getElementById("search-no-results");
  
  if (!searchResultsContainer || !noResults) {
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  let keyword = urlParams.get("keyword") || ""; // Use let to allow mutation
  const categoryFromUrl = urlParams.get("category");
  const brandFromUrl = urlParams.get("brand");
  const usageFromUrl = urlParams.get("usage");

  // Pre-select checkboxes from URL params
  if (categoryFromUrl) {
    const catCheckbox = document.querySelector(`.category-checkbox[value="${categoryFromUrl}"]`);
    if (catCheckbox) catCheckbox.checked = true;
  }
  if (brandFromUrl) {
    const brandValue = brandFromUrl.toLowerCase();
    const brandCheckbox = document.querySelector(`.brand-checkbox[value="${brandValue}"]`);
    if (brandCheckbox) brandCheckbox.checked = true;
  }
  if (usageFromUrl) {
    const usageCheckbox = document.querySelector(`.usage-checkbox[value="${usageFromUrl}"]`);
    if (usageCheckbox) usageCheckbox.checked = true;
  }

  const allProducts = await fetchProducts();
  
  const minPriceInput = document.getElementById("minPrice");
  const maxPriceInput = document.getElementById("maxPrice");
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  const categoryCheckboxes = document.querySelectorAll(".category-checkbox");
  const brandCheckboxes = document.querySelectorAll(".brand-checkbox");
  const usageCheckboxes = document.querySelectorAll(".usage-checkbox");
  const inStockCheckbox = document.getElementById("inStockOnly");
  const sortBySelect = document.getElementById("sortBy");
  const searchInput = document.getElementById("searchInput");

  function renderFilteredResults() {
    let minPrice = parseFloat(minPriceInput?.value);
    if (isNaN(minPrice)) minPrice = 0;
    let maxPrice = parseFloat(maxPriceInput?.value);
    if (isNaN(maxPrice)) maxPrice = Infinity;
    const selectedCategories = Array.from(categoryCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
    const selectedBrands = Array.from(brandCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
    const selectedUsages = Array.from(usageCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
    const inStockOnly = inStockCheckbox?.checked || false;
    const sortBy = sortBySelect?.value || "default";

    const lowerKeyword = keyword.toLowerCase();
    const keywords = lowerKeyword.split(' ').filter(k => k);
    
    const categories = ['laptop', 'pc', 'phone', 'vga', 'cpu', 'mainboard', 'ram', 'ssd', 'monitor', 'mouse', 'keyboard', 'headset', 'chair'];
    let detectedCategory = '';
    const remainingKeywords = [];

    keywords.forEach(k => {
      if (categories.includes(k)) {
        detectedCategory = k;
      } else {
        remainingKeywords.push(k);
      }
    });

    const searchKeyword = remainingKeywords.join(' ');

    let filtered = allProducts.filter((product) => {
      let matchesKeyword = true;
      if (searchKeyword) {
        const nameMatch = product.name.toLowerCase().includes(searchKeyword);
        const specsMatch = Array.isArray(product.specs)
          ? product.specs.some((spec) => spec.toLowerCase().includes(searchKeyword))
          : false;
        const brandMatch = product.brand ? product.brand.toLowerCase().includes(searchKeyword) : false;
        matchesKeyword = nameMatch || specsMatch || brandMatch;
      }

      const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
      
      let matchesCategory = true;
      if (detectedCategory) {
        matchesCategory = product.category.toLowerCase() === detectedCategory;
      } else {
        matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(product.category);
      }
      
      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(product.brand?.toLowerCase());

      const matchesUsage =
        selectedUsages.length === 0 || selectedUsages.some(usage => product.usage?.toLowerCase().includes(usage.toLowerCase()));

      const matchesStock = !inStockOnly || product.stock > 0;

      return matchesKeyword && matchesPrice && matchesCategory && matchesBrand && matchesUsage && matchesStock;
    });

    if (sortBy === "price-low-high") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high-low") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    if (filtered.length === 0) {
      noResults.style.display = "block";
      searchResultsContainer.innerHTML = "";
    } else {
      noResults.style.display = "none";
        searchResultsContainer.innerHTML = "";
        filtered.forEach((product) => {
          searchResultsContainer.appendChild(createProductCard(product));
        });
    }
  }

  // Listener for dynamic search on this page
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            keyword = searchInput.value.trim();
            renderFilteredResults();
        }
    });
  }

  renderFilteredResults();

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", renderFilteredResults);
  }
  categoryCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", renderFilteredResults);
  });
  brandCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", renderFilteredResults);
  });
  usageCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", renderFilteredResults);
  });
  if (inStockCheckbox) {
    inStockCheckbox.addEventListener("change", renderFilteredResults);
  }
  if (sortBySelect) {
    sortBySelect.addEventListener("change", renderFilteredResults);
  }
}

function initAdvancedSearchButton() {
  const adv = document.getElementById('advancedSearchBtn');
  if (!adv) return;
  adv.addEventListener('click', () => {
    const q = document.getElementById('searchInput')?.value.trim();
    const url = new URL('search.html', window.location.href);
    if (q) url.searchParams.set('keyword', q);
    url.searchParams.set('filters', '1');
    window.location.href = url.toString();
  });
}

function setupResponsiveSidebar() {
  const homeLayout = document.querySelector('.home-layout');
  const sidebar = document.querySelector('.mega-sidebar');
  const drawer = document.getElementById('mobileDrawer');

  if (!sidebar || !drawer || !homeLayout) {
    return;
  }

  const originalParent = sidebar.parentElement;
  const originalNextSibling = sidebar.nextElementSibling;

  function moveSidebar() {
    if (window.innerWidth <= 768) {
      if (!drawer.contains(sidebar)) {
        drawer.appendChild(sidebar);
      }
    } else {
      if (!originalParent.contains(sidebar)) {
        originalParent.insertBefore(sidebar, originalNextSibling);
      }
    }
  }

  moveSidebar();
  window.addEventListener('resize', moveSidebar);
}

function initCheckoutPage() {
  const checkoutForm = document.querySelector(".checkout-form");
  if (!checkoutForm) return;

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const address = document.getElementById("address").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!name || !address || !phone) {
      alert("Please fill out all fields.");
      return;
    }

    // Clear the cart
    saveCart([]);

    // Display thank you message
    const mainContent = document.querySelector(".page-main");
    if (mainContent) {
      mainContent.innerHTML = "<h1>Thank you for your order!</h1>";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateUserNav();
  initSearchBar();
  initHamburgerMenu();
  initSidebarMenu();
  initAdvancedSearchButton();
  initSearchPage();
  initHomePage();
  initShopPage();
  initSalesPage();
  initProductDetailPage();
  initCartPage();
  initAuthForms();
  initCheckoutPage();
  setupResponsiveSidebar();
});
