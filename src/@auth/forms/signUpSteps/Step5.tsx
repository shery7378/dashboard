import { Controller, Control, FieldErrors } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRef, useState } from 'react';
import _ from 'lodash';
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

    return (
        <>
            <Controller
                name="kycDocument"
                control={control}
                render={({ field: { onChange } }) => (
                    <FormControl className="mb-6" error={!!errors.kycDocument}>
                        <Button
                            variant="outlined"
                            color={selectedFileName ? 'success' : 'secondary'}
                            component="span"
                            onClick={handleFileUpload}
                            fullWidth
                        >
                            Upload KYC Document
                        </Button>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            id="kycDocument"
                            ref={kycDocumentRef}
                            onChange={(e) => handleFileChange(e, onChange)}
                            style={{ display: 'none' }}
                        />
                        {selectedFileName && (
                            <Typography variant="body2" color="textSecondary" className="mt-2">
                                Selected file: {selectedFileName}
                            </Typography>
                        )}
                        {errors.kycDocument && (
                            <FormHelperText>{errors.kycDocument.message}</FormHelperText>
                        )}
                    </FormControl>
                )}
            />

            <Controller
                name="password"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        className="mb-6"
                        label="Password"
                        type="password"
                        error={!!errors.password}
                        helperText={errors?.password?.message}
                        variant="outlined"
                        required
                        fullWidth
                    />
                )}
            />

            <Controller
                name="passwordConfirm"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        className="mb-6"
                        label="Confirm Password"
                        type="password"
                        error={!!errors.passwordConfirm}
                        helperText={errors?.passwordConfirm?.message}
                        variant="outlined"
                        required
                        fullWidth
                    />
                )}
            />

            <Controller
                name="acceptTermsConditions"
                control={control}
                render={({ field }) => (
                    <FormControl error={!!errors.acceptTermsConditions} className="mb-6">
                        <FormControlLabel
                            label="I agree to the Terms and Privacy Policy"
                            control={<Checkbox size="small" {...field} />}
                        />
                        <FormHelperText>
                            {errors?.acceptTermsConditions?.message}
                        </FormHelperText>
                    </FormControl>
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
                    aria-label="Register"
                    disabled={_.isEmpty(dirtyFields) || !isValid}
                    type="submit"
                    size="large"
                >
                    Create your free account
                </Button>
            </div>
        </>
    );
}