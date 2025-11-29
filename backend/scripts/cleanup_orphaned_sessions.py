"""
Script para limpar sessões órfãs (sessões que referenciam RAG stores que não existem)
"""
import asyncio
import sys
import os

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.config.database import db
from app.services.gemini_service import GeminiService


async def cleanup_orphaned_sessions():
    """
    Limpa sessões de chat que referenciam RAG stores que não existem mais
    """
    print("🔍 Buscando sessões órfãs...")

    # Conectar ao banco
    await db.connect()

    try:
        # Buscar todas as sessões
        sessions = await db.fetch_all(
            """
            SELECT id, rag_store_name, user_id, started_at
            FROM chat_sessions
            WHERE rag_store_name IS NOT NULL
            ORDER BY started_at DESC
            """
        )

        print(f"📊 Encontradas {len(sessions)} sessões com RAG stores")

        gemini_service = GeminiService()
        orphaned_sessions = []

        # Validar cada sessão
        for session in sessions:
            rag_store_name = session['rag_store_name']
            session_id = session['id']

            print(f"\n🔎 Validando sessão {session_id}...")
            print(f"   RAG Store: {rag_store_name}")

            # Verificar se o RAG store existe
            store_exists = await gemini_service.validate_rag_store(rag_store_name)

            if not store_exists:
                print(f"   ❌ RAG store não existe!")
                orphaned_sessions.append(session)
            else:
                print(f"   ✅ RAG store válido")

        # Mostrar resultado
        print(f"\n\n📋 RESUMO:")
        print(f"   Total de sessões: {len(sessions)}")
        print(f"   Sessões órfãs encontradas: {len(orphaned_sessions)}")

        if orphaned_sessions:
            print(f"\n⚠️  Sessões órfãs:")
            for session in orphaned_sessions:
                print(f"   - {session['id']} (store: {session['rag_store_name']})")

            # Perguntar se deseja deletar
            response = input("\n🗑️  Deseja deletar essas sessões órfãs? (s/n): ")

            if response.lower() in ['s', 'sim', 'y', 'yes']:
                for session in orphaned_sessions:
                    session_id = session['id']
                    print(f"\n🗑️  Deletando sessão {session_id}...")

                    # Marcar como finalizada (ao invés de deletar completamente)
                    await db.execute(
                        """
                        UPDATE chat_sessions
                        SET ended_at = NOW()
                        WHERE id = $1
                        """,
                        session_id
                    )

                    print(f"   ✅ Sessão marcada como finalizada")

                print(f"\n✅ {len(orphaned_sessions)} sessões órfãs foram limpas!")
            else:
                print("\n❌ Operação cancelada")
        else:
            print(f"\n✅ Nenhuma sessão órfã encontrada!")

    finally:
        # Desconectar do banco
        await db.disconnect()


if __name__ == "__main__":
    print("🧹 Limpeza de Sessões Órfãs")
    print("=" * 60)
    asyncio.run(cleanup_orphaned_sessions())
