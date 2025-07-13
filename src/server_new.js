const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

function loadLicenses() {
    if (process.env.LICENSES_JSON) {
        try {
            return JSON.parse(process.env.LICENSES_JSON);
        } catch {
            return {};
        }
    }

    const localPath = path.join(__dirname, 'licenses.local.json');
    if (fs.existsSync(localPath)) {
        try {
            return JSON.parse(fs.readFileSync(localPath, 'utf8'));
        } catch {
            return {};
        }
    }
    return {};
}

const loadManifest = () => ({
    name: "Componente Web",
    version: "1.0.0",
    description: "Componente validado por licença",
    build: new Date().toISOString()
});

app.get('/validate-license', (req, res) => {
    const { key } = req.query;
    const origin = req.get('Origin') || req.get('Referer') || 'unknown';

    if (!key) {
        return res.status(400).json({
            error: 'Chave de licença não fornecida'
        });
    }

    const licenses = loadLicenses();
    const license = licenses[key];

    if (!license) {
        return res.status(403).json({
            error: 'Licença inválida'
        });
    }

    if (new Date() > new Date(license.expiresAt)) {
        return res.status(403).json({
            error: 'Licença expirada'
        });
    }

    if (license.origin !== '*') {
        const normalize = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        if (normalize(origin) !== normalize(license.origin)) {
            return res.status(403).json({
                error: 'Origin não autorizado'
            });
        }
    }

    res.json({
        valid: true,
        manifest: loadManifest(),
        component: license.component,
        expiresAt: license.expiresAt,
        origin: license.origin
    });
});

app.get('/health', (req, res) => {
    const licenses = loadLicenses();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        licenseCount: Object.keys(licenses).length,
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/licenses', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Endpoint não disponível em produção' });
    }

    const licenses = loadLicenses();
    const safeLicenses = Object.keys(licenses).reduce((acc, key) => {
        acc[key] = {
            component: licenses[key].component,
            expiresAt: licenses[key].expiresAt,
            origin: licenses[key].origin === '*' ? '*' : '[HIDDEN]'
        };
        return acc;
    }, {});

    res.json(safeLicenses);
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado'
    });
});

// Para desenvolvimento local
if (require.main === module) {
    const server = app.listen(port, () => {
        const licenseCount = Object.keys(loadLicenses()).length;
        console.log(`🚀 Servidor rodando na porta ${port}`);
        console.log(`📝 ${licenseCount} licença(s) carregada(s)`);
        console.log(`🌐 Health: http://localhost:${port}/health`);
    });
    
    server.on('error', (err) => {
        console.error('❌ Erro ao iniciar servidor:', err.message);
    });
}

// Export para Vercel
module.exports = app;
