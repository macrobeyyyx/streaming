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
const joinRoomButton = document.getElementById('joinRoomButton');
const inviteCodeInput = document.getElementById('inviteCodeInput');
const videoContainer = document.getElementById('videoContainer');
const loginModal = document.getElementById('loginModal');
const inviteLinkInput = document.getElementById('inviteLink');
const viewersList = document.getElementById('viewersList');
const viewersCount = document.getElementById('viewersCount');
const userInfo = document.getElementById('userInfo');
const status = document.getElementById('status');

// Sayfa yüklendiğinde
window.onload = function() {
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
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    socket.emit('createRoom', {
        roomId,
        userId: socket.id,
        userName: currentUser.name
    });
    currentRoom = roomId;
    updateInviteLink();
    showNotification(`Oda oluşturuldu: ${roomId}`);
});

// Odaya katılma
joinRoomButton.addEventListener('click', () => {
    const roomId = inviteCodeInput.value.trim().toUpperCase();
    if (roomId) {
        joinRoom(roomId);
    } else {
        showNotification('Geçerli bir davet kodu girin', 'error');
    }
});

function joinRoom(roomId) {
    socket.emit('joinRoom', {
        roomId,
        userId: socket.id,
        userName: currentUser.name
    });
    currentRoom = roomId;
    showNotification(`Odaya katıldınız: ${roomId}`);
}

// Davet bağlantısını güncelleme
function updateInviteLink() {
    inviteLinkInput.value = currentRoom;
}

// Davet bağlantısını kopyalama
function copyInviteLink() {
    inviteLinkInput.select();
    document.execCommand('copy');
    showNotification('Davet kodu kopyalandı');
}
