'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { TextField } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

function BusinessInfoTab() {
    const { control, formState } = useFormContext();
    const { errors } = formState;

    return (
        <div className="space-y-6">
            <Controller
                name="company_name"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Company Name"
                        fullWidth
                        error={!!errors.company_name}
                        helperText={errors.company_name?.message as string}
                        required
                    />
                )}
            />
            <Controller
                name="tax_id"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Tax ID (GST/VAT)"
                        fullWidth
                        error={!!errors.tax_id}
                        helperText={errors.tax_id?.message as string}
                    />
                )}
            />
            <Controller
                name="bank_account"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Bank Account"
                        fullWidth
                        error={!!errors.bank_account}
                        helperText={errors.bank_account?.message as string}
                    />
                )}
            />
            <Controller
                name="website"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Website"
                        fullWidth
                        error={!!errors.website}
                        helperText={errors.website?.message as string}
                    />
                )}
            />
        </div>
    );
}

export default BusinessInfoTab;