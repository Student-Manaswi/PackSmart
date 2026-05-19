import torch
import torch.nn as nn
import torch.nn.functional as F
import cv2
import json
import os
import numpy as np
from torchvision import models, transforms

from config import (
    MATERIAL_MODEL_FILENAME,
    MATERIAL_MODEL_SOURCE,
    OBJECT_CATEGORY_PATH,
)
from modules.model_loader import ensure_local_model_file

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_model_material = None
_class_names = None

#Get Fragility
def get_fragility(materials_list):
    """
    Input: List of predicted material dicts
    Output: "Fragile" or "Non-Fragile"
    """

    fragile_materials = ["Glass", "Ceramic"]

    for material in materials_list:
        if material["name"] in fragile_materials:
            return "Fragile"

    return "Non-Fragile"

# Get Object Category

def get_object_category(object_name, json_path=None):
    """
    Input: object_name (string)
    Output: category (string)
    """

    try:
        if json_path is None:
            json_path = OBJECT_CATEGORY_PATH
        with open(json_path, "r") as f:
            data = json.load(f)

        mapping = data.get("class_category_mapping", {})

        for category, objects in mapping.items():
            if object_name in objects:
                return category

        return "Miscellaneous"

    except Exception as e:
        print("Error loading category JSON:", e)
        return "Miscellaneous"

# LOAD MODEL
def load_material_model():
    global _model_material, _class_names

    if _model_material is None:

        # Load class names
        _class_names = [ "Aluminum", "Brass", "Copper", "Iron", "Steel", "Ceramic", "Glass", "Paper", "Plastic", "Wood"]

        num_classes = len(_class_names)

        model = models.efficientnet_b4(weights=None)
        model.classifier[1] = nn.Linear(
            model.classifier[1].in_features,
            num_classes
        )

        model_path = ensure_local_model_file(
            MATERIAL_MODEL_SOURCE,
            MATERIAL_MODEL_FILENAME,
        )
        checkpoint = torch.load(model_path, map_location=device)

        state_dict = checkpoint.get("model_state_dict", checkpoint)

        # Remove 'module.' if exists
        cleaned_state_dict = {}
        for k, v in state_dict.items():
            if k.startswith("module."):
                k = k[7:]
            cleaned_state_dict[k] = v

        model.load_state_dict(cleaned_state_dict, strict=False)
        model.to(device)
        model.eval()

        _model_material = model

    return _model_material, _class_names

# IMAGE TRANSFORM
transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# MATERIAL PREDICTION FUNCTION
def predict_material(image_path, object_name):
    """
    Input: Cropped object image path
    Output: {
        "materials": [
            {"name": "Cardboard", "confidence": 72.3},
            {"name": "Plastic", "confidence": 27.1}
        ],
        object_category,
        fragility
    }
    """

    if _model_material is None:
        load_material_model()

    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Image not found")

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    input_tensor = transform(image_rgb).unsqueeze(0).to(device)

    with torch.no_grad():
        output = _model_material(input_tensor)
        probs = F.softmax(output, dim=1)

    probs = probs.cpu().numpy()[0]

    # Get indices of top 2 probabilities
    top_indices = np.argsort(probs)[::-1][:2]

    MATERIAL_CONFIDENCE_THRESHOLD = 90.0

    top_materials = []
    for idx in top_indices:
        top_materials.append({
            "name": _class_names[idx],
            "confidence": round(float(probs[idx] * 100), 2)
        })

    # If the top prediction is highly confident, drop the second
    if top_materials[0]["confidence"] >= MATERIAL_CONFIDENCE_THRESHOLD:
        top_materials = top_materials[:1]

     # 🔹 Fragility
    fragility = get_fragility(top_materials)

    # 🔹 Object Category
    object_category = get_object_category(object_name)

    return {
        "materials": top_materials,
        "fragility": fragility,
        "object_category": object_category
    }