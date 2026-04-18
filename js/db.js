// IndexedDB 数据库操作
const DB_NAME = 'TutoringAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

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
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                store.createIndex('session_date', 'session_date', { unique: false });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('subject', 'subject', { unique: false });
            }
        };
    });
}

// 获取所有课程
async function getAllSessions() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

// 添加课程
async function addSession(session) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(session);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// 更新课程
async function updateSession(session) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(session);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// 删除课程
async function deleteSessionDB(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// 获取单个课程
async function getSession(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// 按日期范围查询
async function getSessionsByDateRange(startDate, endDate) {
    const allSessions = await getAllSessions();
    return allSessions.filter(s => {
        const date = s.session_date;
        return date >= startDate && date <= endDate;
    });
}

// 清空所有数据
async function clearAllSessions() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}
