"""
Serviço de integracao com Google Gemini File Search API (RAG)
"""
import asyncio
import json
import time
from typing import Optional
from google import genai
from google.genai import types
import google.generativeai as genai_legacy
from ..config import settings


class GeminiService:
    """Serviço para gerenciar RAG Stores e File Search com Gemini"""

    def __init__(self):
        # Cliente moderno para File Search
        self.client = genai.Client(api_key=settings.gemini_api_key)

        # API legado para chat multi-turn
        genai_legacy.configure(api_key=settings.gemini_api_key)

        self.model = settings.gemini_model

    async def create_rag_store(self, display_name: str) -> str:
        """
        Cria um novo RAG Store (File Search Store)

        Args:
            display_name: Nome de exibicao do store

        Returns:
            Nome do RAG store criado
        """
        try:
            # Executar em thread separada pois a API do Gemini nao e async nativa
            loop = asyncio.get_event_loop()
            rag_store = await loop.run_in_executor(
                None,
                lambda: self.client.file_search_stores.create(
                    config=types.CreateFileSearchStoreConfig(
                        display_name=display_name
                    )
                )
            )
            return rag_store.name
        except Exception as e:
            raise Exception(f"Erro ao criar RAG store: {str(e)}")

    async def upload_to_rag_store(self, rag_store_name: str, file_path: str, mime_type: str, progress_callback=None) -> dict:
        """
        Faz upload de arquivo para o RAG Store

        Args:
            rag_store_name: Nome do RAG store
            file_path: Caminho do arquivo local
            mime_type: Tipo MIME do arquivo
            progress_callback: Callback opcional para atualizar progresso (recebe elapsed_seconds)

        Returns:
            Informacoes do arquivo processado
        """
        try:
            import os
            file_size = os.path.getsize(file_path)
            print(f"📤 Iniciando upload para Gemini: {file_path} ({file_size} bytes)")

            loop = asyncio.get_event_loop()

            # Upload direto para o file search store com timeout de 5 minutos
            print(f"⏳ Fazendo upload para RAG Store: {rag_store_name}")
            operation = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self.client.file_search_stores.upload_to_file_search_store(
                        file=file_path,
                        file_search_store_name=rag_store_name,
                        config=types.UploadToFileSearchStoreConfig(
                            display_name=file_path.split('/')[-1]
                        )
                    )
                ),
                timeout=300.0  # 5 minutos
            )

            print(f"📥 Upload iniciado, aguardando processamento...")
            # Aguardar processamento da operação com timeout
            max_wait = 300  # 5 minutos
            elapsed = 0
            while not operation.done and elapsed < max_wait:
                await asyncio.sleep(3)
                elapsed += 3
                operation = await loop.run_in_executor(
                    None,
                    lambda: self.client.operations.get(operation)
                )
                print(f"⏳ Processando... ({elapsed}s)")

                # Invocar callback de progresso se fornecido
                if progress_callback:
                    await progress_callback(elapsed)

            if not operation.done:
                print(f"❌ Timeout! Upload não completou em {max_wait}s")
                raise TimeoutError(f"Upload timeout após {max_wait}s")

            print(f"✅ Upload completado com sucesso!")

            # Obter informações do arquivo importado
            if hasattr(operation, 'metadata') and hasattr(operation.metadata, 'file_name'):
                file_name = operation.metadata.file_name
                print(f"📄 Arquivo processado: {file_name}")

                return {
                    "file_name": file_name,
                    "display_name": file_path.split('/')[-1],
                    "mime_type": mime_type,
                    "size_bytes": file_size,
                    "state": "ACTIVE"
                }

            print(f"✅ Upload finalizado (sem metadata)")
            return {
                "file_name": "uploaded",
                "display_name": file_path.split('/')[-1],
                "mime_type": mime_type,
                "size_bytes": file_size,
                "state": "ACTIVE"
            }

        except asyncio.TimeoutError:
            print(f"⏱️ Timeout! Upload demorou mais de 5 minutos")
            raise Exception(f"Upload timeout após 5 minutos. Tente um arquivo menor ou tente novamente mais tarde.")
        except Exception as e:
            print(f"❌ Erro no upload: {str(e)}")
            raise Exception(f"Erro ao fazer upload para RAG store: {str(e)}")

    async def file_search(self, rag_store_name: str, query: str) -> dict:
        """
        Realiza busca semântica usando File Search API

        Args:
            rag_store_name: Nome do RAG store
            query: Pergunta do usuario

        Returns:
            Resposta com texto e grounding chunks
        """
        # Usar prompt do sistema centralizado das configurações
        system_instruction = settings.rag_system_prompt

        try:
            loop = asyncio.get_event_loop()

            # Gerar resposta usando a nova API
            response = await loop.run_in_executor(
                None,
                lambda: self.client.models.generate_content(
                    model=self.model,
                    contents=query,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        tools=[types.Tool(
                            file_search=types.FileSearch(
                                file_search_store_names=[rag_store_name]
                            )
                        )]
                    )
                )
            )

            # Extrair grounding chunks
            grounding_chunks = []
            if hasattr(response.candidates[0], 'grounding_metadata'):
                metadata = response.candidates[0].grounding_metadata
                if hasattr(metadata, 'grounding_chunks'):
                    for gc in metadata.grounding_chunks:
                        chunk_data = {}

                        # Acessar retrieved_context conforme documentação oficial
                        if hasattr(gc, 'retrieved_context'):
                            retrieved = gc.retrieved_context
                            chunk_data["text"] = retrieved.text if hasattr(retrieved, 'text') else None
                            chunk_data["title"] = retrieved.title if hasattr(retrieved, 'title') else None
                            chunk_data["uri"] = retrieved.uri if hasattr(retrieved, 'uri') else None
                            chunk_data["document_name"] = retrieved.document_name if hasattr(retrieved, 'document_name') else None

                        # Fallback para atributos diretos
                        if not chunk_data.get("text"):
                            chunk_data["text"] = gc.text if hasattr(gc, 'text') else None

                        grounding_chunks.append(chunk_data)

            return {
                "text": response.text,
                "grounding_chunks": grounding_chunks
            }

        except Exception as e:
            raise Exception(f"Erro ao realizar file search: {str(e)}")

    async def query_with_rag(self, rag_store_name: str, query: str, history: list[dict] = None) -> dict:
        """
        Realiza query com contexto de histórico de conversa

        Args:
            rag_store_name: Nome do RAG store
            query: Pergunta atual do usuario
            history: Histórico de mensagens [{"role": "user|model", "content": "..."}]

        Returns:
            Resposta com texto e grounding chunks
        """
        # Usar prompt do sistema centralizado das configurações
        system_instruction = settings.rag_system_prompt

        try:
            loop = asyncio.get_event_loop()

            # Construir contexto a partir do histórico se fornecido
            contents = query
            if history and len(history) > 1:
                # Incluir o histórico no contexto da pergunta
                context = "\n\nCONTEXTO DA CONVERSA ANTERIOR:\n"
                for msg in history[:-1]:  # Todas menos a última (que é a pergunta atual)
                    role_label = "Usuário" if msg["role"] == "user" else "Assistente"
                    context += f"{role_label}: {msg['content']}\n"
                contents = context + f"\n\nPERGUNTA ATUAL:\n{query}"

            # Gerar resposta usando a nova API
            response = await loop.run_in_executor(
                None,
                lambda: self.client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        tools=[types.Tool(
                            file_search=types.FileSearch(
                                file_search_store_names=[rag_store_name]
                            )
                        )]
                    )
                )
            )

            # Extrair grounding chunks
            grounding_chunks = []
            if hasattr(response.candidates[0], 'grounding_metadata'):
                metadata = response.candidates[0].grounding_metadata
                if hasattr(metadata, 'grounding_chunks'):
                    for gc in metadata.grounding_chunks:
                        chunk_data = {}

                        # Acessar retrieved_context conforme documentação oficial
                        if hasattr(gc, 'retrieved_context'):
                            retrieved = gc.retrieved_context
                            chunk_data["text"] = retrieved.text if hasattr(retrieved, 'text') else None
                            chunk_data["title"] = retrieved.title if hasattr(retrieved, 'title') else None
                            chunk_data["uri"] = retrieved.uri if hasattr(retrieved, 'uri') else None
                            chunk_data["document_name"] = retrieved.document_name if hasattr(retrieved, 'document_name') else None

                        # Fallback para atributos diretos
                        if not chunk_data.get("text"):
                            chunk_data["text"] = gc.text if hasattr(gc, 'text') else None

                        grounding_chunks.append(chunk_data)

            return {
                "text": response.text,
                "grounding_chunks": grounding_chunks
            }

        except Exception as e:
            raise Exception(f"Erro ao realizar query com RAG: {str(e)}")

    def query_with_rag_stream(self, rag_store_name: str, query: str, history: list[dict] = None):
        """
        Realiza query com contexto de histórico de conversa com streaming (generator síncrono)

        Args:
            rag_store_name: Nome do RAG store
            query: Pergunta atual do usuario
            history: Histórico de mensagens [{"role": "user|model", "content": "..."}]

        Yields:
            Chunks de texto e grounding chunks
        """
        # Usar prompt do sistema centralizado das configurações
        system_instruction = settings.rag_system_prompt

        try:
            # Construir contexto a partir do histórico se fornecido
            contents = query
            if history and len(history) > 1:
                # Incluir o histórico no contexto da pergunta
                context = "\n\nCONTEXTO DA CONVERSA ANTERIOR:\n"
                for msg in history[:-1]:  # Todas menos a última (que é a pergunta atual)
                    role_label = "Usuário" if msg["role"] == "user" else "Assistente"
                    context += f"{role_label}: {msg['content']}\n"
                contents = context + f"\n\nPERGUNTA ATUAL:\n{query}"

            # Gerar resposta com streaming usando a nova API
            # A API do Gemini é síncrona, então chamamos diretamente
            response_stream = self.client.models.generate_content_stream(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=[types.Tool(
                        file_search=types.FileSearch(
                            file_search_store_names=[rag_store_name]
                        )
                    )]
                )
            )

            # Processar stream
            full_text = ""
            grounding_chunks = []

            for chunk in response_stream:
                if chunk.text:
                    full_text += chunk.text
                    yield {
                        "type": "content",
                        "text": chunk.text
                    }

                # Extrair grounding chunks do último chunk
                if hasattr(chunk.candidates[0], 'grounding_metadata'):
                    metadata = chunk.candidates[0].grounding_metadata
                    if hasattr(metadata, 'grounding_chunks'):
                        grounding_chunks = []
                        for gc in metadata.grounding_chunks:
                            chunk_data = {}

                            # Acessar retrieved_context conforme documentação
                            if hasattr(gc, 'retrieved_context'):
                                retrieved = gc.retrieved_context
                                chunk_data["text"] = retrieved.text if hasattr(retrieved, 'text') else None
                                chunk_data["title"] = retrieved.title if hasattr(retrieved, 'title') else None
                                chunk_data["uri"] = retrieved.uri if hasattr(retrieved, 'uri') else None
                                chunk_data["document_name"] = retrieved.document_name if hasattr(retrieved, 'document_name') else None

                            # Fallback para atributos diretos
                            if not chunk_data.get("text"):
                                chunk_data["text"] = gc.text if hasattr(gc, 'text') else None

                            grounding_chunks.append(chunk_data)

                        print(f"📚 Grounding chunks extraídos: {len(grounding_chunks)} chunks")
                        for idx, gc in enumerate(grounding_chunks):
                            text = gc.get('text', '')
                            text_len = len(text) if text is not None else 0
                            print(f"  Chunk {idx+1}: text_len={text_len}, title={gc.get('title')}")

            # Enviar grounding chunks no final
            if grounding_chunks:
                print(f"✅ Enviando grounding chunks: {len(grounding_chunks)} chunks")
                yield {
                    "type": "grounding",
                    "grounding_chunks": grounding_chunks
                }
            else:
                print("⚠️ Nenhum grounding chunk encontrado")

            # Enviar sinal de conclusão com texto completo
            print(f"🏁 Finalizando stream com {len(grounding_chunks)} grounding chunks")
            yield {
                "type": "done",
                "full_text": full_text,
                "grounding_chunks": grounding_chunks
            }

        except Exception as e:
            yield {
                "type": "error",
                "message": f"Erro ao realizar query com RAG: {str(e)}"
            }

    async def generate_example_questions(self, rag_store_name: str) -> list[str]:
        """
        Gera perguntas exemplo baseadas nos documentos do RAG store

        Args:
            rag_store_name: Nome do RAG store

        Returns:
            Lista de perguntas sugeridas
        """
        prompt = """Voce esta analisando documentos fornecidos pelo usuario.

**TAREFA**: Gere 6 perguntas praticas e relevantes baseadas EXCLUSIVAMENTE nos documentos fornecidos.

**REGRAS CRÍTICAS**:
- NÃO INVENTE perguntas genericas
- Use APENAS topicos mencionados nos documentos
- Perguntas devem refletir informacoes reais documentadas
- Seja especifico e relevante ao conteudo

**FORMATO DE SAÍDA** (JSON):
```json
[
  {
    "product": "Nome do Modulo/Funcionalidade conforme documento",
    "questions": [
      "Pergunta especifica baseada no documento?",
      "Outra pergunta real do documento?"
    ]
  }
]
```

Gere agora as 6 perguntas baseadas nos documentos fornecidos:"""

        try:
            loop = asyncio.get_event_loop()

            # Usar a nova API
            response = await loop.run_in_executor(
                None,
                lambda: self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        tools=[types.Tool(
                            file_search=types.FileSearch(
                                file_search_store_names=[rag_store_name]
                            )
                        )]
                    )
                )
            )

            # Parse JSON response
            json_text = response.text.strip()

            # Extrair JSON do codigo markdown se presente
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0].strip()
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0].strip()

            parsed_data = json.loads(json_text)

            # Extrair perguntas
            questions = []
            if isinstance(parsed_data, list):
                for item in parsed_data:
                    if isinstance(item, dict) and "questions" in item:
                        questions.extend(item["questions"])
                    elif isinstance(item, str):
                        questions.append(item)

            return questions[:6]  # Limitar a 6 perguntas

        except Exception as e:
            print(f"Erro ao gerar perguntas: {str(e)}")
            return []

    async def generate_insights(self, rag_store_name: str) -> list[dict]:
        """
        Gera insights (resumos) dos documentos do RAG store

        Args:
            rag_store_name: Nome do RAG store

        Returns:
            Lista de insights dos documentos
        """
        prompt = """Voce esta analisando documentos fornecidos pelo usuario.

**TAREFA**: Gere 3 insights (resumos) curtos e informativos baseados EXCLUSIVAMENTE nos documentos fornecidos.

**REGRAS CRÍTICAS**:
- NÃO INVENTE informações
- Use APENAS informações mencionadas nos documentos
- Cada insight deve ser conciso (1-2 frases)
- Foque nos pontos mais importantes e relevantes dos documentos
- Seja específico e objetivo

**FORMATO DE SAÍDA** (JSON):
```json
[
  {
    "title": "Título do Insight",
    "description": "Descrição concisa do insight baseado no documento",
    "icon": "document|chart|lightbulb"
  }
]
```

Gere agora os 3 insights baseados nos documentos fornecidos:"""

        try:
            loop = asyncio.get_event_loop()

            # Usar a nova API
            response = await loop.run_in_executor(
                None,
                lambda: self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        tools=[types.Tool(
                            file_search=types.FileSearch(
                                file_search_store_names=[rag_store_name]
                            )
                        )]
                    )
                )
            )

            # Parse JSON response
            json_text = response.text.strip()

            # Extrair JSON do codigo markdown se presente
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0].strip()
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0].strip()

            parsed_data = json.loads(json_text)

            if isinstance(parsed_data, list):
                return parsed_data[:3]  # Limitar a 3 insights

            return []

        except Exception as e:
            print(f"Erro ao gerar insights: {str(e)}")
            return []

    async def delete_rag_store(self, rag_store_name: str):
        """
        Deleta um RAG store

        Args:
            rag_store_name: Nome do RAG store a ser deletado
        """
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.client.file_search_stores.delete(
                    name=rag_store_name,
                    config=types.DeleteFileSearchStoreConfig(force=True)
                )
            )
        except Exception as e:
            print(f"Erro ao deletar RAG store: {str(e)}")


# Instância global
gemini_service = GeminiService()
