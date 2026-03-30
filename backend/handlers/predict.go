package handlers

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"time"

	"prediksi-tanaman/database"
	"prediksi-tanaman/middleware"
	"prediksi-tanaman/ml"
	"prediksi-tanaman/models"

	"github.com/gofiber/fiber/v2"
)

type PredictHandler struct {
	PlantData map[string]models.Plant
}

func NewPredictHandler(plantData map[string]models.Plant) *PredictHandler {
	return &PredictHandler{PlantData: plantData}
}

func (h *PredictHandler) Predict(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req models.PredictRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format request tidak valid"})
	}

	// ── Full Input Validation ──
	if req.N < 0 || req.N > 200 {
		return c.Status(400).JSON(fiber.Map{"error": "Nilai N harus antara 0 dan 200"})
	}
	if req.P < 0 || req.P > 200 {
		return c.Status(400).JSON(fiber.Map{"error": "Nilai P harus antara 0 dan 200"})
	}
	if req.K < 0 || req.K > 200 {
		return c.Status(400).JSON(fiber.Map{"error": "Nilai K harus antara 0 dan 200"})
	}
	if req.Temperature < 5 || req.Temperature > 50 {
		return c.Status(400).JSON(fiber.Map{"error": "Suhu harus di rentang kehidupan tanaman (5°C - 50°C)"})
	}
	if req.Humidity < 10 || req.Humidity > 100 {
		return c.Status(400).JSON(fiber.Map{"error": "Kelembaban tidak realistis untuk pertanian (Minimal 10%)"})
	}
	if req.PH < 3.5 || req.PH > 10 {
		return c.Status(400).JSON(fiber.Map{"error": "Anomali terdeteksi: Angka pH (Keasaman) terlalu ekstrem untuk tanaman (Rentang ideal 3.5 - 10.0)"})
	}
	if req.Rainfall < 0 || req.Rainfall > 3000 {
		return c.Status(400).JSON(fiber.Map{"error": "Curah hujan harus antara 0mm dan 3000mm"})
	}

	// 🛡️ Filter Anomali Ekstrem (Contoh: User iseng input angka '1' di semua kotak)
	if req.N < 2 && req.P < 2 && req.K < 2 {
		return c.Status(400).JSON(fiber.Map{"error": "Anomali terdeteksi: Tanah benar-benar mati/kosong hara (NPK nyaris nol). Silakan berikan pupuk dasar terlebih dahulu."})
	}
	if req.Rainfall < 5 && req.Humidity < 15 {
		return c.Status(400).JSON(fiber.Map{"error": "Anomali terdeteksi: Kondisi lahan selevel gurun mati ekstrim. Tidak ada tanaman di model kami yang bisa hidup di sini."})
	}

	features := []float64{req.N, req.P, req.K, req.Temperature, req.Humidity, req.PH, req.Rainfall}

	activeModel := ml.GetActiveModel()
	if activeModel == nil {
		return c.Status(503).JSON(fiber.Map{"error": "Model ML belum siap atau sedang dimuat ulang, silakan coba sesaat lagi"})
	}
	result, proba := activeModel.PredictWithProba(features)
	confidence := proba[result]

	type kv struct {
		Key   string
		Value float64
	}
	var sorted []kv
	for k, v := range proba {
		if v > 0 {
			sorted = append(sorted, kv{k, v})
		}
	}
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Value > sorted[j].Value })

	topCrops := make([]models.CropProbability, 0, 5)
	for i, s := range sorted {
		if i >= 5 {
			break
		}
		topCrops = append(topCrops, models.CropProbability{Crop: s.Key, Probability: s.Value})
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	res, err := database.DB.ExecContext(ctx,
		`INSERT INTO predictions (user_id, n, p, k, temperature, humidity, ph, rainfall, result, confidence)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		userID, req.N, req.P, req.K, req.Temperature, req.Humidity, req.PH, req.Rainfall, result, confidence,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan prediksi"})
	}

	predID, err := res.LastInsertId()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mendapatkan ID prediksi"})
	}

	prediction := &models.Prediction{
		ID: predID, UserID: userID,
		N: req.N, P: req.P, K: req.K,
		Temperature: req.Temperature, Humidity: req.Humidity,
		PH: req.PH, Rainfall: req.Rainfall,
		Result: result, Confidence: confidence, CreatedAt: time.Now(),
	}

	plantInfo := make(map[string]string)
	if plant, ok := h.PlantData[result]; ok {
		plantInfo["name"] = plant.Name
		plantInfo["name_id"] = plant.NameID
		plantInfo["description"] = plant.Description
		plantInfo["emoji"] = plant.Emoji
		plantInfo["season"] = plant.Season
	}

	return c.JSON(models.PredictResponse{
		Prediction: prediction, PlantInfo: plantInfo, TopCrops: topCrops,
	})
}

func (h *PredictHandler) GetHistory(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	rows, err := database.DB.QueryContext(ctx,
		`SELECT id, user_id, n, p, k, temperature, humidity, ph, rainfall, result, confidence, created_at
		 FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`, userID,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil riwayat prediksi"})
	}
	defer rows.Close()

	predictions := make([]models.Prediction, 0)
	for rows.Next() {
		var p models.Prediction
		if err := rows.Scan(&p.ID, &p.UserID, &p.N, &p.P, &p.K, &p.Temperature, &p.Humidity, &p.PH, &p.Rainfall, &p.Result, &p.Confidence, &p.CreatedAt); err != nil {
			continue
		}
		predictions = append(predictions, p)
	}
	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membaca data prediksi"})
	}

	return c.JSON(predictions)
}

func (h *PredictHandler) GetStats(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	var total int
	if err := database.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM predictions WHERE user_id = ?", userID).Scan(&total); err != nil {
		total = 0
	}

	var mostPredicted string
	if err := database.DB.QueryRowContext(ctx,
		"SELECT result FROM predictions WHERE user_id = ? GROUP BY result ORDER BY COUNT(*) DESC LIMIT 1", userID,
	).Scan(&mostPredicted); err != nil {
		mostPredicted = ""
	}

	rows, err := database.DB.QueryContext(ctx,
		"SELECT result, COUNT(*) FROM predictions WHERE user_id = ? GROUP BY result ORDER BY COUNT(*) DESC", userID,
	)
	distribution := make(map[string]int)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			var count int
			if err := rows.Scan(&name, &count); err == nil {
				distribution[name] = count
			}
		}
		_ = rows.Err()
	}

	recentRows, err := database.DB.QueryContext(ctx,
		`SELECT id, user_id, n, p, k, temperature, humidity, ph, rainfall, result, confidence, created_at
		 FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`, userID,
	)
	recent := make([]models.Prediction, 0, 5)
	if err == nil {
		defer recentRows.Close()
		for recentRows.Next() {
			var p models.Prediction
			if err := recentRows.Scan(&p.ID, &p.UserID, &p.N, &p.P, &p.K, &p.Temperature, &p.Humidity, &p.PH, &p.Rainfall, &p.Result, &p.Confidence, &p.CreatedAt); err == nil {
				recent = append(recent, p)
			}
		}
		_ = recentRows.Err()
	}

	var uniqueCrops int
	if err := database.DB.QueryRowContext(ctx, "SELECT COUNT(DISTINCT result) FROM predictions WHERE user_id = ?", userID).Scan(&uniqueCrops); err != nil {
		uniqueCrops = 0
	}

	var avgConfidence float64
	if err := database.DB.QueryRowContext(ctx, "SELECT COALESCE(AVG(confidence), 0) FROM predictions WHERE user_id = ?", userID).Scan(&avgConfidence); err != nil {
		avgConfidence = 0
	}

	return c.JSON(models.PredictionStats{
		TotalPredictions: total, MostPredicted: mostPredicted,
		Distribution: distribution, RecentPredictions: recent,
		UniqueCrops: uniqueCrops, AvgConfidence: avgConfidence,
	})
}

func (h *PredictHandler) DeletePrediction(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	predIDStr := c.Params("id")

	// Validate that ID is a positive integer
	predID, err := strconv.ParseInt(predIDStr, 10, 64)
	if err != nil || predID <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "ID prediksi tidak valid"})
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	res, err := database.DB.ExecContext(ctx, "DELETE FROM predictions WHERE id = ? AND user_id = ?", predID, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus prediksi"})
	}

	affected, err := res.RowsAffected()
	if err != nil || affected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": fmt.Sprintf("Prediksi dengan ID %d tidak ditemukan", predID)})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Prediksi berhasil dihapus"})
}
