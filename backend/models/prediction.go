package models

import "time"

type Prediction struct {
	ID          int64     `json:"id"`
	UserID      int64     `json:"user_id"`
	N           float64   `json:"n"`
	P           float64   `json:"p"`
	K           float64   `json:"k"`
	Temperature float64   `json:"temperature"`
	Humidity    float64   `json:"humidity"`
	PH          float64   `json:"ph"`
	Rainfall    float64   `json:"rainfall"`
	Result      string    `json:"result"`
	Confidence  float64   `json:"confidence"`
	CreatedAt   time.Time `json:"created_at"`
}

type PredictRequest struct {
	N           float64 `json:"n"`
	P           float64 `json:"p"`
	K           float64 `json:"k"`
	Temperature float64 `json:"temperature"`
	Humidity    float64 `json:"humidity"`
	PH          float64 `json:"ph"`
	Rainfall    float64 `json:"rainfall"`
}

type PredictResponse struct {
	Prediction *Prediction       `json:"prediction"`
	PlantInfo  map[string]string `json:"plant_info"`
	TopCrops   []CropProbability `json:"top_crops"`
}

type CropProbability struct {
	Crop        string  `json:"crop"`
	Probability float64 `json:"probability"`
}

type PredictionStats struct {
	TotalPredictions  int            `json:"total_predictions"`
	MostPredicted     string         `json:"most_predicted"`
	Distribution      map[string]int `json:"distribution"`
	RecentPredictions []Prediction   `json:"recent_predictions"`
	UniqueCrops       int            `json:"unique_crops"`
	AvgConfidence     float64        `json:"avg_confidence"`
}
