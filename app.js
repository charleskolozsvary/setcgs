/* ============================================================
   pyimg — app.js
   Loads Pyodide, mounts python/, passes uploaded image
   to main.main(), displays returned images in the gallery.
   ============================================================ */

// -- DOM refs -----------------------------------------------
const statusDot     = document.getElementById('statusDot');
const statusText    = document.getElementById('statusText');
const dropZone      = document.getElementById('dropZone');
const fileInput     = document.getElementById('fileInput');
const previewRow    = document.getElementById('previewRow');
const previewImg    = document.getElementById('previewImg');
const previewMeta   = document.getElementById('previewMeta');
const runBtn        = document.getElementById('runBtn');
const outputSection = document.getElementById('outputSection');
const outputCount   = document.getElementById('outputCount');
const gallery       = document.getElementById('gallery');
const errorBox      = document.getElementById('errorBox');
const errorText     = document.getElementById('errorText');

// -- State --------------------------------------------------
let pyodide      = null;
let uploadedFile = null;

// -- Status helpers -----------------------------------------
function setStatus(state, message) {
    statusDot.className = `status-dot ${state}`;
    statusText.textContent = message;
}

// -- 1. Boot Pyodide ----------------------------------------
async function initPyodide() {
    setStatus('loading', 'Loading Pyodide runtime...');
    try {
	pyodide = await loadPyodide();
	await mountPythonPackage();
	setStatus('ready', 'Runtime ready — upload an image to begin');
    } catch (err) {
	setStatus('error', `Failed to initialise: ${err.message}`);
	console.error(err);
    }
}

// -- 2. Mount local Python files & load packages ------------
//
// manifest.json format (all fields optional):
//   {
//     "files":    ["utils/helpers.py", "models/net.py"],
//     "packages": ["some-pure-python-lib"]   // only for non-bundled PyPI packages
//   }
//
// Bundled Pyodide packages (numpy, cv2, pillow, sklearn, scipy,
// pandas, etc.) are detected automatically from import statements
// — no configuration needed.
//
async function mountPythonPackage() {
    setStatus('loading', 'Mounting python/ into virtual filesystem...');

    pyodide.FS.mkdirTree('/python');

    let files    = [];
    let packages = [];  // only needed for rare pure-Python PyPI packages

    try {
	const resp = await fetch('./python/manifest.json');
	if (resp.ok) {
	    const manifest = await resp.json();
	    files    = manifest.files    ?? [];
	    packages = manifest.packages ?? [];
	}
    } catch (_) { /* no manifest — fine */ }

    // Collect source text as we write files so we can scan all imports in one pass
    const allSources = [];

    const mainResp = await fetch('./python/main.py');
    if (!mainResp.ok) throw new Error('python/main.py not found.');
    const mainSrc = await mainResp.text();
    pyodide.FS.writeFile('/main.py', mainSrc);
    allSources.push(mainSrc);

    for (const relPath of files) {
	if (relPath === 'main.py') continue;
	const resp = await fetch(`./python/${relPath}`);
	if (!resp.ok) { console.warn(`Skipping missing file: ${relPath}`); continue; }
	const src = await resp.text();
	const parts = relPath.split('/');
	if (parts.length > 1) {
	    pyodide.FS.mkdirTree('/python/' + parts.slice(0, -1).join('/'));
	}
	pyodide.FS.writeFile(`/python/${relPath}`, src);
	allSources.push(src);
    }

    pyodide.runPython(`
import sys
for p in ['/', '/python']:
    if p not in sys.path:
        sys.path.insert(0, p)
  `);

    // Auto-detect and load all bundled Pyodide packages by scanning import statements.
    // This covers numpy, cv2, sklearn, scipy, pandas, and ~100 others for free.
    setStatus('loading', 'Loading packages...');
    await pyodide.loadPackagesFromImports(allSources.join('\n'));

    // Only needed for pure-Python packages not bundled with Pyodide.
    // Add them to manifest.json as "packages": ["somelib"] if you ever need this.
    if (packages.length > 0) {
	setStatus('loading', `Installing via micropip: ${packages.join(', ')}...`);
	await pyodide.loadPackage('micropip');
	await pyodide.runPythonAsync(`
import micropip
await micropip.install(${JSON.stringify(packages)})
    `);
    }
}

// -- 3. File upload & preview -------------------------------
function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    uploadedFile = file;

    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewRow.hidden = false;

    const kb = (file.size / 1024).toFixed(1);
    previewMeta.innerHTML =
	`<strong>${file.name}</strong><br>${file.type} &nbsp;·&nbsp; ${kb} KB`;

    runBtn.disabled = (pyodide === null);

    outputSection.hidden = true;
    errorBox.hidden = true;
    gallery.innerHTML = '';
}

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

// -- 4. Run Python ------------------------------------------
runBtn.addEventListener('click', async () => {
    if (!pyodide || !uploadedFile) return;

    setStatus('running', 'Running main.py...');
    runBtn.disabled = true;
    errorBox.hidden = true;
    outputSection.hidden = true;
    gallery.innerHTML = '';

    try {
	const arrayBuffer = await uploadedFile.arrayBuffer();
	pyodide.globals.set('_input_bytes', new Uint8Array(arrayBuffer));

	const resultProxy = await pyodide.runPythonAsync(`
import sys, io, base64, importlib
import main as _main_module
importlib.reload(_main_module)   # pick up any edits without re-mounting

_img_bytes = bytes(_input_bytes.to_py())
_result = _main_module.main(_img_bytes)

def _to_b64(item):
    try:
        import PIL.Image
        if isinstance(item, PIL.Image.Image):
            buf = io.BytesIO()
            item.save(buf, format='PNG')
            return base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        pass
    if isinstance(item, str):
        return item.split(',', 1)[1] if ',' in item else item
    if isinstance(item, (bytes, bytearray)):
        return base64.b64encode(item).decode()
    raise TypeError(f'Unsupported return type from main(): {type(item)}')

if not hasattr(_result, '__iter__') or isinstance(_result, (str, bytes, bytearray)):
    _result = [_result]

[_to_b64(img) for img in _result]
`);

	const b64List = resultProxy.toJs();
	resultProxy.destroy();

	if (!b64List || b64List.length === 0) throw new Error('main() returned no images.');

	outputCount.textContent = `(${b64List.length})`;
	outputSection.hidden = false;

	b64List.forEach((b64, idx) => {
	    const dataUrl = `data:image/png;base64,${b64}`;
	    const card = document.createElement('div');
	    card.className = 'gallery-card';
	    card.style.animationDelay = `${idx * 60}ms`;

	    const img = document.createElement('img');
	    img.src = dataUrl;
	    img.alt = `Output ${idx + 1}`;

	    const footer = document.createElement('div');
	    footer.className = 'card-footer';

	    const uploaded_basename = uploadedFile.name.replace(/\.[^/.]+$/, '');

	    const label = document.createElement('span');
	    label.className = 'card-label';
	    if (idx === 0) {
		label.textContent = `${uploaded_basename}_labeled.png`;
	    } else {
		label.textContent = `set_${String(idx).padStart(2, '0')}.png`;
	    }

	    const dl = document.createElement('a');
	    dl.className = 'card-dl';
	    dl.href = dataUrl;
	    dl.download = `output_${String(idx + 1).padStart(2, '0')}.png`;
	    dl.textContent = '↓ save';

	    footer.appendChild(label);
	    footer.appendChild(dl);
	    card.appendChild(img);
	    card.appendChild(footer);
	    gallery.appendChild(card);
	});

	setStatus('ready', `Done — ${b64List.length} image${b64List.length !== 1 ? 's' : ''} returned`);

    } catch (err) {
	setStatus('error', 'Python error — see details below');
	errorBox.hidden = false;
	errorText.textContent = err.message ?? String(err);
	console.error(err);
    } finally {
	runBtn.disabled = false;
    }
});

// -- Start --------------------------------------------------
initPyodide().then(() => {
    if (uploadedFile) runBtn.disabled = false;
});
