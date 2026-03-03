# Roles y usuarios (simplificado)

No se ejecuta nada en Supabase sin tu confirmación. Los pasos que debes ejecutar tú están al final.

---

## Los 3 roles

| Rol (en código y Supabase) | Panel | Descripción |
|----------------------------|--------|-------------|
| **super_admin** | Solo Panel Super Admin | Gestión del SaaS: empresas, planes. |
| **ceo** | Solo Panel Admin Local | Acceso completo al panel del negocio. Puede crear usuarios (staff) y asignarles permisos. |
| **staff** | Solo Panel Admin Local | Trabajadores creados por el CEO. Solo ven las pestañas que el CEO les asigna. |

---

## Dónde se guarda cada rol

- **Panel Super Admin:** el usuario debe estar en la tabla **`admin_users`** con `role = 'super_admin'`.
- **Panel Admin Local:** el acceso es **solo por la tabla `users`**. El usuario debe tener una fila en **`users`** con el `company_id` de ese local y `role = 'ceo'` o `role = 'staff'`. Así cada CEO (y staff) solo entra al local que tiene asignado. **`admin_users` no se usa** para el panel del local.

---

## Permisos por rol en el admin local

- **ceo:** ve todas las pestañas (pedidos, caja, reportes, categorías, productos, inventario, clientes, herramientas, datos de la empresa) y puede gestionar usuarios.
- **staff:** ve solo las pestañas que el CEO configure en **Permisos de panel por rol** (en Super Admin, al editar la empresa, sección “Permisos de panel por rol” → columna **Staff**).

---

## Qué debes hacer en Supabase (tú lo ejecutas)

1. **Actualizar roles existentes** (si ya tienes datos):
   - En **`admin_users`:** dejar solo a quienes deban entrar al Panel Super Admin, con `role = 'super_admin'`. Cualquier CEO que esté en `admin_users` debe pasarse a **`users`** con el `company_id` del local que corresponda (y `auth_user_id` / `auth_id` si hace falta).
   - En **`users`:** usar solo `role = 'ceo'` o `role = 'staff'` y el `company_id` del local. Si tenías `owner`, `admin`, `cashier`, etc., reemplázalos por `ceo` o `staff`.

2. **Restricción de valores en `role` (opcional):**
   - **`admin_users.role`:** solo `'super_admin'` (p. ej. CHECK `role IN ('super_admin')`).
   - **`users.role`:** solo `'ceo'` o `'staff'` (p. ej. CHECK `role IN ('ceo', 'staff')`).

3. **Migración SQL:** en el repo está `supabase/migrations/20250302000000_fix_roles_admin_users_and_users.sql`. Para la **base de pruebas**: en el Dashboard de Supabase (proyecto prueba) → SQL Editor, pega y ejecuta el contenido de ese archivo. O, con Supabase CLI enlazado al proyecto prueba: `supabase db push`.
