// Workout management
class WorkoutManager {
    constructor() {
        console.log('workout.js cargado');
        this.currentUser = Storage.getItem('current_user');
        this.exerciseCount = 0;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setCurrentDate();
        this.setupEventListeners();
        this.addExercise(); // Agregar primer ejercicio por defecto
    }

    checkAuth() {
        if (!this.currentUser) {
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
    }

    addExercise() {
        this.exerciseCount++;
        const exercisesContainer = document.getElementById('exercisesContainer');
        
        const exerciseHTML = `
            <div class="exercise-item" data-id="${this.exerciseCount}">
                <div class="exercise-header">
                    <span class="exercise-title">Ejercicio ${this.exerciseCount}</span>
                    <button type="button" class="btn-remove-exercise" data-remove-id="${this.exerciseCount}">
                        Eliminar
                    </button>
                </div>
                <div class="exercise-fields">
                    <input type="text" placeholder="Nombre del ejercicio" required>
                    <input type="number" placeholder="Series" min="1" required>
                    <input type="number" placeholder="Reps" min="1" required>
                    <input type="number" placeholder="Peso (kg)" step="0.5" min="0" required>
                </div>
            </div>
        `;

        exercisesContainer.insertAdjacentHTML('beforeend', exerciseHTML);

        // Attach event listener to the newly added remove button
        const newRemoveBtn = exercisesContainer.querySelector(`.btn-remove-exercise[data-remove-id="${this.exerciseCount}"]`);
        if (newRemoveBtn) {
            newRemoveBtn.addEventListener('click', () => this.removeExercise(this.exerciseCount));
        }
    }

    removeExercise(id) {
        const exerciseElement = document.querySelector(`[data-id="${id}"]`);
        if (exerciseElement) {
            exerciseElement.remove();
            // Reorganizar números de ejercicios
            this.renumberExercises();
        }
    }

    renumberExercises() {
        const exercises = document.querySelectorAll('.exercise-item');
        exercises.forEach((exercise, index) => {
            const title = exercise.querySelector('.exercise-title');
            title.textContent = `Ejercicio ${index + 1}`;
            exercise.setAttribute('data-id', index + 1);
        });
        this.exerciseCount = exercises.length;
    }

    saveWorkout() {
        const type = document.getElementById('workoutType').value;
        const date = document.getElementById('workoutDate').value;

        if (!type) {
            alert('Por favor selecciona un tipo de rutina');
            return;
        }

        // Recopilar ejercicios
        const exercises = [];
        const exerciseElements = document.querySelectorAll('.exercise-item');
        
        if (exerciseElements.length === 0) {
            alert('Agrega al menos un ejercicio');
            return;
        }

        exerciseElements.forEach(exercise => {
            const inputs = exercise.querySelectorAll('input');
            exercises.push({
                name: inputs[0].value,
                sets: parseInt(inputs[1].value),
                reps: parseInt(inputs[2].value),
                weight: parseFloat(inputs[3].value)
            });
        });

        // Validar que todos los campos estén completos
        const invalidExercise = exercises.find(ex => !ex.name || !ex.sets || !ex.reps || isNaN(ex.weight));
        if (invalidExercise) {
            alert('Completa todos los campos de cada ejercicio');
            return;
        }

        // Crear objeto de rutina
        const workout = {
            id: Date.now(), // ID único basado en timestamp
            username: this.currentUser,
            type: type,
            date: date,
            exercises: exercises,
            createdAt: new Date().toISOString()
        };

        // Guardar en localStorage
        const workouts = Storage.getItem('fitlog_workouts') || [];
        workouts.push(workout);
        Storage.setItem('fitlog_workouts', workouts);

        alert('Rutina guardada exitosamente!');
        window.location.href = 'dashboard.html';
    }
}

// Initialize workout manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const workoutManager = new WorkoutManager();
});