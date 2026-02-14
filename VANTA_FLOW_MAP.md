# 🗺️ VANTA | Mapa de Navegação e Fluxo de Operações (V3.0)

Este documento descreve a arquitetura lógica de movimentação do usuário e os gatilhos de visibilidade baseados na **Árvore do VANTA**.

---

## 🏗️ 1. Camada de Infraestrutura: A Árvore Lógica
A navegação não é linear, mas baseada em **Jurisdição** e **Vínculo (Bonding)**.

*   **Raiz (Unidade/Comunidade)**: Onde a soberania reside. Define o endereço e o dono (`Owner`).
*   **Tronco (Eventos)**: Instâncias operacionais que herdam a localização da unidade.
*   **Galhos (Staff)**: Permissões que "brotam" apenas em eventos específicos.
*   **Frutos (Membros)**: Orbitam os eventos conforme o RSVP/Ticket.

---

## 🚪 2. Portal de Entrada (O Gate)
**Fluxo:** Landing Page → Protocolo de Cadastro (3 Steps) → Biometria Facial → Submissão.

| Tela | Ação | Lógica de Estado |
| :--- | :--- | :--- |
| **Landing** | Escolha entre Login ou Acesso | Verifica sessão ativa no Supabase Auth. |
| **Signup Step 1** | Dados Básicos (Nascimento 18+) | Validação de idade e localidade (UF/Cidade). |
| **Signup Step 2** | Identidade Social (@Insta/E-mail) | Verificação de duplicidade de e-mail/handle. |
| **Signup Step 3** | Captura de Selfie (Biometria) | Upload para o bucket `selfies` (RLS isolado por pasta UID). |
| **Aguardando** | Overlay de Curadoria | Perfil existe mas `approved_at` é NULL. Bloqueia tabs sociais. |

---

## ✨ 3. Ecossistema do Membro (A Aura)
A navegação padrão após aprovação do Conselho.

### A. Home (Início)
*   **Vanta Indica**: Destaques curados. Se o evento é `isFeatured`, ele sobe para o carrossel.
*   **Próximos Eventos**: Lista filtrada por `selectedCity` no header.
*   **Navegação**: Clique no card abre `EventDetail`.

### B. Radar (GPS Ativo)
*   **Mapa Interativo**: Markers de eventos próximos.
*   **Timeline (Calendário)**: Permite visualizar sessões futuras (Passado é invisível).
*   **Lógica**: Se o usuário não deu permissão de GPS, o centro padrão é a `selectedCity`.

### C. Busca Social
*   **Eventos**: Busca global por sessões.
*   **Membros**: Busca por rede (Nome/@Insta).
*   **Perfil do Membro**: Visualização de galeria e status de amizade (`friendshipStore`).

### D. Acesso (Wallet Digital)
*   **Protocolo de Segurança**: Bloqueio por senha do app. 3 tentativas falhas geram lockout de 5 min.
*   **QR Code**: Dinâmico (Hash Base64). Desabilita se o membro for restrito.
*   **Gift Protocol**: Transferência P2P de tickets com validação biométrica do remetente.

---

## 🛠️ 4. Operação de Campo (Staff & Portaria)
A navegação "muta" quando o usuário entra no modo Admin com vínculo ativo.

### A. Dashboard de Unidade
*   **Dono/Produtor**: Vê o consolidado financeiro e todos os eventos da unidade.
*   **Sócio/Promoter**: Vê apenas os eventos onde seu nome está no `staff`.

### B. Portaria (Gatekeeper)
1.  **Timeline**: Regras de acesso ativas no horário real (Ex: VIP até 22h).
2.  **Scanner**: Câmera ativa para validação de `user_tickets`.
3.  **Lista de Nomes**:
    *   *Promoter*: Adiciona/Consulta apenas seus convidados (Cotas obrigatórias).
    *   *Portaria*: Consulta lista geral e executa Check-in.

---

## ⚖️ 5. Comando Central (Soberania Master)
Acesso exclusivo aos perfis de nível 0 (Master).

*   **Curadoria Global**: Aprovação manual de novos membros e atribuição de Tags de Elite.
*   **Broadcaster**: Disparo de mensagens segmentadas por nível de curadoria (Ex: Apenas `vanta_vip`).
*   **Tribunal de Ética**:
    *   Abertura de Dossiês de comportamento inadequado.
    *   Votação anônima qualitativa.
    *   Sentença: Suspensão ativa a **Aura de Restrição**, deixando o app do réu em escala de cinza e desabilitando chats/tickets.

---

## 🔒 6. Matriz de Segurança (RLS)
*   **Profiles**: Leitura total para autenticados, escrita apenas no próprio UID.
*   **Messages**: `(auth.uid() = sender_id) OR (auth.uid() = receiver_id)`.
*   **Tickets**: `auth.uid() = user_id` (Ninguém vê o QR Code de ninguém).
*   **Incidences**: Visível apenas para Master ou Staff da Unidade envolvida.

---
**Protocolo VANTA: Navegação Baseada em Contexto e Segurança de Elite.**