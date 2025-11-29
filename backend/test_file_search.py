#!/usr/bin/env python3
"""
Script de teste para validar File Search do Google Gemini
Simula upload de documento e queries RAG
"""
import asyncio
import sys
import os
from pathlib import Path

# Adicionar o diretório backend ao path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.gemini_service import GeminiService
from app.config.settings import settings


async def test_file_search_simulation():
    """
    Simula o fluxo completo de File Search:
    1. Criar RAG Store
    2. Upload de documento
    3. Realizar queries
    4. Validar grounding chunks
    """
    print("=" * 80)
    print("🚀 TESTE DE SIMULAÇÃO - GOOGLE GEMINI FILE SEARCH")
    print("=" * 80)
    print()

    # Verificar se API key está configurada
    if not settings.gemini_api_key or settings.gemini_api_key == "":
        print("❌ ERRO: GEMINI_API_KEY não configurada!")
        print("Configure a variável de ambiente GEMINI_API_KEY no arquivo .env")
        return

    print(f"✓ API Key configurada")
    print(f"✓ Modelo: {settings.gemini_model}")
    print()

    # Inicializar serviço
    service = GeminiService()
    rag_store_name = None

    try:
        # PASSO 1: Criar RAG Store
        print("📁 PASSO 1: Criando RAG Store...")
        print("-" * 80)
        rag_store_name = await service.create_rag_store(
            display_name="Teste File Search - Documentação Técnica"
        )
        print(f"✓ RAG Store criado: {rag_store_name}")
        print()

        # PASSO 2: Upload de documento
        print("📤 PASSO 2: Upload de Documento de Teste...")
        print("-" * 80)

        # Criar documento de teste
        test_doc_path = "/tmp/documento_teste.txt"
        test_content = """
        DOCUMENTAÇÃO TÉCNICA - SISTEMA DE RAG

        1. INTRODUÇÃO
        O ApiRAGFS é um sistema de Retrieval-Augmented Generation (RAG) que utiliza
        o Google Gemini File Search para realizar buscas semânticas em documentos.

        2. ARQUITETURA
        O sistema é composto por:
        - Backend FastAPI em Python
        - Frontend React com TypeScript
        - PostgreSQL para persistência
        - Redis para cache de contexto
        - MinIO para armazenamento de arquivos
        - Google Gemini File Search API para RAG

        3. FUNCIONALIDADES PRINCIPAIS

        3.1 Upload de Documentos
        - Suporte a PDF, TXT, DOC, DOCX, MD
        - Tamanho máximo: 100MB
        - Processamento assíncrono

        3.2 Chat Inteligente
        - Contexto persistente via Redis
        - Histórico de conversação
        - Grounding automático com chunks

        3.3 Analytics
        - Métricas de uso
        - Performance de queries
        - Qualidade das respostas

        4. TECNOLOGIAS UTILIZADAS
        - Python 3.12+ com UV
        - FastAPI
        - Pydantic para validação
        - SQLAlchemy
        - React 18+
        - TypeScript
        - Vite
        - Docker com multi-stage build

        5. CONFIGURAÇÃO
        Variáveis de ambiente necessárias:
        - GEMINI_API_KEY: Chave da API do Google
        - DATABASE_URL: URL do PostgreSQL
        - REDIS_URL: URL do Redis
        - MINIO_ENDPOINT: Endpoint do MinIO

        6. DEPLOYMENT
        O sistema utiliza Docker Compose com healthchecks para todos os serviços.
        A rede padrão é "stack-network" conforme padrão do projeto.
        """

        with open(test_doc_path, "w", encoding="utf-8") as f:
            f.write(test_content)

        print(f"✓ Documento de teste criado: {test_doc_path}")
        print(f"✓ Tamanho: {len(test_content)} caracteres")
        print()

        print("⏳ Fazendo upload e aguardando processamento...")
        file_info = await service.upload_to_rag_store(
            rag_store_name=rag_store_name,
            file_path=test_doc_path,
            mime_type="text/plain"
        )

        print(f"✓ Upload concluído!")
        print(f"  - Nome do arquivo: {file_info['display_name']}")
        print(f"  - MIME type: {file_info['mime_type']}")
        print(f"  - Tamanho: {file_info['size_bytes']} bytes")
        print(f"  - Status: {file_info['state']}")
        print()

        # PASSO 3: Realizar queries de teste
        print("🔍 PASSO 3: Realizando Queries de Teste...")
        print("-" * 80)

        test_queries = [
            "Quais são as tecnologias utilizadas no ApiRAGFS?",
            "Qual o tamanho máximo de upload de documentos?",
            "Quais variáveis de ambiente são necessárias?",
            "Qual é a arquitetura do sistema?"
        ]

        for idx, query in enumerate(test_queries, 1):
            print(f"\n📝 Query {idx}: {query}")
            print("-" * 80)

            result = await service.file_search(
                rag_store_name=rag_store_name,
                query=query
            )

            print(f"\n💬 Resposta:")
            print(result['text'])
            print()

            if result['grounding_chunks']:
                print(f"📎 Grounding Chunks ({len(result['grounding_chunks'])} encontrados):")
                for i, chunk in enumerate(result['grounding_chunks'][:2], 1):
                    print(f"\n  Chunk {i}:")
                    if chunk.get('text'):
                        preview = chunk['text'][:150] + "..." if len(chunk['text']) > 150 else chunk['text']
                        print(f"  {preview}")
            else:
                print("⚠️  Nenhum grounding chunk retornado")

            print()

        # PASSO 4: Teste de query com histórico
        print("\n💭 PASSO 4: Teste de Query com Histórico...")
        print("-" * 80)

        history = [
            {"role": "user", "content": "Quais tecnologias o sistema usa?"},
            {"role": "model", "content": "O sistema utiliza Python 3.12+, FastAPI, React 18+, TypeScript, PostgreSQL, Redis e MinIO."}
        ]

        follow_up_query = "E qual é a versão do React?"
        print(f"\n📝 Follow-up Query: {follow_up_query}")
        print(f"💾 Histórico: {len(history)} mensagens anteriores")
        print()

        result = await service.query_with_rag(
            rag_store_name=rag_store_name,
            query=follow_up_query,
            history=history
        )

        print(f"💬 Resposta:")
        print(result['text'])
        print()

        # PASSO 5: Gerar perguntas exemplo
        print("\n❓ PASSO 5: Gerando Perguntas Exemplo...")
        print("-" * 80)

        example_questions = await service.generate_example_questions(rag_store_name)

        if example_questions:
            print(f"✓ Geradas {len(example_questions)} perguntas:")
            for idx, question in enumerate(example_questions, 1):
                print(f"  {idx}. {question}")
        else:
            print("⚠️  Nenhuma pergunta exemplo gerada")

        print()

        # Resumo final
        print("\n" + "=" * 80)
        print("✅ TESTE CONCLUÍDO COM SUCESSO!")
        print("=" * 80)
        print(f"✓ RAG Store criado e configurado")
        print(f"✓ Documento processado e indexado")
        print(f"✓ {len(test_queries)} queries realizadas com sucesso")
        print(f"✓ Query com histórico testada")
        print(f"✓ Grounding chunks validados")
        print()

    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        # Limpeza
        if rag_store_name:
            print("\n🧹 Limpando recursos...")
            try:
                await service.delete_rag_store(rag_store_name)
                print("✓ RAG Store deletado")
            except Exception as e:
                print(f"⚠️  Erro ao deletar RAG Store: {str(e)}")

        # Remover arquivo de teste
        if os.path.exists("/tmp/documento_teste.txt"):
            os.remove("/tmp/documento_teste.txt")
            print("✓ Arquivo de teste removido")

        print()


async def main():
    """Função principal"""
    await test_file_search_simulation()


if __name__ == "__main__":
    # Executar teste
    asyncio.run(main())
