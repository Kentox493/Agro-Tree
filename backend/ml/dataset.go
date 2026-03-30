package ml

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
)

// Dataset represents a loaded dataset with features and labels
type Dataset struct {
	Features     [][]float64
	Labels       []string
	FeatureNames []string
	UniqueLabels []string
}

// LoadCSV loads a CSV dataset from the given path
func LoadCSV(path string) (*Dataset, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open CSV: %w", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV: %w", err)
	}

	if len(records) < 2 {
		return nil, fmt.Errorf("CSV must have header + at least 1 data row")
	}

	header := records[0]
	featureNames := header[:len(header)-1]

	var features [][]float64
	var labels []string
	labelSet := make(map[string]bool)

	for i, row := range records[1:] {
		if len(row) != len(header) {
			return nil, fmt.Errorf("row %d has %d columns, expected %d", i+1, len(row), len(header))
		}

		featureRow := make([]float64, len(row)-1)
		for j := 0; j < len(row)-1; j++ {
			val, err := strconv.ParseFloat(row[j], 64)
			if err != nil {
				return nil, fmt.Errorf("row %d col %d: cannot parse '%s' as float: %w", i+1, j, row[j], err)
			}
			featureRow[j] = val
		}

		label := row[len(row)-1]
		features = append(features, featureRow)
		labels = append(labels, label)
		labelSet[label] = true
	}

	var uniqueLabels []string
	for label := range labelSet {
		uniqueLabels = append(uniqueLabels, label)
	}

	return &Dataset{
		Features:     features,
		Labels:       labels,
		FeatureNames: featureNames,
		UniqueLabels: uniqueLabels,
	}, nil
}

// TrainTestSplit splits the dataset into training and testing sets
func TrainTestSplit(features [][]float64, labels []string, testSize float64, seed int64) (
	xTrain, xTest [][]float64, yTrain, yTest []string,
) {
	n := len(features)
	indices := make([]int, n)
	for i := range indices {
		indices[i] = i
	}

	// Simple seeded shuffle (Fisher-Yates)
	// Using a basic LCG for reproducibility matching seed=42
	rng := newLCG(seed)
	for i := n - 1; i > 0; i-- {
		j := rng.Intn(i + 1)
		indices[i], indices[j] = indices[j], indices[i]
	}

	splitIdx := int(float64(n) * (1 - testSize))

	for _, idx := range indices[:splitIdx] {
		xTrain = append(xTrain, features[idx])
		yTrain = append(yTrain, labels[idx])
	}
	for _, idx := range indices[splitIdx:] {
		xTest = append(xTest, features[idx])
		yTest = append(yTest, labels[idx])
	}

	return
}

// TrainValTestSplit splits the dataset into training, validation, and testing sets
func TrainValTestSplit(features [][]float64, labels []string, valSize, testSize float64, seed int64) (
	xTrain, xVal, xTest [][]float64, yTrain, yVal, yTest []string,
) {
	n := len(features)
	indices := make([]int, n)
	for i := range indices {
		indices[i] = i
	}

	rng := newLCG(seed)
	for i := n - 1; i > 0; i-- {
		j := rng.Intn(i + 1)
		indices[i], indices[j] = indices[j], indices[i]
	}

	valSplitIdx := int(float64(n) * (1 - testSize - valSize))
	testSplitIdx := int(float64(n) * (1 - testSize))

	for _, idx := range indices[:valSplitIdx] {
		xTrain = append(xTrain, features[idx])
		yTrain = append(yTrain, labels[idx])
	}
	for _, idx := range indices[valSplitIdx:testSplitIdx] {
		xVal = append(xVal, features[idx])
		yVal = append(yVal, labels[idx])
	}
	for _, idx := range indices[testSplitIdx:] {
		xTest = append(xTest, features[idx])
		yTest = append(yTest, labels[idx])
	}

	return
}

// Simple LCG random number generator for reproducibility
type lcg struct {
	state uint64
}

func newLCG(seed int64) *lcg {
	return &lcg{state: uint64(seed)}
}

func (r *lcg) Intn(n int) int {
	r.state = r.state*6364136223846793005 + 1442695040888963407
	return int((r.state >> 33) % uint64(n))
}
