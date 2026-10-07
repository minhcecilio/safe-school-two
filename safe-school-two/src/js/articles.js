import { auth, db, collection, getDocs, addDoc, serverTimestamp, onAuthStateChanged, doc, getDoc } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const blogsContainer = document.getElementById('blogs-container');
  const filterChips = document.querySelectorAll('.filter-chip');
  const searchInput = document.getElementById('search-input');

  const btnCreatePost = document.getElementById('btn-create-post');
  const modalPost = document.getElementById('modal-post');
  const btnClosePostModal = document.getElementById('btn-close-post-modal');
  const formCreatePost = document.getElementById('form-create-post');
  const modalPostTitle = document.getElementById('modal-post-title');

  // Tabs
  const tabSharing = document.getElementById('tab-sharing-corner');
  const tabPropaganda = document.getElementById('tab-propaganda');
  const quickComposerCard = document.getElementById('quick-composer-card');
  const btnQuickPostSubmit = document.getElementById('btn-quick-post-submit');

  let activeTab = 'sharing'; // 'sharing' or 'propaganda'
  let allBlogs = [];
  let currentFilter = 'all';
  let currentSearch = '';
  let currentUser = null;
  let currentUserProfile = null;

  // === Upload ảnh lên Cloudinary ===
  async function uploadImageToCloudinary(file) {
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Ảnh quá lớn', 'Vui lòng chọn ảnh dưới 10MB.');
      return null;
    }
    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/unmjajhr/auto/upload';
    const CLOUDINARY_UPLOAD_PRESET = 'safe_school_preset';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        console.warn('Cloudinary upload error response:', data);
      }
    } catch (err) {
      console.error('Lỗi upload Cloudinary:', err);
    }

    // Fallback: Read as Base64 data URL if Cloudinary network is unreachable
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // === Auth: track user for author info ===
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      try {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        if (uDoc.exists()) currentUserProfile = uDoc.data();
      } catch (e) { console.error(e); }

      const composerAvatar = document.getElementById('composer-user-avatar');
      if (composerAvatar && currentUserProfile?.fullName) {
        composerAvatar.textContent = currentUserProfile.fullName.charAt(0).toUpperCase();
      }
    } else {
      currentUser = null;
      currentUserProfile = null;
    }
  });

  async function fetchBlogs() {
    try {
      const querySnapshot = await getDocs(collection(db, 'articles'));
      
      if (querySnapshot.empty) {
        console.warn("No articles in Firestore. Using mock data.");
        allBlogs = getMockBlogs();
      } else {
        allBlogs = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
      }
      
      filterAndRender();
    } catch (error) {
      console.error("Error fetching articles:", error);
      allBlogs = getMockBlogs();
      filterAndRender();
    }
  }

  function getMockBlogs() {
    return [
      {
        id: '1', title: 'Nhận diện các dấu hiệu bạo lực học đường tiềm ẩn',
        summary: 'Bạo lực học đường không chỉ là những tác động vật lý. Việc cô lập, tẩy chay hay bạo lực ngôn từ cũng để lại những vết thương sâu sắc.',
        category: 'blhd', catName: 'Phòng chống BLHD', views: 1250, helpful: 342,
        image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=600&h=400',
        date: '18/07/2026', isPropaganda: true, authorRole: 'teacher'
      },
      {
        id: '2', title: 'Cyberbullying: Khi màn hình là vũ khí',
        summary: 'Bắt nạt trực tuyến đang trở thành một vấn nạn nhức nhối trong thời đại số. Hướng dẫn học sinh cách tự bảo vệ mình trên mạng xã hội.',
        category: 'cyber_safety', catName: 'An toàn không gian mạng', views: 890, helpful: 215,
        image: 'https://images.unsplash.com/photo-1614064641913-a5f11651eb7a?auto=format&fit=crop&q=80&w=600&h=400',
        date: '15/07/2026', isPropaganda: true, authorRole: 'counselor'
      },
      {
        id: '3', title: 'Kinh nghiệm tìm kiếm sự giúp đỡ khi bị trêu chọc ở trường',
        summary: 'Mình từng là nạn nhân bị trêu chọc ngoại hình, và đây là cách mình đã vượt qua nhờ sự hỗ trợ của phòng tư vấn tâm lý.',
        category: 'sharing', catName: 'Góc chia sẻ', views: 420, helpful: 98,
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600&h=400',
        date: '20/07/2026', isPropaganda: false, authorRole: 'student', author: 'Học sinh An Danh'
      }
    ];
  }

  const catNamesMap = {
    'blhd': 'Phòng chống BLHD',
    'cyber_safety': 'An toàn không gian mạng',
    'mental_health': 'Sức khỏe tâm lý',
    'law': 'Góc pháp luật',
    'sharing': 'Góc chia sẻ'
  };

  function renderBlogs(blogs) {
    if (blogs.length === 0) {
      blogsContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>Không tìm thấy bài viết nào</h3>
          <p>Vui lòng thử từ khóa hoặc chọn tab khác.</p>
        </div>
      `;
      return;
    }

    blogsContainer.innerHTML = blogs.map(b => {
      const isOfficial = b.isPropaganda || ['teacher', 'counselor', 'admin'].includes(b.authorRole);
      const roleBadge = isOfficial 
        ? `<span class="badge badge-primary" style="font-size: 11px; margin-left: 6px;">📢 Tuyên truyền (Giáo viên)</span>`
        : `<span class="badge badge-success" style="font-size: 11px; margin-left: 6px;">💬 Bài chia sẻ (Học sinh)</span>`;

      return `
        <div class="blog-card" onclick="window.location.href='blog-detail.html?id=${b.id}'">
          <img src="${b.image || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=600&h=400'}" alt="${b.title}" class="blog-card-image" loading="lazy">
          <div class="blog-card-body">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span class="blog-card-category" style="background: var(--bg-glass); color: var(--color-primary-light);">${b.catName || catNamesMap[b.category] || 'Khác'}</span>
              ${roleBadge}
            </div>
            <h3 class="blog-card-title">${b.title}</h3>
            <p class="blog-card-summary">${b.summary}</p>
            <div class="blog-card-meta">
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                ${b.views || 0}
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                ${b.helpful || 0} hữu ích
              </span>
              <span style="margin-left: auto;">${b.date || ''}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function filterAndRender() {
    let filtered = allBlogs;
    
    // Tab Filter: phân tách rõ bài đăng tuyên truyền của GV/Admin & góc chia sẻ của Học Sinh
    if (activeTab === 'propaganda') {
      filtered = filtered.filter(b => 
        b.isPropaganda === true || 
        ['teacher', 'counselor', 'admin'].includes(b.authorRole) ||
        (b.category !== 'sharing' && b.authorRole !== 'student' && b.isPropaganda !== false)
      );
    } else if (activeTab === 'sharing') {
      filtered = filtered.filter(b => 
        b.isPropaganda === false || 
        b.category === 'sharing' || 
        b.authorRole === 'student' || 
        !b.authorRole
      );
    }

    // Category Filter Chip
    if (currentFilter !== 'all') {
      filtered = filtered.filter(b => b.category === currentFilter);
    }
    
    // Search
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      filtered = filtered.filter(b => 
        (b.title && b.title.toLowerCase().includes(q)) || 
        (b.summary && b.summary.toLowerCase().includes(q))
      );
    }
    
    renderBlogs(filtered);
  }

  // === Tab Event Handling ===
  if (tabSharing && tabPropaganda) {
    tabSharing.addEventListener('click', () => {
      activeTab = 'sharing';
      tabSharing.style.background = 'var(--color-primary)';
      tabSharing.style.color = '#fff';
      tabPropaganda.style.background = 'var(--bg-card)';
      tabPropaganda.style.color = 'var(--text-muted)';
      if (quickComposerCard) quickComposerCard.style.display = 'block';
      filterAndRender();
    });

    tabPropaganda.addEventListener('click', () => {
      activeTab = 'propaganda';
      tabPropaganda.style.background = 'var(--color-primary)';
      tabPropaganda.style.color = '#fff';
      tabSharing.style.background = 'var(--bg-card)';
      tabSharing.style.color = 'var(--text-muted)';
      if (quickComposerCard) quickComposerCard.style.display = 'none';
      filterAndRender();
    });
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      filterAndRender();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim();
      filterAndRender();
    });
  }

  // === Quick Post Submission (Góc chia sẻ của Học sinh) ===
  if (btnQuickPostSubmit) {
    btnQuickPostSubmit.addEventListener('click', async () => {
      if (!currentUser) {
        showToast('error', 'Chưa đăng nhập', 'Vui lòng đăng nhập để chia sẻ bài viết.');
        setTimeout(() => { window.location.href = '../auth/sign-in.html'; }, 1500);
        return;
      }

      const titleInput = document.getElementById('composer-title-input');
      const descInput = document.getElementById('composer-desc-input');
      const textEditor = document.getElementById('composer-text-editor');
      const textInput = document.getElementById('composer-text-input');
      const imageFileInput = document.getElementById('composer-image-file');
      const catSelect = document.getElementById('composer-category-select');

      let content = textEditor ? textEditor.innerHTML.trim() : textInput?.value.trim() || '';
      if (content === '<br>' || content === '<p><br></p>') content = '';

      const rawText = textEditor ? textEditor.textContent.trim() : content;
      const title = titleInput?.value.trim() || (rawText.length > 50 ? rawText.substring(0, 50) + '...' : rawText);
      const summary = descInput?.value.trim() || (rawText.length > 100 ? rawText.substring(0, 100) + '...' : rawText);
      const imageFile = imageFileInput?.files?.[0] || null;
      const category = catSelect ? catSelect.value : 'sharing';

      if (!content) {
        showToast('error', 'Lỗi', 'Vui lòng nhập nội dung chi tiết bài chia sẻ.');
        return;
      }

      btnQuickPostSubmit.disabled = true;
      btnQuickPostSubmit.textContent = 'Đang tải ảnh...';

      try {
        // Upload ảnh lên Cloudinary nếu có chọn ảnh
        let imageUrl = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600&h=400';
        if (imageFile) {
          btnQuickPostSubmit.textContent = 'Đang tải ảnh lên Cloudinary...';
          const uploaded = await uploadImageToCloudinary(imageFile);
          if (uploaded) imageUrl = uploaded;
        }

        btnQuickPostSubmit.textContent = 'Đang lưu bài...';
        const today = new Date().toLocaleDateString('vi-VN');
        const authorName = currentUserProfile?.fullName || currentUser?.displayName || 'Học sinh';

        const articleData = {
          title: title || 'Bài chia sẻ mới',
          category,
          catName: catNamesMap[category] || 'Góc chia sẻ',
          summary: summary || 'Bài chia sẻ từ học sinh',
          content: content.startsWith('<') ? content : `<p>${content.replace(/\n/g, '<br>')}</p>`,
          image: imageUrl,
          views: 1,
          helpful: 0,
          date: today,
          author: authorName,
          authorUid: currentUser.uid,
          authorRole: currentUserProfile?.role || 'student',
          isPropaganda: false,
          createdAt: serverTimestamp()
        };

        let newId = 'share_' + Date.now();
        try {
          const docRef = await addDoc(collection(db, 'articles'), articleData);
          if (docRef && docRef.id) newId = docRef.id;
        } catch (err) {
          console.warn('Lưu Firestore thất bại, lưu tạm local:', err);
        }

        allBlogs.unshift({ id: newId, ...articleData, createdAt: new Date() });
        if (titleInput) titleInput.value = '';
        if (descInput) descInput.value = '';
        if (textEditor) textEditor.innerHTML = '';
        if (textInput) textInput.value = '';
        
        // Reset composer image UI
        if (imageFileInput) imageFileInput.value = '';
        const composerPreview = document.getElementById('composer-img-preview');
        if (composerPreview) composerPreview.style.display = 'none';
        const composerLabel = document.getElementById('composer-img-label');
        if (composerLabel) {
          composerLabel.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Thêm ảnh';
          composerLabel.style.borderColor = '';
          composerLabel.style.color = '';
        }
        
        filterAndRender();
        showToast('success', 'Thành công!', 'Bài chia sẻ của bạn đã được đăng lên Góc Chia Sẻ.');
      } catch (e) {
        console.error('Lỗi đăng bài chia sẻ:', e);
        showToast('error', 'Lỗi', 'Không thể đăng bài viết. Vui lòng thử lại.');
      } finally {
        btnQuickPostSubmit.disabled = false;
        btnQuickPostSubmit.textContent = 'Đăng bài ngay 🚀';
      }
    });
  }

  // === Modal Open / Close & Role Permission Check ===
  function openModal() {
    if (!currentUser) {
      showToast('error', 'Yêu cầu đăng nhập', 'Vui lòng đăng nhập để đăng bài.');
      setTimeout(() => { window.location.href = '../auth/sign-in.html'; }, 1500);
      return;
    }

    const role = currentUserProfile?.role || 'student';
    const isAuthorizedForPropaganda = ['teacher', 'counselor', 'admin'].includes(role);

    if (activeTab === 'propaganda' && !isAuthorizedForPropaganda) {
      showToast('warning', 'Phân quyền Đăng bài', 'Mục Bài Tuyên Truyền dành riêng cho Giáo viên / Tham vấn viên / Admin. Bạn hãy chuyển sang tab "Góc Chia Sẻ" để đăng bài viết!');
      return;
    }

    if (modalPost) {
      modalPost.style.display = 'flex';
      modalPost.classList.remove('hidden');
      if (modalPostTitle) {
        modalPostTitle.textContent = isAuthorizedForPropaganda 
          ? 'Đăng bài viết tuyên truyền mới (Dành cho Giáo viên / Admin)' 
          : 'Tạo bài chia sẻ mới';
      }
      if (formCreatePost) formCreatePost.reset();
      const editor = document.getElementById('post-content-editor');
      if (editor) editor.innerHTML = '';
    }
  }

  function closeModal() {
    if (modalPost) {
      modalPost.style.display = 'none';
      modalPost.classList.add('hidden');
      if (formCreatePost) formCreatePost.reset();
      const editor = document.getElementById('post-content-editor');
      if (editor) editor.innerHTML = '';
    }
  }

  if (btnCreatePost) {
    btnCreatePost.addEventListener('click', openModal);
  }

  if (btnClosePostModal) {
    btnClosePostModal.addEventListener('click', closeModal);
  }

  if (modalPost) {
    modalPost.addEventListener('click', (e) => {
      if (e.target === modalPost) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalPost && !modalPost.classList.contains('hidden')) {
      closeModal();
    }
  });

  function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 4000);
  }

  // === Form Submit: Create New Article in Modal (Bài Tuyên Truyền) ===
  if (formCreatePost) {
    formCreatePost.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('post-title').value.trim();
      const category = document.getElementById('post-category').value;
      const summary = document.getElementById('post-summary').value.trim();
      
      const contentEditor = document.getElementById('post-content-editor');
      let content = contentEditor ? contentEditor.innerHTML.trim() : document.getElementById('post-content')?.value.trim() || '';
      if (content === '<br>' || content === '<p><br></p>') content = '';

      const imageFileInput = document.getElementById('post-image-file');
      const imageFile = imageFileInput?.files?.[0] || null;

      if (!title || !summary || !content) {
        showToast('error', 'Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc (Tiêu đề, Mô tả tóm tắt, Nội dung chi tiết).');
        return;
      }

      const btnSubmit = document.getElementById('btn-submit-post');
      btnSubmit.textContent = 'Đang đăng...';
      btnSubmit.disabled = true;

      try {
        // Upload ảnh lên Cloudinary nếu chọn file
        let imageUrl = 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=600&h=400';
        if (imageFile) {
          btnSubmit.textContent = 'Đang tải ảnh lên Cloudinary...';
          const uploaded = await uploadImageToCloudinary(imageFile);
          if (uploaded) imageUrl = uploaded;
        }

        btnSubmit.textContent = 'Đang lưu bài...';
        const today = new Date().toLocaleDateString('vi-VN');
        const authorName = currentUserProfile?.fullName || currentUser?.displayName || currentUser?.email || 'Người dùng';
        const authorUid = currentUser?.uid || null;
        const authorRole = currentUserProfile?.role || 'teacher';
        const isPropaganda = ['teacher', 'counselor', 'admin'].includes(authorRole) || activeTab === 'propaganda';

        const articleData = {
          title,
          category,
          catName: catNamesMap[category] || 'Khác',
          summary,
          content: content.startsWith('<') ? content : `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
          image: imageUrl,
          views: 0,
          helpful: 0,
          date: today,
          author: authorName,
          authorUid: authorUid,
          authorRole: authorRole,
          isPropaganda: isPropaganda,
          createdAt: serverTimestamp()
        };

        let newId = 'article_' + Date.now();
        try {
          const docRef = await addDoc(collection(db, 'articles'), articleData);
          if (docRef && docRef.id) newId = docRef.id;
        } catch (dbErr) {
          console.warn('Lưu bài viết vào Firestore thất bại, lưu tạm:', dbErr);
        }

        allBlogs.unshift({ id: newId, ...articleData, createdAt: new Date() });
        filterAndRender();
        closeModal();
        showToast('success', 'Thành công!', `Bài viết "${title}" đã được đăng thành công.`);

      } catch (error) {
        console.error('Lỗi đăng bài:', error);
        showToast('error', 'Lỗi', 'Có lỗi xảy ra khi đăng bài viết. Vui lòng thử lại.');
      } finally {
        btnSubmit.textContent = 'Đăng bài';
        btnSubmit.disabled = false;
      }
    });
  }

  fetchBlogs();
});
