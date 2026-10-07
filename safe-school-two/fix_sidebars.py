import os
import re

pages_dir = 'pages'
files = ['profile.html', 'blogs.html', 'chat.html', 'report.html', 'report-sos.html', 'tests.html', 'users.html', 'chat-management.html', 'report-detail.html', 'blog-detail.html']

sidebar_footer_regex = re.compile(r'<div class="sidebar-section-title">QUẢN LÝ<\/div>[\s\S]*?<\/aside>')
sidebar_footer_regex2 = re.compile(r'<div class="sidebar-section-title">CÁ NHÂN<\/div>[\s\S]*?<\/aside>')

def new_sidebar_footer_html(is_active_profile=False, is_active_users=False, is_active_chat_mgmt=False, is_admin_folder=False):
    profile_active = ' active' if is_active_profile else ''
    users_active = ' active' if is_active_users else ''
    chat_mgmt_active = ' active' if is_active_chat_mgmt else ''

    prefix = '../pages/' if is_admin_folder else ''

    return f"""      <div class="sidebar-section-title">QUẢN LÝ</div>
      <nav class="sidebar-nav">
        <a href="{prefix}users.html" class="sidebar-link{users_active}" id="nav-users-management" style="display: none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Quản lý Người dùng
        </a>
        <a href="{prefix}chat-management.html" class="sidebar-link{chat_mgmt_active}" id="nav-chat-management" style="display: none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Quản lý Chat
        </a>
      </nav>

      <div class="sidebar-section-title">CÁ NHÂN</div>
      <nav class="sidebar-nav">
        <a href="{prefix}profile.html" class="sidebar-link{profile_active}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Hồ sơ cá nhân
        </a>
      </nav>

      <div class="sidebar-section-title">NGÔN NGỮ / LANGUAGE</div>
      <div style="padding: 0 var(--space-md); margin-bottom: var(--space-md);">
        <select class="sidebar-lang-select" id="sidebar-language-select" style="width: 100%; padding: 8px 10px; border-radius: var(--radius-md); background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13px; cursor: pointer; outline: none;">
          <option value="vi" style="background: var(--bg-card); color: var(--text-primary);">🇻🇳 Tiếng Việt</option>
          <option value="en" style="background: var(--bg-card); color: var(--text-primary);">🇺🇸 English</option>
          <option value="zh" style="background: var(--bg-card); color: var(--text-primary);">🇨🇳 中文</option>
          <option value="ko" style="background: var(--bg-card); color: var(--text-primary);">🇰🇷 한국어</option>
          <option value="es" style="background: var(--bg-card); color: var(--text-primary);">🇪🇸 Español</option>
          <option value="pt" style="background: var(--bg-card); color: var(--text-primary);">🇵🇹 Português</option>
          <option value="ru" style="background: var(--bg-card); color: var(--text-primary);">🇷🇺 Русский</option>
          <option value="ja" style="background: var(--bg-card); color: var(--text-primary);">🇯🇵 日本語</option>
          <option value="tl" style="background: var(--bg-card); color: var(--text-primary);">🇵🇭 Tagalog</option>
        </select>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar" id="user-avatar-initial">U</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name" id="sidebar-user-name">Đang tải...</div>
            <div class="sidebar-user-role" id="sidebar-user-role">---</div>
          </div>
          <button class="btn-icon" id="btn-logout" title="Đăng xuất">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>"""

for file in files:
    filepath = os.path.join(pages_dir, file)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        is_profile = (file == 'profile.html')
        is_users = (file == 'users.html')
        is_chat_mgmt = (file == 'chat-management.html')
        
        # Remove old links pointing to admin/index.html
        content = re.sub(r'<nav class="sidebar-nav">\s*<a href="\.\.\/admin\/index\.html"[^>]*>[\s\S]*?<\/nav>', '', content)
        
        if sidebar_footer_regex.search(content):
            content = sidebar_footer_regex.sub(new_sidebar_footer_html(is_profile, is_users, is_chat_mgmt), content)
        elif sidebar_footer_regex2.search(content):
            content = sidebar_footer_regex2.sub(new_sidebar_footer_html(is_profile, is_users, is_chat_mgmt), content)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file}')

# Also update admin/dashboard.html sidebar footer
dashboard_path = os.path.join('admin', 'dashboard.html')
if os.path.exists(dashboard_path):
    with open(dashboard_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if sidebar_footer_regex.search(content):
        content = sidebar_footer_regex.sub(new_sidebar_footer_html(False, False, False, True), content)
    elif sidebar_footer_regex2.search(content):
        content = sidebar_footer_regex2.sub(new_sidebar_footer_html(False, False, False, True), content)
    with open(dashboard_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated admin/dashboard.html sidebar')
