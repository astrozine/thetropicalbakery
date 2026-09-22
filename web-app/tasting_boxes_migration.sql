-- Migration for Caixas de Degustacao (Tasting Boxes)

CREATE TABLE IF NOT EXISTS tasting_boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    batch_date_label VARCHAR(100),
    total_quantity INTEGER DEFAULT 0,
    sold_quantity INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE tasting_boxes ENABLE ROW LEVEL SECURITY;

-- Public can view active tasting boxes
CREATE POLICY "Public can view active tasting boxes"
    ON tasting_boxes FOR SELECT
    USING (is_active = TRUE);

-- Admin can manage everything
CREATE POLICY "Admins can manage tasting boxes" 
    ON tasting_boxes FOR ALL 
    USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_tasting_boxes_modtime
    BEFORE UPDATE ON tasting_boxes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
