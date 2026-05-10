# python_package/utils/image_ops.py
# Helper utilities — importable from main.py as:
#   from utils.image_ops import grayscale, flip_h, flip_v, invert

import io
from PIL import Image, ImageOps
import numpy as np
import cv2 as cv

def _load_as_array(image_bytes: bytes) -> np.ndarray:
    file_bytes = np.asarray(bytearray(image_bytes), dtype=np.uint8)
    opencv_image = cv.imdecode(file_bytes, 1)
    opencv_rgb_image = cv.cvtColor(opencv_image, cv.COLOR_BGR2RGB)
    return opencv_rgb_image

def array_to_pil_image(image: np.ndarray) -> Image.Image:
    return Image.fromarray(image)              

def _load(image_bytes: bytes) -> Image.Image:
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


def grayscale(image_bytes: bytes) -> Image.Image:
    """Convert image to grayscale (returned as RGB so formats are consistent)."""
    img = _load(image_bytes)
    return ImageOps.grayscale(img).convert("RGB")


def flip_h(image_bytes: bytes) -> Image.Image:
    """Flip image horizontally."""
    return ImageOps.mirror(_load(image_bytes))


def flip_v(image_bytes: bytes) -> Image.Image:
    """Flip image vertically."""
    return ImageOps.flip(_load(image_bytes))


def invert(image_bytes: bytes) -> Image.Image:
    """Invert image colours."""
    return ImageOps.invert(_load(image_bytes))
