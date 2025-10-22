// Helpers para localStorage
const Storage = {
    // Guardar datos
    setItem: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Obtener datos
    getItem: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // Inicializar datos si no existen
    initialize: () => {
        if (!Storage.getItem('fitlog_users')) {
            Storage.setItem('fitlog_users', []);
        }
        if (!Storage.getItem('fitlog_workouts')) {
            Storage.setItem('fitlog_workouts', []);
        }
    }
};

// Inicializar storage al cargar
Storage.initialize();