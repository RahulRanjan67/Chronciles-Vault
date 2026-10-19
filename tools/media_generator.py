import os
import sys
import io
import json
import zipfile
import uuid
import math
import struct
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.pdfgen import canvas
import wave

# ---------------------------------------------------------------------------
# Media Synthesis Utilities
# ---------------------------------------------------------------------------

def generate_cover_image(title: str, subtitle: str, badge: str, accent_color: tuple, bg_color: tuple) -> bytes:
    """Generates an ornate, high-resolution 600x850 book cover PNG."""
    img = Image.new("RGB", (600, 850), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Outer double border frame
    draw.rectangle([18, 18, 582, 832], outline=accent_color, width=3)
    draw.rectangle([26, 26, 574, 824], outline=(80, 80, 100), width=1)
    
    # Ornate corner brackets
    corner_len = 36
    draw.line([(18, 18 + corner_len), (18, 18), (18 + corner_len, 18)], fill=accent_color, width=5)
    draw.line([(582 - corner_len, 18), (582, 18), (582, 18 + corner_len)], fill=accent_color, width=5)
    draw.line([(18, 832 - corner_len), (18, 832), (18 + corner_len, 832)], fill=accent_color, width=5)
    draw.line([(582 - corner_len, 832), (582, 832), (582, 832 - corner_len)], fill=accent_color, width=5)
    
    # Header brand pill
    draw.rectangle([170, 48, 430, 84], fill=(22, 25, 35), outline=accent_color, width=1)
    draw.text((300, 66), "GRIMOIRE CODEX ARCHIVES", fill=accent_color, anchor="mm")
    
    # Category badge
    draw.rectangle([210, 104, 390, 134], fill=accent_color)
    draw.text((300, 119), badge.upper(), fill=(10, 12, 18), anchor="mm")
    
    # Central decorative medallion / geometric seal
    draw.ellipse([220, 210, 380, 370], outline=accent_color, width=2)
    draw.ellipse([235, 225, 365, 355], outline=(100, 100, 130), width=1)
    draw.polygon([(300, 240), (355, 335), (245, 335)], outline=accent_color, fill=None)
    draw.polygon([(300, 340), (355, 245), (245, 245)], outline=accent_color, fill=None)
    
    # Title & Subtitle block
    draw.rectangle([40, 420, 560, 560], fill=(16, 18, 26), outline=(60, 65, 80), width=1)
    # Wrap title if long
    words = title.split()
    if len(words) > 3:
        mid = len(words) // 2
        line1 = " ".join(words[:mid])
        line2 = " ".join(words[mid:])
        draw.text((300, 465), line1, fill=(255, 255, 255), anchor="mm")
        draw.text((300, 505), line2, fill=(255, 255, 255), anchor="mm")
    else:
        draw.text((300, 485), title, fill=(255, 255, 255), anchor="mm")
        
    draw.text((300, 535), subtitle, fill=accent_color, anchor="mm")
    
    # Footer metadata strip
    draw.line([50, 750, 550, 750], fill=(80, 85, 105), width=1)
    draw.text((300, 775), "SOVEREIGN LOCAL SANCTUM · ZERO TELEMETRY", fill=(170, 175, 195), anchor="mm")
    draw.text((300, 805), "AUTHORIZED MASTER EDITION", fill=(120, 125, 145), anchor="mm")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_screenshot_image(window_title: str, section_tag: str, headline: str, quote_body: str, progress_info: str, accent_color: tuple) -> bytes:
    """Generates an authentic in-app reading and memory capture screenshot (1280x720 PNG)."""
    img = Image.new("RGB", (1280, 720), color=(13, 15, 22))
    draw = ImageDraw.Draw(img)
    
    # Titlebar
    draw.rectangle([0, 0, 1280, 46], fill=(22, 25, 36))
    # Traffic lights
    draw.ellipse([20, 16, 34, 30], fill=(239, 68, 68))
    draw.ellipse([42, 16, 56, 30], fill=(245, 158, 11))
    draw.ellipse([64, 16, 78, 30], fill=(16, 185, 129))
    draw.text((640, 23), f"Grimoire Sanctum ✦ {window_title}", fill=(210, 215, 230), anchor="mm")
    
    # Left mini sidebar
    draw.rectangle([0, 46, 68, 720], fill=(18, 20, 28), outline=(35, 38, 50), width=1)
    sidebar_icons = ["📚", "🔒", "⚡", "📡", "🔑"]
    for i, ico in enumerate(sidebar_icons):
        y_center = 80 + i * 58
        if i == 0:
            draw.rectangle([8, y_center - 18, 60, y_center + 18], fill=accent_color)
            draw.text((34, y_center), ico, fill=(0, 0, 0), anchor="mm")
        else:
            draw.rectangle([12, y_center - 16, 56, y_center + 16], fill=(28, 31, 42))
            draw.text((34, y_center), ico, fill=(180, 185, 200), anchor="mm")
            
    # Breadcrumb header
    draw.rectangle([68, 46, 1280, 94], fill=(16, 18, 26), outline=(32, 35, 48), width=1)
    draw.text((95, 70), f"Library > {window_title} > Memories & Reflection Ledger", fill=(140, 145, 165), anchor="lm")
    
    # Progress Badge Pill
    draw.rectangle([1020, 58, 1240, 84], fill=(25, 30, 45), outline=accent_color, width=1)
    draw.text((1130, 71), progress_info, fill=accent_color, anchor="mm")
    
    # Main Content Area: Large Memory Dossier Card
    draw.rectangle([95, 115, 1250, 685], fill=(20, 23, 33), outline=accent_color, width=2)
    
    # Memory card header
    draw.rectangle([95, 115, 1250, 175], fill=(26, 30, 44))
    draw.rectangle([120, 130, 230, 160], fill=accent_color)
    draw.text((175, 145), section_tag.upper(), fill=(10, 12, 18), anchor="mm")
    draw.text((250, 145), headline, fill=(245, 245, 255), anchor="lm")
    
    # Reading Progress Anchor Card
    draw.rectangle([120, 195, 1225, 245], fill=(28, 32, 46), outline=(50, 55, 75), width=1)
    draw.text((140, 220), f"📍 Reading Anchor: {progress_info} · Timestamp Verified · Local Sanctum Cache", fill=(160, 165, 185), anchor="lm")
    
    # Quote/Body Text Box
    draw.rectangle([120, 265, 1225, 590], fill=(15, 17, 25), outline=(45, 50, 70), width=1)
    draw.text((150, 300), "“", fill=accent_color, anchor="lm")
    
    # Multi-line quote drawing
    words = quote_body.split()
    lines = []
    curr = []
    for w in words:
        curr.append(w)
        if len(" ".join(curr)) > 75:
            lines.append(" ".join(curr))
            curr = []
    if curr:
        lines.append(" ".join(curr))
        
    for idx, line in enumerate(lines[:8]):
        draw.text((160, 340 + idx * 32), line, fill=(225, 230, 245), anchor="lm")
        
    # Tags & Footer Strip
    draw.rectangle([120, 615, 1225, 665], fill=(24, 28, 40))
    draw.text((140, 640), "🏷️ Tags: #GrimoireReflection  #CanonMasterpiece  #VaultSecured  #Milestone", fill=(130, 135, 155), anchor="lm")
    draw.text((1180, 640), "Status: Synced Offline ✓", fill=(16, 185, 129), anchor="rm")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class NumberedCanvas(canvas.Canvas):
    """ReportLab canvas that calculates and prints total page counts dynamically."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        # Header rule and title
        self.setFont("Helvetica-Bold", 8)
        self.setFillColorRGB(0.3, 0.35, 0.45)
        self.drawString(54, letter[1] - 36, "GRIMOIRE CODEX READER · OFFICIAL LOCAL EDITION")
        self.drawRightString(letter[0] - 54, letter[1] - 36, "OFFLINE SANCTUM ARCHIVE")
        self.setStrokeColorRGB(0.75, 0.78, 0.85)
        self.setLineWidth(0.6)
        self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)
        
        # Footer rule and page numbers
        self.line(54, 46, letter[0] - 54, 46)
        self.setFont("Helvetica", 9)
        self.setFillColorRGB(0.4, 0.45, 0.55)
        self.drawString(54, 32, "Chronicles Vault · Sovereign Local Reader")
        self.drawRightString(letter[0] - 54, 32, f"Page {self._pageNumber} of {page_count}")


def generate_pdf_book(title: str, author: str, description: str, chapters: list) -> bytes:
    """Generates an authentic 12-page PDF document with chapters, running headers, and pagination."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor="#1e1b4b",
        spaceAfter=12,
        alignment=1, # Center
    )
    author_style = ParagraphStyle(
        "CoverAuthor",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=13,
        leading=16,
        textColor="#4338ca",
        spaceAfter=16,
        alignment=1,
    )
    desc_style = ParagraphStyle(
        "CoverDesc",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor="#374151",
        spaceAfter=20,
    )
    ch_heading_style = ParagraphStyle(
        "ChapterHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor="#1e1b4b",
        spaceBefore=8,
        spaceAfter=12,
    )
    body_style = ParagraphStyle(
        "ChapterBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15.5,
        textColor="#1f2937",
        spaceAfter=10,
    )
    
    story = []
    
    # Page 1: Cover & Table of Contents
    story.append(Spacer(1, 40))
    story.append(Paragraph(title, title_style))
    story.append(Paragraph(f"Authored by {author}", author_style))
    story.append(Spacer(1, 15))
    story.append(Paragraph(f"<b>Synopsis:</b> {description}", desc_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("<b>Table of Contents:</b>", ch_heading_style))
    for idx, (ch_name, _) in enumerate(chapters, 1):
        story.append(Paragraph(f"• <b>Chapter {idx}</b>: {ch_name} (Page {idx + 1})", body_style))
    story.append(PageBreak())
    
    # Pages 2 to 12: 11 distinct readable chapters
    for idx, (ch_name, paragraphs) in enumerate(chapters, 1):
        story.append(Paragraph(f"Chapter {idx}: {ch_name}", ch_heading_style))
        story.append(Spacer(1, 8))
        for p_text in paragraphs:
            story.append(Paragraph(p_text, body_style))
        if idx < len(chapters):
            story.append(PageBreak())
            
    doc.build(story, canvasmaker=NumberedCanvas)
    return buf.getvalue()


def generate_epub_book(title: str, author: str, description: str, chapters: list) -> bytes:
    """Generates a valid EPUB 3.0 / 2.0 file containing 12 chapters readable in Grimoire."""
    buf = io.BytesIO()
    book_uuid = str(uuid.uuid4())
    
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        # mimetype MUST be first and UNCOMPRESSED
        z.writestr("mimetype", b"application/epub+zip", compress_type=zipfile.ZIP_STORED)
        
        container_xml = """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>"""
        z.writestr("META-INF/container.xml", container_xml)
        
        manifest_entries = [
            '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
            '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
        ]
        spine_entries = []
        ncx_points = []
        nav_links = []
        
        for i, (ch_title, ch_paragraphs) in enumerate(chapters, 1):
            ch_id = f"ch{i:02d}"
            ch_filename = f"{ch_id}.xhtml"
            manifest_entries.append(f'<item id="{ch_id}" href="{ch_filename}" media-type="application/xhtml+xml"/>')
            spine_entries.append(f'<itemref idref="{ch_id}"/>')
            ncx_points.append(f"""    <navPoint id="navPoint-{i}" playOrder="{i}">
      <navLabel><text>{ch_title}</text></navLabel>
      <content src="{ch_filename}"/>
    </navPoint>""")
            nav_links.append(f'      <li><a href="{ch_filename}">{ch_title}</a></li>')
            
            p_html = "".join(f"<p>{p}</p>" for p in ch_paragraphs)
            ch_html = f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>{ch_title}</title>
  <style>
    body {{ font-family: sans-serif; line-height: 1.6; margin: 5%; color: #e2e8f0; background: #0f172a; }}
    h1 {{ color: #38bdf8; border-bottom: 1px solid #334155; padding-bottom: 0.3em; }}
    p {{ margin-bottom: 1em; text-indent: 1.5em; }}
  </style>
</head>
<body>
  <h1>{ch_title}</h1>
  {p_html}
</body>
</html>"""
            z.writestr(f"OEBPS/{ch_filename}", ch_html)
            
        content_opf = f"""<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>{title}</dc:title>
    <dc:creator>{author}</dc:creator>
    <dc:identifier id="BookId">urn:uuid:{book_uuid}</dc:identifier>
    <dc:language>en</dc:language>
    <dc:description>{description}</dc:description>
  </metadata>
  <manifest>
{chr(10).join('    ' + item for item in manifest_entries)}
  </manifest>
  <spine toc="ncx">
{chr(10).join('    ' + item for item in spine_entries)}
  </spine>
</package>"""
        z.writestr("OEBPS/content.opf", content_opf)
        
        toc_ncx = f"""<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:{book_uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>{title}</text></docTitle>
  <navMap>
{chr(10).join(ncx_points)}
  </navMap>
</ncx>"""
        z.writestr("OEBPS/toc.ncx", toc_ncx)
        
        nav_xhtml = f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>{title} — Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
{chr(10).join(nav_links)}
    </ol>
  </nav>
</body>
</html>"""
        z.writestr("OEBPS/nav.xhtml", nav_xhtml)
        
    return buf.getvalue()


def generate_audio_file(duration_sec=3.5, base_freq=380.0) -> bytes:
    """Generates a valid, playable .wav audio file with RIFF header and pleasant harmonic chime."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2) # 16-bit PCM
        sample_rate = 44100
        wf.setframerate(sample_rate)
        num_frames = int(duration_sec * sample_rate)
        frames = bytearray()
        for i in range(num_frames):
            t = i / sample_rate
            # Harmonic chime with exponential decay
            decay = math.exp(-t * 1.2)
            val = (
                0.55 * math.sin(2 * math.pi * base_freq * t) +
                0.30 * math.sin(2 * math.pi * (base_freq * 1.5) * t) +
                0.15 * math.sin(2 * math.pi * (base_freq * 2.0) * t)
            ) * decay
            sample = int(max(-32767, min(32767, val * 26000)))
            frames.extend(struct.pack("<h", sample))
        wf.writeframes(frames)
    return buf.getvalue()


def generate_video_file(width=320, height=240, duration_ms=2500) -> bytes:
    """Generates a valid ISO-BMFF MP4 video file with standard atoms (ftyp, moov, mdat)."""
    def make_box(box_type: bytes, payload: bytes) -> bytes:
        return struct.pack(">I", len(payload) + 8) + box_type + payload

    def make_full_box(box_type: bytes, version: int, flags: int, payload: bytes) -> bytes:
        vf = struct.pack(">I", (version << 24) | (flags & 0xFFFFFF))
        return make_box(box_type, vf + payload)

    ftyp_payload = b"isom" + struct.pack(">I", 512) + b"isomiso2mp41"
    ftyp = make_box(b"ftyp", ftyp_payload)
    
    timescale = 1000
    dur = duration_ms
    
    # 2 seconds of simple MPEG-4 / raw frame payload
    sample_data = bytes([
        0x00, 0x00, 0x01, 0xB0, 0x01, 0x00, 0x00, 0x01, 0xB5, 0x09,
        0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x20, 0x00, 0x86,
        0xC4, 0x00, 0x00, 0x01, 0xB6, 0x10, 0x50, 0x60, 0x70, 0x80
    ])
    
    # mvhd
    mvhd_payload = struct.pack(">IIII", 0, 0, timescale, dur)
    mvhd_payload += struct.pack(">iih", 0x00010000, 0x0100, 0)
    mvhd_payload += b"\x00" * 8
    matrix = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000]
    mvhd_payload += struct.pack(">" + "i"*9, *matrix)
    mvhd_payload += b"\x00" * 24
    mvhd_payload += struct.pack(">I", 2)
    mvhd = make_full_box(b"mvhd", 0, 0, mvhd_payload)
    
    # tkhd
    tkhd_payload = struct.pack(">IIII", 0, 0, 1, 0)
    tkhd_payload += struct.pack(">I", dur)
    tkhd_payload += b"\x00" * 8
    tkhd_payload += struct.pack(">hh", 0, 0)
    tkhd_payload += struct.pack(">hh", 0, 0)
    tkhd_payload += struct.pack(">" + "i"*9, *matrix)
    tkhd_payload += struct.pack(">II", width << 16, height << 16)
    tkhd = make_full_box(b"tkhd", 0, 3, tkhd_payload)
    
    # mdhd
    mdhd_payload = struct.pack(">IIII", 0, 0, timescale, dur)
    mdhd_payload += struct.pack(">Hh", 0x55c4, 0)
    mdhd = make_full_box(b"mdhd", 0, 0, mdhd_payload)
    
    # hdlr
    hdlr_payload = struct.pack(">I4s", 0, b"vide")
    hdlr_payload += b"\x00" * 12
    hdlr_payload += b"Grimoire Video Stream\x00"
    hdlr = make_full_box(b"hdlr", 0, 0, hdlr_payload)
    
    # vmhd
    vmhd_payload = struct.pack(">hhhh", 0, 0, 0, 0)
    vmhd = make_full_box(b"vmhd", 0, 1, vmhd_payload)
    
    # dinf
    url_box = make_full_box(b"url ", 0, 1, b"")
    dref_payload = struct.pack(">I", 1) + url_box
    dref = make_full_box(b"dref", 0, 0, dref_payload)
    dinf = make_box(b"dinf", dref)
    
    # stsd
    vis_payload = b"\x00" * 6
    vis_payload += struct.pack(">H", 1)
    vis_payload += struct.pack(">HH", 0, 0)
    vis_payload += b"\x00" * 12
    vis_payload += struct.pack(">HH", width, height)
    vis_payload += struct.pack(">II", 0x00480000, 0x00480000)
    vis_payload += struct.pack(">I", 0)
    vis_payload += struct.pack(">H", 1)
    vis_payload += b"\x08Grimoire" + b" " * 23
    vis_payload += struct.pack(">Hh", 0x0018, -1)
    mp4v = make_box(b"mp4v", vis_payload)
    stsd = make_full_box(b"stsd", 0, 0, struct.pack(">I", 1) + mp4v)
    
    # stts, stsc, stsz
    stts = make_full_box(b"stts", 0, 0, struct.pack(">III", 1, 1, dur))
    stsc = make_full_box(b"stsc", 0, 0, struct.pack(">IIII", 1, 1, 1, 1))
    stsz = make_full_box(b"stsz", 0, 0, struct.pack(">III", 0, 1, len(sample_data)))
    
    # Calculate chunk offset
    stco_dummy = make_full_box(b"stco", 0, 0, struct.pack(">II", 1, 0))
    stbl_dummy = make_box(b"stbl", stsd + stts + stsc + stsz + stco_dummy)
    minf_dummy = make_box(b"minf", vmhd + dinf + stbl_dummy)
    mdia_dummy = make_box(b"mdia", mdhd + hdlr + minf_dummy)
    trak_dummy = make_box(b"trak", tkhd + mdia_dummy)
    moov_dummy = make_box(b"moov", mvhd + trak_dummy)
    
    chunk_offset = len(ftyp) + len(moov_dummy) + 8
    stco = make_full_box(b"stco", 0, 0, struct.pack(">II", 1, chunk_offset))
    stbl = make_box(b"stbl", stsd + stts + stsc + stsz + stco)
    minf = make_box(b"minf", vmhd + dinf + stbl)
    mdia = make_box(b"mdia", mdhd + hdlr + minf)
    trak = make_box(b"trak", tkhd + mdia)
    moov = make_box(b"moov", mvhd + trak)
    
    mdat = make_box(b"mdat", sample_data)
    return ftyp + moov + mdat

print("Media utilities defined successfully.")
