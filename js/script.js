import { io } from 'https://cdn.socket.io/4.5.4/socket.io.esm.min.js';

// Modal ve kabul butonunu seç
const responsibilityModal = document.getElementById('responsibilityModal');
const acceptButton = document.getElementById('acceptResponsibility');

// Modal'ı göster
responsibilityModal.style.display = 'flex';

// Kullanıcı kabul ettiğinde modal'ı gizle
acceptButton.addEventListener('click', () => {
    responsibilityModal.style.display = 'none';
});

// Yayın başlatma butonu işlevselliği
document.getElementById('startBroadcast').addEventListener('click', async () => {
    const response = await fetch('/api/create-room', { method: 'POST' });
    const { roomId, token } = await response.json();

    const inviteLink = `${window.location.origin}/room.html?roomId=${roomId}&token=${token}`;
    document.getElementById('link').textContent = inviteLink;
    document.getElementById('inviteLink').style.display = 'block';

    window.open(inviteLink, '_blank');
});