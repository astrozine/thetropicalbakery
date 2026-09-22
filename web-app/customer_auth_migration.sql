-- Migration for Customer Authentication Profiles

-- 1. Create User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    cpf VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
    ON user_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 4. Trigger for updated_at
CREATE TRIGGER update_user_profiles_modtime
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
