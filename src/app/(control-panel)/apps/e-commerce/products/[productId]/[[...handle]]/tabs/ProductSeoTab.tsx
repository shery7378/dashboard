'use client';

import TextField from '@mui/material/TextField';
import { useWatch, useFormContext, Controller } from 'react-hook-form';
import { Tooltip, Typography, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function ProductSeoTab() {
    const { control, formState } = useFormContext();
    const { errors } = formState;
    const metaTitle = useWatch({ control, name: 'meta_title' }) || '';
    const metaDesc = useWatch({ control, name: 'meta_description' }) || '';


    const FieldLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
        <div className="flex items-center gap-2 mb-1">
            <Typography variant="subtitle2">{label}</Typography>
            <Tooltip title={tooltip}>
                <IconButton size="small">
                    <InfoOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </div>
    );

    return (
        <div className="grid gap-2 md:grid-cols-1">
            {/* Meta Title */}
            <div>
                <FieldLabel
                    label="Meta Title"
                    tooltip="Title shown in browser tab and search engine results (ideal max: 60 characters)."
                />
                <Controller
                    name="meta_title"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            variant="outlined"
                            fullWidth
                            error={!!errors.meta_title}
                            helperText={`${metaTitle.length}/60 ${errors?.meta_title?.message ? ' - ' + errors.meta_title.message : ''
                                }`} />
                    )}
                />
            </div>

            {/* Meta Description */}
            <div>
                <FieldLabel
                    label="Meta Description"
                    tooltip="Short description for search engine results (ideal max: 160 characters)."
                />
                <Controller
                    name="meta_description"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={4}
                            error={!!errors.meta_description}
                            helperText={`${metaDesc.length}/160 ${errors?.meta_description?.message ? ' - ' + errors.meta_description.message : ''
                                }`}
                        />
                    )}
                />
            </div>

            {/* Meta Keywords */}
            <div>
                <FieldLabel
                    label="Meta Keywords"
                    tooltip="Comma-separated keywords (e.g. electronics, gadgets, phones)."
                />
                <Controller
                    name="meta_keywords"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            variant="outlined"
                            fullWidth
                            multiline
                            error={!!errors.meta_keywords}
                            helperText={errors?.meta_keywords?.message as string}
                        />
                    )}
                />
            </div>
        </div>
    );
}
