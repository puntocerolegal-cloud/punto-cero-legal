const fs = require('fs');

// Fix 1 — Errores en español en auth.py
let c1 = fs.readFileSync('backend/routes/auth.py', 'utf8');
c1 = c1.replace('Email already registered', 'Este correo ya está registrado');
c1 = c1.replace('Incorrect email or password', 'Correo o contraseña incorrectos');
c1 = c1.replace('Account is not active', 'Tu cuenta no está activa. Contacta al soporte.');
fs.writeFileSync('backend/routes/auth.py', c1, 'utf8');
console.log('Fix 1 auth.py: OK');

// Fix 2 — Portal público en App.js
let c2 = fs.readFileSync('frontend/src/App.js', 'utf8');
c2 = c2.replace(
  '<Route path="/portal" element={<ProtectedRoute require={CLIENT_ROLES}><PortalPage /></ProtectedRoute>} />',
  '<Route path="/portal" element={<PortalPage />} />\n            <Route path="/portal/:code" element={<PortalPage />} />'
);
fs.writeFileSync('frontend/src/App.js', c2, 'utf8');
console.log('Fix 2 App.js: OK');

// Fix 3 — Checkout redirige en lugar de nueva pestaña
let c3 = fs.readFileSync('frontend/src/pages/CheckoutPage.jsx', 'utf8');
c3 = c3.replace("window.open(res.data.checkout_url, '_blank');", 'window.location.href = res.data.checkout_url;');
fs.writeFileSync('frontend/src/pages/CheckoutPage.jsx', c3, 'utf8');
console.log('Fix 3 CheckoutPage: OK');

// Fix 4 — CasesPage campo cliente
let c4 = fs.readFileSync('frontend/src/pages/dashboard/CasesPage.jsx', 'utf8');
c4 = c4.replace("title: '', client_id: '', legal_area:", "title: '', client_name: '', client_id: '', legal_area:");
c4 = c4.replace('placeholder="ID del cliente"', 'placeholder="Nombre del cliente"');
c4 = c4.replace('value={newCase.client_id} onChange={(e) => setNewCase({ ...newCase, client_id: e.target.value })', 'value={newCase.client_name} onChange={(e) => setNewCase({ ...newCase, client_name: e.target.value })');
fs.writeFileSync('frontend/src/pages/dashboard/CasesPage.jsx', c4, 'utf8');
console.log('Fix 4 CasesPage: OK');

// Fix 5 — Link portal en footer LandingPage
let c5 = fs.readFileSync('frontend/src/pages/LandingPage.jsx', 'utf8');
if (!c5.includes('Consultar mi caso')) {
  c5 = c5.replace(
    'Términos y Condiciones\n                  </a>',
    'Términos y Condiciones\n                  </a>\n                </li>\n                <li>\n                  <a href="/portal" className="hover:text-[#f97316] transition-colors font-semibold">\n                    🔍 Consultar mi caso\n                  </a>'
  );
  fs.writeFileSync('frontend/src/pages/LandingPage.jsx', c5, 'utf8');
  console.log('Fix 5 LandingPage footer: OK');
} else {
  console.log('Fix 5 ya aplicado');
}

console.log('\nTodos los fixes aplicados. Ejecuta: git add . && git commit -m "fix: 5 bugs corregidos" && git push');