import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import microsunLogo from '@/assets/microsun-logo.webp';
import { companyNameSchema, phoneSchema } from '@/lib/validations';

// Schema for completing profile
const completeProfileSchema = z.object({
    companyName: companyNameSchema,
    phone: phoneSchema,
});

type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

export default function CompleteProfile() {
    const [loading, setLoading] = useState(false);
    const { user, profile, refreshProfile, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const form = useForm<CompleteProfileFormValues>({
        resolver: zodResolver(completeProfileSchema),
        defaultValues: {
            companyName: '',
            phone: '',
        },
    });

    // Redirect if no user or if profile is already complete
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login', { replace: true });
            } else if (profile?.company_name && profile?.phone) {
                // Profile is already complete, redirect to appropriate dashboard
                navigate('/', { replace: true });
            }
        }
    }, [user, profile, authLoading, navigate]);

    const onSubmit = async (values: CompleteProfileFormValues) => {
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    company_name: values.companyName,
                    phone: values.phone,
                })
                .eq('id', user.id);

            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Profile completed successfully!');
                await refreshProfile();
                navigate('/', { replace: true });
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Handle phone input to only allow digits and max 10 characters
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        onChange(value);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <img src={microsunLogo} alt="MicroSun" className="h-16 w-auto" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
                        <CardDescription>
                            Please provide your company details to complete registration
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ABC Trading Co." className="h-12" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="tel"
                                                placeholder="9876543210"
                                                className="h-12"
                                                inputMode="numeric"
                                                maxLength={10}
                                                value={field.value}
                                                onChange={(e) => handlePhoneChange(e, field.onChange)}
                                                onBlur={field.onBlur}
                                                name={field.name}
                                                ref={field.ref}
                                            />
                                        </FormControl>
                                        <FormDescription>10-digit Indian mobile number</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Complete Registration'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
