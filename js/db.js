// IndexedDB 数据库操作
const DB_NAME = 'TutoringAppDB';
const DB_VERSION = 2;
const SESSION_STORE = 'sessions';
const STUDENT_STORE = 'students';

let db = null;

// 初始化数据库
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // 课程存储
            if (!database.objectStoreNames.contains(SESSION_STORE)) {
                const sessionStore = database.createObjectStore(SESSION_STORE, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                sessionStore.createIndex('session_date', 'session_date', { unique: false });
                sessionStore.createIndex('status', 'status', { unique: false });
                sessionStore.createIndex('subject', 'subject', { unique: false });
                sessionStore.createIndex('series_id', 'series_id', { unique: false });
            }

            // 学生档案存储
            if (!database.objectStoreNames.contains(STUDENT_STORE)) {
                const studentStore = database.createObjectStore(STUDENT_STORE, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                studentStore.createIndex('name', 'name', { unique: false });
            }
        };
    });
}

// ========== 课程操作 ==========

async function getAllSessions() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SESSION_STORE], 'readonly');
        const store = transaction.objectStore(SESSION_STORE);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

async function addSession(session) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SESSION_STORE], 'readwrite');
        const store = transaction.objectStore(SESSION_STORE);
        const request = store.add(session);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function updateSession(session) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SESSION_STORE], 'readwrite');
        const store = transaction.objectStore(SESSION_STORE);
        const request = store.put(session);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function deleteSessionDB(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SESSION_STORE], 'readwrite');
        const store = transaction.objectStore(SESSION_STORE);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function getSession(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SESSION_STORE], 'readonly');
        const store = transaction.objectStore(SESSION_STORE);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function getSessionsByDateRange(startDate, endDate) {
    const allSessions = await getAllSessions();
    return allSessions.filter(s => {
        const date = s.session_date;
        return date >= startDate && date <= endDate;
    });
}

// 删除系列课程（批量删除循环课程）
async function deleteSeriesSessions(seriesId) {
    const allSessions = await getAllSessions();
    const seriesSessions = allSessions.filter(s => s.series_id === seriesId);

    const transaction = db.transaction([SESSION_STORE], 'readwrite');
    const store = transaction.objectStore(SESSION_STORE);

    for (const session of seriesSessions) {
        store.delete(session.id);
    }

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(seriesSessions.length);
        transaction.onerror = () => reject(transaction.error);
    });
}

// ========== 学生档案操作 ==========

async function getAllStudents() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STUDENT_STORE], 'readonly');
        const store = transaction.objectStore(STUDENT_STORE);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

async function addStudent(student) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STUDENT_STORE], 'readwrite');
        const store = transaction.objectStore(STUDENT_STORE);
        const request = store.add(student);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function updateStudent(student) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STUDENT_STORE], 'readwrite');
        const store = transaction.objectStore(STUDENT_STORE);
        const request = store.put(student);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function deleteStudentDB(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STUDENT_STORE], 'readwrite');
        const store = transaction.objectStore(STUDENT_STORE);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function getStudent(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STUDENT_STORE], 'readonly');
        const store = transaction.objectStore(STUDENT_STORE);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}
