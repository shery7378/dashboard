'use client';

import { useParams } from 'next/navigation';
import { 
    Button, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useGetECommerceAttributesQuery, useDeleteECommerceAttributeMutation } from '../../../../apis/ECommerceAttributesApi';
import FuseLoading from '@fuse/core/FuseLoading';

function CategoryAttributesTab() {
	const routeParams = useParams<{ categoryId: string }>();
	const { categoryId } = routeParams;

	const { data: attributesResponse, isLoading, refetch } = useGetECommerceAttributesQuery(categoryId, {
        skip: !categoryId || categoryId === 'new'
    });
	const [deleteAttribute] = useDeleteECommerceAttributeMutation();

	if (isLoading) {
		return <FuseLoading />;
	}

    const attributes = attributesResponse?.data || [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Typography variant="h6">Field Addons (Attributes)</Typography>
					<Typography variant="body2" color="text.secondary">
						Manage custom fields that will appear for products in this category.
					</Typography>
				</div>
				<Button
					variant="contained"
					color="secondary"
					startIcon={<AddIcon />}
					onClick={() => {
                        // TODO: Open Create Dialog
                        alert('Create attribute logic coming soon');
                    }}
				>
					Add New Field
				</Button>
			</div>

			<TableContainer component={Paper} className="shadow-none border border-slate-200">
				<Table>
					<TableHead>
						<TableRow className="bg-slate-50">
							<TableCell className="font-semibold">Name</TableCell>
							<TableCell className="font-semibold">Slug</TableCell>
							<TableCell className="font-semibold">Status</TableCell>
							<TableCell className="font-semibold align-right">Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{attributes.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-10">
									<Typography color="text.secondary">No field addons defined for this category.</Typography>
								</TableCell>
							</TableRow>
						) : (
							attributes.map((attr) => (
								<TableRow key={attr.id} className="hover:bg-slate-50 transition-colors">
									<TableCell>{attr.name}</TableCell>
									<TableCell><code>{attr.slug}</code></TableCell>
									<TableCell>
										<span className={`px-2 py-1 rounded-full text-xs font-medium ${attr.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
											{attr.is_active ? 'Active' : 'Inactive'}
										</span>
									</TableCell>
									<TableCell className="align-right">
										<Tooltip title="Edit">
											<IconButton size="small" onClick={() => alert('Edit logic coming soon')}>
												<EditIcon className="text-blue-600" />
											</IconButton>
										</Tooltip>
										<Tooltip title="Delete">
											<IconButton 
                                                size="small" 
                                                onClick={async () => {
                                                    if(confirm('Are you sure you want to delete this field addon?')) {
                                                        await deleteAttribute(attr.id);
                                                        refetch();
                                                    }
                                                }}
                                            >
												<DeleteIcon className="text-vivid-red" />
											</IconButton>
										</Tooltip>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</div>
	);
}

export default CategoryAttributesTab;
