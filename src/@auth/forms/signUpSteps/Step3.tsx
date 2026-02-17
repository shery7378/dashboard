import { Controller, Control, FieldErrors } from 'react-hook-form';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FormType } from '../AuthJsCredentialsSignUpForm';

interface Step3Props {
    control: Control<FormType>;
    errors: FieldErrors<FormType>;
    handleNextStep: () => void;
    handleBackStep: () => void;
}

export default function Step3({
    control,
    errors,
    handleNextStep,
    handleBackStep,
}: Step3Props) {
    const BRAND_COLOR = "text-red-600";
    const BG_BRAND = "bg-red-600";
    const BORDER_BRAND = "border-red-600";

    return (
        <div className="w-full px-2 sm:px-4">
            {/* Header: Back Button & Logo */}
             <div className="relative flex items-center justify-center mb-8 mt-2">
                <button 
                    onClick={handleBackStep}
                    className="absolute left-0 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors group"
                    aria-label="Go back"
                    type="button"
                >
                    <ArrowBackIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                </button>
                <h1 className={`text-2xl font-bold ${BRAND_COLOR}`}>MultiKonnect</h1>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-2 mb-8">
                 {/* Step 1: Filled */}
                <div className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}>1</div>
                <div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>
                
                 {/* Step 2: Filled */}
                <div className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}>2</div>
                <div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>
                
                 {/* Step 3: Outlined (Active) */}
                <div className={`h-8 w-8 rounded-full border-2 ${BORDER_BRAND} flex items-center justify-center bg-white`}></div>
                <div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>
                
                 {/* Step 4: Outlined */}
                <div className={`h-8 w-8 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white`}></div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Setup Your Store Name Here</h2>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Store Name</label>
                    <Controller
                        name="storeName"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                placeholder="Your name"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
                            />
                        )}
                    />
                    {errors.storeName && <p className="mt-1 text-xs text-red-500 ml-1">{errors.storeName.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Name</label>
                    <Controller
                        name="ownerName"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                placeholder="Your name"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
                            />
                        )}
                    />
                    {errors.ownerName && <p className="mt-1 text-xs text-red-500 ml-1">{errors.ownerName.message}</p>}
                </div>
            </div>

            {/* Continue Button */}
            <Button
                className={`w-full py-3 font-semibold rounded-lg normal-case shadow-none text-white bg-[#FF4500] hover:bg-[#FF3000]`}
                onClick={handleNextStep}
                disabled={!!errors.storeName || !!errors.ownerName}
                variant="contained"
                disableElevation
                sx={{
                    bgcolor: '#EF4444', 
                    '&:hover': { bgcolor: '#DC2626' },
                    textTransform: 'none',
                    fontSize: '1rem',
                    py: 1.5
                }}
            >
                Continue
            </Button>


        </div>
    );
}