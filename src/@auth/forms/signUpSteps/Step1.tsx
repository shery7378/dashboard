import { Controller, Control, FieldErrors } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormHelperText from '@mui/material/FormHelperText';
import Button from '@mui/material/Button';
import { FormType } from '../AuthJsCredentialsSignUpForm';

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
    return (
        <>
            <Controller
                name="role"
                control={control}
                render={({ field }) => (
                    <FormControl component="fieldset" className="mb-2" error={!!errors.role}>
                        <RadioGroup {...field} row>
                            <FormControlLabel value="vendor" control={<Radio />} label="Selller" />
                            <FormControlLabel value="supplier" control={<Radio />} label="Supplier" />
                        </RadioGroup>
                        {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                    </FormControl>
                )}
            />

            <Controller
                name="email"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        className="mb-6"
                        label="Email"
                        type="email"
                        error={!!errors.email}
                        helperText={errors?.email?.message}
                        variant="outlined"
                        required
                        fullWidth
                        autoFocus
                    />
                )}
            />

            <Button
                variant="contained"
                color="secondary"
                className="w-full font-bold"
                onClick={handleSendCode}
                disabled={isSendingCode || !email || !!errors.email || !!errors.role || countdown > 0}
            >
                {isSendingCode
                    ? 'Sending...'
                    : countdown > 0
                        ? `Resend Code (${countdown}s)`
                        : 'Get Code'}
            </Button>
        </>
    );
}