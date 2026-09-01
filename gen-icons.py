#!/usr/bin/env python3
"""アプリアイコンを生成する。
文字・色を変えたいときはこのファイルの CHAR / BG / FG を書き換えて実行:
    pip install Pillow
    python3 scripts/gen-icons.py
    npm run build
"""
from PIL import Image, ImageDraw, ImageFont
import os, sys

CHAR = "極"
BG   = (255, 200, 0)   # #FFC800 背景（黄）
FG   = (26, 29, 36)    # #1A1D24 文字（ほぼ黒）
OUT  = "src/icons"

# 日本語が含まれる太めのフォントを探す
CANDIDATES = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc",
    "/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc",       # macOS
    "/System/Library/Fonts/Hiragino Sans GB.ttc",           # macOS
    "C:/Windows/Fonts/YuGothB.ttc",                          # Windows
    "C:/Windows/Fonts/meiryob.ttc",                          # Windows
]
FONT = next((p for p in CANDIDATES if os.path.exists(p)), None)
if FONT is None:
    sys.exit("日本語フォントが見つかりません。CANDIDATES にフォントのパスを追加してください。")

def make(size, ratio, name):
    """ratio = 文字の高さ / 画像サイズ"""
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)
    target = size * ratio
    lo, hi, best = 1, size * 2, 1
    while lo <= hi:                       # 目標の字面高さになるフォントサイズを二分探索
        mid = (lo + hi) // 2
        f = ImageFont.truetype(FONT, mid, index=0)
        b = d.textbbox((0, 0), CHAR, font=f)
        if b[3] - b[1] <= target:
            best, lo = mid, mid + 1
        else:
            hi = mid - 1
    f = ImageFont.truetype(FONT, best, index=0)
    b = d.textbbox((0, 0), CHAR, font=f)
    w, h = b[2] - b[0], b[3] - b[1]
    d.text(((size - w) / 2 - b[0], (size - h) / 2 - b[1]), CHAR, font=f, fill=FG)
    path = os.path.join(OUT, name)
    img.save(path, "PNG", optimize=True)
    print(f"  {path} ({size}x{size})")

os.makedirs(OUT, exist_ok=True)
print(f"フォント: {FONT}\n生成:")
make(180, 0.62, "apple-touch-icon.png")     # iOS
make(192, 0.62, "icon-192.png")             # Android
make(512, 0.62, "icon-512.png")             # Android 高解像度
make(512, 0.42, "icon-maskable-512.png")    # Android マスカブル（安全領域を確保）
make(32,  0.68, "favicon-32.png")           # ブラウザタブ
print("完了。`npm run build` で public/ に反映されます。")
