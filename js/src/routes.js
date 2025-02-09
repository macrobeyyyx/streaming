import { generateToken, verifyToken, generateRoomId } from './auth.js';

export function setupRoutes(app, io) {
    // Yayın odası oluştur
    app.post('/api/create-room', (req, res) => {
        const roomId = generateRoomId();
        const token = generateToken(roomId);
        res.json({ roomId, token });
    });

    // Yayın odasına katıl
    app.get('/api/join/:roomId', (req, res) => {
        const { roomId } = req.params;
        const token = req.query.token;

        const decoded = verifyToken(token);
        if (!decoded || decoded.roomId !== roomId) {
            return res.status(403).json({ error: 'Geçersiz token!' });
        }

        res.json({ success: true, message: 'Odaya katıldı.' });
    });

    // Socket.IO bağlantısı
    io.on('connection', (socket) => {
        console.log('Bir kullanıcı bağlandı:', socket.id);

        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            console.log(`Kullanıcı odaya katıldı: ${roomId}`);
        });

        socket.on('offer', ({ roomId, offer }) => {
            socket.to(roomId).emit('offer', offer);
        });

        socket.on('answer', ({ roomId, answer }) => {
            socket.to(roomId).emit('answer', answer);
        });

        socket.on('relayICE', ({ roomId, candidate }) => {
            socket.to(roomId).emit('iceCandidate', candidate);
        });

        socket.on('disconnect', () => {
            console.log('Bir kullanıcı ayrıldı:', socket.id);
        });
    });
}