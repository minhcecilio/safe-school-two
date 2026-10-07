"""Scan all HTML files and extract unique Vietnamese text strings for translation dictionary."""
import os
import re

base = r'd:\download\done'
# Only scan non-safe-school-two pages (or both - they share same content)
html_files = []
for root, dirs, files in os.walk(base):
    # Skip safe-school-two since it mirrors the main
    if 'safe-school-two' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

# Pattern to extract text content between tags (skip script/style/svg)
skip_tags = {'script', 'style', 'svg', 'path', 'circle', 'polyline', 'line', 'rect', 'defs', 'g', 'polygon', 'ellipse', 'use', 'symbol', 'filter', 'feGaussianBlur', 'feMerge'}
tag_re = re.compile(r'<([a-zA-Z][a-zA-Z0-9]*)([^>]*)?>|</([a-zA-Z]+)>|<!--.*?-->|>([^<]+)<', re.DOTALL)

vi_strings = set()
# Vietnamese text detection: has Vietnamese diacritics
vi_char_re = re.compile(r'[àáạảãăắặẳẵâấầẩẫèéẹẻẽêếềệểễìíịỉĩòóọỏõôốồổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹđ'
                         r'ÀÁẠẢÃĂẮẶẲẴÂẤẦẨẪÈÉẸẺẼÊẾỀỆỂỄÌÍỊỈĨÒÓỌỎÕÔỐỒỔỖƠỚỜỢỞỠÙÚỤỦŨƯỨỪỰỬỮỲÝỴỶỸĐ]')

for filepath in html_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        continue
    
    # Remove script and style blocks
    content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL)
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    
    # Extract text between tags
    texts = re.findall(r'>([^<]+)<', content)
    for t in texts:
        t = t.strip()
        if not t:
            continue
        if not vi_char_re.search(t):
            continue
        # Skip if it looks like CSS or JS
        if '{' in t or ';' in t or '/*' in t:
            continue
        # Skip URLs
        if 'http' in t or '.html' in t or '.js' in t:
            continue
        # Skip if too long (likely paragraph content, not UI labels)
        if len(t) > 120:
            continue
        vi_strings.add(t)
    
    # Also extract placeholder attributes
    placeholders = re.findall(r'placeholder=["\']([^"\']+)["\']', content)
    for ph in placeholders:
        if vi_char_re.search(ph):
            vi_strings.add(ph)
    
    # Extract title attributes
    titles = re.findall(r'title=["\']([^"\']+)["\']', content)
    for tt in titles:
        if vi_char_re.search(tt):
            vi_strings.add(tt)

import sys
sys.stdout.reconfigure(encoding='utf-8')

strings = sorted(vi_strings)
print(f"Total unique Vietnamese strings found: {len(strings)}")
print("=" * 60)
for s in strings:
    print(repr(s))
