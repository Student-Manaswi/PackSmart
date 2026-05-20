import os
import io
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np
import torch
import torchvision.transforms as T
import timm
from ultralytics import YOLO

from model_loader_hf import ensure_hf_file

app = FastAPI(title="PackSmart - HF Space Analyzer")

# Environment-driven model identifiers (set these in Spaces secrets or env)
YOLO_REPO = os.environ.get("YOLO_HF_REPO")
YOLO_FILENAME = os.environ.get("YOLO_HF_FILENAME", "best.pt")
EFF_REPO = os.environ.get("EFF_HF_REPO")
EFF_FILENAME = os.environ.get("EFF_HF_FILENAME", "efficientnet_b4.pth")
CLASSES_REPO = os.environ.get("CLASSES_HF_REPO")
CLASSES_FILENAME = os.environ.get("CLASSES_HF_FILENAME", "classes.txt")

# Globals for lazy-loaded models
_yolo: YOLO = None
_eff: torch.nn.Module = None
_class_names: List[str] = []


def load_yolo():
    global _yolo
    if _yolo is not None:
        return _yolo
    if not YOLO_REPO:
        raise RuntimeError("YOLO_HF_REPO must be set in env")
    weights_path = ensure_hf_file(YOLO_REPO, YOLO_FILENAME)
    _yolo = YOLO(str(weights_path))
    return _yolo


def load_eff():
    global _eff
    if _eff is not None:
        return _eff
    if not EFF_REPO:
        raise RuntimeError("EFF_HF_REPO must be set in env")
    ckpt = ensure_hf_file(EFF_REPO, EFF_FILENAME)
    # Create architecture and load weights
    model = timm.create_model("efficientnet_b4", pretrained=False)
    state = torch.load(str(ckpt), map_location="cpu")
    # Support state dict or full model dict
    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]
    model.load_state_dict(state, strict=False)
    model.eval()
    _eff = model
    return _eff


def load_classes():
    global _class_names
    if _class_names:
        return _class_names
    if not CLASSES_REPO:
        return []
    path = ensure_hf_file(CLASSES_REPO, CLASSES_FILENAME)
    with open(path, "r", encoding="utf-8") as f:
        _class_names = [l.strip() for l in f.read().splitlines() if l.strip()]
    return _class_names


def pil_to_tensor(img: Image.Image):
    transform = T.Compose([
        T.Resize((380, 380)),
        T.ToTensor(),
        T.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ])
    return transform(img).unsqueeze(0)


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    """Run object detection (YOLO) and material classification (EfficientNet).

    Expects form `file` with an image.
    """
    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    yolo = load_yolo()
    eff = load_eff()
    class_names = load_classes()

    # Run detection
    results = yolo(np.array(img))
    detections = []
    for r in results:
        boxes = r.boxes
        if boxes is None:
            continue
        for box in boxes:
            xyxy = box.xyxy[0].cpu().numpy().tolist()
            conf = float(box.conf[0].cpu().numpy())
            cls_id = int(box.cls[0].cpu().numpy())
            label = r.names.get(cls_id, str(cls_id)) if hasattr(r, "names") else str(cls_id)

            x1, y1, x2, y2 = map(int, xyxy)
            crop = img.crop((x1, y1, x2, y2))
            tensor = pil_to_tensor(crop)
            with torch.no_grad():
                logits = eff(tensor)
                probs = torch.nn.functional.softmax(logits, dim=1)
                top1 = torch.argmax(probs, dim=1).item()
                score = float(probs[0, top1].cpu().numpy())
                material = class_names[top1] if class_names and top1 < len(class_names) else str(top1)

            detections.append({
                "box": [x1, y1, x2, y2],
                "confidence": conf,
                "detected_label": label,
                "material_label": material,
                "material_confidence": score,
            })

    return JSONResponse({"detections": detections})
