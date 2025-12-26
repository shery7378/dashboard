import Button from '@mui/material/Button';
import Link from '@fuse/core/Link';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

type AddStoreButtonProps = {
    className?: string;
};

/**
 * The Add Store button.
 */
function AddStoreButton(props: AddStoreButtonProps) {
    const { className = '' } = props;

    return (
        <Button
            component={Link}
            to="/apps/e-commerce/stores/new"
            role="button"
            className={className}
            variant="contained"
            color="primary"
            // startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>}
        >
            Add Store
        </Button>
    );
}

export default AddStoreButton;