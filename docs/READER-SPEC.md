# Chronicles Vault — In-App Reader Sandboxing & Format Specification

## 1. Security Threat Model & Sandboxing Architecture

Chronicles Vault enables readers to import and read digital documents (EPUB, PDF, CBZ/CBR) originating from diverse, untrusted internet sources. Untrusted media files can harbor serious attack vectors:
- **Malicious Script Execution**: Embedded JavaScript within EPUB XHTML spines attempting to access local storage, token secrets, or native Capacitor plugin APIs.
- **Path Traversal & Zip-Slip**: Malicious ZIP file headers containing relative path traversal (`../../evil.bat`) designed to overwrite system or application files during decompression.
- **Decompression Bombs (Zip Bombs)**: Tiny archives that expand to hundreds of gigabytes, consuming all host RAM and crashing the system.
- **Resource Exhaustion**: Massive high-resolution comic pages exhausting GPU texture memory.
- **Network Exfiltration**: Embedded images or CSS `@import` statements attempting to phone home or leak user reading history.

To mitigate these threats, all reader format engines execute within hardened, sandboxed isolation boundaries.

---

## 2. EPUB Reader Sandboxing & Specification (epub.js)

### 2.1 Iframe Sandboxing & CSP Policy
EPUB documents are rendered inside an isolated `<iframe>` element. The iframe MUST be configured with strict HTML5 sandboxing attributes:

```html
<iframe
  sandbox="allow-same-origin"
  referrerpolicy="no-referrer"
  csp="default-src 'none'; img-src blob: data:; style-src 'unsafe-inline'; font-src blob: data:; script-src 'none';"
></iframe>
```

#### Sandboxing Rules:
1. **`allow-scripts` is Strictly Omitted**: JavaScript execution inside the EPUB frame is completely disabled. Interactive EPUB scripts (widgets, games) are neutralized to prevent DOM traversal or access to `window.parent`.
2. **`allow-top-navigation` is Omitted**: EPUB links cannot redirect the main Chronicles Vault window. External links captured in user clicks are intercepted and opened safely in the user's default system browser.
3. **No External Network Requests**: The Content Security Policy (`default-src 'none'`) prevents the EPUB from requesting remote fonts, external analytics pixels, or remote scripts. All images and fonts must be packaged within the EPUB container and loaded as local `blob:` or `data:` URIs.

### 2.2 Pre-Mount XHTML Sanitization
Before spine chapters are rendered into the reader DOM, the XML/HTML content passes through an in-memory sanitizer (`DOMPurify`):
- All `<script>`, `<object>`, `<embed>`, and `<iframe>` tags are stripped.
- All inline event handler attributes (`onload`, `onclick`, `onerror`, etc.) are removed.
- All SVG `<foreignObject>` nodes are purged.

### 2.3 CFI Locator Math & Serialization
Reading progress is anchored using standard **Canonical Fragment Identifiers (CFI)** defined by the IDPF EPUB standard:

```
epubcfi(/6/4[chapter-2]!/4/2/10/1:24)
```

- **Spine Progression Index**: The integer spine index (e.g. `4` in `/6/4`) identifies the specific XHTML document within the package spine.
- **DOM Path**: The bracketed IDs and element indices designate the precise paragraph and text node.
- **Offset Anchor**: The terminal `:24` specifies the character offset within the text node.
- **Percentage Computation**:
  $$\text{Percentage} = \left( \frac{\text{Current Spine Index}}{\text{Total Spine Count}} \times 100 \right) + \left( \frac{\text{Chapter Scroll Position}}{\text{Chapter Total Height}} \times \frac{100}{\text{Total Spine Count}} \right)$$

### 2.4 Presentation Overrides & CSS Injection
Reader customization (font family, font size, margins, themes) is achieved by injecting a scoped CSS stylesheet into the sandboxed document head:

```css
:root {
  --cv-reader-font-size: 18px;
  --cv-reader-line-height: 1.65;
  --cv-reader-font-family: 'Georgia', 'Merriweather', serif;
  --cv-reader-margin: 32px;
}

body {
  font-family: var(--cv-reader-font-family) !important;
  font-size: var(--cv-reader-font-size) !important;
  line-height: var(--cv-reader-line-height) !important;
  color: #fafafa !important;
  background-color: #09090b !important;
  padding: 0 var(--cv-reader-margin) !important;
  max-width: 760px !important;
  margin: 0 auto !important;
}

/* Neutralize publisher hardcoded colors */
p, span, div, li {
  color: inherit !important;
  background-color: transparent !important;
}
```

---

## 3. PDF Reader Sandboxing & Specification (pdf.js)

### 3.1 Web Worker Isolation
PDF documents are parsed using Mozilla `pdf.js` inside an isolated Web Worker:
- **Worker Script**: Loaded from a bundled local script (`pdf.worker.min.js`), never from a remote CDN.
- **Script Disablement**: `PDFJS.disableScripting = true` disables Adobe Acrobat Forms JavaScript execution within the PDF structure.
- **Font Sanitization**: `PDFJS.isEvalSupported = false` prevents the PDF parser from using dynamic code generation for custom embedded Type 1 or TrueType fonts.

### 3.2 Canvas & Text Layer Rendering
Each visible page renders as a dual-layer composite:
1. **Canvas Layer (Bottom)**: Draws vector lines, glyphs, and embedded raster images at native DPI:
   $$\text{Output Scale} = \text{window.devicePixelRatio} \times \text{User Zoom Level}$$
2. **Text Layer (Top)**: Transparent HTML `<div>` elements mapped precisely over glyphs, enabling native text selection, search highlighting, and copy-paste.

### 3.3 Text Selection Coordinate Capture
When a reader highlights a section of text in a PDF:
- The reader captures the page number ($P$) and normalized bounding box quad points:
  $$\text{Coordinates} = [x_1, y_1, x_2, y_2] \quad \text{where } 0.0 \le x, y \le 1.0$$
- Coordinates are stored as relative percentages of page width and height, ensuring highlights remain pixel-perfect regardless of window resizing or zoom changes.

### 3.4 Outline & Page-Level Bookmarks
- The PDF Document Outline (TOC) is parsed into a tree of destination arrays.
- Named destinations (e.g. `Dest: [14, "XYZ", 0, 792, null]`) are resolved directly to page numbers and scroll offsets.

---

## 4. CBZ / CBR Archive Sandboxing & Streaming Decompression

CBZ files are ZIP archives containing ordered image files (`.jpg`, `.png`, `.webp`, `.avif`).

### 4.1 Path Traversal & Zip-Slip Defense
Every entry in a CBZ archive is strictly validated before any byte is read:

```typescript
function validateZipEntry(entryPath: string): void {
  // 1. Reject absolute paths
  if (entryPath.startsWith('/') || entryPath.startsWith('\\') || /^[a-zA-Z]:/.test(entryPath)) {
    throw new SecurityError(`Invalid absolute entry path: ${entryPath}`);
  }

  // 2. Reject directory traversal sequences
  const segments = entryPath.split(/[/\\]/);
  for (const segment of segments) {
    if (segment === '..' || segment === '.') {
      throw new SecurityError(`Path traversal attempt detected in entry: ${entryPath}`);
    }
  }

  // 3. Reject null bytes or control characters
  if (/[\x00-\x1f]/.test(entryPath)) {
    throw new SecurityError(`Control characters in entry path: ${entryPath}`);
  }
}
```

### 4.2 Strict Image MIME & Magic Byte Verification
File extensions inside untrusted archives cannot be trusted. Chronicles Vault inspects the first 12 bytes of every extracted file to verify genuine image signatures:

| Format | Magic Bytes (Hex) | Offset |
|---|---|---|
| **JPEG** | `FF D8 FF` | 0 |
| **PNG** | `89 50 4E 47 0D 0A 1A 0A` | 0 |
| **WebP** | `52 49 46 46` ... `57 45 42 50` | 0 (RIFF) & 8 (WEBP) |
| **AVIF** | `.... 66 74 79 70 61 76 69 66` | 4 (`ftypavif`) |

Any archive entry failing magic byte verification is silently skipped; executable binaries, scripts, or SVG files masquerading as `.jpg` are neutralized.

### 4.3 Decompression Bomb Mitigation
- **Compression Ratio Cap**: If an entry has a compressed size of $C$ and an uncompressed size of $U$, the system verifies:
  $$\frac{U}{C} \le 100$$
  Entries exceeding a 100:1 ratio are rejected as potential zip bombs.
- **Maximum Image Dimension Cap**: Individual images cannot exceed an uncompressed memory footprint of 60 MB or dimensions $> 16,000 \times 16,000$ pixels.

### 4.4 Streaming On-Demand Decompression & Memory Ceiling
Chronicles Vault **NEVER** decompresses an entire 200MB+ CBZ archive into memory at once:
1. **Central Directory Scan**: Reads only the ZIP Central Directory located at the end of the file (< 64 KB) to construct an ordered table of contents.
2. **Sliding Window Cache**: Only decompresses the **active page $\pm 2$ neighboring pages** (maximum 5 pages in RAM).
3. **Memory Ceiling**: Enforces a strict 64 MB heap limit for cached bitmap buffers.
4. **Immediate Object URL Revocation**: Extracted Blob URLs (`URL.createObjectURL(blob)`) are explicitly revoked via `URL.revokeObjectURL()` the instant a page scrolls out of the sliding cache window.
