# License Validator

Validador de licenças minimalista para componentes web.

## 📡 Uso Rápido

```bash
# Clone e instale
git clone <seu-repo>
cd ValidadorWeb
npm ci

# Configure (copie .env.example para .env)
cp .env.example .env

# Execute
npm run dev  # desenvolvimento
npm start    # produção
```

## 📡 API

### `GET /validate-license?key=<chave>`

**Headers:** `Origin: https://seudominio.com`

**Resposta (200):**
```json
{
  "valid": true,
  "manifest": {
    "name": "Componente Web",
    "version": "1.0.0", 
    "build": "2025-07-13T..."
  },
  "component": "meu-botao",
  "expiresAt": "2025-12-31",
  "origin": "https://cliente.com"
}
```

**Erros:**
- `400`: Chave não fornecida
- `403`: Licença inválida/expirada/origin não autorizado

### `GET /health`
Status do servidor com contagem de licenças.

### `GET /licenses` (dev only)
Lista licenças carregadas (origins ocultos).

## 🧪 Teste

```bash
# Válido
curl "http://localhost:3001/validate-license?key=7f4b2c8e9d1a5f3e6c8b9d2a4f7e1c6b" -H "Origin: http://localhost:3000"

# Inválido
curl "http://localhost:3001/validate-license?key=7f4b2c8e9d1a5f3e6c8b9d2a4f7e1c6b" -H "Origin: https://outro-site.com"
```

## ⚙️ Configuração

### Licenças (.env)
```env
LICENSES_JSON={"a1b2c3d4e5f6789012345678901234ab": {"expiresAt": "2025-12-31", "component": "botao", "origin": "https://site.com"}}
```

**Campos:**
- `expiresAt`: Data ISO (YYYY-MM-DD)
- `component`: Nome do componente  
- `origin`: Domínio ou `"*"` para público

### Exemplo
```json
{
  "a1b2c3d4e5f6789012345678901234ab": {
    "expiresAt": "2025-12-31",
    "component": "botao-premium", 
    "origin": "https://meusite.com"
  },
  "f9e8d7c6b5a4321098765432109876fe": {
    "expiresAt": "2026-06-30",
    "component": "widget-publico",
    "origin": "*"
  }
}
```

## 🌐 Deploy Vercel

### Pré-requisitos
1. **Arquivo `vercel.json`** já está configurado ✅
2. **GitHub repo** conectado à Vercel

### Passos:
1. **GitHub Sync:** Conecte seu repo na [vercel.com](https://vercel.com)
2. **Import Project:** Selecione este repositório
3. **Environment Variables:** 
   - Vá em Settings > Environment Variables
   - Adicione `LICENSES_JSON` com suas licenças:
   ```json
   {"7f4b2c8e9d1a5f3e6c8b9d2a4f7e1c6b": {"expiresAt": "2025-12-31", "component": "botao", "origin": "*"}}
   ```
4. **Deploy:** Automático a cada push

### Testando a API após deploy:
```bash
# Substitua YOUR_VERCEL_URL pelo seu domínio
curl "https://YOUR_VERCEL_URL.vercel.app/health"
curl "https://YOUR_VERCEL_URL.vercel.app/validate-license?key=7f4b2c8e9d1a5f3e6c8b9d2a4f7e1c6b" -H "Origin: http://localhost:3000"
```

### Troubleshooting:
- ❌ **404 NOT_FOUND**: Verifique se `vercel.json` existe
- ❌ **500 Error**: Verifique as Environment Variables
- ❌ **CORS**: Adicione seu domínio no origin das licenças

## 📁 Estrutura
```
ValidadorWeb/
├── .env.example        # Template de configuração
├── .gitignore         # Arquivos ignorados
├── package.json        # Dependências
├── src/
│   ├── server.js       # API otimizada
│   └── licenses.local.json  # Dev local
└── README.md
```
