<?php

use Illuminate\Support\Facades\Config;

it('allows access when session is active', function () {
    Config::set('session.idle_timeout', 5);

    $user = [
        'staff_id' => 1,
        'staff_firstname' => 'Active',
        'staff_lastname' => 'User',
        'staff_role' => 'staff',
        'staff_email' => 'active@example.com',
    ];

    $response = $this->withSession([
        'user' => $user,
        'last_activity' => time()
    ])->get('/dashboard');

    $response->assertStatus(200);
});

it('logs out user after idle timeout', function () {
    Config::set('session.idle_timeout', 1);

    $user = [
        'staff_id' => 2,
        'staff_firstname' => 'Idle',
        'staff_lastname' => 'User',
        'staff_role' => 'staff',
        'staff_email' => 'idle@example.com',
    ];

    // simulate old last_activity
    $response = $this->withSession([
        'user' => $user,
        'last_activity' => time() - 3600,
    ])->get('/dashboard');

    $response->assertRedirect('/');
});
