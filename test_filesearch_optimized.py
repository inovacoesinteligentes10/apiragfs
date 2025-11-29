#!/usr/bin/env python3
"""
Teste baseado no testfilesearch.py original
Com nova API key e PDF real
"""
from google import genai
from google.genai import types
import time
import os

# Configuração
API_KEY = 'AIzaSyCeimPENrJy-0EkJyU11aVdBpY2PA8vv4Y'
PDF_PATH = '/tmp/test.pdf'

client = genai.Client(api_key=API_KEY)

print("=" * 80)
print("TESTE: testfilesearch.py com Nova API Key e PDF Real")
print("=" * 80)
print(f"📄 Arquivo: {os.path.basename(PDF_PATH)}")
print(f"📊 Tamanho: {os.path.getsize(PDF_PATH) / 1024:.2f} KB")
print(f"🔑 API Key: ...{API_KEY[-10:]}")
print()

# Create the File Search store with an optional display name
print("🔧 Criando File Search Store...")
start_time = time.time()
file_search_store = client.file_search_stores.create(
    config={'display_name': 'test-filesearch-py-store'}
)
print(f"✅ Store criado: {file_search_store.name}\n")

# Upload and import a file into the File Search store
print("📤 Upload e import usando upload_to_file_search_store (método original)...")
upload_start = time.time()

operation = client.file_search_stores.upload_to_file_search_store(
    file=PDF_PATH,
    file_search_store_name=file_search_store.name,
    config={
        'display_name': 'avaliacao-metodologias-pdf',
    }
)

# Wait until import is complete
print("⏳ Aguardando conclusão...")
elapsed = 0
while not operation.done:
    time.sleep(5)
    elapsed += 5
    operation = client.operations.get(operation)
    print(f"   {elapsed}s...")

    if elapsed > 1200:  # 20 min timeout
        print("❌ Timeout!")
        exit(1)

upload_time = time.time() - upload_start
print(f"✅ Upload e import concluído em {upload_time:.2f}s\n")

# Ask a question about the file
print("🔍 Fazendo pergunta sobre o documento...")
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

print("📝 Resposta:")
print("-" * 80)
print(response.text)
print("-" * 80)

# Resumo
total_time = time.time() - start_time
print(f"\n{'=' * 80}")
print("📊 RESUMO")
print("=" * 80)
print(f"⏱️  Tempo de upload/import: {upload_time:.2f}s")
print(f"⏱️  Tempo total: {total_time:.2f}s")
print(f"🔑 API Key: ...{API_KEY[-10:]}")
print(f"✅ Status: SUCESSO")
print("=" * 80)
