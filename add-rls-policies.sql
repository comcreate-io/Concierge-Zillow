-- Enable RLS on property_managers table
ALTER TABLE property_managers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read property managers" ON property_managers;
DROP POLICY IF EXISTS "Allow authenticated users to insert property managers" ON property_managers;
DROP POLICY IF EXISTS "Allow authenticated users to update property managers" ON property_managers;
DROP POLICY IF EXISTS "Allow authenticated users to delete property managers" ON property_managers;

-- Create policy to allow authenticated users to read property managers
CREATE POLICY "Allow authenticated users to read property managers"
ON property_managers
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert property managers
CREATE POLICY "Allow authenticated users to insert property managers"
ON property_managers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update property managers
CREATE POLICY "Allow authenticated users to update property managers"
ON property_managers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete property managers
CREATE POLICY "Allow authenticated users to delete property managers"
ON property_managers
FOR DELETE
TO authenticated
USING (true);

-- Enable RLS on property_manager_assignments table
ALTER TABLE property_manager_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read property manager assignments" ON property_manager_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to insert property manager assignments" ON property_manager_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to update property manager assignments" ON property_manager_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to delete property manager assignments" ON property_manager_assignments;

-- Create policies for property_manager_assignments
CREATE POLICY "Allow authenticated users to read property manager assignments"
ON property_manager_assignments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert property manager assignments"
ON property_manager_assignments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update property manager assignments"
ON property_manager_assignments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete property manager assignments"
ON property_manager_assignments
FOR DELETE
TO authenticated
USING (true);
