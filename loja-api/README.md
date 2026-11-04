# Loja API - E-commerce NestJS & TypeORM

API RESTful desenvolvida em NestJS com TypeORM e PostgreSQL para gerenciamento completo de e-commerce, implementando controle de acesso por papéis (Roles), autenticação JWT, gestão de produtos, pedidos, endereços, pagamentos e categorias.

---

## 1. Configuração do Ambiente

Crie o arquivo `.env` na raiz do projeto (`loja-api`) a partir do arquivo de exemplo:

```bash
cp .env.example .env
```

Configurações padrão para o ambiente de laboratório:

```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=loja
DATABASE_PASS=loja
DATABASE_NAME=loja
JWT_SECRET=secret123
```

---

## 2. Banco de Dados e Seed Oficial

### 2.1 Subir o container PostgreSQL via Docker
```bash
docker compose -f docker-compose.postgres.yml up -d
```

### 2.2 Sincronização de Tabelas
Inicie o servidor para que o TypeORM (`synchronize: true`) crie automaticamente todas as tabelas no banco de dados:
```bash
npm install
npm run start:dev
```

### 2.3 Aplicar o Seed Oficial
Com o container `loja-postgres` ativo e as tabelas criadas, popule a base executando o seed completo:
```bash
docker exec -i loja-postgres psql -U loja -d loja < seed/seed.sql
```

Verifique a integridade dos dados inseridos:
```bash
bash seed/verify-seed.sh
```

---

## 3. Usuários e Papéis do Sistema

| Papel | Role | Usuário | Senha | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `ADMIN` | `ana` | `secret123` | Acesso administrativo total e mutação de categorias/produtos |
| **Cliente** | `CLIENT` | `cli` | `secret123` | Usuário comum com acesso aos próprios pedidos, endereços e pagamentos |
| **Gerente** | `MANAGER` | `mgr` | `secret123` | Consulta todos os pedidos e edita produtos (sem exclusão) |

* **Documentação Interativa (Swagger):** `http://localhost:3000/api`

---

## 4. Política de Acesso e Código de Erro

* **Código Adotado:** `403 Forbidden`.
* **Regra de Domínio:** A aplicação retorna estritamente `403 Forbidden` quando um usuário autenticado tenta visualizar, modificar ou associar recursos de outros usuários (como endereços ou pagamentos alheios).
* **Restrição de Papel:** Usuários com o papel `MANAGER` podem consultar pedidos (`GET /orders`) e editar dados de produtos (`PUT /products/:id`), mas recebem `403 Forbidden` ao tentar excluir produtos (`DELETE /products/:id`) ou gerenciar categorias.

---

## 5. Diagrama de Domínio Geral

```erDiagram
    USER ||--o{ ADDRESS : possui
    USER ||--o{ ORDER : faz
    ORDER ||--o{ ORDER_ITEM : contem
    ORDER ||--o| PAYMENT : gera
    ORDER }--o{ ADDRESS : entrega_em
    CATEGORY ||--o{ PRODUCT : categoriza
    PRODUCT ||--o{ ORDER_ITEM : compoe
```

---

## 6. Endpoints e Exemplos de Execução (CURLs)

### 6.1 Autenticação e Perfis
Obter tokens com o usuário administrador (`ana`):
```bash
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "ana", "password": "secret123"}')

ACCESS_TOKEN=$(echo $LOGIN_RESP | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo $LOGIN_RESP | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)
```

Obter perfil autenticado (`GET /auth/me`):
```bash
curl -s -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### 6.2 Gestão de Endereços (`/addresses`)
Cadastrar um novo endereço para o usuário logado (`POST /addresses`):
```bash
curl -s -X POST http://localhost:3000/addresses \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "street": "Rua das Flores",
    "number": "123",
    "city": "Recife",
    "state": "PE",
    "zipCode": "50000000"
  }'
```

Listar endereços do usuário (`GET /addresses`):
```bash
curl -s -X GET http://localhost:3000/addresses \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### 6.3 Gestão de Pagamentos (`/payments`)
Criar um pagamento simulado para um pedido aberto (`POST /orders/:id/payments`):
```bash
curl -s -X POST http://localhost:3000/orders/1/payments \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method": "PIX"}'
```

Aprovar um pagamento, alterando seu status para `PAID` e atualizando automaticamente o pedido (`PATCH /payments/:id/status`):
```bash
curl -s -X PATCH http://localhost:3000/payments/1/status \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "PAID"}'
```

---

### 6.4 Gestão de Categorias (`/categories`)
Listar todas as categorias com seus produtos (`GET /categories`):
```bash
curl -s -X GET http://localhost:3000/categories
```

Criar nova categoria como Administrador (`POST /categories`):
```bash
curl -s -X POST http://localhost:3000/categories \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Eletrônicos"}'
```

---

## 7. Status do Projeto

* [x] **Linha P** (Auth, Products, Orders, Roles, Seed)
* [x] **Features A dos Capítulos** (Versionamento, Resumo, Busca, PatchProductDto, Auth Me, Refresh Token, Role Manager, Galeria)
* [x] **Pacote Endereço** (`/addresses` - Completo com isolamento de usuário e segurança 403)
* [x] **Pacote Pagamento Fake** (`/payments` - Completo com transição de status e atualização automática de pedidos)
* [x] **Pacote Catálogo Rico / Categorias** (`/categories` - Completo com restrição ADMIN e tratamento de unicidade SQL)

---

## 8. Declaração de Uso de IA e Metodologia de Desenvolvimento

Durante o desenvolvimento deste projeto (em especial na reta final e na estruturação do módulo de Categorias), foram utilizadas ferramentas de IA assistiva (como GitHub Copilot e auxiliares de código) para otimizar o fluxo de trabalho. 

**Como a IA foi utilizada na prática:**
* **Autocompletamento e Produtividade:** Aceleração na escrita de trechos repetitivos, estruturação de DTOs e mapeamentos básicos.
* **Resolução de Erros e Imports:** Auxílio pontual no diagnóstico de erros de compilação, sugestão de importações de módulos do NestJS e pequenos *fixes* de tipagem no TypeScript.
* **Curadoria e Validação Humana:** Todo o código gerado ou sugerido pelas ferramentas passou por revisão manual, testes de comportamento e checagem de integridade para garantir que atendia exatamente às regras de negócio exigidas (como as restrições de permissão `ADMIN` / erro 403 e as relações TypeORM). 

O projeto final reflete uma construção mista, combinando a agilidade de ferramentas assistivas com a validação, lógica e curadoria manual do desenvolvedor.