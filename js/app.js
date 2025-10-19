
/* linked products.json file */
fetch(`./products.json`);
const apiPath = './js/products.json';
const TAX_RATE = 0.08;
let ALL_PRODUCTS = [];

document.addEventListener('DOMContentLoaded', ()=> {
  enableTheme();
  wireNavToggle();
  loadCartCount();
  loadAllProducts().then(()=>{
    if (document.querySelector('[data-page="home"]')) initHome();
    if (document.querySelector('[data-page="products"]')) initProducts();
    if (document.querySelector('[data-page="product-details"]')) initProductDetails();
    if (document.querySelector('[data-page="cart"]')) initCartPage();
    if (document.querySelector('[data-page="checkout"]')) initCheckout();
    if (document.querySelector('[data-page="login"]')) initAuth();
    if (document.querySelector('[data-page="dashboard"]')) initDashboard();
  });
});

async function loadAllProducts(){
  try{
    const res = await fetch(apiPath);
    ALL_PRODUCTS = await res.json();
  } catch(e){
    console.error('Failed to load products', e);
    ALL_PRODUCTS = [];
  }
}

/* Theme */
function enableTheme(){
  const stored = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', stored);
  const toggle = document.querySelectorAll('#themeToggle');
  toggle.forEach(t=>{
    t.addEventListener('click', ()=>{
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', cur);
      localStorage.setItem('theme', cur);
    });
  });
}

/* Nav toggle */
function wireNavToggle(){
  const btn = document.querySelector('#navToggle');
  if(!btn) return;
  btn.addEventListener('click', ()=> {
    const links = document.querySelector('.nav-links');
    if(links.style.display === 'flex') links.style.display = 'none';
    else links.style.display = 'flex';
  });
}

/* Collaps btn */ 
let menuList = document.getElementById("menuList")
menuList.style.maxHeight = "0px";


function toggleMenu(){
  if(menuList.style.maxHeight == "0px"){
   
    menuList.style.maxHeight = "300px";
  }
  else{
    menuList.style.maxHeight = "0px";
  }
}

/* Fetch wrapper (not used directly) */
async function fetchProducts(){ return ALL_PRODUCTS; }

/* Home */
function initHome(){
  const el = document.querySelector('#featured');
  const items = ALL_PRODUCTS.slice(0,6);
  el.innerHTML = items.map(p => `
    <div class="col-12">
      <div class="card card-product fadeIn">
        <img src="${p.image}" alt="${p.title}" />
        <div style="padding:.6rem">
          <h6>${p.title} <small class="small-muted">• ${p.category}</small></h6>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="price-badge">$${p.price.toFixed(2)}</span>
            <button class="btn btn-sm btn-primary" onclick="addToCart(${p.id})">Add</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/* Products page with toolbar */
function initProducts(){
  const container = document.querySelector('#productList');
  const toolbar = document.querySelector('#productToolbar');
  // build category options
  const categories = ['All', ...Array.from(new Set(ALL_PRODUCTS.map(p=>p.category)))];
  const select = toolbar.querySelector('#categorySelect');
  select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
  // render initial grid
  renderProductsGrid(ALL_PRODUCTS);
  // wire search
  const searchInput = toolbar.querySelector('#searchInput');
  const searchBtn = toolbar.querySelector('#searchBtn');
  searchInput.addEventListener('input', ()=> applyFilters());
  select.addEventListener('change', ()=> applyFilters());
  searchBtn.addEventListener('click', ()=> applyFilters());
  // allow Enter to search
  toolbar.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') { e.preventDefault(); applyFilters(); }
  });
}

function renderProductsGrid(list){
  const container = document.querySelector('#productList');
  if(!list || list.length === 0){
    container.innerHTML = '<p>No products match your search.</p>';
    return;
  }
  container.innerHTML = list.map(p => `
    <div class="col-md-4">
      <div class="card card-product">
        <a href="product.html?id=${p.id}" style="text-decoration:none;color:inherit"><img src="${p.image}" alt="${p.title}" /></a>
        <div style="padding:.8rem">
          <h5>${p.title}</h5>
          <p class="small-muted">${p.description}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.6rem">
            <span class="price-badge">$${p.price.toFixed(2)}</span>
            <div>
              <button class="btn btn-sm btn-outline-primary" onclick="addToCart(${p.id})">Add to Cart</button>
              <a class="btn btn-sm btn-primary" href="product.html?id=${p.id}">View</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/* apply filters: search + category */
function applyFilters(){
  const toolbar = document.querySelector('#productToolbar');
  const q = toolbar.querySelector('#searchInput').value.trim().toLowerCase();
  const cat = toolbar.querySelector('#categorySelect').value;
  let results = ALL_PRODUCTS.filter(p=>{
    const matchesQ = q === '' || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchesCat = (cat === 'All') || (p.category === cat);
    return matchesQ && matchesCat;
  });
  renderProductsGrid(results);
}

/* Product details */
function initProductDetails(){
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));
  const p = ALL_PRODUCTS.find(x=>x.id===id);
  if(!p){ document.querySelector('#productMain').innerText='Product not found'; return;}
  document.querySelector('#productMain').innerHTML = `
    <div class="row" style="gap:1.2rem">
      <div class="col-md-6"><img src="${p.image}" alt="${p.title}" style="width:100%;border-radius:8px" /></div>
      <div class="col-md-6">
        <h2>${p.title}</h2>
        <p class="small-muted">${p.category}</p>
        <p>${p.description}</p>
        <h4>$${p.price.toFixed(2)}</h4>
        <div style="margin-top:.8rem">
          <button class="btn btn-primary" onclick="addToCart(${p.id})">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
}

/* Cart handling (same as before) */
function getCart(){ return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); loadCartCount(); }
function addToCart(id){
  const cart = getCart();
  const found = cart.find(i=>i.id===id);
  if(found) found.qty += 1;
  else cart.push({id, qty:1});
  saveCart(cart);
  showToast('Added to cart');
}

/* Toast */
let toastTimer = null;
function showToast(txt){
  const t = document.querySelector('#toast');
  if(!t) return;
  t.textContent = txt;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2200);
}

/* Cart count */
function loadCartCount(){
  const cart = getCart();
  const qty = cart.reduce((s,i)=>s + i.qty, 0);
  document.querySelectorAll('#cartCount').forEach(el=> el.textContent = qty);
}

/* Cart page UI */
async function initCartPage(){
  const container = document.querySelector('#cartArea');
  const summaryEl = document.querySelector('#cartSummary');
  const cart = getCart();
  if(cart.length === 0){
    container.innerHTML = '<p>Your cart is empty. <a href="products.html">Continue shopping</a></p>';
    summaryEl.innerHTML = '';
    loadCartCount();
    return;
  }
  let total = 0;
  const rows = cart.map(item=>{
    const p = ALL_PRODUCTS.find(x=>x.id===item.id);
    const subtotal = p.price * item.qty;
    total += subtotal;
    return `
      <div class="cart-item" style="margin-bottom:.6rem">
        <img src="${p.image}" alt="${p.title}" style="width:96px;height:120px;object-fit:cover;border-radius:8px" />
        <div style="flex:1">
          <strong>${p.title}</strong>
          <div class="small-muted">${p.category} • $${p.price.toFixed(2)}</div>
        </div>
        <div style="text-align:right; margin:2px">
          <div style="padding:4px">
            <input type="number" class="qty-input" min="1" value="${item.qty}" data-id="${p.id}" aria-label="Quantity for ${p.title}" />
          </div>
          <div style="margin-top:.6rem; padding:4px"><strong>$${(subtotal).toFixed(2)}</strong></div>
          <div style="margin-top:.3rem; padding:4px"><button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${p.id})">Remove</button></div>
        </div>
      </div>
    `;
  }).join('');
  container.innerHTML = rows;
  const tax = total * TAX_RATE;
  const grand = total + tax;
  summaryEl.innerHTML = `
    <div class="card cart-summary" style="padding:1rem">
      <h5>Order Summary</h5>
      <div class="small-muted">Items: ${cart.length}</div>
      <hr/>
      <div style="display:flex;justify-content:space-between"><div>Subtotal</div><div>$${total.toFixed(2)}</div></div>
      <div style="display:flex;justify-content:space-between"><div>Tax (8%)</div><div>$${tax.toFixed(2)}</div></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:.6rem"><div>Total</div><div>$${grand.toFixed(2)}</div></div>
      <div style="margin-top:.8rem;display:flex;gap:.4rem">
        <a class="btn btn-outline-primary" href="products.html">Continue Shopping</a>
        <a class="btn btn-primary" href="checkout.html">Proceed to Checkout</a>
      </div>
    </div>
  `;
  // qty inputs listeners
  document.querySelectorAll('.qty-input').forEach(inp=>{
    inp.addEventListener('change', ()=>{
      const id = Number(inp.dataset.id);
      const val = Math.max(1, Number(inp.value) || 1);
      updateQty(id, val);
    });
  });
  loadCartCount();
}

/* update qty */
function updateQty(id, qty){
  const cart = getCart();
  const item = cart.find(c=>c.id===id);
  if(item) item.qty = qty;
  saveCart(cart);
  initCartPage();
}

/* remove */
function removeFromCart(id){
  let cart = getCart();
  cart = cart.filter(c=>c.id!==id);
  saveCart(cart);
  initCartPage();
}

/* Checkout */
function initCheckout(){
  const form = document.querySelector('#checkoutForm');
  const summaryArea = document.querySelector('#checkoutSummary');
  const cart = getCart();
  if(cart.length === 0){ document.querySelector('#checkoutArea').innerHTML = '<p>Your cart is empty.</p>'; summaryArea.innerHTML=''; return; }
  // render summary
  let total = 0;
  const itemsHtml = cart.map(i=>{
    const p = ALL_PRODUCTS.find(x=>x.id===i.id);
    const subtotal = p.price * i.qty;
    total += subtotal;
    return `<div style="display:flex;justify-content:space-between;margin-bottom:.4rem"><div>${p.title} x ${i.qty}</div><div>$${subtotal.toFixed(2)}</div></div>`;
  }).join('');
  const tax = total * TAX_RATE;
  const grand = total + tax;
  summaryArea.innerHTML = `
    <div class="card" style="padding:1rem">
      <h5>Order Summary</h5>
      ${itemsHtml}
      <hr/>
      <div style="display:flex;justify-content:space-between"><div>Subtotal</div><div>$${total.toFixed(2)}</div></div>
      <div style="display:flex;justify-content:space-between"><div>Tax (8%)</div><div>$${tax.toFixed(2)}</div></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:.6rem"><div>Total</div><div>$${grand.toFixed(2)}</div></div>
    </div>
  `;
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const address = form.address.value.trim();
    if(!name || !email || !address){ alert('Please fill all required fields'); return; }
    localStorage.removeItem('cart');
    loadCartCount();
    showToast('Order placed — thank you!');
    setTimeout(()=> location.href = 'index.html', 900);
  });
}

/* Auth & Dashboard (unchanged) */
function initAuth(){
  const regForm = document.querySelector('#registerForm');
  const loginForm = document.querySelector('#loginForm');
  if(regForm){
    regForm.addEventListener('submit', e=>{
      e.preventDefault();
      const name = regForm.name.value.trim();
      const email = regForm.email.value.trim();
      const pwd = regForm.password.value;
      if(!name || !email || !pwd){ alert('Please fill all fields'); return; }
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      if(users.find(u=>u.email===email)){ alert('User already exists'); return; }
      users.push({name, email, password:pwd});
      localStorage.setItem('users', JSON.stringify(users));
      alert('Registration successful — you can now log in.');
      regForm.reset();
    });
  }
  if(loginForm){
    loginForm.addEventListener('submit', e=>{
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const pwd = loginForm.password.value;
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const u = users.find(x=>x.email===email && x.password===pwd);
      if(!u){ alert('Invalid credentials'); return; }
      sessionStorage.setItem('user', JSON.stringify({name:u.name,email:u.email}));
      location.href = 'dashboard.html';
    });
  }
}

function initDashboard(){
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  if(!user){ location.href = 'login.html'; return; }
  document.querySelector('#welcome').textContent = `Welcome, ${user.name}!`;
  const logout = document.querySelector('#logoutBtn');
  if(logout) logout.addEventListener('click', ()=> { sessionStorage.removeItem('user'); location.href='index.html'; });
}
