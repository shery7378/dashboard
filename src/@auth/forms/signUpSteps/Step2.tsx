import { Controller, Control, FieldErrors } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { FormType } from '../AuthJsCredentialsSignUpForm';

interface Step2Props {
    control: Control<FormType>;
    errors: FieldErrors<FormType>;
    emailVerificationCode: string;
    handleVerifyCode: () => void;
    handleBackStep: () => void;
}

export default function Step2({
    control,
    errors,
    emailVerificationCode,
    handleVerifyCode,
    handleBackStep,
}: Step2Props) {
    return (
        <>
            <Controller
                name="emailVerificationCode"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        className="mb-6"
                        label="Email Verification Code"
                        type="text"
                        error={!!errors.emailVerificationCode}
                        helperText={errors?.emailVerificationCode?.message}
                        variant="outlined"
                        required
                        fullWidth
                        autoFocus
                    />
                )}
            />

            <div className="flex flex-col space-y-4">
                <Button
                    variant="outlined"
                    className="w-full font-bold"
                    onClick={handleBackStep}
                    startIcon={<FuseSvgIcon>heroicons-outline:arrow-left</FuseSvgIcon>}
                    sx={{
                        borderColor: '#ff6b35',
                        color: '#ff6b35',
                        fontWeight: 600,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            borderColor: '#ff8555',
                            backgroundColor: 'rgba(255, 107, 53, 0.08)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                        },
                        '&:active': {
                            transform: 'translateY(0)',
                        },
                    }}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    className="w-full font-bold"
                    onClick={handleVerifyCode}
                    disabled={!emailVerificationCode || !!errors.emailVerificationCode}
                >
                    Verify Code
                </Button>
            </div>
        </>
    );
}