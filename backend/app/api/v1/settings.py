"""
Rotas da API para gerenciamento de configurações do usuário
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid

from ...config.database import db
from ...config.settings import settings
from ...schemas.settings import (
    SettingUpdate, SettingResponse,
    SystemPromptUpdate, SystemPromptResponse
)

router = APIRouter()


@router.get("/system-prompt", response_model=SystemPromptResponse)
async def get_system_prompt(user_id: str = "default-user"):
    """
    Retorna o system prompt configurado para o usuário
    """
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
    user_id: str = "default-user"
):
    """
    Atualiza o system prompt do usuário
    """
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
async def reset_system_prompt(user_id: str = "default-user"):
    """
    Restaura o system prompt para o padrão
    """
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
async def list_settings(user_id: str = "default-user"):
    """
    Lista todas as configurações do usuário
    """
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
    user_id: str = "default-user"
):
    """
    Atualiza ou cria uma configuração genérica
    """
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
