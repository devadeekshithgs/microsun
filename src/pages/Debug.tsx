import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [roles, setRoles] = useState<any>(null);
    const [orders, setOrders] = useState<any>(null);
    const [complexOrders, setComplexOrders] = useState<any>(null); // New state for complex query
    const [error, setError] = useState<any>(null);

    const fetchData = async () => {
        try {
            setError(null);
            // 1. Get Auth User
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            setUser(user);

            if (!user) return;

            // 2. Get Profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profile || { error: profileError });

            // 3. Get Roles
            const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', user.id);
            setRoles(roles || { error: rolesError });

            // 4. Get Orders (Simple)
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('*');
            setOrders(orders || { error: ordersError });

            // 5. Get Orders (Complex - Matching useOrders)
            const { data: complexData, error: complexError } = await supabase
                .from('orders')
                .select(`
          *,
          client:profiles!orders_client_id_fkey(id, full_name, company_name, email, phone),
          items:order_items(
            id,
            variant_id,
            quantity,
            variant:product_variants(
              id,
              variant_name,
              product:products(id, name, image_url)
            )
          )
        `);
            setComplexOrders(complexData || { error: complexError });

        } catch (e) {
            setError(e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Debug Dashboard</h1>
            <Button onClick={fetchData}>Refresh Data</Button>

            {error && (
                <Card className="border-destructive">
                    <CardHeader><CardTitle className="text-destructive">Global Error</CardTitle></CardHeader>
                    <CardContent><pre>{JSON.stringify(error, null, 2)}</pre></CardContent>
                </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>Auth User</CardTitle></CardHeader>
                    <CardContent><pre className="text-xs overflow-auto max-h-40">{JSON.stringify(user, null, 2)}</pre></CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Profile (Public Table)</CardTitle></CardHeader>
                    <CardContent><pre className="text-xs overflow-auto max-h-40">{JSON.stringify(profile, null, 2)}</pre></CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>User Roles</CardTitle></CardHeader>
                    <CardContent><pre className="text-xs overflow-auto max-h-40">{JSON.stringify(roles, null, 2)}</pre></CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Orders (Simple Fetch)</CardTitle></CardHeader>
                    <CardContent><pre className="text-xs overflow-auto max-h-40">{JSON.stringify(orders, null, 2)}</pre></CardContent>
                </Card>

                <Card className="col-span-2 border-primary">
                    <CardHeader><CardTitle className="text-primary">Orders (Complex Fetch - Production)</CardTitle></CardHeader>
                    <CardContent><pre className="text-xs overflow-auto max-h-40">{JSON.stringify(complexOrders, null, 2)}</pre></CardContent>
                </Card>
            </div>
        </div>
    );
}
