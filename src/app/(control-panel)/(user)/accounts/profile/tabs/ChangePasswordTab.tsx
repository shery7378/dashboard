'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { TextField, Typography } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

function ChangePasswordTab() {
    const { control, formState } = useFormContext();
    const { errors } = formState;

    return (
        <>
            <div className="space-y-6">
                {/* <Typography variant="h6" component="h2">
                    Change Password
                </Typography> */}
                <Controller
                    name="current_password"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Current Password"
                            type="password"
                            fullWidth
                            error={!!errors.current_password}
                            helperText={errors.current_password?.message as string}
                        />
                    )}
                />
                <Controller
                    name="new_password"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="New Password"
                            type="password"
                            fullWidth
                            error={!!errors.new_password}
                            helperText={errors.new_password?.message as string}
                        />
                    )}
                />
                <Controller
                    name="confirm_password"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Confirm New Password"
                            type="password"
                            fullWidth
                            error={!!errors.confirm_password}
                            helperText={errors.confirm_password?.message as string}
                        />
                    )}
                />
            </div>
        </>
    );
}

export default ChangePasswordTab;