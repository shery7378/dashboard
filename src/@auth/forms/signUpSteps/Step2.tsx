import { Control, FieldErrors, useController } from 'react-hook-form';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FormType } from '../AuthJsCredentialsSignUpForm';
import { useState, useRef, useEffect } from 'react';
import { AuthButton, AuthTitle } from '@/components/auth';

interface Step2Props {
	control: Control<FormType>;
	errors: FieldErrors<FormType>;
	emailVerificationCode: string;
	handleVerifyCode: () => void;
	handleBackStep: () => void;
}

export default function Step2({
	control,
	errors,
	emailVerificationCode,
	handleVerifyCode,
	handleBackStep
}: Step2Props) {
	const { field } = useController({
		name: 'emailVerificationCode',
		control
	});

	const [otp, setOtp] = useState(['', '', '', '']);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		if (field.value && field.value.length === 4) {
			setOtp(field.value.split(''));
		}
	}, []);

	useEffect(() => {
		if (inputRefs.current[0]) {
			inputRefs.current[0].focus();
		}
	}, []);

	const updateFormValue = (newOtp: string[]) => {
		const code = newOtp.join('');
		field.onChange(code);
	};

	const handleChange = (index: number, value: string) => {
		if (isNaN(Number(value))) return;

		const newOtp = [...otp];
		newOtp[index] = value.substring(value.length - 1);
		setOtp(newOtp);
		updateFormValue(newOtp);

		// Move to next input
		if (value && index < 3 && inputRefs.current[index + 1]) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const isComplete = otp.join('').length === 4;
	const BRAND_COLOR = 'text-red-500';
	const BG_BRAND = 'bg-red-500';
	const BORDER_BRAND = 'border-red-500';

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
				<div className="text-center mb-8 flex justify-center items-center">
					<img
						src={'/assets/images/MultiKonnect.svg'}
						alt="MultiKonnect"
						className="h-8 w-36 object-contain cursor-pointer"
					/>
				</div>
			</div>

			{/* Title & Email */}
			<AuthTitle
				heading="Enter the 4 Digit code Sent to you"
				subtitle="Check your email for the verification code"
				align="center"
			/>

			{/* OTP Inputs */}
			<div className="flex justify-center gap-4 mb-3">
				{otp.map((digit, index) => (
					<input
						key={index}
						ref={(el) => {
							if (el) inputRefs.current[index] = el;
						}}
						type="text"
						inputMode="numeric"
						value={digit}
						onChange={(e) => handleChange(index, e.target.value)}
						onKeyDown={(e) => handleKeyDown(index, e)}
						className={`w-14 h-14 bg-gray-100 rounded-lg text-center text-xl font-semibold border border-transparent focus:border-red-500 focus:bg-white focus:ring-0 outline-none transition-all duration-200 ${digit ? 'border-gray-200' : ''}`}
						maxLength={1}
						placeholder=""
					/>
				))}
			</div>

			{/* Tip */}
			<p className="text-xs text-center text-gray-500 mb-8">
				<span className="font-bold text-gray-700">Tip :</span> Make Sure to check your inbox and spam folder
			</p>

			{/* Action Buttons */}
			<div className="flex gap-4 mb-8">
				<AuthButton
					className="flex-1 py-3 text-gray-700 font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 normal-case shadow-none"
					onClick={() => {
						/* Resend Logic */
					}}
					variant="secondary"
				>
					Resend
				</AuthButton>
				<AuthButton
					className={`flex-1 py-3 font-semibold rounded-lg normal-case shadow-none ${isComplete ? 'bg-[#FF4500] hover:bg-[#FF3000]' : 'bg-[#FF8A65]'}`}
					onClick={handleVerifyCode}
					disabled={!isComplete}
					variant="primary"
					fullWidth={true}
				>
					Verify Code
				</AuthButton>
			</div>
		</div>
	);
}
