-- Up Migration
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) CHECK (status IN ('active', 'suspended', 'trial')) DEFAULT 'active',
  subscription_plan VARCHAR(20) CHECK (subscription_plan IN ('free', 'pro', 'enterprise')) DEFAULT 'free',
  max_users INTEGER DEFAULT 5,
  max_projects INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Down Migration
DROP TABLE IF EXISTS tenants;
