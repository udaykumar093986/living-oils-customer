// Replace with the store's WhatsApp number, including country code, without + or spaces.
const WHATSAPP_NUMBER = "919676274545";

// Default catalog of products
const DEFAULT_PRODUCTS = [
 {id:"coconut",name:"కొబ్బరి నూనె",en:"Coconut Oil",prices:{1000:500,500:250,250:130},popular:true,desc:"Living Oils cold-pressed coconut oil.",image:"assets/coconut-product.jpg"},
 {id:"groundnut",name:"వేరు శనగ నూనె (పల్లిలు)",en:"Groundnut Oil",prices:{1000:350,500:180},popular:true,desc:"A traditional everyday cooking oil.",image:"assets/groundnut-product.jpg"},
 {id:"black-sesame",name:"నల్ల నువ్వుల నూనె",en:"Black Sesame Seed Oil",prices:{1000:480,500:250,250:140},popular:true,desc:"Wood-pressed black sesame seed oil.",image:"assets/black-sesame-product.jpg"},
 {id:"white-sesame",name:"తెల్ల నువ్వుల నూనె",en:"White Sesame Seed Oil",prices:{1000:480,500:250,250:140},popular:false,desc:"Wood-pressed white sesame seed oil.",image:"assets/white-sesame-product.jpg"},
 {id:"sunflower",name:"సన్‌ఫ్లవర్ నూనె",en:"Sunflower Oil",prices:{1000:500,500:250},popular:false,desc:"Living Oils cold-pressed sunflower oil.",image:"assets/sunflower-product.jpg"},
 {id:"kuridi-coconut",name:"కురిడి కొబ్బరి నూనె",en:"Kuridi Coconut Oil",prices:{1000:780,500:400,250:250},popular:false,desc:"Traditional Kuridi coconut oil.",image:"assets/kuridi-coconut-photo.jpg"}
];

const PRESET_IMAGES = [
  { label: "Coconut", src: "assets/coconut-product.jpg" },
  { label: "Groundnut", src: "assets/groundnut-product.jpg" },
  { label: "Black Sesame", src: "assets/black-sesame-product.jpg" },
  { label: "White Sesame", src: "assets/white-sesame-product.jpg" },
  { label: "Sunflower", src: "assets/sunflower-product.jpg" },
  { label: "Kuridi", src: "assets/kuridi-coconut-photo.jpg" },
  { label: "Oil Bottle", src: "assets/oil-bottle.svg" }
];

const STORAGE_PRODUCTS_KEY = "living_oils_products";
const ADMIN_PWD_KEY = "living_oils_admin_pwd";
const ADMIN_SESSION_KEY = "living_oils_admin_session";

function loadStoredProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read stored products:", e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
}

let products = loadStoredProducts();
const cart = {};

const packLabel = ml => ml === 1000 ? "1 litre" : (ml >= 1000 && ml % 1000 === 0 ? `${ml/1000} litre` : `${ml} ml`);
const packPrice = (product, ml) => product.prices[ml] ?? null;

const grid = document.querySelector("#productGrid");
const search = document.querySelector("#searchInput");
const navCount = document.querySelector("#navCount");
const headerCartCount = document.querySelector("#headerCartCount");
let filter = "all", toastTimer;

const money = n => n == null ? "Price on request" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function renderProducts() {
  const q = search.value.trim().toLowerCase();
  const shown = products.filter(p => (filter !== "popular" || p.popular) && (!q || (p.name + " " + p.en).toLowerCase().includes(q)));
  
  grid.innerHTML = shown.map(p => {
    const sizes = Object.keys(p.prices).map(Number).sort((a, b) => a - b);
    const smallestPrice = sizes.length ? Math.min(...Object.values(p.prices)) : 0;
    const defaultSize = sizes.includes(1000) ? 1000 : (sizes.length ? sizes[sizes.length - 1] : 1000);
    const initialPrice = packPrice(p, defaultSize);
    const priceTag = `<span class="price-tag price-tag-inline" data-card-price="${p.id}">${money(initialPrice)} · ${packLabel(defaultSize)}</span>`;
    
    const adminEditButton = isAdminLoggedIn() ? `
      <div class="product-card-admin-bar">
        <span style="font-size: 10.5px; color: var(--teal-dark); font-weight: 750;">Admin Mode</span>
        <button type="button" class="quick-edit-price-btn" data-edit-product="${p.id}">✏️ Edit Price</button>
      </div>` : "";

    return `<article class="product-card">
      <div class="product-art">
        <img class="product-image-contain" src="${p.image}" alt="${p.en}" loading="lazy">
      </div>
      <div class="product-info">
        ${priceTag}
        <h3 lang="te">${p.name}</h3>
        <p>${p.desc || ""}</p>
        <label class="size-label" for="size-${p.id}">Pack size</label>
        <select class="size-select" id="size-${p.id}" data-size="${p.id}" aria-label="Choose pack size for ${p.en}">
          ${sizes.map(ml => `<option value="${ml}"${ml === defaultSize ? " selected" : ""}>${packLabel(ml)}</option>`).join("")}
        </select>
        <div class="product-bottom">
          <span class="unit">From ${money(smallestPrice)}</span>
          <button class="add-btn" data-add="${p.id}">＋ Add to cart</button>
        </div>
        ${adminEditButton}
      </div>
    </article>`;
  }).join("") || '<p>No oils found. Try another search.</p>';
}

function showToast(t) {
  const el = document.querySelector("#toast");
  el.textContent = t;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function count() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function renderCart() {
  const entries = Object.entries(cart).filter(([key, qty]) => qty > 0).map(([key, qty]) => {
    const [id, mlText] = key.split("__");
    const product = products.find(p => p.id === id);
    const ml = Number(mlText);
    return product ? { ...product, ml, qty, key, selectedPrice: packPrice(product, ml) } : null;
  }).filter(Boolean);

  document.querySelector("#cartItems").innerHTML = entries.length ? entries.map(p => `
    <div class="cart-row">
      <div>
        <h4>${p.name}</h4>
        <small>${p.en} · ${packLabel(p.ml)} · ${p.selectedPrice == null ? "Price to confirm" : money(p.selectedPrice)}</small>
        <div class="qty">
          <button data-qty="${p.key}" data-delta="-1" aria-label="Decrease quantity">−</button>
          <b>${p.qty}</b>
          <button data-qty="${p.key}" data-delta="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="cart-price">${p.selectedPrice == null ? "Confirm price" : money(p.selectedPrice * p.qty)}</div>
    </div>`).join("") : '<div class="empty">Your cart is empty.<br><br>Choose an oil, pack size and quantity to get started.</div>';

  const total = entries.reduce((s, p) => s + (p.selectedPrice || 0) * p.qty, 0);
  const hasUnknownPrice = entries.some(p => p.selectedPrice == null);
  document.querySelector("#cartTotal").textContent = money(total) + (hasUnknownPrice ? " + items to confirm" : "");
  if (navCount) navCount.textContent = count();
  if (headerCartCount) headerCartCount.textContent = count();
  document.querySelector("#checkoutBtn").disabled = !entries.length;
}

function isCartOpen() {
  return document.body.classList.contains("cart-open");
}

function openCart() {
  document.body.classList.add("cart-open");
  document.querySelector(".bottom-nav").style.setProperty("display", "none", "important");
  document.querySelector("#cartPanel").setAttribute("aria-hidden", "false");
  renderCart();
}

function closeCart() {
  document.body.classList.remove("cart-open");
  document.querySelector(".bottom-nav").style.removeProperty("display");
  document.querySelector("#cartPanel").setAttribute("aria-hidden", "true");
}

function toggleCart() {
  if (isCartOpen()) {
    closeCart();
  } else {
    openCart();
  }
}

function getOrderEntries() {
  return Object.entries(cart).filter(([key, qty]) => qty > 0).map(([key, qty]) => {
    const [id, mlText] = key.split("__");
    const product = products.find(p => p.id === id);
    const ml = Number(mlText);
    return product ? { ...product, ml, qty, selectedPrice: packPrice(product, ml) } : null;
  }).filter(Boolean);
}

function openCustomerModal() {
  const modal = document.querySelector("#customerModal");
  modal.setAttribute("aria-hidden", "false");
  document.querySelector("#customerName").focus();
}

function closeCustomerModal() {
  document.querySelector("#customerModal").setAttribute("aria-hidden", "true");
  document.querySelector("#checkoutBtn").focus();
}

grid.addEventListener("change", e => {
  const select = e.target.closest("[data-size]");
  if (!select) return;
  const product = products.find(p => p.id === select.dataset.size);
  const priceTag = grid.querySelector(`[data-card-price="${select.dataset.size}"]`);
  if (!product || !priceTag) return;
  const ml = Number(select.value);
  priceTag.textContent = `${money(packPrice(product, ml))} · ${packLabel(ml)}`;
});

grid.addEventListener("click", e => {
  const editBtn = e.target.closest("[data-edit-product]");
  if (editBtn) {
    openAdminManageModal();
    switchAdminTab("prices");
    const targetCard = document.querySelector(`[data-admin-card="${editBtn.dataset.editProduct}"]`);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      targetCard.style.borderColor = "var(--teal)";
    }
    return;
  }

  const b = e.target.closest("[data-add]");
  if (!b) return;
  const id = b.dataset.add;
  const product = products.find(p => p.id === id);
  if (!product) return;
  const sizes = Object.keys(product.prices).map(Number).sort((a, b) => a - b);
  const defaultSize = sizes.includes(1000) ? 1000 : (sizes.length ? sizes[sizes.length - 1] : 1000);
  const ml = Number(grid.querySelector(`[data-size="${id}"]`)?.value || defaultSize);
  const key = `${id}__${ml}`;
  cart[key] = (cart[key] || 0) + 1;
  renderCart();
  showToast(`${packLabel(ml)} added to your cart`);
});

document.querySelector("#cartItems").addEventListener("click", e => {
  const b = e.target.closest("[data-qty]");
  if (!b) return;
  const key = b.dataset.qty;
  cart[key] = (cart[key] || 0) + Number(b.dataset.delta);
  if (cart[key] <= 0) delete cart[key];
  renderCart();
});

document.querySelector("#filters").addEventListener("click", e => {
  const b = e.target.closest("[data-filter]");
  if (!b) return;
  filter = b.dataset.filter;
  document.querySelectorAll(".filter").forEach(x => x.classList.toggle("active", x === b));
  renderProducts();
});

search.addEventListener("input", renderProducts);
if (document.querySelector("#cartNav")) document.querySelector("#cartNav").addEventListener("click", toggleCart);
if (document.querySelector("#headerCart")) document.querySelector("#headerCart").addEventListener("click", toggleCart);
document.querySelector("#closeCart").addEventListener("click", closeCart);
document.querySelector("#cartBackdrop").addEventListener("click", closeCart);
document.querySelectorAll(".bottom-nav a").forEach(link => {
  link.addEventListener("click", () => {
    if (isCartOpen()) closeCart();
  });
});

const menuBtn = document.querySelector("#menuBtn");
if (menuBtn) menuBtn.addEventListener("click", () => document.querySelector("#products").scrollIntoView({ behavior: "smooth" }));

document.querySelector("#checkoutBtn").addEventListener("click", () => {
  if (!getOrderEntries().length) return;
  openCustomerModal();
});
document.querySelector("#closeCustomerModal").addEventListener("click", closeCustomerModal);
document.querySelector("#customerModal").addEventListener("click", e => {
  if (e.target.id === "customerModal") closeCustomerModal();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && document.querySelector("#customerModal").getAttribute("aria-hidden") === "false") closeCustomerModal();
});

function openSuccessModal(order) {
  const modal = document.querySelector("#orderSuccessModal");
  if (!modal) return;
  document.querySelector("#successOrderId").textContent = order.id;
  document.querySelector("#successOrderTotal").textContent = `Total: ${money(order.totalAmount)}`;
  document.querySelector("#successPhone").textContent = order.customer.phone;
  modal.setAttribute("aria-hidden", "false");
}

function closeSuccessModal() {
  const modal = document.querySelector("#orderSuccessModal");
  if (modal) modal.setAttribute("aria-hidden", "true");
}

const closeSuccessBtn = document.querySelector("#closeSuccessBtn");
if (closeSuccessBtn) closeSuccessBtn.addEventListener("click", closeSuccessModal);

const successModalEl = document.querySelector("#orderSuccessModal");
if (successModalEl) successModalEl.addEventListener("click", e => {
  if (e.target.id === "orderSuccessModal") closeSuccessModal();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && document.querySelector("#orderSuccessModal")?.getAttribute("aria-hidden") === "false") closeSuccessModal();
});

const customerName = document.querySelector("#customerName");
const customerPhone = document.querySelector("#customerPhone");
const customerAddress = document.querySelector("#customerAddress");

customerName.addEventListener("input", () => customerName.setCustomValidity(customerName.value.trim() ? "" : "Please enter your name."));
customerPhone.addEventListener("input", () => {
  const value = customerPhone.value.trim(), digits = value.replace(/\D/g, "");
  customerPhone.setCustomValidity(/^[\d\s()+.-]+$/.test(value) && digits.length >= 7 && digits.length <= 15 ? "" : "Enter a valid phone number with 7 to 15 digits.");
});
customerAddress.addEventListener("input", () => customerAddress.setCustomValidity(customerAddress.value.trim() ? "" : "Please enter your delivery address."));

document.querySelector("#customerDetailsForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const name = customerName, phone = customerPhone, address = customerAddress;
  const phoneValue = phone.value.trim(), phoneDigits = phoneValue.replace(/\D/g, "");
  name.setCustomValidity(name.value.trim() ? "" : "Please enter your name.");
  phone.setCustomValidity(/^[\d\s()+.-]+$/.test(phoneValue) && phoneDigits.length >= 7 && phoneDigits.length <= 15 ? "" : "Enter a valid phone number with 7 to 15 digits.");
  address.setCustomValidity(address.value.trim() ? "" : "Please enter your delivery address.");
  if (!form.reportValidity()) return;

  const entries = getOrderEntries();
  if (!entries.length) {
    closeCustomerModal();
    showToast("Your cart is empty.");
    return;
  }

  const submitBtn = form.querySelector(".customer-submit");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing order...";
  }

  const total = entries.reduce((s, p) => s + (p.selectedPrice || 0) * p.qty, 0);
  const hasUnknownPrice = entries.some(p => p.selectedPrice == null);
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `LO-${dateStr}-${randSuffix}`;

  const orderData = {
    id: orderId,
    createdAt: now.toISOString(),
    status: "pending",
    customer: { name: name.value.trim(), phone: phoneValue, address: address.value.trim() },
    items: entries.map(p => ({
      id: p.id,
      name: p.name,
      en: p.en,
      ml: p.ml,
      packLabel: packLabel(p.ml),
      qty: p.qty,
      unitPrice: p.selectedPrice,
      lineTotal: p.selectedPrice != null ? p.selectedPrice * p.qty : null
    })),
    totalAmount: total,
    hasUnknownPrice: hasUnknownPrice,
    notes: ""
  };

  try {
    if (typeof saveOrderToSystem === "function") {
      await saveOrderToSystem(orderData);
    }
  } catch (err) {
    console.warn("Order save notice:", err);
  }

  Object.keys(cart).forEach(k => delete cart[k]);
  renderCart();
  closeCustomerModal();
  closeCart();
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Place Order <span>✓</span>';
  }
  form.reset();
  openSuccessModal(orderData);
});

/* ========================================================
 * ADMIN MANAGEMENT & AUTHENTICATION SYSTEM
 * ======================================================== */

function getAdminPassword() {
  return localStorage.getItem(ADMIN_PWD_KEY) || "admin123";
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function setAdminLoggedIn(status) {
  if (status) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
  renderProducts();
}

async function saveProductsToSystem(updatedProducts) {
  products = updatedProducts;
  try {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error("Local storage product save error:", e);
  }

  if (typeof ordersChannel !== "undefined" && ordersChannel) {
    try {
      ordersChannel.postMessage({ type: "PRODUCTS_UPDATED", products });
    } catch (e) {}
  }

  if (typeof isFirebaseReady !== "undefined" && isFirebaseReady && firebaseDb) {
    try {
      await firebaseDb.ref("products").set(products);
      console.log("Products synced to Firebase Realtime Database.");
    } catch (err) {
      console.warn("Firebase products sync notice:", err);
    }
  }

  renderProducts();
  renderCart();
  renderAdminProductList();
}

// Modals
const adminLoginModal = document.querySelector("#adminLoginModal");
const adminManageModal = document.querySelector("#adminManageModal");
const adminLoginForm = document.querySelector("#adminLoginForm");
const adminPasswordInput = document.querySelector("#adminPasswordInput");
const adminLoginError = document.querySelector("#adminLoginError");
const toggleAdminPwdBtn = document.querySelector("#toggleAdminPwdBtn");
const adminLogoutBtn = document.querySelector("#adminLogoutBtn");
const adminProductListEl = document.querySelector("#adminProductList");
const adminAddProductForm = document.querySelector("#adminAddProductForm");
const presetPickerEl = document.querySelector("#presetPicker");
const newProdFileInput = document.querySelector("#newProdFileInput");
const uploadFileName = document.querySelector("#uploadFileName");
const saveAllPricesBtn = document.querySelector("#saveAllPricesBtn");
const resetProductsBtn = document.querySelector("#resetProductsBtn");
const adminChangePasswordForm = document.querySelector("#adminChangePasswordForm");

function openAdmin() {
  if (isCartOpen()) closeCart();
  if (isAdminLoggedIn()) {
    openAdminManageModal();
  } else {
    openAdminLoginModal();
  }
}

function openAdminLoginModal() {
  if (!adminLoginModal) return;
  adminLoginError.style.display = "none";
  adminPasswordInput.value = "";
  adminLoginModal.setAttribute("aria-hidden", "false");
  setTimeout(() => adminPasswordInput.focus(), 50);
}

function closeAdminLoginModal() {
  if (!adminLoginModal) return;
  adminLoginModal.setAttribute("aria-hidden", "true");
}

function openAdminManageModal() {
  if (!adminManageModal) return;
  adminManageModal.setAttribute("aria-hidden", "false");
  renderAdminProductList();
  renderPresetPicker();
}

function closeAdminManageModal() {
  if (!adminManageModal) return;
  adminManageModal.setAttribute("aria-hidden", "true");
}

// Attach Admin Triggers
const adminNavBtn = document.querySelector("#adminNavBtn");
if (adminNavBtn) adminNavBtn.addEventListener("click", openAdmin);

const headerAdminBtn = document.querySelector("#headerAdminBtn");
if (headerAdminBtn) headerAdminBtn.addEventListener("click", openAdmin);

const closeAdminLoginModalBtn = document.querySelector("#closeAdminLoginModal");
if (closeAdminLoginModalBtn) closeAdminLoginModalBtn.addEventListener("click", closeAdminLoginModal);

const closeAdminManageModalBtn = document.querySelector("#closeAdminManageModal");
if (closeAdminManageModalBtn) closeAdminManageModalBtn.addEventListener("click", closeAdminManageModal);

if (adminLoginModal) {
  adminLoginModal.addEventListener("click", e => {
    if (e.target.id === "adminLoginModal") closeAdminLoginModal();
  });
}
if (adminManageModal) {
  adminManageModal.addEventListener("click", e => {
    if (e.target.id === "adminManageModal") closeAdminManageModal();
  });
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (adminLoginModal?.getAttribute("aria-hidden") === "false") closeAdminLoginModal();
    if (adminManageModal?.getAttribute("aria-hidden") === "false") closeAdminManageModal();
  }
});

// Toggle Password Visibility
if (toggleAdminPwdBtn) {
  toggleAdminPwdBtn.addEventListener("click", () => {
    const isPassword = adminPasswordInput.type === "password";
    adminPasswordInput.type = isPassword ? "text" : "password";
    toggleAdminPwdBtn.textContent = isPassword ? "🙈" : "👁️";
  });
}

// Admin Login Form Submission
if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", e => {
    e.preventDefault();
    const entered = adminPasswordInput.value.trim();
    if (entered === getAdminPassword()) {
      setAdminLoggedIn(true);
      closeAdminLoginModal();
      openAdminManageModal();
      showToast("Welcome, Admin! 🔓");
    } else {
      adminLoginError.textContent = "Incorrect password. Please try again.";
      adminLoginError.style.display = "block";
      adminPasswordInput.select();
    }
  });
}

// Admin Logout
if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener("click", () => {
    setAdminLoggedIn(false);
    closeAdminManageModal();
    showToast("Logged out of Admin.");
  });
}

// Admin Tabs Navigation
function switchAdminTab(tabKey) {
  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === tabKey);
  });
  document.querySelectorAll(".admin-tab-content").forEach(c => {
    c.classList.remove("active");
  });
  if (tabKey === "prices") {
    document.querySelector("#tabContentPrices")?.classList.add("active");
    renderAdminProductList();
  } else if (tabKey === "add") {
    document.querySelector("#tabContentAdd")?.classList.add("active");
  } else if (tabKey === "settings") {
    document.querySelector("#tabContentSettings")?.classList.add("active");
  }
}

document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => switchAdminTab(tab.dataset.tab));
});

// Render Preset Image Picker for Add Product Form
function renderPresetPicker() {
  if (!presetPickerEl) return;
  const currentVal = document.querySelector("#newProdImage")?.value;
  presetPickerEl.innerHTML = PRESET_IMAGES.map(img => `
    <button type="button" class="preset-thumb-btn ${currentVal === img.src ? "selected" : ""}" data-preset-src="${img.src}">
      <img src="${img.src}" alt="${img.label}">
      <span>${img.label}</span>
    </button>
  `).join("");

  presetPickerEl.querySelectorAll(".preset-thumb-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      presetPickerEl.querySelectorAll(".preset-thumb-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      document.querySelector("#newProdImage").value = btn.dataset.presetSrc;
      if (uploadFileName) uploadFileName.textContent = "";
    });
  });
}

// Custom Image File Upload
if (newProdFileInput) {
  newProdFileInput.addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (uploadFileName) uploadFileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = ev => {
      document.querySelector("#newProdImage").value = ev.target.result;
      if (presetPickerEl) {
        presetPickerEl.querySelectorAll(".preset-thumb-btn").forEach(b => b.classList.remove("selected"));
      }
    };
    reader.readAsDataURL(file);
  });
}

// Render Products in Admin Tab 1 (Price and Detail Editor)
function renderAdminProductList() {
  if (!adminProductListEl) return;

  adminProductListEl.innerHTML = products.map((p, index) => {
    const sizes = Object.keys(p.prices).map(Number).sort((a, b) => a - b);
    return `
      <div class="admin-prod-card" data-admin-card="${p.id}">
        <div class="admin-prod-head">
          <img src="${p.image}" alt="${p.en}" class="admin-prod-thumb">
          <div class="admin-prod-titles">
            <h4>${p.name} (${p.en})</h4>
            <small>${p.desc || "Cold-pressed natural oil."}</small>
          </div>
          <button type="button" class="btn-danger" data-delete-prod="${p.id}" title="Remove product">🗑️ Delete</button>
        </div>

        <div style="font-size: 11px; font-weight: 750; color: var(--teal-dark); text-transform: uppercase; letter-spacing: 0.5px;">
          Pack Prices:
        </div>

        <div class="admin-prices-row" id="prices-row-${p.id}">
          ${sizes.map(ml => `
            <div class="admin-price-item">
              <label>${packLabel(ml)}</label>
              <div class="rupee-input-wrapper">
                <span class="rupee-sym">₹</span>
                <input type="number" min="0" data-prod-id="${p.id}" data-prod-ml="${ml}" value="${p.prices[ml] ?? ""}" placeholder="Price">
              </div>
            </div>
          `).join("")}
        </div>

        <div class="admin-prod-actions">
          <button type="button" class="btn-subtle" data-add-size="${p.id}">＋ Add Pack Size</button>
          <button type="button" class="btn-save-prod" data-save-prod="${p.id}">💾 Save Prices</button>
        </div>
      </div>
    `;
  }).join("") || '<p style="text-align:center; color:var(--muted); padding:20px;">No products found in store catalog.</p>';

  // Attach Save and Delete event listeners
  adminProductListEl.querySelectorAll("[data-save-prod]").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.dataset.saveProd;
      const product = products.find(item => item.id === prodId);
      if (!product) return;

      const priceInputs = adminProductListEl.querySelectorAll(`input[data-prod-id="${prodId}"]`);
      const newPrices = {};
      priceInputs.forEach(inp => {
        const ml = Number(inp.dataset.prodMl);
        const val = Number(inp.value.trim());
        if (ml && val > 0) {
          newPrices[ml] = val;
        }
      });

      if (!Object.keys(newPrices).length) {
        showToast("Please enter at least one valid price.");
        return;
      }

      product.prices = newPrices;
      saveProductsToSystem(products);
      btn.textContent = "Saved ✓";
      btn.classList.add("saved");
      setTimeout(() => {
        btn.textContent = "💾 Save Prices";
        btn.classList.remove("saved");
      }, 1600);
      showToast(`Prices updated for ${product.en}! 💰`);
    });
  });

  adminProductListEl.querySelectorAll("[data-add-size]").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.dataset.addSize;
      const product = products.find(item => item.id === prodId);
      if (!product) return;

      const inputSize = prompt("Enter pack size in ml (e.g. 200, 750, 2000, 5000):", "200");
      if (!inputSize) return;
      const ml = Number(inputSize);
      if (!ml || ml <= 0) {
        alert("Please enter a valid positive number for pack size in ml.");
        return;
      }
      if (product.prices[ml]) {
        alert("This pack size already exists.");
        return;
      }

      const inputPrice = prompt(`Enter price in ₹ for ${packLabel(ml)}:`, "100");
      if (!inputPrice) return;
      const price = Number(inputPrice);
      if (!price || price <= 0) {
        alert("Please enter a valid price in ₹.");
        return;
      }

      product.prices[ml] = price;
      saveProductsToSystem(products);
      showToast(`Added ${packLabel(ml)} size to ${product.en}`);
    });
  });

  adminProductListEl.querySelectorAll("[data-delete-prod]").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.dataset.deleteProd;
      const product = products.find(item => item.id === prodId);
      if (!product) return;

      if (confirm(`Are you sure you want to delete "${product.en}" from the store catalog?`)) {
        products = products.filter(item => item.id !== prodId);
        saveProductsToSystem(products);
        showToast(`Deleted ${product.en} from store.`);
      }
    });
  });
}

// Save All Prices Bulk Button
if (saveAllPricesBtn) {
  saveAllPricesBtn.addEventListener("click", () => {
    products.forEach(p => {
      const inputs = adminProductListEl.querySelectorAll(`input[data-prod-id="${p.id}"]`);
      const newPrices = {};
      inputs.forEach(inp => {
        const ml = Number(inp.dataset.prodMl);
        const val = Number(inp.value.trim());
        if (ml && val > 0) {
          newPrices[ml] = val;
        }
      });
      if (Object.keys(newPrices).length > 0) {
        p.prices = newPrices;
      }
    });
    saveProductsToSystem(products);
    showToast("All product prices updated successfully! 💾");
  });
}

// Add New Product Form Handler
if (adminAddProductForm) {
  adminAddProductForm.addEventListener("submit", e => {
    e.preventDefault();
    const en = document.querySelector("#newProdEn").value.trim();
    const name = document.querySelector("#newProdName").value.trim();
    const desc = document.querySelector("#newProdDesc").value.trim();
    const imgUrl = document.querySelector("#newProdImage").value.trim() || "assets/coconut-product.jpg";
    const popular = document.querySelector("#newProdPopular").checked;

    const p1000 = Number(document.querySelector("#newPrice1000").value.trim());
    const p500 = Number(document.querySelector("#newPrice500").value.trim());
    const p250 = Number(document.querySelector("#newPrice250").value.trim());

    const prices = {};
    if (p1000 > 0) prices[1000] = p1000;
    if (p500 > 0) prices[500] = p500;
    if (p250 > 0) prices[250] = p250;

    if (!Object.keys(prices).length) {
      alert("Please enter a valid price for at least one pack size (e.g. 1 litre).");
      return;
    }

    const id = en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Math.floor(100 + Math.random() * 900);
    const newProduct = {
      id,
      name,
      en,
      desc: desc || `Living Oils cold-pressed ${en.toLowerCase()}.`,
      image: imgUrl,
      prices,
      popular
    };

    products.push(newProduct);
    saveProductsToSystem(products);

    adminAddProductForm.reset();
    if (uploadFileName) uploadFileName.textContent = "";
    document.querySelector("#newProdImage").value = "assets/coconut-product.jpg";
    showToast(`✨ ${en} added to store catalog!`);
    switchAdminTab("prices");
  });
}

// Settings: Change Password
if (adminChangePasswordForm) {
  adminChangePasswordForm.addEventListener("submit", e => {
    e.preventDefault();
    const cur = document.querySelector("#currentAdminPwd").value.trim();
    const nxt = document.querySelector("#newAdminPwd").value.trim();

    if (cur !== getAdminPassword()) {
      alert("Current password is incorrect.");
      return;
    }
    if (nxt.length < 4) {
      alert("New password must be at least 4 characters.");
      return;
    }

    localStorage.setItem(ADMIN_PWD_KEY, nxt);
    adminChangePasswordForm.reset();
    showToast("Admin password updated successfully! 🔑");
  });
}

// Settings: Reset Products Catalog to Default
if (resetProductsBtn) {
  resetProductsBtn.addEventListener("click", () => {
    if (confirm("Reset the product catalog to the original 6 default products? Custom products will be removed.")) {
      products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      saveProductsToSystem(products);
      showToast("Store catalog reset to default products. ↺");
    }
  });
}

// Cross-tab and Firebase synchronization
if (typeof ordersChannel !== "undefined" && ordersChannel) {
  ordersChannel.addEventListener("message", e => {
    if (e.data && e.data.type === "PRODUCTS_UPDATED" && Array.isArray(e.data.products)) {
      products = e.data.products;
      renderProducts();
      renderCart();
      if (adminManageModal?.getAttribute("aria-hidden") === "false") {
        renderAdminProductList();
      }
    }
  });
}

function checkFirebaseProducts() {
  if (typeof firebaseDb !== "undefined" && firebaseDb && typeof isFirebaseReady !== "undefined" && isFirebaseReady) {
    firebaseDb.ref("products").once("value").then(snap => {
      const data = snap.val();
      if (data && Array.isArray(data) && data.length > 0) {
        products = data;
        localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
        renderProducts();
        renderCart();
      }
    }).catch(e => console.warn("Firebase products read notice:", e));
  }
}
setTimeout(checkFirebaseProducts, 1200);

// Initialize Storefront
renderProducts();
renderCart();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
