import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { nameSchema, phoneSchema, companyNameSchema } from '@/lib/validations';

// Profile update schema
const profileSchema = z.object({
    fullName: nameSchema,
    companyName: companyNameSchema.optional().or(z.literal('')),
    phone: phoneSchema.optional().or(z.literal('')),
    address: z.string().max(500, 'Address is too long').optional(),
    city: z.string().max(100, 'City name is too long').optional(),
    state: z.string().max(100, 'State name is too long').optional(),
    pincode: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits').optional().or(z.literal('')),
    gstNumber: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GST number format').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const [loading, setLoading] = useState(false);
    const { user, profile, role, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: profile?.full_name || '',
            companyName: profile?.company_name || '',
            phone: profile?.phone || '',
            address: profile?.address || '',
            city: profile?.city || '',
            state: profile?.state || '',
            pincode: profile?.pincode || '',
            gstNumber: profile?.gst_number || '',
        },
    });

    const onSubmit = async (values: ProfileFormValues) => {
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: values.fullName,
                    company_name: values.companyName || null,
                    phone: values.phone || null,
                    address: values.address || null,
                    city: values.city || null,
                    state: values.state || null,
                    pincode: values.pincode || null,
                    gst_number: values.gstNumber || null,
                })
                .eq('id', user.id);

            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Profile updated successfully!');
                await refreshProfile();
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

    // Handle pincode input to only allow digits and max 6 characters
    const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        onChange(value);
    };

    const getRoleLabel = () => {
        switch (role) {
            case 'admin': return 'Administrator';
            case 'worker': return 'Worker';
            case 'client': return 'Client';
            default: return 'User';
        }
    };

    const getBackPath = () => {
        switch (role) {
            case 'admin': return '/admin';
            case 'worker': return '/worker';
            case 'client': return '/client';
            default: return '/';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto p-4 max-w-2xl">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => navigate(getBackPath())} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    <p className="text-muted-foreground">
                        Manage your account information • <span className="text-primary font-medium">{getRoleLabel()}</span>
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your profile details below</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {/* Email - Read Only */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input value={profile?.email || ''} disabled className="bg-muted" />
                                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {role === 'client' && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="companyName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Company Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ABC Trading Co." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="gstNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>GST Number (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="22AAAAA0000A1Z5" {...field} className="uppercase" />
                                                    </FormControl>
                                                    <FormDescription>15-character GST identification number</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}

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
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                    value={field.value}
                                                    onChange={(e) => handlePhoneChange(e, field.onChange)}
                                                    onBlur={field.onBlur}
                                                    name={field.name}
                                                    ref={field.ref}
                                                />
                                            </FormControl>
                                            <FormDescription>10-digit mobile number</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {role === 'client' && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Street address, building, etc." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>City</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Mumbai" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="state"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>State</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Maharashtra" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="pincode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>PIN Code</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="400001"
                                                            inputMode="numeric"
                                                            maxLength={6}
                                                            value={field.value}
                                                            onChange={(e) => handlePincodeChange(e, field.onChange)}
                                                            onBlur={field.onBlur}
                                                            name={field.name}
                                                            ref={field.ref}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
