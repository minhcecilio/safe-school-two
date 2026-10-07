import { auth, onAuthStateChanged, signOut, db, doc, getDoc } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const btnNavSignin = document.getElementById('btn-nav-signin');
  const btnNavSignup = document.getElementById('btn-nav-signup');
  const navbarActions = document.querySelector('.navbar-actions');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Đã đăng nhập
      let userRole = 'student';
      let fullName = user.email;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          fullName = userData.fullName || user.email;
          userRole = userData.role || 'student';
        }
      } catch (e) {
        console.error("Error fetching user data:", e);
      }

      const langSelectHtml = `
        <select class="sidebar-lang-select" id="sidebar-language-select" style="padding: 6px 10px; border-radius: var(--radius-md); background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13px; cursor: pointer; outline: none;">
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
      `;

      // Cập nhật Navbar
      if (navbarActions) {
        navbarActions.innerHTML = `
          <div class="user-menu" style="display: flex; align-items: center; gap: 12px;">
            ${langSelectHtml}
            <a href="pages/profile.html" class="text-gradient" style="font-weight: 600; text-decoration: none;">Chào, ${fullName}</a>
            <button id="btn-logout" class="btn btn-ghost btn-sm">Đăng xuất</button>
          </div>
        `;

        const sel = navbarActions.querySelector('#sidebar-language-select');
        if (sel) {
          sel.value = localStorage.getItem('safe_school_lang') || 'vi';
          sel.addEventListener('change', (e) => {
            localStorage.setItem('safe_school_lang', e.target.value);
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: e.target.value } }));
          });
        }

        document.getElementById('btn-logout').addEventListener('click', async () => {
          try {
            await signOut(auth);
            window.location.reload();
          } catch (error) {
            console.error("Error signing out:", error);
          }
        });
      }
    } else {
      // Chưa đăng nhập
      const langSelectHtml = `
        <select class="sidebar-lang-select" id="sidebar-language-select" style="padding: 6px 10px; border-radius: var(--radius-md); background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13px; cursor: pointer; outline: none;">
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
      `;
      if (navbarActions) {
        navbarActions.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            ${langSelectHtml}
            <a href="auth/sign-in.html" class="btn btn-ghost btn-sm" id="btn-nav-signin">Đăng nhập</a>
            <a href="auth/sign-up.html" class="btn btn-primary btn-sm" id="btn-nav-signup">Đăng ký</a>
          </div>
        `;
        const sel = navbarActions.querySelector('#sidebar-language-select');
        if (sel) {
          sel.value = localStorage.getItem('safe_school_lang') || 'vi';
          sel.addEventListener('change', (e) => {
            localStorage.setItem('safe_school_lang', e.target.value);
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: e.target.value } }));
          });
        }
      }
    }
  });
});
