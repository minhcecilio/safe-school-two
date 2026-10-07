import { auth, db, onAuthStateChanged, collection, query, where, orderBy, getDocs, getDoc, onSnapshot, addDoc, doc, setDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  let currentUser = null;
  let currentUserProfile = null;
  let activeConversationId = null;
  let activeConversationType = null;
  let unsubscribeMessages = null;
  let unsubscribeConvs = null;
  let unsubscribeInvites = null;


  const convsList = document.getElementById('conversations-list');
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const emptyState = document.getElementById('chat-empty-state');
  const activeState = document.getElementById('chat-active-state');
  
  const activeName = document.getElementById('active-chat-name');
  const activeAvatar = document.getElementById('active-chat-avatar');

  // Modals & Buttons
  const btnNewChat = document.getElementById('btn-new-chat');
  const modalCounselor = document.getElementById('modal-counselor');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const counselorsList = document.getElementById('counselors-list');

  const btnNewGroup = document.getElementById('btn-new-group');
  const modalGroup = document.getElementById('modal-group');
  const btnCloseGroupModal = document.getElementById('btn-close-group-modal');
  const btnCreateGroupSubmit = document.getElementById('btn-create-group-submit');
  const groupNameInput = document.getElementById('group-name-input');
  const membersSearchInput = document.getElementById('members-search-input');
  const membersSearchResults = document.getElementById('members-search-results');
  const membersSelectedContainer = document.getElementById('members-selected');
  const isAnonymousCheck = document.getElementById('chat-is-anonymous');

  const btnInbox = document.getElementById('btn-inbox');
  const modalInbox = document.getElementById('modal-inbox');
  const btnCloseInboxModal = document.getElementById('btn-close-inbox-modal');
  const inboxBadge = document.getElementById('inbox-badge');
  const invitesList = document.getElementById('invites-list');

  // Add Friend & Friend Request Modals
  const btnOpenAddFriend = document.getElementById('btn-open-add-friend');
  const modalAddFriend = document.getElementById('modal-add-friend');
  const btnCloseAddFriendModal = document.getElementById('btn-close-add-friend-modal');
  const friendSearchInput = document.getElementById('friend-search-input');
  const friendSearchResults = document.getElementById('friend-search-results');

  const btnFriendRequests = document.getElementById('btn-friend-requests');
  const modalFriendRequests = document.getElementById('modal-friend-requests');
  const btnCloseFriendReqModal = document.getElementById('btn-close-friend-req-modal');
  const friendRequestsList = document.getElementById('friend-requests-list');

  // Messenger Feature Elements
  const btnCallAudio = document.getElementById('btn-call-audio');
  const btnCallVideo = document.getElementById('btn-call-video');
  const btnChatTheme = document.getElementById('btn-chat-theme');
  const btnGroupInfo = document.getElementById('btn-group-info');

  const modalCall = document.getElementById('modal-call');
  const callVideoPreview = document.getElementById('call-video-preview');
  const callAvatarContainer = document.getElementById('call-avatar-container');
  const callUserAvatar = document.getElementById('call-user-avatar');
  const callUserName = document.getElementById('call-user-name');
  const callStatusText = document.getElementById('call-status-text');
  const callTimer = document.getElementById('call-timer');
  const btnCallMute = document.getElementById('btn-call-mute');
  const btnCallEnd = document.getElementById('btn-call-end');

  // Incoming Call Modal
  const modalIncomingCall = document.getElementById('modal-incoming-call');
  const incomingCallerAvatar = document.getElementById('incoming-caller-avatar');
  const incomingCallerName = document.getElementById('incoming-caller-name');
  const incomingCallType = document.getElementById('incoming-call-type');
  const btnAcceptCall = document.getElementById('btn-accept-call');
  const btnRejectCall = document.getElementById('btn-reject-call');

  const modalChatTheme = document.getElementById('modal-chat-theme');
  const btnCloseThemeModal = document.getElementById('btn-close-theme-modal');
  const themeOptions = document.querySelectorAll('.theme-option');

  const modalGroupInfo = document.getElementById('modal-group-info');
  const btnCloseGroupInfoModal = document.getElementById('btn-close-group-info-modal');
  const groupInfoAvatar = document.getElementById('group-info-avatar');
  const inputGroupNameEdit = document.getElementById('input-group-name-edit');
  const inputGroupAvatarFile = document.getElementById('input-group-avatar-file');
  const btnSaveGroupName = document.getElementById('btn-save-group-name');
  const btnSaveGroupAvatar = document.getElementById('btn-save-group-avatar');
  const groupMembersCount = document.getElementById('group-members-count');
  const groupMembersList = document.getElementById('group-members-list');

  // Context Menu & Reply & Emoji State
  const msgContextMenu = document.getElementById('msg-context-menu');
  const ctxReply = document.getElementById('ctx-reply');
  const ctxEdit = document.getElementById('ctx-edit');
  const ctxUnsend = document.getElementById('ctx-unsend');
  const replyPreviewBar = document.getElementById('reply-preview-bar');
  const replyTargetName = document.getElementById('reply-target-name');
  const replyTargetText = document.getElementById('reply-target-text');
  const btnCancelReply = document.getElementById('btn-cancel-reply');

  const btnToggleEmoji = document.getElementById('btn-toggle-emoji');
  const emojiPickerPopup = document.getElementById('emoji-picker-popup');

  let selectedMembers = [];
  let allUsersCache = [];
  let callInterval = null;
  let callSecs = 0;
  let isCallMuted = false;
  let localMediaStream = null;
  let remoteMediaStream = null;
  let peerConnection = null;
  let activeCallId = null;
  let unsubscribeCallDoc = null;
  let unsubscribeIceCandidates = null;

  let selectedMsgForCtx = null;
  let activeReplyTo = null;

  // Remote audio element for hearing the other party
  const remoteAudio = document.createElement('audio');
  remoteAudio.autoplay = true;
  remoteAudio.id = 'remote-audio';
  document.body.appendChild(remoteAudio);

  // ICE servers for WebRTC (Google STUN)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  // Shortcode conversion helper
  const emojiMap = {
    ':sob:': '😭', ':smile:': '😊', ':)': '😊', ':heart:': '❤️', '<3': '❤️',
    ':laugh:': '😂', ':D': '😂', ':thumbsup:': '👍', ':+1:': '👍',
    ':cry:': '😢', ':(': '😢', ':angry:': '😡', ':surprised:': '😮', ':O': '😮',
    ':fire:': '🔥', ':wave:': '👋', ':kiss:': '😘', ':wink:': '😉',
    ':100:': '💯', ':clap:': '👏', ':pray:': '🙏', ':star:': '⭐',
    ':sparkles:': '✨', ':tada:': '🎉', ':party:': '🥳', ':cool:': '😎',
    ':sunglasses:': '😎', ':thinking:': '🤔', ':skull:': '💀', ':ghost:': '👻',
    ':poop:': '💩', ':ok:': '👌', ':peace:': '✌️', ':muscle:': '💪',
    ':broken_heart:': '💔', ':eyes:': '👀', ':brain:': '🧠', ':hug:': '🤗',
    ':shush:': '🤫', ':zap:': '⚡', ':moon:': '🌙', ':sun:': '☀️',
    ':rainbow:': '🌈', ':rose:': '🌹', ':cherry:': '🍒', ':coffee:': '☕',
    ':pizza:': '🍕', ':cat:': '🐱', ':dog:': '🐶', ':panda:': '🐼',
    ':penguin:': '🐧', ':butterfly:': '🦋', ':rocket:': '🚀',
    ':check:': '✅', ':x:': '❌', ':warning:': '⚠️', ':info:': 'ℹ️',
    ':question:': '❓', ':exclamation:': '❗', ':bell:': '🔔',
    ':music:': '🎵', ':camera:': '📷', ':phone:': '📱', ':laptop:': '💻',
    ':gift:': '🎁', ':balloon:': '🎈', ':crown:': '👑', ':gem:': '💎',
    ':money:': '💰', ':trophy:': '🏆', ':medal:': '🏅',
    ':pleading:': '🥺', ':yum:': '😋', ':drool:': '🤤', ':nerd:': '🤓',
    ':devil:': '😈', ':angel:': '😇', ':sweat:': '😅', ':relieved:': '😌',
    ':sleepy:': '😴', ':dizzy:': '😵', ':sick:': '🤢', ':vomit:': '🤮',
    ':hot:': '🥵', ':cold:': '🥶', ':scream:': '😱', ':triumph:': '😤'
  };

  function convertShortcodesToEmojis(str) {
    if (!str) return str;
    let result = str;
    for (const [code, emoji] of Object.entries(emojiMap)) {
      // Escape regex special chars in the shortcode
      const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'gi'), emoji);
    }
    return result;
  }

  if (messageInput) {
    messageInput.addEventListener('input', (e) => {
      const original = e.target.value;
      const converted = convertShortcodesToEmojis(original);
      if (original !== converted) {
        e.target.value = converted;
      }
    });
  }

  if (btnToggleEmoji && emojiPickerPopup) {
    btnToggleEmoji.addEventListener('click', (e) => {
      e.stopPropagation();
      emojiPickerPopup.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!emojiPickerPopup.contains(e.target) && e.target !== btnToggleEmoji) {
        emojiPickerPopup.classList.add('hidden');
      }
    });

    emojiPickerPopup.querySelectorAll('span').forEach(span => {
      span.addEventListener('click', () => {
        const emoji = span.textContent;
        messageInput.value += emoji;
        emojiPickerPopup.classList.add('hidden');
        messageInput.focus();
      });
    });
  }

  // Auth observer
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) currentUserProfile = userDoc.data();
      
      loadConversations();
      listenToInvites();
      listenToIncomingCalls();
      listenToFriendRequests();
      listenToFriends();
      fetchAllUsersForCache();
    } else {
      window.location.href = '../auth/sign-in.html';
    }
  });

  // Close context menu when clicking outside
  document.addEventListener('click', (e) => {
    if (msgContextMenu && !msgContextMenu.contains(e.target)) {
      msgContextMenu.classList.add('hidden');
    }
  });

  if (btnCancelReply) {
    btnCancelReply.addEventListener('click', () => {
      activeReplyTo = null;
      replyPreviewBar.classList.add('hidden');
    });
  }

  // --- 1. CONVERSATIONS LIST ---
  function loadConversations() {
    if (unsubscribeConvs) unsubscribeConvs();

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    );

    unsubscribeConvs = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        convsList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">Chưa có cuộc trò chuyện nào.<br>Bấm "+ Cuộc tư vấn mới" hoặc "Tạo nhóm".</div>`;
        return;
      }

      const docsData = [];
      for (const docSnap of snapshot.docs) {
        const conv = docSnap.data();
        conv._id = docSnap.id;
        docsData.push(conv);
      }

      docsData.sort((a, b) => {
        const t1 = a.updatedAt ? a.updatedAt.toMillis() : 0;
        const t2 = b.updatedAt ? b.updatedAt.toMillis() : 0;
        return t2 - t1;
      });

      convsList.innerHTML = '';

      for (const conv of docsData) {
        let displayName = '';
        let displayAvatar = '';
        let displaySubtitle = conv.lastMessage || 'Chưa có tin nhắn';
        let isGroup = conv.type === 'group';

        if (isGroup) {
          displayName = conv.groupName || conv.title || 'Nhóm tư vấn';
          if (conv.groupAvatar || conv.avatar) {
            displayAvatar = `<img src="${conv.groupAvatar || conv.avatar}" alt="group-avatar">`;
          } else {
            displayAvatar = `<div class="group-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>`;
          }
          displaySubtitle = `<span class="group-badge">Nhóm</span> ` + displaySubtitle;
        } else {
          // 1-on-1 chat
          const otherUid = conv.participants.find(id => id !== currentUser.uid) || currentUser.uid;
          displayName = 'Người dùng';
          
          if (otherUid) {
            try {
              const otherDoc = await getDoc(doc(db, 'users', otherUid));
              if (otherDoc.exists()) {
                const data = otherDoc.data();
                displayName = data.fullName || 'Người dùng';
                let roleStr = data.role === 'counselor' ? ' (Tham vấn viên)' : (data.role === 'student' ? ' (Học sinh)' : '');
                displayName += roleStr;
                
                if (conv.anonymousUser === otherUid) {
                  displayName = 'Học sinh ẩn danh';
                  displayAvatar = '🤫';
                } else if (data.avatar) {
                  displayAvatar = `<img src="${data.avatar}" alt="avatar">`;
                } else {
                  displayAvatar = displayName.charAt(0).toUpperCase();
                }
              }
            } catch (e) { console.error(e); }
          }
        }

        const item = document.createElement('div');
        item.className = `conversation-item ${conv._id === activeConversationId ? 'active' : ''}`;
        item.innerHTML = `
          <div class="conversation-avatar" ${isGroup && !displayAvatar.includes('<img') ? 'style="background:transparent;"' : ''}>
            ${isGroup ? displayAvatar : (displayAvatar.startsWith('<') ? displayAvatar : `<span>${displayAvatar}</span>`)}
          </div>
          <div class="conversation-info">
            <div class="conversation-name">${displayName}</div>
            <div class="conversation-last-msg">${displaySubtitle}</div>
          </div>
        `;

        item.addEventListener('click', () => {
          document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          openChat(conv._id, displayName, displayAvatar, isGroup);
        });

        convsList.appendChild(item);
      }
    }, (error) => {
      console.error("Lỗi tải danh sách chat:", error);
      convsList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--color-danger);">Lỗi tải cuộc hội thoại.</div>`;
    });
  }

  // --- 2. OPEN CHAT WINDOW & LISTEN TO MESSAGES ---
  function openChat(convId, otherName, otherAvatarHtml, isGroup) {
    activeConversationId = convId;
    activeConversationType = isGroup ? 'group' : '1on1';
    
    emptyState.classList.add('hidden');
    emptyState.style.display = 'none';
    activeState.classList.remove('hidden');
    activeState.style.display = 'flex';

    if (btnGroupInfo) {
      btnGroupInfo.style.display = isGroup ? 'inline-flex' : 'none';
    }
    
    activeName.textContent = otherName.replace(/ \((.*?)\)/, ''); 
    
    if (isGroup) {
      if (typeof otherAvatarHtml === 'string' && otherAvatarHtml.includes('<img')) {
        activeAvatar.innerHTML = otherAvatarHtml;
      } else {
        activeAvatar.innerHTML = `<div style="background: linear-gradient(135deg, var(--color-accent), var(--color-primary)); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #fff;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>`;
      }
    } else if (otherAvatarHtml) {
      if (typeof otherAvatarHtml === 'string' && otherAvatarHtml.startsWith('<')) {
        activeAvatar.innerHTML = otherAvatarHtml;
      } else {
        activeAvatar.innerHTML = `<span>${otherAvatarHtml}</span>`;
      }
    } else {
      activeAvatar.textContent = otherName.charAt(0).toUpperCase();
    }

    if (unsubscribeMessages) unsubscribeMessages();

    // Listen to messages
    const q = query(
      collection(db, 'conversations', convId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
      chatMessages.innerHTML = '';
      snapshot.forEach(docSnap => {
        const msgId = docSnap.id;
        const msg = docSnap.data();
        const isSent = msg.senderUid === currentUser.uid;

        let timeStr = '';
        if (msg.createdAt && msg.createdAt.toDate) {
          timeStr = msg.createdAt.toDate().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }

        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
        
        let senderHtml = '';
        if (isGroup && !isSent && msg.senderName) {
          senderHtml = `<div class="group-sender-name" style="font-size: 11px; font-weight: 700; margin-bottom: 4px; color: var(--color-primary-light);">${msg.senderName}</div>`;
        }

        let replyHtml = '';
        if (msg.replyTo) {
          replyHtml = `
            <div class="quoted-msg-box">
              <div class="quoted-name">${msg.replyTo.senderName || 'Người dùng'}</div>
              <div class="quoted-text">${msg.replyTo.text || ''}</div>
            </div>
          `;
        }

        let textHtml = '';
        if (msg.isUnsent) {
          textHtml = `<em style="opacity: 0.7; font-style: italic;">Tin nhắn đã được thu hồi</em>`;
        } else {
          textHtml = `${msg.text} ${msg.isEdited ? '<span style="font-size: 10px; opacity: 0.7; margin-left: 4px;">(đã sửa)</span>' : ''}`;
        }

        let reactionsHtml = '';
        if (msg.reactions && Object.keys(msg.reactions).length > 0) {
          const counts = {};
          Object.values(msg.reactions).forEach(emoji => {
            if (emoji) counts[emoji] = (counts[emoji] || 0) + 1;
          });
          const badgeStr = Object.entries(counts).map(([em, cnt]) => `${em} ${cnt > 1 ? cnt : ''}`).join(' ');
          if (badgeStr) {
            reactionsHtml = `<div class="message-reactions-badge">${badgeStr}</div>`;
          }
        }

        bubble.innerHTML = `
          ${senderHtml}
          ${replyHtml}
          <div>${textHtml}</div>
          <div class="message-time">${timeStr}</div>
          ${reactionsHtml}
        `;

        // Context menu on Right-Click
        bubble.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          selectedMsgForCtx = { id: msgId, data: msg, isSent };

          if (isSent && !msg.isUnsent) {
            ctxEdit.style.display = 'flex';
            ctxUnsend.style.display = 'flex';
          } else {
            ctxEdit.style.display = 'none';
            ctxUnsend.style.display = 'none';
          }

          const mouseX = e.clientX;
          const mouseY = e.clientY;
          msgContextMenu.style.left = `${Math.min(mouseX, window.innerWidth - 230)}px`;
          msgContextMenu.style.top = `${Math.min(mouseY, window.innerHeight - 200)}px`;
          msgContextMenu.classList.remove('hidden');
        });

        chatMessages.appendChild(bubble);
      });

      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  // --- 3. CONTEXT MENU ACTIONS (REACTIONS, REPLY, EDIT, UNSEND) ---
  document.querySelectorAll('.btn-reaction').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!selectedMsgForCtx || !activeConversationId) return;
      const emoji = btn.getAttribute('data-emoji');
      msgContextMenu.classList.add('hidden');

      const msgRef = doc(db, 'conversations', activeConversationId, 'messages', selectedMsgForCtx.id);
      const currentReactions = selectedMsgForCtx.data.reactions || {};
      
      let updatedReactions = { ...currentReactions };
      if (updatedReactions[currentUser.uid] === emoji) {
        delete updatedReactions[currentUser.uid];
      } else {
        updatedReactions[currentUser.uid] = emoji;
      }

      await updateDoc(msgRef, { reactions: updatedReactions });
    });
  });

  if (ctxReply) {
    ctxReply.addEventListener('click', () => {
      msgContextMenu.classList.add('hidden');
      if (!selectedMsgForCtx) return;
      activeReplyTo = {
        id: selectedMsgForCtx.id,
        text: selectedMsgForCtx.data.text,
        senderName: selectedMsgForCtx.data.senderName || 'Người dùng'
      };
      replyTargetName.textContent = activeReplyTo.senderName;
      replyTargetText.textContent = activeReplyTo.text;
      replyPreviewBar.classList.remove('hidden');
      messageInput.focus();
    });
  }

  if (ctxEdit) {
    ctxEdit.addEventListener('click', async () => {
      msgContextMenu.classList.add('hidden');
      if (!selectedMsgForCtx || !activeConversationId) return;
      const newText = prompt('Chỉnh sửa tin nhắn:', selectedMsgForCtx.data.text);
      if (newText !== null && newText.trim() !== '' && newText.trim() !== selectedMsgForCtx.data.text) {
        await updateDoc(doc(db, 'conversations', activeConversationId, 'messages', selectedMsgForCtx.id), {
          text: convertShortcodesToEmojis(newText.trim()),
          isEdited: true
        });
      }
    });
  }

  if (ctxUnsend) {
    ctxUnsend.addEventListener('click', async () => {
      msgContextMenu.classList.add('hidden');
      if (!selectedMsgForCtx || !activeConversationId) return;
      if (confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) {
        await updateDoc(doc(db, 'conversations', activeConversationId, 'messages', selectedMsgForCtx.id), {
          isUnsent: true,
          text: 'Tin nhắn đã được thu hồi'
        });
        await setDoc(doc(db, 'conversations', activeConversationId), {
          lastMessage: 'Tin nhắn đã được thu hồi',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    });
  }

  // --- 4. SEND MESSAGE ---
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawText = messageInput.value.trim();
    if (!rawText || !activeConversationId) return;

    const text = convertShortcodesToEmojis(rawText);
    messageInput.value = '';

    try {
      const convDoc = await getDoc(doc(db, 'conversations', activeConversationId));
      let isAnon = false;
      if (convDoc.exists()) {
        const convData = convDoc.data();
        if (convData.anonymousUser === currentUser.uid) {
          isAnon = true;
        }
      }

      const msgPayload = {
        text: text,
        senderUid: currentUser.uid,
        senderName: isAnon ? 'Học sinh ẩn danh' : (currentUserProfile ? currentUserProfile.fullName : 'Người dùng'),
        createdAt: serverTimestamp()
      };

      if (activeReplyTo) {
        msgPayload.replyTo = activeReplyTo;
        activeReplyTo = null;
        replyPreviewBar.classList.add('hidden');
      }

      await addDoc(collection(db, 'conversations', activeConversationId, 'messages'), msgPayload);

      await setDoc(doc(db, 'conversations', activeConversationId), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
    }
  });

  // --- 5. REAL TWO-PARTY WEBRTC CALL SYSTEM ---

  function createPeerConnection(callType) {
    peerConnection = new RTCPeerConnection(iceServers);
    remoteMediaStream = new MediaStream();
    remoteAudio.srcObject = remoteMediaStream;

    // Add local tracks to peer connection
    if (localMediaStream) {
      localMediaStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localMediaStream);
      });
    }

    // Receive remote tracks
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteMediaStream.addTrack(track);
      });
      // If video call, show remote video
      if (callType === 'video' && callVideoPreview) {
        callVideoPreview.srcObject = remoteMediaStream;
        callVideoPreview.classList.remove('hidden');
        callVideoPreview.muted = false;
        if (callAvatarContainer) callAvatarContainer.style.display = 'none';
      }
      remoteAudio.srcObject = remoteMediaStream;
      callStatusText.textContent = 'Đang trong cuộc gọi';
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
        callStatusText.textContent = 'Đã kết nối';
        startCallTimer();
      } else if (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'failed') {
        callStatusText.textContent = 'Mất kết nối...';
      }
    };

    return peerConnection;
  }

  function startCallTimer() {
    if (callInterval) return; // Already running
    callTimer.style.display = 'block';
    callTimer.textContent = '00:00';
    callSecs = 0;
    callInterval = setInterval(() => {
      callSecs++;
      const mins = Math.floor(callSecs / 60).toString().padStart(2, '0');
      const secs = (callSecs % 60).toString().padStart(2, '0');
      callTimer.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  async function initiateCall(callType) {
    if (!activeConversationId) return;

    const convDoc = await getDoc(doc(db, 'conversations', activeConversationId));
    if (!convDoc.exists()) return;
    const convData = convDoc.data();
    const targetUid = convData.participants.find(id => id !== currentUser.uid) || currentUser.uid;

    // Show the call modal in "ringing" state
    modalCall.classList.remove('hidden');
    modalCall.classList.add('active');
    callUserName.textContent = activeName.textContent;
    callStatusText.textContent = 'Đang xin quyền truy cập thiết bị...';
    callTimer.style.display = 'none';
    callSecs = 0;
    isCallMuted = false;
    btnCallMute.classList.remove('active');

    if (callVideoPreview) {
      callVideoPreview.srcObject = null;
      callVideoPreview.classList.add('hidden');
    }
    if (callAvatarContainer) callAvatarContainer.style.display = 'block';
    callUserAvatar.innerHTML = activeAvatar.innerHTML;

    // Request media permissions BEFORE creating call document
    try {
      const constraints = callType === 'video' 
        ? { audio: true, video: { width: { ideal: 640 }, height: { ideal: 480 } } } 
        : { audio: true, video: false };
      localMediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Show local video preview for video calls (muted to prevent echo)
      if (callType === 'video' && callVideoPreview) {
        callVideoPreview.srcObject = localMediaStream;
        callVideoPreview.muted = true; // Mute local preview to avoid echo
        callVideoPreview.classList.remove('hidden');
        if (callAvatarContainer) callAvatarContainer.style.display = 'none';
      }
    } catch (err) {
      console.error('Không thể truy cập thiết bị:', err);
      callStatusText.textContent = '❌ Không thể truy cập Micro / Camera. Vui lòng cấp quyền trong trình duyệt.';
      return;
    }

    callStatusText.textContent = 'Đang chờ đối phương nhấc máy...';

    try {
      // Create call document in Firestore
      const callDocRef = await addDoc(collection(db, 'calls'), {
        callerUid: currentUser.uid,
        callerName: currentUserProfile ? currentUserProfile.fullName : 'Người dùng',
        targetUid: targetUid,
        conversationId: activeConversationId,
        type: callType,
        status: 'ringing',
        createdAt: serverTimestamp()
      });

      activeCallId = callDocRef.id;

      // Create peer connection and generate SDP offer
      createPeerConnection(callType);

      // Store ICE candidates to Firestore
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(collection(db, 'calls', activeCallId, 'callerCandidates'), 
            event.candidate.toJSON()
          );
        }
      };

      // Create and set SDP offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Store the offer in the call document
      await updateDoc(doc(db, 'calls', activeCallId), {
        offer: { type: offer.type, sdp: offer.sdp }
      });

      // Listen for call status changes (accepted/rejected/ended)
      if (unsubscribeCallDoc) unsubscribeCallDoc();
      unsubscribeCallDoc = onSnapshot(doc(db, 'calls', activeCallId), async (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        if (data.status === 'accepted' && data.answer && !peerConnection.currentRemoteDescription) {
          callStatusText.textContent = 'Đối phương đã nhấc máy! Đang kết nối...';
          
          // Set remote SDP answer
          const answerDesc = new RTCSessionDescription(data.answer);
          await peerConnection.setRemoteDescription(answerDesc);

          // Listen for callee's ICE candidates
          if (unsubscribeIceCandidates) unsubscribeIceCandidates();
          unsubscribeIceCandidates = onSnapshot(
            collection(db, 'calls', activeCallId, 'calleeCandidates'),
            (snapshot) => {
              snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                  const candidate = new RTCIceCandidate(change.doc.data());
                  peerConnection.addIceCandidate(candidate);
                }
              });
            }
          );

        } else if (data.status === 'rejected') {
          callStatusText.textContent = '❌ Đối phương đã từ chối cuộc gọi';
          setTimeout(() => endCall(), 2000);
        } else if (data.status === 'ended') {
          endCall();
        }
      });

    } catch (err) {
      console.error('Lỗi tạo cuộc gọi:', err);
      callStatusText.textContent = '❌ Lỗi kết nối server';
    }
  }

  function listenToIncomingCalls() {
    const q = query(
      collection(db, 'calls'),
      where('targetUid', '==', currentUser.uid),
      where('status', '==', 'ringing')
    );

    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type !== 'added') return;
        const callData = change.doc.data();
        const callId = change.doc.id;

        // Don't show incoming call if already in a call
        if (activeCallId) return;

        modalIncomingCall.classList.remove('hidden');
        modalIncomingCall.classList.add('active');

        incomingCallerName.textContent = callData.callerName || 'Người dùng';
        incomingCallType.textContent = callData.type === 'video' ? '📹 Cuộc gọi Video đến...' : '📞 Cuộc gọi thoại đến...';
        incomingCallerAvatar.textContent = (callData.callerName || 'U').charAt(0).toUpperCase();

        // Play ringtone animation
        const pulseRing = modalIncomingCall.querySelector('.call-pulse-ring');
        if (pulseRing) pulseRing.style.animationPlayState = 'running';

        btnAcceptCall.onclick = async () => {
          modalIncomingCall.classList.add('hidden');
          modalIncomingCall.classList.remove('active');
          activeCallId = callId;

          // Show the call UI
          modalCall.classList.remove('hidden');
          modalCall.classList.add('active');
          callUserName.textContent = callData.callerName || 'Người dùng';
          callUserAvatar.textContent = (callData.callerName || 'U').charAt(0).toUpperCase();
          callStatusText.textContent = 'Đang xin quyền truy cập thiết bị...';
          callTimer.style.display = 'none';
          isCallMuted = false;
          btnCallMute.classList.remove('active');

          // Get local media
          try {
            const constraints = callData.type === 'video'
              ? { audio: true, video: { width: { ideal: 640 }, height: { ideal: 480 } } }
              : { audio: true, video: false };
            localMediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            if (callData.type === 'video' && callVideoPreview) {
              callVideoPreview.srcObject = localMediaStream;
              callVideoPreview.muted = true;
              callVideoPreview.classList.remove('hidden');
              if (callAvatarContainer) callAvatarContainer.style.display = 'none';
            }
          } catch (err) {
            console.error('Callee cannot access media:', err);
            callStatusText.textContent = '❌ Không thể truy cập Micro / Camera';
            await updateDoc(doc(db, 'calls', callId), { status: 'ended' });
            return;
          }

          callStatusText.textContent = 'Đang thiết lập kết nối...';

          // Create peer connection for callee
          createPeerConnection(callData.type);

          // Store callee ICE candidates
          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              addDoc(collection(db, 'calls', callId, 'calleeCandidates'),
                event.candidate.toJSON()
              );
            }
          };

          // Get the caller's offer from Firestore
          const callDocSnap = await getDoc(doc(db, 'calls', callId));
          const callDocData = callDocSnap.data();

          if (callDocData.offer) {
            const offerDesc = new RTCSessionDescription(callDocData.offer);
            await peerConnection.setRemoteDescription(offerDesc);

            // Create and send SDP answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            await updateDoc(doc(db, 'calls', callId), {
              status: 'accepted',
              answer: { type: answer.type, sdp: answer.sdp }
            });

            // Listen for caller's ICE candidates
            if (unsubscribeIceCandidates) unsubscribeIceCandidates();
            unsubscribeIceCandidates = onSnapshot(
              collection(db, 'calls', callId, 'callerCandidates'),
              (snapshot) => {
                snapshot.docChanges().forEach(chg => {
                  if (chg.type === 'added') {
                    const candidate = new RTCIceCandidate(chg.doc.data());
                    peerConnection.addIceCandidate(candidate);
                  }
                });
              }
            );
          }

          // Listen for call document changes (ended)
          if (unsubscribeCallDoc) unsubscribeCallDoc();
          unsubscribeCallDoc = onSnapshot(doc(db, 'calls', callId), (docSnap2) => {
            if (!docSnap2.exists()) return;
            const d = docSnap2.data();
            if (d.status === 'ended') {
              endCall();
            }
          });
        };

        btnRejectCall.onclick = async () => {
          modalIncomingCall.classList.add('hidden');
          modalIncomingCall.classList.remove('active');
          await updateDoc(doc(db, 'calls', callId), { status: 'rejected' });
        };
      });
    });
  }

  function endCall() {
    if (callInterval) { clearInterval(callInterval); callInterval = null; }
    
    // Stop all local media tracks
    if (localMediaStream) {
      localMediaStream.getTracks().forEach(track => track.stop());
      localMediaStream = null;
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    // Cleanup remote
    if (remoteMediaStream) {
      remoteMediaStream.getTracks().forEach(track => track.stop());
      remoteMediaStream = null;
    }
    remoteAudio.srcObject = null;

    if (callVideoPreview) {
      callVideoPreview.srcObject = null;
      callVideoPreview.classList.add('hidden');
    }
    if (callAvatarContainer) callAvatarContainer.style.display = 'block';

    // Unsubscribe listeners
    if (unsubscribeCallDoc) { unsubscribeCallDoc(); unsubscribeCallDoc = null; }
    if (unsubscribeIceCandidates) { unsubscribeIceCandidates(); unsubscribeIceCandidates = null; }

    modalCall.classList.add('hidden');
    modalCall.classList.remove('active');

    const mins = Math.floor(callSecs / 60).toString().padStart(2, '0');
    const secs = (callSecs % 60).toString().padStart(2, '0');
    const durationStr = `${mins}:${secs}`;

    if (activeCallId) {
      updateDoc(doc(db, 'calls', activeCallId), { status: 'ended' }).catch(() => {});

      if (activeConversationId) {
        addDoc(collection(db, 'conversations', activeConversationId, 'messages'), {
          text: `📞 Cuộc gọi kết thúc (Thời gian: ${durationStr})`,
          senderUid: currentUser.uid,
          senderName: 'Hệ thống',
          createdAt: serverTimestamp()
        });
        setDoc(doc(db, 'conversations', activeConversationId), {
          lastMessage: `📞 Cuộc gọi kết thúc (${durationStr})`,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      activeCallId = null;
    }
  }

  if (btnCallAudio) btnCallAudio.addEventListener('click', () => initiateCall('audio'));
  if (btnCallVideo) btnCallVideo.addEventListener('click', () => initiateCall('video'));
  if (btnCallEnd) btnCallEnd.addEventListener('click', endCall);
  if (btnCallMute) {
    btnCallMute.addEventListener('click', () => {
      isCallMuted = !isCallMuted;
      btnCallMute.classList.toggle('active', isCallMuted);
      if (localMediaStream) {
        localMediaStream.getAudioTracks().forEach(t => t.enabled = !isCallMuted);
      }
    });
  }

  // Theme selector
  if (btnChatTheme) {
    btnChatTheme.addEventListener('click', () => {
      modalChatTheme.classList.remove('hidden');
      modalChatTheme.classList.add('active');
    });
  }

  if (btnCloseThemeModal) {
    btnCloseThemeModal.addEventListener('click', () => {
      modalChatTheme.classList.add('hidden');
      modalChatTheme.classList.remove('active');
    });
  }

  themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      themeOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const theme = opt.getAttribute('data-theme');
      
      chatMessages.className = 'chat-messages';
      if (theme && theme !== 'default') {
        chatMessages.classList.add(`theme-${theme}`);
      }
    });
  });

  // Group Info & Settings with KICK MEMBER and CLOUDINARY AVATAR UPLOAD
  if (btnGroupInfo) {
    btnGroupInfo.addEventListener('click', async () => {
      if (!activeConversationId) return;
      modalGroupInfo.classList.remove('hidden');
      modalGroupInfo.classList.add('active');

      const convSnap = await getDoc(doc(db, 'conversations', activeConversationId));
      if (convSnap.exists()) {
        const convData = convSnap.data();
        inputGroupNameEdit.value = convData.groupName || convData.title || '';
        
        if (convData.groupAvatar || convData.avatar) {
          groupInfoAvatar.innerHTML = `<img src="${convData.groupAvatar || convData.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
          groupInfoAvatar.textContent = '👥';
        }

        const participants = convData.participants || [];
        const isLeader = convData.createdBy === currentUser.uid;

        groupMembersCount.textContent = participants.length;
        groupMembersList.innerHTML = '<div style="text-align:center;padding:15px;color:var(--text-muted);">Đang tải thành viên...</div>';

        const memberItems = [];
        for (const uid of participants) {
          try {
            const uDoc = await getDoc(doc(db, 'users', uid));
            if (uDoc.exists()) {
              const uData = uDoc.data();
              const isCreator = convData.createdBy === uid;
              const roleLabel = uData.role === 'counselor' ? 'Tham vấn viên' : (uData.role === 'teacher' ? 'Giáo viên' : 'Học sinh');
              let avatarHtml = uData.avatar ? `<img src="${uData.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (uData.fullName ? uData.fullName.charAt(0).toUpperCase() : 'U');

              let kickBtnHtml = '';
              if (isLeader && uid !== currentUser.uid) {
                kickBtnHtml = `<button class="btn btn-danger btn-xs btn-kick-member" data-uid="${uid}" style="padding: 4px 10px; font-size: 11px;">Mời ra khỏi nhóm</button>`;
              }

              memberItems.push(`
                <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--bg-glass); border-radius:var(--radius-md);">
                  <div class="conversation-avatar" style="width:38px; height:38px; font-size:14px; flex-shrink:0;">${avatarHtml}</div>
                  <div style="flex:1; min-width:0;">
                    <div style="font-weight:600; font-size:var(--font-size-sm); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${uData.fullName || 'Người dùng'} ${isCreator ? '<span style="color:var(--color-primary-light); font-size:11px;">(Trưởng nhóm)</span>' : ''}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${roleLabel}</div>
                  </div>
                  ${kickBtnHtml}
                </div>
              `);
            }
          } catch(e) { console.error(e); }
        }

        groupMembersList.innerHTML = memberItems.join('');

        // Attach listeners for Kick buttons
        document.querySelectorAll('.btn-kick-member').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const targetUid = e.target.getAttribute('data-uid');
            if (!confirm('Bạn có chắc chắn muốn mời thành viên này rời khỏi nhóm?')) return;

            e.target.disabled = true;
            e.target.textContent = 'Đang xóa...';

            try {
              await updateDoc(doc(db, 'conversations', activeConversationId), {
                participants: arrayRemove(targetUid)
              });

              await addDoc(collection(db, 'conversations', activeConversationId, 'messages'), {
                text: `🚫 Trưởng nhóm đã mời một thành viên rời khỏi nhóm.`,
                senderUid: currentUser.uid,
                senderName: 'Hệ thống',
                createdAt: serverTimestamp()
              });

              btnGroupInfo.click();
              alert('Đã mời thành viên ra khỏi nhóm.');
            } catch (err) {
              console.error('Lỗi kick member:', err);
              alert('Có lỗi xảy ra khi xóa thành viên.');
            }
          });
        });
      }
    });
  }

  if (btnCloseGroupInfoModal) {
    btnCloseGroupInfoModal.addEventListener('click', () => {
      modalGroupInfo.classList.add('hidden');
      modalGroupInfo.classList.remove('active');
    });
  }

  if (btnSaveGroupName) {
    btnSaveGroupName.addEventListener('click', async () => {
      const newName = inputGroupNameEdit.value.trim();
      if (!newName || !activeConversationId) return;
      try {
        await updateDoc(doc(db, 'conversations', activeConversationId), {
          groupName: newName,
          title: newName
        });
        activeName.textContent = newName;
        alert('Đã đổi tên nhóm thành công!');
      } catch(e) { console.error('Lỗi đổi tên nhóm:', e); }
    });
  }

  // Cloudinary Group Avatar Upload
  if (btnSaveGroupAvatar) {
    btnSaveGroupAvatar.addEventListener('click', async () => {
      if (!inputGroupAvatarFile || !inputGroupAvatarFile.files[0]) {
        alert('Vui lòng chọn 1 tệp ảnh đại diện nhóm.');
        return;
      }
      if (!activeConversationId) return;

      btnSaveGroupAvatar.disabled = true;
      btnSaveGroupAvatar.textContent = 'Đang tải lên...';

      try {
        const file = inputGroupAvatarFile.files[0];
        const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/unmjajhr/auto/upload';
        const CLOUDINARY_UPLOAD_PRESET = 'safe_school_preset';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.secure_url) {
          const newAvatarUrl = data.secure_url;
          await updateDoc(doc(db, 'conversations', activeConversationId), {
            groupAvatar: newAvatarUrl,
            avatar: newAvatarUrl
          });
          groupInfoAvatar.innerHTML = `<img src="${newAvatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
          alert('Đã cập nhật ảnh đại diện nhóm thành công!');
        } else {
          alert('Không thể tải ảnh lên Cloudinary.');
        }
      } catch (err) {
        console.error('Lỗi tải ảnh đại diện nhóm:', err);
        alert('Có lỗi xảy ra khi tải ảnh đại diện nhóm.');
      } finally {
        btnSaveGroupAvatar.disabled = false;
        btnSaveGroupAvatar.textContent = 'Tải ảnh lên';
      }
    });
  }

  // --- 6. NEW CHAT (1-ON-1 COUNSELING) ---
  btnNewChat.addEventListener('click', () => {
    loadCounselors();
    modalCounselor.classList.remove('hidden');
    modalCounselor.classList.add('active');
  });

  btnCloseModal.addEventListener('click', () => {
    modalCounselor.classList.add('hidden');
    modalCounselor.classList.remove('active');
  });

  async function loadCounselors() {
    counselorsList.innerHTML = '<div style="text-align: center; padding: 20px;">Đang tải...</div>';
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'counselor'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        counselorsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Hiện chưa có tham vấn viên nào trên hệ thống.</div>';
        return;
      }

      counselorsList.innerHTML = '';
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const uid = docSnap.id;

        const item = document.createElement('div');
        item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-glass); border-radius: var(--radius-md);';
        
        let avatarHtml = data.avatar ? `<img src="${data.avatar}" alt="avatar">` : (data.fullName ? data.fullName.charAt(0).toUpperCase() : 'C');

        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="conversation-avatar" style="width: 40px; height: 40px;">${avatarHtml}</div>
            <div>
              <div style="font-weight: 600; font-size: 14px;">${data.fullName || 'Tham vấn viên'}</div>
              <div style="font-size: 12px; color: var(--color-success);">Chuyên gia tâm lý học đường</div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm btn-select-counselor" data-uid="${uid}" data-name="${data.fullName}">Nhắn tin</button>
        `;

        counselorsList.appendChild(item);
      });

      document.querySelectorAll('.btn-select-counselor').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetUid = e.target.getAttribute('data-uid');
          const targetName = e.target.getAttribute('data-name');
          start1On1Chat(targetUid, targetName);
        });
      });

    } catch (e) {
      console.error(e);
      counselorsList.innerHTML = '<div style="text-align: center; color: var(--color-danger);">Lỗi kết nối server.</div>';
    }
  }

  async function start1On1Chat(counselorUid, counselorName) {
    modalCounselor.classList.add('hidden');
    modalCounselor.classList.remove('active');

    const isAnon = isAnonymousCheck ? isAnonymousCheck.checked : false;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const snapshot = await getDocs(q);
    let existingConv = null;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.type !== 'group' && data.participants.includes(counselorUid)) {
        existingConv = { id: docSnap.id, ...data };
      }
    });

    if (existingConv) {
      openChat(existingConv.id, counselorName, null, false);
    } else {
      try {
        const convData = {
          type: '1on1',
          participants: [currentUser.uid, counselorUid],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: 'Cuộc hội thoại vừa bắt đầu'
        };

        if (isAnon) {
          convData.anonymousUser = currentUser.uid;
        }

        const newDoc = await addDoc(collection(db, 'conversations'), convData);
        openChat(newDoc.id, counselorName, null, false);
      } catch (err) {
        console.error('Lỗi khởi tạo chat:', err);
      }
    }
  }

  // --- 7. GROUP CHAT CREATION ---
  btnNewGroup.addEventListener('click', () => {
    modalGroup.classList.remove('hidden');
    modalGroup.classList.add('active');
  });

  btnCloseGroupModal.addEventListener('click', () => {
    modalGroup.classList.add('hidden');
    modalGroup.classList.remove('active');
  });

  async function fetchAllUsersForCache() {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      allUsersCache = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== currentUser.uid);
    } catch(e) { console.error(e); }
  }

  membersSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.trim().toLowerCase();
    if (!term) {
      membersSearchResults.innerHTML = '';
      return;
    }

    const matches = allUsersCache.filter(u => {
      const name = (u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return (name.includes(term) || email.includes(term)) && !selectedMembers.some(sm => sm.id === u.id);
    });

    if (matches.length === 0) {
      membersSearchResults.innerHTML = '<div style="padding: 8px; color: var(--text-muted); font-size: 13px;">Không tìm thấy người dùng phù hợp.</div>';
      return;
    }

    membersSearchResults.innerHTML = matches.map(u => `
      <div class="member-search-item" data-id="${u.id}" data-name="${u.fullName || 'Người dùng'}">
        <span>${u.fullName || 'Người dùng'} (${u.role === 'counselor' ? 'Tham vấn viên' : 'Học sinh'})</span>
        <button class="btn btn-xs btn-primary">+ Chọn</button>
      </div>
    `).join('');

    membersSearchResults.querySelectorAll('.member-search-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        const name = el.getAttribute('data-name');
        if (!selectedMembers.some(m => m.id === id)) {
          selectedMembers.push({ id, name });
          renderSelectedMembers();
        }
        membersSearchInput.value = '';
        membersSearchResults.innerHTML = '';
      });
    });
  });

  function renderSelectedMembers() {
    membersSelectedContainer.innerHTML = '';
    selectedMembers.forEach(m => {
      const tag = document.createElement('div');
      tag.className = 'selected-tag';
      tag.innerHTML = `
        <span>${m.name}</span>
        <button type="button" data-id="${m.id}">×</button>
      `;
      tag.querySelector('button').addEventListener('click', () => {
        selectedMembers = selectedMembers.filter(sm => sm.id !== m.id);
        renderSelectedMembers();
      });
      membersSelectedContainer.appendChild(tag);
    });
  }

  btnCreateGroupSubmit.addEventListener('click', async () => {
    const groupName = groupNameInput.value.trim();
    if (!groupName) {
      alert("Vui lòng nhập tên nhóm");
      return;
    }
    if (selectedMembers.length === 0) {
      alert("Vui lòng chọn ít nhất 1 thành viên để mời");
      return;
    }

    btnCreateGroupSubmit.disabled = true;
    btnCreateGroupSubmit.textContent = 'Đang tạo...';

    try {
      const convData = {
        type: 'group',
        groupName: groupName,
        title: groupName,
        createdBy: currentUser.uid,
        participants: [currentUser.uid],
        lastMessage: 'Nhóm vừa được tạo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const convRef = await addDoc(collection(db, 'conversations'), convData);

      const myName = currentUserProfile ? currentUserProfile.fullName : 'Người dùng';
      for (const member of selectedMembers) {
        await addDoc(collection(db, 'groupInvites'), {
          conversationId: convRef.id,
          groupName: groupName,
          invitedBy: currentUser.uid,
          invitedByName: myName,
          targetUid: member.id,
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }

      modalGroup.classList.add('hidden');
      modalGroup.classList.remove('active');
      alert('Tạo nhóm thành công! Đã gửi lời mời đến các thành viên.');
      
      openChat(convRef.id, groupName, null, true);

    } catch (error) {
      console.error('Lỗi tạo nhóm:', error);
      alert('Có lỗi xảy ra khi tạo nhóm.');
    } finally {
      btnCreateGroupSubmit.disabled = false;
      btnCreateGroupSubmit.textContent = 'Tạo nhóm';
    }
  });

  // --- 8. INBOX SYSTEM ---
  function listenToInvites() {
    const q = query(
      collection(db, 'groupInvites'),
      where('targetUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    unsubscribeInvites = onSnapshot(q, (snapshot) => {
      const count = snapshot.size;
      if (count > 0) {
        inboxBadge.style.display = 'flex';
        inboxBadge.textContent = count;
      } else {
        inboxBadge.style.display = 'none';
      }

      if (snapshot.empty) {
        invitesList.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">Không có lời mời nào.</div>`;
        return;
      }

      invitesList.innerHTML = '';
      snapshot.forEach(docSnap => {
        const invite = docSnap.data();
        const inviteId = docSnap.id;

        const item = document.createElement('div');
        item.className = 'invite-item';
        item.innerHTML = `
          <div class="invite-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="invite-info">
            <strong>${invite.groupName}</strong>
            <span>Được mời bởi: ${invite.invitedByName}</span>
          </div>
          <div class="invite-actions">
            <button class="btn btn-primary btn-sm btn-accept" data-id="${inviteId}" data-conv="${invite.conversationId}">Chấp nhận</button>
            <button class="btn btn-ghost btn-sm btn-reject" data-id="${inviteId}">Từ chối</button>
          </div>
        `;
        invitesList.appendChild(item);
      });

      document.querySelectorAll('.btn-accept').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const invId = e.target.getAttribute('data-id');
          const convId = e.target.getAttribute('data-conv');
          e.target.disabled = true;
          try {
            await updateDoc(doc(db, 'groupInvites', invId), { status: 'accepted' });
            await updateDoc(doc(db, 'conversations', convId), {
              participants: arrayUnion(currentUser.uid)
            });
          } catch(err) { console.error(err); }
        });
      });

      document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const invId = e.target.getAttribute('data-id');
          e.target.disabled = true;
          try {
            await updateDoc(doc(db, 'groupInvites', invId), { status: 'rejected' });
          } catch(err) { console.error(err); }
        });
      });
    });
  }

  btnInbox.addEventListener('click', () => {
    modalInbox.classList.remove('hidden');
    modalInbox.classList.add('active');
  });

  btnCloseInboxModal.addEventListener('click', () => {
    modalInbox.classList.add('hidden');
    modalInbox.classList.remove('active');
  });

  // --- FRIEND REQUESTS & FRIENDS SYSTEM ENHANCED ---
  const friendReqBadge = document.getElementById('friend-req-badge');

  const tabConvs = document.getElementById('tab-convs');
  const tabFriends = document.getElementById('tab-friends');
  const conversationsListEl = document.getElementById('conversations-list');
  const friendsListEl = document.getElementById('friends-list');
  const friendsCountBadge = document.getElementById('friends-count-badge');

  let unsubscribeFriendRequests = null;
  let unsubscribeFriendsList = null;
  let myFriendsList = [];
  let mySentRequests = [];
  let myReceivedRequests = [];

  // Tab switching logic
  if (tabConvs && tabFriends) {
    tabConvs.addEventListener('click', () => {
      tabConvs.classList.add('active');
      tabConvs.style.color = 'var(--text-primary)';
      tabConvs.style.borderBottomColor = 'var(--color-primary)';

      tabFriends.classList.remove('active');
      tabFriends.style.color = 'var(--text-muted)';
      tabFriends.style.borderBottomColor = 'transparent';

      if (conversationsListEl) conversationsListEl.style.display = 'block';
      if (friendsListEl) friendsListEl.style.display = 'none';
    });

    tabFriends.addEventListener('click', () => {
      tabFriends.classList.add('active');
      tabFriends.style.color = 'var(--text-primary)';
      tabFriends.style.borderBottomColor = 'var(--color-primary)';

      tabConvs.classList.remove('active');
      tabConvs.style.color = 'var(--text-muted)';
      tabConvs.style.borderBottomColor = 'transparent';

      if (conversationsListEl) conversationsListEl.style.display = 'none';
      if (friendsListEl) friendsListEl.style.display = 'block';
    });
  }

  // Helper for modals
  function showModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('hidden');
    modalEl.classList.add('active');
    modalEl.style.display = 'flex';
  }

  function hideModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('hidden');
    modalEl.classList.remove('active');
    modalEl.style.display = 'none';
  }

  // Toast notification helper
  function showToast(type, title, message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = 'pointer-events: auto; padding: 12px 16px; border-radius: var(--radius-md); background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: var(--shadow-lg); color: var(--text-primary); font-size: 13px; min-width: 250px; animation: slideIn 0.3s ease;';
    toast.innerHTML = `<strong>${title}</strong><div>${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  if (btnFriendRequests && modalFriendRequests) {
    btnFriendRequests.addEventListener('click', () => showModal(modalFriendRequests));
  }
  if (btnCloseFriendReqModal && modalFriendRequests) {
    btnCloseFriendReqModal.addEventListener('click', () => hideModal(modalFriendRequests));
  }
  if (modalFriendRequests) {
    modalFriendRequests.addEventListener('click', (e) => {
      if (e.target === modalFriendRequests) hideModal(modalFriendRequests);
    });
  }

  if (btnOpenAddFriend && modalAddFriend) {
    btnOpenAddFriend.addEventListener('click', () => {
      showModal(modalAddFriend);
      if (friendSearchInput) { friendSearchInput.value = ''; friendSearchInput.focus(); }
      renderFriendSearchResults('');
    });
  }
  if (btnCloseAddFriendModal && modalAddFriend) {
    btnCloseAddFriendModal.addEventListener('click', () => hideModal(modalAddFriend));
  }
  if (modalAddFriend) {
    modalAddFriend.addEventListener('click', (e) => {
      if (e.target === modalAddFriend) hideModal(modalAddFriend);
    });
  }

  let unsubscribeUsersCache = null;

  function fetchAllUsersForCache() {
    if (unsubscribeUsersCache) unsubscribeUsersCache();
    unsubscribeUsersCache = onSnapshot(collection(db, 'users'), (snapshot) => {
      allUsersCache = snapshot.docs.map(docSnap => ({
        uid: docSnap.id,
        ...docSnap.data()
      }));
      if (myFriendsList && myFriendsList.length > 0) {
        renderFriendsList(myFriendsList);
      }
      if (friendSearchInput && friendSearchInput.value.trim()) {
        renderFriendSearchResults(friendSearchInput.value.trim().toLowerCase());
      }
    }, (err) => {
      console.error('Lỗi tải danh sách người dùng cho cache:', err);
    });
  }

  // 1. Listen to Friend Requests (Incoming & Sent)
  function listenToFriendRequests() {
    if (!currentUser) return;
    if (unsubscribeFriendRequests) unsubscribeFriendRequests();

    const qRec = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const qSent = query(
      collection(db, 'friendRequests'),
      where('fromUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    onSnapshot(qSent, (snap) => {
      mySentRequests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    });

    unsubscribeFriendRequests = onSnapshot(qRec, (snapshot) => {
      myReceivedRequests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (friendReqBadge) {
        if (myReceivedRequests.length > 0) {
          friendReqBadge.textContent = myReceivedRequests.length;
          friendReqBadge.style.display = 'inline-flex';
        } else {
          friendReqBadge.style.display = 'none';
        }
      }
      renderFriendRequests(myReceivedRequests);
    });
  }

  // 2. Listen to Accepted Friends List
  function listenToFriends() {
    if (!currentUser) return;
    if (unsubscribeFriendsList) unsubscribeFriendsList();

    const q1 = query(collection(db, 'friends'), where('user1', '==', currentUser.uid));
    const q2 = query(collection(db, 'friends'), where('user2', '==', currentUser.uid));

    let list1 = [], list2 = [];
    
    const updateFriendsUI = () => {
      const combined = [...list1, ...list2];
      myFriendsList = combined.map(f => {
        const friendUid = f.user1 === currentUser.uid ? f.user2 : f.user1;
        const friendUser = allUsersCache.find(u => u.uid === friendUid) || {};
        return {
          id: f.id,
          friendUid: friendUid,
          fullName: friendUser.fullName || 'Người bạn',
          email: friendUser.email || '',
          avatar: friendUser.avatar || '',
          role: friendUser.role || 'student',
          updatedAt: friendUser.updatedAt
        };
      });

      if (friendsCountBadge) friendsCountBadge.textContent = myFriendsList.length;
      renderFriendsList(myFriendsList);
    };

    onSnapshot(q1, (snap) => {
      list1 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateFriendsUI();
    });

    onSnapshot(q2, (snap) => {
      list2 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateFriendsUI();
    });
  }

  function renderFriendsList(friends) {
    if (!friendsListEl) return;
    if (friends.length === 0) {
      friendsListEl.innerHTML = `<div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">Chưa có bạn bè nào.<br><button class="btn btn-secondary btn-sm" id="btn-empty-add-friend" style="margin-top: 12px;">+ Tìm bạn bè ngay</button></div>`;
      const btnEmpty = document.getElementById('btn-empty-add-friend');
      if (btnEmpty) btnEmpty.addEventListener('click', () => {
        showModal(modalAddFriend);
      });
      return;
    }

    friendsListEl.innerHTML = friends.map(f => {
      const isOnline = f.updatedAt ? (new Date() - f.updatedAt.toDate() < 5 * 60 * 1000) : false;
      const statusBadge = isOnline ? `<span style="color:#2ecc71; font-size:11px;">🟢 Online</span>` : `<span style="color:var(--text-muted); font-size:11px;">⚪ Offline</span>`;
      const roleLabels = { 'student': 'Học sinh', 'teacher': 'Giáo viên', 'counselor': 'Tham vấn viên', 'parent': 'Phụ huynh', 'admin': 'Admin' };

      return `
        <div class="conversation-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; gap: 10px; border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
            <div class="conversation-avatar" style="width: 40px; height: 40px; font-weight: 700; flex-shrink: 0;">${(f.fullName || 'U').charAt(0).toUpperCase()}</div>
            <div style="min-width: 0; flex: 1;">
              <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${f.fullName}</div>
              <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 8px;">
                <span>${roleLabels[f.role] || 'Học sinh'}</span>
                <span>•</span>
                ${statusBadge}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <button class="btn btn-primary btn-xs btn-chat-with-friend" data-uid="${f.friendUid}" data-name="${f.fullName}" data-avatar="${f.avatar}" style="padding: 6px 10px; font-size: 12px;">💬 Chat</button>
            <button class="btn btn-ghost btn-xs btn-unfriend" data-id="${f.id}" data-name="${f.fullName}" style="padding: 6px 8px; font-size: 12px; color: var(--color-danger);" title="Hủy kết bạn">❌</button>
          </div>
        </div>
      `;
    }).join('');

    friendsListEl.querySelectorAll('.btn-chat-with-friend').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const friendUid = e.currentTarget.dataset.uid;
        const friendName = e.currentTarget.dataset.name;
        const friendAvatar = e.currentTarget.dataset.avatar;
        await openFriendPrivateChat(friendUid, friendName, friendAvatar);
      });
    });

    friendsListEl.querySelectorAll('.btn-unfriend').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;
        await unfriendUser(id, name);
      });
    });
  }

  async function openFriendPrivateChat(friendUid, friendName, friendAvatar) {
    const convId = currentUser.uid < friendUid ? `${currentUser.uid}_${friendUid}` : `${friendUid}_${currentUser.uid}`;
    try {
      await setDoc(doc(db, 'conversations', convId), {
        type: '1on1',
        participants: [currentUser.uid, friendUid],
        participantNames: {
          [currentUser.uid]: currentUserProfile?.fullName || 'Người dùng',
          [friendUid]: friendName || 'Bạn bè'
        },
        participantAvatars: {
          [currentUser.uid]: currentUserProfile?.avatar || '',
          [friendUid]: friendAvatar || ''
        },
        lastMessage: 'Cuộc trò chuyện 1-1 bạn bè',
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (tabConvs) tabConvs.click();
      openChat(convId, friendName, friendAvatar, false);
    } catch (e) {
      console.error(e);
    }
  }

  async function unfriendUser(friendshipId, friendName) {
    if (confirm(`Bạn có chắc chắn muốn hủy kết bạn với "${friendName}"?`)) {
      try {
        await deleteDoc(doc(db, 'friends', friendshipId));
        showToast('info', 'Thông báo', `Đã hủy kết bạn với ${friendName}.`);
      } catch (e) {
        console.error(e);
        showToast('error', 'Lỗi', 'Không thể hủy kết bạn.');
      }
    }
  }

  function renderFriendRequests(reqs) {
    if (!friendRequestsList) return;
    if (reqs.length === 0) {
      friendRequestsList.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">Không có lời mời kết bạn nào.</div>`;
      return;
    }
    friendRequestsList.innerHTML = reqs.map(r => `
      <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-glass); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <div class="conversation-avatar" style="width: 40px; height: 40px; font-weight: 700;">${(r.fromName || 'U').charAt(0).toUpperCase()}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 14px;">${r.fromName || 'Người dùng'}</div>
          <div style="font-size: 12px; color: var(--text-muted);">Gửi lời mời kết bạn</div>
        </div>
        <button class="btn btn-primary btn-sm btn-accept-friend" data-id="${r.id}" data-fromuid="${r.fromUid}" data-fromname="${r.fromName}" data-fromavatar="${r.fromAvatar || ''}">Chấp nhận</button>
        <button class="btn btn-ghost btn-sm btn-reject-friend" data-id="${r.id}">Từ chối</button>
      </div>
    `).join('');

    friendRequestsList.querySelectorAll('.btn-accept-friend').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const reqId = e.currentTarget.dataset.id;
        const fromUid = e.currentTarget.dataset.fromuid;
        const fromName = e.currentTarget.dataset.fromname;
        const fromAvatar = e.currentTarget.dataset.fromavatar;
        await acceptFriendRequest(reqId, fromUid, fromName, fromAvatar);
      });
    });

    friendRequestsList.querySelectorAll('.btn-reject-friend').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const reqId = e.currentTarget.dataset.id;
        await rejectFriendRequest(reqId);
      });
    });
  }

  async function acceptFriendRequest(reqId, friendUid, friendName, friendAvatar) {
    try {
      await updateDoc(doc(db, 'friendRequests', reqId), { status: 'accepted' });

      await addDoc(collection(db, 'friends'), {
        user1: currentUser.uid,
        user2: friendUid,
        createdAt: serverTimestamp()
      });

      const convId = currentUser.uid < friendUid ? `${currentUser.uid}_${friendUid}` : `${friendUid}_${currentUser.uid}`;
      await setDoc(doc(db, 'conversations', convId), {
        type: '1on1',
        participants: [currentUser.uid, friendUid],
        participantNames: {
          [currentUser.uid]: currentUserProfile?.fullName || 'Người dùng',
          [friendUid]: friendName || 'Bạn bè'
        },
        participantAvatars: {
          [currentUser.uid]: currentUserProfile?.avatar || '',
          [friendUid]: friendAvatar || ''
        },
        lastMessage: 'Đã trở thành bạn bè. Bắt đầu trò chuyện ngay!',
        updatedAt: serverTimestamp()
      }, { merge: true });

      showToast('success', 'Thành công', `Bạn và ${friendName} đã trở thành bạn bè!`);
      hideModal(modalFriendRequests);
      openFriendPrivateChat(friendUid, friendName, friendAvatar);
    } catch (e) {
      console.error(e);
      showToast('error', 'Lỗi', 'Không thể chấp nhận lời mời kết bạn.');
    }
  }

  async function rejectFriendRequest(reqId) {
    try {
      await updateDoc(doc(db, 'friendRequests', reqId), { status: 'rejected' });
      showToast('info', 'Thông báo', 'Đã từ chối lời mời kết bạn.');
    } catch (e) {
      console.error(e);
    }
  }

  if (friendSearchInput) {
    friendSearchInput.addEventListener('input', (e) => {
      renderFriendSearchResults(e.target.value.trim().toLowerCase());
    });
  }

  function renderFriendSearchResults(term) {
    if (!friendSearchResults) return;
    if (!term) {
      friendSearchResults.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">Nhập tên người dùng để tìm kiếm...</div>`;
      return;
    }

    const results = allUsersCache.filter(u => u.uid !== currentUser.uid && (u.fullName || '').toLowerCase().includes(term));
    if (results.length === 0) {
      friendSearchResults.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">Không tìm thấy người dùng phù hợp.</div>`;
      return;
    }

    friendSearchResults.innerHTML = results.map(u => {
      const isAlreadyFriend = myFriendsList.some(f => f.friendUid === u.uid);
      const isSentPending = mySentRequests.some(r => r.toUid === u.uid);
      const isReceivedPending = myReceivedRequests.some(r => r.fromUid === u.uid);

      let actionBtn = `<button class="btn btn-primary btn-sm btn-send-friend-req" data-touid="${u.uid}" data-toname="${u.fullName || 'Người dùng'}" data-toavatar="${u.avatar || ''}">+ Kết bạn</button>`;

      if (isAlreadyFriend) {
        actionBtn = `<span class="badge" style="background: rgba(46, 204, 113, 0.15); color: #2ecc71; font-size: 12px; margin-right: 6px;">✅ Bạn bè</span>
                     <button class="btn btn-secondary btn-sm btn-open-friend-chat" data-uid="${u.uid}" data-name="${u.fullName || 'Người dùng'}" data-avatar="${u.avatar || ''}">💬 Chat</button>`;
      } else if (isSentPending) {
        actionBtn = `<span class="badge" style="background: rgba(241, 196, 15, 0.15); color: #f1c40f; font-size: 12px;">⏳ Đã gửi lời mời</span>`;
      } else if (isReceivedPending) {
        actionBtn = `<button class="btn btn-primary btn-sm btn-open-req-modal" style="font-size: 12px;">📩 Phản hồi lời mời</button>`;
      }

      return `
        <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-glass); border-radius: var(--radius-md);">
          <div class="conversation-avatar" style="width: 38px; height: 38px; font-weight: 700;">${(u.fullName || 'U').charAt(0).toUpperCase()}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 14px;">${u.fullName || 'Người dùng'}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${u.email || ''}</div>
          </div>
          <div style="display: flex; align-items: center;">${actionBtn}</div>
        </div>
      `;
    }).join('');

    friendSearchResults.querySelectorAll('.btn-send-friend-req').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const toUid = e.currentTarget.dataset.touid;
        const toName = e.currentTarget.dataset.toname;
        const toAvatar = e.currentTarget.dataset.toavatar;
        await sendFriendRequest(toUid, toName, toAvatar, e.currentTarget);
      });
    });

    friendSearchResults.querySelectorAll('.btn-open-friend-chat').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const uid = e.currentTarget.dataset.uid;
        const name = e.currentTarget.dataset.name;
        const avatar = e.currentTarget.dataset.avatar;
        hideModal(modalAddFriend);
        await openFriendPrivateChat(uid, name, avatar);
      });
    });

    friendSearchResults.querySelectorAll('.btn-open-req-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        hideModal(modalAddFriend);
        showModal(modalFriendRequests);
      });
    });
  }

  async function sendFriendRequest(toUid, toName, toAvatar, btnEl) {
    try {
      btnEl.disabled = true;
      btnEl.textContent = 'Đang gửi...';

      const q = query(
        collection(db, 'friendRequests'),
        where('fromUid', '==', currentUser.uid),
        where('toUid', '==', toUid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        showToast('info', 'Thông báo', `Bạn đã gửi lời mời kết bạn cho ${toName} rồi.`);
        btnEl.textContent = 'Đã gửi';
        return;
      }

      await addDoc(collection(db, 'friendRequests'), {
        fromUid: currentUser.uid,
        fromName: currentUserProfile?.fullName || 'Người dùng',
        fromAvatar: currentUserProfile?.avatar || '',
        toUid: toUid,
        toName: toName,
        toAvatar: toAvatar || '',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      showToast('success', 'Thành công', `Đã gửi lời mời kết bạn tới ${toName}!`);
      btnEl.textContent = 'Đã gửi lời mời';
    } catch (e) {
      console.error(e);
      showToast('error', 'Lỗi', 'Không thể gửi lời mời kết bạn.');
      btnEl.disabled = false;
      btnEl.textContent = '+ Kết bạn';
    }
  }

});
