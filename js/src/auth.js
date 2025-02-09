import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET;

// Token oluştur
export function generateToken(roomId) {
    return jwt.sign({ roomId }, SECRET_KEY, { expiresIn: '1h' });
}

// Token doğrula
export function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
}

// Benzersiz oda ID'si oluştur
export function generateRoomId() {
    return crypto.randomBytes(16).toString('hex');
}