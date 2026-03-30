package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"prediksi-tanaman/chatbot"
	"prediksi-tanaman/config"
	"prediksi-tanaman/database"
	"prediksi-tanaman/handlers"
	mw "prediksi-tanaman/middleware"
	"prediksi-tanaman/ml"
	"prediksi-tanaman/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

var startTime = time.Now()

func main() {
	cfg := config.Load()

	// Train command
	if len(os.Args) > 1 && os.Args[1] == "train" {
		datasetPath := filepath.Join(cfg.DatasetDir, "crop_recommendation.csv")
		registryPath := cfg.RegistryPath
		if len(os.Args) > 2 {
			datasetPath = os.Args[2]
		}
		if len(os.Args) > 3 {
			registryPath = os.Args[3]
		}
		if err := ml.TrainAndSave(datasetPath, registryPath); err != nil {
			log.Fatalf("Training failed: %v", err)
		}
		return
	}

	// Database
	if err := database.Init(cfg.DBPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// ML Model (Zero-Downtime Hot Reloading Pipeline)
	if err := ml.InitHotReload(cfg.RegistryPath); err != nil {
		log.Printf("WARNING: MLOps registry not found or empty. Auto training new model...")
		datasetPath := filepath.Join(cfg.DatasetDir, "crop_recommendation.csv")
		if err := ml.TrainAndSave(datasetPath, cfg.RegistryPath); err != nil {
			log.Fatalf("Auto-training failed: %v", err)
		}
		// Try reloading again after training
		if err := ml.InitHotReload(cfg.RegistryPath); err != nil {
			log.Fatalf("Critical Error: Pipeline still failed to load active model after training: %v", err)
		}
	} else if active := ml.GetActiveModel(); active != nil {
		log.Printf("Hot-Reload Watcher is active! Loaded model with %d classes", len(active.Classes))
	}

	// Plant data
	plantData := loadPlantData("data/plants.json")
	log.Printf("Loaded info for %d plants", len(plantData))

	// Pre-compute ETag for plant data (static, never changes at runtime)
	plantETag := computeETag(plantData)
	log.Printf("Plant data ETag: %s", plantETag)

	// ── Fiber App with Hardened Config ──
	app := fiber.New(fiber.Config{
		AppName:               "TanamanAI",
		ErrorHandler:          customErrorHandler,
		BodyLimit:             5 * 1024 * 1024, // 5 MB max body
		ReadTimeout:           10 * time.Second,
		WriteTimeout:          30 * time.Second,
		IdleTimeout:           60 * time.Second,
		DisableStartupMessage: false,
	})

	// ── Global Middleware Stack ──

	// 1. Recover from panics (prevents server crash)
	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
	}))

	// 2. Request ID — unique trace ID per request
	app.Use(requestid.New())

	// 3. Request Logger (with Request ID)
	app.Use(logger.New(logger.Config{
		Format:     "${time} | ${status} | ${latency} | ${method} ${path} | rid:${locals:requestid}\n",
		TimeFormat: "15:04:05",
	}))

	// 4. Security Headers (XSS, clickjacking, MIME sniffing protection)
	app.Use(helmet.New())

	// 5. Gzip Compression — 60-80% bandwidth savings
	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestSpeed,
	}))

	// 6. CORS — locked to specific origins
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, If-None-Match",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
		MaxAge:           3600,
	}))

	// 7. Global Rate Limiter — 120 requests/min per IP
	app.Use(limiter.New(limiter.Config{
		Max:               120,
		Expiration:        1 * time.Minute,
		LimiterMiddleware: limiter.SlidingWindow{},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Terlalu banyak permintaan. Coba lagi dalam 1 menit.",
			})
		},
	}))

	// ── Routes ──
	apiGroup := app.Group("/api")

	// Health Check (public, no auth)
	apiGroup.Get("/health", func(c *fiber.Ctx) error {
		dbOk := true
		if err := database.DB.Ping(); err != nil {
			dbOk = false
		}
		mlClasses := 0
		if active := ml.GetActiveModel(); active != nil {
			mlClasses = len(active.Classes)
		}
		return c.JSON(fiber.Map{
			"status":     "ok",
			"uptime":     time.Since(startTime).String(),
			"database":   dbOk,
			"ml_classes": mlClasses,
			"plants":     len(plantData),
			"version":    "2.0.0",
			"timestamp":  time.Now().Format(time.RFC3339),
		})
	})

	// Auth (public)
	authHandler := handlers.NewAuthHandler(cfg.JWTSecret)
	auth := apiGroup.Group("/auth")

	// Stricter rate limit on login (10 attempts per minute) — bruteforce protection
	loginLimiter := limiter.New(limiter.Config{
		Max:               10,
		Expiration:        1 * time.Minute,
		LimiterMiddleware: limiter.SlidingWindow{},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Terlalu banyak percobaan login. Coba lagi dalam 1 menit.",
			})
		},
	})

	auth.Post("/register", loginLimiter, authHandler.Register)
	auth.Post("/login", loginLimiter, authHandler.Login)
	auth.Get("/me", mw.AuthMiddleware(cfg.JWTSecret), authHandler.Me)
	auth.Put("/name", mw.AuthMiddleware(cfg.JWTSecret), authHandler.UpdateName)
	auth.Put("/password", mw.AuthMiddleware(cfg.JWTSecret), authHandler.UpdatePassword)
	auth.Put("/avatar", mw.AuthMiddleware(cfg.JWTSecret), authHandler.UpdateAvatar)
	auth.Post("/avatar/upload", mw.AuthMiddleware(cfg.JWTSecret), authHandler.UploadAvatar)

	// Plants (public, with ETag caching)
	plantHandler := handlers.NewPlantHandler(plantData, plantETag)
	apiGroup.Get("/plants", plantHandler.ListPlants)
	apiGroup.Get("/plants/:name", plantHandler.GetPlant)

	// Protected routes
	protected := apiGroup.Group("/", mw.AuthMiddleware(cfg.JWTSecret))

	predictHandler := handlers.NewPredictHandler(plantData)
	protected.Post("predict", predictHandler.Predict)
	protected.Get("predictions", predictHandler.GetHistory)
	protected.Get("predictions/stats", predictHandler.GetStats)
	protected.Delete("predictions/:id", predictHandler.DeletePrediction)

	chatEngine := chatbot.NewEngine(plantData, cfg.GeminiAPIKey)
	chatHandler := handlers.NewChatHandler(chatEngine)
	protected.Post("chat", chatHandler.Chat)
	protected.Get("chat/history", chatHandler.GetHistory)
	protected.Delete("chat/history", chatHandler.ClearHistory)

	// ── Graceful Shutdown ──
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("🛑 Shutting down gracefully (10s timeout)...")
		if err := app.ShutdownWithTimeout(10 * time.Second); err != nil {
			log.Printf("Shutdown error: %v", err)
		}
	}()

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🌱 TanamanAI server starting on http://localhost%s", addr)
	if err := app.Listen(addr); err != nil {
		log.Printf("Server stopped: %v", err)
	}

	log.Println("✅ Server shutdown complete")
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal server error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error": message,
	})
}

func loadPlantData(path string) map[string]models.Plant {
	data, err := os.ReadFile(path)
	if err != nil {
		log.Printf("Warning: Could not load plant data from %s: %v", path, err)
		return make(map[string]models.Plant)
	}
	var plants map[string]models.Plant
	if err := json.Unmarshal(data, &plants); err != nil {
		log.Printf("Warning: Could not parse plant data: %v", err)
		return make(map[string]models.Plant)
	}
	return plants
}

func computeETag(data interface{}) string {
	b, _ := json.Marshal(data)
	hash := sha256.Sum256(b)
	return fmt.Sprintf(`"%x"`, hash[:8])
}
