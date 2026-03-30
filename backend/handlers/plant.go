package handlers

import (
	"strings"

	"prediksi-tanaman/models"

	"github.com/gofiber/fiber/v2"
)

type PlantHandler struct {
	PlantData map[string]models.Plant
	etag      string
}

func NewPlantHandler(plantData map[string]models.Plant, etag string) *PlantHandler {
	return &PlantHandler{PlantData: plantData, etag: etag}
}

func (h *PlantHandler) ListPlants(c *fiber.Ctx) error {
	// ETag-based caching — if client has the same version, return 304
	if match := c.Get("If-None-Match"); match == h.etag {
		return c.SendStatus(fiber.StatusNotModified)
	}

	plants := make([]models.Plant, 0, len(h.PlantData))
	for _, p := range h.PlantData {
		plants = append(plants, p)
	}

	c.Set("ETag", h.etag)
	c.Set("Cache-Control", "public, max-age=3600")
	return c.JSON(plants)
}

func (h *PlantHandler) GetPlant(c *fiber.Ctx) error {
	name := strings.ToLower(strings.TrimSpace(c.Params("name")))

	if plant, ok := h.PlantData[name]; ok {
		return c.JSON(plant)
	}

	for _, plant := range h.PlantData {
		if strings.EqualFold(plant.NameID, name) {
			return c.JSON(plant)
		}
	}

	return c.Status(404).JSON(fiber.Map{"error": "Tanaman tidak ditemukan"})
}
