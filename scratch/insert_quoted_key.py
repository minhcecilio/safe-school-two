import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# Manual insert for the tricky key with escaped quotes
with open('safe-school-two/src/js/firebaseConfig.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the en: { section and a known key to insert after
# Insert after 'Chọn Tham vấn viên' for each language
insertions = {
    'en': 'Select a conversation from the left list or click \\"New Consultation\\" to start chatting.',
    'zh': '从左侧列表中选择一个对话，或点击"新建咨询"开始聊天。',
    'ko': '왼쪽 목록에서 대화를 선택하거나 "새 상담"을 클릭하여 대화를 시작하세요.',
    'es': 'Selecciona una conversación de la lista izquierda o haz clic en \\"Nueva Consulta\\" para chatear.',
    'pt': 'Selecione uma conversa da lista à esquerda ou clique em \\"Novo Aconselhamento\\" para iniciar.',
    'ru': 'Выберите беседу из списка слева или нажмите \\"Новая консультация\\", чтобы начать чат.',
    'ja': '左側のリストから会話を選択するか、「新規相談」をクリックしてチャットを開始してください。',
    'tl': 'Pumili ng usapan sa kaliwang listahan o i-click ang \\"Bagong Counseling\\" para magsimula.'
}

vi_key = 'Chọn một cuộc hội thoại ở danh sách bên trái hoặc bấm \\"Cuộc tư vấn mới\\" để bắt đầu trò chuyện.'

# Check if key already exists in any lang block
already = content.count('Chọn một cuộc hội thoại ở danh sách bên trái')
print(f"Already in file: {already} times")

if already < 8:
    # Insert in each language section - find en first
    start_idx = content.find('const dictionaryMap = {')
    end_idx = content.find('// Global reverse lookup to support switching')
    dict_block = content[start_idx:end_idx]
    
    for lang, translated in insertions.items():
        # Find anchor: 'Chọn Tham vấn viên': in this lang section
        lang_pos = dict_block.find(f'{lang}: {{')
        if lang_pos == -1:
            continue
        # Find end of this lang block
        anchor = '"Chọn Tham vấn viên":'
        anchor_pos = dict_block.find(anchor, lang_pos)
        if anchor_pos == -1:
            # fallback: insert right after lang: {
            insert_at = lang_pos + len(f'{lang}: {{')
        else:
            # find end of this line
            eol = dict_block.find('\n', anchor_pos)
            insert_at = eol + 1
        
        new_line = f'    "{vi_key}": "{translated}",\n'
        dict_block = dict_block[:insert_at] + new_line + dict_block[insert_at:]
    
    new_content = content[:start_idx] + dict_block + content[end_idx:]
    
    with open('safe-school-two/src/js/firebaseConfig.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    with open('src/js/firebaseConfig.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Inserted conversation key in all language sections!")
else:
    print("Key already exists enough times, no change needed")

# Verify
with open('safe-school-two/src/js/firebaseConfig.js', 'r', encoding='utf-8') as f:
    c = f.read()
count = c.count('Chọn một cuộc hội thoại ở danh sách bên trái')
print(f"After: key appears {count} times")
