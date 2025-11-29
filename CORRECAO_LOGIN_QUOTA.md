# Correção de Erro de Login (Quota Exceeded / CORS Falso)

**Data**: 2025-11-29
**Status**: ✅ **CORRIGIDO**

---

## 🔍 Diagnóstico

O usuário reportou erros de login que pareciam ser de **CORS** (`Access-Control-Allow-Origin missing`) e falha de rede (`net::ERR_FAILED`).

No entanto, a análise detalhada revelou:
1.  **Backend Saudável**: Testes via `curl` confirmaram que o backend responde corretamente ao login e envia os headers CORS corretos (`Access-Control-Allow-Origin: http://localhost:3001`).
2.  **Erro Real**: O console do navegador mostrava `Uncaught (in promise) Error: Resource::kQuotaBytes quota exceeded`.
    *   Isso indica que o **LocalStorage** do navegador está cheio ou corrompido.
    *   Quando o frontend tentava salvar o token recebido, o navegador lançava esse erro.
    *   Esse erro não tratado interrompia o fluxo, fazendo parecer que a requisição de rede tinha falhado.

---

## 🛠️ Solução Aplicada

Implementamos uma estratégia de "Degradação Graciosa" (Graceful Degradation):

1.  **Proteção do Storage (`authService.ts`)**:
    *   Envolvemos todas as gravações no `localStorage` em blocos `try-catch`.
    *   Se o navegador recusar salvar o token (Quota Exceeded), o sistema **não quebra mais**.
    *   O token é mantido apenas em **memória RAM**.
    *   Um alerta é exibido ao usuário avisando sobre o problema de armazenamento.

2.  **Acesso Seguro ao Token (`apiService.ts`)**:
    *   Refatoramos o serviço de API para parar de ler o token direto do disco (`localStorage`).
    *   Agora ele pede o token ao `authService`, que retorna a versão da memória (que sempre existe após o login).

---

## 🚀 Resultado

*   **O login agora funciona** mesmo se o navegador estiver com armazenamento cheio.
*   O erro de "CORS" deve desaparecer, pois era um sintoma colateral da falha no script.
*   **Atenção**: Se o armazenamento estiver cheio, o usuário precisará logar novamente sempre que recarregar a página (F5), pois o token não persistirá no disco.

## 📝 Recomendação ao Usuário

Se você vir um alerta sobre "Armazenamento cheio", limpe os dados de navegação/cache do seu navegador para este site para resolver o problema definitivamente.
