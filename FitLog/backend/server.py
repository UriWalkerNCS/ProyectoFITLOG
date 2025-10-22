from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import hashlib
import binascii
from datetime import datetime

APP_SECRET = os.environ.get('FLASK_SECRET', 'dev-secret-change')
DB_PATH = 'data.db'

app = Flask(__name__)
app.secret_key = APP_SECRET
# allow session cookie to be set on cross-site requests during local development
# Note: SESSION_COOKIE_SAMESITE=None requires SESSION_COOKIE_SECURE=True in browsers for cross-site in production,
# but for local testing we'll set SECURE=False. Do not use this config in production.
app.config.update({
    'SESSION_COOKIE_SAMESITE': None,
    'SESSION_COOKIE_SECURE': False,
    'SESSION_COOKIE_HTTPONLY': True,
})
# allow requests from frontend (http://127.0.0.1:8000)
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": ["http://127.0.0.1:8000", "http://localhost:8000"]}})

# --- DB helpers ---

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        salt TEXT NOT NULL,
        hash TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    ''')
    cur.execute('''
    CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        type TEXT,
        date TEXT,
        exercises TEXT,
        created_at TEXT NOT NULL
    )
    ''')
    conn.commit()
    conn.close()

# --- password helpers ---

def hash_password(password: str):
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return binascii.hexlify(salt).decode(), binascii.hexlify(dk).decode()

def verify_password(password: str, salt_hex: str, hash_hex: str) -> bool:
    salt = binascii.unhexlify(salt_hex)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return binascii.hexlify(dk).decode() == hash_hex

# --- routes ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'invalid json'}), 400
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT username FROM users WHERE username = ?', (username,))
    if cur.fetchone():
        conn.close()
        return jsonify({'error': 'user exists'}), 409

    salt, h = hash_password(password)
    created_at = datetime.utcnow().isoformat()
    cur.execute('INSERT INTO users (username, salt, hash, created_at) VALUES (?,?,?,?)',
                (username, salt, h, created_at))
    conn.commit()
    conn.close()
    print(f"[server] Registered new user: {username}")
    return jsonify({'ok': True}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'invalid json'}), 400
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT username, salt, hash FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    conn.close()
    if not row:
        print(f"[server] Login failed for user (not found): {username}")
        return jsonify({'error': 'invalid credentials'}), 401
    salt = row['salt']
    hash_hex = row['hash']
    if verify_password(password, salt, hash_hex):
        session['username'] = username
        print(f"[server] Login successful, session created for: {username}")
        # return username so frontend can persist UI state even if cookies are not
        return jsonify({'ok': True, 'username': username}), 200
    else:
        print(f"[server] Login failed (bad password) for: {username}")
        return jsonify({'error': 'invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'ok': True})

@app.route('/api/current_user', methods=['GET'])
def current_user():
    return jsonify({'username': session.get('username')})

# Workouts endpoints
@app.route('/api/workouts', methods=['GET', 'POST'])
def workouts():
    username = session.get('username')
    if not username:
        return jsonify({'error': 'unauthenticated'}), 401
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'GET':
        cur.execute('SELECT id, type, date, exercises, created_at FROM workouts WHERE username = ? ORDER BY id DESC', (username,))
        rows = cur.fetchall()
        result = []
        for r in rows:
            result.append({
                'id': r['id'],
                'type': r['type'],
                'date': r['date'],
                'exercises': r['exercises'],
                'created_at': r['created_at']
            })
        conn.close()
        return jsonify({'workouts': result})
    else:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'invalid json'}), 400
        wtype = data.get('type')
        wdate = data.get('date')
        exercises = data.get('exercises')
        created_at = datetime.utcnow().isoformat()
        cur.execute('INSERT INTO workouts (username, type, date, exercises, created_at) VALUES (?,?,?,?,?)',
                    (username, wtype, wdate, exercises, created_at))
        conn.commit()
        conn.close()
        return jsonify({'ok': True}), 201

if __name__ == '__main__':
    init_db()
    # small convenience routes to avoid 404 noise when visiting the server root
    # Serve frontend static files from the 'frontend' directory so the app and API share origin
    FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        # Don't interfere with API routes
        if path.startswith('api/'):
            return jsonify({'error': 'not found'}), 404

        if path == '' or path is None:
            target = 'index.html'
        else:
            target = path

        # try to serve the requested file; if not found, serve index.html (SPA fallback)
        file_path = os.path.join(FRONTEND_DIR, target)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(FRONTEND_DIR, target)
        else:
            return send_from_directory(FRONTEND_DIR, 'index.html')

    app.run(host='127.0.0.1', port=5000, debug=True)
