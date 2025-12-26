# Product Requirements Document (PRD)

## User Personas

1.  **Super Admin**
    -   **Description**: System-level administrator with complete oversight.
    -   **Responsibilities**: Manage tenants, subscription plans, system health.
    -   **Goals**: Ensure system stability, manage revenue/subscriptions.
    -   **Pain Points**: Lack of visibility into tenant usage, difficult manual onboarding.

2.  **Tenant Admin**
    -   **Description**: Administrator for a specific organization (Tenant).
    -   **Responsibilities**: Manage team members (users), projects, and billing.
    -   **Goals**: Efficiently manage team productivity, secure company data.
    -   **Pain Points**: onboarding new users, managing access controls.

3.  **End User**
    -   **Description**: Regular team member working on projects.
    -   **Responsibilities**: executing tasks, updating status, collaborating.
    -   **Goals**: Complete tasks on time, clear visibility of work.
    -   **Pain Points**: Cluttered interface, hard to find assigned tasks.

## Functional Requirements (FR)

**Authentication & Security**
-   **FR-001**: System shall allow Tenant Registration with a unique subdomain.
-   **FR-002**: System shall support JWT-based login for all user roles.
-   **FR-003**: System shall enforce 24-hour token expiry.
-   **FR-004**: System shall allow users to logout.

**Tenant Management**
-   **FR-005**: Super Admin shall be able to list all tenants.
-   **FR-006**: Super Admin shall be able to update tenant subscription plans.
-   **FR-007**: Tenant Admin shall be able to view their own tenant details.

**User Management**
-   **FR-008**: Tenant Admin shall be able to add new users to their tenant.
-   **FR-009**: System shall enforce `max_users` limit based on subscription.
-   **FR-010**: Tenant Admin shall be able to deactivate/delete users.
-   **FR-011**: Users shall be able to view their own profile.

**Project Management**
-   **FR-012**: Tenant Admins and Users shall be able to create projects.
-   **FR-013**: System shall enforce `max_projects` limit based on subscription.
-   **FR-014**: Users shall be able to list projects they have access to.
-   **FR-015**: Users can update project status (Active/Archived).

**Task Management**
-   **FR-016**: Users shall be able to create tasks within a project.
-   **FR-017**: Users shall be able to assign tasks to other tenant members.
-   **FR-018**: Users shall be able to update task status (Todo/In Progress/Done).

## Non-Functional Requirements (NFR)

1.  **Performance**: API response time shall be < 200ms for 90% of requests.
2.  **Security**: All passwords must be hashed using bcrypt/Argon2.
3.  **Scalability**: Architecture must support horizontal scaling (stateless backend).
4.  **Isolation**: Tenant data must be logically isolated using `tenant_id`.
5.  **Availability**: System should target 99.9% uptime (Dockerized health checks).
