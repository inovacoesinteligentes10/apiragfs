# Multi-Store / Departments - Guia Completo

## Visão Geral

O ApiRAGFS agora suporta **múltiplos stores/departments** permitindo organizar documentos em contextos separados como RH, Compras, TI, Jurídico, etc. Cada department mantém seu próprio RAG Store no Gemini, possibilitando buscas isoladas e organizadas.

## Arquitetura

```
Usuario
├─ Store: RH (Recursos Humanos)
│   ├─ fileSearchStores/rh-abc123
│   ├─ contrato_trabalho.pdf
│   ├─ folha_pagamento.pdf
│   └─ politicas_rh.pdf
│
├─ Store: Compras
│   ├─ fileSearchStores/compras-def456
│   ├─ orcamento_fornecedor.pdf
│   └─ notas_fiscais.pdf
│
└─ Store: TI
    ├─ fileSearchStores/ti-ghi789
    ├─ manual_sistemas.pdf
    └─ procedimentos_backup.pdf
```

## Stores Padrão

A migração cria automaticamente 6 stores:

| Nome | Display Name | Descrição | Ícone | Cor |
|------|-------------|-----------|-------|-----|
| `geral` | Geral | Documentos gerais e diversos | folder | blue |
| `rh` | Recursos Humanos | Documentos de RH, folha, contratos | users | purple |
| `compras` | Compras | Orçamentos, pedidos, notas fiscais | shopping-cart | green |
| `ti` | TI | Documentação técnica, manuais | cpu | red |
| `juridico` | Jurídico | Contratos, processos legais | shield | yellow |
| `financeiro` | Financeiro | Balanços, relatórios financeiros | dollar-sign | orange |

## Como Usar

### 1. Listar Stores Disponíveis

```bash
curl http://localhost:8000/api/v1/stores/
```

```json
[
  {
    "id": "uuid",
    "user_id": "default-user",
    "name": "rh",
    "display_name": "Recursos Humanos",
    "description": "Documentos de RH...",
    "icon": "users",
    "color": "purple",
    "document_count": 5,
    "rag_store_name": "fileSearchStores/abc123",
    "created_at": "2025-01-25T..."
  }
]
```

### 2. Upload com Department

**Via cURL:**
```bash
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -F "file=@contrato.pdf" \
  -F 'metadata={"department":"rh","author":"João Silva"}'
```

**Via Python:**
```python
import requests
import json

files = {'file': open('contrato.pdf', 'rb')}
metadata = {
    "department": "rh",  # <- Define o store
    "author": "RH Team",
    "category": "Contrato"
}
data = {'metadata': json.dumps(metadata)}

response = requests.post(
    'http://localhost:8000/api/v1/documents/upload',
    files=files,
    data=data
)
```

**Via JavaScript:**
```typescript
const formData = new FormData();
formData.append('file', file);

const metadata = {
    department: "compras",  // <- Define o store
    author: "Compras Team",
    category: "Orçamento"
};

formData.append('metadata', JSON.stringify(metadata));

await fetch('http://localhost:8000/api/v1/documents/upload', {
    method: 'POST',
    body: formData
});
```

### 3. Criar Sessão de Chat com Store Específico

```python
# Buscar o RAG Store do department
store_info = requests.get('http://localhost:8000/api/v1/stores/rh').json()
rag_store_name = store_info['rag_store_name']

# Criar sessão de chat
session = requests.post(
    'http://localhost:8000/api/v1/chat/sessions',
    json={'rag_store_name': rag_store_name}
).json()

# Fazer pergunta no contexto do RH
response = requests.post(
    f'http://localhost:8000/api/v1/chat/sessions/{session["id"]}/query',
    json={'message': 'Qual o horário de trabalho?'}
)
```

### 4. Criar Novo Store

```bash
curl -X POST http://localhost:8000/api/v1/stores/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "marketing",
    "display_name": "Marketing",
    "description": "Campanhas, materiais promocionais",
    "icon": "megaphone",
    "color": "pink"
  }'
```

## Fluxo Completo

### Upload em Department Específico

```
1. Usuario seleciona department (ex: "RH")
   ↓
2. Upload documento com metadata: {"department": "rh"}
   ↓
3. Backend verifica se já existe RAG Store para "rh"
   ├─ Existe? → Usa o existente
   └─ Não? → Cria novo "Recursos Humanos - default-user"
   ↓
4. Upload para Gemini File Search Store do RH
   ↓
5. Gera insights específicos do RH
   ↓
6. Cache insights com chave: "insights:fileSearchStores/rh-abc123"
```

### Chat com Store Específico

```
1. Usuario seleciona department (ex: "Compras")
   ↓
2. Frontend lista stores disponíveis
   ↓
3. Usuario escolhe "Compras" no seletor
   ↓
4. Frontend busca rag_store_name do "Compras"
   ↓
5. Cria sessão de chat com esse rag_store_name
   ↓
6. Perguntas são respondidas APENAS com documentos de Compras
```

## Vantagens

### 1. Organização
- ✅ Documentos separados por contexto
- ✅ Fácil gestão de grandes volumes
- ✅ Evita "poluição" de resultados

### 2. Segurança
- ✅ Isolamento de dados por department
- ✅ Controle de acesso por store (futuro)
- ✅ Auditoriadetalhada por contexto

### 3. Performance
- ✅ Busca mais rápida em stores menores
- ✅ Insights específicos por contexto
- ✅ Cache independente por store

### 4. Flexibilidade
- ✅ Adicionar novos stores dinamicamente
- ✅ Customizar ícones e cores
- ✅ Descrições personalizadas

## Exemplos de Uso

### Cenário 1: Empresa com Múltiplos Departamentos

```python
# Upload documentos de diferentes departamentos
departments = {
    "rh": ["contrato.pdf", "manual_colaborador.pdf"],
    "compras": ["orcamento.pdf", "nota_fiscal.pdf"],
    "ti": ["manual_ti.pdf", "procedimentos.pdf"]
}

for dept, files in departments.items():
    for file in files:
        upload_document(file, department=dept)
```

### Cenário 2: Chat Contextual

```python
# Chat sobre RH (apenas docs de RH)
rh_session = create_chat_session(department="rh")
response = ask(rh_session, "Quais são os benefícios?")
# Resposta baseada APENAS em docs de RH

# Chat sobre TI (apenas docs de TI)
ti_session = create_chat_session(department="ti")
response = ask(ti_session, "Como fazer backup?")
# Resposta baseada APENAS em docs de TI
```

### Cenário 3: Análise Departamental

```python
# Gerar insights separados
rh_insights = get_insights("rh")
compras_insights = get_insights("compras")

# Comparar documentação entre departments
compare_departments(["rh", "compras", "ti"])
```

## Interface do Usuario (Frontend)

### Seletor de Store

```tsx
// Componente de seleção de store
const StoreSelector = () => {
  const [stores, setStores] = useState([]);
  const [selected, setSelected] = useState('geral');

  useEffect(() => {
    fetch('/api/v1/stores/')
      .then(r => r.json())
      .then(setStores);
  }, []);

  return (
    <select value={selected} onChange={(e) => setSelected(e.target.value)}>
      {stores.map(store => (
        <option key={store.name} value={store.name}>
          {store.icon} {store.display_name} ({store.document_count} docs)
        </option>
      ))}
    </select>
  );
};
```

### Upload com Store

```tsx
const uploadDocument = async (file: File, department: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({ department }));

  await fetch('/api/v1/documents/upload', {
    method: 'POST',
    body: formData
  });
};
```

## Gerenciamento

### Listar Documentos por Store

```sql
-- Query direta no PostgreSQL
SELECT name, COUNT(*) as docs
FROM documents
WHERE user_id = 'default-user'
GROUP BY department;
```

### Deletar Store

```bash
# Só funciona se não tiver documentos
curl -X DELETE http://localhost:8000/api/v1/stores/marketing
```

### Estatísticas

```python
# Obter estatísticas de todos stores
stores = requests.get('/api/v1/stores/').json()
for store in stores:
    print(f"{store['display_name']}: {store['document_count']} documentos")
```

## Boas Práticas

### 1. Nomenclatura de Stores
✅ Use slugs simples: `rh`, `compras`, `ti`
❌ Evite espaços ou caracteres especiais

### 2. Granularidade
✅ Stores por departamento ou função
❌ Stores muito específicos (ex: "rh_ferias_2024")

### 3. Documentos Default
- Se não especificar `department`, usa `geral`
- Store `geral` é o catch-all

### 4. Cache de Insights
- Cada store tem seu próprio cache de insights
- Insights refletem apenas documentos daquele store

## Migração de Dados Existentes

Se você já tem documentos sem department:

```sql
-- Marcar todos documentos antigos como "geral"
UPDATE documents
SET department = 'geral'
WHERE department IS NULL;
```

## API Reference

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/v1/stores/` | GET | Listar stores |
| `/api/v1/stores/{name}` | GET | Buscar store |
| `/api/v1/stores/` | POST | Criar store |
| `/api/v1/stores/{name}` | DELETE | Deletar store |

## Troubleshooting

### Store não aparece na lista
- Verifique se foi criado na tabela `rag_stores`
- Execute `SELECT * FROM rag_stores WHERE user_id = 'default-user'`

### Documentos não aparecem no store correto
- Verifique campo `department` na tabela `documents`
- Deve corresponder ao `name` na tabela `rag_stores`

### Chat retorna documentos errados
- Verifique se está usando o `rag_store_name` correto
- Cada department tem seu próprio RAG Store no Gemini

## Conclusão

Multi-store permite organização profissional de documentos em contextos isolados, mantendo a simplicidade de uso do ApiRAGFS. Ideal para empresas com múltiplos departamentos ou projetos distintos.
