package ml

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type ModelMetadata struct {
	Version    string    `json:"version"`
	Timestamp  time.Time `json:"timestamp"`
	ModelPath  string    `json:"model_path"`
	MaxDepth   int       `json:"max_depth"`
	MinSamples int       `json:"min_samples"`
	TrainAcc   float64   `json:"train_acc"`
	ValAcc     float64   `json:"val_acc"`
	TestAcc    float64   `json:"test_acc"`
	CVAccuracy float64   `json:"cv_acc"`
}

type Registry struct {
	ActiveVersion string          `json:"active_version"`
	History       []ModelMetadata `json:"history"`
}

var (
	activeModel *DecisionTree
	modelMutex  sync.RWMutex
	lastModTime time.Time
)

// InitHotReload starts watching the registry.json file for new model deployments
func InitHotReload(registryPath string) error {
	// 1. Ensure registry directory exists
	if err := os.MkdirAll(filepath.Dir(registryPath), 0755); err != nil {
		return fmt.Errorf("failed to create registry dir: %w", err)
	}

	// 2. Load the initial model
	if err := loadActiveModel(registryPath); err != nil {
		log.Printf("⚠️ Registry empty or invalid. Wait for training to complete. (%v)", err)
		return err
	} else {
		log.Println("✅ Initial active model loaded successfully into memory.")
	}

	// 3. Start watcher goroutine for Zero-Downtime Hot Reloads
	go func() {
		for {
			time.Sleep(3 * time.Second)
			stat, err := os.Stat(registryPath)
			if err != nil {
				continue
			}
			if stat.ModTime().After(lastModTime) {
				log.Println("🔄 Detected new model deployment in registry.json! Hot reloading...")
				if err := loadActiveModel(registryPath); err != nil {
					log.Printf("❌ Hot reload failed: %v", err)
				} else {
					log.Println("✅ Hot reload successful! New production model is now answering predicting requests.")
				}
			}
		}
	}()

	return nil
}

func loadActiveModel(registryPath string) error {
	stat, err := os.Stat(registryPath)
	if err != nil {
		return err
	}

	// Record modified time BEFORE reading to prevent race conditions with watcher
	currentModTime := stat.ModTime()

	data, err := os.ReadFile(registryPath)
	if err != nil {
		return err
	}
	var reg Registry
	if err := json.Unmarshal(data, &reg); err != nil {
		return err
	}

	for _, meta := range reg.History {
		if meta.Version == reg.ActiveVersion {
			newModel, err := LoadModel(meta.ModelPath)
			if err != nil {
				return err
			}
			modelMutex.Lock()
			activeModel = newModel
			lastModTime = currentModTime
			modelMutex.Unlock()
			return nil
		}
	}
	return fmt.Errorf("active version %s not found in registry history", reg.ActiveVersion)
}

// GetActiveModel returns the latest loaded decision tree thread-safely
func GetActiveModel() *DecisionTree {
	modelMutex.RLock()
	defer modelMutex.RUnlock()
	return activeModel
}

// UpdateRegistry appends new metadata and switches the active version
func UpdateRegistry(registryPath string, meta ModelMetadata) error {
	var reg Registry
	data, err := os.ReadFile(registryPath)
	if err == nil {
		json.Unmarshal(data, &reg)
	}

	reg.ActiveVersion = meta.Version
	reg.History = append(reg.History, meta)

	// Keep only last 10 versions to save disk space
	if len(reg.History) > 10 {
		reg.History = reg.History[len(reg.History)-10:]
	}

	out, err := json.MarshalIndent(reg, "", "  ")
	if err != nil {
		return err
	}

	// Create models directory if it doesn't exist
	os.MkdirAll(filepath.Dir(registryPath), 0755)

	return os.WriteFile(registryPath, out, 0644)
}
