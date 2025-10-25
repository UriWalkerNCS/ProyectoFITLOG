// Workout management - COMPLETELY UPDATED
class WorkoutManager {
    constructor() {
        console.log('workout.js cargado - versión mejorada');
        this.currentUser = Storage.getItem('current_user');
        this.exerciseCount = 0;
        this.currentRating = 0;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setCurrentDate();
        this.setupEventListeners();
        this.setupRatingSystem();
        this.addExercise(); // Agregar primer ejercicio por defecto
        this.updateExerciseCounter();
    }

    checkAuth() {
        if (!this.currentUser) {
            alert('Debes iniciar sesión para crear rutinas');
            window.location.href = 'index.html';
            return;
        }
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('workoutDate').value = today;
    }

    setupEventListeners() {
        // Add exercise button
        document.getElementById('addExerciseBtn').addEventListener('click', () => {
            this.addExercise();
        });

        // Form submission
        document.getElementById('workoutForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWorkout();
        });

        // Update counter when exercise inputs change
        document.addEventListener('input', (e) => {
            if (e.target.type === 'number' && e.target.closest('.exercise-item')) {
                this.updateExerciseCounter();
            }
        });
    }

    setupRatingSystem() {
        const stars = document.querySelectorAll('.rating-star');
        this.currentRating = 0;
        
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                this.currentRating = rating;
                this.updateRatingDisplay(rating);
            });
            
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                this.highlightStars(rating);
            });
        });
        
        document.getElementById('ratingStars').addEventListener('mouseleave', () => {
            this.highlightStars(this.currentRating);
        });
    }

    updateRatingDisplay(rating) {
        const stars = document.querySelectorAll('.rating-star');
        const ratingText = document.getElementById('ratingText');
        
        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            if (starRating <= rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
        
        const ratings = ['Sin calificar', 'Muy Malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
        ratingText.textContent = ratings[rating];
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('.rating-star');
        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            if (starRating <= rating) {
                star.style.color = '#FFD700';
            } else {
                star.style.color = 'var(--text-muted)';
            }
        });
    }

    addExercise() {
        this.exerciseCount++;
        const exercisesContainer = document.getElementById('exercisesContainer');
        
        const exerciseHTML = `
            <div class="exercise-item" data-id="${this.exerciseCount}">
                <div class="exercise-header">
                    <span class="exercise-title">
                        <i class="fas fa-dumbbell icon-small"></i>
                        Ejercicio ${this.exerciseCount}
                    </span>
                    <button type="button" class="btn-remove-exercise" data-remove-id="${this.exerciseCount}">
                        <i class="fas fa-trash icon-small"></i>
                        Eliminar
                    </button>
                </div>
                <div class="exercise-fields">
                    <div class="exercise-field-group">
                        <input type="text" required>
                        <span class="field-title">Nombre del Ejercicio</span>
                    </div>
                    <div class="exercise-field-group">
                        <input type="number" placeholder="Series" min="1" max="10" value="3" required>
                        <span class="field-title">Series</span>
                    </div>
                    <div class="exercise-field-group">
                        <input type="number" placeholder="Repeticiones" min="1" max="50" value="10" required>
                        <span class="field-title">Repeticiones</span>
                    </div>
                    <div class="exercise-field-group">
                        <input type="number" placeholder="Peso (kg)" min="0" value="0" required>
                        <span class="field-title">Peso (kg)</span>
                    </div>
                </div>
            </div>
        `;

        exercisesContainer.insertAdjacentHTML('beforeend', exerciseHTML);

        // Attach event listener to the newly added remove button
        const newRemoveBtn = exercisesContainer.querySelector(`.btn-remove-exercise[data-remove-id="${this.exerciseCount}"]`);
        if (newRemoveBtn) {
            newRemoveBtn.addEventListener('click', () => this.removeExercise(this.exerciseCount));
        }

        this.updateExerciseCounter();
    }

    removeExercise(id) {
        const exerciseElement = document.querySelector(`[data-id="${id}"]`);
        if (exerciseElement) {
            exerciseElement.remove();
            // Reorganizar números de ejercicios
            this.renumberExercises();
            this.updateExerciseCounter();
        }
    }

    renumberExercises() {
        const exercises = document.querySelectorAll('.exercise-item');
        exercises.forEach((exercise, index) => {
            const title = exercise.querySelector('.exercise-title');
            title.innerHTML = `<i class="fas fa-dumbbell icon-small"></i> Ejercicio ${index + 1}`;
            exercise.setAttribute('data-id', index + 1);
            
            // Actualizar el data-remove-id del botón
            const removeBtn = exercise.querySelector('.btn-remove-exercise');
            removeBtn.setAttribute('data-remove-id', index + 1);
        });
        this.exerciseCount = exercises.length;
    }

    updateExerciseCounter() {
        const exerciseCount = document.querySelectorAll('.exercise-item').length;
        const countElement = document.getElementById('exerciseCount');
        countElement.textContent = `${exerciseCount} ejercicio${exerciseCount !== 1 ? 's' : ''} agregado${exerciseCount !== 1 ? 's' : ''}`;
        
        // Calcular total de series
        let totalSets = 0;
        document.querySelectorAll('.exercise-item').forEach(exercise => {
            const setsInput = exercise.querySelector('.exercise-field-group:nth-child(2) input');
            if (setsInput && setsInput.value) {
                totalSets += parseInt(setsInput.value) || 0;
            }
        });
        
        const setsElement = document.getElementById('totalSetsReps');
        setsElement.textContent = `Total: ${totalSets} series`;
    }

    validateForm() {
        const workoutName = document.getElementById('workoutName').value.trim();
        const workoutType = document.getElementById('workoutType').value;
        const workoutDate = document.getElementById('workoutDate').value;
        const exerciseElements = document.querySelectorAll('.exercise-item');

        // Validar nombre de rutina
        if (!workoutName) {
            alert('Por favor ingresa un nombre para tu rutina');
            return false;
        }

        // Validar tipo de rutina
        if (!workoutType) {
            alert('Por favor selecciona un tipo de rutina');
            return false;
        }

        // Validar fecha
        if (!workoutDate) {
            alert('Por favor selecciona una fecha');
            return false;
        }

        // Validar que haya al menos un ejercicio
        if (exerciseElements.length === 0) {
            alert('Agrega al menos un ejercicio a tu rutina');
            return false;
        }

        // Validar cada ejercicio
        for (let exercise of exerciseElements) {
            const inputs = exercise.querySelectorAll('input');
            const name = inputs[0].value.trim();
            const sets = inputs[1].value;
            const reps = inputs[2].value;
            const weight = inputs[3].value;

            if (!name) {
                alert('Completa el nombre de todos los ejercicios');
                return false;
            }

            if (!sets || sets < 1) {
                alert('Cada ejercicio debe tener al menos 1 serie');
                return false;
            }

            if (!reps || reps < 1) {
                alert('Cada ejercicio debe tener al menos 1 repetición');
                return false;
            }

            if (!weight || weight < 0) {
                alert('El peso debe ser 0 o mayor');
                return false;
            }
        }

        return true;
    }

    saveWorkout() {
        console.log('Guardando rutina...');

        if (!this.validateForm()) {
            return;
        }

        // Recopilar datos del formulario
        const workoutName = document.getElementById('workoutName').value.trim();
        const workoutType = document.getElementById('workoutType').value;
        const workoutDate = document.getElementById('workoutDate').value;
        const workoutGoal = document.getElementById('workoutGoal').value;
        const workoutIntensity = document.getElementById('workoutIntensity').value;
        const workoutHours = parseInt(document.getElementById('workoutHours').value) || 0;
        const workoutMinutes = parseInt(document.getElementById('workoutMinutes').value) || 0;
        const workoutNotes = document.getElementById('workoutNotes').value.trim();

        // Calcular duración total en minutos
        const totalDuration = (workoutHours * 60) + workoutMinutes;

        // Recopilar ejercicios
        const exercises = [];
        const exerciseElements = document.querySelectorAll('.exercise-item');
        
        exerciseElements.forEach(exercise => {
            const inputs = exercise.querySelectorAll('input');
            exercises.push({
                name: inputs[0].value.trim(),
                sets: parseInt(inputs[1].value),
                reps: parseInt(inputs[2].value),
                weight: parseFloat(inputs[3].value)
            });
        });

        // Crear objeto de rutina completo
        const workout = {
            id: Date.now(), // ID único basado en timestamp
            username: this.currentUser,
            name: workoutName,
            type: workoutType,
            date: workoutDate,
            goal: workoutGoal,
            intensity: workoutIntensity,
            duration: totalDuration,
            rating: this.currentRating,
            notes: workoutNotes,
            exercises: exercises,
            createdAt: new Date().toISOString()
        };

        console.log('📦 Rutina a guardar:', workout);

        // Intentar guardar en el backend primero
        this.saveToBackend(workout).then(backendSuccess => {
            if (!backendSuccess) {
                // Fallback: Guardar en localStorage
                this.saveToLocalStorage(workout);
            }
        }).catch(error => {
            console.error('Error al guardar en backend:', error);
            // Fallback a localStorage
            this.saveToLocalStorage(workout);
        });
    }

    async saveToBackend(workout) {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/workouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    type: workout.type,
                    date: workout.date,
                    exercises: JSON.stringify(workout.exercises)
                })
            });

            if (response.ok) {
                console.log('Rutina guardada en el servidor');
                alert('¡Rutina guardada exitosamente en el servidor!');
                window.location.href = 'dashboard.html';
                return true;
            } else {
                console.warn('Error del servidor:', response.status);
                return false;
            }
        } catch (error) {
            console.warn('Servidor no disponible, usando almacenamiento local');
            return false;
        }
    }

    saveToLocalStorage(workout) {
        try {
            const workouts = Storage.getItem('fitlog_workouts') || [];
            workouts.push(workout);
            Storage.setItem('fitlog_workouts', workouts);
            
            console.log('Rutina guardada localmente:', workout);
            alert('¡Rutina guardada exitosamente! (almacenamiento local)');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
            alert('Error al guardar la rutina. Por favor intenta nuevamente.');
        }
    }

    // Método para calcular estadísticas de la rutina
    calculateWorkoutStats(exercises) {
        const stats = {
            totalExercises: exercises.length,
            totalSets: exercises.reduce((sum, ex) => sum + ex.sets, 0),
            totalReps: exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps), 0),
            totalVolume: exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps * ex.weight), 0),
            averageWeight: 0
        };

        if (stats.totalReps > 0) {
            stats.averageWeight = stats.totalVolume / stats.totalReps;
        }

        return stats;
    }

    // Método para formatear la duración
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0 && mins > 0) {
            return `${hours}h ${mins}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${mins}m`;
        }
    }

    // Método para obtener texto de intensidad
    getIntensityText(intensity) {
        const intensityMap = {
            'Baja': '🟢 Baja',
            'Moderada': '🟡 Moderada',
            'Alta': '🟠 Alta',
            'Extrema': '🔴 Extrema'
        };
        return intensityMap[intensity] || intensity;
    }

    // Método para obtener emoji de objetivo
    getGoalEmoji(goal) {
        const goalEmojis = {
            'Fuerza': '💪',
            'Hipertrofia': '🏋️',
            'Resistencia': '🏃',
            'Pérdida de Peso': '⚖️',
            'Definición': '✨',
            'Mantenimiento': '🔄'
        };
        return goalEmojis[goal] || '🎯';
    }
}

// Utility functions
function showNotification(message, type = 'success') {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize workout manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando Workout Manager...');
    try {
        new WorkoutManager();
    } catch (error) {
        console.error('Error al inicializar el workout manager:', error);
        alert('Error al cargar el formulario. Por favor recarga la página.');
    }
});

// Add utility functions to global scope for debugging
window.fitlogWorkout = {
    version: '2.0.0',
    getCurrentWorkout: () => {
        const manager = new WorkoutManager();
        return {
            user: manager.currentUser,
            exerciseCount: manager.exerciseCount,
            rating: manager.currentRating
        };
    },
    addTestExercise: () => {
        const manager = new WorkoutManager();
        manager.addExercise();
    },
    validateCurrentForm: () => {
        const manager = new WorkoutManager();
        return manager.validateForm();
    }
};