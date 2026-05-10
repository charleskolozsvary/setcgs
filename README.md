# pyimg — Pyodide Image Processor

Run local Python modules entirely in the browser via Pyodide.  
No server, no build step — just open `index.html` (via a local server).

---

## File structure

```
index.html                  ← main page
styles.css                  ← all styling
app.js                      ← Pyodide bootstrap + UI logic
python_package/
  manifest.json             ← lists every .py file in the package
  main.py                   ← entry point: def main(image_bytes) -> list
  utils/
    image_ops.py            ← example helper module
```

---

## How it works

1. **Pyodide loads** in the browser (WebAssembly Python runtime).
2. **`manifest.json`** is fetched; every listed `.py` file is written into Pyodide's virtual filesystem under `/python_package/`.
3. **`main.py`** is written to `/` (the root), with `/python_package` on `sys.path`.
4. The user **uploads an image** — its raw bytes are passed to `main.main(image_bytes)`.
5. The return value (a list of PIL Images, bytes, or base64 strings) is **rendered as a gallery** with per-image download links.

---

## Writing your own `main.py`

```python
# python_package/main.py
# Do NOT call micropip here — declare packages in manifest.json instead.

from my_module import do_something

def main(image_bytes: bytes) -> list:
    result_a = do_something(image_bytes)
    # Return any mix of PIL.Image objects, bytes, or base64 strings
    return [result_a, ...]
```

### Adding more modules / packages

Edit **`manifest.json`**:

```json
{
  "files": [
    "utils/image_ops.py",
    "my_module.py"
  ],
  "packages": [
    "pillow",
    "numpy"
  ]
}
```

- **`files`** — every `.py` file to load into the virtual FS (`main.py` is always loaded automatically, don't list it here)
- **`packages`** — PyPI packages to install via `micropip` *before* your code runs; declare them here instead of calling `micropip` inside Python

---

## Running locally

Because the page fetches files with `fetch()`, it must be served over HTTP (not opened as `file://`):

```bash
# Python
python -m http.server 8080

# Node
npx serve .

# VS Code
# Use the "Live Server" extension
```

Then open `http://localhost:8080`.
