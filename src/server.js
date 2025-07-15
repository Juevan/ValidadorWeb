const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { swaggerUi, specs } = require('./swagger');

const app = express();
const port = process.env.PORT || 3001;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "License Validator API",
    swaggerOptions: {
        url: '/swagger.json'
    }
}));

// Endpoint para servir o JSON do Swagger
app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

function loadLicenses() {
    if (process.env.LICENSES_JSON) {
        try { return JSON.parse(process.env.LICENSES_JSON); } catch { return {}; }
    }
    const localPath = path.join(__dirname, 'licenses.local.json');
    if (fs.existsSync(localPath)) {
        try { return JSON.parse(fs.readFileSync(localPath, 'utf8')); } catch { return {}; }
    }
    return {};
}

const loadManifest = () => ({
    name: "Componente Web",
    version: "1.0.0",
    build: new Date().toISOString()
});

/**
 * @swagger
 * /validate-license:
 *   get:
 *     summary: Valida uma licença de componente
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: Origin
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Licença válida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LicenseValidationResponse'
 *       400:
 *         description: Chave não fornecida
 *       403:
 *         description: Licença inválida, expirada ou origin não autorizado
 */
app.get('/validate-license', (req, res) => {
    const { key } = req.query;
    const origin = req.get('Origin') || req.get('Referer') || 'unknown';

    if (!key) return res.status(400).json({ error: 'Chave de licença não fornecida' });

    const licenses = loadLicenses();
    const license = licenses[key];

    if (!license) return res.status(403).json({ error: 'Licença inválida' });
    if (new Date() > new Date(license.expiresAt)) return res.status(403).json({ error: 'Licença expirada' });

    if (license.origin !== '*') {
        const normalize = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (normalize(origin) !== normalize(license.origin)) {
            return res.status(403).json({ error: 'Origin não autorizado' });
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

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Status do servidor
 *     responses:
 *       200:
 *         description: Status do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (req, res) => {
    const licenses = loadLicenses();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        licenseCount: Object.keys(licenses).length,
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * @swagger
 * /licenses:
 *   get:
 *     summary: Lista licenças (dev only)
 *     responses:
 *       200:
 *         description: Lista de licenças
 *       404:
 *         description: Não disponível em produção
 */
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

app.get('/', (req, res) => res.redirect('/api-docs'));

// Debug route para verificar se está funcionando
app.get('/debug', (req, res) => {
    res.json({
        message: 'API funcionando',
        environment: process.env.NODE_ENV || 'development',
        vercelUrl: process.env.VERCEL_URL || 'não definido',
        timestamp: new Date().toISOString()
    });
});

app.use((req, res) => res.status(404).json({ error: 'Endpoint não encontrado' }));

if (require.main === module) {
    const server = app.listen(port, () => {
        const licenseCount = Object.keys(loadLicenses()).length;
        console.log(`🚀 Servidor na porta ${port} | ${licenseCount} licença(s)`);
        console.log(`📚 Docs: http://localhost:${port}/api-docs`);
    });
    server.on('error', (err) => console.error('❌ Erro:', err.message));
}

module.exports = app;
