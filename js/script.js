// Socket.IO bağlantısı
const socketScript = document.createElement('script');
socketScript.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
document.head.appendChild(socketScript);

let socket;

document.getElementById('startBroadcast').addEventListener('click', async () => {
    // Yükleme animasyonunu göster
    document.getElementById('loading').style.display = 'inline-block';

    // Rastgele bir oda ID'si oluştur
    const roomId = Math.random().toString(36).substring(7);
    const inviteLink = `${window.location.origin}?roomId=${roomId}`;

    // Davet linkini göster
    setTimeout(() => {
        document.getElementById('link').textContent = inviteLink;
        document.getElementById('inviteLink').classList.add('show');
        document.getElementById('loading').style.display = 'none'; // Yükleme animasyonunu gizle
    }, 1000); // 1 saniye sonra yükleme animasyonunu kapat

    // Yeni sekmede yayın odasını aç
    window.open(inviteLink, '_blank');

    // Socket.IO bağlantısını başlat
    socketScript.onload = () => {
        socket = io();
        socket.emit('createRoom', roomId); // Sunucuya oda oluşturma isteği gönder
    };
});

// Eğer URL'de roomId varsa, yayın odasını aç
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');

if (roomId) {
    // Yayın odası için içerik oluştur
    document.body.innerHTML = `
        <div class="container-fluid d-flex justify-content-center align-items-center vh-100">
            <div class="text-center">
                <h1 class="mb-4">Yayın Odası</h1>
                <video id="screenVideo" autoplay style="border: 2px solid white; border-radius: 10px;"></video>
                <button id="shareScreen" class="btn btn-custom btn-lg mt-3">Ekran Paylaş</button>
            </div>
        </div>
        <footer class="footer">
            <div class="container text-center">
                <p>&copy; 2023 Ekran Paylaşım Platformu | <strong>Tasarlayan:</strong> Adınız Soyadınız</p>
            </div>
        </footer>
    `;

    const screenVideo = document.getElementById('screenVideo');

    // Socket.IO bağlantısını başlat
    socketScript.onload = () => {
        socket = io();
        socket.emit('joinRoom', roomId); // Sunucuya katılma isteği gönder

        // WebRTC bağlantısı kur
        socket.on('stream', async (streamId) => {
            const peerConnection = new RTCPeerConnection();

            // ICE adaylarını sunucuya gönder
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('relayICE', { roomId, candidate: event.candidate });
                }
            };

            // Uzak video akışını ekle
            peerConnection.ontrack = (event) => {
                screenVideo.srcObject = event.streams[0];
            };

            // SDP teklifini işle
            socket.on('offer', async (offer) => {
                await peerConnection.setRemoteDescription(offer);
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('answer', { roomId, answer });
            });

            // ICE adaylarını işle
            socket.on('iceCandidate', (candidate) => {
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            });
        });
    };

    // Ekran paylaş butonu
    document.getElementById('shareScreen').addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenVideo.srcObject = stream;

            // WebRTC bağlantısı kur
            const peerConnection = new RTCPeerConnection();

            // Video akışını ekle
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

            // SDP teklifini oluştur ve sunucuya gönder
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('offer', { roomId, offer });

            // ICE adaylarını sunucuya gönder
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('relayICE', { roomId, candidate: event.candidate });
                }
            };
        } catch (error) {
            console.error('Ekran paylaşımı başarısız:', error);
        }
    });
}
