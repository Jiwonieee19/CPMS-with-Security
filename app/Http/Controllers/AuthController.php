<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use App\Models\Staffs;

class AuthController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5; // Max attempts before lockout
    private const LOGIN_LOCKOUT_SECONDS = 300;

    public function login(Request $request)
    {
        $request->validate([
            'staffid' => 'required',
            'password' => 'required'
        ]);

        // Verify Google reCAPTCHA v2 if configured
        $recaptchaSecret = config('services.recaptcha.secret');
        $recaptchaResponse = $request->input('g-recaptcha-response');

        if ($recaptchaSecret) {
            if (empty($recaptchaResponse)) {
                return response()->json([
                    'success' => false,
                    'message' => 'CAPTCHA required'
                ], 400);
            }

            try {
                $httpClient = Http::asForm()->timeout(10);

                if (!config('services.recaptcha.verify_ssl', true)) {
                    $httpClient = $httpClient->withoutVerifying();
                }

                $verify = $httpClient->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $recaptchaSecret,
                    'response' => $recaptchaResponse,
                    'remoteip' => $request->ip(),
                ]);

                if ($verify->failed()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'CAPTCHA verification failed'
                    ], 400);
                }

                $body = $verify->json();
                if (!($body['success'] ?? false)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'CAPTCHA verification failed'
                    ], 400);
                }
            } catch (\Throwable $e) {
                $failOpenLocal = app()->environment(['local', 'testing'])
                    && config('services.recaptcha.fail_open_local', true);

                if ($failOpenLocal) {
                    Log::warning('CAPTCHA verification skipped due to local/testing transport error.', [
                        'error' => $e->getMessage(),
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'CAPTCHA verification error'
                    ], 500);
                }

            }

        }

        $staffId = $request->input('staffid');
        $password = $request->input('password');
        $lockoutKey = $this->getLoginLockoutKey($request, $staffId);

        if (RateLimiter::tooManyAttempts($lockoutKey, self::MAX_LOGIN_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($lockoutKey);

            return response()->json([
                'success' => false,
                'message' => 'Too many failed login attempts. Try again in ' . $seconds . ' seconds.'
            ], 429); // 5mins retry
        }

        // Check for static admin account
        if ($staffId === '0' && $password === 'superadmin') {
            RateLimiter::clear($lockoutKey);

            // Create session for admin
            Session::put('user', [
                'staff_id' => 0,
                'staff_firstname' => 'Super',
                'staff_lastname' => 'Admin',
                'staff_role' => 'admin',
                'staff_email' => 'admin@system.com'
            ]);

            // Track last activity for idle timeout enforcement
            Session::put('last_activity', time());

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'redirect' => '/dashboard'
            ]);
        }

        // Check database for regular users
        $staff = Staffs::where('staff_id', $staffId)->first();
        // SELECT * FROM staff WHERE staff_id = '12345' LIMIT 1;

        if (!$staff) {
            RateLimiter::hit($lockoutKey, self::LOGIN_LOCKOUT_SECONDS);

            return response()->json([
                'success' => false,
                'message' => 'Invalid Credentials'
            ], 401);
        }

        // Check if account is active
        if (strtolower($staff->staff_status) === 'inactive') {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact the administrator.'
            ], 403);
        }

        // Verify password with hashing
        if (!Hash::check($password, $staff->staff_password)) {
            RateLimiter::hit($lockoutKey, self::LOGIN_LOCKOUT_SECONDS);

            return response()->json([
                'success' => false,
                'message' => 'Invalid Credentials'
            ], 401);
        }

        RateLimiter::clear($lockoutKey);

        // Create session for authenticated user
        Session::put('user', [
            'staff_id' => $staff->staff_id,
            'staff_firstname' => $staff->staff_firstname,
            'staff_lastname' => $staff->staff_lastname,
            'staff_role' => $staff->staff_role,
            'staff_email' => $staff->staff_email
        ]);

        // Track last activity for idle timeout enforcement
        Session::put('last_activity', time());

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'redirect' => '/dashboard'
        ]);
    }

    public function logout(Request $request)
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function checkAuth(Request $request)
    {
        $user = Session::get('user');
        
        if ($user) {
            return response()->json([
                'authenticated' => true,
                'user' => $user
            ]);
        }

        return response()->json([
            'authenticated' => false
        ]);
    }

    private function getLoginLockoutKey(Request $request, string $staffId): string
    {
        return 'login-lockout:' . strtolower(trim($staffId)) . '|' . $request->ip();
    }
}
