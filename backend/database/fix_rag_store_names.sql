-- Script para corrigir nomes de RAG stores incompletos
-- Problema: rag_store_name está salvo como "fileSearchStores/xxx" 
-- Correto: "projects/PROJECT_ID/locations/LOCATION/fileSearchStores/xxx"

-- ATENÇÃO: Este script precisa do PROJECT_ID e LOCATION corretos!
-- Execute primeiro este SELECT para ver quais stores precisam ser corrigidos:

SELECT 
    id,
    name,
    rag_store_name,
    CASE 
        WHEN rag_store_name IS NULL THEN 'NULL'
        WHEN rag_store_name LIKE 'projects/%' THEN 'OK'
        ELSE 'NEEDS FIX'
    END as status
FROM rag_stores
WHERE rag_store_name IS NOT NULL
ORDER BY created_at DESC;

-- Depois de confirmar quais precisam de correção, execute o UPDATE abaixo
-- SUBSTITUA os valores de PROJECT_ID e LOCATION pelos corretos!

-- Exemplo de UPDATE (NÃO EXECUTE SEM AJUSTAR!):
/*
UPDATE rag_stores
SET rag_store_name = 'projects/YOUR_PROJECT_ID/locations/YOUR_LOCATION/' || rag_store_name
WHERE rag_store_name IS NOT NULL 
  AND rag_store_name NOT LIKE 'projects/%'
  AND rag_store_name != '';
*/

-- Para descobrir PROJECT_ID e LOCATION corretos, verifique:
-- 1. Um documento que foi processado com sucesso
-- 2. Ou crie um novo store e veja o formato do nome retornado
