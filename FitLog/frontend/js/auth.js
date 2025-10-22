// Diagnostic log
console.log('auth.js cargado');

// Función para hashear con SHA-256
function hashPassword(password) {
    return CryptoJS.SHA256(password).toString();
}

// Helper: try fetch to backend, return response json or throw
async function tryBackend(path, body){
    try{
        const res = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });
        const text = await res.text().catch(()=>null);
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch(e) { data = text; }
        console.log('tryBackend response', { path, status: res.status, ok: res.ok, data });
        return { ok: res.ok, status: res.status, data };
    }catch(err){
        console.error('tryBackend fetch error', err);
        return { ok: false, error: err };
    }
}

// Manejar registro
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('registerForm submit');
        
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        
        if (username && password) {
            // Try backend register first
            const backend = await tryBackend('http://127.0.0.1:5000/api/register', { username, password });
            if(backend.ok){
                alert('Usuario registrado en servidor exitosamente');
                this.reset();
                return;
            }

            // Fallback: localStorage (hash password client-side)
            const hashedPassword = hashPassword(password);
            const users = Storage.getItem('fitlog_users') || [];
            if (users.find(user => user.username === username)) {
                alert('El usuario ya existe');
                return;
            }
            const newUser = { username: username, password: hashedPassword, createdAt: new Date().toISOString() };
            users.push(newUser);
            Storage.setItem('fitlog_users', users);
            alert('Usuario registrado localmente (sin servidor)');
            this.reset();
        }
    });
}

// Manejar login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('loginForm submit');
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (username && password) {
            // Try backend login
            const backend = await tryBackend('http://127.0.0.1:5000/api/login', { username, password });
            console.log('backend login result', backend);
            // Consider it a success if fetch.ok OR backend returned {ok: true} OR returned username
            const backendData = backend && backend.data ? backend.data : null;
            const success = backend.ok || (backendData && (backendData.ok === true || !!backendData.username)) || backend.status === 200 || backend.status === 201;
            if (success) {
                // determine username source: prefer backend returned username
                const actualUser = (backendData && backendData.username) ? backendData.username : username;
                // marcar usuario en localStorage para que dashboard.js lo detecte
                try{
                    Storage.setItem('current_user', actualUser);
                }catch(e){
                    console.warn('No se pudo guardar current_user en localStorage', e);
                }
                alert('Login exitoso (servidor)');
                window.location.href = 'dashboard.html';
                return;
            }
            console.warn('Login no considerado exitoso por el frontend. backend object:', backend);

            // Fallback: localStorage check
            const hashedPassword = hashPassword(password);
            const users = Storage.getItem('fitlog_users') || [];
            const user = users.find(u => u.username === username && u.password === hashedPassword);
            if (user) {
                Storage.setItem('current_user', username);

                alert('¡Login exitoso (local)!');
                window.location.href = 'dashboard.html';
            } else {
                alert('Usuario o contraseña incorrectos');
            }
        }
    });
}