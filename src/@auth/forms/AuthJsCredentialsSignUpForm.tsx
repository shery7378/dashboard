"use client";

import { useForm, Control, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import _ from 'lodash';
import { Alert } from '@mui/material';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Step1 from './signUpSteps/Step1';
import Step2 from './signUpSteps/Step2';
import Step3 from './signUpSteps/Step3';
import Step4 from './signUpSteps/Step4';
import Step5 from './signUpSteps/Step5';
import AuthJsProviderSelect from './AuthJsProviderSelect';

/**
 * Form Validation Schema
 */
export const schema = z
    .object({
        storeName: z.string().nonempty('You must enter your store name'),
        ownerName: z.string().nonempty('You must enter your name'),
        email: z.string().email('You must enter a valid email').nonempty('You must enter an email'),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'You must enter a valid phone number').nonempty('You must enter a phone number'),
        city: z.string().nonempty('You must enter a city'),
        zipCode: z.string().nonempty('You must enter a zip code'),
        address: z.string().nonempty('You must enter an address'),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
        kycDocument: z.any().optional(), // Made optional
        emailVerificationCode: z.string().nonempty('You must enter a verification code'),
        password: z
            .string()
            .nonempty('Please enter your password.')
            .min(8, 'Password is too short - should be 8 chars minimum.'),
        passwordConfirm: z.string().nonempty('Password confirmation is required'),
        role: z.enum(['customer', 'vendor', 'supplier'], {
            errorMap: () => ({ message: 'Please select a valid role' }),
        }),
        acceptTermsConditions: z
            .boolean()
            .refine((val) => val === true, 'The terms and conditions must be accepted.'),
    })
    .refine((data) => data.password === data.passwordConfirm, {
        message: 'Passwords must match',
        path: ['passwordConfirm'],
    });

export type FormType = z.infer<typeof schema>;

const defaultValues = {
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    zipCode: '',
    address: '',
    latitude: null,
    longitude: null,
    kycDocument: null,
    emailVerificationCode: '',
    password: '',
    passwordConfirm: '',
    role: 'vendor',
    acceptTermsConditions: false,
};

function AuthJsCredentialsSignUpForm() {
    const { control, formState, handleSubmit, setError, watch, clearErrors, setValue } = useForm<FormType>({
        mode: 'onChange',
        defaultValues,
        resolver: zodResolver(schema),
    });

    const { isValid, dirtyFields, errors } = formState;
    const router = useRouter();
    const [isVerified, setIsVerified] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [step, setStep] = useState(1);
    const email = watch('email');
    const emailVerificationCode = watch('emailVerificationCode');

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [countdown]);

    async function handleSendCode() {
        try {
            setIsSendingCode(true);
            setCountdown(60);
            
            // Try to get CSRF cookie, but don't fail if it's not available (API routes might not need it)
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
                    credentials: 'include',
                }).catch(() => {
                    // Silently fail - CSRF might not be needed for API routes
                    console.log('CSRF cookie endpoint not available, continuing anyway');
                });
            } catch (csrfError) {
                // Continue even if CSRF fails
                console.log('CSRF cookie request failed, continuing:', csrfError);
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/send-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                // Check if response is JSON before parsing
                const contentType = res.headers.get('content-type');
                let errorMessage = 'Failed to send verification code. Please try again.';

                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (jsonError) {
                        // If JSON parsing fails, use default message
                        console.error('Failed to parse error response as JSON:', jsonError);
                    }
                } else {
                    // If response is HTML (error page), use default message
                    const text = await res.text();
                    console.error('Non-JSON error response:', text.substring(0, 200));
                }

                throw new Error(errorMessage);
            }

            // Small delay to ensure code is stored in cache/database
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setError('root', {
                type: 'manual',
                message: 'Verification code sent to your email.',
            });
            setStep(2);
        } catch (error) {
            setError('root', {
                type: 'manual',
                message: error.message || 'An error occurred while sending the code.',
            });
            setCountdown(0);
        } finally {
            setIsSendingCode(false);
        }
    }

    async function handleVerifyCode() {
        try {
            // Try to get CSRF cookie, but don't fail if it's not available
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
                    credentials: 'include',
                }).catch(() => {
                    // Silently fail - CSRF might not be needed for API routes
                    console.log('CSRF cookie endpoint not available, continuing anyway');
                });
            } catch (csrfError) {
                // Continue even if CSRF fails
                console.log('CSRF cookie request failed, continuing:', csrfError);
            }

            // Trim and normalize the code before sending
            const normalizedCode = emailVerificationCode.trim().replace(/\s+/g, '').replace(/[^0-9]/g, '');
            const normalizedEmail = email?.trim().toLowerCase();
            
            // Validate code length
            if (!normalizedCode || normalizedCode.length < 4) {
                setError('root', {
                    type: 'manual',
                    message: 'Please enter a valid verification code.',
                });
                return;
            }

            console.log('Verifying code:', {
                email: normalizedEmail,
                code_original: emailVerificationCode,
                code_normalized: normalizedCode,
                code_length: normalizedCode.length,
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: normalizedEmail,
                    code: normalizedCode,
                }),
            });

            if (!res.ok) {
                // Check if response is JSON before parsing
                const contentType = res.headers.get('content-type');
                let errorMessage = 'Invalid verification code. Please try again.';
                let errorDetails = null;
                
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.message || errorMessage;
                        errorDetails = errorData.debug || errorData.errors || null;
                        
                        console.error('Verification error:', {
                            status: res.status,
                            message: errorMessage,
                            details: errorDetails,
                            full_response: errorData,
                        });
                    } catch (jsonError) {
                        // If JSON parsing fails, use default message
                        console.error('Failed to parse error response as JSON:', jsonError);
                    }
                } else {
                    // If response is HTML (error page), use default message
                    const text = await res.text();
                    console.error('Non-JSON error response:', {
                        status: res.status,
                        statusText: res.statusText,
                        preview: text.substring(0, 200),
                    });
                }
                
                throw new Error(errorMessage);
            }

            const responseData = await res.json();
            console.log('Verification successful:', responseData);

            setIsVerified(true);
            clearErrors('root');
            setStep(3);
        } catch (error) {
            setError('root', {
                type: 'manual',
                message: error.message || 'An error occurred while verifying the code.',
            });
        }
    }

    async function onSubmit(formData: FormType) {
        if (!isVerified) {
            setError('root', {
                type: 'manual',
                message: 'Please verify your email before submitting the form.',
            });
            return false;
        }

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
                credentials: 'include',
            });

            // Convert kycDocument to Base64 if provided
            let kycDocumentBase64 = '';
            if (formData.kycDocument && formData.kycDocument.length > 0) {
                const file = formData.kycDocument[0];
                kycDocumentBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.readAsDataURL(file);
                });
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.ownerName,
                    storeName: formData.storeName,
                    email: formData.email,
                    phone: formData.phone,
                    city: formData.city,
                    zip_code: formData.zipCode,
                    postal_code: formData.zipCode,
                    address: formData.address,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    kycDocument: kycDocumentBase64,
                    code: formData.emailVerificationCode,
                    password: formData.password,
                    password_confirmation: formData.passwordConfirm,
                    role: formData.role,
                }),
            });

            if (!res.ok) {
                // Check if response is JSON before parsing
                const contentType = res.headers.get('content-type');
                let errorMessage = 'Registration failed. Please check your details and try again.';

                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (jsonError) {
                        // If JSON parsing fails, use default message
                        console.error('Failed to parse error response as JSON:', jsonError);
                    }
                } else {
                    // If response is HTML (error page), use default message
                    const text = await res.text();
                    console.error('Non-JSON error response:', text.substring(0, 200));
                }

                throw new Error(errorMessage);
            }

            const data = await res.json();

            const signInResult = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            console.log('SignIn result after registration:', signInResult);

            if (signInResult?.error) {
                console.error('SignIn error:', signInResult.error);
                setError('root', {
                    type: 'manual',
                    message: signInResult.error,
                });
                // Redirect to sign-in page with a message
                setTimeout(() => {
                    window.location.href = '/sign-in?message=Registration successful. Please sign in.';
                }, 1000);
                return false;
            }

            if (!signInResult?.ok) {
                console.error('SignIn not ok:', signInResult);
                setError('root', {
                    type: 'manual',
                    message: 'Sign in failed after registration. Please try logging in manually.',
                });
                // Redirect to sign-in page with a message
                setTimeout(() => {
                    window.location.href = '/sign-in?message=Registration successful. Please sign in.';
                }, 1000);
                return false;
            }

            console.log('SignIn successful, redirecting to dashboards...');

            // Use window.location.href for more reliable redirect and longer delay
            // to ensure session is fully established
            setTimeout(() => {
                window.location.href = '/dashboards';
            }, 1000);
            return true;
        } catch (error) {
            setError('root', {
                type: 'manual',
                message: error.message || 'An unexpected error occurred. Please try again.',
            });
            return false;
        }
    }

    const handleNextStep = () => {
        if (step === 1 && !errors.role && !errors.email) {
            setStep(2);
        } else if (step === 2 && !errors.emailVerificationCode) {
            setStep(3);
        } else if (step === 3 && !errors.storeName && !errors.ownerName) {
            setStep(4);
        } else if (step === 4 && !errors.phone && !errors.city && !errors.address) {
            setStep(5);
        }
    };

    const handleBackStep = () => {
        if (step > 1) {
            setStep(step - 1);
            if (step === 3) {
                clearErrors('root');
            }
        }
    };

    return (
        <form
            name="registerForm"
            noValidate
            className="mt-4 flex w-full flex-col justify-center"
            onSubmit={handleSubmit(onSubmit)}
        >
            {errors?.root?.message && step !== 2 && (
                <Alert
                    className="mb-4"
                    severity={errors?.root?.message.includes('sent') ? 'success' : 'error'}
                    sx={(theme) => ({
                        backgroundColor: errors?.root?.message.includes('sent')
                            ? theme.palette.success.light
                            : theme.palette.error.light,
                        color: errors?.root?.message.includes('sent')
                            ? theme.palette.success.dark
                            : theme.palette.error.dark,
                    })}
                >
                    {errors?.root?.message}
                </Alert>
            )}

            {step === 1 && (
                <Step1
                    control={control}
                    errors={errors}
                    email={email}
                    isSendingCode={isSendingCode}
                    countdown={countdown}
                    handleSendCode={handleSendCode}
                />
            )}
            {step === 1 && <AuthJsProviderSelect />}

            {step === 2 && (
                <Step2
                    control={control}
                    errors={errors}
                    emailVerificationCode={emailVerificationCode}
                    handleVerifyCode={handleVerifyCode}
                    handleBackStep={handleBackStep}
                />
            )}

            {step === 3 && isVerified && (
                <Step3
                    control={control}
                    errors={errors}
                    handleNextStep={handleNextStep}
                    handleBackStep={handleBackStep}
                />
            )}

            {step === 4 && isVerified && (
                <Step4
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    handleNextStep={handleNextStep}
                    handleBackStep={handleBackStep}
                />
            )}

            {step === 5 && isVerified && (
                <Step5
                    control={control}
                    errors={errors}
                    handleBackStep={handleBackStep}
                    isValid={isValid}
                    dirtyFields={dirtyFields}
                />
            )}
        </form>
    );
}

export default AuthJsCredentialsSignUpForm;