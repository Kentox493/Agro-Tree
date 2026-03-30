package models

type Plant struct {
	Name        string   `json:"name"`
	NameID      string   `json:"name_id"`
	Description string   `json:"description"`
	Season      string   `json:"season"`
	IdealN      string   `json:"ideal_n"`
	IdealP      string   `json:"ideal_p"`
	IdealK      string   `json:"ideal_k"`
	IdealTemp   string   `json:"ideal_temp"`
	IdealHumid  string   `json:"ideal_humidity"`
	IdealPH     string   `json:"ideal_ph"`
	IdealRain   string   `json:"ideal_rainfall"`
	Tips        []string `json:"tips"`
	Emoji       string   `json:"emoji"`
}

type ChatMessage struct {
	ID        int64  `json:"id"`
	UserID    int64  `json:"user_id"`
	Role      string `json:"role"` // "user" or "assistant"
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

type ChatRequest struct {
	Message      string `json:"message"`
	PredictionID int64  `json:"prediction_id,omitempty"`
	ImageBase64  string `json:"image_base64,omitempty"`
}

type ChatResponse struct {
	Reply       string   `json:"reply"`
	Suggestions []string `json:"suggestions,omitempty"`
}
