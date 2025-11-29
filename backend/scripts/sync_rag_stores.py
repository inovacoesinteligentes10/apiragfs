#!/usr/bin/env python3
"""
Script de Sincronização de RAG Stores

Este script valida todos os documentos no banco de dados contra a API do Gemini
e atualiza o status dos documentos órfãos (cujos RAG stores não existem mais).

Uso:
    python sync_rag_stores.py [--dry-run] [--auto-fix]

Opções:
    --dry-run    Apenas mostra o que seria feito, sem fazer alterações
    --auto-fix   Corrige automaticamente sem pedir confirmação
"""
import asyncio
import sys
import os
from datetime import datetime
from typing import Dict, List, Tuple

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.config.database import db
from app.services.gemini_service import GeminiService


class RAGStoreSync:
    """Sincronizador de RAG Stores"""

    def __init__(self, dry_run: bool = False, auto_fix: bool = False):
        self.dry_run = dry_run
        self.auto_fix = auto_fix
        self.gemini_service = GeminiService()
        self.stats = {
            'total_documents': 0,
            'valid_documents': 0,
            'orphaned_documents': 0,
            'unique_stores': 0,
            'orphaned_stores': 0,
            'fixed_documents': 0
        }

    async def get_all_documents(self) -> List[Dict]:
        """Busca todos os documentos do banco de dados"""
        print("📊 Buscando documentos no banco de dados...")
        
        documents = await db.fetch_all(
            """
            SELECT 
                id, 
                name, 
                rag_store_name, 
                status, 
                error_message,
                created_at,
                updated_at
            FROM documents
            WHERE rag_store_name IS NOT NULL
            ORDER BY created_at DESC
            """
        )
        
        self.stats['total_documents'] = len(documents)
        print(f"✅ Encontrados {len(documents)} documentos com RAG stores\n")
        
        return [dict(doc) for doc in documents]

    async def validate_rag_store(self, rag_store_name: str) -> bool:
        """Valida se um RAG store existe no Gemini"""
        try:
            exists = await self.gemini_service.validate_rag_store(rag_store_name)
            return exists
        except Exception as e:
            print(f"   ⚠️  Erro ao validar: {str(e)}")
            return False

    async def analyze_documents(self, documents: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Analisa documentos e separa válidos de órfãos"""
        print("🔍 Validando RAG stores contra a API do Gemini...\n")
        
        # Agrupar documentos por RAG store
        stores_map: Dict[str, List[Dict]] = {}
        for doc in documents:
            store_name = doc['rag_store_name']
            if store_name not in stores_map:
                stores_map[store_name] = []
            stores_map[store_name].append(doc)
        
        self.stats['unique_stores'] = len(stores_map)
        print(f"📦 Total de RAG stores únicos: {len(stores_map)}\n")
        
        valid_docs = []
        orphaned_docs = []
        
        # Validar cada RAG store
        for idx, (store_name, docs) in enumerate(stores_map.items(), 1):
            print(f"[{idx}/{len(stores_map)}] Validando: {store_name}")
            print(f"   📄 {len(docs)} documento(s) associado(s)")
            
            is_valid = await self.validate_rag_store(store_name)
            
            if is_valid:
                print(f"   ✅ RAG store VÁLIDO\n")
                valid_docs.extend(docs)
                self.stats['valid_documents'] += len(docs)
            else:
                print(f"   ❌ RAG store ÓRFÃO (não existe no Gemini)\n")
                orphaned_docs.extend(docs)
                self.stats['orphaned_documents'] += len(docs)
                self.stats['orphaned_stores'] += 1
        
        return valid_docs, orphaned_docs

    async def fix_orphaned_documents(self, orphaned_docs: List[Dict]) -> int:
        """Marca documentos órfãos como erro no banco de dados"""
        if not orphaned_docs:
            return 0
        
        fixed_count = 0
        error_message = (
            "RAG store não existe mais no Gemini. "
            "O store pode ter sido deletado ou expirado. "
            "Por favor, faça upload do documento novamente."
        )
        
        for doc in orphaned_docs:
            doc_id = doc['id']
            name = doc['name']
            
            if self.dry_run:
                print(f"   [DRY-RUN] Marcaria documento '{name}' (ID: {doc_id}) como erro")
            else:
                print(f"   🔧 Corrigindo documento '{name}' (ID: {doc_id})...")
                
                await db.execute(
                    """
                    UPDATE documents
                    SET 
                        status = 'error',
                        error_message = $1,
                        rag_store_name = NULL,
                        updated_at = NOW()
                    WHERE id = $2
                    """,
                    error_message,
                    doc_id
                )
                
                print(f"   ✅ Documento marcado como erro")
                fixed_count += 1
        
        self.stats['fixed_documents'] = fixed_count
        return fixed_count

    def print_summary(self, orphaned_docs: List[Dict]):
        """Imprime resumo da análise"""
        print("\n" + "=" * 70)
        print("📋 RESUMO DA SINCRONIZAÇÃO")
        print("=" * 70)
        print(f"📊 Total de documentos analisados:  {self.stats['total_documents']}")
        print(f"📦 RAG stores únicos encontrados:   {self.stats['unique_stores']}")
        print(f"✅ Documentos válidos:              {self.stats['valid_documents']}")
        print(f"❌ Documentos órfãos:               {self.stats['orphaned_documents']}")
        print(f"🗑️  RAG stores órfãos:               {self.stats['orphaned_stores']}")
        
        if orphaned_docs:
            print("\n" + "-" * 70)
            print("⚠️  DOCUMENTOS ÓRFÃOS ENCONTRADOS:")
            print("-" * 70)
            
            # Agrupar por RAG store
            by_store: Dict[str, List[Dict]] = {}
            for doc in orphaned_docs:
                store = doc['rag_store_name']
                if store not in by_store:
                    by_store[store] = []
                by_store[store].append(doc)
            
            for store_name, docs in by_store.items():
                print(f"\n📦 RAG Store: {store_name}")
                print(f"   Documentos afetados: {len(docs)}")
                for doc in docs:
                    print(f"   - {doc['name']} (ID: {doc['id']})")
        
        print("\n" + "=" * 70)

    async def run(self):
        """Executa a sincronização completa"""
        print("=" * 70)
        print("🔄 SINCRONIZAÇÃO DE RAG STORES")
        print("=" * 70)
        
        if self.dry_run:
            print("⚠️  MODO DRY-RUN: Nenhuma alteração será feita no banco de dados")
        if self.auto_fix:
            print("🤖 MODO AUTO-FIX: Correções serão aplicadas automaticamente")
        
        print("\n")
        
        # Conectar ao banco
        await db.connect()
        
        try:
            # 1. Buscar todos os documentos
            documents = await self.get_all_documents()
            
            if not documents:
                print("✅ Nenhum documento com RAG store encontrado!")
                return
            
            # 2. Analisar e validar documentos
            valid_docs, orphaned_docs = await self.analyze_documents(documents)
            
            # 3. Imprimir resumo
            self.print_summary(orphaned_docs)
            
            # 4. Corrigir documentos órfãos (se necessário)
            if orphaned_docs:
                print("\n" + "=" * 70)
                
                should_fix = False
                
                if self.auto_fix:
                    should_fix = True
                    print("🤖 Aplicando correções automaticamente...")
                elif self.dry_run:
                    should_fix = False
                    print("⚠️  Modo DRY-RUN: Nenhuma correção será aplicada")
                else:
                    print("🔧 AÇÕES DISPONÍVEIS:")
                    print("   1. Marcar documentos órfãos como 'error' (recomendado)")
                    print("   2. Cancelar (não fazer nada)")
                    
                    response = input("\nEscolha uma opção (1/2): ").strip()
                    should_fix = response == "1"
                
                if should_fix:
                    print("\n🔧 Corrigindo documentos órfãos...\n")
                    fixed = await self.fix_orphaned_documents(orphaned_docs)
                    
                    if not self.dry_run:
                        print(f"\n✅ {fixed} documento(s) corrigido(s) com sucesso!")
                        print("\n💡 PRÓXIMOS PASSOS:")
                        print("   1. Faça upload dos documentos novamente no sistema")
                        print("   2. Novos RAG stores serão criados automaticamente")
                        print("   3. Crie novas sessões de chat com os documentos atualizados")
                else:
                    print("\n❌ Operação cancelada. Nenhuma alteração foi feita.")
            else:
                print("\n✅ Todos os documentos estão sincronizados corretamente!")
                print("   Nenhuma ação necessária.")
        
        finally:
            # Desconectar do banco
            await db.disconnect()
        
        print("\n" + "=" * 70)
        print("✅ Sincronização concluída!")
        print("=" * 70 + "\n")


async def main():
    """Função principal"""
    # Parse argumentos
    dry_run = '--dry-run' in sys.argv
    auto_fix = '--auto-fix' in sys.argv
    
    # Executar sincronização
    sync = RAGStoreSync(dry_run=dry_run, auto_fix=auto_fix)
    await sync.run()


if __name__ == "__main__":
    asyncio.run(main())
