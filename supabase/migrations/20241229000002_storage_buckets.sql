-- ═══════════════════════════════════════════════════════════════════════════
-- JUSTINIANUS.AI — STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════

-- Criar bucket para documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documentos',
    'documentos',
    FALSE,
    52428800, -- 50MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'text/csv'
    ]
);

-- Criar bucket para avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatares',
    'avatares',
    TRUE,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Criar bucket para exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'exports',
    'exports',
    FALSE,
    104857600, -- 100MB
    ARRAY['application/zip', 'application/pdf', 'text/csv', 'application/json']
);

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Documentos: usuários podem ver documentos da sua org
CREATE POLICY "Usuários podem ver documentos da sua org"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documentos' 
    AND EXISTS (
        SELECT 1 FROM documentos d
        WHERE d.storage_path = name
        AND d.organizacao_id = ANY(get_user_org_ids())
    )
);

-- Documentos: usuários podem fazer upload na sua org
CREATE POLICY "Usuários podem fazer upload de documentos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = ANY(
        SELECT id::text FROM organizacoes WHERE id = ANY(get_user_org_ids())
    )
);

-- Documentos: usuários podem deletar documentos da sua org
CREATE POLICY "Usuários podem deletar documentos da sua org"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documentos'
    AND EXISTS (
        SELECT 1 FROM documentos d
        WHERE d.storage_path = name
        AND d.organizacao_id = ANY(get_user_org_ids())
    )
);

-- Avatares: qualquer usuário autenticado pode ver
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatares');

-- Avatares: usuários podem fazer upload do próprio avatar
CREATE POLICY "Usuários podem fazer upload do próprio avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Avatares: usuários podem atualizar próprio avatar
CREATE POLICY "Usuários podem atualizar próprio avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Avatares: usuários podem deletar próprio avatar
CREATE POLICY "Usuários podem deletar próprio avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Exports: usuários podem ver exports da sua org
CREATE POLICY "Usuários podem ver exports da sua org"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = ANY(
        SELECT id::text FROM organizacoes WHERE id = ANY(get_user_org_ids())
    )
);

-- Exports: sistema pode criar exports
CREATE POLICY "Sistema pode criar exports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exports');

-- ═══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
