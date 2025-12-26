# Research & Requirements Analysis

## Multi-Tenancy Analysis

We evaluated three common approaches for multi-tenancy:

| Approach | Description | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Shared Database, Shared Schema** | All tenants share the same tables. Rows are distinguished by a `tenant_id` column. | - Easiest to implement and maintain.<br>- Easiest data aggregation/analytics.<br>- Lowest infrastructure cost.<br>- fast migration updates. | - Weakest isolation (developer error can expose data).<br>- Performance bottlenecks if not indexed properly.<br>- Backup/Restore for single tenant is hard. |
| **Shared Database, Separate Schemas** | One DB, but each tenant has their own schema (e.g., `tenant_a.users`, `tenant_b.users`). | - Better isolation than shared schema.<br>- Recovering one tenant's data is easier.<br>- Good balance of cost/isolation. | - Complex migration management (must run on N schemas).<br>- Higher resource overhead than shared schema.<br>- Connection pooling challenges. |
| **Separate Databases** | Each tenant has their own dedicated database instance. | - Strongest isolation.<br>- Scalable (can move tenants to different servers).<br>- Best for enterprise security requirements. | - Highest cost.<br>- Most complex infrastructure.<br>- Hardest to maintain and aggregate data. |

**Chosen Approach: Shared Database + Shared Schema**
For this SaaS application, we have chosen the **Shared Database, Shared Schema** approach.
**Justification**:
1.  **Simplicity**: It allows for rapid development of the MVP and reduces complexity in the application layer.
2.  **Cost-Effective**: We can run a single PostgreSQL instance for all tenants, which is ideal for a startup/growth phase.
3.  **Performance**: With proper indexing on `tenant_id` (which is a requirement), performance will remain high for the expected scale.
4.  **Tooling**: ORMs and migration tools handle this pattern very well.

## Technology Stack Justification

| component | Technology | Justification |
| :--- | :--- | :--- |
| **Backend** | **Node.js + Express** | - Non-blocking I/O is excellent for API Servers.<br>- Huge ecosystem of libraries (JWT, ORMs).<br>- JSON-native, perfect for REST APIs.<br>- "npx" compatibility for easy setup. |
| **Frontend** | **React + Vite** | - React is the industry standard for dynamic UIs.<br>- Vite provides ultra-fast build times.<br>- Component-based architecture suits the Dashboard/Project/Task structure perfectly. |
| **Database** | **PostgreSQL** | - Robust relational database with ACID compliance.<br>- Excellent support for concurrent connections.<br>- Strong community support and extensions. |
| **Authentication** | **JWT (JSON Web Tokens)** | - Stateless authentication scales well.<br>- No need for server-side session storage (reduces DB load).<br>- Standard for modern SPAs. |
| **Containerization** | **Docker & Docker Compose** | - Ensures environment consistency (Dev vs Prod).<br>- Simplifies deployment of the 3-service stack (DB, Backend, Frontend).<br>- Mandatory requirement for this project. |

## Security Considerations

1.  **Data Isolation**: We will use a Middleware that intercepts every request, extracts the `tenant_id` from the JWT, and enforces it on all database queries. This "Soft Isolation" depends on rigorous code practices.
2.  **Authentication**:
    - **JWT** with 24-hour expiry.
    - Passwords hashed using **bcrypt** (salt rounds 10-12).
    - No sensitive data (passwords) in token payloads.
3.  **Authorization (RBAC)**:
    - Middleware to check roles (`super_admin`, `tenant_admin`, `user`).
    - API endpoints will be protected by these guards.
4.  **Input Validation**:
    - All incoming data (registration, task creation) will be validated on the backend to prevent injection attacks and ensure data integrity.
5.  **API Security**:
    - **CORS** configured to only allow the specific frontend URL.
    - **Rate Limiting** (optional but good practice) to prevent abuse.
    - **Audit Logging**: tracking critical actions (Create/Update/Delete) for accountability.
