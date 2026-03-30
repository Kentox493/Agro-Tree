package handlers

import (
	"context"
	"strings"
	"time"

	"prediksi-tanaman/chatbot"
	"prediksi-tanaman/database"
	"prediksi-tanaman/middleware"
	"prediksi-tanaman/models"

	"github.com/gofiber/fiber/v2"
)

const (
	maxMessageLength   = 2000
	maxImageBase64Size = 4 * 1024 * 1024 // ~4MB base64 ≈ 3MB decoded
)

type ChatHandler struct {
	Engine *chatbot.Engine
}

func NewChatHandler(engine *chatbot.Engine) *ChatHandler {
	return &ChatHandler{Engine: engine}
}

func (h *ChatHandler) Chat(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req models.ChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format request tidak valid"})
	}

	req.Message = strings.TrimSpace(req.Message)

	if req.Message == "" && req.ImageBase64 == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Pesan atau gambar wajib disertakan"})
	}
	if len(req.Message) > maxMessageLength {
		return c.Status(400).JSON(fiber.Map{"error": "Pesan terlalu panjang (maks 2000 karakter)"})
	}
	if len(req.ImageBase64) > maxImageBase64Size {
		return c.Status(400).JSON(fiber.Map{"error": "Ukuran gambar terlalu besar (maks ~3MB)"})
	}

	// Save user message
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if _, err := database.DB.ExecContext(ctx,
		"INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'user', ?)",
		userID, req.Message,
	); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan pesan"})
	}

	// Fetch recent predictions for contextual AI
	var recentPreds []models.Prediction
	rows, err := database.DB.QueryContext(ctx,
		`SELECT id, user_id, n, p, k, temperature, humidity, ph, rainfall, result, confidence, created_at
		 FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`, userID,
	)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var p models.Prediction
			if err := rows.Scan(&p.ID, &p.UserID, &p.N, &p.P, &p.K, &p.Temperature, &p.Humidity, &p.PH, &p.Rainfall, &p.Result, &p.Confidence, &p.CreatedAt); err == nil {
				recentPreds = append(recentPreds, p)
			}
		}
		_ = rows.Err()
	}

	response := h.Engine.GetResponse(c.Context(), req.Message, recentPreds, req.ImageBase64)

	// Save assistant response
	if _, err := database.DB.ExecContext(ctx,
		"INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'assistant', ?)",
		userID, response.Reply,
	); err != nil {
		// Log but don't fail — the user already has the response
	}

	return c.JSON(response)
}

func (h *ChatHandler) GetHistory(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	rows, err := database.DB.QueryContext(ctx,
		"SELECT id, user_id, role, content, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 100",
		userID,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil riwayat obrolan"})
	}
	defer rows.Close()

	messages := make([]models.ChatMessage, 0)
	for rows.Next() {
		var m models.ChatMessage
		if err := rows.Scan(&m.ID, &m.UserID, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			continue
		}
		messages = append(messages, m)
	}
	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membaca data obrolan"})
	}

	return c.JSON(messages)
}

func (h *ChatHandler) ClearHistory(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	res, err := database.DB.ExecContext(ctx, "DELETE FROM chat_messages WHERE user_id = ?", userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus riwayat obrolan"})
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memverifikasi penghapusan"})
	}

	return c.JSON(fiber.Map{
		"success":       true,
		"message":       "Riwayat obrolan berhasil dibersihkan",
		"deleted_count": affected,
	})
}
