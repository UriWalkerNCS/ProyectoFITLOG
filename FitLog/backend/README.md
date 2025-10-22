# FitLog - Tu Diario de Entrenamiento

## Descripción
FitLog es una aplicación web para registrar y hacer seguimiento de tus rutinas de ejercicio. Permite crear usuarios, iniciar sesión, y registrar rutinas de entrenamiento con ejercicios específicos.

## Estructura del Proyecto
```
FitLog/
├── backend/               # Servidor Flask (backend)
│   ├── server.py          # Servidor principal
│   ├── requirements.txt   # Dependencias de Python
│   └── data.db           # Base de datos SQLite
├── frontend/             # Archivos del frontend
│   ├── index.html        # Página de login
│   ├── register.html     # Página de registro
│   ├── dashboard.html    # Panel principal
│   ├── add-workout.html  # Crear nueva rutina
│   ├── users.html        # Lista de usuarios
│   ├── js/               # Archivos JavaScript
│   │   ├── auth.js       # Autenticación
│   │   ├── dashboard.js  # Lógica del dashboard
│   │   ├── workout.js    # Gestión de rutinas
│   │   ├── users.js      # Gestión de usuarios
│   │   ├── storage.js    # Almacenamiento local
│   │   └── debug.js      # Herramientas de debug
│   ├── styles/           # Archivos CSS
│   │   ├── style.css     # Estilos principales
│   │   ├── dashboard.css # Estilos del dashboard
│   │   └── workout.css   # Estilos de rutinas
│   └── images/           # Imágenes
│       └── imagenGym.jpg # Imagen de fondo
├── serve.ps1             # Script para servidor estático (desarrollo)
└── README.md             # Este archivo
```

## Instalación y Ejecución

### Requisitos
- Python 3.7 o superior
- pip (gestor de paquetes de Python)

### Pasos para ejecutar:

1. **Instalar dependencias:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Ejecutar el servidor backend:**
   ```bash
   cd backend
   python server.py
   ```
   El servidor se ejecutará en `http://127.0.0.1:5000`

3. **Ejecutar el servidor frontend (en otra terminal):**
   ```bash
   # En Windows (PowerShell)
   .\serve.ps1
   
   # O manualmente:
   cd frontend
   python -m http.server 8000
   ```
   El frontend estará disponible en `http://127.0.0.1:8000`

### Uso
1. Abre tu navegador y ve a `http://127.0.0.1:8000`
2. Crea una cuenta nueva o inicia sesión
3. Registra tus rutinas de ejercicio
4. Haz seguimiento de tu progreso

## Características
- ✅ Registro e inicio de sesión de usuarios
- ✅ Creación y gestión de rutinas de ejercicio
- ✅ Seguimiento de progreso
- ✅ Interfaz responsive y moderna
- ✅ Almacenamiento seguro de contraseñas
- ✅ Base de datos SQLite para persistencia

## Tecnologías Utilizadas
- **Backend:** Flask (Python)
- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **Base de datos:** SQLite
- **Autenticación:** Sesiones Flask con hash de contraseñas PBKDF2

## Solución de Problemas
- Si el navegador muestra "localhost rechazó la conexión":
  * Asegúrate de que ambos servidores (backend y frontend) estén ejecutándose
  * Verifica que no haya conflictos de puertos
  * Ejecuta en PowerShell: `netstat -ano | findstr :8000` y `netstat -ano | findstr :5000`
- Errores en la consola del navegador (F12 -> Console): revisa que las rutas de los archivos CSS y JS sean correctas