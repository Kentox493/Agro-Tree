package ml

import "fmt"

// KFoldCrossValidation evaluates a decision tree model by splitting the data into K folds,
// training on K-1 folds, and testing on the remaining fold. It returns the average accuracy.
func KFoldCrossValidation(features [][]float64, labels []string, featureNames []string, k int, maxDepth int, minSamples int, seed int64) float64 {
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

	foldSize := n / k
	totalAccuracy := 0.0

	for i := 0; i < k; i++ {
		startIdx := i * foldSize
		endIdx := (i + 1) * foldSize
		if i == k-1 {
			endIdx = n
		}

		var xTrain, xTest [][]float64
		var yTrain, yTest []string

		for j, idx := range indices {
			if j >= startIdx && j < endIdx {
				xTest = append(xTest, features[idx])
				yTest = append(yTest, labels[idx])
			} else {
				xTrain = append(xTrain, features[idx])
				yTrain = append(yTrain, labels[idx])
			}
		}

		tree := NewDecisionTree(maxDepth, minSamples)
		tree.Fit(xTrain, yTrain, featureNames)
		yPred := tree.PredictBatch(xTest)
		acc := AccuracyScore(yTest, yPred)
		totalAccuracy += acc
		fmt.Printf("Fold %d: %.2f%%\n", i+1, acc*100)
	}

	return totalAccuracy / float64(k)
}
