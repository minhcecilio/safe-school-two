import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')

# Read dictionaryMap from safe-school-two/src/js/firebaseConfig.js to preserve existing translations
with open('safe-school-two/src/js/firebaseConfig.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract globalTranslations block
gt_start = content.find('const globalTranslations = {')
gt_end = content.find('// --- DICTIONARY MAP:')
global_trans_str = content[gt_start:gt_end].strip()

# Extract dictionaryMap block
dict_start = content.find('const dictionaryMap = {')
dict_end = content.find('// --- NATIVE TRANSLATION ENGINE')
dict_map_str = content[dict_start:dict_end].strip()

# New JS file template
js_template = """// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// Firestore
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  onSnapshot,
  limit,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC6shvbP2YTWARce8wfEpyfyQlsQpN3_fA",
    authDomain: "safe-school-381de.firebaseapp.com",
    projectId: "safe-school-381de",
    storageBucket: "safe-school-381de.firebasestorage.app",
    messagingSenderId: "260608548932",
    appId: "1:260608548932:web:91d546f7d01657c2555c11",
    measurementId: "G-956CVKQ86W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();

export {
  // App
  app,
  // Authentication
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  googleProvider,
  // Firestore
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  onSnapshot,
  limit,
  arrayUnion,
  arrayRemove,
  analytics,
  applyGlobalTranslations,
  getTranslatedText,
};

// Sidebar global logic
document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = '../auth/sign-in.html';
    });
  }

  const sidebarLangSelect = document.getElementById('sidebar-language-select');
  if (sidebarLangSelect) {
    const savedLang = localStorage.getItem('safe_school_lang') || 'vi';
    sidebarLangSelect.value = savedLang;
    applyGlobalTranslations(savedLang);

    sidebarLangSelect.addEventListener('change', async (e) => {
      const selectedLang = e.target.value;
      localStorage.setItem('safe_school_lang', selectedLang);
      applyGlobalTranslations(selectedLang);
      
      const user = auth.currentUser;
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), { language: selectedLang });
        } catch (err) { console.error('Lỗi lưu ngôn ngữ sidebar:', err); }
      }

      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: selectedLang } }));
    });
  }

  window.addEventListener('languageChanged', (e) => {
    if (e.detail && e.detail.language) {
      applyGlobalTranslations(e.detail.language);
    }
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const nameEl = document.getElementById('sidebar-user-name');
      const roleEl = document.getElementById('sidebar-user-role');
      const initialEl = document.getElementById('user-avatar-initial');
      const sidebarAvatar = document.querySelector('.sidebar-user .sidebar-avatar');

      if (nameEl) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();

          // Lock Account Security Check
          if (data.isLocked) {
            alert('⚠️ Tài khoản của bạn đã bị khóa bởi người quản lý!');
            await signOut(auth);
            window.location.href = '../auth/sign-in.html';
            return;
          }

          nameEl.textContent = data.fullName || 'Người dùng';
          
          const roleLabels = { 'student': 'Học sinh', 'teacher': 'Giáo viên', 'counselor': 'Tham vấn viên', 'parent': 'Phụ huynh', 'admin': 'Admin Quản trị' };
          if (roleEl) roleEl.textContent = roleLabels[data.role] || 'Học sinh';
          
          // Role-based visibility for User Management & Chat Management links
          const navUsers = document.getElementById('nav-users-management');
          const navChatMgmt = document.getElementById('nav-chat-management');
          
          const isUserMgmtAuthorized = ['teacher', 'counselor', 'admin'].includes(data.role);
          const isChatMgmtAuthorized = data.role === 'admin';

          if (navUsers) {
            navUsers.style.display = isUserMgmtAuthorized ? 'flex' : 'none';
          }
          if (navChatMgmt) {
            navChatMgmt.style.display = isChatMgmtAuthorized ? 'flex' : 'none';
          }

          // Hide QUẢN LÝ section header if user is not authorized for any management features
          const sectionTitles = document.querySelectorAll('.sidebar-section-title');
          sectionTitles.forEach(sec => {
            if (sec.textContent.includes('QUẢN LÝ') || sec.textContent.includes('MANAGEMENT')) {
              sec.style.display = isUserMgmtAuthorized ? 'block' : 'none';
            }
          });

          if (initialEl) initialEl.textContent = data.fullName ? data.fullName.charAt(0).toUpperCase() : 'U';
          
          if (data.avatar && sidebarAvatar) {
            sidebarAvatar.style.backgroundImage = 'url(' + data.avatar + ')';
            sidebarAvatar.style.backgroundSize = 'cover';
            sidebarAvatar.style.backgroundPosition = 'center';
            if (initialEl) initialEl.style.display = 'none';
          } else {
            if (sidebarAvatar) sidebarAvatar.style.backgroundImage = 'none';
            if (initialEl) initialEl.style.display = 'inline';
          }

          if (data.language) {
            if (sidebarLangSelect) sidebarLangSelect.value = data.language;
            localStorage.setItem('safe_school_lang', data.language);
            applyGlobalTranslations(data.language);
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: data.language } }));
          }
        }
      }
    }
  });
});

// --- GLOBAL MULTI-LANGUAGE SYSTEM FOR ALL PAGES ---
GLOBAL_TRANSLATIONS_PLACEHOLDER

// --- DICTIONARY MAP: Phrase-level translation for buttons, labels, placeholders, headings ---
DICTIONARY_MAP_PLACEHOLDER

// Global reverse lookup to support switching between non-Vietnamese languages (e.g. En -> Zh -> Vi)
const reverseToViMap = {};
for (const lKey of Object.keys(dictionaryMap)) {
  for (const [viKey, translated] of Object.entries(dictionaryMap[lKey])) {
    if (translated && translated !== viKey) {
      reverseToViMap[translated] = viKey;
    }
  }
}

function getTranslatedText(text, targetLang) {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (targetLang === 'vi') {
    return reverseToViMap[trimmed] || null;
  }

  const currentDict = dictionaryMap[targetLang];
  if (currentDict) {
    if (currentDict[trimmed]) return currentDict[trimmed];
    const canonicalVi = reverseToViMap[trimmed];
    if (canonicalVi && currentDict[canonicalVi]) return currentDict[canonicalVi];
  }
  return null;
}

// --- NATIVE TRANSLATION ENGINE (no external dependencies) ---
function applyGlobalTranslations(lang) {
  const selectedLang = lang || localStorage.getItem('safe_school_lang') || 'vi';
  const t = globalTranslations[selectedLang] || globalTranslations.vi;
  const dict = dictionaryMap[selectedLang] || null;

  // 1. Sidebar Nav Links
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const svg = link.querySelector('svg')?.outerHTML || '';
    if (href.includes('dashboard.html')) link.innerHTML = `${svg} ${t.navDashboard}`;
    else if (href.includes('chat-management.html')) link.innerHTML = `${svg} ${t.navChatMgmt}`;
    else if (href.includes('blogs.html')) link.innerHTML = `${svg} ${t.navBlogs}`;
    else if (href.includes('chat.html')) link.innerHTML = `${svg} ${t.navChat}`;
    else if (href.includes('report.html') && !href.includes('report-sos.html')) link.innerHTML = `${svg} ${t.navReport}`;
    else if (href.includes('report-sos.html')) link.innerHTML = `${svg} ${t.navSos}`;
    else if (href.includes('users.html')) link.innerHTML = `${svg} ${t.navUsers}`;
    else if (href.includes('profile.html')) link.innerHTML = `${svg} ${t.navProfile}`;
  });

  // 2. Sidebar Section Titles
  const managementLabels = ['QUẢN LÝ', 'MANAGEMENT', '管理中心', '관리 메뉴', 'GESTIÓN', 'GESTÃO', 'УПРАВЛЕНИЕ', '管理メニュー', 'PAMAMAHALA'];
  const personalLabels = ['CÁ NHÂN', 'PERSONAL', '个人中心', '마이페이지', 'PESSOAL', 'ЛИЧНОЕ', '個人メニュー'];
  const langLabels = ['NGÔN NGỮ', 'LANGUAGE', '语言', '언어', 'WIKA', 'IDIOMA', 'ЯЗЫК', '言語'];

  const sectionTitles = document.querySelectorAll('.sidebar-section-title');
  sectionTitles.forEach(sec => {
    const text = sec.textContent.trim();
    if (managementLabels.some(l => text.includes(l))) {
      sec.textContent = t.secManagement;
    } else if (personalLabels.some(l => text.includes(l))) {
      sec.textContent = t.secPersonal;
    } else if (langLabels.some(l => text.includes(l))) {
      sec.textContent = t.secLang;
    }
  });

  // 3. Footer
  const footerDesc = document.querySelector('.app-footer-desc');
  if (footerDesc) footerDesc.textContent = t.footerDesc;

  const footerCopy = document.querySelector('.app-footer-copyright');
  if (footerCopy) footerCopy.textContent = t.footerCopy;

  // 4. Page Titles & Subtitles based on path
  const path = window.location.pathname;
  const pageTitle = document.querySelector('.page-title');
  const pageSub = document.querySelector('.page-subtitle');

  if (pageTitle && pageSub) {
    if (path.includes('chat-management.html')) { pageTitle.textContent = t.titleChatMgmt; pageSub.textContent = t.subChatMgmt; }
    else if (path.includes('blogs.html')) { pageTitle.textContent = t.titleBlogs; pageSub.textContent = t.subBlogs; }
    else if (path.includes('chat.html')) { pageTitle.textContent = t.titleChat; pageSub.textContent = t.subChat; }
    else if (path.includes('report.html') && !path.includes('report-sos.html')) { pageTitle.textContent = t.titleReport; pageSub.textContent = t.subReport; }
    else if (path.includes('report-sos.html')) { pageTitle.textContent = t.titleSos; pageSub.textContent = t.subSos; }
    else if (path.includes('dashboard.html')) { pageTitle.textContent = t.titleDashboard; pageSub.textContent = t.subDashboard; }
    else if (path.includes('users.html')) { pageTitle.textContent = t.titleUsers; pageSub.textContent = t.subUsers; }
    else if (path.includes('tests.html')) { pageTitle.textContent = t.titleTests; pageSub.textContent = t.subTests; }
  }

  // 5. COMPREHENSIVE DOM TEXT NODE TRANSLATION
  const excludedSelectors = ['.messages-area', '.chat-messages', '#messages-container',
    '.chat-message-bubble', '.chat-bubble', '.message-bubble', '#sidebar-language-select'];

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        for (const sel of excludedSelectors) {
          if (parent.closest(sel)) return NodeFilter.FILTER_REJECT;
        }
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        const text = node.textContent.trim();
        if (!text) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let n;
  while ((n = walker.nextNode())) textNodes.push(n);

  textNodes.forEach(node => {
    const text = node.textContent.trim();
    const replacement = getTranslatedText(text, selectedLang);
    if (replacement && replacement !== text) {
      node.textContent = node.textContent.replace(text, replacement);
    }
  });

  // Placeholders
  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
    const ph = input.getAttribute('placeholder') || '';
    const replacement = getTranslatedText(ph, selectedLang);
    if (replacement && replacement !== ph) input.setAttribute('placeholder', replacement);
  });

  // Title attributes
  document.querySelectorAll('[title]').forEach(el => {
    const title = el.getAttribute('title') || '';
    const replacement = getTranslatedText(title, selectedLang);
    if (replacement && replacement !== title) el.setAttribute('title', replacement);
  });
}
"""

final_js = js_template.replace('GLOBAL_TRANSLATIONS_PLACEHOLDER', global_trans_str).replace('DICTIONARY_MAP_PLACEHOLDER', dict_map_str)

# Write to src/js/firebaseConfig.js and safe-school-two/src/js/firebaseConfig.js
with open('src/js/firebaseConfig.js', 'w', encoding='utf-8') as f:
    f.write(final_js)

with open('safe-school-two/src/js/firebaseConfig.js', 'w', encoding='utf-8') as f:
    f.write(final_js)

print("Successfully wrote updated firebaseConfig.js to both locations!")
