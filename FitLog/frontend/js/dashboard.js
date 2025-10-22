// Dashboard functionality
class Dashboard {
    constructor() {
        console.log('dashboard.js cargado');
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
        });
    }

    async checkAuth() {
        // try backend session
        try{
            const resp = await fetch('http://127.0.0.1:5000/api/current_user', { credentials: 'include' });
            const data = await resp.json().catch(()=>null);
            if (resp.ok && data && data.username) {
                this.currentUser = data.username;
                // persist locally for UI convenience
                Storage.setItem('current_user', this.currentUser);
                return;
            }
        }catch(e){
            console.warn('Error checking backend session', e);
        }

        // fallback to localStorage
        const stored = Storage.getItem('current_user');
        if (stored) {
            this.currentUser = stored;
            return;
        }

        // no session -> redirect to login
        window.location.href = 'index.html';
    }

    displayUserInfo() {
        document.getElementById('usernameDisplay').textContent = this.currentUser;
    }

    loadWorkouts() {
        const userWorkouts = this.workouts.filter(w => w.username === this.currentUser);
        this.updateStats(userWorkouts);
        this.renderWorkouts(userWorkouts);
    }

    updateStats(workouts) {
        // Total workouts
        document.getElementById('totalWorkouts').textContent = workouts.length;

        // Total exercises
        const totalExercises = workouts.reduce((total, workout) => 
            total + workout.exercises.length, 0
        );
        document.getElementById('totalExercises').textContent = totalExercises;

        // Last workout
        if (workouts.length > 0) {
            const lastWorkout = workouts[workouts.length - 1];
            const date = new Date(lastWorkout.date).toLocaleDateString('es-ES');
            document.getElementById('lastWorkout').textContent = date;
        }
    }

    renderWorkouts(workouts) {
        const workoutsList = document.getElementById('workoutsList');
        const emptyState = document.getElementById('emptyState');

        if (workouts.length === 0) {
            workoutsList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        workoutsList.style.display = 'grid';
        emptyState.style.display = 'none';

        // Mostrar solo las últimas 5 rutinas
        const recentWorkouts = workouts.slice(-5).reverse();
        
        workoutsList.innerHTML = recentWorkouts.map(workout => `
            <div class="workout-item">
                <div class="workout-header">
                    <span class="workout-date">${new Date(workout.date).toLocaleDateString('es-ES')}</span>
                    <span class="workout-type">${workout.type}</span>
                </div>
                <ul class="exercise-list">
                    ${workout.exercises.map(exercise => `
                        <li class="exercise-item">
                            <span class="exercise-name">${exercise.name}</span>
                            <span class="exercise-details">
                                ${exercise.sets}×${exercise.reps} - ${exercise.weight}kg
                            </span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            Storage.setItem('current_user', null);
            window.location.href = 'index.html';
        });

        // Add workout
        document.getElementById('addWorkoutBtn').addEventListener('click', () => {
            window.location.href = 'add-workout.html';
        });

        // View progress
        document.getElementById('viewProgressBtn').addEventListener('click', () => {
            alert('Funcionalidad de progreso en desarrollo...');
        });
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});