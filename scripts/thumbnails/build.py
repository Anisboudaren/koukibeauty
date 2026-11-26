"""Render course thumbnails (1600x1000, 16:10) from platform photos.

Usage: python scripts/thumbnails/build.py
Needs Google Chrome or Edge installed. Writes public/courses/<id>.jpg
"""
import os
import pathlib
import subprocess
import tempfile

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "courses"
W, H = 1600, 1000

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

# id: (headline, photo, object-position)
COURSES = {
    "17510": ("علاجات الشعر", "owner-photos/founder-01.jpg", "50% 30%"),
    "17522": ("صبغ الشعر", "models-shoots/model-05.jpeg", "50% 15%"),
    "17526": ("التسريحات العصرية", "models-shoots/model-04.jpeg", "50% 12%"),
    "17659": ("المكياج الاحترافي", "models-shoots/model-01.jpeg", "50% 20%"),
    "17666": ("التجميل", "owner-photos/founder-02.jpg", "40% 40%"),
    "17677": ("تسيير المحل والتسويق", "owner-photos/founder-03.jpg", "50% 18%"),
    "17689": ("قص الشعر", "models-shoots/model-02.jpeg", "50% 18%"),
}

TEMPLATE = """<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;800;900&display=block" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:#1a1214;font-family:'Cairo',sans-serif}}
.photo{{position:absolute;inset:0 auto 0 0;width:64%;height:100%;object-fit:cover;object-position:{pos}}}
.fade{{position:absolute;inset:0;background:
  linear-gradient(to left,#1a1214 36%,rgba(26,18,20,.85) 48%,rgba(26,18,20,0) 72%),
  linear-gradient(to top,rgba(26,18,20,.55),rgba(26,18,20,0) 35%)}}
.glow{{position:absolute;right:-180px;top:-220px;width:720px;height:720px;border-radius:50%;
  background:radial-gradient(circle,rgba(244,86,87,.28),rgba(244,86,87,0) 65%)}}
.panel{{position:absolute;right:96px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;gap:28px;color:#fff}}
.logo{{position:absolute;right:96px;top:84px;height:52px}}
.kicker{{align-self:flex-start;background:#f45657;color:#fff;font-weight:800;font-size:34px;padding:6px 30px 10px;border-radius:999px}}
h1{{font-weight:900;font-size:{size}px;line-height:1.15;letter-spacing:0}}
.rule{{width:120px;height:6px;border-radius:3px;background:#f6c6ce}}
.sub{{font-weight:600;font-size:32px;color:#f6c6ce}}
</style></head><body>
<img class="photo" src="{photo}">
<div class="fade"></div><div class="glow"></div>
<img class="logo" src="{logo}">
<div class="panel">
  <span class="kicker">دورة</span>
  <h1>{title}</h1>
  <div class="rule"></div>
  <div class="sub">مع كوكي بيوتي</div>
</div>
</body></html>"""


def chrome() -> str:
    for c in CHROME_CANDIDATES:
        if os.path.exists(c):
            return c
    raise SystemExit("Chrome or Edge not found")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    pub = ROOT / "public"
    with tempfile.TemporaryDirectory() as tmp:
        for cid, (title, photo, pos) in COURSES.items():
            size = 104 if len(title) <= 12 else 88
            html = TEMPLATE.format(
                W=W, H=H, pos=pos, size=size, title=title,
                photo=(pub / photo).as_uri(),
                logo=(pub / "logos" / "white.png").as_uri(),
            )
            page = pathlib.Path(tmp) / f"{cid}.html"
            page.write_text(html, encoding="utf-8")
            png = pathlib.Path(tmp) / f"{cid}.png"
            subprocess.run([
                chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--allow-file-access-from-files", "--force-device-scale-factor=1",
                f"--window-size={W},{H}", "--virtual-time-budget=8000",
                f"--screenshot={png}", page.as_uri(),
            ], check=True, capture_output=True)
            out = OUT / f"{cid}.jpg"
            Image.open(png).convert("RGB").save(out, quality=86, optimize=True, progressive=True)
            print(out.relative_to(ROOT), Image.open(out).size, f"{out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
