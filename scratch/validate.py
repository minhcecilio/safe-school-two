import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('src/js/firebaseConfig.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('const dictionaryMap = {')
end_idx = content.find('// Global reverse lookup to support switching')
dict_block = content[start_idx:end_idx]

langs = ['en', 'zh', 'ko', 'es', 'pt', 'ru', 'ja', 'tl']
counts = {}
for lang in langs:
    lang_start = dict_block.find(f'{lang}: {{')
    next_lang_idx = len(dict_block)
    for other_lang in langs:
        if other_lang == lang:
            continue
        pos = dict_block.find(f'{other_lang}: {{', lang_start + 1)
        if pos != -1 and pos < next_lang_idx:
            next_lang_idx = pos
    lang_sub = dict_block[lang_start:next_lang_idx]
    # Count key-value pairs (approximate)
    pairs = len(re.findall(r'\"[^\"]+\":\s*\"', lang_sub))
    counts[lang] = pairs

print("Translation key counts per language:")
for lang, count in counts.items():
    print(f"  {lang}: {count} keys")

# Check key functions exist
funcs = ['applyGlobalTranslations', 'getTranslatedText', 'reverseToViMap']
print("\nKey functions present:")
for f_name in funcs:
    print(f"  {f_name}: {'YES' if f_name in content else 'NO'}")

# Check no syntax errors (basic)
open_braces = content.count('{')
close_braces = content.count('}')
print(f"\nBrace balance: {{ = {open_braces}, }} = {close_braces}")
