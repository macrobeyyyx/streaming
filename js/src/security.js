import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export function configureSecurity(app) {
    // Güvenlik başlıkları
    app.use(helmet());
    app.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.socket.io'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'", 'wss://ornek.com'],
            fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
        },
    }));

    app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
    app.use(helmet.frameguard({ action: 'deny' }));
    app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

    // Hız sınırlandırma
    const limiter = rateLimit({
        windowMs: 60 * 1000, // 1 dakika
        max: 30, // Maksimum istek sayısı
        message: 'Çok fazla istek yaptınız. Lütfen bir süre sonra tekrar deneyin.',
    });
    app.use(limiter);
}