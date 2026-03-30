package config

import "os"

type Config struct {
	Port           string
	DBPath         string
	JWTSecret      string
	DatasetDir     string
	ModelPath      string
	GeminiAPIKey   string
	AllowedOrigins string
	RegistryPath   string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8088"
	}

	// WAJIB: Set via environment variable, JANGAN hardcode!
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "dev-only-change-me-in-production"
	}

	// WAJIB: Set via environment variable untuk mengaktifkan chatbot
	geminiKey := os.Getenv("GEMINI_API_KEY")

	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:3000,http://localhost:5173,http://localhost:5175"
	}

	return &Config{
		Port:           port,
		DBPath:         "data/app.db",
		JWTSecret:      jwtSecret,
		DatasetDir:     "../ml/dataset",
		ModelPath:      "ml/model.json",
		RegistryPath:   "ml/registry.json",
		GeminiAPIKey:   geminiKey,
		AllowedOrigins: allowedOrigins,
	}
}
