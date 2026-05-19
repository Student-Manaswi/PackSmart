def get_real_dimensions(
    width_front_px,
    height_front_px,
    width_top_px,
    height_top_px,
    real_width_cm
):
    """
    Convert pixel measurements to real-world dimensions
    using user-provided real object width (cm).
    """
    
    if real_width_cm <= 0:
        raise ValueError("Real width must be greater than zero")

    # scale factors
    cm_per_pixel_front = real_width_cm / width_front_px
    cm_per_pixel_top = real_width_cm / width_top_px

    # real dimensions
    real_height_cm = height_front_px * cm_per_pixel_front
    real_length_cm = height_top_px * cm_per_pixel_top

    # volume
    volume_cm3 = real_width_cm * real_height_cm * real_length_cm

    return {
        "length_cm": round(real_length_cm, 2),
        "width_cm": round(real_width_cm, 2),
        "height_cm": round(real_height_cm, 2),
        "volume_cm3": round(volume_cm3, 2),
    }