import { auth, onAuthStateChanged, db, collection, addDoc, serverTimestamp } from './firebaseConfig.js';
import { showToast } from './main.js';

const questions = [
  { id: 'q1', text: '1. Tôi cảm thấy khó để thoải mái được.' },
  { id: 'q2', text: '2. Tôi bị khô miệng.' },
  { id: 'q3', text: '3. Tôi không hề thấy có chút cảm xúc tích cực nào.' },
  { id: 'q4', text: '4. Tôi bị rối loạn nhịp thở (thở gấp, khó thở dù không làm việc nặng).' },
  { id: 'q5', text: '5. Tôi cảm thấy khó khăn để bắt tay vào làm việc gì đó.' },
  { id: 'q6', text: '6. Tôi phản ứng thái quá với các tình huống xảy ra.' },
  { id: 'q7', text: '7. Tôi bị run (ví dụ: run tay).' },
];

const options = [
  { value: 0, text: '0 - Không đúng với tôi chút nào' },
  { value: 1, text: '1 - Đúng với tôi một phần / Thỉnh thoảng' },
  { value: 2, text: '2 - Đúng với tôi phần nhiều / Phần lớn thời gian' },
  { value: 3, text: '3 - Hoàn toàn đúng với tôi / Hầu hết thời gian' },
];

let currentUserUid = null;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('dass-form');
  const questionsWrapper = document.getElementById('questions-wrapper');
  const resultModal = document.getElementById('result-modal');
  const resultIcon = document.getElementById('result-icon');
  const resultTitle = document.getElementById('result-title');
  const resultDesc = document.getElementById('result-desc');
  const btnCounseling = document.getElementById('btn-counseling');

  // Authentication
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserUid = user.uid;
    } else {
      currentUserUid = null;
    }
  });

  // Sidebar mobile toggle
  const sidebar = document.getElementById('sidebar');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('active');
    });
  }
  
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Render questions
  let html = '';
  questions.forEach((q, index) => {
    html += `
      <div class="question-card">
        <h3 class="question-title">${q.text}</h3>
        <div class="options-grid">
    `;
    options.forEach(opt => {
      html += `
        <label class="option-label">
          <input type="radio" name="${q.id}" value="${opt.value}" required>
          <span>${opt.text}</span>
        </label>
      `;
    });
    html += `
        </div>
      </div>
    `;
  });
  questionsWrapper.innerHTML = html;

  // Submit form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUserUid) {
      alert("Bạn cần đăng nhập để làm bài test này.");
      window.location.href = '../auth/sign-in.html';
      return;
    }

    const formData = new FormData(form);
    let totalScore = 0;
    const answers = {};

    for (let [key, value] of formData.entries()) {
      totalScore += parseInt(value, 10);
      answers[key] = parseInt(value, 10);
    }

    // Determine result (Simplistic rule for 7 questions)
    // Max score is 21
    let status = 'Bình thường';
    let icon = '😊';
    let color = 'var(--color-success)';
    let desc = 'Tâm trạng của bạn khá ổn định. Hãy tiếp tục duy trì những thói quen tích cực nhé!';
    let showCounseling = false;

    if (totalScore >= 14) {
      status = 'Căng thẳng nặng';
      icon = '🆘';
      color = 'var(--color-danger)';
      desc = 'Bạn đang trải qua mức độ căng thẳng rất cao. Chúng tôi khuyên bạn nên chia sẻ với ai đó hoặc trò chuyện với Tham vấn viên tâm lý ngay bây giờ.';
      showCounseling = true;
    } else if (totalScore >= 8) {
      status = 'Căng thẳng nhẹ/vừa';
      icon = '😟';
      color = 'var(--color-warning)';
      desc = 'Bạn đang có dấu hiệu căng thẳng. Hãy cố gắng dành thời gian nghỉ ngơi, thư giãn và chăm sóc bản thân nhiều hơn.';
      showCounseling = true;
    }

    // Update UI
    resultIcon.textContent = icon;
    resultTitle.textContent = status;
    resultTitle.style.color = color;
    resultDesc.textContent = desc;
    btnCounseling.style.display = showCounseling ? 'inline-block' : 'none';

    // Show modal
    resultModal.classList.add('show');

    // Save to Firestore
    try {
      await addDoc(collection(db, 'testResults'), {
        uid: currentUserUid,
        testType: 'DASS-7-Short',
        score: totalScore,
        answers: answers,
        result: status,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Lỗi khi lưu kết quả:", err);
    }

  });
});
