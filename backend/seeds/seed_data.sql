-- Super Admin (No Tenant)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (gen_random_uuid(), NULL, 'superadmin@system.com', '$2b$10$Y4rLsmzvQDLUbcsPpAfl9ubW6o17cBHxcVTp4lTJcW98f.5XOrNQ6', 'System Super Admin', 'super_admin', true);

-- Demo Tenant
WITH new_tenant AS (
  INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
  VALUES (gen_random_uuid(), 'Demo Company', 'demo', 'active', 'pro', 25, 15)
  RETURNING id
),
tenant_admin AS (
  INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
  SELECT gen_random_uuid(), id, 'admin@demo.com', '$2b$10$CjPdBqf7c4N5pN7Zxl8qteSStnc8okudIklog.ORYzT4wv2N45LsS', 'Demo Admin', 'tenant_admin', true
  FROM new_tenant
  RETURNING id, tenant_id
),
user1 AS (
  INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
  SELECT gen_random_uuid(), tenant_id, 'user1@demo.com', '$2b$10$gp0zDl/qpqs3Hmeu8tKMxOLd39NmMJJo8Lv79xsT671QPLNBhIYdi', 'User One', 'user', true
  FROM tenant_admin
  RETURNING id, tenant_id
),
user2 AS (
  INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
  SELECT gen_random_uuid(), tenant_id, 'user2@demo.com', '$2b$10$gp0zDl/qpqs3Hmeu8tKMxOLd39NmMJJo8Lv79xsT671QPLNBhIYdi', 'User Two', 'user', true
  FROM tenant_admin
  RETURNING id, tenant_id
),
project1 AS (
  INSERT INTO projects (id, tenant_id, name, description, status, created_by)
  SELECT gen_random_uuid(), tenant_id, 'Project Alpha', 'First demo project', 'active', id
  FROM tenant_admin
  RETURNING id, tenant_id
),
project2 AS (
  INSERT INTO projects (id, tenant_id, name, description, status, created_by)
  SELECT gen_random_uuid(), tenant_id, 'Project Beta', 'Second demo project', 'active', id
  FROM tenant_admin
  RETURNING id, tenant_id
)
INSERT INTO tasks (tenant_id, project_id, title, description, status, priority, assigned_to, due_date)
SELECT p.tenant_id, p.id, 'Initial Setup', 'Setup project environment', 'completed', 'high', u.id, CURRENT_DATE + INTERVAL '1 day'
FROM project1 p, user1 u
UNION ALL
SELECT p.tenant_id, p.id, 'Design Review', 'Review initial designs', 'in_progress', 'medium', u.id, CURRENT_DATE + INTERVAL '2 days'
FROM project1 p, user2 u
UNION ALL
SELECT p.tenant_id, p.id, 'Backend API', 'Implement core APIs', 'todo', 'high', u.id, CURRENT_DATE + INTERVAL '5 days'
FROM project1 p, user1 u;
