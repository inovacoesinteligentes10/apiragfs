#!/usr/bin/env python3
"""
Teste com nova API key AIzaSyCeimPENrJy-0EkJyU11aVdBpY2PA8vv4Y
"""
from google import genai
from google.genai import types
import time
import os

# Nova API Key
API_KEY = 'AIzaSyCeimPENrJy-0EkJyU11aVdBpY2PA8vv4Y'
MODEL = 'gemini-2.5-flash'
PDF_PATH = '/tmp/test.pdf'

client = genai.Client(api_key=API_KEY)

print("=" * 80)
print("TESTE: File Search com Nova API Key")
print("=" * 80)
print(f"📄 Arquivo: {os.path.basename(PDF_PATH)}")
print(f"📊 Tamanho: {os.path.getsize(PDF_PATH) / 1024:.2f} KB")
print(f"🔑 API Key: ...{API_KEY[-10:]}")
print(f"🤖 Modelo: {MODEL}")
print()

# Criar store
print("🔧 Criando File Search Store...")
start_total = time.time()
try:
    store = client.file_search_stores.create(
        config={'display_name': 'Test New Key - 100 tokens'}
    )
    print(f"✅ Store: {store.name}\n")
except Exception as e:
    print(f"❌ Erro ao criar store: {e}")
    exit(1)

# ETAPA 1: Upload via Files API
print("📤 ETAPA 1/2: Upload via Files API...")
start_upload = time.time()
try:
    uploaded_file = client.files.upload(file=PDF_PATH)
    upload_time = time.time() - start_upload
    print(f"✅ Upload: {upload_time:.2f}s")
    print(f"📎 File: {uploaded_file.name}\n")
except Exception as e:
    print(f"❌ Erro no upload: {e}")
    exit(1)

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

try:
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
except Exception as e:
    print(f"❌ Erro no import: {e}")
    exit(1)

# Testar busca
print("🔍 Testando busca...")
try:
    response = client.models.generate_content(
        model=MODEL,
        contents="Qual é o tema principal deste documento?",
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
except Exception as e:
    print(f"❌ Erro na busca: {e}")

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
