import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'dataset', 'crop_recommendation.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'model.pkl')

def train():
    print(f"Loading data from {DATA_PATH}...")
    if not os.path.exists(DATA_PATH):
        print("Dataset not found!")
        return

    df = pd.read_csv(DATA_PATH)
    
    # Features and Target
    features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    target = 'label'
    
    X = df[features]
    y = df[target]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize Decision Tree
    clf = DecisionTreeClassifier(criterion='entropy', random_state=42)
    
    # Train
    print("Training model...")
    clf.fit(X_train, y_train)
    
    # Evaluate
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model
    print(f"Saving model to {MODEL_PATH}...")
    joblib.dump(clf, MODEL_PATH)
    print("Done!")

if __name__ == "__main__":
    train()
