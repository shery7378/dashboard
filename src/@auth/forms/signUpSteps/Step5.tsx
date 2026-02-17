import { Controller, Control, FieldErrors } from 'react-hook-form';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { FormType } from '../AuthJsCredentialsSignUpForm';

interface Step5Props {
    control: Control<FormType>;
    errors: FieldErrors<FormType>;
    handleBackStep: () => void;
    isValid: boolean;
    dirtyFields: Partial<Readonly<FormType>>;
}

export default function Step5({
    control,
    errors,
    handleBackStep,
    isValid,
    dirtyFields,
}: Step5Props) {
    const kycDocumentRef = useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

    const handleFileUpload = () => {
        kycDocumentRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, onChange: (files: FileList | null) => void) => {
        const files = event.target.files;
        onChange(files);
        setSelectedFileName(files && files.length > 0 ? files[0].name : null);
    };

    const BRAND_COLOR = "text-red-600";
    const BG_BRAND = "bg-red-600";

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
                
                 {/* Step 3: Filled */}
                <div className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}>3</div>
                <div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>
                
                 {/* Step 4: Filled (Active/Done) */}
                <div className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}>4</div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Setup Your Store Password!</h2>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Password</label>
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="password"
                                placeholder="Your name" 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
                            />
                        )}
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-500 ml-1">{errors.password.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Confirm Password</label>
                    <Controller
                        name="passwordConfirm"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="password"
                                placeholder="Your name"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
                            />
                        )}
                    />
                    {errors.passwordConfirm && <p className="mt-1 text-xs text-red-500 ml-1">{errors.passwordConfirm.message}</p>}
                </div>
            </div>

            {/* Hidden KYC Input */}
            <Controller
                name="kycDocument"
                control={control}
                render={({ field: { onChange } }) => (
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        ref={kycDocumentRef}
                        onChange={(e) => handleFileChange(e, onChange)}
                        style={{ display: 'none' }}
                    />
                )}
            />
            {selectedFileName && (
                <p className="text-center text-sm text-gray-600 mb-4">
                    Selected: {selectedFileName}
                </p>
            )}
             {errors.kycDocument && <p className="text-center text-xs text-red-500 mb-4">{errors.kycDocument.message}</p>}


            {/* Actions */}
            <div className="flex gap-4">
                <Button
                    className="flex-1 py-3 text-red-500 font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 normal-case shadow-none border border-transparent hover:border-gray-300 transition-all"
                    onClick={handleFileUpload}
                    variant="contained"
                    disableElevation
                    sx={{
                        color: '#EF4444',
                        bgcolor: '#F3F4F6',
                        '&:hover': { bgcolor: '#E5E7EB' },
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    Upload KYC Verification
                </Button>

                <Button
                    className={`flex-1 py-3 font-semibold rounded-lg normal-case shadow-none text-white bg-[#FF4500] hover:bg-[#FF3000]`}
                    type="submit"
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
            
            {/* Footer Removed as requested */}
        </div>
    );
}