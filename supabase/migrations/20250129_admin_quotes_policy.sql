-- Allow authenticated users (admins) to view all quotes
CREATE POLICY "Admins can view all quotes" ON quotes
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users (admins) to update all quotes
CREATE POLICY "Admins can update all quotes" ON quotes
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users (admins) to delete all draft quotes
CREATE POLICY "Admins can delete all draft quotes" ON quotes
    FOR DELETE
    TO authenticated
    USING (status = 'draft');
