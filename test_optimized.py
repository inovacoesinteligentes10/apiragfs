#!/usr/bin/env python3
"""
Teste otimizado de File Search com PDF
Abordagem em 2 etapas + chunking 100 tokens
"""
from google import genai
from google.genai import types
import time
import os

# API Key
API_KEY = 'AIzaSyB3CAdI_Hlj_PtsDjMwDcP1wWnj2j9rRF4'
MODEL = 'gemini-2.5-flash'
PDF_PATH = '/media/fmar/Prometheus/DEV/APIRagFST/docs/Avaliacao-metodologias.pdf'

client = genai.Client(api_key=API_KEY)

print("=" * 80)
print("TESTE: File Search API - Abordagem Otimizada (2 Etapas)")
print("=" * 80)
print(f"📄 Arquivo: {os.path.basename(PDF_PATH)}")
print(f"📊 Tamanho: {os.path.getsize(PDF_PATH) / 1024:.2f} KB")
print(f"🤖 Modelo: {MODEL}")
print()

# Criar store
print("🔧 Criando File Search Store...")
start_total = time.time()
store = client.file_search_stores.create(
    config={'display_name': 'Test Optimized - 100 tokens'}
)
print(f"✅ Store: {store.name}\n")

# ETAPA 1: Upload via Files API
print("📤 ETAPA 1/2: Upload via Files API...")
start_upload = time.time()
uploaded_file = client.files.upload(file=PDF_PATH)
upload_time = time.time() - start_upload
print(f"✅ Upload: {upload_time:.2f}s")
print(f"📎 File: {uploaded_file.name}\n")

# ETAPA 2: Import com chunking 100 tokens
print("🔄 ETAPA 2/2: Import para RAG Store (chunks=100, overlap=10)...")
start_import = time.time()

config = {
    'chunking_config': {
        'white_space_config': {
            'max_tokens_per_chunk': 100,
            'max_overlap_tokens': 10
        }
    }
}

operation = client.file_search_stores.import_file(
    file_search_store_name=store.name,
    file_name=uploaded_file.name,
    config=config
)

print("📥 Aguardando indexação...")
elapsed = 0
while not operation.done and elapsed < 1200:  # 20 min max
    time.sleep(10)
    elapsed += 10
    operation = client.operations.get(operation)
    print(f"⏳ Indexando... {elapsed}s")

import_time = time.time() - start_import

if not operation.done:
    print(f"\n❌ TIMEOUT após {elapsed}s!")
    exit(1)

print(f"✅ Indexação: {import_time:.2f}s\n")

# Testar busca
print("🔍 Testando busca...")
response = client.models.generate_content(
    model=MODEL,
    contents="Qual é o tema principal deste documento sobre metodologias?",
    config=types.GenerateContentConfig(
        tools=[types.Tool(file_search=types.FileSearch(
            file_search_store_names=[store.name]
        ))]
    )
)

print("📝 Resposta:")
print("-" * 80)
print(response.text)
print("-" * 80)

# Resumo
total_time = time.time() - start_total
print(f"\n{'=' * 80}")
print("📊 RESUMO")
print("=" * 80)
print(f"⏱️  Upload (Etapa 1): {upload_time:.2f}s")
print(f"⏱️  Import (Etapa 2): {import_time:.2f}s")
print(f"⏱️  Tempo total: {total_time:.2f}s")
print(f"✅ Status: {'SUCESSO' if operation.done else 'FALHA'}")
print("=" * 80)
