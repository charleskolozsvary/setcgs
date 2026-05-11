# python_package/main.py
#
# Entry point called by the browser.
# Receives: image_bytes (bytes) — raw bytes of the uploaded image file.
# Returns:  a list of PIL.Image objects (or bytes/base64 strings).
#
# Package installation (e.g. pillow) is handled by app.js via the
# "packages" list in manifest.json — micropip is not loaded here 
# for PyPI package (of which there are likely to be none)

import numpy as np
from PIL import Image
import time
import solve 
import extract 
import identify 
from image_ops import load_as_array, array_to_pil_image

def find_sets(orig_img: np.ndarray):
    ''' orig_img is RGB '''
    s1 = time.time()
    cardImages, cardContours, cardCenters = extract.getCardImagesAndTheirContours(orig_img)
    e1 = time.time()
    t1 = e1 - s1
    
    print('Time spent extracting cards:', t1)
    s2 = time.time()
    cardLabels = identify.getCardLabels(cardImages)
    e2 = time.time()
    t2 = e2 - s2
    
    print('Time spent identifying cards:', t2)
    cards, unique_contours, unique_positions = solve.removeDuplicateCards(
        cardContours,
        cardCenters,
        cardLabels,
        (orig_img.shape[0] // 2,
         orig_img.shape[1] // 2),
        cardImages,
        orig_img
    )
    s4 = time.time()
    sets = solve.getSets(cards)
    e4 = time.time()
    t4 = e4 - s4
    
    print('Time spent finding sets:', t4)
    s5 = time.time()
    solutions, labels = solve.displaySets(
        orig_img,
        sets,
        unique_contours,
        unique_positions,
        cards.keys()
    )
    e5 = time.time()
    t5 = e5 - s5
    
    print('Time spent displaying sets:', t5)
    return solutions, labels

MAX_PX = 1024  # tune to taste

def _shrink(img: np.ndarray):
    """
    No need to preserve resolution for output images, really.
    It looks like returning several high resolution images slows things
    down a fair margin---up to tens of seconds.
    """
    w, h = img.size
    scale = min(1.0, MAX_PX / max(w, h))
    if scale == 1.0:
        return img
    return img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

def main(image_bytes: bytes) -> list[Image.Image]:
    """
    Receives raw image bytes from the browser.
    Returns a list of PIL Image.Image objects to display in the gallery.
    """
    opencv_image = load_as_array(image_bytes)
    sets, labelings = find_sets(opencv_image)
    results = [labelings, *sets]

    return [
        _shrink(array_to_pil_image(res))
        for res in results
    ]
