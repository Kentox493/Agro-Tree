import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export default function Chatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState(['Tips menanam padi', 'Cara meningkatkan pH tanah', 'Info tentang NPK']);

    // Agro-Vision State
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const fileInputRef = useRef(null);

    // Voice Input State
    const [isListening, setIsListening] = useState(false);
    const recognition = useRef(null);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchHistory = async () => {
        try {
            const data = await api.getChatHistory();
            if (data && data.length > 0) {
                setMessages(data);
            } else {
                setMessages([{ role: 'assistant', content: 'Halo! Saya asisten konsultasi tanaman Anda. Tanyakan apa saja tentang tanaman, kondisi tanah, atau hasil prediksi Anda.' }]);
            }
        } catch (err) {
            console.error("Failed to load chat history", err);
        }
    };

    useEffect(() => {
        if (open && messages.length === 0) {
            fetchHistory();
        }
    }, [open]);

    const handleClearChat = () => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '250px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>delete_forever</span>
                    <strong style={{ fontSize: '15px' }}>Bersihkan Obrolan?</strong>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Seluruh riwayat obrolan dengan asisten AI akan dihapus permanen.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{ padding: '6px 14px', fontSize: '12.5px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
                    >
                        Batal
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await api.clearChatHistory();
                                setMessages([{ role: 'assistant', content: 'Riwayat obrolan telah dibersihkan. Ada yang bisa saya bantu hari ini?' }]);
                                toast.success("Obrolan berhasil dibersihkan");
                            } catch (err) {
                                toast.error("Yah, gagal menghapus ingatan chatbot. Coba sebentar lagi ya 🤖");
                            }
                        }}
                        style={{ background: '#f87171', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Ya, Bersihkan
                    </button>
                </div>
            </div>
        ), { duration: Infinity, style: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' } });
    };

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.lang = 'id-ID';

            recognition.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput((prev) => `${prev} ${transcript}`.trim());
            };

            recognition.current.onend = () => setIsListening(false);
        }
    }, []);

    const toggleListening = () => {
        if (!recognition.current) {
            toast.error("Waduh, fitur suara belum didukung di browsermu (Saran: Pakai Edge/Chrome terbaru)! 🎤");
            return;
        }
        if (isListening) {
            recognition.current.stop();
        } else {
            recognition.current.start();
            setIsListening(true);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setImageBase64(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const sendMessage = async (text) => {
        const msg = text || input.trim();
        if (!msg && !imageBase64 || loading) return;

        const base64ToSend = imageBase64;
        const msgToSend = msg || "Tolong analisis gambar ini.";

        setInput('');
        setImagePreview(null);
        setImageBase64(null);

        setMessages((prev) => [...prev, { role: 'user', content: msgToSend, image: base64ToSend }]);
        setLoading(true);
        setSuggestions([]);

        try {
            const data = await api.chat({ message: msgToSend, image_base64: base64ToSend });
            setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
            if (data.suggestions?.length) setSuggestions(data.suggestions);
        } catch (err) {
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan. Silakan coba lagi.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* The Overlay */}
            <div className={`chatbot-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

            {/* The Floating Action Button (FAB) */}
            <div className={`chatbot-widget ${open ? 'hidden' : ''}`}>
                <button className="chatbot-toggle" onClick={() => setOpen(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        smart_toy
                    </span>
                </button>
            </div>

            {/* The Sidebar Panel */}
            <div className={`chatbot-panel ${open ? 'open' : ''}`}>
                <div className="chatbot-header">
                    <div className="chatbot-title">
                        <div className="chat-icon">
                            <span className="material-symbols-outlined">eco</span>
                        </div>
                        <div>
                            <h3>Asisten AI Tanaman</h3>
                            <p>Online & Tersimpan</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="chatbot-action-btn" onClick={handleClearChat} title="Hapus Riwayat Chat">
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#f87171' }}>delete</span>
                        </button>
                        <button className="chatbot-close-btn" onClick={() => setOpen(false)} title="Tutup Obrolan">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                <div className="chatbot-messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`chat-msg ${m.role}`}>
                            <div className="chat-bubble">
                                {m.image && (
                                    <div style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden' }}>
                                        <img src={m.image} alt="Upload" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                                    </div>
                                )}
                                <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-msg assistant">
                            <div className="typing-indicator"><span /><span /><span /></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {suggestions.length > 0 && (
                    <div className="chatbot-suggestions">
                        {suggestions.map((s, i) => (
                            <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
                        ))}
                    </div>
                )}

                <form className="chatbot-input-form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }} style={{ flexDirection: 'column', gap: 0, padding: 0 }}>
                    {imagePreview && (
                        <div style={{ padding: '12px 16px 0', display: 'flex' }}>
                            <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button type="button" onClick={() => { setImagePreview(null); setImageBase64(null) }} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', padding: 2 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                                </button>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '12px 16px' }}>
                        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', padding: '0 8px 0 0', cursor: 'pointer', color: 'var(--text-muted)' }} title="Pilih Foto Tanaman">
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>image</span>
                        </button>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

                        <button type="button" onClick={toggleListening} style={{ background: 'none', border: 'none', padding: '0 8px 0 0', cursor: 'pointer', color: isListening ? '#ef4444' : 'var(--text-muted)' }} title="Gunakan Suara (Dikte)">
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>mic</span>
                        </button>

                        <input
                            value={input} onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Mendengarkan..." : "Ketik atau tanya soal foto..."}
                            autoComplete="off"
                            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0 8px', fontSize: 13 }}
                        />
                        <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
