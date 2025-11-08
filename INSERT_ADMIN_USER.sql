-- Insert admin user for FJL
INSERT INTO admins (email, full_name, password_hash, role, is_active)
VALUES (
  'admin@fjl.com',
  'Admin User',
  '$2a$10$YI16yJl0JIy/YWawYqn03OqRk9lDC.0GLqnCU/5D.JaMt.CRG2YJu',
  'owner',
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$YI16yJl0JIy/YWawYqn03OqRk9lDC.0GLqnCU/5D.JaMt.CRG2YJu',
  is_active = TRUE;
