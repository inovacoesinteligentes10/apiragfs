"""
Rotas da API para gerenciamento de configurações do usuário
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid
import json

from ...config.database import db
from ...config.settings import settings
from ...schemas.settings import (
    SettingUpdate, SettingResponse,
    SystemPromptUpdate, SystemPromptResponse,
    GeneralSettingsUpdate, GeneralSettingsResponse
)
from ...middleware.auth import get_current_user

router = APIRouter(tags=["Settings"])


@router.get("/system-prompt", response_model=SystemPromptResponse)
async def get_system_prompt(current_user: dict = Depends(get_current_user)):
    """
    Retorna o system prompt configurado para o usuário autenticado
    """
    user_id = current_user['id']
    # Buscar configuração customizada do banco
    setting = await db.fetch_one(
        """
        SELECT setting_value, updated_at
        FROM user_settings
        WHERE user_id = $1 AND setting_key = 'rag_system_prompt'
        """,
        user_id
    )

    if setting:
        return {
            "system_prompt": setting["setting_value"],
            "updated_at": setting["updated_at"]
        }

    # Se não encontrou no banco, retornar o padrão das configurações
    return {
        "system_prompt": settings.rag_system_prompt,
        "updated_at": datetime.now()
    }


@router.put("/system-prompt", response_model=SystemPromptResponse)
async def update_system_prompt(
    data: SystemPromptUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza o system prompt do usuário autenticado (apenas admin)
    """
    user_id = current_user['id']
    is_admin = current_user.get('is_admin', False)

    # Apenas admin pode alterar o system prompt
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Apenas administradores podem alterar o system prompt"
        )

    try:
        # Verificar se já existe uma configuração
        existing = await db.fetch_one(
            """
            SELECT id FROM user_settings
            WHERE user_id = $1 AND setting_key = 'rag_system_prompt'
            """,
            user_id
        )

        if existing:
            # Atualizar configuração existente
            await db.execute(
                """
                UPDATE user_settings
                SET setting_value = $1, updated_at = NOW()
                WHERE user_id = $2 AND setting_key = 'rag_system_prompt'
                """,
                data.system_prompt, user_id
            )
        else:
            # Criar nova configuração
            setting_id = str(uuid.uuid4())
            await db.execute(
                """
                INSERT INTO user_settings (id, user_id, setting_key, setting_value, created_at, updated_at)
                VALUES ($1, $2, 'rag_system_prompt', $3, NOW(), NOW())
                """,
                setting_id, user_id, data.system_prompt
            )

        return {
            "system_prompt": data.system_prompt,
            "updated_at": datetime.now()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar configuração: {str(e)}")


@router.post("/reset-system-prompt", response_model=SystemPromptResponse)
async def reset_system_prompt(current_user: dict = Depends(get_current_user)):
    """
    Restaura o system prompt para o padrão do usuário autenticado (apenas admin)
    """
    user_id = current_user['id']
    is_admin = current_user.get('is_admin', False)

    # Apenas admin pode resetar o system prompt
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Apenas administradores podem resetar o system prompt"
        )

    try:
        # Deletar configuração customizada
        await db.execute(
            """
            DELETE FROM user_settings
            WHERE user_id = $1 AND setting_key = 'rag_system_prompt'
            """,
            user_id
        )

        return {
            "system_prompt": settings.rag_system_prompt,
            "updated_at": datetime.now()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao resetar configuração: {str(e)}")


@router.get("/", response_model=list[SettingResponse])
async def list_settings(current_user: dict = Depends(get_current_user)):
    """
    Lista todas as configurações do usuário autenticado
    """
    user_id = current_user['id']
    settings_list = await db.fetch_all(
        """
        SELECT id, user_id, setting_key, setting_value, created_at, updated_at
        FROM user_settings
        WHERE user_id = $1
        ORDER BY setting_key
        """,
        user_id
    )

    return [dict(setting) for setting in settings_list]


@router.put("/", response_model=SettingResponse)
async def update_setting(
    data: SettingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza ou cria uma configuração genérica do usuário autenticado
    """
    user_id = current_user['id']
    try:
        # Verificar se já existe
        existing = await db.fetch_one(
            """
            SELECT id FROM user_settings
            WHERE user_id = $1 AND setting_key = $2
            """,
            user_id, data.setting_key
        )

        if existing:
            # Atualizar
            await db.execute(
                """
                UPDATE user_settings
                SET setting_value = $1, updated_at = NOW()
                WHERE user_id = $2 AND setting_key = $3
                """,
                data.setting_value, user_id, data.setting_key
            )
            setting_id = existing["id"]
        else:
            # Criar
            setting_id = str(uuid.uuid4())
            await db.execute(
                """
                INSERT INTO user_settings (id, user_id, setting_key, setting_value, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                """,
                setting_id, user_id, data.setting_key, data.setting_value
            )

        # Buscar e retornar configuração atualizada
        setting = await db.fetch_one(
            """
            SELECT id, user_id, setting_key, setting_value, created_at, updated_at
            FROM user_settings
            WHERE id = $1
            """,
            setting_id
        )

        return dict(setting)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar configuração: {str(e)}")


@router.get("/general", response_model=GeneralSettingsResponse)
async def get_general_settings(current_user: dict = Depends(get_current_user)):
    """
    Retorna as configurações gerais do usuário autenticado
    """
    user_id = current_user['id']
    is_admin = current_user.get('is_admin', False)

    # Valores padrão
    default_settings = {
        "language": "pt-BR",
        "theme": "light",
        "notifications": True,
        "auto_save": True,
        "system_name": "ApiRAGFS",
        "system_description": "Sistema RAG com Google Gemini File Search",
        "system_logo": "📚",
        "is_admin": is_admin
    }

    # Buscar configurações do banco
    setting = await db.fetch_one(
        """
        SELECT setting_value, updated_at
        FROM user_settings
        WHERE user_id = $1 AND setting_key = 'general_settings'
        """,
        user_id
    )

    if setting:
        try:
            saved_settings = json.loads(setting["setting_value"])
            return {
                **default_settings,
                **saved_settings,
                "is_admin": is_admin,  # Sempre override com valor real
                "updated_at": setting["updated_at"]
            }
        except json.JSONDecodeError:
            pass

    # Retornar padrões se não encontrou no banco
    return {
        **default_settings,
        "updated_at": datetime.now()
    }


@router.put("/general", response_model=GeneralSettingsResponse)
async def update_general_settings(
    data: GeneralSettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza as configurações gerais do usuário autenticado.
    Usuários não-admin podem alterar apenas: theme
    Apenas admin pode alterar: system_name, system_description, system_logo, language, notifications, auto_save
    """
    user_id = current_user['id']
    is_admin = current_user.get('is_admin', False)

    try:
        # Buscar configurações atuais
        existing = await db.fetch_one(
            """
            SELECT setting_value FROM user_settings
            WHERE user_id = $1 AND setting_key = 'general_settings'
            """,
            user_id
        )

        # Mesclar com valores existentes
        current_settings = {}
        if existing:
            try:
                current_settings = json.loads(existing["setting_value"])
            except json.JSONDecodeError:
                pass

        # Atualizar apenas os campos fornecidos
        update_data = data.model_dump(exclude_none=True)

        # Validar permissões: usuários não-admin podem alterar APENAS o tema
        if not is_admin:
            # Usuários não-admin só podem alterar 'theme'
            allowed_fields = ['theme']
            for field in update_data.keys():
                if field not in allowed_fields:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Usuários não-administradores podem alterar apenas o tema"
                    )

        current_settings.update(update_data)

        # Serializar para JSON
        settings_json = json.dumps(current_settings)

        if existing:
            # Atualizar configuração existente
            await db.execute(
                """
                UPDATE user_settings
                SET setting_value = $1, updated_at = NOW()
                WHERE user_id = $2 AND setting_key = 'general_settings'
                """,
                settings_json, user_id
            )
        else:
            # Criar nova configuração
            setting_id = str(uuid.uuid4())
            await db.execute(
                """
                INSERT INTO user_settings (id, user_id, setting_key, setting_value, created_at, updated_at)
                VALUES ($1, $2, 'general_settings', $3, NOW(), NOW())
                """,
                setting_id, user_id, settings_json
            )

        return {
            **current_settings,
            "is_admin": is_admin,
            "updated_at": datetime.now()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar configurações: {str(e)}")


@router.post("/reset-general", response_model=GeneralSettingsResponse)
async def reset_general_settings(current_user: dict = Depends(get_current_user)):
    """
    Restaura as configurações gerais para o padrão do usuário autenticado (apenas admin)
    """
    user_id = current_user['id']
    is_admin = current_user.get('is_admin', False)

    # Apenas admin pode resetar configurações gerais
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Apenas administradores podem restaurar configurações padrão"
        )

    try:
        # Deletar configuração customizada
        await db.execute(
            """
            DELETE FROM user_settings
            WHERE user_id = $1 AND setting_key = 'general_settings'
            """,
            user_id
        )

        # Retornar configurações padrão
        return {
            "language": "pt-BR",
            "theme": "light",
            "notifications": True,
            "auto_save": True,
            "system_name": "ApiRAGFS",
            "system_description": "Sistema RAG com Google Gemini File Search",
            "system_logo": "📚",
            "updated_at": datetime.now()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao resetar configurações: {str(e)}")
