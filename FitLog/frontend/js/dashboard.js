// Dashboard functionality - COMPLETELY REDESIGNED
class Dashboard {
    constructor() {
        console.log('dashboard.js cargado - versión rediseñada');
        this.currentUser = null;
        this.workouts = Storage.getItem('fitlog_workouts') || [];
        this.init();
    }

    init() {
        // check server session first, then fall back to localStorage
        this.checkAuth().then(() => {
            this.displayUserInfo();
            this.loadWorkouts();
            this.setupEventListeners();
            this.setupEmptyStateListener();
        }).catch(error => {
            console.error('Error en inicialización:', error);
            window.location.href = 'index.html';
        });
    }

    async checkAuth() {
        console.log('🔐 Verificando autenticación...');
        
        // try backend session first
        try {
            const resp = await fetch('http://127.0.0.1:5000/api/current_user', { 
                credentials: 'include',
                method: 'GET'
            });
            
            if (resp.ok) {
                const data = await resp.json().catch(() => null);
                if (data && data.username) {
                    this.currentUser = data.username;
                    Storage.setItem('current_user', this.currentUser);
                    console.log('✅ Sesión backend activa para:', this.currentUser);
                    return;
                }
            }
        } catch (e) {
            console.warn('❌ Error checking backend session', e);
        }

        // fallback to localStorage
        const stored = Storage.getItem('current_user');
        if (stored) {
            this.currentUser = stored;
            console.log('✅ Usuario de localStorage:', this.currentUser);
            return;
        }

        // no session -> redirect to login
        console.log('❌ No hay sesión activa, redirigiendo a login...');
        window.location.href = 'index.html';
        throw new Error('No autenticado');
    }

    displayUserInfo() {
        const usernameDisplay = document.getElementById('usernameDisplay');
        const welcomeTitle = document.getElementById('welcomeTitle');
        const userAvatar = document.getElementById('userAvatar');
        
        if (usernameDisplay) {
            usernameDisplay.textContent = this.currentUser;
        }
        
        if (welcomeTitle) {
            // Personalizar mensaje según la hora del día
            const hour = new Date().getHours();
            let greeting = '¡Bienvenido';
            
            if (hour < 12) greeting = '¡Buenos días';
            else if (hour < 18) greeting = '¡Buenas tardes';
            else greeting = '¡Buenas noches';
            
            welcomeTitle.textContent = `${greeting}, ${this.currentUser}!`;
        }
        
        if (userAvatar) {
            // Generar avatar con iniciales
            const initials = this.getUserInitials(this.currentUser);
            userAvatar.textContent = initials;
            
            // Colores del gradiente para el avatar
            const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];
            const colorIndex = this.currentUser.charCodeAt(0) % colors.length;
            userAvatar.style.background = `linear-gradient(135deg, ${colors[colorIndex]}, ${colors[(colorIndex + 1) % colors.length]})`;
        }
    }

    getUserInitials(username) {
        if (!username) return 'U';
        
        const parts = username.split(' ');
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return username.charAt(0).toUpperCase();
    }

    loadWorkouts() {
        console.log('📊 Cargando rutinas...');
        const userWorkouts = this.workouts.filter(w => w.username === this.currentUser);
        console.log(`✅ Encontradas ${userWorkouts.length} rutinas para ${this.currentUser}`);
        
        this.updateStats(userWorkouts);
        this.renderWorkouts(userWorkouts);
        this.toggleEmptyState(userWorkouts.length === 0);
    }

    updateStats(workouts) {
        console.log('📈 Actualizando estadísticas...');
        
        // Total workouts
        const totalWorkoutsEl = document.getElementById('totalWorkouts');
        if (totalWorkoutsEl) {
            totalWorkoutsEl.textContent = workouts.length;
        }

        // Total exercises
        const totalExercises = workouts.reduce((total, workout) => 
            total + (workout.exercises ? workout.exercises.length : 0), 0
        );
        
        const totalExercisesEl = document.getElementById('totalExercises');
        if (totalExercisesEl) {
            totalExercisesEl.textContent = totalExercises;
        }

        // Active days
        const activeDaysEl = document.getElementById('activeDays');
        if (activeDaysEl) {
            const uniqueDays = new Set(workouts.map(w => w.date)).size;
            activeDaysEl.textContent = uniqueDays;
        }

        // Update workouts count
        const workoutsCountEl = document.getElementById('workoutsCount');
        if (workoutsCountEl) {
            workoutsCountEl.textContent = `${workouts.length} rutina${workouts.length !== 1 ? 's' : ''}`;
        }

        // Last workout date
        const lastWorkoutEl = document.getElementById('lastWorkout');
        if (lastWorkoutEl) {
            if (workouts.length > 0) {
                const lastWorkout = workouts.reduce((latest, workout) => {
                    const workoutDate = new Date(workout.date);
                    const latestDate = new Date(latest.date);
                    return workoutDate > latestDate ? workout : latest;
                }, workouts[0]);
                
                const date = new Date(lastWorkout.date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                });
                lastWorkoutEl.textContent = date;
            } else {
                lastWorkoutEl.textContent = '-';
            }
        }

        // Update welcome subtitle based on activity
        const welcomeSubtitle = document.getElementById('welcomeSubtitle');
        if (welcomeSubtitle) {
            if (workouts.length === 0) {
                welcomeSubtitle.textContent = 'Comienza tu journey fitness';
            } else if (workouts.length < 5) {
                welcomeSubtitle.textContent = '¡Sigue así!';
            } else {
                welcomeSubtitle.textContent = '¡Eres una máquina!';
            }
        }
    }

    getWorkoutTypeDisplay(type) {
        const typeIcons = {
            'Pierna': 'fas fa-running',
            'Espalda': 'fas fa-user',
            'Pecho': 'fas fa-heart',
            'Hombros': 'fas fa-user-tie',
            'Brazos': 'fas fa-hand-rock',
            'Cardio': 'fas fa-heartbeat',
            'Full Body': 'fas fa-users'
        };
        
        const iconClass = typeIcons[type] || 'fas fa-dumbbell';
        return `<i class="${iconClass} icon-small"></i> ${type}`;
    }

    renderWorkouts(workouts) {
        const workoutsList = document.getElementById('workoutsList');
        const emptyState = document.getElementById('emptyState');

        if (!workoutsList || !emptyState) {
            console.error('❌ Elementos del DOM no encontrados');
            return;
        }

        if (workouts.length === 0) {
            workoutsList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        workoutsList.style.display = 'grid';
        emptyState.style.display = 'none';

        // Mostrar solo las últimas 6 rutinas (más para el nuevo diseño)
        const recentWorkouts = workouts.slice(-6).reverse();
        
        workoutsList.innerHTML = recentWorkouts.map(workout => {
            const workoutDate = new Date(workout.date);
            const formattedDate = workoutDate.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            
            const exerciseCount = workout.exercises ? workout.exercises.length : 0;
            
            return `
                <div class="workout-card" data-workout-id="${workout.id}">
                    <div class="workout-header">
                        <span class="workout-date typography-body-small">
                            <i class="fas fa-calendar icon-small"></i>
                            ${formattedDate}
                        </span>
                        <span class="workout-type">${this.getWorkoutTypeDisplay(workout.type)}</span>
                    </div>
                    
                    <div class="workout-stats">
                        <div class="workout-stat">
                            <i class="fas fa-list-check icon-small"></i>
                            ${exerciseCount} ejercicio${exerciseCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    <ul class="exercise-list">
                        ${workout.exercises ? workout.exercises.slice(0, 3).map(exercise => `
                            <li class="exercise-item">
                                <span class="exercise-name typography-body-small">
                                    <i class="fas fa-dot-circle icon-small"></i>
                                    ${exercise.name}
                                </span>
                                <span class="exercise-details typography-caption">
                                    ${exercise.sets}×${exercise.reps} - ${exercise.weight}kg
                                </span>
                            </li>
                        `).join('') : ''}
                        
                        ${exerciseCount > 3 ? `
                            <li class="exercise-item">
                                <span class="exercise-name typography-caption" style="color: var(--text-muted);">
                                    <i class="fas fa-ellipsis-h icon-small"></i>
                                    +${exerciseCount - 3} más...
                                </span>
                            </li>
                        ` : ''}
                    </ul>
                    
                    <div class="workout-actions">
                        <button class="btn btn-ghost btn-small view-workout-btn" data-workout-id="${workout.id}">
                            <i class="fas fa-eye icon-small"></i>
                            Ver detalles
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Agregar event listeners a los botones de ver detalles
        this.setupWorkoutDetailListeners();
    }

    setupWorkoutDetailListeners() {
        document.querySelectorAll('.view-workout-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const workoutId = e.currentTarget.getAttribute('data-workout-id');
                this.viewWorkoutDetails(workoutId);
            });
        });
    }

    viewWorkoutDetails(workoutId) {
        const workout = this.workouts.find(w => w.id == workoutId);
        if (workout) {
            // Crear un modal simple con los detalles
            this.showWorkoutModal(workout);
        }
    }

    showWorkoutModal(workout) {
        // Crear modal básico
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

        const workoutDate = new Date(workout.date);
        const formattedDate = workoutDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        modal.innerHTML = `
            <div style="
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                padding: var(--space-lg);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            ">
                <button class="btn btn-ghost btn-small" style="position: absolute; top: var(--space-md); right: var(--space-md);" id="closeModal">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="card-header mb-md">
                    <h2 class="card-title">
                        <i class="fas fa-dumbbell icon"></i>
                        ${workout.type}
                    </h2>
                    <p class="card-subtitle">
                        <i class="fas fa-calendar icon-small"></i>
                        ${formattedDate}
                    </p>
                </div>
                
                <div class="exercise-list">
                    ${workout.exercises.map((exercise, index) => `
                        <div class="exercise-item" style="
                            background: rgba(255,255,255,0.02);
                            border-radius: var(--radius-md);
                            padding: var(--space-md);
                            margin-bottom: var(--space-sm);
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xs);">
                                <strong class="typography-body">
                                    <i class="fas fa-dumbbell icon-small"></i>
                                    ${exercise.name}
                                </strong>
                                <span class="typography-caption">Ejercicio ${index + 1}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-sm);">
                                <div style="text-align: center;">
                                    <div class="typography-caption">
                                        <i class="fas fa-layer-group icon-small"></i>
                                        Series
                                    </div>
                                    <div class="typography-body-large" style="color: var(--primary-purple);">${exercise.sets}</div>
                                </div>
                                <div style="text-align: center;">
                                    <div class="typography-caption">
                                        <i class="fas fa-redo icon-small"></i>
                                        Reps
                                    </div>
                                    <div class="typography-body-large" style="color: var(--accent-pink);">${exercise.reps}</div>
                                </div>
                                <div style="text-align: center;">
                                    <div class="typography-caption">
                                        <i class="fas fa-weight-hanging icon-small"></i>
                                        Peso
                                    </div>
                                    <div class="typography-body-large" style="color: var(--success);">${exercise.weight}kg</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="form-actions mt-lg">
                    <button class="btn btn-primary" id="editWorkoutBtn">
                        <i class="fas fa-edit icon"></i>
                        Editar Rutina
                    </button>
                    <button class="btn btn-ghost" id="closeModalBtn">
                        <i class="fas fa-times icon"></i>
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners del modal
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('closeModalBtn').addEventListener('click', closeModal);

        document.getElementById('editWorkoutBtn').addEventListener('click', () => {
            alert('Funcionalidad de edición en desarrollo...');
        });

        // Cerrar modal al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Cerrar modal con Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    toggleEmptyState(isEmpty) {
        const workoutsList = document.getElementById('workoutsList');
        const emptyState = document.getElementById('emptyState');

        if (workoutsList && emptyState) {
            if (isEmpty) {
                workoutsList.style.display = 'none';
                emptyState.style.display = 'block';
            } else {
                workoutsList.style.display = 'grid';
                emptyState.style.display = 'none';
            }
        }
    }

    setupEmptyStateListener() {
        const createFirstWorkoutBtn = document.getElementById('createFirstWorkout');
        if (createFirstWorkoutBtn) {
            createFirstWorkoutBtn.addEventListener('click', () => {
                window.location.href = 'add-workout.html';
            });
        }
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                console.log('🚪 Cerrando sesión...');
                
                // Try backend logout first
                try {
                    await fetch('http://127.0.0.1:5000/api/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                } catch (e) {
                    console.warn('No se pudo cerrar sesión en el backend:', e);
                }
                
                // Clear local storage
                Storage.setItem('current_user', null);
                console.log('✅ Sesión local limpiada');
                
                // Redirect to login
                window.location.href = 'index.html';
            });
        }

        // Add workout
        const addWorkoutBtn = document.getElementById('addWorkoutBtn');
        if (addWorkoutBtn) {
            addWorkoutBtn.addEventListener('click', () => {
                console.log('📝 Navegando a crear nueva rutina...');
                window.location.href = 'add-workout.html';
            });
        }

        // View progress
        const viewProgressBtn = document.getElementById('viewProgressBtn');
        if (viewProgressBtn) {
            viewProgressBtn.addEventListener('click', () => {
                this.showProgressView();
            });
        }

        // History button
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.showHistoryView();
            });
        }
    }

    showProgressView() {
        const userWorkouts = this.workouts.filter(w => w.username === this.currentUser);
        
        if (userWorkouts.length === 0) {
            alert('Necesitas tener al menos una rutina para ver el progreso.');
            return;
        }

        // Modal simple de progreso
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

        const totalExercises = userWorkouts.reduce((total, workout) => 
            total + (workout.exercises ? workout.exercises.length : 0), 0
        );

        const workoutTypes = userWorkouts.reduce((acc, workout) => {
            acc[workout.type] = (acc[workout.type] || 0) + 1;
            return acc;
        }, {});

        const mostCommonType = Object.keys(workoutTypes).reduce((a, b) => 
            workoutTypes[a] > workoutTypes[b] ? a : b, 'N/A'
        );

        modal.innerHTML = `
            <div style="
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                padding: var(--space-lg);
                max-width: 700px;
                width: 95%;
                max-height: 85vh;
                overflow-y: auto;
                position: relative;
                box-shadow: var(--shadow-xl);
            ">
                <!-- BOTÓN DE CIERRE MÁS GRANDE - SOLO ESTE -->
                <button class="btn btn-ghost" style="
                    position: absolute; 
                    top: 1rem; 
                    right: 1rem; 
                    width: 44px; 
                    height: 44px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-size: 1.3rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 2px solid rgba(239, 68, 68, 0.3);
                    color: #E53E3E;
                    z-index: 10001;
                " id="closeProgressModal">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="card-header mb-lg">
                    <h2 class="card-title" style="font-size: 1.8rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-chart-line icon" style="color: var(--primary-purple);"></i>
                        Tu Progreso
                    </h2>
                    <p class="card-subtitle" style="color: var(--text-secondary); font-size: 1.1rem;">
                        Resumen detallado de tu actividad fitness
                    </p>
                </div>
                
                <!-- ESTADÍSTICAS PRINCIPALES -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                    <div style="
                        text-align: center; 
                        padding: 2rem 1rem; 
                        background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05));
                        border: 2px solid rgba(139, 92, 246, 0.2);
                        border-radius: var(--radius-lg);
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--primary-gradient);"></div>
                        <div class="typography-caption" style="margin-bottom: 0.75rem;">
                            <i class="fas fa-dumbbell icon-small" style="color: var(--primary-purple);"></i>
                            Total Rutinas
                        </div>
                        <div class="typography-display" style="font-size: 2.5rem; font-weight: 700; color: var(--primary-purple); margin-bottom: 0.5rem;">
                            ${userWorkouts.length}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">
                            Rutinas completadas
                        </div>
                    </div>
                    
                    <div style="
                        text-align: center; 
                        padding: 2rem 1rem; 
                        background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.05));
                        border: 2px solid rgba(236, 72, 153, 0.2);
                        border-radius: var(--radius-lg);
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--accent-gradient);"></div>
                        <div class="typography-caption" style="margin-bottom: 0.75rem;">
                            <i class="fas fa-list-check icon-small" style="color: var(--accent-pink);"></i>
                            Total Ejercicios
                        </div>
                        <div class="typography-display" style="font-size: 2.5rem; font-weight: 700; color: var(--accent-pink); margin-bottom: 0.5rem;">
                            ${totalExercises}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">
                            Ejercicios realizados
                        </div>
                    </div>
                </div>
                
                <!-- TIPO DE RUTINA MÁS COMÚN -->
                <div style="
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
                    border: 2px solid rgba(16, 185, 129, 0.2);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--success-gradient);"></div>
                    <h3 class="typography-heading-3 mb-sm" style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-star icon-small" style="color: var(--success);"></i>
                        Tipo de Rutina Más Común
                    </h3>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="workout-type" style="font-size: 1rem;">${this.getWorkoutTypeDisplay(mostCommonType)}</span>
                        <span class="typography-body" style="
                            background: rgba(16, 185, 129, 0.2);
                            padding: 0.25rem 0.75rem;
                            border-radius: var(--radius-xl);
                            color: var(--success);
                            font-weight: 600;
                        ">
                            ${workoutTypes[mostCommonType]} vez${workoutTypes[mostCommonType] !== 1 ? 'es' : ''}
                        </span>
                    </div>
                </div>
                
                <!-- DISTRIBUCIÓN DE RUTINAS -->
                <div style="margin-bottom: 1.5rem;">
                    <h3 class="typography-heading-3 mb-sm" style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-chart-pie icon-small" style="color: var(--warning);"></i>
                        Distribución de Rutinas
                    </h3>
                    <div style="
                        background: rgba(255,255,255,0.02);
                        border: 1px solid var(--border-color);
                        border-radius: var(--radius-lg);
                        overflow: hidden;
                    ">
                        ${Object.entries(workoutTypes).map(([type, count]) => {
                            const percentage = ((count / userWorkouts.length) * 100).toFixed(1);
                            const colorIndex = Object.keys(workoutTypes).indexOf(type) % 4;
                            const colors = ['var(--primary-purple)', 'var(--accent-pink)', 'var(--success)', 'var(--warning)'];
                            const color = colors[colorIndex];
                            
                            return `
                                <div style="
                                    display: flex; 
                                    justify-content: space-between; 
                                    align-items: center; 
                                    padding: 1rem 1.5rem;
                                    border-bottom: 1px solid var(--border-color);
                                    transition: all 0.3s ease;
                                ">
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="
                                            width: 12px;
                                            height: 12px;
                                            border-radius: 50%;
                                            background: ${color};
                                        "></div>
                                        <span class="typography-body">${this.getWorkoutTypeDisplay(type)}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <span class="typography-body-small" style="color: var(--text-muted);">
                                            ${percentage}%
                                        </span>
                                        <span class="typography-body-small" style="
                                            background: rgba(139, 92, 246, 0.1);
                                            padding: 0.25rem 0.5rem;
                                            border-radius: var(--radius-sm);
                                            color: var(--primary-purple);
                                            font-weight: 600;
                                        ">
                                            ${count} rutina${count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- INFORMACIÓN ADICIONAL -->
                <div style="
                    background: rgba(245, 158, 11, 0.05);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    border-radius: var(--radius-lg);
                    padding: 1.25rem;
                    text-align: center;
                ">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-trophy" style="color: var(--warning);"></i>
                        <span class="typography-body" style="color: var(--warning); font-weight: 600;">
                            ¡Sigue así!
                        </span>
                    </div>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                        Has completado ${userWorkouts.length} rutina${userWorkouts.length !== 1 ? 's' : ''} con un total de ${totalExercises} ejercicio${totalExercises !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeProgressModal = () => {
            document.body.removeChild(modal);
        };

        // SOLO UN EVENT LISTENER PARA CERRAR
        document.getElementById('closeProgressModal').addEventListener('click', closeProgressModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProgressModal();
            }
        });

        // Cerrar modal con Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeProgressModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    showHistoryView() {
        const userWorkouts = this.workouts.filter(w => w.username === this.currentUser);
        
        if (userWorkouts.length === 0) {
            alert('No tienes rutinas en tu historial.');
            return;
        }

        // Ordenar por fecha (más reciente primero)
        const sortedWorkouts = [...userWorkouts].sort((a, b) => new Date(b.date) - new Date(a.date));

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

        modal.innerHTML = `
            <div style="
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                padding: var(--space-lg);
                max-width: 900px;
                width: 95%;
                max-height: 85vh;
                overflow-y: auto;
                position: relative;
                box-shadow: var(--shadow-xl);
            ">
                <!-- BOTÓN DE CIERRE MÁS GRANDE - SOLO ESTE -->
                <button class="btn btn-ghost" style="
                    position: absolute; 
                    top: 1rem; 
                    right: 1rem; 
                    width: 44px; 
                    height: 44px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-size: 1.3rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 2px solid rgba(239, 68, 68, 0.3);
                    color: #E53E3E;
                    z-index: 10001;
                " id="closeHistoryModal">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="card-header mb-lg">
                    <h2 class="card-title" style="font-size: 1.8rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-history icon" style="color: var(--primary-purple);"></i>
                        Historial Completo
                    </h2>
                    <p class="card-subtitle" style="color: var(--text-secondary); font-size: 1.1rem;">
                        <i class="fas fa-list-check icon-small"></i>
                        ${sortedWorkouts.length} rutina${sortedWorkouts.length !== 1 ? 's' : ''} registrada${sortedWorkouts.length !== 1 ? 's' : ''}
                    </p>
                </div>
                
                <div style="
                    max-height: 60vh; 
                    overflow-y: auto;
                    padding-right: 0.5rem;
                ">
                    <!-- Estilos para scrollbar personalizado -->
                    <style>
                        .history-scroll::-webkit-scrollbar {
                            width: 6px;
                        }
                        .history-scroll::-webkit-scrollbar-track {
                            background: rgba(255,255,255,0.05);
                            border-radius: 3px;
                        }
                        .history-scroll::-webkit-scrollbar-thumb {
                            background: var(--primary-purple);
                            border-radius: 3px;
                        }
                    </style>
                    
                    <div class="history-scroll" style="max-height: 60vh; overflow-y: auto;">
                        ${sortedWorkouts.map((workout, index) => {
                            const workoutDate = new Date(workout.date);
                            const formattedDate = workoutDate.toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            });
                            
                            const exerciseCount = workout.exercises ? workout.exercises.length : 0;
                            const totalSets = workout.exercises ? workout.exercises.reduce((sum, ex) => sum + ex.sets, 0) : 0;
                            
                            // Colores alternados para mejor visualización
                            const cardColors = [
                                'rgba(139, 92, 246, 0.05)',
                                'rgba(236, 72, 153, 0.05)', 
                                'rgba(59, 130, 246, 0.05)',
                                'rgba(16, 185, 129, 0.05)'
                            ];
                            const cardColor = cardColors[index % cardColors.length];
                            
                            return `
                                <div style="
                                    background: ${cardColor};
                                    border: 2px solid rgba(139, 92, 246, 0.1);
                                    border-radius: var(--radius-lg);
                                    padding: 1.5rem;
                                    margin-bottom: 1rem;
                                    transition: all 0.3s ease;
                                    position: relative;
                                    overflow: hidden;
                                ">
                                    <!-- Indicador de tipo de rutina -->
                                    <div style="
                                        position: absolute;
                                        top: 0;
                                        left: 0;
                                        width: 6px;
                                        height: 100%;
                                        background: var(--primary-gradient);
                                    "></div>
                                    
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; margin-left: 0.5rem;">
                                        <div style="flex: 1;">
                                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                                                <h4 style="margin: 0; color: var(--text-primary); font-size: 1.2rem; font-weight: 600;">
                                                    ${this.getWorkoutTypeDisplay(workout.type)}
                                                </h4>
                                                <span style="
                                                    background: var(--primary-gradient);
                                                    color: white;
                                                    padding: 0.25rem 0.75rem;
                                                    border-radius: var(--radius-xl);
                                                    font-size: 0.75rem;
                                                    font-weight: 600;
                                                ">
                                                    #${index + 1}
                                                </span>
                                            </div>
                                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                                <i class="fas fa-calendar icon-small" style="color: var(--accent-pink);"></i>
                                                ${formattedDate}
                                            </p>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="display: flex; gap: 1rem; align-items: center;">
                                                <div style="text-align: center;">
                                                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">
                                                        <i class="fas fa-list-check"></i> Ejercicios
                                                    </div>
                                                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--primary-purple);">
                                                        ${exerciseCount}
                                                    </div>
                                                </div>
                                                <div style="text-align: center;">
                                                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">
                                                        <i class="fas fa-layer-group"></i> Series
                                                    </div>
                                                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent-pink);">
                                                        ${totalSets}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style="margin-left: 0.5rem;">
                                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                                            ${workout.exercises ? workout.exercises.slice(0, 3).map(exercise => `
                                                <span style="
                                                    background: rgba(139, 92, 246, 0.1);
                                                    padding: 0.5rem 0.75rem;
                                                    border-radius: var(--radius-md);
                                                    font-size: 0.8rem;
                                                    color: var(--text-primary);
                                                    border: 1px solid rgba(139, 92, 246, 0.2);
                                                    display: flex;
                                                    align-items: center;
                                                    gap: 0.5rem;
                                                ">
                                                    <i class="fas fa-dumbbell" style="color: var(--primary-purple); font-size: 0.7rem;"></i>
                                                    ${exercise.name}
                                                    <span style="
                                                        background: rgba(236, 72, 153, 0.1);
                                                        padding: 0.1rem 0.4rem;
                                                        border-radius: var(--radius-sm);
                                                        font-size: 0.7rem;
                                                        color: var(--accent-pink);
                                                        margin-left: 0.25rem;
                                                    ">
                                                        ${exercise.sets}×${exercise.reps}
                                                    </span>
                                                </span>
                                            `).join('') : ''}
                                            ${exerciseCount > 3 ? `
                                                <span style="
                                                    background: rgba(16, 185, 129, 0.1);
                                                    padding: 0.5rem 0.75rem;
                                                    border-radius: var(--radius-md);
                                                    font-size: 0.8rem;
                                                    color: var(--success);
                                                    border: 1px solid rgba(16, 185, 129, 0.2);
                                                    display: flex;
                                                    align-items: center;
                                                    gap: 0.5rem;
                                                ">
                                                    <i class="fas fa-plus" style="font-size: 0.7rem;"></i>
                                                    +${exerciseCount - 3} más
                                                </span>
                                            ` : ''}
                                        </div>
                                        
                                        ${workout.notes ? `
                                            <div style="
                                                background: rgba(245, 158, 11, 0.05);
                                                border: 1px solid rgba(245, 158, 11, 0.2);
                                                border-radius: var(--radius-md);
                                                padding: 0.75rem;
                                                margin-top: 0.5rem;
                                            ">
                                                <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                                                    <i class="fas fa-sticky-note" style="color: var(--warning); font-size: 0.8rem; margin-top: 0.1rem;"></i>
                                                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.4;">
                                                        "${workout.notes}"
                                                    </p>
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- FOOTER INFORMATIVO - SIN BOTÓN DE CERRAR -->
                <div style="
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 2px solid var(--border-color);
                    text-align: center;
                ">
                    <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">
                        <i class="fas fa-info-circle" style="color: var(--primary-purple);"></i>
                        Mostrando ${sortedWorkouts.length} rutina${sortedWorkouts.length !== 1 ? 's' : ''} en tu historial
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeHistoryModal = () => {
            document.body.removeChild(modal);
        };

        // SOLO UN EVENT LISTENER PARA CERRAR
        document.getElementById('closeHistoryModal').addEventListener('click', closeHistoryModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeHistoryModal();
            }
        });

        // Cerrar modal con Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeHistoryModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    // Utility method to format dates
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Dashboard...');
    try {
        new Dashboard();
    } catch (error) {
        console.error('❌ Error al inicializar el dashboard:', error);
        // Fallback: redirect to login if dashboard fails
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
});

// Add some utility functions to the global scope for debugging
window.fitlogDashboard = {
    version: '2.0.0',
    getCurrentUser: () => Storage.getItem('current_user'),
    getAllWorkouts: () => Storage.getItem('fitlog_workouts') || [],
    clearData: () => {
        Storage.setItem('fitlog_workouts', []);
        Storage.setItem('current_user', null);
        window.location.reload();
    }
};