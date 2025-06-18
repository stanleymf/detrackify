-- Migration 004: Add phone normalization mappings
-- This migration adds phone normalization to the extract processing mappings

-- Add phone normalization mappings for sender and recipient phone numbers
INSERT INTO extract_processing_mappings (id, store_id, dashboard_field, processing_type, source_field, format, created_at, updated_at)
VALUES 
  (hex(randomblob(16)), NULL, 'senderNumberOnApp', 'phone', 'billing_address.phone', 'normalize', datetime('now'), datetime('now')),
  (hex(randomblob(16)), NULL, 'senderPhoneNo', 'phone', 'billing_address.phone', 'normalize', datetime('now'), datetime('now')),
  (hex(randomblob(16)), NULL, 'recipientPhoneNo', 'phone', 'shipping_address.phone', 'normalize', datetime('now'), datetime('now'))
ON CONFLICT(store_id, dashboard_field) DO NOTHING; 