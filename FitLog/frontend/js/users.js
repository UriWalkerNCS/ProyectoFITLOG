// users.js - render list of users from localStorage
console.log('users.js cargado');
document.addEventListener('DOMContentLoaded', () => {
  const users = Storage.getItem('fitlog_users') || [];
  const el = document.getElementById('usersList');
  if(!el) return;
  if(users.length === 0){
    el.innerHTML = '<p>No hay usuarios registrados</p>';
    return;
  }
  el.innerHTML = '<ul>' + users.map(u=>`<li><strong>${u.username}</strong> — creado: ${new Date(u.createdAt).toLocaleString()}</li>`).join('') + '</ul>';
});
