import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('safe-school-two/src/js/firebaseConfig.js', 'r', encoding='utf-8') as f:
    content = f.read()
start_idx = content.find('const dictionaryMap = {')
end_idx = content.find('// --- NATIVE TRANSLATION ENGINE')
print('start:', start_idx, 'end:', end_idx)
dict_block = content[start_idx:end_idx]
en_start = dict_block.find('en: {')
zh_start = dict_block.find('zh: {')
en_sub = dict_block[en_start:zh_start]
en_pairs = re.findall(r'"([^"]+)":\s*"([^"]+)"', en_sub)
en_keys = set(k for k, v in en_pairs)
key1 = 'Chọn một cuộc hội thoại ở danh sách bên trái hoặc bấm "Cuộc tư vấn mới" để bắt đầu trò chuyện.'
print('Key1 in en_keys:', key1 in en_keys)
print('Total EN keys:', len(en_keys))
# show relevant key if any near the mark
for k in sorted(en_keys):
    if 'Chọn' in k:
        print('Found similar:', repr(k))
