import { Controller, Control, FieldErrors } from 'react-hook-form';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FormType } from '../AuthJsCredentialsSignUpForm';
import { AuthTitle, AuthInput, AuthButton } from '@/components/auth';

interface Step3Props {
	control: Control<FormType>;
	errors: FieldErrors<FormType>;
	handleNextStep: () => void;
	handleBackStep: () => void;
}

export default function Step3({ control, errors, handleNextStep, handleBackStep }: Step3Props) {
	const BRAND_COLOR = 'text-red-600';
	const BG_BRAND = 'bg-red-600';
	const BORDER_BRAND = 'border-red-600';

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
				<div
					className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}
				>
					1
				</div>
				<div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>

				{/* Step 2: Filled */}
				<div
					className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}
				>
					2
				</div>
				<div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>

				{/* Step 3: Outlined (Active) */}
				<div
					className={`h-8 w-8 rounded-full border-2 ${BORDER_BRAND} flex items-center justify-center bg-white`}
				></div>
				<div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>

				{/* Step 4: Outlined */}
				<div
					className={`h-8 w-8 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white`}
				></div>
			</div>

			{/* Title */}
			<AuthTitle
				heading="Setup Your Store Name Here"
				align="center"
			/>

			{/* Form Fields */}
			<div className="space-y-4 mb-6">
				<Controller
					name="storeName"
					control={control}
					render={({ field }) => (
						<AuthInput
							{...field}
							label="Store Name"
							type="text"
							placeholder="Your store name"
							error={errors.storeName?.message}
						/>
					)}
				/>
				<Controller
					name="ownerName"
					control={control}
					render={({ field }) => (
						<AuthInput
							{...field}
							label="Name"
							type="text"
							placeholder="Your name"
							error={errors.ownerName?.message}
						/>
					)}
				/>
			</div>

			{/* Continue Button */}
			<AuthButton
				variant="primary"
				fullWidth
				onClick={handleNextStep}
				disabled={!!errors.storeName || !!errors.ownerName}
				className="h-12 py-3"
			>
				Continue
			</AuthButton>
		</div>
	);
}
