# api/reports/classifier.py
import torch
import pandas as pd
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from huggingface_hub import hf_hub_download

repo_id = "DataScienceWFSR/modernbert-food-hazard-base"

# Load the label encoder
lb_path = hf_hub_download(repo_id=repo_id, filename="labelencoder_hazard.pkl")
lb = pd.read_pickle(lb_path)

# Load the tokenizer and model
tokenizer = AutoTokenizer.from_pretrained(repo_id)
model = AutoModelForSequenceClassification.from_pretrained(repo_id)
model.eval()

# Map hazard categories to severity levels
def map_hazard_to_severity(hazard_label):
    label = hazard_label.lower()
    if "microbiological" in label or "allergen" in label:
        return "high"
    elif "chemical" in label:
        return "medium"
    else:
        return "low"

def classify_severity(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
    logits = outputs.logits
    predicted_class_id = logits.argmax().item()
    hazard_label = lb.inverse_transform([predicted_class_id])[0]
    return map_hazard_to_severity(hazard_label)
