/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Document, QueryResult, CustomMetadata } from '../types';

let ai: GoogleGenAI;

export function initialize() {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createRagStore(displayName: string): Promise<string> {
    if (!ai) throw new Error("Gemini AI not initialized");
    const ragStore = await ai.fileSearchStores.create({ config: { displayName } });
    if (!ragStore.name) {
        throw new Error("Failed to create RAG store: name is missing.");
    }
    return ragStore.name;
}

export async function uploadToRagStore(ragStoreName: string, file: File): Promise<void> {
    if (!ai) throw new Error("Gemini AI not initialized");
    
    let op = await ai.fileSearchStores.uploadToFileSearchStore({
        fileSearchStoreName: ragStoreName,
        file: file
    });

    while (!op.done) {
        await delay(3000);
        op = await ai.operations.get({operation: op});
    }
}

export async function fileSearch(ragStoreName: string, query: string): Promise<QueryResult> {
    if (!ai) throw new Error("Gemini AI not initialized");
    const systemPrompt = `# ChatSUA - Assistente RAG do Sistema Unificado de Administração da UNIFESP

## IDENTIDADE
Você é o **ChatSUA**, assistente especializado do Sistema Unificado de Administração (SUA) da UNIFESP (sua.unifesp.br). Atende estudantes, professores e técnicos administrativos.

## REGRA DE OURO - FIDELIDADE ABSOLUTA
**CRÍTICO**: Responda EXCLUSIVAMENTE com base nos documentos fornecidos pelo sistema RAG.

### Quando a informação ESTÁ nos documentos:
- Cite LITERALMENTE, preservando formatação, numeração e estrutura
- Para dados estruturados (listas, objetivos, requisitos): forneça TODOS os itens SEM resumo
- Use **negrito** para termos-chave e títulos de seções

### Quando a informação NÃO ESTÁ nos documentos:
Declare explicitamente: "Não encontrei essa informação específica nos documentos disponíveis sobre o SUA. Você pode reformular a pergunta ou consultar diretamente https://sua.unifesp.br"

### PROIBIÇÕES ABSOLUTAS:
❌ NUNCA adicione conhecimento externo ou use treinamento prévio
❌ NUNCA resuma dados estruturados (OE1, OE2, requisitos, etc)
❌ NUNCA invente informações ou "preencha lacunas"
❌ NUNCA use frases genéricas como "busca desenvolver", "é fundamental", "visa integrar"

## ADAPTAÇÃO POR PERFIL

### Estudante:
- Linguagem acessível, explique siglas: "CR (Coeficiente de Rendimento)"
- Procedimentos passo-a-passo
- Antecipe dúvidas comuns

### Professor:
- Terminologia técnica apropriada
- Foco em prazos e responsabilidades
- Objetivo e direto

### Técnico Administrativo:
- Todos os detalhes estruturados
- Precisão técnica absoluta
- Fluxos e integrações

## ESTRUTURA DE RESPOSTA

1. **Resposta direta** (1-2 frases de contexto se necessário)
2. **Citação literal** do documento com formatação preservada
3. **Se extenso**: organize em tópicos mantendo texto original
4. **Ofereça aprofundamento**: "Posso detalhar algum item específico?"

## GESTÃO DE AMBIGUIDADE

Se a pergunta for ambígua:
"Para ajudá-lo melhor, você se refere a [opção A] ou [opção B]?"

## MÚLTIPLOS DOCUMENTOS

Se encontrar informação em vários documentos:
"Encontrei isso em [N] documentos:
**Documento 1**: [citação literal]
**Documento 2**: [citação literal]"

## FORMATAÇÃO VISUAL
- Use **negrito** para termos-chave
- Preserve listas numeradas/com marcadores
- Parágrafos curtos (máx 3-4 linhas)
- Preserve tabelas quando presentes

## PERGUNTA DO USUÁRIO
${query}

---
Responda seguindo rigorosamente estas diretrizes. Lembre-se: FIDELIDADE AO DOCUMENTO é prioridade máxima.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
        config: {
            tools: [
                    {
                        fileSearch: {
                            fileSearchStoreNames: [ragStoreName],
                        }
                    }
                ]
        }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
        text: response.text,
        groundingChunks: groundingChunks,
    };
}

export async function generateExampleQuestions(ragStoreName: string): Promise<string[]> {
    if (!ai) throw new Error("Gemini AI not initialized");
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Você está analisando documentação do Sistema Unificado de Administração (SUA) da UNIFESP - um portal de serviços/atendimento para estudantes, professores e técnicos administrativos.

**TAREFA**: Gere 6 perguntas práticas e frequentes baseadas EXCLUSIVAMENTE nos documentos fornecidos.

**REGRAS CRÍTICAS**:
- NÃO INVENTE perguntas genéricas
- Use APENAS tópicos/módulos mencionados nos documentos
- Perguntas devem refletir tarefas reais documentadas
- Adapte para os 3 perfis: estudantes, professores, técnicos

**CATEGORIAS POSSÍVEIS** (use apenas se estiverem nos documentos):
- Procedimentos acadêmicos (matrícula, notas, frequência)
- Solicitações/Requerimentos
- Documentos e certificados
- Processos administrativos
- Consultas e relatórios
- Acesso e permissões

**FORMATO DE SAÍDA** (JSON):
\`\`\`json
[
  {
    "product": "Nome do Módulo/Funcionalidade conforme documento",
    "questions": [
      "Pergunta específica baseada no documento?",
      "Outra pergunta real do documento?"
    ]
  }
]
\`\`\`

**EXEMPLO BOM** (baseado em documento real):
\`\`\`json
[{"product": "Matrícula", "questions": ["Como adicionar disciplinas?", "Qual o prazo de ajuste?"]}]
\`\`\`

**EXEMPLO RUIM** (genérico/inventado):
\`\`\`json
[{"product": "Sistema", "questions": ["Como funciona o SUA?", "O que posso fazer?"]}]
\`\`\`

Gere agora as 6 perguntas baseadas nos documentos fornecidos:`,
            config: {
                tools: [
                    {
                        fileSearch: {
                            fileSearchStoreNames: [ragStoreName],
                        }
                    }
                ]
            }
        });
        
        let jsonText = response.text.trim();

        const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            jsonText = jsonMatch[1];
        } else {
            const firstBracket = jsonText.indexOf('[');
            const lastBracket = jsonText.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                jsonText = jsonText.substring(firstBracket, lastBracket + 1);
            }
        }
        
        const parsedData = JSON.parse(jsonText);
        
        if (Array.isArray(parsedData)) {
            if (parsedData.length === 0) {
                return [];
            }
            const firstItem = parsedData[0];

            // Handle new format: array of {product, questions[]}
            if (typeof firstItem === 'object' && firstItem !== null && 'questions' in firstItem && Array.isArray(firstItem.questions)) {
                return parsedData.flatMap(item => (item.questions || [])).filter(q => typeof q === 'string');
            }
            
            // Handle old format: array of strings
            if (typeof firstItem === 'string') {
                return parsedData.filter(q => typeof q === 'string');
            }
        }
        
        console.warn("Received unexpected format for example questions:", parsedData);
        return [];
    } catch (error) {
        console.error("Failed to generate or parse example questions:", error);
        return [];
    }
}


export async function deleteRagStore(ragStoreName: string): Promise<void> {
    if (!ai) throw new Error("Gemini AI not initialized");
    // DO: Remove `(as any)` type assertion.
    await ai.fileSearchStores.delete({
        name: ragStoreName,
        config: { force: true },
    });
}