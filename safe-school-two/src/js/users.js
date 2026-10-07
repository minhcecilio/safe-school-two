import { 
  auth, onAuthStateChanged, db, doc, getDoc, getDocs, collection, addDoc,
  onSnapshot, updateDoc, deleteDoc, serverTimestamp 
} from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('users-table-body');
  const searchInput = document.getElementById('users-search-input');
  const roleFilter = document.getElementById('users-role-filter');

  const statTotal = document.getElementById('stat-total-users');
  const statActive = document.getElementById('stat-active-users');
  const statLocked = document.getElementById('stat-locked-users');

  let currentUser = null;
  let currentUserRole = null;
  let allUsersList = [];
  let unsubscribeUsers = null;

  const roleLabels = {
    'student': 'Học sinh',
    'teacher': 'Giáo viên / Quản lý',
    'counselor': 'Tham vấn viên tâm lý',
    'parent': 'Phụ huynh',
    'admin': 'Admin Quản trị'
  };

  // Authority Hierarchy Levels
  const roleLevels = {
    'admin': 4,
    'counselor': 3,
    'teacher': 2,
    'parent': 1,
    'student': 1
  };

  let currentUserData = null;

  // Auth observer
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        currentUserData = userDoc.data();
        currentUserRole = currentUserData.role || 'student';
        
        // Authorization Check: Only authorized roles allowed (teacher, counselor, admin)
        if (!['teacher', 'counselor', 'admin'].includes(currentUserRole)) {
          alert('⚠️ Bạn không có quyền truy cập trang Quản lý Người dùng.');
          window.location.href = '../admin/dashboard.html';
          return;
        }

        listenToUsersList();
      }
    } else {
      window.location.href = '../auth/sign-in.html';
    }
  });

  // Listen to Firestore Users collection
  function listenToUsersList() {
    if (unsubscribeUsers) unsubscribeUsers();

    unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      allUsersList = snapshot.docs.map(docSnap => ({
        uid: docSnap.id,
        ...docSnap.data()
      }));

      renderUsersTable();
    }, (error) => {
      console.error('Lỗi tải danh sách người dùng:', error);
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-danger); padding: 30px;">Lỗi tải dữ liệu người dùng.</td></tr>`;
    });
  }

  function renderUsersTable() {
    if (!allUsersList || allUsersList.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">Chưa có người dùng nào.</td></tr>`;
      return;
    }

    const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const selectedRole = roleFilter ? roleFilter.value : 'all';

    // Filter logic
    const filteredUsers = allUsersList.filter(u => {
      const name = (u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();

      const matchesSearch = !searchTerm || name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
      const matchesRole = selectedRole === 'all' || u.role === selectedRole;

      return matchesSearch && matchesRole;
    });

    // Update Stats
    const totalCount = allUsersList.length;
    const lockedCount = allUsersList.filter(u => u.isLocked).length;
    const activeCount = totalCount - lockedCount;

    if (statTotal) statTotal.textContent = totalCount;
    if (statActive) statActive.textContent = activeCount;
    if (statLocked) statLocked.textContent = lockedCount;

    if (filteredUsers.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">Không tìm thấy người dùng phù hợp.</td></tr>`;
      return;
    }

    const myLevel = roleLevels[currentUserRole] || 1;

    tableBody.innerHTML = filteredUsers.map(u => {
      const isSelf = u.uid === currentUser.uid;
      const targetLevel = roleLevels[u.role] || 1;

      // HIERARCHY RULE: Cannot edit/lock/delete user with equal or higher authority level, or oneself
      const cannotEdit = isSelf || (targetLevel >= myLevel);

      const avatarHtml = u.avatar 
        ? `<img src="${u.avatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">`
        : `<div class="conversation-avatar" style="width:36px; height:36px; font-size:14px;">${(u.fullName || 'U').charAt(0).toUpperCase()}</div>`;

      const isLocked = !!u.isLocked;
      const isOnline = u.updatedAt ? (new Date() - u.updatedAt.toDate() < 5 * 60 * 1000) : false; // Online within 5 mins

      const onlineStatusBadge = isOnline 
        ? `<span style="color:#2ecc71; font-weight:600; font-size:12px;">🟢 Đang hoạt động</span>`
        : `<span style="color:var(--text-muted); font-size:12px;">⚪ Ngoại tuyến</span>`;

      const accountStatusBadge = isLocked 
        ? `<span class="status-badge locked">🔒 Đã khóa</span>`
        : `<span class="status-badge active">🟢 Hoạt động</span>`;

      const roleSelectOptions = `
        <select class="form-select user-role-select" data-uid="${u.uid}" data-level="${targetLevel}" ${cannotEdit ? 'disabled' : ''} style="padding: 4px 8px; font-size: 12px; height: 32px; width: 140px;">
          <option value="student" ${u.role === 'student' ? 'selected' : ''}>Học sinh</option>
          <option value="teacher" ${u.role === 'teacher' ? 'selected' : ''}>Giáo viên</option>
          <option value="counselor" ${u.role === 'counselor' ? 'selected' : ''}>Tham vấn viên</option>
          <option value="parent" ${u.role === 'parent' ? 'selected' : ''}>Phụ huynh</option>
        </select>
      `;

      let actionNotice = '';
      if (isSelf) {
        actionNotice = `<span style="font-size: 11px; color: var(--color-primary-light); font-weight: 500;">(Tài khoản của bạn)</span>`;
      } else if (targetLevel >= myLevel) {
        actionNotice = `<span style="font-size: 11px; color: var(--text-muted); opacity: 0.8;" title="Bạn không thể chỉnh sửa người dùng có thẩm quyền bằng hoặc cao hơn bạn">(Thẩm quyền cao hơn)</span>`;
      }

      const editInfoBtn = cannotEdit 
        ? '' 
        : `<button class="btn btn-secondary btn-xs btn-edit-user" data-uid="${u.uid}" data-level="${targetLevel}" data-name="${u.fullName || 'Người dùng'}" style="padding: 5px 10px; font-size: 11px;">✏️ Sửa</button>`;

      const lockActionBtn = isLocked 
        ? `<button class="btn btn-success btn-xs btn-unlock-user" data-uid="${u.uid}" data-level="${targetLevel}" data-name="${u.fullName || 'Người dùng'}" ${cannotEdit ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'style="padding: 5px 10px; font-size: 11px;"'}>🔓 Mở khóa</button>`
        : `<button class="btn btn-warning btn-xs btn-lock-user" data-uid="${u.uid}" data-level="${targetLevel}" data-name="${u.fullName || 'Người dùng'}" ${cannotEdit ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'style="padding: 5px 10px; font-size: 11px;"'}>🔒 Khóa</button>`;

      const deleteActionBtn = `<button class="btn btn-danger btn-xs btn-delete-user" data-uid="${u.uid}" data-level="${targetLevel}" data-name="${u.fullName || 'Người dùng'}" ${cannotEdit ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'style="padding: 5px 10px; font-size: 11px;"'}>🗑️ Xóa</button>`;

      const addFriendBtn = isSelf ? '' : `<button class="btn btn-primary btn-xs btn-add-friend-table" data-uid="${u.uid}" data-name="${u.fullName || 'Người dùng'}" data-avatar="${u.avatar || ''}" style="padding: 5px 10px; font-size: 11px;">🤝 Kết bạn</button>`;

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              ${avatarHtml}
              <div>
                <div style="font-weight:600;">${u.fullName || 'Người dùng'} ${actionNotice}</div>
                <div style="font-size:11px; color:var(--text-muted);">${roleLabels[u.role] || 'Học sinh'}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:500;">${u.email || '---'}</div>
            <div style="font-size:11px; color:var(--text-muted);">${u.phone || ''}</div>
          </td>
          <td>${roleSelectOptions}</td>
          <td>${onlineStatusBadge}</td>
          <td>${accountStatusBadge}</td>
          <td style="text-align: right;">
            <div style="display:flex; gap:6px; justify-content: flex-end; align-items: center;">
              ${cannotEdit && !isSelf ? '<span style="font-size: 11px; color: var(--text-muted); margin-right: 4px;">🔒 Sửa giới hạn</span>' : ''}
              ${editInfoBtn}
              ${addFriendBtn}
              ${lockActionBtn}
              ${deleteActionBtn}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    attachEventListeners();
  }

  function attachEventListeners() {
    const myLevel = roleLevels[currentUserRole] || 1;

    // 1. Role Change
    document.querySelectorAll('.user-role-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const uid = e.target.getAttribute('data-uid');
        const targetLevel = parseInt(e.target.getAttribute('data-level') || '1');

        if (targetLevel >= myLevel) {
          showToast('error', 'Không thể chỉnh sửa', 'Bạn không thể thay đổi vai trò của người dùng có thẩm quyền cao hơn hoặc bằng bạn.');
          renderUsersTable();
          return;
        }

        const newRole = e.target.value;
        try {
          await updateDoc(doc(db, 'users', uid), { role: newRole, updatedAt: serverTimestamp() });
          showToast('success', 'Thành công', 'Đã cập nhật vai trò người dùng.');
        } catch (err) {
          console.error('Lỗi đổi vai trò:', err);
          showToast('error', 'Thất bại', 'Không thể đổi vai trò.');
        }
      });
    });

    // 2. Lock User
    document.querySelectorAll('.btn-lock-user:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const uid = e.currentTarget.getAttribute('data-uid');
        const name = e.currentTarget.getAttribute('data-name');
        const targetLevel = parseInt(e.currentTarget.getAttribute('data-level') || '1');

        if (targetLevel >= myLevel) {
          showToast('error', 'Từ chối', 'Bạn không có quyền khóa tài khoản của người dùng này.');
          return;
        }

        if (confirm(`Bạn có chắc chắn muốn KHÓA tài khoản "${name}"? Người dùng này sẽ không thể đăng nhập nữa.`)) {
          try {
            await updateDoc(doc(db, 'users', uid), { isLocked: true, updatedAt: serverTimestamp() });
            showToast('success', 'Đã khóa', `Tài khoản ${name} đã bị khóa.`);
          } catch (err) {
            console.error('Lỗi khóa tài khoản:', err);
            showToast('error', 'Lỗi', 'Không thể khóa tài khoản.');
          }
        }
      });
    });

    // 3. Unlock User
    document.querySelectorAll('.btn-unlock-user:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const uid = e.currentTarget.getAttribute('data-uid');
        const name = e.currentTarget.getAttribute('data-name');
        const targetLevel = parseInt(e.currentTarget.getAttribute('data-level') || '1');

        if (targetLevel >= myLevel) {
          showToast('error', 'Từ chối', 'Bạn không có quyền mở khóa tài khoản của người dùng này.');
          return;
        }

        try {
          await updateDoc(doc(db, 'users', uid), { isLocked: false, updatedAt: serverTimestamp() });
          showToast('success', 'Đã mở khóa', `Tài khoản ${name} đã được mở khóa.`);
        } catch (err) {
          console.error('Lỗi mở khóa tài khoản:', err);
          showToast('error', 'Lỗi', 'Không thể mở khóa tài khoản.');
        }
      });
    });

    // 4. Delete User
    document.querySelectorAll('.btn-delete-user:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const uid = e.currentTarget.getAttribute('data-uid');
        const name = e.currentTarget.getAttribute('data-name');
        const targetLevel = parseInt(e.currentTarget.getAttribute('data-level') || '1');

        if (targetLevel >= myLevel) {
          showToast('error', 'Từ chối', 'Bạn không có quyền xóa tài khoản của người dùng này.');
          return;
        }

        if (confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨ VIỄN tài khoản "${name}" khỏi hệ thống?`)) {
          try {
            await deleteDoc(doc(db, 'users', uid));
            showToast('success', 'Đã xóa', `Tài khoản ${name} đã được xóa thành công.`);
          } catch (err) {
            console.error('Lỗi xóa người dùng:', err);
            showToast('error', 'Lỗi', 'Không thể xóa người dùng.');
          }
        }
      });
    });

    // 5. Add Friend
    document.querySelectorAll('.btn-add-friend-table').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const toUid = e.currentTarget.getAttribute('data-uid');
        const toName = e.currentTarget.getAttribute('data-name');
        const toAvatar = e.currentTarget.getAttribute('data-avatar');
        e.currentTarget.disabled = true;
        e.currentTarget.textContent = 'Đang gửi...';
        try {
          const fromName = currentUserData?.fullName || currentUser?.displayName || currentUser?.email || 'Người dùng';
          const fromAvatar = currentUserData?.avatar || '';
          await addDoc(collection(db, 'friendRequests'), {
            fromUid: currentUser.uid,
            fromName: fromName,
            fromAvatar: fromAvatar,
            toUid: toUid,
            toName: toName,
            toAvatar: toAvatar || '',
            status: 'pending',
            createdAt: serverTimestamp()
          });
          showToast('success', 'Thành công', `Đã gửi lời mời kết bạn tới ${toName}!`);
          e.currentTarget.textContent = 'Đã gửi';
        } catch (err) {
          console.error(err);
          showToast('error', 'Lỗi', 'Không thể gửi lời mời kết bạn.');
          e.currentTarget.disabled = false;
          e.currentTarget.textContent = '🤝 Kết bạn';
        }
      });
    });

    // 6. Edit User Profile (Admin & Teacher privilege)
    const modalEditUser = document.getElementById('modal-edit-user');
    const formEditUser = document.getElementById('form-edit-user');
    const btnCloseEditModal = document.getElementById('btn-close-edit-modal');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const editUidInput = document.getElementById('edit-user-uid');
    const editFullname = document.getElementById('edit-fullname');
    const editPhone = document.getElementById('edit-phone');
    const editDob = document.getElementById('edit-dob');
    const editCccd = document.getElementById('edit-cccd');
    const editSchool = document.getElementById('edit-school');
    const editGradeClass = document.getElementById('edit-gradeClass');
    const editRole = document.getElementById('edit-role');

    if (editCccd) {
      editCccd.oninput = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12);
      };
    }

    document.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.currentTarget.getAttribute('data-uid');
        const targetUser = allUsersList.find(u => u.uid === uid);
        if (!targetUser) return;

        editUidInput.value = uid;
        editFullname.value = targetUser.fullName || '';
        editPhone.value = targetUser.phone || '';
        editDob.value = targetUser.dob || '';
        editCccd.value = targetUser.cccd || '';
        editSchool.value = targetUser.school || '';
        editGradeClass.value = targetUser.gradeClass || '';
        editRole.value = targetUser.role || 'student';

        const targetLevel = roleLevels[targetUser.role] || 1;
        editRole.disabled = (targetLevel >= myLevel && currentUserRole !== 'admin');

        if (modalEditUser) modalEditUser.classList.remove('hidden');
      });
    });

    const closeEditModal = () => {
      if (modalEditUser) modalEditUser.classList.add('hidden');
    };
    if (btnCloseEditModal) btnCloseEditModal.onclick = closeEditModal;
    if (btnCancelEdit) btnCancelEdit.onclick = closeEditModal;

    if (formEditUser) {
      formEditUser.onsubmit = async (e) => {
        e.preventDefault();
        const uid = editUidInput.value;
        if (!uid) return;

        const fullName = editFullname.value.trim();
        const phone = editPhone.value.trim();
        const cccd = editCccd.value.trim();
        const dob = editDob.value;
        const school = editSchool.value.trim();
        const gradeClass = editGradeClass.value.trim();
        const role = editRole.value;

        if (!fullName) {
          showToast('error', 'Lỗi', 'Vui lòng nhập họ và tên.');
          return;
        }
        if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone)) {
          showToast('error', 'Lỗi', 'Số điện thoại không hợp lệ (cần 10 chữ số).');
          return;
        }
        if (!/^[0-9]{12}$/.test(cccd)) {
          showToast('error', 'Lỗi', 'Căn cước công dân phải nhập chính xác 12 chữ số.');
          return;
        }

        try {
          const btnSave = document.getElementById('btn-save-edit-user');
          if (btnSave) { btnSave.disabled = true; btnSave.textContent = 'Đang lưu...'; }

          await updateDoc(doc(db, 'users', uid), {
            fullName,
            phone,
            cccd,
            dob,
            school,
            gradeClass,
            role,
            updatedAt: serverTimestamp()
          });

          showToast('success', 'Thành công', `Đã cập nhật hồ sơ cho ${fullName}!`);
          closeEditModal();
        } catch (err) {
          console.error('Lỗi cập nhật người dùng:', err);
          showToast('error', 'Thất bại', 'Không thể lưu thông tin: ' + err.message);
        } finally {
          const btnSave = document.getElementById('btn-save-edit-user');
          if (btnSave) { btnSave.disabled = false; btnSave.textContent = '💾 Lưu cập nhật'; }
        }
      };
    }
  }

  // Filter Listeners
  if (searchInput) searchInput.addEventListener('input', renderUsersTable);
  if (roleFilter) roleFilter.addEventListener('change', renderUsersTable);

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
