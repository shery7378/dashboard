import { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";
import {
    Autocomplete,
    TextField,
    Chip,
    Box,
    CircularProgress,
    Typography,
} from "@mui/material";

interface User {
    id: number;
    email: string;
    name: string;
    label: string;
    value: string;
}

interface UserSearchAutocompleteProps {
    value: number[];
    onChange: (userIds: number[]) => void;
}

export default function UserSearchAutocomplete({ value, onChange }: UserSearchAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    // Fetch users when input changes
    useEffect(() => {
        if (inputValue.length < 2) {
            setOptions([]);
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await apiFetch(`/api/admin/coupons/search-users?q=${encodeURIComponent(inputValue)}`);
                setOptions(res?.data || []);
            } catch (error) {
                console.error("Failed to search users:", error);
                setOptions([]);
            } finally {
                setLoading(false);
            }
        };

        // Debounce
        const timeoutId = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [inputValue]);

    return (
        <Box>
            <Autocomplete
                multiple
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option.label || `${option.name} <${option.email}>`}
                options={options}
                loading={loading}
                value={selectedUsers}
                onChange={(event, newValue) => {
                    setSelectedUsers(newValue);
                    onChange(newValue.map(u => u.id));
                }}
                inputValue={inputValue}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                        <Chip
                            label={option.email}
                            {...getTagProps({ index })}
                            key={option.id}
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Select Users"
                        placeholder="Search by name or email..."
                        helperText="Start typing to search users. Leave empty for public coupon."
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
                renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                        <Box>
                            <Typography variant="body2" fontWeight={600}>
                                {option.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {option.email}
                            </Typography>
                        </Box>
                    </li>
                )}
                noOptionsText={
                    inputValue.length < 2
                        ? "Type at least 2 characters to search"
                        : "No users found"
                }
            />
        </Box>
    );
}
