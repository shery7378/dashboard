import { Controller, Control, FieldErrors } from 'react-hook-form';
import { FormType } from '../AuthJsCredentialsSignUpForm';
import { AuthTitle, AuthInput, AuthButton } from '@/components/auth';

interface Step1Props {
    control: Control<FormType>;
    errors: FieldErrors<FormType>;
    email: string;
    isSendingCode: boolean;
    countdown: number;
    handleSendCode: () => void;
}

export default function Step1({
    control,
    errors,
    email,
    isSendingCode,
    countdown,
    handleSendCode,
}: Step1Props) {
    const BRAND_COLOR = "text-red-600";
    const BG_BRAND = "bg-red-600";
    const BORDER_BRAND = "border-red-600";

    return (
        <div className="w-full px-2 sm:px-4">
            {/* Header: Logo */}
            <div className="relative flex items-center justify-center mb-8 mt-2">
                <img src={'/assets/images/MultiKonnect.svg'} alt="MultiKonnect" className="h-10 w-auto object-contain cursor-pointer brightness-0 invert" />
            </div>
 

            {/* Title */}
            <AuthTitle
                heading="What your Phone Number or Email?"
                subtitle="Get food, drinks, groceries, and more delivered."
            />
            {/* Form Fields */}
            <div className="space-y-4 mb-6">
                {/* Role Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">I am a...</label>
                    <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => field.onChange('vendor')}
                                    className={`flex-1 py-3 rounded-lg border ${field.value === 'vendor' ? 'border-red-600 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-600'} transition-all`}
                                >
                                    Seller
                                </button>
                                <button
                                    type="button"
                                    onClick={() => field.onChange('supplier')}
                                    className={`flex-1 py-3 rounded-lg border ${field.value === 'supplier' ? 'border-red-600 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-600'} transition-all`}
                                >
                                    Supplier
                                </button>
                            </div>
                        )}
                    />
                    {errors.role && <p className="mt-1 text-xs text-red-500 ml-1">{errors.role.message}</p>}
                </div>

                {/* Email Input */}
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <AuthInput
                            {...field}
                            label="Email"
                            type="email"
                            placeholder="name@example.com"
                            error={errors.email?.message}
                            className="mb-4"
                            required
                        />
                    )}
                />
            </div>

            <AuthButton
                variant="primary"
                fullWidth
                loading={isSendingCode}
                disabled={!email || !!errors.email || !!errors.role || countdown > 0}
                onClick={handleSendCode}
                className="h-12 py-3"
            >
                {isSendingCode
                    ? 'Sending...'
                    : countdown > 0
                        ? `Resend Code (${countdown}s)`
                        : 'Get Code'}
            </AuthButton>


        </div>
    );
}