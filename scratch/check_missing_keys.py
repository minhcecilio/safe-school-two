import re, sys, os
sys.stdout.reconfigure(encoding='utf-8')

with open('safe-school-two/src/js/firebaseConfig.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('const dictionaryMap = {')
end_idx = content.find('// --- NATIVE TRANSLATION ENGINE')

dict_block = content[start_idx:end_idx]

# Extract all "key": "value" inside dict_block
pairs = re.findall(r'"([^"]+)":\s*"([^"]+)"', dict_block)
en_dict = {}
# Find where en: { starts and zh: { starts
en_start = dict_block.find('en: {')
zh_start = dict_block.find('zh: {')
en_sub = dict_block[en_start:zh_start]

en_pairs = re.findall(r'"([^"]+)":\s*"([^"]+)"', en_sub)

print(f"Total EN pairs found: {len(en_pairs)}")
en_keys = set(k for k, v in en_pairs)

# Check missing HTML strings
base = r'd:\download\done'
html_files = []
for root, dirs, files in os.walk(base):
    if 'safe-school-two' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

vi_char_re = re.compile(r'[àáạảãăắặẳẵâấầẩẫèéẹẻẽêếềệểễìíịỉĩòóọỏõôốồổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹđ'
                         r'ÀÁẠẢÃĂẮẶẲẴÂẤẦẨẪÈÉẸẺẼÊẾỀỆỂỄÌÍỊỈĨÒÓỌỎÕÔỐỒỔỖƠỚỜỢỞỠÙÚỤỦŨƯỨỪỰỬỮỲÝỴỶỸĐ]')

html_strings = set()
for filepath in html_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            c = f.read()
    except:
        continue
    
    c = re.sub(r'<script[^>]*>.*?</script>', '', c, flags=re.DOTALL)
    c = re.sub(r'<style[^>]*>.*?</style>', '', c, flags=re.DOTALL)
    c = re.sub(r'<!--.*?-->', '', c, flags=re.DOTALL)
    
    texts = re.findall(r'>([^<]+)<', c)
    for t in texts:
        t = re.sub(r'\s+', ' ', t).strip()
        if not t or not vi_char_re.search(t):
            continue
        if '{' in t or ';' in t or '/*' in t or 'http' in t or '.html' in t or '.js' in t:
            continue
        if len(t) > 120:
            continue
        html_strings.add(t)
    
    for ph in re.findall(r'placeholder=["\']([^"\']+)["\']', c):
        ph = re.sub(r'\s+', ' ', ph).strip()
        if vi_char_re.search(ph):
            html_strings.add(ph)

missing = sorted([s for s in html_strings if s not in en_keys])
print(f"Total HTML strings: {len(html_strings)}")
print(f"Missing from EN dict: {len(missing)}")
for m in missing:
    print("MISSING:", repr(m))
