#!/usr/bin/env python3
"""
Script para validar um RAG store específico contra a API do Gemini
"""
import sys
import os

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.gemini_service import GeminiService
import asyncio


async def validate_store(store_name: str):
    """Valida um RAG store"""
    print(f"🔍 Validando RAG store: {store_name}")
    print("=" * 70)
    
    gemini_service = GeminiService()
    
    try:
        exists = await gemini_service.validate_rag_store(store_name)
        
        if exists:
            print(f"✅ RAG store VÁLIDO - Existe no Gemini")
            return True
        else:
            print(f"❌ RAG store ÓRFÃO - NÃO existe no Gemini")
            return False
    except Exception as e:
        print(f"❌ Erro ao validar: {str(e)}")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python validate_store.py <rag_store_name>")
        sys.exit(1)
    
    store_name = sys.argv[1]
    result = asyncio.run(validate_store(store_name))
    sys.exit(0 if result else 1)
