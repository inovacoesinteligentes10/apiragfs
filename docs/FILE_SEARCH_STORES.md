# File Search Stores - Guia Completo

## O que são File Search Stores?

File Search Stores são repositórios gerenciados pela API Gemini que armazenam, indexam e permitem busca semântica em arquivos. São a base do sistema RAG (Retrieval-Augmented Generation) do ApiRAGFS.

## Arquitetura

```
Usuario → ApiRAGFS Backend → Gemini File Search Store → Gemini AI
                ↓                        ↓
            PostgreSQL              Redis Cache
            (metadados)             (insights)
```

## Características Principais

### 1. Gerenciamento Automático de Índices

O Gemini gerencia automaticamente:
- ✅ Extração de texto de PDFs, DOCs, etc.
- ✅ Chunking (divisão em pedaços) otimizado
- ✅ Geração de embeddings vetoriais
- ✅ Indexação para busca rápida
- ✅ Armazenamento distribuído

**Você não precisa se preocupar com:**
- ❌ Vetorização manual
- ❌ Configuração de chunking
- ❌ Banco vetorial (como Qdrant, Pinecone)
- ❌ Dimensão de embeddings
- ❌ Similarity search

### 2. Upload e Indexação

```python
# No ApiRAGFS (backend/app/services/gemini_service.py)
async def upload_to_rag_store(
    self,
    rag_store_name: str,
    file_path: str,
    mime_type: str,
    metadata: Optional[dict] = None
):
    operation = self.client.file_search_stores.upload_to_file_search_store(
        file=file_path,
        file_search_store_name=rag_store_name,
        config=types.UploadToFileSearchStoreConfig(
            display_name=file_path.split('/')[-1],
            metadata=metadata  # Metadados customizados
        )
    )

    # Aguardar processamento
    while not operation.done:
        await asyncio.sleep(3)
        operation = self.client.operations.get(operation)

    return operation
```

### 3. Metadados Customizados

Os metadados são usados para:
- **Filtragem**: "Mostre documentos do autor João Silva"
- **Categorização**: "Liste artigos de 2024"
- **Organização**: "Encontre relatórios do projeto X"

Estrutura recomendada:
```json
{
  "author": "João Silva",
  "category": "Artigo Científico",
  "tags": ["machine-learning", "nlp"],
  "year": 2025,
  "project": "ApiRAGFS",
  "department": "Pesquisa"
}
```

### 4. Estratégia de Store no ApiRAGFS

**Store Global por Usuário:**
```
User ID: user-123
  └─ RAG Store: "RAG Store - user-123"
      ├─ documento1.pdf (metadados: {author: "A", year: 2024})
      ├─ documento2.pdf (metadados: {author: "B", year: 2025})
      ├─ documento3.pdf (metadados: {author: "A", year: 2024})
      └─ ...
```

**Vantagens:**
- ✅ Busca cruzada entre todos os documentos do usuário
- ✅ Um único índice otimizado
- ✅ Gestão simplificada
- ✅ Redução de custos (menos stores)

**Implementação:**
```python
# Verificar se já existe RAG Store
existing_rag_store = await db.fetch_one(
    """
    SELECT rag_store_name FROM documents
    WHERE user_id = $1 AND rag_store_name IS NOT NULL
    LIMIT 1
    """,
    user_id
)

if existing_rag_store:
    # Usar store existente
    rag_store_name = existing_rag_store['rag_store_name']
else:
    # Criar novo store global
    rag_store_name = await gemini_service.create_rag_store(
        display_name=f"RAG Store - {user_id}"
    )
```

## Busca e Consultas

### Consulta Básica

```python
response = client.models.generate_content(
    model="gemini-2.0-flash-exp",
    contents="Resuma os documentos sobre machine learning",
    config=types.GenerateContentConfig(
        tools=[types.Tool(
            file_search=types.FileSearch(
                file_search_store_names=[rag_store_name]
            )
        )]
    )
)
```

### Consulta com Histórico (Chat)

```python
# No ApiRAGFS, usamos sessões de chat
response = self.client.models.generate_content(
    model=self.model,
    contents=[
        # Histórico de mensagens
        {"role": "user", "parts": [{"text": "O que é RAG?"}]},
        {"role": "model", "parts": [{"text": "RAG é..."}]},
        # Nova pergunta
        {"role": "user", "parts": [{"text": "E como funciona?"}]}
    ],
    config=types.GenerateContentConfig(
        tools=[types.Tool(
            file_search=types.FileSearch(
                file_search_store_names=[rag_store_name]
            )
        )],
        system_instruction=system_prompt
    )
)
```

### Consulta com Streaming

```python
# Resposta em tempo real (similar ao ChatGPT)
for chunk in self.client.models.generate_content_stream(
    model=self.model,
    contents=query,
    config=config
):
    if hasattr(chunk, 'text'):
        yield {"type": "content", "text": chunk.text}
```

## Grounding Chunks (Fontes)

O Gemini retorna automaticamente os trechos relevantes dos documentos:

```python
response = await gemini_service.query_with_rag(
    rag_store_name="fileSearchStores/abc123",
    query="Explique machine learning"
)

# Resposta inclui:
{
    "text": "Machine learning é...",
    "grounding_chunks": [
        {
            "chunk_id": "chunk-1",
            "text": "Trecho relevante do documento...",
            "document_name": "documento.pdf"
        }
    ]
}
```

Exibição no frontend:
```tsx
{message.groundingChunks?.map((chunk, idx) => (
    <button onClick={() => showSource(chunk.text)}>
        Fonte {idx + 1}
    </button>
))}
```

## Operações de Gerenciamento

### Listar Stores

```python
stores = client.file_search_stores.list()
for store in stores:
    print(f"Store: {store.name}")
    print(f"Display Name: {store.display_name}")
```

### Listar Arquivos de um Store

```python
files = client.file_search_stores.list_files(
    file_search_store_name=store.name
)
```

### Deletar Store

```python
client.file_search_stores.delete(
    name=store.name,
    config=types.DeleteFileSearchStoreConfig(force=True)
)
```

## Limites e Quotas

### Limites por Store
- **Tamanho máximo por arquivo**: 20MB
- **Arquivos por store**: 10,000 arquivos
- **Tipos suportados**: PDF, TXT, HTML, Markdown, DOC, DOCX

### Limites por Conta
- **Stores por projeto**: 100 stores
- **API calls**: Conforme plano do Google Cloud

## Boas Práticas no ApiRAGFS

### 1. Store Global por Usuário
✅ Um store para todos os documentos do usuário
❌ Evite criar um store por documento

### 2. Metadados Consistentes
```python
# Sempre use os mesmos campos
metadata = {
    "author": "...",
    "category": "...",
    "tags": [...],
    "year": 2025
}
```

### 3. Cache de Insights
```python
# Gerar insights após upload e cachear por 24h
insights = await gemini_service.generate_insights(rag_store_name)
await redis_client.set(f"insights:{rag_store_name}", json.dumps(insights), 86400)
```

### 4. Invalidação de Cache
```python
# Ao deletar documento, invalidar cache
await redis_client.delete(f"insights:{rag_store_name}")
```

### 5. Tratamento de Erros
```python
try:
    operation = await gemini_service.upload_to_rag_store(...)
    # Aguardar com timeout
    max_wait = 300  # 5 minutos
    while not operation.done and elapsed < max_wait:
        await asyncio.sleep(3)
except TimeoutError:
    # Marcar documento como erro
    await db.execute("UPDATE documents SET status = 'error' ...")
```

## Fluxo Completo no ApiRAGFS

```
1. Upload de Documento
   ↓
2. Salvar no MinIO + PostgreSQL
   ↓
3. Background: Upload para Gemini File Search Store
   ↓
4. Aguardar indexação (mostra progresso)
   ↓
5. Gerar insights e cachear no Redis
   ↓
6. Status: COMPLETED
   ↓
7. Usuário abre chat
   ↓
8. Insights carregam instantaneamente (cache)
   ↓
9. Usuário faz pergunta
   ↓
10. Gemini busca no File Search Store
   ↓
11. Resposta com streaming + fontes
```

## Debugging

### Logs do Backend
```bash
# Ver logs do processamento
docker compose logs -f backend | grep "📤\|📥\|✅\|❌"
```

### Verificar Store no Gemini
```python
# Script de debug
from google import genai
client = genai.Client(api_key="sua-chave")

stores = client.file_search_stores.list()
for store in stores:
    print(f"Store: {store.name}")
    files = client.file_search_stores.list_files(
        file_search_store_name=store.name
    )
    print(f"  Files: {len(list(files))}")
```

## Recursos Adicionais

- [Documentação Oficial](https://ai.google.dev/gemini-api/docs/file-search)
- [API Reference](https://ai.google.dev/api/file-search-stores)
- [Pricing](https://ai.google.dev/pricing)
- [Examples](https://github.com/google-gemini/cookbook)

## Comparação com Outras Abordagens

| Recurso | File Search Stores | Qdrant/Pinecone | LangChain |
|---------|-------------------|-----------------|-----------|
| Setup | Automático | Manual | Manual |
| Embeddings | Gerenciados | Você gera | Você gera |
| Chunking | Automático | Manual | Configurável |
| Hosting | Google Cloud | Self/Cloud | Depende |
| Custo | Por uso API | Mensal/GB | Variável |
| Manutenção | Zero | Alta | Média |

## Conclusão

File Search Stores são a solução **serverless** e **gerenciada** da Google para RAG. No ApiRAGFS, aproveitamos ao máximo essa tecnologia para oferecer uma experiência de upload e busca simples e eficiente, sem a complexidade de gerenciar infraestrutura vetorial.
