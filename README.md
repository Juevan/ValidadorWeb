# License Validator

API minimalista para validação de licenças de componentes web com documentação Swagger.

## � Quick Start

```bash
git clone <repo>
cd ValidadorWeb
npm ci
npm run dev
```

## � API Endpoints

### Validar Licença
`GET /validate-license?key=<chave>`

**Headers:** `Origin: https://dominio.com`

```json
{
  "valid": true,
  "manifest": { "name": "Componente Web", "version": "1.0.0", "build": "..." },
  "component": "botao",
  "expiresAt": "2025-12-31",
  "origin": "https://site.com"
}
```

### Health Check
`GET /health` - Status do servidor

### Listar Licenças (dev)
`GET /licenses` - Lista licenças (apenas desenvolvimento)

## ⚙️ Configuração

### Environment Variables (.env)
```env
LICENSES_JSON={"chave": {"expiresAt": "2025-12-31", "component": "botao", "origin": "https://site.com"}}
```

### Exemplo de Licenças
```json
{
  "a1b2c3": {
    "expiresAt": "2025-12-31",
    "component": "botao-premium", 
    "origin": "https://site.com"
  },
  "f9e8d7": {
    "expiresAt": "2026-06-30",
    "component": "widget-publico",
    "origin": "*"
  }
}
```

## 🌐 Deploy Vercel

1. Conecte repo no [vercel.com](https://vercel.com)
2. Configure `LICENSES_JSON` nas Environment Variables
3. Deploy automático

## 📚 Documentação

- **Local**: http://localhost:3001/api-docs
- **Produção**: https://seu-app.vercel.app/api-docs

## 📁 Estrutura
```
ValidadorWeb/
├── package.json        # Dependências
├── vercel.json         # Deploy Vercel
├── .gitignore          # Arquivos ignorados
├── README.md           # Documentação
└── src/
    ├── server.js       # API principal
    ├── swagger.js      # Configuração Swagger
    └── licenses.local.json  # Licenças desenvolvimento
```
