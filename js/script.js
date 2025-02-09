  // Temel değişkenler
  let socket;
  let currentRoom = null;
  let currentUser = null;
  let screenStream = null;
  let isHost = false;

  // DOM elementleri
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const createRoomButton = document.getElementById('createRoomButton');
  const videoContainer = document.getElementById('videoContainer');
  const loginModal = document.getElementById('loginModal');
  const inviteLinkInput = document.getElementById('inviteLink');
  const viewersList = document.getElementById('viewersList');
  const viewersCount = document.getElementById('viewersCount');
  const userInfo = document.getElementById('userInfo');
  const status = document.getElementById('status');

  // Sayfa yüklendiğinde
  window.onload = function() {
      // URL'den oda ID'sini kontrol et
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('room');
      
      if (roomId) {
          currentRoom = roomId;
          createRoomButton.style.display = 'none';
      }
      
      loginModal.style.display = 'flex';
      initializeSocket();
  }

  // Socket.io bağlantısını başlat
  function initializeSocket() {
      socket = io('https://your-server.com', {
          transports: ['websocket'],
          upgrade: false
      });

      socket.on('connect', () => {
          showNotification('Sunucuya bağlanıldı');
      });

      socket.on('roomCreated', (roomId) => {
          currentRoom = roomId;
          isHost = true;
          updateInviteLink();
          showNotification('Yeni oda oluşturuldu');
      });

      socket.on('userJoined', (userData) => {
          updateViewersList(userData);
          showNotification(`${userData.name} odaya katıldı`);
      });

      socket.on('userLeft', (userData) => {
          removeViewer(userData.id);
          showNotification(`${userData.name} odadan ayrıldı`);
      });

      socket.on('error', (error) => {
          showNotification(error.message, 'error');
      });
  }

  // Kullanıcı adı gönderme
  function submitName() {
      const nameInput = document.getElementById('nameInput');
      const name = nameInput.value.trim();
      
      if (name) {
          currentUser = {
              id: socket.id,
              name: name
          };
          
          loginModal.style.display = 'none';
          userInfo.textContent = `Hoş geldin, ${name}`;
          
          if (currentRoom) {
              joinRoom(currentRoom);
          }
          
          showNotification('Giriş başarılı');
      } else {
          showNotification('Lütfen geçerli bir isim girin', 'error');
      }
  }

  // Yeni oda oluşturma
  createRoomButton.addEventListener('click', () => {
      const roomId = uuid.v4();
      socket.emit('createRoom', {
          roomId,
          userId: socket.id,
          userName: currentUser.name
      });
  });

  // Odaya katılma
  function joinRoom(roomId) {
      socket.emit('joinRoom', {
          roomId,
          userId: socket.id,
          userName: currentUser.name
      });
  }

  // Davet bağlantısını güncelleme
  function updateInviteLink() {
      const url = new URL(window.location.href);
      url.searchParams.set('room', currentRoom);
      inviteLinkInput.value = url.toString();
  }

  // Davet bağlantısını kopyalama
  function copyInviteLink() {
      inviteLinkInput.select();
      document.execCommand('copy');
      showNotification('Davet bağlantısı kopyalandı');
  }

  // İzleyici listesini güncelleme
  function updateViewersList(userData) {
      const li = document.createElement('li');
      li.id = `viewer-${userData.id}`;
      li.textContent = userData.name + (userData.id === socket.id ? ' (Sen)' : '');
      viewersList.appendChild(li);
      updateViewersCount();
  }

  // İzleyiciyi kaldırma
  function removeViewer(userId) {
      const viewer = document.getElementById(`viewer-${userId}`);
      if (viewer) {
          viewer.remove();
          updateViewersCount();
      }
  }

  // İzleyici sayısını güncelleme
  function updateViewersCount() {
      const count = viewersList.children.length;
      viewersCount.textContent = count;
      document.getElementById('viewerCount').textContent = `${count} izleyici`;
  }

  // Bildirim gösterme
  function showNotification(message, type = 'success') {
      const notification = document.getElementById('notification');
      notification.textContent = message;
      notification.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
      notification.style.display = 'block';
      
      setTimeout(() => {
          notification.style.display = 'none';
      }, 3000);
  }

  // Ekran paylaşımını başlatma
  startButton.addEventListener('click', async () => {
      try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true
          });
          
          const video = document.createElement('video');
          video.srcObject = screenStream;
          video.style.width = '100%';
          video.style.height = '100%';
          video.autoplay = true;
          
          videoContainer.innerHTML = '';
          videoContainer.appendChild(video);
          
          startButton.disabled = true;
          stopButton.disabled = false;
          status.textContent = 'Durum: Ekran paylaşımı aktif';
          
          // Stream'i diğer kullanıcılara gönder
          if (isHost) {
              socket.emit('streamStarted', {
                  roomId: currentRoom,
                  userId: socket.id
              });
          }
          
          screenStream.getVideoTracks()[0].addEventListener('ended', () => {
      stopSharing();
      if (isHost) {
          socket.emit('streamEnded', {
              roomId: currentRoom,
              userId: socket.id
          });
      }
  });
  } catch (err) {
      console.error('Hata:', err);
      status.textContent = 'Durum: Ekran paylaşımı başlatılamadı';
      showNotification('Ekran paylaşımı başlatılamadı', 'error');
  }
});

// Ekran paylaşımını durdurma
stopButton.addEventListener('click', stopSharing);

function stopSharing() {
  if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      screenStream = null;
  }
  videoContainer.innerHTML = '<div class="video-message">Ekran paylaşımı başlatmak için aşağıdaki butona tıklayın</div>';
  startButton.disabled = false;
  stopButton.disabled = true;
  status.textContent = 'Durum: Beklemede';
  
  if (isHost) {
      socket.emit('streamEnded', {
          roomId: currentRoom,
          userId: socket.id
      });
  }
}

// Sorumluluk reddi işlemleri
const disclaimerModal = document.getElementById('disclaimerModal');
const disclaimerCheckbox = document.getElementById('disclaimerCheckbox');
const acceptButton = document.getElementById('acceptDisclaimer');
const rejectButton = document.getElementById('rejectDisclaimer');

// Sayfa yüklendiğinde sorumluluk reddi modalını göster
window.onload = function() {
  disclaimerModal.style.display = 'flex';
};

// Checkbox durumunu kontrol et
disclaimerCheckbox.addEventListener('change', function() {
  acceptButton.disabled = !this.checked;
});

// Kabul et butonuna tıklandığında
acceptButton.addEventListener('click', function() {
  disclaimerModal.style.display = 'none';
  loginModal.style.display = 'flex';
  initializeSocket();
});

// Reddet butonuna tıklandığında
rejectButton.addEventListener('click', function() {
  window.location.href = 'about:blank'; // veya başka bir sayfaya yönlendir
});

// Enter tuşu ile isim gönderme
document.getElementById('nameInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
      submitName();
  }
});

// Sayfa kapatılırken veya yenilenirken
window.addEventListener('beforeunload', function() {
  if (currentRoom) {
      socket.emit('leaveRoom', {
          roomId: currentRoom,
          userId: socket.id,
          userName: currentUser?.name
      });
  }
});

// Socket.io error handling
socket.on('connect_error', (error) => {
  showNotification('Sunucu bağlantısı kurulamadı', 'error');
});

socket.on('connect_timeout', () => {
  showNotification('Sunucu bağlantı zaman aşımı', 'error');
});