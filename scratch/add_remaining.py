import sys, os, re
sys.stdout.reconfigure(encoding='utf-8')

remaining = {
    'Chon mot cuoc hoi thoai': {
        "vi_key": 'Chọn một cuộc hội thoại ở danh sách bên trái hoặc bấm "Cuộc tư vấn mới" để bắt đầu trò chuyện.',
        "en": 'Select a conversation from the left list or click "New Consultation" to start chatting.',
        "zh": '从左侧列表中选择一个对话，或点击"新建咨询"开始聊天。',
        "ko": '왼쪽 목록에서 대화를 선택하거나 "새 상담"을 클릭하여 대화를 시작하세요.',
        "es": 'Selecciona una conversación de la lista izquierda o haz clic en "Nueva Consulta" para chatear.',
        "pt": 'Selecione uma conversa da lista à esquerda ou clique em "Novo Aconselhamento" para iniciar.',
        "ru": 'Выберите беседу из списка слева или нажмите "Новая консультация", чтобы начать чат.',
        "ja": '左側のリストから会話を選択するか、「新規相談」をクリックしてチャットを開始してください。',
        "tl": 'Pumili ng usapan sa kaliwang listahan o i-click ang "Bagong Counseling" para magsimula.'
    },
    'Goc chia se hoc sinh': {
        "vi_key": "Góc chia sẻ dành cho học sinh & bài tuyên truyền an toàn học đường",
        "en": "Sharing corner for students & school safety awareness posts",
        "zh": "学生分享角与校园安全宣传文章",
        "ko": "학생 공유 공간 및 학교 안전 홍보 게시글",
        "es": "Rincón de compartir para estudiantes y artículos de seguridad escolar",
        "pt": "Cantinho de compartilhamento para alunos e artigos de segurança escolar",
        "ru": "Уголок обмена для учеников и статьи по школьной безопасности",
        "ja": "生徒向け共有コーナーと学校安全啓発記事",
        "tl": "Sharing corner para sa mga estudyante at mga artikulo sa kaligtasan ng paaralan"
    },
    'Hinh anh video': {
        "vi_key": "Hình ảnh, video hoặc file ghi âm (Tối đa 5 file,",
        "en": "Images, videos or audio recordings (Max 5 files,",
        "zh": "图片、视频或录音文件（最多5个文件，",
        "ko": "이미지, 동영상 또는 음성 파일 (최대 5개,",
        "es": "Imágenes, videos o grabaciones de audio (Máximo 5 archivos,",
        "pt": "Imagens, vídeos ou gravações de áudio (Máximo 5 arquivos,",
        "ru": "Изображения, видео или аудиозаписи (Максимум 5 файлов,",
        "ja": "画像、動画または音声ファイル (最大5ファイル,",
        "tl": "Mga imahe, video o audio recording (Maximum 5 files,"
    },
    'He thong an toan': {
        "vi_key": "Hệ thống An toàn Học đường — Bảo vệ quyền lợi và sức khỏe tinh thần của mọi học sinh.",
        "en": "School Safety System — Protecting students' rights and mental well-being.",
        "zh": "校园安全系统 — 保护每位学生的权益与心理健康。",
        "ko": "학교 안전 시스템 — 모든 학생의 권리와 정신 건강을 보호합니다.",
        "es": "Sistema de Seguridad Escolar — Protegiendo los derechos y la salud mental de los estudiantes.",
        "pt": "Sistema de Segurança Escolar — Protegendo os direitos e a saúde mental dos alunos.",
        "ru": "Система школьной безопасности — Защита прав и психического здоровья учащихся.",
        "ja": "学校安全システム — 生徒の権利とメンタルヘルスを保護します。",
        "tl": "Sistema sa Kaligtasan ng Paaralan — Proteksyon sa karapatan at mental health ng mga mag-aaral."
    },
    'He thong toan dien': {
        "vi_key": "Hệ thống toàn diện giúp bảo vệ an toàn cho mọi học sinh",
        "en": "Comprehensive system to protect every student",
        "zh": "全面保护每位学生安全的系统",
        "ko": "모든 학생의 안전을 지키는 종합 시스템",
        "es": "Sistema integral para proteger a todos los estudiantes",
        "pt": "Sistema abrangente para proteger todos os alunos",
        "ru": "Комплексная система защиты каждого учащегося",
        "ja": "すべての生徒を守る包括的なシステム",
        "tl": "Komprehensibong sistema para protektahan ang bawat estudyante"
    },
    'Hop yeu cau nhom': {
        "vi_key": "Hộp yêu cầu tham gia nhóm",
        "en": "Group Join Requests",
        "zh": "入群申请箱",
        "ko": "그룹 가입 요청함",
        "es": "Solicitudes de ingreso al grupo",
        "pt": "Solicitações de entrada no grupo",
        "ru": "Запросы на вступление в группу",
        "ja": "グループ参加リクエスト",
        "tl": "Group Join Requests"
    },
    'Lien ket': {
        "vi_key": "Liên kết",
        "en": "Link",
        "zh": "链接",
        "ko": "링크",
        "es": "Enlace",
        "pt": "Link",
        "ru": "Ссылка",
        "ja": "リンク",
        "tl": "Link"
    },
    'Mat khau hien tai': {
        "vi_key": "Mật khẩu hiện tại (Cần thiết khi đổi Email/Mật khẩu)",
        "en": "Current Password (Required when changing Email/Password)",
        "zh": "当前密码（修改邮箱/密码时需要）",
        "ko": "현재 비밀번호 (이메일/비밀번호 변경 시 필요)",
        "es": "Contraseña actual (Requerida al cambiar Email/Contraseña)",
        "pt": "Senha atual (Necessária ao alterar Email/Senha)",
        "ru": "Текущий пароль (Необходим при смене Email/пароля)",
        "ja": "現在のパスワード (メール/パスワード変更時に必要)",
        "tl": "Kasalukuyang Password (Kailangan kapag binabago ang Email/Password)"
    },
    'Mat khau hien tai placeholder': {
        "vi_key": "Mật khẩu hiện tại...",
        "en": "Current password...",
        "zh": "当前密码...",
        "ko": "현재 비밀번호...",
        "es": "Contraseña actual...",
        "pt": "Senha atual...",
        "ru": "Текущий пароль...",
        "ja": "現在のパスワード...",
        "tl": "Kasalukuyang password..."
    },
    'Mat khau moi 6': {
        "vi_key": "Mật khẩu mới (ít nhất 6 ký tự)",
        "en": "New password (at least 6 characters)",
        "zh": "新密码（至少6个字符）",
        "ko": "새 비밀번호 (최소 6자)",
        "es": "Nueva contraseña (al menos 6 caracteres)",
        "pt": "Nova senha (pelo menos 6 caracteres)",
        "ru": "Новый пароль (не менее 6 символов)",
        "ja": "新しいパスワード (6文字以上)",
        "tl": "Bagong password (hindi bababa sa 6 characters)"
    },
    'Mat khau xac nhan': {
        "vi_key": "Mật khẩu xác nhận không khớp",
        "en": "Password confirmation does not match",
        "zh": "密码确认不匹配",
        "ko": "비밀번호 확인이 일치하지 않습니다",
        "es": "La confirmación de contraseña no coincide",
        "pt": "A confirmação de senha não corresponde",
        "ru": "Подтверждение пароля не совпадает",
        "ja": "パスワード確認が一致しません",
        "tl": "Hindi tugma ang password confirmation"
    },
    'Tu van tam ly emoji': {
        "vi_key": "Tư vấn tâm lý 💬",
        "en": "Counseling 💬",
        "zh": "心理咨询 💬",
        "ko": "심리 상담 💬",
        "es": "Consejería 💬",
        "pt": "Aconselhamento 💬",
        "ru": "Консультации 💬",
        "ja": "カウンセリング 💬",
        "tl": "Counseling 💬"
    }
}

# Read firebaseConfig file
with open('src/js/firebaseConfig.js', 'r', encoding='utf-8') as f:
    content = f.read()

dict_start = content.find('const dictionaryMap = {')
dict_end = content.find('// Global reverse lookup to support switching')
dict_str = content[dict_start:dict_end]

for lang in ['en', 'zh', 'ko', 'es', 'pt', 'ru', 'ja', 'tl']:
    lang_start = dict_str.find(f'{lang}: {{')
    if lang_start == -1:
        continue
    insert_pos = lang_start + len(f'{lang}: {{')
    lines_to_add = []
    for entry_key, trans_dict in remaining.items():
        vi_key = trans_dict.get('vi_key', entry_key)
        val = trans_dict.get(lang, trans_dict.get('en'))
        if val:
            escaped_key = vi_key.replace('\\', '\\\\').replace('"', '\\"')
            escaped_val = val.replace('\\', '\\\\').replace('"', '\\"')
            lines_to_add.append(f'    "{escaped_key}": "{escaped_val}",')
    
    if lines_to_add:
        addition = '\n' + '\n'.join(lines_to_add)
        dict_str = dict_str[:insert_pos] + addition + dict_str[insert_pos:]

new_content = content[:dict_start] + dict_str + content[dict_end:]

with open('src/js/firebaseConfig.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

with open('safe-school-two/src/js/firebaseConfig.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Added remaining translations successfully!")
print("Final file size:", len(new_content), "bytes")
