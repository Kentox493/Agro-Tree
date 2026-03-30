import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const getWeatherIcon = (code) => {
    if (code === 0) return { i: 'light_mode', t: 'Cerah' };
    if ([1, 2, 3].includes(code)) return { i: 'partly_cloudy_day', t: 'Berawan' };
    if ([45, 48].includes(code)) return { i: 'foggy', t: 'Kabut' };
    if ([51, 53, 55, 56, 57].includes(code)) return { i: 'rainy', t: 'Gerimis' };
    if ([61, 63, 65, 66, 67].includes(code)) return { i: 'rainy', t: 'Hujan' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { i: 'ac_unit', t: 'Salju' };
    if ([80, 81, 82].includes(code)) return { i: 'storm', t: 'Hujan Deras' };
    if ([95, 96, 99].includes(code)) return { i: 'thunderstorm', t: 'Badai Petir' };
    return { i: 'cloud', t: 'Cuaca' };
};

export default function WeatherWidget({ collapsed }) {
    const [weather, setWeather] = useState({
        temp: '--', condition: 'Memuat...', icon: 'cloud', location: '...', humidity: '--', loading: true
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editLocation, setEditLocation] = useState('');
    const inputRef = useRef(null);

    const fetchWeather = async () => {
        setWeather(prev => ({ ...prev, loading: true }));
        try {
            const locName = localStorage.getItem('weatherLocation') || 'Jakarta';
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locName)}&count=1&language=id&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results?.length) throw new Error('Not found');

            const city = geoData.results[0];
            const displayLoc = city.name.length > 12 ? city.name.substring(0, 10) + '...' : city.name;

            const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`);
            const wxData = await wxRes.json();
            const curr = wxData.current;
            const cond = getWeatherIcon(curr.weather_code);

            setWeather({
                temp: Math.round(curr.temperature_2m), condition: cond.t, icon: cond.i,
                location: displayLoc, humidity: curr.relative_humidity_2m, loading: false
            });
        } catch (err) {
            setWeather(prev => ({
                ...prev, loading: false, temp: '-', condition: 'Gagal',
                location: (localStorage.getItem('weatherLocation') || 'Error').substring(0, 10)
            }));
        }
    };

    const handleEditClick = () => {
        setEditLocation(localStorage.getItem('weatherLocation') || 'Jakarta');
        setIsEditing(true);
    };

    const handleSaveLocation = () => {
        if (!editLocation.trim()) {
            setIsEditing(false);
            return;
        }
        localStorage.setItem('weatherLocation', editLocation.trim());
        setIsEditing(false);
        fetchWeather();
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Yah, browser kamu belum mendukung fittur GPS nih! 🧭');
            return;
        }

        setIsEditing(false);
        setWeather(prev => ({ ...prev, loading: true, condition: 'Mendeteksi...' }));

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`);
                const data = await res.json();

                const cityName = data.city || data.locality || data.principalSubdivision || 'Lokasi Saya';

                localStorage.setItem('weatherLocation', cityName);
                toast.success(`Lokasi terdeteksi: ${cityName}`);
                fetchWeather();
            } catch (err) {
                toast.error('Gagal melacak lokasimu. Sepertinya satelit sedang ngopi ☕');
                fetchWeather(); // Fallback to previous
            }
        }, (error) => {
            toast.error('Yah, izin GPS ditolak! Kami tidak bisa menebak lokasimu 🙈');
            fetchWeather(); // Fallback to previous
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSaveLocation();
        if (e.key === 'Escape') setIsEditing(false);
    };

    useEffect(() => {
        fetchWeather();
        const onLocChange = () => fetchWeather();
        window.addEventListener('locationChanged', onLocChange);
        return () => window.removeEventListener('locationChanged', onLocChange);
    }, []);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    if (collapsed) {
        return (
            <div className="weather-widget-mini" title={weather.loading ? "Memuat..." : `${weather.temp}°C ${weather.condition}`}>
                {weather.loading ? <div className="spinner-small" /> : <span className="material-symbols-outlined">{weather.icon}</span>}
            </div>
        );
    }

    return (
        <div className="weather-widget">
            {weather.loading && !isEditing ? (
                <div className="weather-loading">
                    <div className="spinner-small" />
                    <span>{weather.condition.includes('Mendeteksi') ? 'Mendeteksi GPS...' : 'Memuat cuaca...'}</span>
                </div>
            ) : (
                <>
                    <div className="weather-main">
                        <span className="material-symbols-outlined weather-icon">{weather.icon}</span>
                        <div className="weather-temp">
                            <h4>{weather.temp}°C</h4>
                            <p>{weather.condition}</p>
                        </div>
                    </div>
                    <div className="weather-details">
                        <div className="weather-loc">
                            <span className="material-symbols-outlined">location_on</span>
                            {isEditing ? (
                                <div className="weather-loc-edit">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={editLocation}
                                        onChange={e => setEditLocation(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ketik kota..."
                                    />
                                    <span
                                        className="material-symbols-outlined action-icon check-icon"
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={handleSaveLocation}
                                        title="Simpan"
                                    >check_circle</span>
                                    <span
                                        className="material-symbols-outlined action-icon gps-icon"
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={handleDetectLocation}
                                        title="Gunakan GPS"
                                    >my_location</span>
                                </div>
                            ) : (
                                <span
                                    className="loc-text cursor-pointer"
                                    onClick={handleEditClick}
                                    title="Ubah lokasi"
                                >
                                    {weather.location}
                                    <span className="material-symbols-outlined edit-icon">edit</span>
                                </span>
                            )}
                        </div>
                        <div className="weather-hum">
                            <span className="material-symbols-outlined">water_drop</span>
                            <span>RH: {weather.humidity}%</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
