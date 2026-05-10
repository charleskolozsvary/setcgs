# python_package/main.py
#
# Entry point called by the browser.
# Receives: image_bytes (bytes) — raw bytes of the uploaded image file.
# Returns:  a list of PIL.Image objects (or bytes/base64 strings).
#
# Package installation (e.g. pillow) is handled by app.js via the
# "packages" list in manifest.json — do NOT use micropip here.

import time
import solve # removeDuplicateCards, getSets, displaySets
import extract # getCardImagesAndTheirContours
import identify # getCardLabels
from utils.image_ops import invert, _load_as_array, array_to_pil_image

def find_sets(orig_img): #img is in RGB
    s1 = time.time()
    cardImages, cardContours, cardCenters = extract.getCardImagesAndTheirContours(orig_img)
    e1 = time.time()
    t1 = e1 - s1
    # st.write('Time spent extracting cards:', t1)
    s2 = time.time()
    cardLabels = identify.getCardLabels(cardImages)
    e2 = time.time()
    t2 = e2 - s2
    # st.write('Time spent identifying cards:', t2)
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
    # st.write('Time spent finding sets:', t4)
    s5 = time.time()
    solutions, labels = solve.displaySets(orig_img, sets, unique_contours, unique_positions, cards.keys())
    e5 = time.time()
    t5 = e5 - s5
    # st.write('Time spent displaying sets:', t5)
    return solutions, labels

def main(image_bytes: bytes) -> list:
    """
    Receives raw image bytes from the browser.
    Returns a list of PIL.Image objects to display in the gallery.
    """
    opencv_image = _load_as_array(image_bytes)
    sets, labelings = find_sets(opencv_image)
    results = [labelings, *sets]

    return [
        array_to_pil_image(res)
        for res in results
    ]
    
    # return [
    #     # grayscale(image_bytes),   # 1 — greyscale
    #     # flip_h(image_bytes),      # 2 — mirror
    #     # flip_v(image_bytes),      # 3 — flip
    #     invert(image_bytes),      # 4 — colour invert
    #     # return_through_cv(image_bytes),
    # ]
