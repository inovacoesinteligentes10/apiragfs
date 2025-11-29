# Fix: Atualização da Contagem de Documentos nos Stores

## 🐛 Problema Identificado

Quando arquivos eram enviados via upload, a **contagem de documentos nos stores não era atualizada imediatamente** no Dashboard e em outras visualizações.

## 🔍 Causa Raiz

### Backend
O endpoint `/api/v1/stores/` retorna a contagem de documentos com a seguinte query SQL:

```sql
COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) as document_count
```

**Importante:** A contagem **só inclui documentos com status `'completed'`**.

### Fluxo de Upload
1. Documento é enviado → status: `'uploaded'`
2. Backend processa em background → status: `'extracting'`, `'chunking'`, `'embedding'`, `'indexing'`
3. Processamento completo → status: `'completed'` ✅

**Problema:** Entre os passos 1-2, o documento existe mas não aparece na contagem!

## ✅ Solução Implementada

### 1. Atualização Automática Quando Documentos Completam (App.tsx:284-369)

Modificado o polling que monitora documentos em processamento para atualizar os stores quando documentos chegam ao status `'completed'`:

```typescript
// Polling para atualizar status de documentos em processamento
useEffect(() => {
    const pollDocuments = async () => {
        // ... código de polling existente ...

        let shouldRefreshStores = false;

        for (const doc of processingDocs) {
            const updatedDoc = await apiService.getDocument(doc.id);

            // Detectar quando documento completa processamento
            const wasProcessing = doc.status !== 'completed' && doc.status !== 'error';
            const isNowCompleted = updatedDoc.status === 'completed';

            if (wasProcessing && isNowCompleted) {
                console.log(`✅ Documento "${doc.name}" processado com sucesso!`);
                shouldRefreshStores = true; // 🔑 Marcar para atualizar
            }

            // ... atualizar documento ...
        }

        // Atualizar stores quando documentos forem concluídos
        if (shouldRefreshStores) {
            console.log('🔄 Atualizando contagem de documentos nos stores...');
            const updatedStores = await apiService.listRagStores();
            setRagStores(updatedStores);

            // Atualizar store selecionado
            if (selectedStore) {
                const updatedSelectedStore = updatedStores.find(s => s.id === selectedStore.id);
                if (updatedSelectedStore) {
                    setSelectedStore(updatedSelectedStore);
                }
            }
            console.log('✅ Stores atualizados com sucesso!');
        }
    };

    // Polling a cada 2 segundos
    if (hasProcessing) {
        const interval = setInterval(pollDocuments, 2000);
        return () => clearInterval(interval);
    }
}, [processedDocuments, ragStores, selectedStore]);
```

### 2. Delay Aumentado Após Upload (App.tsx:504-526)

Aumentado o delay de **1s para 2s** após o upload e adicionados logs informativos:

```typescript
setUploadProgress({
    current: totalSteps,
    total: totalSteps,
    message: "Upload concluído! Atualizando stores...",
    fileName: ""
});

showSuccess(`${files.length} documento(s) enviado(s)! Processamento continua em background.`);

// Aguardar um pouco mais para o backend atualizar a contagem
await new Promise(resolve => setTimeout(resolve, 2000)); // 🔑 2s em vez de 1s

// Recarregar stores
try {
    console.log('🔄 Atualizando contagem de documentos nos stores após upload...');
    const updatedStores = await apiService.listRagStores();
    setRagStores(updatedStores);

    if (selectedStore) {
        const updatedSelectedStore = updatedStores.find(s => s.id === selectedStore.id);
        if (updatedSelectedStore) {
            setSelectedStore(updatedSelectedStore);
            console.log(`✅ Store "${selectedStore.display_name}" atualizado: ${updatedSelectedStore.document_count} documentos`);
        }
    }
} catch (err) {
    console.error('Erro ao recarregar stores:', err);
}
```

## 📊 Comportamento Esperado

### Cenário 1: Upload de 1 Documento

| Momento | Status Documento | Store Count | Ação do Frontend |
|---------|------------------|-------------|------------------|
| **T0** | - | 5 docs | - |
| **T1** | `uploaded` | 5 docs | Upload iniciado |
| **T2** | `processing` | 5 docs | Aguardando... (2s delay) |
| **T3** | `processing` | 5 docs | Atualiza stores (ainda 5) |
| **T4** | `completed` | 6 docs | 🔄 Polling detecta + atualiza stores ✅ |

### Cenário 2: Upload de Múltiplos Documentos

| Momento | Docs Completed | Store Count | Ação do Frontend |
|---------|----------------|-------------|------------------|
| **T0** | 0/3 | 10 docs | Upload iniciado |
| **T2** | 0/3 | 10 docs | Aguarda 2s após upload |
| **T3** | 1/3 | 11 docs | 🔄 Polling atualiza (+1) |
| **T5** | 2/3 | 12 docs | 🔄 Polling atualiza (+1) |
| **T7** | 3/3 | 13 docs | 🔄 Polling atualiza (+1) ✅ |

## 🎯 Pontos-Chave

1. **Timing Inteligente:**
   - Delay de 2s após upload permite que documentos rápidos completem
   - Polling a cada 2s captura documentos mais lentos

2. **Atualização Incremental:**
   - Cada documento que completa dispara uma atualização
   - Não precisa aguardar todos os documentos

3. **Visibilidade via Console:**
   - Logs facilitam debug durante desenvolvimento
   - Logs podem ser removidos em produção se necessário

4. **Zero Impacto na UX:**
   - Usuário vê mensagem "Processamento em background"
   - Interface não trava aguardando processamento

## 🧪 Como Testar

1. **Abra o console do browser** (F12)
2. Navegue para **Dashboard** ou **Documentos**
3. Faça upload de 1-3 PDFs pequenos
4. Observe os logs:
   ```
   🔄 Atualizando contagem de documentos nos stores após upload...
   ✅ Documento "arquivo.pdf" processado com sucesso!
   🔄 Atualizando contagem de documentos nos stores...
   ✅ Store "Departamento X" atualizado: 12 documentos
   ✅ Stores atualizados com sucesso!
   ```
5. Verifique que o **número no card do store** aumenta automaticamente

## 📁 Arquivos Modificados

- `App.tsx` (linhas 284-369, 504-526)
  - Polling com atualização de stores ao completar
  - Delay aumentado + logs informativos

## 🔗 Referências

- Query SQL de contagem: `backend/app/api/v1/stores.py:55,76`
- Componente Dashboard que exibe contagem: `components/Dashboard.tsx:456`
- Tipos de status: `services/apiService.ts:21`

---

**Data da Implementação:** 2025-11-27
**Branch:** `feature/store-access-control`
