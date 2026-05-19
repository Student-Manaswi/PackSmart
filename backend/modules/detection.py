import os
import cv2
import uuid
import numpy as np
from ultralytics import YOLO

from config import DETECTION_MODEL_FILENAME, DETECTION_MODEL_SOURCE
from modules.model_loader import ensure_local_model_file

_model = None

# ------------------------Model Loading------------------------
def load_model(model_path=None):
    global _model
    if _model is None:
        if model_path is None:
            model_path = ensure_local_model_file(
                DETECTION_MODEL_SOURCE,
                DETECTION_MODEL_FILENAME,
            )
        _model = YOLO(str(model_path))
    return _model


# ------------------------Front Object Detection Function------------------------
def detect_front_object(image_path, save_dir="outputs"):
    """
    Detect object from front image and return reusable outputs.

    Returns:
        dict containing:
            width_px
            height_px
            bbox_image_path
            crop_image_path
            object name
            confidence
    """
    
    # read image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Front image not found")

    if _model is None:
        load_model()

    # run detection
    results = _model(img, conf=0.37)
    boxes = results[0].boxes

    if boxes is None or len(boxes) == 0:
        raise ValueError("No object detected in front view")

    # take first detected object
    x1, y1, x2, y2 = map(int, boxes[0].xyxy[0])

    #object name and confidence score
    cls_id = int(boxes.cls[0])
    object_name = _model.names[cls_id]
    conf = boxes.conf[0].item() 

    # pixel dimensions
    width_px = x2 - x1
    height_px = y2 - y1

    # crop object
    cropped = img[y1:y2, x1:x2]

    # draw bounding box
    annotated = img.copy()
    cv2.rectangle(annotated, (x1, y1), (x2, y2), (0,255,0), 2)
    cv2.putText(annotated, "Detected Object", (x1, y1-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)

    # ensure output folder exists
    os.makedirs(save_dir, exist_ok=True)

    # unique filenames (important for web app)
    uid = str(uuid.uuid4())
    bbox_path = os.path.join(save_dir, f"{uid}_front_bbox.jpg")
    crop_path = os.path.join(save_dir, f"{uid}_front_crop.jpg")

    # save images
    cv2.imwrite(bbox_path, annotated)
    cv2.imwrite(crop_path, cropped)

    # return reusable data
    return {
        "width_px": width_px,
        "height_px": height_px,
        "bbox_image_path": bbox_path,
        "crop_image_path": crop_path,
        "object_name": object_name,
        "confidence": round(conf * 100, 2)
    }

# ------------------------Top Object Detection Function------------------------
def detect_top_object(image_path, save_dir="outputs"):
    """
    Detect object from top view using contour and return reusable outputs.

    Returns:
        dict containing:
            width_top_px
            height_top_px
    """

    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Top view image not found")

    # preprocessing
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)

    kernel = np.ones((5, 5), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)

    # find contour
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if len(contours) == 0:
        raise ValueError("No contour detected in top view")

    largest_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_contour)

    width_top_px = int(w)
    height_top_px = int(h)

    # # visualization image
    # annotated = img.copy()
    # cv2.rectangle(annotated, (x, y), (x+w, y+h), (255, 0, 0), 2)
    # cv2.putText(annotated, "Top Detection", (x, y-10),
    #             cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,0,0), 2)

    # # ensure folder exists
    # os.makedirs(save_dir, exist_ok=True)

    # uid = str(uuid.uuid4())
    # bbox_path = os.path.join(save_dir, f"{uid}_top_bbox.jpg")
    # cv2.imwrite(bbox_path, annotated)

    return {
        "width_top_px": width_top_px,
        "height_top_px": height_top_px
    }