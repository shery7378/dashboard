import { Controller, Control, FieldErrors } from 'react-hook-form';
import Button from '@mui/material/Button';
import { FormType } from '../AuthJsCredentialsSignUpForm';
import Typography from '@mui/material/Typography';

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
                <h1 className={`text-2xl font-bold ${BRAND_COLOR}`}>MultiKonnect</h1>
            </div>

            {/* Stepper */}
             <div className="flex items-center justify-center gap-2 mb-8">
                 {/* Step 1: Outlined/Active */}
                <div className={`h-8 w-8 rounded-full border-2 ${BORDER_BRAND} flex items-center justify-center bg-white text-gray-800 font-medium shadow-sm`}>1</div>
                <div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>
                
                 {/* Step 2: Outlined */}
                <div className={`h-8 w-8 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white`}></div>
                <div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>
                
                 {/* Step 3: Outlined */}
                <div className={`h-8 w-8 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white`}></div>
                <div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>
                
                 {/* Step 4: Outlined */}
                <div className={`h-8 w-8 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white`}></div>
            </div>

            {/* Title */}
            <Typography className="text-xl font-bold text-center mb-2 text-gray-800">
                What your Phone Number or Email?
            </Typography>

            {/* Subtitle */}
            <Typography color="textSecondary" className="text-sm text-center mb-8 text-gray-500">
                Get food, drinks, groceries, and more delivered.
            </Typography>

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
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Email</label>
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="email"
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
                                required
                            />
                        )}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500 ml-1">{errors.email.message}</p>}
                </div>
            </div>

            <Button
                variant="contained"
                className={`w-full py-3 font-semibold rounded-lg normal-case shadow-none text-white bg-[#FF4500] hover:bg-[#FF3000]`}
                onClick={handleSendCode}
                disabled={isSendingCode || !email || !!errors.email || !!errors.role || countdown > 0}
                disableElevation
                 sx={{
                    bgcolor: '#EF4444', 
                    '&:hover': { bgcolor: '#DC2626' },
                    textTransform: 'none',
                    fontSize: '1rem',
                    py: 1.5
                }}
            >
                {isSendingCode
                    ? 'Sending...'
                    : countdown > 0
                        ? `Resend Code (${countdown}s)`
                        : 'Get Code'}
            </Button>


        </div>
    );
}