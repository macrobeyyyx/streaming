import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { configureSecurity } from './security.js';
import { setupRoutes } from './routes.js';

// Ortam değişkenlerini yükle
dotenv.config();

// Express uygulamasını oluştur
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Güvenlik ayarlarını yapılandır
configureSecurity(app);

// Middleware'leri ekle
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(morgan('combined'));

// Rotaları ayarla
setupRoutes(app, io);

// Statik dosyaları sun
app.use(express.static('public'));

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});