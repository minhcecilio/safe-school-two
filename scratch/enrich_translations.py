import sys, os, json, re
sys.stdout.reconfigure(encoding='utf-8')

extra_translations = {
    "+ Tư vấn mới": { "en": "+ New Consultation", "zh": "+ 新建咨询", "ko": "+ 새 상담", "es": "+ Nueva Consulta", "pt": "+ Novo Aconselhamento", "ru": "+ Новая консультация", "ja": "+ 新規相談", "tl": "+ Bagong Counseling" },
    "+ Đăng bài viết": { "en": "+ Post Article", "zh": "+ 发布文章", "ko": "+ 게시글 작성", "es": "+ Crear Publicación", "pt": "+ Criar Publicación", "ru": "+ Создать запись", "ja": "+ 記事投稿", "tl": "+ Sumulat ng Artikulo" },
    "7 ngày gần nhất": { "en": "Last 7 days", "zh": "最近7天", "ko": "최근 7일", "es": "Últimos 7 días", "pt": "Últimos 7 dias", "ru": "Последние 7 дней", "ja": "過去7日間", "tl": "Huling 7 araw" },
    "An toàn": { "en": "Safety", "zh": "安全", "ko": "안전", "es": "Seguridad", "pt": "Segurança", "ru": "Безопасность", "ja": "安全", "tl": "Kaligtasan" },
    "An toàn không gian mạng": { "en": "Cyber Safety", "zh": "网络安全", "ko": "사이버 안전", "es": "Seguridad Cibernética", "pt": "Segurança Cibernética", "ru": "Кибербезопасность", "ja": "サイバーセキュリティ", "tl": "Kaligtasan sa Cyber" },
    "An toàn mạng": { "en": "Cyber Safety", "zh": "网络安全", "ko": "사이버 안전", "es": "Seguridad Cibernética", "pt": "Segurança Cibernética", "ru": "Кибербезопасность", "ja": "サイバーセキュリティ", "tl": "Kaligtasan sa Cyber" },
    "An toàn • Tin cậy • Bảo mật": { "en": "Safe • Trusted • Secure", "zh": "安全 • 可信 • 保密", "ko": "안전 • 신뢰 • 보안", "es": "Seguro • Confiable • Confidencial", "pt": "Seguro • Confiável • Confidencial", "ru": "Безопасно • Надежно • Конфиденциально", "ja": "安全 • 信頼 • 機密", "tl": "Ligtas • Pinagkakatiwalaan • Protektado" },
    "Bài test tâm lý": { "en": "Psychological Test", "zh": "心理测试", "ko": "심리 검사", "es": "Prueba Psicológica", "pt": "Teste Psicológico", "ru": "Психологический тест", "ja": "心理テスト", "tl": "Pagsusuri sa Mental Health" },
    "Bài test tâm lý - Safe School": { "en": "Psychological Test - Safe School", "zh": "心理测试 - Safe School", "ko": "심리 검사 - Safe School", "es": "Prueba Psicológica - Safe School", "pt": "Teste Psicológico - Safe School", "ru": "Психологический тест - Safe School", "ja": "心理テスト - Safe School", "tl": "Pagsusuri sa Mental Health - Safe School" },
    "Bài tuyên truyền": { "en": "Propaganda Posts", "zh": "宣传文章", "ko": "홍보 게시글", "es": "Artículos", "pt": "Artigos", "ru": "Статьи", "ja": "宣伝・記事", "tl": "Mga Artikulo" },
    "Bài tuyên truyền - Safe School": { "en": "Propaganda Posts - Safe School", "zh": "宣传文章 - Safe School", "ko": "홍보 게시글 - Safe School", "es": "Artículos - Safe School", "pt": "Artigos - Safe School", "ru": "Статьи - Safe School", "ja": "宣伝・記事 - Safe School", "tl": "Mga Artikulo - Safe School" },
    "Báo Cáo Khẩn Cấp": { "en": "Emergency SOS Report", "zh": "紧急SOS报告", "ko": "긴급 SOS 보고서", "es": "Reporte de Emergencia SOS", "pt": "Relatório de Emergência SOS", "ru": "Экстренный отчет SOS", "ja": "緊急SOS通報", "tl": "Emergency SOS Report" },
    "Báo cáo bạo lực học đường": { "en": "Report School Violence", "zh": "举报校园暴力", "ko": "학교 폭력 신고", "es": "Reportar Violencia Escolar", "pt": "Denunciar Violência Escolar", "ru": "Сообщить о школьном насилии", "ja": "いじめ・暴力通報", "tl": "I-report ang Bullying" },
    "Báo cáo khẩn cấp (SOS) - Safe School": { "en": "Emergency SOS Report - Safe School", "zh": "紧急SOS报告 - Safe School", "ko": "긴급 SOS 보고서 - Safe School", "es": "Reporte de Emergencia SOS - Safe School", "pt": "Relatório de Emergência SOS - Safe School", "ru": "Экстренный отчет SOS - Safe School", "ja": "緊急SOS通報 - Safe School", "tl": "Emergency SOS Report - Safe School" },
    "Báo cáo khẩn cấp SOS": { "en": "Emergency SOS Report", "zh": "紧急SOS报告", "ko": "긴급 SOS 보고서", "es": "Reporte de Emergencia SOS", "pt": "Relatório de Emergência SOS", "ru": "Экстренный отчет SOS", "ja": "緊急SOS通報", "tl": "Emergency SOS Report" },
    "Báo cáo khẩn cấp của bạn đã được tiếp nhận. Đội phản ứng nhanh của nhà trường đang được điều động.": {
        "en": "Your emergency report has been received. The school rapid response team is dispatched.",
        "zh": "您的紧急报告已收到。学校快速响应小组正在被调动。",
        "ko": "긴급 보고서가 접수되었습니다. 학교 신속 대응 팀이 출동 중입니다.",
        "es": "Se ha recibido su reporte de emergencia. El equipo de respuesta rápida de la escuela está siendo movilizado.",
        "pt": "Seu relatório de emergência foi recebido. A equipe de resposta rápida da escola está sendo acionada.",
        "ru": "Ваш экстренный отчет получен. Группа быстрого реагирования школы направлена.",
        "ja": "緊急通報を受信しました。学校の迅速対応チームが出動しています。",
        "tl": "Natanggap na ang iyong emergency report. Tinatawag na ang rapid response team ng paaralan."
    },
    "Báo cáo tổng hợp số liệu bạo lực học đường, tiến độ xử lý và thống kê người dùng (Chỉ dành cho Admin)": {
        "en": "Summary report of school violence data, resolution progress and user statistics (Admin only)",
        "zh": "校园暴力数据、处理进度和用户统计汇总报告（仅限管理员）",
        "ko": "학교 폭력 데이터, 처리 경과 및 사용자 통계 요약 보고서 (관리자 전용)",
        "es": "Resumen de datos de violencia escolar, progreso y estadísticas de usuarios (Solo Admin)",
        "pt": "Relatório resumido de violência escolar, progresso e estatísticas (Apenas Admin)",
        "ru": "Сводный отчет о школьном насилии, ходе работы и статистике (Только для админа)",
        "ja": "学校暴力データ、対応進捗、ユーザー統計の要約レポート (管理者専用)",
        "tl": "Buod ng data sa bullying, progreso sa pag-resolba at statistik ng user (Admin lamang)"
    },
    "Bảng Thống Kê Số Liệu Hệ Thống": { "en": "System Statistics Dashboard", "zh": "系统数据统计表", "ko": "시스템 통계 대시보드", "es": "Panel de Estadísticas del Sistema", "pt": "Painel de Estatísticas do Sistema", "ru": "Панель статистики системы", "ja": "システム統計ダッシュボード", "tl": "Dashboard ng Statistik ng Sistema" },
    "Báo cáo đã được gửi thành công!": { "en": "Report submitted successfully!", "zh": "报告提交成功！", "ko": "보고서가 성공적으로 제출되었습니다!", "es": "¡Reporte enviado con éxito!", "pt": "Relatório enviado com sucesso!", "ru": "Отчет успешно отправлен!", "ja": "通報が正常に送信されました！", "tl": "Matagumpay na na-submit ang report!" },
    "Bạn cần đồng ý với điều khoản sử dụng": { "en": "You must agree to the Terms of Service", "zh": "您必须同意使用条款", "ko": "이용약관에 동의해야 합니다", "es": "Debes aceptar los Términos de Servicio", "pt": "Você deve concordar com os Termos de Serviço", "ru": "Вы должны согласиться с Условиями использования", "ja": "利用規約に同意する必要があります", "tl": "Kailangan mong sumang-ayon sa Mga Tuntunin ng Serbisyo" },
    "Bạn muốn chia sẻ điều gì với cộng đồng hôm nay?...": { "en": "What would you like to share with the community today?...", "zh": "今天想和社区分享些什么？...", "ko": "오늘 커뮤니티와 어떤 이야기를 나누고 싶으신가요?...", "es": "¿Qué te gustaría compartir con la comunidad hoy?...", "pt": "O que você gostaria de compartilhar com a comunidade hoje?...", "ru": "Чем бы вы хотели поделиться с сообществом сегодня?...", "ja": "今日コミュニティと何を共有したいですか？...", "tl": "Ano ang gusto mong i-share sa komunidad ngayon?..." },
    "Bạn đang gặp": { "en": "You are experiencing", "zh": "您遇到了", "ko": "겪고 계신 문제", "es": "Estás experimentando", "pt": "Você está enfrentando", "ru": "Вы сталкиваетесь с", "ja": "直面している問題", "tl": "Karanasan mo ngayon" },
    "Bạo lực ngôn từ / Đe dọa": { "en": "Verbal abuse / Threats", "zh": "言语暴力 / 威胁", "ko": "언어 폭력 / 협박", "es": "Abuso verbal / Amenazas", "pt": "Abuso verbal / Ameaças", "ru": "Словесное насилие / Угрозы", "ja": "暴言 / 脅迫", "tl": "Pang-aabusong berbal / Banta" },
    "Bạo lực nhóm / Đông người": { "en": "Group violence / Gangs", "zh": "群体暴力 / 多人", "ko": "집단 폭력 / 다수인", "es": "Violencia grupal / Multitud", "pt": "Violência em grupo / Gangues", "ru": "Групповое насилие", "ja": "集団暴力 / 複数人", "tl": "Grupong karahasan" },
    "Bạo lực thể chất (đánh nhau)": { "en": "Physical violence (fighting)", "zh": "肢体暴力 (打架)", "ko": "신체적 폭력 (싸움)", "es": "Violencia física (peleas)", "pt": "Violência física (brigas)", "ru": "Физическое насилие (драки)", "ja": "身体的暴力 (殴り合い)", "tl": "Pisikal na karahasan" },
    "Bảo vệ": { "en": "Protect", "zh": "保护", "ko": "보호", "es": "Proteger", "pt": "Proteger", "ru": "Защищать", "ja": "保護", "tl": "Protektahan" },
    "Bắt nạt trực tuyến (Cyberbullying)": { "en": "Cyberbullying", "zh": "网络欺凌", "ko": "사이버 괴롭힘", "es": "Ciberacoso", "pt": "Cyberbullying", "ru": "Кибербуллинг", "ja": "ネットいじめ", "tl": "Cyberbullying" },
    "Bắt đầu": { "en": "Get Started", "zh": "开始使用", "ko": "시작하기", "es": "Comenzar", "pt": "Começar", "ru": "Начать", "ja": "始める", "tl": "Magsimula" },
    "Bằng chứng đính kèm": { "en": "Attached Evidence", "zh": "附带证据", "ko": "첨부 증거", "es": "Evidencia Adjunta", "pt": "Evidência Anexa", "ru": "Приложенные доказательства", "ja": "添付証拠", "tl": "Nakakabit na Ebidensya" },
    "CCCD không hợp lệ": { "en": "Invalid National ID", "zh": "身份证号无效", "ko": "유효하지 않은 신분증 번호", "es": "Documento ID inválido", "pt": "Documento ID inválido", "ru": "Недействительный номер удостоверения", "ja": "無効な身分証明書番号", "tl": "Invalid na ID Number" },
    "Chi tiết Báo cáo": { "en": "Report Details", "zh": "报告详情", "ko": "보고서 상세", "es": "Detalles del Reporte", "pt": "Detalhes do Relatório", "ru": "Детали отчета", "ja": "通報の詳細", "tl": "Mga Detalye ng Report" },
    "Chi tiết bài viết - Safe School": { "en": "Article Details - Safe School", "zh": "文章详情 - Safe School", "ko": "게시글 상세 - Safe School", "es": "Detalles del Artículo - Safe School", "pt": "Detalhes do Artigo - Safe School", "ru": "Детали статьи - Safe School", "ja": "記事の詳細 - Safe School", "tl": "Mga Detalye ng Artikulo - Safe School" },
    "Chi tiết báo cáo - Safe School": { "en": "Report Details - Safe School", "zh": "报告详情 - Safe School", "ko": "보고서 상세 - Safe School", "es": "Detalles del Reporte - Safe School", "pt": "Detalhes do Relatório - Safe School", "ru": "Детали отчета - Safe School", "ja": "通報の詳細 - Safe School", "tl": "Mga Detalye ng Report - Safe School" },
    "Chi tiết sự việc": { "en": "Incident Details", "zh": "事件详情", "ko": "사건 상세", "es": "Detalles del Incidente", "pt": "Detalhes do Incidente", "ru": "Детали происшествия", "ja": "事案の詳細", "tl": "Mga Detalye ng Insidente" },
    "Chào mừng trở lại": { "en": "Welcome back", "zh": "欢迎回来", "ko": "환영합니다", "es": "Bienvenido de nuevo", "pt": "Bem-vindo de volta", "ru": "С возвращением", "ja": "おかえりなさい", "tl": "Maligayang pagbabalik" },
    "Chính sách bảo mật": { "en": "Privacy Policy", "zh": "隐私政策", "ko": "개인정보 처리방침", "es": "Política de Privacidad", "pt": "Política de Privacidade", "ru": "Политикой конфиденциальности", "ja": "プライバシーポリシー", "tl": "Patakaran sa Pagkapribado" },
    "Chưa có bạn bè nào.": { "en": "No friends yet.", "zh": "暂无好友。", "ko": "아직 친구가 없습니다.", "es": "Aún no tienes amigos.", "pt": "Nenhum amigo ainda.", "ru": "Пока нет друзей.", "ja": "まだ友達がいません。", "tl": "Wala pang kaibigan." },
    "Chưa có dữ liệu": { "en": "No data available", "zh": "暂无数据", "ko": "데이터 없음", "es": "Sin datos disponibles", "pt": "Sem dados disponíveis", "ru": "Нет данных", "ja": "データなし", "tl": "Walang data" },
    "Chưa có tài khoản?": { "en": "Don't have an account?", "zh": "还没有账号？", "ko": "계정이 없으신가요?", "es": "¿No tienes cuenta?", "pt": "Não tem uma conta?", "ru": "Нет аккаунта?", "ja": "アカウントをお持ちでないですか？", "tl": "Wala pang account?" },
    "Chế độ xem kiểm duyệt (Chỉ xem)": { "en": "Moderation View Mode (Read-only)", "zh": "审核查看模式 (仅查看)", "ko": "검열 보기 모드 (읽기 전용)", "es": "Modo de Vista de Moderación (Solo lectura)", "pt": "Modo de Visualização de Moderação (Apenas leitura)", "ru": "Режим модерации (только просмотр)", "ja": "閲覧・モデレーションモード (閲覧のみ)", "tl": "Moderation View Mode (Read-only)" },
    "Chỉnh sửa tin nhắn": { "en": "Edit message", "zh": "编辑消息", "ko": "메시지 수정", "es": "Editar mensaje", "pt": "Editar mensagem", "ru": "Редактировать сообщение", "ja": "メッセージを編集", "tl": "I-edit ang mensahe" },
    "Chọn Tham vấn viên": { "en": "Select Counselor", "zh": "选择咨询师", "ko": "상담사 선택", "es": "Seleccionar Consejero", "pt": "Selecionar Conselheiro", "ru": "Выбрать консультанта", "ja": "カウンセラーを選択", "tl": "Pumili ng Tagapayo" },
    "Chọn một cuộc hội thoại ở danh sách bên trái hoặc bấm \"Cuộc tư vấn mới\" để bắt đầu trò chuyện.": {
        "en": "Select a conversation from the left list or click \"New Consultation\" to start chatting.",
        "zh": "从左侧列表中选择一个对话，或点击“新建咨询”开始聊天。",
        "ko": "왼쪽 목록에서 대화를 선택하거나 \"새 상담\"을 클릭하여 대화를 시작하세요.",
        "es": "Selecciona una conversación de la lista izquierda o haz clic en \"Nueva Consulta\" para chatear.",
        "pt": "Selecione uma conversa da lista à esquerda ou clique em \"Novo Aconselhamento\" para iniciar.",
        "ru": "Выберите беседу из списка слева или нажмите \"Новая консультация\", чтобы начать чат.",
        "ja": "左側のリストから会話を選択するか、「新規相談」をクリックしてチャットを開始してください。",
        "tl": "Pumili ng usapan sa kaliwang listahan o i-click ang \"Bagong Counseling\" para magsimula."
    },
    "Chọn loại sự việc": { "en": "Select incident type", "zh": "选择事件类型", "ko": "사건 유형 선택", "es": "Seleccionar tipo de incidente", "pt": "Selecionar tipo de incidente", "ru": "Выбрать тип происшествия", "ja": "事案のタイプを選択", "tl": "Pumili ng uri ng insidente" },
    "Chọn màu sắc hoặc chủ đề bạn yêu thích:": { "en": "Select your favorite color or theme:", "zh": "选择您喜欢的颜色或主题：", "ko": "선호하는 색상이나 테마를 선택하세요:", "es": "Selecciona tu color o tema favorito:", "pt": "Selecione sua cor ou tema favorito:", "ru": "Выберите любимый цвет или тему:", "ja": "お気に入りの色やテーマを選択:", "tl": "Pumili ng kulay o tema na gusto mo:" },
    "Chọn vai trò của bạn": { "en": "Select your role", "zh": "选择您的角色", "ko": "역할을 선택하세요", "es": "Selecciona tu rol", "pt": "Selecione sua função", "ru": "Выберите вашу роль", "ja": "役割を選択してください", "tl": "Pumili ng iyong role" },
    "Click để chọn file": { "en": "Click to select file", "zh": "点击选择文件", "ko": "클릭하여 파일 선택", "es": "Haz clic para seleccionar archivo", "pt": "Clique para selecionar o arquivo", "ru": "Нажмите, чтобы выбрать файл", "ja": "クリックしてファイルを選択", "tl": "I-click para pumili ng file" },
    "Cuộc gọi đến...": { "en": "Incoming call...", "zh": "来电中...", "ko": "전화 오는 중...", "es": "Llamada entrante...", "pt": "Chamada recebida...", "ru": "Входящий вызов...", "ja": "着信中...", "tl": "Papapasok na tawag..." },
    "Cuộc hội thoại / Thành viên": { "en": "Conversations / Members", "zh": "会话 / 成员", "ko": "대화 / 멤버", "es": "Conversaciones / Miembros", "pt": "Conversas / Membros", "ru": "Беседы / Участники", "ja": "会話 / メンバー", "tl": "Mga Usapan / Miyembro" },
    "CÁ NHÂN": { "en": "PERSONAL", "zh": "个人中心", "ko": "마이페이지", "es": "PERSONAL", "pt": "PESSOAL", "ru": "ЛИЧНОЕ", "ja": "個人メニュー", "tl": "PERSONAL" },
    "Cài đặt Tài khoản & Bảo mật": { "en": "Account & Security Settings", "zh": "账户与安全设置", "ko": "계정 및 보안 설정", "es": "Configuración de Cuenta y Seguridad", "pt": "Configurações de Conta e Segurança", "ru": "Настройки аккаунта и безопасности", "ja": "アカウントとセキュリティの設定", "tl": "Account at Security Settings" },
    "Các lời mời kết bạn đang chờ bạn phản hồi:": { "en": "Friend requests waiting for your response:", "zh": "等待您回应的好友请求：", "ko": "응답을 기다리는 친구 요청:", "es": "Solicitudes de amistad esperando tu respuesta:", "pt": "Pedidos de amizade aguardando sua resposta:", "ru": "Запросы в друзья, ожидающие ответа:", "ja": "承認待ちの友達リクエスト:", "tl": "Mga friend request na naghihintay ng iyong sagot:" },
    "Các lời mời vào nhóm đang chờ bạn xử lý:": { "en": "Group invitations waiting for your action:", "zh": "等待您处理的群邀请：", "ko": "처리를 기다리는 그룹 초대:", "es": "Invitaciones de grupo esperando tu acción:", "pt": "Convites de grupo aguardando sua ação:", "ru": "Приглашения в группу, ожидающие ответа:", "ja": "保留中のグループ招待:", "tl": "Mga group invitation na naghihintay sa iyo:" },
    "Có vũ khí / vật nguy hiểm": { "en": "Weapons / Dangerous items present", "zh": "有武器 / 危险物品", "ko": "무기 / 위험물 있음", "es": "Armas / Objetos peligrosos presentes", "pt": "Armas / Objetos perigosos presentes", "ru": "Имеется оружие / опасные предметы", "ja": "武器・危険物あり", "tl": "May dalang sandata / delikadong bagay" },
    "Cộng Đồng Safe School": { "en": "Safe School Community", "zh": "Safe School 社区", "ko": "Safe School 커뮤니티", "es": "Comunidad Safe School", "pt": "Comunidade Safe School", "ru": "Сообщество Safe School", "ja": "Safe School コミュニティ", "tl": "Komunidad ng Safe School" },
    "Danh mục": { "en": "Category", "zh": "分类", "ko": "카테고리", "es": "Categoría", "pt": "Categoria", "ru": "Категория", "ja": "カテゴリー", "tl": "Kategorya" },
    "Danh sách các chuyên gia tư vấn tâm lý sẵn sàng hỗ trợ bạn:": {
        "en": "List of psychological counselors ready to assist you:",
        "zh": "准备为您提供帮助的心理咨询师列表：",
        "ko": "도움을 줄 준비가 된 심리 상담사 목록:",
        "es": "Lista de consejeros psicológicos listos para ayudarte:",
        "pt": "Lista de conselheiros psicológicos prontos para ajudá-lo:",
        "ru": "Список психологов-консультантов, готовых помочь вам:",
        "ja": "サポート可能な心理カウンセラーのリスト:",
        "tl": "Listahan ng mga tagapayo na handang tumulong sa iyo:"
    },
    "Dành riêng cho người có thẩm quyền: Đổi vai trò, Kiểm tra trạng thái, Khóa hoặc Xóa tài khoản": {
        "en": "Authorized personnel only: Change roles, Check status, Lock or Delete accounts",
        "zh": "仅限授权人员：修改角色、检查状态、锁定或删除账号",
        "ko": "권한이 있는 사람 전용: 역할 변경, 상태 확인, 계정 잠금 또는 삭제",
        "es": "Solo personal autorizado: Cambiar roles, Verificar estado, Bloquear o Eliminar cuentas",
        "pt": "Apenas pessoal autorizado: Alterar funções, Verificar status, Bloquear ou Excluir contas",
        "ru": "Только для уполномоченных: смена ролей, проверка статуса, блокировка или удаление аккаунтов",
        "ja": "有権者専用: 役割の変更、ステータス確認、アカウントのロックまたは削除",
        "tl": "Para lamang sa may awtoridad: Pagpalit ng role, pag-check ng status, pag-lock o pag-delete ng account"
    },
    "Email / SĐT": { "en": "Email / Phone", "zh": "邮箱 / 手机", "ko": "이메일 / 전화번호", "es": "Correo / Teléfono", "pt": "E-mail / Telefone", "ru": "Email / Телефон", "ja": "メール・電話番号", "tl": "Email / Telepono" },
    "Email không hợp lệ": { "en": "Invalid email", "zh": "邮箱格式不正确", "ko": "유효하지 않은 이메일입니다", "es": "Correo electrónico inválido", "pt": "E-mail inválido", "ru": "Недействительный email", "ja": "無効なメールアドレス", "tl": "Invalid na email" },
    "Email liên hệ": { "en": "Contact Email", "zh": "联系邮箱", "ko": "연락처 이메일", "es": "Correo de contacto", "pt": "E-mail de contato", "ru": "Контактный email", "ja": "連絡先メールアドレス", "tl": "Contact Email" },
    "Ghi nhận cảm xúc mỗi ngày giúp bạn hiểu rõ bản thân hơn.": {
        "en": "Logging your feelings daily helps you understand yourself better.",
        "zh": "每天记录情绪有助于您更好地了解自己。",
        "ko": "매일 감정을 기록하면 자신을 더 잘 이해하는 데 도움이 됩니다.",
        "es": "Registrar tus sentimientos diariamente te ayuda a entenderte mejor.",
        "pt": "Registrar seus sentimentos diariamente ajuda você a se entender melhor.",
        "ru": "Ежедневная фиксация эмоций помогает лучше понять себя.",
        "ja": "毎日感情を記録することで、自分自身をよりよく理解できるようになります。",
        "tl": "Ang pag-record ng nararamdaman araw-araw ay tumutulong upang mas maintindihan ang sarili."
    },
    "Ghi nhớ đăng nhập": { "en": "Remember me", "zh": "记住登录", "ko": "로그인 유지", "es": "Recordarme", "pt": "Lembrar de mim", "ru": "Запомнить меня", "ja": "ログイン状態を保持", "tl": "Tandaan ako" },
    "Giáo viên / Quản lý": { "en": "Teacher / Manager", "zh": "老师 / 管理员", "ko": "교사 / 관리자", "es": "Profesor / Administrador", "pt": "Professor / Gestor", "ru": "Учитель / Менеджер", "ja": "教師・管理者", "tl": "Guro / Manager" },
    "Góc chia sẻ": { "en": "Sharing Corner", "zh": "分享角", "ko": "공유 공간", "es": "Rincón de Compartir", "pt": "Cantinho de Compartilhamento", "ru": "Уголок обмена", "ja": "共有コーナー", "tl": "Sharing Corner" },
    "Góc pháp luật": { "en": "Legal Knowledge", "zh": "法律知识", "ko": "법률 지식", "es": "Conocimientos Legales", "pt": "Conhecimento Legal", "ru": "Правовая информация", "ja": "法律知識", "tl": "Kaalamang Legal" },
    "Gửi Báo cáo": { "en": "Submit Report", "zh": "提交报告", "ko": "보고서 제출", "es": "Enviar Reporte", "pt": "Enviar Relatório", "ru": "Отправить отчет", "ja": "通報する", "tl": "Mag-submit ng Report" },
    "Gửi báo cáo bạo lực học đường": { "en": "Report School Violence", "zh": "举报校园暴力", "ko": "학교 폭력 신고", "es": "Reportar Violencia Escolar", "pt": "Denunciar Violência Escolar", "ru": "Сообщить о школьном насилии", "ja": "いじめ・暴力通報", "tl": "I-report ang Bullying" },
    "Gửi báo cáo bạo lực học đường - Safe School": { "en": "Report School Violence - Safe School", "zh": "举报校园暴力 - Safe School", "ko": "학교 폭력 신고 - Safe School", "es": "Reportar Violencia Escolar - Safe School", "pt": "Denunciar Violência Escolar - Safe School", "ru": "Сообщить о школьном насилии - Safe School", "ja": "いじめ・暴力通報 - Safe School", "tl": "I-report ang Bullying - Safe School" },
    "Gửi báo cáo chi tiết kèm bằng chứng, ẩn danh hoặc công khai. Mỗi báo cáo được cấp mã theo dõi riêng.": {
        "en": "Submit detailed report with evidence, anonymously or publicly. Each report receives a unique tracking code.",
        "zh": "提交附带证据的详细报告，可选择匿名或公开。每份报告都将获得独立的跟踪代码。",
        "ko": "증거를 첨부하여 익명 또는 공개로 상세 보고서를 제출하세요. 각 보고서에는 고유 추적 코드가 부여됩니다.",
        "es": "Envía un reporte detallado con pruebas, de forma anónima o pública. Cada reporte recibe un código de seguimiento único.",
        "pt": "Envie um relatório detalhado com evidências, anônimo ou público. Cada relatório recebe um código de rastreamento único.",
        "ru": "Отправьте подробный отчет с доказательствами, анонимно или публично. Каждому отчету присваивается код отслеживания.",
        "ja": "証拠を添付して匿名または公開で詳細レポートを送信します。各レポートには専用の追跡コードが発行されます。",
        "tl": "Mag-submit ng detalyadong report kasama ang ebidensya, anonymous o pampubliko. May sariling tracking code ang bawat report."
    },
    "Gửi báo cáo nhanh không cần đăng nhập. Chia sẻ vị trí trực tiếp để hỗ trợ kịp thời trong trường hợp nguy hiểm.": {
        "en": "Send quick report without logging in. Share live location for immediate emergency assistance.",
        "zh": "无需登录即可快速发送报告。直接共享位置，以便在危险情况下及时提供支持。",
        "ko": "로그인 없이 빠른 보고서를 보내세요. 위험한 상황에서 즉각적인 지원을 위해 실시간 위치를 공유합니다.",
        "es": "Envía un reporte rápido sin iniciar sesión. Comparte ubicación en vivo para asistencia inmediata en caso de peligro.",
        "pt": "Envie um relatório rápido sem fazer login. Compartilhe a localização em tempo real para assistência imediata.",
        "ru": "Быстрый отчет без входа в систему. Делитесь местоположением для экстренной помощи.",
        "ja": "ログイン不要で迅速通報。危険な状況で即座にサポートを受けるため位置情報を共有します。",
        "tl": "Mag-send ng mabilis na report nang hindi kailangang mag-login. I-share ang lokasyon para sa agarang tulong."
    },
    "Gửi báo cáo ẩn danh (Thông tin cá nhân của bạn sẽ không hiển thị với người tiếp nhận)": {
        "en": "Send anonymous report (Your personal information will not be shown to recipient)",
        "zh": "发送匿名报告（接收方不会看到您的个人信息）",
        "ko": "익명 보고서 제출 (수신자에게 개인정보가 표시되지 않습니다)",
        "es": "Enviar reporte anónimo (Tu información personal no se mostrará al receptor)",
        "pt": "Enviar relatório anônimo (Suas informações pessoais não serão exibidas ao destinatário)",
        "ru": "Отправить анонимный отчет (Ваша личная информация не будет видна получателю)",
        "ja": "匿名で通報を送信 (受信者に個人情報は表示されません)",
        "tl": "Mag-send ng anonymous report (Hindi makikita ng tatanggap ang personal mong impormasyon)"
    },
    "Hoàng hôn": { "en": "Sunset", "zh": "日落", "ko": "노을", "es": "Atardecer", "pt": "Pôr do sol", "ru": "Закат", "ja": "夕焼け", "tl": "Sunset" },
    "Hôm nay bạn cảm thấy thế nào?": { "en": "How are you feeling today?", "zh": "今天感觉怎么样？", "ko": "오늘 기분이 어떠신가요?", "es": "¿Cómo te sientes hoy?", "pt": "Como você está se sentindo hoje?", "ru": "Как вы себя чувствуете сегодня?", "ja": "今日の気分はいかがですか？", "tl": "Kamusta ang pakiramdam mo ngayon?" },
    "Hệ thống": { "en": "System", "zh": "系统", "ko": "시스템", "es": "Sistema", "pt": "Sistema", "ru": "Система", "ja": "システム", "tl": "Sistema" },
    "Học đường cho mọi người": { "en": "School Safety for Everyone", "zh": "全民校园安全", "ko": "모두를 위한 학교 안전", "es": "Seguridad escolar para todos", "pt": "Segurança escolar para todos", "ru": "Школа безопасности для всех", "ja": "みんなの学校安全", "tl": "Ligtas na Paaralan para sa lahat" },
    "Hồ sơ cá nhân": { "en": "Personal Profile", "zh": "个人资料", "ko": "개인 프로필", "es": "Perfil Personal", "pt": "Perfil Pessoal", "ru": "Личный профиль", "ja": "プロフィール", "tl": "Personal Profile" },
    "Hỗ trợ": { "en": "Support", "zh": "支持", "ko": "지원", "es": "Soporte", "pt": "Suporte", "ru": "Поддержка", "ja": "サポート", "tl": "Suporta" },
    "Khác": { "en": "Other", "zh": "其他", "ko": "기타", "es": "Otro", "pt": "Outro", "ru": "Другое", "ja": "その他", "tl": "Iba pa" },
    "Khi bật 2FA, bạn sẽ cần nhập Mã PIN 6 chữ số mỗi khi muốn thay đổi thông tin quan trọng.": {
        "en": "When 2FA is enabled, you must enter a 6-digit PIN whenever changing important information.",
        "zh": "开启2FA后，每次修改重要信息都需要输入6位数字PIN码。",
        "ko": "2FA를 켜면 중요한 정보를 변경할 때마다 6자리 PIN 코드를 입력해야 합니다.",
        "es": "Al activar 2FA, deberás ingresar un PIN de 6 dígitos cada vez que desees cambiar información importante.",
        "pt": "Quando o 2FA está ativado, você precisará digitar um PIN de 6 dígitos ao alterar informações importantes.",
        "ru": "При включении 2FA вам потребуется вводить 6-значный PIN-код каждый раз при изменении важной информации.",
        "ja": "2FAを有効にすると、重要な情報を変更するたびに6桁のPINコードを入力する必要があります。",
        "tl": "Kapag naka-on ang 2FA, kailangan mong mag-enter ng 6-digit PIN tuwing magbabago ng mahalagang impormasyon."
    },
    "Kéo thả file vào đây hoặc": { "en": "Drag & drop files here or", "zh": "拖放文件到此处或", "ko": "여기에 파일을 끌어다 놓거나", "es": "Arrastra y suelta archivos aquí o", "pt": "Arraste e solte os arquivos aqui ou", "ru": "Перетащите файлы сюда или", "ja": "ここにファイルをドラッグ＆ドロップまたは", "tl": "I-drag at i-drop ang mga file dito o" },
    "Kích hoạt xác thực mã PIN 2FA": { "en": "Activate 2FA PIN Authentication", "zh": "激活2FA PIN码验证", "ko": "2FA PIN 코드 인증 활성화", "es": "Activar autenticación PIN 2FA", "pt": "Ativar autenticação por PIN 2FA", "ru": "Активировать аутентификацию по PIN 2FA", "ja": "2FA PIN認証を有効化", "tl": "I-activate ang 2FA PIN Authentication" },
    "Kết nối bảo mật với tham vấn viên chuyên nghiệp. Giải tỏa căng thẳng ngay.": {
        "en": "Secure connection with professional counselors. Relieve stress now.",
        "zh": "与专业咨询师建立安全连接。立即缓解压力。",
        "ko": "전문 상담사와 안전하게 연결하세요. 지금 스트레스를 해소하세요.",
        "es": "Conexión segura con consejeros profesionales. Alivia el estrés ahora.",
        "pt": "Conexão segura com conselheiros profissionais. Alivie o estresse agora.",
        "ru": "Конфиденциальная связь с профессиональными психологами. Снимите стресс прямо сейчас.",
        "ja": "専門カウンセラーとの安全な接続。今すぐストレスを解消しましょう。",
        "tl": "Ligtas na koneksyon sa mga propesyonal na tagapayo. Alisin ang stress ngayon."
    },
    "Kết nối bảo mật với tham vấn viên tâm lý chuyên nghiệp": {
        "en": "Secure connection with professional psychological counselors",
        "zh": "与专业心理咨询师建立安全私密连接",
        "ko": "전문 심리 상담사와 안전한 비밀 연결",
        "es": "Conexión segura con consejeros psicológicos profesionales",
        "pt": "Conexão segura com conselheiros psicológicos profissionais",
        "ru": "Конфиденциальная связь с профессиональными психологами",
        "ja": "専門カウンセラーとの安全な非公開接続",
        "tl": "Ligtas na koneksyon sa mga propesyonal na tagapayo sa mental health"
    },
    "Liên hệ hỗ trợ": { "en": "Contact Support", "zh": "联系支持", "ko": "지원 문의", "es": "Contacto de Soporte", "pt": "Contato de Suporte", "ru": "Служба поддержки", "ja": "サポートお問い合わせ", "tl": "Contact Support" },
    "Link ảnh minh họa (URL)": { "en": "Illustration Image Link (URL)", "zh": "插图图片链接 (URL)", "ko": "일러스트 이미지 링크 (URL)", "es": "Enlace de imagen de ilustración (URL)", "pt": "Link da imagem de ilustração (URL)", "ru": "Ссылка на иллюстрацию (URL)", "ja": "イラスト画像リンク (URL)", "tl": "Link ng Imahe (URL)" },
    "Link ảnh minh họa (tùy chọn)": { "en": "Illustration Image Link (optional)", "zh": "插图图片链接 (可选)", "ko": "일러스트 이미지 링크 (선택)", "es": "Enlace de imagen de ilustración (opcional)", "pt": "Link da imagem de ilustração (opcional)", "ru": "Ссылка на иллюстрацию (необязательно)", "ja": "イラスト画像リンク (任意)", "tl": "Link ng Imahe (optional)" },
    "Lưu Cài đặt": { "en": "Save Settings", "zh": "保存设置", "ko": "설정 저장", "es": "Guardar Configuración", "pt": "Salvar Configurações", "ru": "Сохранить настройки", "ja": "設定を保存", "tl": "I-save ang Settings" },
    "Mã PIN 6 chữ số mới": { "en": "New 6-digit PIN Code", "zh": "新6位数字PIN码", "ko": "새 6자리 PIN 코드", "es": "Nuevo Código PIN de 6 dígitos", "pt": "Novo Código PIN de 6 dígitos", "ru": "Новый 6-значный PIN-код", "ja": "新しい6桁のPINコード", "tl": "Bagong 6-digit PIN Code" },
    "Mã Secret Admin Key": { "en": "Secret Admin Key", "zh": "管理员密钥 Secret Key", "ko": "Secret Admin Key", "es": "Clave Secreta de Admin", "pt": "Chave Secreta de Admin", "ru": "Секретный ключ администратора", "ja": "管理者シークレットキー", "tl": "Secret Admin Key" },
    "Mã báo cáo của bạn": { "en": "Your Report Code", "zh": "您的报告编号", "ko": "귀하의 보고서 코드", "es": "Tu Código de Reporte", "pt": "Seu Código de Relatório", "ru": "Код вашего отчета", "ja": "あなたの通報コード", "tl": "Iyong Report Code" },
    "Mã PIN không chính xác!": { "en": "Incorrect PIN code!", "zh": "PIN码不正确！", "ko": "PIN 코드가 올바르지 않습니다!", "es": "¡Código PIN incorrecto!", "pt": "Código PIN incorreto!", "ru": "Неверный PIN-код!", "ja": "PINコードが正しくありません！", "tl": "Maling PIN code!" },
    "Mô tả chi tiết": { "en": "Detailed Description", "zh": "详细描述", "ko": "상세 설명", "es": "Descripción Detallada", "pt": "Descrição Detalhada", "ru": "Подробное описание", "ja": "詳細説明", "tl": "Detalyadong Paglalarawan" },
    "Mô tả chi tiết sự việc đã xảy ra...": { "en": "Detailed description of what happened...", "zh": "详细描述发生的事件...", "ko": "발생한 사건에 대한 상세 설명...", "es": "Descripción detallada de lo sucedido...", "pt": "Descrição detalhada do ocorrido...", "ru": "Подробное описание случившегося...", "ja": "発生した事案の詳細説明...", "tl": "Detalyadong paglalarawan sa nangyari..." },
    "Mô tả nhanh sự việc": { "en": "Quick Incident Description", "zh": "事件简要描述", "ko": "사건 요약 설명", "es": "Descripción rápida del incidente", "pt": "Descrição rápida do incidente", "ru": "Краткое описание происшествия", "ja": "事案の簡易説明", "tl": "Mabilis na paglalarawan ng insidente" },
    "Mật khẩu": { "en": "Password", "zh": "密码", "ko": "비밀번호", "es": "Contraseña", "pt": "Senha", "ru": "Пароль", "ja": "パスワード", "tl": "Password" },
    "Mật khẩu cần ≥ 8 ký tự, 1 chữ HOA và 1 số": { "en": "Password must be ≥ 8 chars, 1 uppercase & 1 number", "zh": "密码需≥8字符，包含1个大写字母和1个数字", "ko": "비밀번호는 8자 이상, 대문자 1개 및 숫자 1개 포함", "es": "La contraseña debe tener ≥ 8 car., 1 mayúscula y 1 número", "pt": "A senha deve ter ≥ 8 caract., 1 maiúscula e 1 número", "ru": "Пароль должен быть ≥ 8 симв., 1 заглавная и 1 цифра", "ja": "パスワードは8文字以上、大文字1つと数字1つが必要", "tl": "Ang password ay kailangang ≥ 8 chars, 1 uppercase at 1 number" },
    "Mặc định": { "en": "Default", "zh": "默认", "ko": "기본", "es": "Predeterminado", "pt": "Padrão", "ru": "По умолчанию", "ja": "デフォルト", "tl": "Default" },
    "Mức độ nguy hiểm": { "en": "Danger Level", "zh": "危险级别", "ko": "위험 수준", "es": "Nivel de Peligro", "pt": "Nível de Perigo", "ru": "Уровень опасности", "ja": "危険度", "tl": "Antas ng Panganib" },
    "NGÔN NGỮ / LANGUAGE": { "en": "LANGUAGE", "zh": "语言设置 / LANGUAGE", "ko": "언어 설정 / LANGUAGE", "es": "IDIOMA / LANGUAGE", "pt": "IDIOMA / LANGUAGE", "ru": "ЯЗЫК / LANGUAGE", "ja": "言語設定 / LANGUAGE", "tl": "WIKA / LANGUAGE" },
    "Người dùng": { "en": "User", "zh": "用户", "ko": "사용자", "es": "Usuario", "pt": "Usuário", "ru": "Пользователь", "ja": "ユーザー", "tl": "User" },
    "Nhà trường đã tiếp nhận báo cáo của bạn và sẽ xử lý trong thời gian sớm nhất.": {
        "en": "The school has received your report and will handle it as soon as possible.",
        "zh": "学校已收到您的报告，并将尽快处理。",
        "ko": "학교에서 보고서를 접수하였으며 가능한 한 빨리 처리할 예정입니다.",
        "es": "La escuela ha recibido tu reporte y lo procesará lo antes posible.",
        "pt": "A escola recebeu seu relatório e o processará o mais rápido possível.",
        "ru": "Школа получила ваш отчет и обработает его в кратчайшие сроки.",
        "ja": "学校が通報を受信しました。できるだけ早く対応いたします。",
        "tl": "Natanggap na ng paaralan ang iyong report at ipoproseso ito sa lalong madaling panahon."
    },
    "Nhập admin key để tạo tài khoản Admin": { "en": "Enter admin key to create Admin account", "zh": "输入管理员密钥以创建管理员账号", "ko": "관리자 계정을 생성하려면 관리자 키를 입력하세요", "es": "Ingresa la clave de admin para crear cuenta de Admin", "pt": "Digite a chave admin para criar uma conta Admin", "ru": "Введите ключ администратора для создания аккаунта Admin", "ja": "管理者アカウントを作成するには管理者キーを入力してください", "tl": "Ilagay ang admin key para gumawa ng Admin account" },
    "Nhập email của bạn": { "en": "Enter your email", "zh": "输入您的邮箱", "ko": "이메일을 입력하세요", "es": "Ingresa tu correo", "pt": "Digite seu e-mail", "ru": "Введите ваш email", "ja": "メールアドレスを入力", "tl": "Ilagay ang iyong email" },
    "Nhập email mới (để trống nếu không đổi)": { "en": "New email (leave blank if unchanged)", "zh": "新邮箱（如不修改请留空）", "ko": "새 이메일 (변경하지 않으려면 비워두세요)", "es": "Nuevo correo (dejar en blanco si no cambia)", "pt": "Novo e-mail (deixe em branco se não alterar)", "ru": "Новый email (оставьте пустым, если не меняете)", "ja": "新しいメールアドレス (変更しない場合は空欄)", "tl": "Bagong email (iwanang blangko kung walang bago)" },
    "Những người liên quan (Người thực hiện, nạn nhân, nhân chứng)": { "en": "People involved (Perpetrator, victim, witness)", "zh": "相关人员（施暴者、受害者、目击者）", "ko": "관련자 (가해자, 피해자, 목격자)", "es": "Personas involucradas (Agresor, víctima, testigo)", "pt": "Pessoas envolvidas (Agressor, vítima, testemunha)", "ru": "Вовлеченные лица (нарушитель, жертва, свидетель)", "ja": "関係者 (加害者・被害者・目撃者)", "tl": "Mga taong kasangkot (Gumawa, biktima, saksi)" },
    "Nếu tình huống nguy hiểm đến tính mạng, gọi ngay:": { "en": "If life-threatening, call immediately:", "zh": "如遇到生命危险，请立即致电：", "ko": "생명이 위급한 경우 즉시 전화하세요:", "es": "Si es una situación de peligro mortal, llama de inmediato:", "pt": "Se houver risco de vida, ligue imediatamente:", "ru": "Если есть угроза жизни, немедленно звоните:", "ja": "生命の危険がある場合は、今すぐお電話ください:", "tl": "Kung delikado sa buhay, tumawag agad sa:" },
    "Nếu tình huống nguy hiểm đến tính mạng, vui lòng gọi ngay:": { "en": "If life-threatening, please call immediately:", "zh": "如遇到生命危险，请立即致电：", "ko": "생명이 위급한 경우 즉시 전화하세요:", "es": "Si es una situación de peligro mortal, por favor llama de inmediato:", "pt": "Se houver risco de vida, por favor ligue imediatamente:", "ru": "Если есть угроза жизни, пожалуйста, звоните немедленно:", "ja": "生命の危険がある場合は、今すぐお電話ください:", "tl": "Kung delikado sa buhay, mangyaring tumawag agad sa:" },
    "QUẢN LÝ": { "en": "MANAGEMENT", "zh": "管理中心", "ko": "관리 메뉴", "es": "GESTIÓN", "pt": "GESTÃO", "ru": "УПРАВЛЕНИЕ", "ja": "管理メニュー", "tl": "PAMAMAHALA" },
    "QUẢN LÝ CHUNG": { "en": "GENERAL MANAGEMENT", "zh": "常规管理", "ko": "일반 관리", "es": "GESTIÓN GENERAL", "pt": "GESTÃO GERAL", "ru": "ОБЩЕЕ УПРАВЛЕНИЕ", "ja": "一般管理", "tl": "PANGKALAHATANG PAMAMAHALA" },
    "Quản lý Chat - Safe School": { "en": "Chat Management - Safe School", "zh": "聊天管理 - Safe School", "ko": "채팅 관리 - Safe School", "es": "Gestión de Chats - Safe School", "pt": "Gestão de Chats - Safe School", "ru": "Управление чатами - Safe School", "ja": "チャット管理 - Safe School", "tl": "Pamamahala ng Chat - Safe School" },
    "Quản lý Người dùng - Safe School": { "en": "User Management - Safe School", "zh": "用户管理 - Safe School", "ko": "사용자 관리 - Safe School", "es": "Gestión de Usuarios - Safe School", "pt": "Gestão de Usuários - Safe School", "ru": "Управление пользователями - Safe School", "ja": "ユーザー管理 - Safe School", "tl": "Pamamahala ng User - Safe School" },
    "Quản lý hồ sơ - Safe School": { "en": "Profile Management - Safe School", "zh": "个人资料管理 - Safe School", "ko": "프로필 관리 - Safe School", "es": "Gestión de Perfil - Safe School", "pt": "Gestão de Perfil - Safe School", "ru": "Управление профилем - Safe School", "ja": "プロフィール管理 - Safe School", "tl": "Pamamahala ng Profile - Safe School" },
    "Safe School - An toàn Học đường": { "en": "Safe School - School Safety System", "zh": "Safe School - 校园安全系统", "ko": "Safe School - 학교 안전 시스템", "es": "Safe School - Sistema de Seguridad Escolar", "pt": "Safe School - Sistema de Segurança Escolar", "ru": "Safe School - Школьная безопасность", "ja": "Safe School - 学校安全システム", "tl": "Safe School - Sistema sa Kaligtasan ng Paaralan" },
    "Thống Kê Số Liệu Hệ Thống - Safe School Admin": { "en": "System Statistics - Safe School Admin", "zh": "系统数据统计 - Safe School 管理员", "ko": "시스템 통계 - Safe School 관리자", "es": "Estadísticas del Sistema - Admin Safe School", "pt": "Estatísticas do Sistema - Admin Safe School", "ru": "Статистика системы - Admin Safe School", "ja": "システム統計 - Safe School 管理者", "tl": "Statistik ng Sistema - Admin Safe School" },
    "Tư vấn Tâm lý Học đường": { "en": "School Counseling Center", "zh": "校园心理咨询", "ko": "학교 심리 상담", "es": "Consejería Escolar", "pt": "Aconselhamento Escolar", "ru": "Школьные консультации", "ja": "学校心理カウンセリング", "tl": "Counseling sa Paaralan" },
    "Tư vấn tâm lý": { "en": "Psychological Counseling", "zh": "心理咨询", "ko": "심리 상담", "es": "Consejería Psicológica", "pt": "Aconselhamento Psicológico", "ru": "Психологическая консультация", "ja": "心理カウンセリング", "tl": "Psychological Counseling" },
    "Tư vấn tâm lý - Safe School": { "en": "Psychological Counseling - Safe School", "zh": "心理咨询 - Safe School", "ko": "심리 상담 - Safe School", "es": "Consejería Psicológica - Safe School", "pt": "Aconselhamento Psicológico - Safe School", "ru": "Психологическая консультация - Safe School", "ja": "心理カウンセリング - Safe School", "tl": "Counseling sa Paaralan - Safe School" },
    "Vị trí của bạn": { "en": "Your Location", "zh": "您的位置", "ko": "현재 위치", "es": "Tu Ubicación", "pt": "Sua Localização", "ru": "Ваше местоположение", "ja": "現在地", "tl": "Iyong Lokasyon" },
    "Xác nhận mật khẩu mới": { "en": "Confirm new password", "zh": "确认新密码", "ko": "새 비밀번호 확인", "es": "Confirmar nueva contraseña", "pt": "Confirmar nova senha", "ru": "Подтвердите новый пароль", "ja": "新しいパスワードの確認", "tl": "Kumpirmahin ang bagong password" },
    "© 2026 Safe School — Hệ thống An toàn Học đường": { "en": "© 2026 Safe School — School Safety System", "zh": "© 2026 Safe School — 校园安全系统", "ko": "© 2026 Safe School — 학교 안전 시스템", "es": "© 2026 Safe School — Sistema de Seguridad Escolar", "pt": "© 2026 Safe School — Sistema de Segurança Escolar", "ru": "© 2026 Safe School — Система школьной безопасности", "ja": "© 2026 Safe School — 学校安全システム", "tl": "© 2026 Safe School — Sistema sa Kaligtasan ng Paaralan" },
    "© 2026 Safe School — Hệ thống An toàn Học đường. Bảo vệ quyền lợi mọi học sinh.": {
        "en": "© 2026 Safe School — School Safety System. Protecting all students' rights.",
        "zh": "© 2026 Safe School — 校园安全系统。保护每位学生的权益。",
        "ko": "© 2026 Safe School — 학교 안전 시스템. 모든 학생의 권리를 보호합니다.",
        "es": "© 2026 Safe School — Sistema de Seguridad Escolar. Protegiendo los derechos de todos los estudiantes.",
        "pt": "© 2026 Safe School — Sistema de Segurança Escolar. Protegendo os direitos de todos os alunos.",
        "ru": "© 2026 Safe School — Система школьной безопасности. Защита прав всех учащихся.",
        "ja": "© 2026 Safe School — 学校安全システム。すべての生徒の権利を保護します。",
        "tl": "© 2026 Safe School — Sistema sa Kaligtasan ng Paaralan. Proteksyon sa karapatan ng lahat ng mag-aaral."
    },
    "Đã gửi cảnh báo!": { "en": "Alert sent!", "zh": "警报已发送！", "ko": "경보가 전송되었습니다!", "es": "¡Alerta enviada!", "pt": "Alerta enviado!", "ru": "Оповещение отправлено!", "ja": "警告が送信されました！", "tl": "Napadala na ang alerto!" },
    "Đăng ký - Safe School": { "en": "Sign Up - Safe School", "zh": "注册 - Safe School", "ko": "회원가입 - Safe School", "es": "Registrarse - Safe School", "pt": "Cadastrar - Safe School", "ru": "Регистрация - Safe School", "ja": "会員登録 - Safe School", "tl": "Sign Up - Safe School" },
    "Đăng ký tài khoản": { "en": "Register Account", "zh": "注册账号", "ko": "계정 등록", "es": "Registrar Cuenta", "pt": "Cadastrar Conta", "ru": "Зарегистрировать аккаунт", "ja": "アカウント登録", "tl": "Mag-register ng Account" },
    "Đăng nhập - Safe School": { "en": "Sign In - Safe School", "zh": "登录 - Safe School", "ko": "로그인 - Safe School", "es": "Iniciar Sesión - Safe School", "pt": "Entrar - Safe School", "ru": "Вход - Safe School", "ja": "ログイン - Safe School", "tl": "Sign In - Safe School" },
    "Đọc và chia sẻ bài viết về phòng chống bạo lực học đường, an toàn mạng, sức khỏe tâm lý và pháp luật.": {
        "en": "Read and share articles on anti-school violence, cyber safety, mental health, and legal awareness.",
        "zh": "阅读并分享有关预防校园暴力、网络安全、心理健康和法律常识的文章。",
        "ko": "학교 폭력 예방, 사이버 안전, 정신 건강 및 법률 지식에 관한 글을 읽고 공유하세요.",
        "es": "Lee y comparte artículos sobre prevención de violencia escolar, seguridad cibernética, salud mental y legislación.",
        "pt": "Leia e compartilhe artigos sobre prevenção da violência escolar, segurança cibernética, saúde mental e legislação.",
        "ru": "Читайте и делитесь статьями о профилактике школьного насилия, кибербезопасности, психическом здоровье и праве.",
        "ja": "いじめ予防、ネット安全、メンタルヘルス、法律知識に関する記事を読んで共有しましょう。",
        "tl": "Magbasa at mag-share ng mga artikulo laban sa bullying, cyber safety, mental health, at batas."
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
    for vi_key, trans_dict in extra_translations.items():
        val = trans_dict.get(lang, trans_dict.get('en'))
        if val:
            escaped_key = vi_key.replace('"', '\\"')
            escaped_val = val.replace('"', '\\"')
            lines_to_add.append(f'    "{escaped_key}": "{escaped_val}",')
    
    addition = '\n' + '\n'.join(lines_to_add)
    dict_str = dict_str[:insert_pos] + addition + dict_str[insert_pos:]

new_content = content[:dict_start] + dict_str + content[dict_end:]

with open('src/js/firebaseConfig.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

with open('safe-school-two/src/js/firebaseConfig.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Enriched all remaining translations successfully!")
