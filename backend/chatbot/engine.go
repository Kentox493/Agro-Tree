package chatbot

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"prediksi-tanaman/models"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type Engine struct {
	PlantData map[string]models.Plant
	apiKey    string
}

func NewEngine(plantData map[string]models.Plant, apiKey string) *Engine {
	return &Engine{
		PlantData: plantData,
		apiKey:    apiKey,
	}
}

func (e *Engine) GetResponse(ctx context.Context, message string, recentPredictions []models.Prediction, imageBase64 string) models.ChatResponse {
	client, err := genai.NewClient(ctx, option.WithAPIKey(e.apiKey))
	if err != nil {
		log.Printf("Failed to create generative AI client: %v", err)
		return e.fallbackResponse()
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-3-flash-preview")
	model.ResponseMIMEType = "application/json"

	systemInstruction := "Anda adalah Asisten Virtual AgroTree, seorang ahli pertanian cerdas di Indonesia. " +
		"PERHATIAN: Anda HANYA diizinkan untuk menjawab pertanyaan seputar pertanian, tanaman, tanah, cuaca agro, dan pupuk. " +
		"Jika pengguna bertanya di luar topik tersebut (misal: coding, resep masakan, politik, umum), tolak dengan sopan dan arahkan kembali ke pertanian. " +
		"Berikan jawaban yang ringkas, padat, dan jelas untuk efisiensi token (Maksimal 250 kata). " +
		"Jawab WAJIB menggunakan format JSON persis seperti ini: `{\"reply\": \"Jawaban Markdown Anda...\", \"suggestions\": [\"Saran 1\", \"Saran 2\"]}`. " +
		"Gunakan Markdown di dalam field reply untuk formatting (bold, list, emoji). Maksimal berikan 3 short suggestions."

	prompt := fmt.Sprintf("INSTRUKSI SISTEM: %s\n\n", systemInstruction)

	if len(recentPredictions) > 0 {
		prompt += "KONTEKS RIWAYAT PREDIKSI PENGGUNA TERBARU (Maksimal 5):\n"
		for i, pred := range recentPredictions {
			plantName := pred.Result
			if plant, exists := e.PlantData[plantName]; exists {
				plantName = plant.Name
			}
			prompt += fmt.Sprintf("%d. Tgl: %s | Rekomendasi ML: %s (%.0f%%) | Kondisi: N=%.0f, P=%.0f, K=%.0f, Suhu=%.1f°C, pH=%.1f, Hujan=%.0fmm\n",
				i+1, pred.CreatedAt.Format("02-Jan"), plantName, pred.Confidence*100, pred.N, pred.P, pred.K,
				pred.Temperature, pred.PH, pred.Rainfall)
		}
		prompt += "\nGunakan konteks riwayat di atas HANYA JIKA relevan dengan pertanyaan.\n\n"
	}

	prompt += fmt.Sprintf("PESAN PENGGUNA TERBARU: %s", message)

	var parts []genai.Part

	if imageBase64 != "" {
		format := "jpeg"
		b64Data := imageBase64
		if strings.HasPrefix(imageBase64, "data:image/") {
			spl := strings.SplitN(imageBase64, ";base64,", 2)
			if len(spl) == 2 {
				// spl[0] is like "data:image/jpeg" or "data:image/webp"
				format = strings.TrimPrefix(spl[0], "data:image/")
				b64Data = spl[1]
			}
		}

		imgData, err := base64.StdEncoding.DecodeString(b64Data)
		if err == nil {
			parts = append(parts, genai.ImageData(format, imgData))
		} else {
			log.Printf("Failed to decode base64 image: %v", err)
		}
	}

	parts = append(parts, genai.Text(prompt))

	res, err := model.GenerateContent(ctx, parts...)
	if err != nil {
		log.Printf("GenerateContent error: %v", err)
		return e.fallbackResponse()
	}

	if len(res.Candidates) > 0 && len(res.Candidates[0].Content.Parts) > 0 {
		if text, ok := res.Candidates[0].Content.Parts[0].(genai.Text); ok {
			var chatRes models.ChatResponse
			// Parse the LLM JSON
			if err := json.Unmarshal([]byte(text), &chatRes); err == nil {
				return chatRes
			} else {
				log.Printf("JSON Unmarshal error: %v, raw text: %s", err, string(text))
			}
		}
	}

	return e.fallbackResponse()
}

func (e *Engine) fallbackResponse() models.ChatResponse {
	return models.ChatResponse{
		Reply: "Maaf, sistem AI cerdas kami sedang mengalami gangguan/limitasi. Namun saya tetap merekomendasikan Anda untuk:\n\n" +
			"1. **Melihat Rekomendasi** — gunakan halaman Prediksi untuk analisis\n" +
			"2. **Eksplorasi Tanaman** — cek Ensiklopedia untuk detailnya\n",
		Suggestions: []string{"Coba Prediksi Baru", "Buka Ensiklopedia"},
	}
}
