'''
python/image_ops.py
 Helper utilities — importable from main.py as:
   from image_ops import grayscale, flip_h, flip_v, invert
 if we had a file python/dir/module.py, it would be available
 from main.py as import dir.module
'''

from PIL import Image
import numpy as np
import cv2 as cv

def load_as_array(image_bytes: bytes) -> np.ndarray:
    file_bytes = np.asarray(bytearray(image_bytes), dtype=np.uint8)
    opencv_image = cv.imdecode(file_bytes, 1)
    opencv_rgb_image = cv.cvtColor(opencv_image, cv.COLOR_BGR2RGB)
    return opencv_rgb_image

def array_to_pil_image(image: np.ndarray) -> Image.Image:
    return Image.fromarray(image)
