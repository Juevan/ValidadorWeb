const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { swaggerUi, specs } = require('./swagger');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


function getSwaggerJsonUrl(req) {
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}/swagger.json`;
    }
    if (process.env.NODE_ENV === 'production') {
        return 'https://validador-web.vercel.app/swagger.json';
    }
    return `http://localhost:${process.env.PORT || 3001}/swagger.json`;
}

app.use('/api-docs', (req, res, next) => {
    swaggerUi.serve(req, res, () => {
        swaggerUi.setup(specs, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: "License Validator API",
            swaggerOptions: { url: getSwaggerJsonUrl(req) }
        })(req, res, next);
    });
});

app.post('/enviar-contato', async (req, res) => {
    const { nome, email, mensagem } = req.body || {};
    const errors = { nome: '', email: '', mensagem: '' };
    let valid = true;
    if (!nome || !nome.trim()) { errors.nome = 'Campo obrigatório'; valid = false; }
    if (!email || !email.trim()) { errors.email = 'Campo obrigatório'; valid = false; }
    if (!mensagem || !mensagem.trim()) { errors.mensagem = 'Campo obrigatório'; valid = false; }
    if (nome && nome.trim().length > 100) { errors.nome = 'Máximo de 100 caracteres'; valid = false; }
    if (mensagem && mensagem.trim().length > 500) { errors.mensagem = 'Máximo de 500 caracteres'; valid = false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) { errors.email = 'E-mail inválido'; valid = false; }
    if (!valid) return res.status(400).json({ errors });

    try {
        const formId = '1FAIpQLSeZCG79t1pYC6cN3SiRPTLvzrh8gPOTCx0Jf_dXl0zhsg59GQ';
        const viewUrl = `https://docs.google.com/forms/d/e/${formId}/viewform`;
        const viewRes = await fetch(viewUrl);
        if (!viewRes.ok) throw new Error(`GET viewform falhou: ${viewRes.status}`);
        const html = await viewRes.text();
        const $ = cheerio.load(html);
        const fvv = $('input[name="fvv"]').val();
        const draftResponse = $('input[name="draftResponse"]').val() || '[]';
        const pageHistory = $('input[name="pageHistory"]').val() || '0';
        const fbzx = $('input[name="fbzx"]').val();
        const params = new URLSearchParams();
        params.append('entry.1316128292', nome);
        params.append('entry.722938384', email);
        params.append('entry.271632713', mensagem);
        params.append('fvv', fvv);
        params.append('draftResponse', draftResponse);
        params.append('pageHistory', pageHistory);
        params.append('fbzx', fbzx);
        const postUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;
        const postRes = await fetch(postUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': viewUrl
            },
            body: params.toString()
        });
        if (!postRes.ok) return res.status(500).json({ error: 'Falha ao enviar para Google Forms', status: postRes.status });
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao enviar para Google Forms', details: err.message });
    }
});

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

app.get('/health', (req, res) => {
    const licenses = loadLicenses();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        licenseCount: Object.keys(licenses).length,
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/', (req, res) => res.redirect('/api-docs'));

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
