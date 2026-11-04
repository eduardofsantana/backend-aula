-- Seed oficial completo da trilha loja-api (linha P)
-- Senha: secret123  |  ana=ADMIN  |  cli=CLIENT  |  mgr=MANAGER
-- Visitante: não é cadastrado; acessa apenas rotas públicas, sem role ou token.
-- Pré-requisito: tabelas users, products, orders e order_items
--   já criadas pela API (synchronize) — tipicamente a partir do cap. 6.
-- Antes de auth/pedidos, use seed-catalog.sql.
--
-- Usa DELETE (não TRUNCATE). DELETE não reinicia SERIAL;
-- por isso ALTER SEQUENCE … RESTART WITH 1 após limpar,
-- para os curls com productId: 1 / id=1 continuarem válidos.

DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM users;

ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

INSERT INTO users (username, email, password, role) VALUES
  ('ana', 'ana@loja.test', '$2b$10$2gYSaz98rFtxXgbjMktX..g1WvfCU3fZ8YrQVyK3rUYNCBzSfM2x2', 'ADMIN'),
  ('cli', 'cli@loja.test', '$2b$10$2gYSaz98rFtxXgbjMktX..g1WvfCU3fZ8YrQVyK3rUYNCBzSfM2x2', 'CLIENT'),
  ('cli2', 'cli2@loja.test', '$2b$10$2gYSaz98rFtxXgbjMktX..g1WvfCU3fZ8YrQVyK3rUYNCBzSfM2x2', 'CLIENT'),
  ('mgr', 'mgr@loja.test', '$2b$10$2gYSaz98rFtxXgbjMktX..g1WvfCU3fZ8YrQVyK3rUYNCBzSfM2x2', 'MANAGER');

INSERT INTO products (name, price, stock) VALUES
  ('Caneca Nest', 39.90, 10),
  ('Camiseta ADS', 59.90, 25);

SELECT id, username, role FROM users ORDER BY id;
SELECT id, name, price, stock FROM products ORDER BY id;