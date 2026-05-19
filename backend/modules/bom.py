import json


def load_prices(json_path="../data/pricing.json"):
    with open(json_path, "r") as f:
        return json.load(f)


def generate_bom(packaging_material,
                 adjusted_dimensions,
                 protection_layer,
                 price_file="../data/pricing.json"):

    prices = load_prices(price_file)
    bom = []

    # ✅ Fix only dictionary extraction (necessary fix)
    length = round(adjusted_dimensions["length_cm"], 2)
    width = round(adjusted_dimensions["width_cm"], 2)
    height = round(adjusted_dimensions["height_cm"], 2)

    # Surface Area (sq.cm)
    surface_area = round(2 * (
        length * width +
        length * height +
        width * height
    ), 2)

    surface_area_sqm = round(surface_area / 10000, 2)

    edge_length = round(4 * (length + width + height), 2)
    edge_length_m = round(4 * (length + width + height) / 100, 2)

    # Helper function to add pricing
    def add_item(material, quantity, unit, description):
        unit_price = prices.get(material, 0)
        total_cost = round(quantity * unit_price, 2)

        bom.append({
            "material": material,
            "quantity": quantity,
            "unit": unit,
            "unit_price": unit_price,
            "total_cost": total_cost,
            "description": description
        })

    # ------------------ PLYWOOD CRATE ------------------
    if packaging_material == "Plywood Crate":

        add_item("Plywood Sheet",
                 surface_area_sqm,
                 "sq.m",
                 "Plywood panels for crate fabrication")

        add_item("Wooden Battens",
                 edge_length_m,
                 "meter",
                 "Support frame structure")

        add_item("Nails and Nuts",
                 24,
                 "lot",
                 "Fasteners for crate assembly")

    # ------------------ 4 PANEL BOX ------------------
    elif packaging_material == "4 panel Cardboard Box":

        qty = round((surface_area + (width * length)), 2)

        add_item("Corrugated Cardboard (4 Panel)",
                 qty,
                 "sq.cm",
                 "4 panel corrugated box sheet")

        add_item("Adhesive Tape",
                 1,
                 "roll",
                 "Sealing tape")

    # ------------------ SINGLE PANEL BOX ------------------
    elif packaging_material == "Single Panel Cardboard Box":

        qty = round((surface_area + (width * length) + 2), 2)

        add_item("Corrugated Cardboard (Single Panel)",
                 qty,
                 "sq.cm",
                 "Single panel corrugated sheet")

    # ------------------ PROTECTION LAYER ------------------
    if protection_layer:

        if protection_layer == "Bubble-Wrap":

            add_item("Bubble Wrap",
                     surface_area,
                     "sq.cm",
                     "Protective cushioning wrap")

        elif protection_layer == "FoamSheet-Wrap":

            add_item("Foam Sheet",
                     surface_area_sqm,
                     "sq.m",
                     "Protective cushioning wrap")

        elif protection_layer == "Edge-Protector":

            add_item("Thermocol",
                     edge_length,
                     "cm",
                     "Corner/edge reinforcement")

    # ------------------ GRAND TOTAL ------------------
    grand_total = round(sum(item["total_cost"] for item in bom), 2)

    return {
        "bom": bom,
        "grand_total": grand_total,
        # expose selected inputs and derived metrics for callers
        "packaging_material": packaging_material,
        "protection_layer": protection_layer,
        "dimensions": {
            "length_cm": length,
            "width_cm": width,
            "height_cm": height
        },
        "surface_area_sqm": surface_area_sqm,
        "edge_length_m": edge_length_m
    }