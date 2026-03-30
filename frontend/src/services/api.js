const API_BASE = '/api';

function getHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

function handleGlobalError(status, serverMessage) {
    let customMessage = serverMessage || 'Ups, ada masalah teknis yang tidak terduga 🤔';

    switch (status) {
        case 400:
            customMessage = serverMessage || 'Hmm, data yang kamu kirim sepertinya kurang tepat. Coba periksa lagi ya 📝';
            break;
        case 401:
            customMessage = 'Sesi kamu sudah habis atau belum login! Yuk masuk lagi biar aman 🔐';
            break;
        case 403:
            customMessage = 'Waduh, kamu belum punya izin akses ke fitur ini 🚫';
            break;
        case 404:
            customMessage = 'Hmm, yang kamu cari sepertinya tidak ada di sistem kami 🕵️‍♂️';
            break;
        case 429:
            customMessage = 'Sabar ya bosku, permintaanmu ke server terlalu cepat. Istirahat sejenak 🐢';
            break;
        case 500:
        case 502:
        case 503:
        case 504:
            customMessage = 'Waduh, ada badai di server! Teknisi kami sedang memperbaikinya 🌪️👨‍💻';
            break;
    }
    return customMessage;
}

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: getHeaders(),
        ...options,
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        data = { message: text };
    }

    if (!res.ok) {
        throw new Error(handleGlobalError(res.status, data.error));
    }
    return data;
}

export const api = {
    // Auth
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    updateName: (name) => request('/auth/name', { method: 'PUT', body: JSON.stringify({ name }) }),
    updatePassword: (old_password, new_password) => request('/auth/password', { method: 'PUT', body: JSON.stringify({ old_password, new_password }) }),
    updateAvatar: (avatar_url) => request('/auth/avatar', { method: 'PUT', body: JSON.stringify({ avatar_url }) }),
    uploadAvatar: async (formData) => {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/auth/avatar/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        const text = await res.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            data = { message: text };
        }

        if (!res.ok) {
            throw new Error(handleGlobalError(res.status, data.error));
        }
        return data;
    },

    // Predict
    predict: (body) => request('/predict', { method: 'POST', body: JSON.stringify(body) }),
    getHistory: () => request('/predictions'),
    getStats: () => request('/predictions/stats'),
    deletePrediction: (id) => request(`/predictions/${id}`, { method: 'DELETE' }),

    // Chat
    chat: (body) => request('/chat', { method: 'POST', body: JSON.stringify(body) }),
    getChatHistory: () => request('/chat/history'),
    clearChatHistory: () => request('/chat/history', { method: 'DELETE' }),

    // Plants
    getPlants: () => request('/plants'),
    getPlant: (name) => request(`/plants/${name}`),
};
