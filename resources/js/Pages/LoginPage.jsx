import { Suspense, lazy, useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import companyLogo from '../assets/company-logo.png';
import loginBackground from '../assets/login-background.png';

const ForgetPasswordModal = lazy(() => import('../Modals/ForgetPasswordModal'));

export default function LoginPage(props) {

    const [formData, setFormData] = useState({
        staffid: '',
        password: ''
    });

    const [showForgetPasswordModal, setShowForgetPasswordModal] = useState(false);
    const [hasLoadedForgetPasswordModal, setHasLoadedForgetPasswordModal] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);
    const recaptchaSiteKey = props.recaptcha_site_key || null;

    useEffect(() => {
        if (!recaptchaSiteKey) return;

        // don't add the script twice
        if (document.getElementById('recaptcha-script')) {
            if (window.grecaptcha && !recaptchaWidgetId) {
                try {
                    const id = window.grecaptcha.render('recaptcha-widget', {
                        sitekey: recaptchaSiteKey,
                        callback: (token) => setRecaptchaToken(token),
                    });
                    setRecaptchaWidgetId(id);
                } catch (e) {
                    // ignore render errors
                }
            }
            return;
        }

        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;

        window.onRecaptchaLoad = function () {
            if (window.grecaptcha) {
                try {
                    const id = window.grecaptcha.render('recaptcha-widget', {
                        sitekey: recaptchaSiteKey,
                        callback: (token) => setRecaptchaToken(token),
                    });
                    setRecaptchaWidgetId(id);
                } catch (e) {
                    // ignore
                }
            }
        };

        document.body.appendChild(script);

        return () => {
            try {
                if (script && script.parentNode) script.parentNode.removeChild(script);
            } catch (e) { }
            delete window.onRecaptchaLoad;
        };
    }, [recaptchaSiteKey]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (recaptchaSiteKey && !recaptchaToken) {
                setError('Please complete the CAPTCHA');
                setIsLoading(false);
                return;
            }

            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {})
                },
                body: JSON.stringify({
                    staffid: formData.staffid,
                    password: formData.password
                    , 'g-recaptcha-response': recaptchaToken
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Redirect to dashboard on successful login
                window.location.href = data.redirect || '/dashboard';
            } else {
                // Show error message
                setError(data.message || 'Invalid staff ID or password');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPasswordClick = (e) => {
        e.preventDefault();
        setHasLoadedForgetPasswordModal(true);
        setShowForgetPasswordModal(true);
    };

    return (
        <div className="min-h-screen w-screen bg-cover bg-center bg-no-repeat flex items-center justify-end pr-30"
            style={{ backgroundImage: `url(${loginBackground})` }}>
            <div className="bg-[#4A312D] p-8 rounded-2xl shadow-md w-full max-w-md ">
                {/* <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2> */}
                <div className='bg-[#3E2723] p-8 rounded-xl'>
                    <img src={companyLogo} alt="Company Logo" />
                </div>

                <div className='bg-[#3E2723] rounded-xl mt-6 p-5'>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label htmlFor="staffid" className="block text-[#F5F5DC] text-2xl font-semibold mb-3">
                            STAFF ID
                        </label>
                        <div className="relative">
                            <img
                                src={new URL('../assets/icons/icon-login-staff.png', import.meta.url).href}
                                alt="Staff ID icon"
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-7 w-7 pointer-events-none"
                            />
                            <input
                                type="staffid"
                                id="staffid"
                                name="staffid"
                                value={formData.staffid}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-2 border border-gray-300 bg-[#F5F5DC] font-medium rounded-lg focus:outline-none focus:ring-4 focus:ring-[#E5B917] focus:border-transparent"
                                placeholder="ENTER YOUR ID"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password" className="block text-[#F5F5DC] text-2xl font-semibold mb-3">
                            PASSWORD
                        </label>
                        <div className="relative">
                            <img
                                src={new URL('../assets/icons/icon-login-password.png', import.meta.url).href}
                                alt="Password icon"
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 pointer-events-none"
                            />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-11 pr-12 py-2 border border-gray-300 bg-[#F5F5DC] font-medium rounded-lg focus:outline-none focus:ring-4 focus:ring-[#E5B917] focus:border-transparent"
                                placeholder="ENTER YOUR PASSWORD"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3E2723] hover:text-[#E5B917] transition"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <button onClick={handleForgotPasswordClick} className="text-sm text-[#F5F5DC] underline hover:text-[#E5B917] block text-left">
                            FORGOT PASSWORD?
                        </button>
                    </div>

                    {recaptchaSiteKey && (
                        <div className="mb-4 flex justify-center" id="recaptcha-widget-wrapper">
                            <div id="recaptcha-widget"></div>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full bg-[#E5B917] text-[#3E2723] text-3xl font-bold pt-2 pb-3 rounded-lg hover:bg-[#F5F5DC] hover:text-[#E5B917] hover:ring-4 hover:ring-[#E5B917] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                    </button>
                </div>
            </div>

            {(hasLoadedForgetPasswordModal || showForgetPasswordModal) && (
                <Suspense fallback={null}>
                    <ForgetPasswordModal
                        isOpen={showForgetPasswordModal}
                        onClose={() => setShowForgetPasswordModal(false)}
                    />
                </Suspense>
            )}
        </div>
    );
}