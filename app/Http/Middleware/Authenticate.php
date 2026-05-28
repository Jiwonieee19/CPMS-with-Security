<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class Authenticate
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated via session
        if (!Session::has('user')) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated'
                ], 401)->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                  ->header('Pragma', 'no-cache'); // Prevent caching after logout
            }
            
            return redirect('/')->with('error', 'Please log in to access this page');
        }

        // Enforce server-side idle timeout
        $idleTimeout = config('session.idle_timeout', (int) env('SESSION_IDLE_TIMEOUT', 1200));
        $last = Session::get('last_activity');

        if ($last && (time() - (int) $last) > $idleTimeout) {
            // Log event and flush session for all users including admin
            Log::info('Session timed out due to inactivity', [
                'ip' => $request->ip(),
                'user' => Session::get('user'),
            ]);

            Session::flush();

            // LOGOUT TIMEOUT EVENT
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Session timed out due to inactivity'
                ], 401)->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                  ->header('Pragma', 'no-cache');
            }

            return redirect('/')->with('error', 'Session timed out due to inactivity');
        }

        // Update last activity timestamp
        Session::put('last_activity', time());

        $response = $next($request);

        return $response
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache');
    }
}
