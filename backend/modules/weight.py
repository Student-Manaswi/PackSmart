# DENSITY DATABASE (kg/cm³)
DENSITY_DB = {
    "Aluminium": 2700 / 1_000_000,
    "Brass": 8500 / 1_000_000,
    "Copper": 8960 / 1_000_000,
    "Iron": 7870 / 1_000_000,
    "Steel": 7850 / 1_000_000,
    "Ceramic": 2400 / 1_000_000,
    "Glass": 2500 / 1_000_000,
    "Paper": 800 / 1_000_000,
    "Plastic": 950 / 1_000_000,
    "Wood": 700 / 1_000_000
}

# OBJECT FILL FACTOR DATABASE
# Fill factor = effective solid volume / total bounding box volume
# Calibrated for all 33 classes in the training dataset.
#
# Reasoning per group:
#   Electronics     — compact internals, plastic shells with air pockets
#   Large appliances— mostly hollow cavity (drum, chamber, panel)
#   Furniture       — open frame / thin slab relative to bounding box
#   Kitchenware     — thin walls around a hollow interior
#   Industrial      — dense solid metal assemblies
#   Sports / misc   — varies; books are dense, helmets/skates are hollow shells

OBJECT_FILL_FACTOR = {
    # ── Electronics ──────────────────────────────────────────────────────────
    "Blender":          0.20,   # hollow jug + motor housing
    "Camera":           0.55,   # compact dense body + lens
    "Clock":            0.15,   # thin face, large hollow back
    "Computer_Monitor": 0.10,   # flat panel — mostly bezel & air
    "Computer_Mouse":   0.20,   # hollow plastic shell + small PCB
    "Headphones":       0.15,   # ear cups + thin headband, lots of air
    "Iron":             0.45,   # dense metal soleplate + plastic top
    "Laptop":           0.55,   # flat, dense internals (battery, board)
    "Mixer":            0.25,   # motor block + hollow bowl
    "Mobile_phone":     0.65,   # dense flat slab (battery, glass, PCB)
    "Calculator":       0.45,   # flat electronics + plastic housing

    # ── Large appliances ─────────────────────────────────────────────────────
    "Oven":             0.08,   # large hollow cooking cavity
    "Refrigerator":     0.12,   # hollow insulated box
    "Television":       0.08,   # thin flat panel, mostly air behind screen
    "Washing_machine":  0.10,   # hollow drum inside sheet-metal body

    # ── Furniture ────────────────────────────────────────────────────────────
    "Chair":            0.30,   # open frame, legs, seat — lots of open space
    "Table":            0.35,   # flat top slab + thin legs

    # ── Kitchenware / Glass ───────────────────────────────────────────────────
    "Glass_utensils":   0.12,   # thin glass walls around hollow interior
    "Vase":             0.10,   # thin ceramic/glass walls, wide hollow
    "Bottle":           0.10,   # very thin walls, almost all air/liquid space
    "Cooker":           0.15,   # hollow pressure vessel + thin metal lid
    "Cup":              0.10,   # thin ceramic walls around hollow
    "Gas_stove":        0.15,   # burner grates + hollow frame cavity
    "Plate":            0.20,   # thin flat disc, small fraction of box height

    # ── Industrial / Heavy ────────────────────────────────────────────────────
    "Bars":                  0.90,  # solid metal rods — almost fully dense
    "Dumbbell":              0.95,  # solid cast iron/steel weights
    "BATTERY":               0.80,  # dense electrochemical cells inside
    "Hydraulic_components":  0.70,  # solid metal cylinders & fittings
    "TRANSMISSION":          0.60,  # complex gear assembly, some voids

    # ── Sports & Protective ──────────────────────────────────────────────────
    "Helmet":          0.12,   # hollow shell with thin foam liner
    "Roller_skates":   0.35,   # boot + metal frame + wheels (open structure)

    # ── Stationery / Misc ────────────────────────────────────────────────────
    "Book":        0.80,   # dense compressed paper stack
    "Sharpener":   0.55,   # small solid plastic/metal block

    # ── Fallback ─────────────────────────────────────────────────────────────
    "default":     0.50,
}


# WEIGHT ESTIMATION FUNCTION
def estimate_weight(volume_cm3, material, object_name):
    """
    Estimate object weight using:
    - Volume (cm³)
    - Material density (kg/cm³)
    - Object fill factor (fraction of bounding box that is solid)

    Returns:
        weight_kg (float)
    """

    # Get Density
    density = DENSITY_DB.get(material)
    if density is None:
        raise ValueError(f"Material '{material}' not found in DENSITY_DB.")

    # Get Fill Factor
    fill_factor = OBJECT_FILL_FACTOR.get(object_name, OBJECT_FILL_FACTOR["default"])

    # Compute Effective Volume
    effective_volume = volume_cm3 * fill_factor

    # Weight Estimation
    weight_kg = effective_volume * density

    return round(weight_kg, 3)