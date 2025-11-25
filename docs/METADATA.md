# Metadados para File Search API

Este documento explica como usar metadados customizados nos uploads de documentos para melhorar a busca e filtragem com a API Gemini File Search.

## O que são Metadados?

Metadados são informações adicionais sobre os documentos que podem ser usadas para:
- Filtrar buscas por autor, categoria, tags, etc.
- Organizar documentos por tipo, data, projeto
- Melhorar a relevância dos resultados de busca
- Facilitar a gestão de grandes volumes de documentos

## Estrutura de Metadados

Os metadados são armazenados como JSON e podem conter qualquer campo personalizado:

```json
{
  "author": "Nome do Autor",
  "category": "Artigo Científico",
  "tags": ["machine-learning", "nlp", "rag"],
  "year": 2025,
  "project": "ApiRAGFS",
  "department": "Pesquisa",
  "custom_field": "valor personalizado"
}
```

## Como Usar Metadados

### 1. Via API (cURL)

```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@documento.pdf" \
  -F 'metadata={"author":"João Silva","category":"Artigo","tags":["ia","rag"],"year":2025}'
```

### 2. Via Python

```python
import requests
import json

# Preparar metadados
metadata = {
    "author": "Maria Santos",
    "category": "Dissertação",
    "tags": ["educação", "tecnologia"],
    "year": 2024,
    "university": "UFSC"
}

# Upload com metadados
files = {'file': open('documento.pdf', 'rb')}
data = {'metadata': json.dumps(metadata)}

response = requests.post(
    'http://localhost:8000/api/v1/documents/upload',
    files=files,
    data=data
)
```

### 3. Via JavaScript/TypeScript (Frontend)

```typescript
const uploadWithMetadata = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = {
        author: "Pedro Costa",
        category: "Relatório",
        tags: ["análise", "dados"],
        year: 2025
    };

    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch('http://localhost:8000/api/v1/documents/upload', {
        method: 'POST',
        body: formData
    });

    return response.json();
};
```

## Campos Recomendados

Embora você possa usar qualquer campo customizado, recomendamos os seguintes para melhor organização:

### Campos Básicos
- **author**: Nome do autor ou criador do documento
- **category**: Categoria ou tipo (Artigo, Relatório, Manual, etc.)
- **tags**: Array de tags para classificação múltipla
- **year**: Ano de publicação ou criação

### Campos Acadêmicos
- **university**: Instituição de origem
- **department**: Departamento ou área
- **course**: Curso relacionado
- **advisor**: Orientador (para TCC, dissertações)

### Campos Empresariais
- **project**: Nome do projeto relacionado
- **department**: Departamento responsável
- **version**: Versão do documento
- **confidentiality**: Nível de confidencialidade

## Consultas com Metadados

Você pode fazer queries específicas usando metadados no chat:

```
"Mostre documentos do autor João Silva sobre machine learning"
"Liste artigos de 2024 sobre educação"
"Encontre relatórios do projeto ApiRAGFS"
```

A API Gemini File Search usa os metadados para melhorar a relevância dos resultados.

## Exemplo Completo

```python
# exemplo_upload_com_metadados.py
import requests
import json

def upload_document_with_metadata(file_path: str, metadata: dict):
    """
    Faz upload de documento com metadados customizados
    """
    url = "http://localhost:8000/api/v1/documents/upload"

    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'metadata': json.dumps(metadata)}

        response = requests.post(url, files=files, data=data)

    return response.json()

# Exemplo de uso
metadata = {
    "author": "Ana Paula",
    "category": "TCC",
    "tags": ["computação", "ia", "rag"],
    "year": 2025,
    "university": "UFSC",
    "course": "Ciência da Computação",
    "advisor": "Prof. Dr. Carlos Souza"
}

result = upload_document_with_metadata("meu_tcc.pdf", metadata)
print(f"Upload realizado: {result['id']}")
```

## Boas Práticas

1. **Consistência**: Use os mesmos campos para documentos similares
2. **Tags**: Use tags em minúsculas e sem espaços (ex: "machine-learning" em vez de "Machine Learning")
3. **Validação**: Valide os metadados antes de enviar
4. **Documentação**: Mantenha uma lista dos campos usados no seu projeto
5. **Nomenclatura**: Use nomes de campos descritivos em inglês ou português consistente

## Limitações

- Metadados são armazenados como JSONB no PostgreSQL (limite de ~1GB por campo, mas recomenda-se manter pequeno)
- Campos muito grandes podem impactar performance
- Recomenda-se manter metadados com no máximo 50 campos

## Suporte

Para mais informações sobre a API Gemini File Search e metadados:
- [Documentação Oficial Gemini](https://ai.google.dev/gemini-api/docs/file-search#metadata)
- [Repositório ApiRAGFS](https://github.com/seu-repo/apiragfs)
