#!/usr/bin/env python3
"""
Teste de upload de PDF usando File Search API do Gemini
Abordagem em 2 etapas: Files API + Import
"""
from google import genai
from google.genai import types
import time
import os

# Configurar API key
os.environ['GOOGLE_API_KEY'] = 'AIzaSyB3CAdI_Hlj_PtsDjMwDcP1wWnj2j9rRF4'

client = genai.Client(api_key='AIzaSyB3CAdI_Hlj_PtsDjMwDcP1wWnj2j9rRF4')

print("=" * 80)
print("TESTE: Upload de PDF com File Search API (Abordagem 2 Etapas)")
print("=" * 80)

# PDF para testar
pdf_path = '/media/fmar/Prometheus/DEV/APIRagFST/docs/Avaliação das metodologias brasileiras\nde vulnerabilidade socioambiental\ncomo decorrência da problemática\nurbana no Brasil.pdf'

if not os.path.exists(pdf_path):
    print(f"❌ Arquivo não encontrado: {pdf_path}")
    exit(1)

file_size = os.path.getsize(pdf_path)
print(f"📄 Arquivo: {os.path.basename(pdf_path)}")
print(f"📊 Tamanho: {file_size / 1024:.2f} KB")
print()

# Criar File Search Store
print("🔧 Criando File Search Store...")
file_search_store = client.file_search_stores.create(
    config={'display_name': 'Test Store - Chunking 100 tokens'}
)
print(f"✅ Store criado: {file_search_store.name}")
print()

# ETAPA 1: Upload via Files API
print("📤 ETAPA 1/2: Upload via Files API...")
start_upload = time.time()

uploaded_file = client.files.upload(file=pdf_path)

upload_time = time.time() - start_upload
print(f"✅ Upload concluído em {upload_time:.2f}s")
print(f"📎 File name: {uploaded_file.name}")
print()

# ETAPA 2: Import para File Search Store com chunking otimizado
print("🔄 ETAPA 2/2: Import para File Search Store...")
print("⚙️  Configuração: chunks=100 tokens, overlap=10 tokens")
start_import = time.time()

import_config = {
    'chunking_config': {
        'white_space_config': {
            'max_tokens_per_chunk': 100,
            'max_overlap_tokens': 10
        }
    }
}

operation = client.file_search_stores.import_file(
    file_search_store_name=file_search_store.name,
    file_name=uploaded_file.name,
    config=import_config
)

print(f"📥 Import iniciado, aguardando indexação...")

# Polling para aguardar conclusão
elapsed = 0
poll_interval = 5
max_wait = 1200  # 20 minutos

while not operation.done and elapsed < max_wait:
    time.sleep(poll_interval)
    elapsed += poll_interval
    operation = client.operations.get(operation)
    print(f"⏳ Indexando... ({elapsed}s / max {max_wait}s)")

import_time = time.time() - start_import

if not operation.done:
    print(f"❌ TIMEOUT! Indexação não completou em {max_wait}s")
    exit(1)

print(f"✅ Indexação concluída em {import_time:.2f}s")
print()

# Testar busca
print("🔍 Testando busca no documento...")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Qual é o tema principal deste documento sobre metodologias brasileiras?",
    config=types.GenerateContentConfig(
        tools=[
            types.Tool(
                file_search=types.FileSearch(
                    file_search_store_names=[file_search_store.name]
                )
            )
        ]
    )
)

print("📝 Resposta do Gemini:")
print("-" * 80)
print(response.text)
print("-" * 80)
print()

# Resumo
print("=" * 80)
print("📊 RESUMO DO TESTE")
print("=" * 80)
print(f"⏱️  Tempo de upload (Etapa 1): {upload_time:.2f}s")
print(f"⏱️  Tempo de indexação (Etapa 2): {import_time:.2f}s")
print(f"⏱️  Tempo total: {upload_time + import_time:.2f}s")
print(f"📦 Tamanho do arquivo: {file_size / 1024:.2f} KB")
print(f"✅ Status: SUCESSO" if operation.done else "❌ Status: FALHA")
print("=" * 80)
