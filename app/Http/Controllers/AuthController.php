<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Http;
use App\Models\Staffs;

class AuthController extends Controller
{
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
                $verify = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $recaptchaSecret,
                    'response' => $recaptchaResponse,
                    'remoteip' => $request->ip(),
                ]);

                $body = $verify->json();
                if (!($body['success'] ?? false)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'CAPTCHA verification failed'
                    ], 400);
                }
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'CAPTCHA verification error'
                ], 500);
            }
        }

        $staffId = $request->input('staffid');
        $password = $request->input('password');

        // Check for static admin account
        if ($staffId === '0' && $password === 'superadmin') {
            // Create session for admin
            Session::put('user', [
                'staff_id' => 0,
                'staff_firstname' => 'Super',
                'staff_lastname' => 'Admin',
                'staff_role' => 'admin',
                'staff_email' => 'admin@system.com'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'redirect' => '/dashboard'
            ]);
        }

        // Check database for regular users
        $staff = Staffs::where('staff_id', $staffId)->first();

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid staff ID or password'
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
            return response()->json([
                'success' => false,
                'message' => 'Invalid staff ID or password'
            ], 401);
        }

        // Create session for authenticated user
        Session::put('user', [
            'staff_id' => $staff->staff_id,
            'staff_firstname' => $staff->staff_firstname,
            'staff_lastname' => $staff->staff_lastname,
            'staff_role' => $staff->staff_role,
            'staff_email' => $staff->staff_email
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'redirect' => '/dashboard'
        ]);
    }

    public function logout(Request $request)
    {
        Session::flush();
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
}
