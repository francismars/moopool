INSERT INTO actors (org_id, name, roles, status) VALUES
  ('ORG_FARM_A', 'Farm A', ARRAY['FarmOperator'], 'active'),
  ('ORG_TRANSPORT_1', 'Transport Co', ARRAY['Transporter'], 'active'),
  ('ORG_SLAUGHTER_7', 'Slaughterhouse 7', ARRAY['Slaughterhouse'], 'active'),
  ('ORG_INSPECT_9', 'Inspector 9', ARRAY['Inspector'], 'active')
ON CONFLICT (org_id) DO NOTHING;
