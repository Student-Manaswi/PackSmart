import os
import base64
import cv2
from modules.detection import detect_front_object, detect_top_object
from modules.dimensions import get_real_dimensions
from modules.material import predict_material
from modules.weight import estimate_weight
from modules.packaging import get_packaging_recommendation
from modules.bom import generate_bom

def run_detection_pipeline(front_image_path, top_image_path, real_width_cm):
    """
    Stage 1: Detection, dimensions, material, weight estimation only
    """
    if real_width_cm <= 0:
        raise ValueError("Real width must be greater than zero")

    # 1. Run YOLO object detections
    front_data = detect_front_object(front_image_path)
    top_data = detect_top_object(top_image_path)

    # Safety Guard: Ensure detection didn't fail completely
    if not front_data or not top_data:
        raise ValueError("Object detection failed to return valid data blocks.")

    # 2. Calculate real-world dimensions using safely grabbed pixel inputs
    real_dimensions = get_real_dimensions(
        width_front_px=front_data.get("width_px", 0),
        height_front_px=front_data.get("height_px", 0),
        width_top_px=top_data.get("width_top_px", 0),
        height_top_px=top_data.get("height_top_px", 0),
        real_width_cm=real_width_cm
    )

    # 3. Classify material properties using the cropped front image
    crop_path = front_data.get("crop_image_path")
    object_name = front_data.get("object_name", "machinery")
    material_data = predict_material(crop_path, object_name)

    # Safety Guard: If material module returns None, use a clean fallback map
    if material_data is None:
        print("[WARNING] predict_material returned None. Using default fallback configuration.")
        material_data = {
            "materials": [{"name": "metal"}], 
            "object_category": "heavy_machinery", 
            "fragility": "medium"
        }

    # 4. Estimate item weight based on calculated volume and predicted material
    try:
        mat_name = material_data["materials"][0]["name"]
    except (KeyError, IndexError):
        mat_name = "metal"

    estimated_weight = estimate_weight(
        real_dimensions.get("volume_cm3", 0),
        mat_name,
        object_name
    )

    # NOTE: DO NOT delete crop_path or bbox_path here. 
    # Keep files alive on disk until Stage 2 and final API response processing are complete.

    return {
        "bbox_image_path": front_data.get("bbox_image_path"),
        "object_name": object_name,
        "object_confidence": front_data.get("confidence", 0.0),
        "real_dimensions": real_dimensions,
        "material": material_data,
        "estimated_weight": estimated_weight,
    }


def run_packaging_pipeline(material_data, real_dimensions, final_weight):
    """
    Stage 2: Packaging, BOM, pricing using final weight
    """
    # Safety Check for input structures
    if not material_data or not real_dimensions:
        raise ValueError("Missing required material or structural dimension inputs for packaging stage.")

    packaging = get_packaging_recommendation(
        material_data.get("object_category", "general"),
        material_data.get("fragility", "medium"),
        final_weight,
        real_dimensions.get("length_cm", 0),
        real_dimensions.get("width_cm", 0),
        real_dimensions.get("height_cm", 0)
    )

    bom_result = generate_bom(
        packaging.get("packaging_material"),
        packaging.get("adjusted_dimensions"),
        packaging.get("protection_layer")
    )

    return {
        "packaging": packaging,
        "bom": bom_result.get("bom", []),
        "grand_total": bom_result.get("grand_total", 0.0),
        "weight": final_weight,
    }