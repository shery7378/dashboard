import { Controller, Control, FieldErrors } from 'react-hook-form';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRef, useState } from 'react';
import { FormType } from '../AuthJsCredentialsSignUpForm';
import { AuthTitle, AuthInput, AuthButton } from '@/components/auth';

interface Step5Props {
	control: Control<FormType>;
	errors: FieldErrors<FormType>;
	handleBackStep: () => void;
	isValid: boolean;
	dirtyFields: Partial<Readonly<FormType>>;
	setValue: (name: keyof FormType, value: any) => void;
}

export default function Step5({ control, errors, handleBackStep, isValid, dirtyFields, setValue }: Step5Props) {
	const kycDocumentRef = useRef<HTMLInputElement>(null);
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

	const handleFileUpload = () => {
		kycDocumentRef.current?.click();
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		// Use setValue to update the form field
		setValue('kycDocument', files);
		setSelectedFileName(files && files.length > 0 ? files[0].name : null);
	};

	const BRAND_COLOR = 'text-red-600';
	const BG_BRAND = 'bg-red-600';

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

				{/* Step 3: Filled */}
				<div
					className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}
				>
					3
				</div>
				<div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>

				{/* Step 4: Filled (Active/Done) */}
				<div
					className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}
				>
					4
				</div>
			</div>

			{/* Title */}
			<AuthTitle
				heading="Setup Your Store Password!"
				align="center"
			/>

			{/* Form Fields */}
			<div className="space-y-4 mb-8">
				<Controller
					name="password"
					control={control}
					render={({ field }) => (
						<AuthInput
							{...field}
							label="Password"
							type="password"
							placeholder="Your password"
							error={errors.password?.message}
						/>
					)}
				/>
				<Controller
					name="passwordConfirm"
					control={control}
					render={({ field }) => (
						<AuthInput
							{...field}
							label="Confirm Password"
							type="password"
							placeholder="Confirm your password"
							error={errors.passwordConfirm?.message}
						/>
					)}
				/>
			</div>

			{/* Hidden KYC Input - Not controlled by React Hook Form */}
			<input
				type="file"
				accept=".pdf,.jpg,.jpeg,.png"
				ref={kycDocumentRef}
				onChange={(e) => {
					const files = e.target.files;
					// Manually set the form value
					const kycField = control._fields.kycDocument;
					if (kycField) {
						kycField._f.value = files;
					}
					setSelectedFileName(files && files.length > 0 ? files[0].name : null);
				}}
				style={{ display: 'none' }}
			/>
			{selectedFileName && <p className="text-center text-sm text-gray-600 mb-4">Selected: {selectedFileName}</p>}
			{errors.kycDocument && (
				<p className="text-center text-xs text-red-500 mb-4">{errors.kycDocument.message}</p>
			)}

			{/* Actions */}
			<div className="flex gap-4">
				<AuthButton
					variant="secondary"
					className="flex-1 h-12 py-3 font-semibold"
					onClick={handleFileUpload}
					type="button"
				>
					Upload KYC Verification
				</AuthButton>
				<AuthButton
					variant="primary"
					className="flex-1 h-12 py-3"
					type="submit"
				>
					Continue
				</AuthButton>
			</div>

			{/* Footer Removed as requested */}
		</div>
	);
}
