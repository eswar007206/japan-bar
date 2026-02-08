-- Fix overly permissive RLS policies for bill_designations
DROP POLICY IF EXISTS "Bill designations can be inserted" ON public.bill_designations;
DROP POLICY IF EXISTS "Bill designations can be updated" ON public.bill_designations;

-- Bill designations: require valid cast session for insert/update
CREATE POLICY "Bill designations insert by valid session" ON public.bill_designations 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cast_sessions cs
            WHERE cs.cast_id = bill_designations.cast_id
            AND cs.expires_at > now()
        )
    );

CREATE POLICY "Bill designations update by valid session" ON public.bill_designations 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.cast_sessions cs
            WHERE cs.cast_id = bill_designations.cast_id
            AND cs.expires_at > now()
        )
    );