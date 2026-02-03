import { supabase } from '@/integrations/supabase/client';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface ErrorLogContext {
    [key: string]: unknown;
}

/**
 * Centralized error logging utility
 * Logs errors to both console and Supabase for debugging
 */
export class ErrorLogger {
    /**
     * Log an error with context
     */
    static async log(
        errorMessage: string,
        options: {
            error?: Error | unknown;
            severity?: ErrorSeverity;
            source?: string;
            context?: ErrorLogContext;
        } = {}
    ): Promise<void> {
        const {
            error,
            severity = 'error',
            source = 'unknown',
            context = {},
        } = options;

        // Extract error stack if available
        let errorStack: string | undefined;
        if (error instanceof Error) {
            errorStack = error.stack;
        } else if (error && typeof error === 'object' && 'stack' in error) {
            errorStack = String(error.stack);
        }

        // Log to console with appropriate method
        const consoleMethod = severity === 'critical' || severity === 'error' ? console.error : console.warn;
        consoleMethod(`[${severity.toUpperCase()}] ${source}:`, errorMessage, {
            error,
            context,
        });

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            // Log to Supabase
            const { error: logError } = await supabase
                .from('error_logs')
                .insert({
                    user_id: user?.id || null,
                    error_message: errorMessage,
                    error_stack: errorStack || null,
                    error_context: context as any,
                    severity,
                    source,
                });

            if (logError) {
                // If logging fails, at least log to console
                console.error('Failed to log error to database:', logError);
            }
        } catch (loggingError) {
            // Silent fail - don't let error logging break the app
            console.error('Error in error logger:', loggingError);
        }
    }

    /**
     * Log an info message
     */
    static async info(message: string, source: string, context?: ErrorLogContext): Promise<void> {
        await this.log(message, { severity: 'info', source, context });
    }

    /**
     * Log a warning
     */
    static async warning(message: string, source: string, context?: ErrorLogContext): Promise<void> {
        await this.log(message, { severity: 'warning', source, context });
    }

    /**
     * Log an error
     */
    static async error(message: string, source: string, error?: Error | unknown, context?: ErrorLogContext): Promise<void> {
        await this.log(message, { severity: 'error', source, error, context });
    }

    /**
     * Log a critical error
     */
    static async critical(message: string, source: string, error?: Error | unknown, context?: ErrorLogContext): Promise<void> {
        await this.log(message, { severity: 'critical', source, error, context });
    }
}
