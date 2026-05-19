import json
import os

# Load Packaging Rules

def load_rules(json_path=None):
    if json_path is None:
        # Go up 3 levels from backend/modules to root
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        json_path = os.path.join(base_dir, "data", "packaging_rules.json")
    with open(json_path, "r") as f:
        return json.load(f)

def adjust_dimensions_for_packaging(length, width, height, protection_layer):
    """
    Adds protective padding to object dimensions.
    
    Default padding = 2 cm on each dimension.
    If protection layer includes 'Edge Protector' → 4 cm.
    """

    # Default padding
    padding = 2

    # If edge protection required
    if protection_layer and "Edge Protector" in protection_layer:
        padding = 4

    adjusted_dimensions = {
        "length_cm": round(length + padding, 2),
        "width_cm": round(width + padding, 2),
        "height_cm": round(height + padding, 2)
    }

    return adjusted_dimensions

# Determine Weight Category

def get_weight_category(weight, rules):
    thresholds = rules["weight_categories_kg"]

    if weight <= thresholds["light"]:
        return "light"
    elif weight <= thresholds["medium"]:
        return "medium"
    else:
        return "heavy"


# Packaging Recommendation

def get_packaging_recommendation(
        object_category,
        fragility,
        weight,
        length,
        width,
        height
):
    rules = load_rules()
    packaging_category = object_category

    # Weight Category
    weight_category = get_weight_category(weight, rules)

    # Outer Packaging (Based ONLY on Weight)
    packaging_material = rules["outer_packaging_by_weight"][weight_category]

    # Inner Packaging (Based on Category + Fragility)
    if fragility == "Fragile":
        packaging_category = "Fragile"
    protection_layer = rules["inner_packaging_rules"].get(
        packaging_category,
        rules["inner_packaging_rules"]["Consumer-Goods"]
    )

    # Adjust Dimensions Based on Padding
    adjusted_dims = adjust_dimensions_for_packaging(
        length,
        width,
        height,
        protection_layer
    )
    box_dimensions = f"{adjusted_dims['length_cm']} × {adjusted_dims['width_cm']} × {adjusted_dims['height_cm']} cm"

    # Final Output
    return {
        "packaging_material": packaging_material,
        "protection_layer": protection_layer,
        "box_dimensions": box_dimensions,
        "adjusted_dimensions": adjusted_dims
    }