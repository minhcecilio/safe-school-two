import { 
  auth, onAuthStateChanged, db, doc, getDoc, getDocs, collection, 
  onSnapshot, deleteDoc, query, orderBy 
} from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('chats-table-body');
  const searchInput = document.getElementById('chat-search-input');
  const typeFilter = document.getElementById('chat-type-filter');

  const statTotal = document.getElementById('stat-total-chats');
  const statGroup = document.getElementById('stat-group-chats');
  const statPrivate = document.getElementById('stat-private-chats');

  const modalPreview = document.getElementById('modal-chat-preview');
  const btnClosePreview = document.getElementById('btn-close-chat-preview');
  const btnDonePreview = document.getElementById('btn-done-chat-preview');
  const previewTitle = document.getElementById('preview-chat-title');
  const previewSubtitle = document.getElementById('preview-chat-subtitle');
  const previewMessagesContainer = document.getElementById('preview-messages-container');

  let currentUser = null;
  let allUsersMap = {};
  let allConvsList = [];
  let unsubscribeConvs = null;
  let unsubscribeMessages = null;

  // Shortcode map for emoji rendering in preview
  const shortcodeMap = {
    ':sob:': '😭', ':smile:': '😄', ':heart:': '❤️', ':fire:': '🔥',
    ':thumbsup:': '👍', ':cry:': '😢', ':angry:': '😡', ':laughing:': '😆',
    ':wink:': '😉', ':surprised:': '😮', ':pray:': '🙏', ':100:': '💯'
  };

  function replaceShortcodes(text) {
    if (!text) return '';
    let result = text;
    for (const [code, emoji] of Object.entries(shortcodeMap)) {
      result = result.split(code).join(emoji);
    }
    return result;
  }

  // Auth observer
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role !== 'admin') {
          alert('⚠️ Chỉ Admin Quản trị mới có quyền truy cập trang Quản lý Chat.');
          window.location.href = '../admin/dashboard.html';
          return;
        }

        await cacheAllUsers();
        listenToConversations();
      }
    } else {
      window.location.href = '../auth/sign-in.html';
    }
  });

  async function cacheAllUsers() {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      allUsersMap = {};
      snapshot.docs.forEach(docSnap => {
        allUsersMap[docSnap.id] = docSnap.data();
      });
    } catch (err) {
      console.error('Lỗi cache người dùng:', err);
    }
  }

  function listenToConversations() {
    if (unsubscribeConvs) unsubscribeConvs();

    unsubscribeConvs = onSnapshot(collection(db, 'conversations'), (snapshot) => {
      allConvsList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Sort latest first
      allConvsList.sort((a, b) => {
        const t1 = a.updatedAt ? a.updatedAt.toMillis() : 0;
        const t2 = b.updatedAt ? b.updatedAt.toMillis() : 0;
        return t2 - t1;
      });

      renderChatsTable();
    }, (err) => {
      console.error('Lỗi tải cuộc trò chuyện:', err);
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-danger); padding: 30px;">Lỗi tải dữ liệu trò chuyện.</td></tr>`;
    });
  }

  function renderChatsTable() {
    if (!allConvsList || allConvsList.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">Chưa có cuộc trò chuyện nào trong hệ thống.</td></tr>`;
      if (statTotal) statTotal.textContent = '0';
      if (statGroup) statGroup.textContent = '0';
      if (statPrivate) statPrivate.textContent = '0';
      return;
    }

    const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const selectedType = typeFilter ? typeFilter.value : 'all';

    // Stats
    const totalCount = allConvsList.length;
    const groupCount = allConvsList.filter(c => c.type === 'group').length;
    const privateCount = totalCount - groupCount;

    if (statTotal) statTotal.textContent = totalCount;
    if (statGroup) statGroup.textContent = groupCount;
    if (statPrivate) statPrivate.textContent = privateCount;

    // Filter logic
    const filteredConvs = allConvsList.filter(c => {
      const isGroup = c.type === 'group';
      const matchesType = selectedType === 'all' || (selectedType === 'group' && isGroup) || (selectedType === '1on1' && !isGroup);

      // Get names of participants
      let participantNames = (c.participants || []).map(uid => (allUsersMap[uid]?.fullName || '').toLowerCase()).join(' ');
      let groupName = (c.name || '').toLowerCase();
      let lastMsg = (c.lastMessage || '').toLowerCase();

      const matchesSearch = !searchTerm || participantNames.includes(searchTerm) || groupName.includes(searchTerm) || lastMsg.includes(searchTerm);

      return matchesType && matchesSearch;
    });

    if (filteredConvs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">Không tìm thấy cuộc trò chuyện phù hợp.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filteredConvs.map(c => {
      const isGroup = c.type === 'group';
      let title = '';
      let memberListText = '';

      if (isGroup) {
        title = `👥 ${c.name || 'Nhóm chat'}`;
        const names = (c.participants || []).map(uid => allUsersMap[uid]?.fullName || 'Ẩn danh');
        memberListText = `Thành viên (${names.length}): ${names.join(', ')}`;
      } else {
        const otherUid = (c.participants || []).find(uid => uid !== currentUser.uid) || c.participants?.[0];
        const otherUser = allUsersMap[otherUid];
        title = `💬 ${otherUser?.fullName || 'Cuộc tư vấn 1-1'}`;
        const names = (c.participants || []).map(uid => allUsersMap[uid]?.fullName || 'Ẩn danh');
        memberListText = `Tham gia: ${names.join(' & ')}`;
      }

      const typeBadge = isGroup
        ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">👥 Nhóm</span>`
        : `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">👤 Cá nhân</span>`;

      const timeFormatted = c.updatedAt ? new Date(c.updatedAt.toDate()).toLocaleString('vi-VN') : '---';

      return `
        <tr>
          <td>
            <div style="font-weight: 600; font-size: 14px;">${title}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${memberListText}</div>
          </td>
          <td>${typeBadge}</td>
          <td>
            <div style="font-size: 12px; color: var(--text-secondary); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${replaceShortcodes(c.lastMessage || 'Chưa có tin nhắn')}
            </div>
          </td>
          <td style="font-size: 12px; color: var(--text-muted);">${timeFormatted}</td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn btn-secondary btn-xs btn-preview-chat" data-id="${c.id}" data-title="${title}" style="padding: 5px 10px; font-size: 11px;">👁️ Xem trước</button>
              <button class="btn btn-danger btn-xs btn-delete-chat" data-id="${c.id}" data-title="${title}" style="padding: 5px 10px; font-size: 11px;">🗑️ Xóa</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    attachEventListeners();
  }

  function attachEventListeners() {
    // Preview Chat
    document.querySelectorAll('.btn-preview-chat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const convId = e.currentTarget.getAttribute('data-id');
        const title = e.currentTarget.getAttribute('data-title');
        openChatPreviewModal(convId, title);
      });
    });

    // Delete Chat
    document.querySelectorAll('.btn-delete-chat').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const convId = e.currentTarget.getAttribute('data-id');
        const title = e.currentTarget.getAttribute('data-title');

        if (confirm(`⚠️ CẢNH BÁO ADMIN: Bạn có chắc chắn muốn XÓA VĨ VIỄN cuộc trò chuyện "${title}"?\n\nTất cả tin nhắn trong cuộc trò chuyện này sẽ bị hủy bỏ!`)) {
          try {
            await deleteDoc(doc(db, 'conversations', convId));
            showToast('success', 'Đã xóa', `Đã xóa cuộc trò chuyện "${title}".`);
          } catch (err) {
            console.error('Lỗi xóa cuộc trò chuyện:', err);
            showToast('error', 'Lỗi', 'Không thể xóa cuộc trò chuyện.');
          }
        }
      });
    });
  }

  // Open Chat Preview Modal (Read-Only)
  function openChatPreviewModal(convId, title) {
    if (previewTitle) previewTitle.textContent = `👁️ ${title}`;
    if (previewSubtitle) previewSubtitle.textContent = `Mã Chat: ${convId} (Chế độ Đọc kiểm duyệt)`;
    if (previewMessagesContainer) previewMessagesContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">Đang tải tin nhắn...</div>`;

    if (modalPreview) {
      modalPreview.classList.remove('hidden');
      modalPreview.classList.add('active');
      modalPreview.style.display = 'flex';
    }

    if (unsubscribeMessages) unsubscribeMessages();

    const messagesRef = collection(db, 'conversations', convId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        previewMessagesContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">Chưa có tin nhắn nào trong cuộc trò chuyện này.</div>`;
        return;
      }

      previewMessagesContainer.innerHTML = snapshot.docs.map(docSnap => {
        const msg = docSnap.data();
        const sender = allUsersMap[msg.senderId] || {};
        const senderName = sender.fullName || msg.senderName || 'Ẩn danh';
        const senderRole = sender.role ? `(${sender.role})` : '';
        const timeStr = msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
        const textContent = replaceShortcodes(msg.text || '');

        const imageHtml = msg.imageUrl
          ? `<div style="margin-top: 6px;"><img src="${msg.imageUrl}" style="max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: cover;"></div>`
          : '';

        return `
          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 600; font-size: 13px; color: var(--color-primary-light);">${senderName} <small style="color: var(--text-muted); font-weight: normal;">${senderRole}</small></span>
              <span style="font-size: 11px; color: var(--text-muted);">${timeStr}</span>
            </div>
            <div style="font-size: 13px; color: var(--text-primary); line-height: 1.4; word-break: break-word;">${textContent}</div>
            ${imageHtml}
          </div>
        `;
      }).join('');

      // Auto scroll to bottom
      previewMessagesContainer.scrollTop = previewMessagesContainer.scrollHeight;
    }, (err) => {
      console.error('Lỗi tải tin nhắn preview:', err);
      previewMessagesContainer.innerHTML = `<div style="text-align: center; color: var(--color-danger); padding: 20px;">Lỗi tải tin nhắn.</div>`;
    });
  }

  // Close Preview Modal
  function closePreview() {
    if (modalPreview) {
      modalPreview.classList.add('hidden');
      modalPreview.classList.remove('active');
      modalPreview.style.display = 'none';
    }
    if (unsubscribeMessages) unsubscribeMessages();
  }

  if (btnClosePreview) btnClosePreview.addEventListener('click', closePreview);
  if (btnDonePreview) btnDonePreview.addEventListener('click', closePreview);

  // Filter Listeners
  if (searchInput) searchInput.addEventListener('input', renderChatsTable);
  if (typeFilter) typeFilter.addEventListener('change', renderChatsTable);

  // Toast Function
  function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 5000);
  }
});
