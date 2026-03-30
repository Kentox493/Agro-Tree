package ml

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"sort"
)

// Node represents a node in the decision tree
type Node struct {
	FeatureIndex int            `json:"feature_index,omitempty"`
	Threshold    float64        `json:"threshold,omitempty"`
	Left         *Node          `json:"left,omitempty"`
	Right        *Node          `json:"right,omitempty"`
	IsLeaf       bool           `json:"is_leaf"`
	Class        string         `json:"class,omitempty"`
	Samples      int            `json:"samples"`
	ClassCounts  map[string]int `json:"class_counts,omitempty"`
}

// DecisionTree is the classifier
type DecisionTree struct {
	Root         *Node                `json:"root"`
	FeatureNames []string             `json:"feature_names"`
	Classes      []string             `json:"classes"`
	MaxDepth     int                  `json:"max_depth"`
	MinSamples   int                  `json:"min_samples_split"`
	Centroids    map[string][]float64 `json:"centroids,omitempty"`
}

// NewDecisionTree creates a new decision tree classifier
func NewDecisionTree(maxDepth, minSamples int) *DecisionTree {
	if maxDepth <= 0 {
		maxDepth = 100 // effectively unlimited
	}
	if minSamples <= 0 {
		minSamples = 2
	}
	return &DecisionTree{
		MaxDepth:   maxDepth,
		MinSamples: minSamples,
	}
}

// Fit trains the decision tree on the given data
func (dt *DecisionTree) Fit(X [][]float64, y []string, featureNames []string) {
	dt.FeatureNames = featureNames

	// Collect unique classes and compute centroids for fallback ranking
	classSet := make(map[string]bool)
	dt.Centroids = make(map[string][]float64)
	classCounts := make(map[string]int)

	for i, label := range y {
		classSet[label] = true
		if dt.Centroids[label] == nil {
			dt.Centroids[label] = make([]float64, len(X[0]))
		}
		for j, val := range X[i] {
			dt.Centroids[label][j] += val
		}
		classCounts[label]++
	}

	for class := range classSet {
		dt.Classes = append(dt.Classes, class)
		for j := range dt.Centroids[class] {
			dt.Centroids[class][j] /= float64(classCounts[class])
		}
	}
	sort.Strings(dt.Classes)

	dt.Root = dt.buildTree(X, y, 0)
}

// Predict predicts the class for a single sample
func (dt *DecisionTree) Predict(features []float64) string {
	return dt.traverse(dt.Root, features)
}

// PredictWithProba predicts class and returns probability distribution
func (dt *DecisionTree) PredictWithProba(features []float64) (string, map[string]float64) {
	node := dt.findLeaf(dt.Root, features)
	proba := make(map[string]float64)
	total := float64(node.Samples)

	// Base decision tree probabilities
	for class, count := range node.ClassCounts {
		proba[class] = float64(count) / total
	}

	// For highly pure leaves (1 class), generate synthetic fallback probabilities
	// using distance to centroids. This ensures we can rank the top 5 crops realistically.
	for _, class := range dt.Classes {
		if proba[class] == 0 && dt.Centroids != nil && len(dt.Centroids[class]) == len(features) {
			centroid := dt.Centroids[class]
			dist := 0.0
			for i, val := range features {
				// Simple euclidean distance sum squared (unscaled, but sufficient for ranking)
				diff := val - centroid[i]
				dist += diff * diff
			}
			// Assign a very small probability based on inverse distance so it ranks naturally
			// 0.0001 guarantees it never overrides the primary decision tree logic.
			proba[class] = 0.0001 / (1.0 + math.Sqrt(dist))
		}
	}

	return node.Class, proba
}

// PredictBatch predicts classes for multiple samples
func (dt *DecisionTree) PredictBatch(X [][]float64) []string {
	predictions := make([]string, len(X))
	for i, x := range X {
		predictions[i] = dt.Predict(x)
	}
	return predictions
}

// SaveModel saves the trained model to a JSON file
func (dt *DecisionTree) SaveModel(path string) error {
	data, err := json.MarshalIndent(dt, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal model: %w", err)
	}
	return os.WriteFile(path, data, 0644)
}

// LoadModel loads a trained model from a JSON file
func LoadModel(path string) (*DecisionTree, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read model file: %w", err)
	}
	var dt DecisionTree
	if err := json.Unmarshal(data, &dt); err != nil {
		return nil, fmt.Errorf("failed to unmarshal model: %w", err)
	}
	return &dt, nil
}

// traverse walks the tree to find the predicted class
func (dt *DecisionTree) traverse(node *Node, features []float64) string {
	if node.IsLeaf {
		return node.Class
	}
	if features[node.FeatureIndex] <= node.Threshold {
		return dt.traverse(node.Left, features)
	}
	return dt.traverse(node.Right, features)
}

// findLeaf returns the leaf node for a sample
func (dt *DecisionTree) findLeaf(node *Node, features []float64) *Node {
	if node.IsLeaf {
		return node
	}
	if features[node.FeatureIndex] <= node.Threshold {
		return dt.findLeaf(node.Left, features)
	}
	return dt.findLeaf(node.Right, features)
}

// buildTree recursively builds the decision tree
func (dt *DecisionTree) buildTree(X [][]float64, y []string, depth int) *Node {
	classCounts := countClasses(y)
	majorityClass := majorityVote(classCounts)

	// Stopping conditions
	if len(uniqueLabels(y)) == 1 || depth >= dt.MaxDepth || len(y) < dt.MinSamples {
		return &Node{
			IsLeaf:      true,
			Class:       majorityClass,
			Samples:     len(y),
			ClassCounts: classCounts,
		}
	}

	bestFeature, bestThreshold, bestGain := dt.findBestSplit(X, y)

	if bestGain <= 0 {
		return &Node{
			IsLeaf:      true,
			Class:       majorityClass,
			Samples:     len(y),
			ClassCounts: classCounts,
		}
	}

	leftX, leftY, rightX, rightY := splitData(X, y, bestFeature, bestThreshold)

	if len(leftY) == 0 || len(rightY) == 0 {
		return &Node{
			IsLeaf:      true,
			Class:       majorityClass,
			Samples:     len(y),
			ClassCounts: classCounts,
		}
	}

	return &Node{
		FeatureIndex: bestFeature,
		Threshold:    bestThreshold,
		Left:         dt.buildTree(leftX, leftY, depth+1),
		Right:        dt.buildTree(rightX, rightY, depth+1),
		IsLeaf:       false,
		Samples:      len(y),
		ClassCounts:  classCounts,
	}
}

// findBestSplit finds the best feature and threshold to split on using entropy
func (dt *DecisionTree) findBestSplit(X [][]float64, y []string) (int, float64, float64) {
	bestFeature := -1
	bestThreshold := 0.0
	bestGain := -1.0

	parentEntropy := entropy(y)
	nFeatures := len(X[0])

	for feature := 0; feature < nFeatures; feature++ {
		// Get unique thresholds (midpoints between sorted unique values)
		thresholds := uniqueThresholds(X, feature)

		for _, threshold := range thresholds {
			_, leftY, _, rightY := splitData(X, y, feature, threshold)

			if len(leftY) == 0 || len(rightY) == 0 {
				continue
			}

			// Information gain
			n := float64(len(y))
			gain := parentEntropy -
				(float64(len(leftY))/n)*entropy(leftY) -
				(float64(len(rightY))/n)*entropy(rightY)

			if gain > bestGain {
				bestGain = gain
				bestFeature = feature
				bestThreshold = threshold
			}
		}
	}

	return bestFeature, bestThreshold, bestGain
}

// entropy calculates the entropy of a label set
func entropy(labels []string) float64 {
	counts := countClasses(labels)
	n := float64(len(labels))
	ent := 0.0
	for _, count := range counts {
		p := float64(count) / n
		if p > 0 {
			ent -= p * math.Log2(p)
		}
	}
	return ent
}

// uniqueThresholds returns sorted unique midpoint thresholds for a feature
func uniqueThresholds(X [][]float64, feature int) []float64 {
	vals := make([]float64, len(X))
	for i, x := range X {
		vals[i] = x[feature]
	}
	sort.Float64s(vals)

	var thresholds []float64
	for i := 1; i < len(vals); i++ {
		if vals[i] != vals[i-1] {
			thresholds = append(thresholds, (vals[i]+vals[i-1])/2)
		}
	}
	return thresholds
}

// splitData splits the data based on feature and threshold
func splitData(X [][]float64, y []string, feature int, threshold float64) (
	leftX [][]float64, leftY []string, rightX [][]float64, rightY []string,
) {
	for i, x := range X {
		if x[feature] <= threshold {
			leftX = append(leftX, x)
			leftY = append(leftY, y[i])
		} else {
			rightX = append(rightX, x)
			rightY = append(rightY, y[i])
		}
	}
	return
}

// countClasses counts occurrences of each class
func countClasses(labels []string) map[string]int {
	counts := make(map[string]int)
	for _, label := range labels {
		counts[label]++
	}
	return counts
}

// majorityVote returns the most common class
func majorityVote(counts map[string]int) string {
	best := ""
	bestCount := 0
	for class, count := range counts {
		if count > bestCount || (count == bestCount && class < best) {
			best = class
			bestCount = count
		}
	}
	return best
}

// uniqueLabels returns unique labels from a slice
func uniqueLabels(labels []string) []string {
	set := make(map[string]bool)
	for _, l := range labels {
		set[l] = true
	}
	result := make([]string, 0, len(set))
	for l := range set {
		result = append(result, l)
	}
	return result
}

// AccuracyScore calculates the accuracy between predicted and actual labels
func AccuracyScore(yTrue, yPred []string) float64 {
	correct := 0
	for i := range yTrue {
		if yTrue[i] == yPred[i] {
			correct++
		}
	}
	return float64(correct) / float64(len(yTrue))
}

// ClassificationReport generates a text report of precision, recall, f1 per class
func ClassificationReport(yTrue, yPred []string) string {
	classes := uniqueLabels(yTrue)
	sort.Strings(classes)

	report := fmt.Sprintf("%-20s %10s %10s %10s %10s\n", "", "precision", "recall", "f1-score", "support")
	report += fmt.Sprintf("%s\n", "------------------------------------------------------------")

	for _, class := range classes {
		tp, fp, fn := 0, 0, 0
		for i := range yTrue {
			if yTrue[i] == class && yPred[i] == class {
				tp++
			} else if yTrue[i] != class && yPred[i] == class {
				fp++
			} else if yTrue[i] == class && yPred[i] != class {
				fn++
			}
		}

		precision := 0.0
		if tp+fp > 0 {
			precision = float64(tp) / float64(tp+fp)
		}
		recall := 0.0
		if tp+fn > 0 {
			recall = float64(tp) / float64(tp+fn)
		}
		f1 := 0.0
		if precision+recall > 0 {
			f1 = 2 * precision * recall / (precision + recall)
		}
		support := tp + fn

		report += fmt.Sprintf("%-20s %10.2f %10.2f %10.2f %10d\n", class, precision, recall, f1, support)
	}

	return report
}
