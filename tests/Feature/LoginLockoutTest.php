<?php

use App\Models\Staffs;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('temporarily locks account after repeated failed logins', function () {
    Config::set('services.recaptcha.secret', null);

    $staff = Staffs::create([
        'staff_firstname' => 'Test',
        'staff_lastname' => 'User',
        'staff_role' => 'staff',
        'staff_email' => 'lockout@example.com',
        'staff_contact' => '09123456789',
        'staff_password' => Hash::make('CorrectPassword123!'),
        'staff_status' => 'active',
    ]);

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/login', [
            'staffid' => (string) $staff->staff_id,
            'password' => 'WrongPassword',
        ])->assertStatus(401);
    }

    $this->postJson('/login', [
        'staffid' => (string) $staff->staff_id,
        'password' => 'WrongPassword',
    ])->assertStatus(429)
        ->assertJson([
            'success' => false,
        ])
        ->assertJsonPath('message', fn (string $message) => str_contains($message, 'Too many failed login attempts'));
});

it('allows login in testing when recaptcha transport fails', function () {
    Config::set('services.recaptcha.secret', 'dummy-secret');
    Config::set('services.recaptcha.fail_open_local', true);

    Http::fake(function () {
        throw new \RuntimeException('Simulated captcha transport failure');
    });

    $staff = Staffs::create([
        'staff_firstname' => 'Captcha',
        'staff_lastname' => 'Bypass',
        'staff_role' => 'staff',
        'staff_email' => 'captcha-bypass@example.com',
        'staff_contact' => '09999999999',
        'staff_password' => Hash::make('CorrectPassword123!'),
        'staff_status' => 'active',
    ]);

    $this->postJson('/login', [
        'staffid' => (string) $staff->staff_id,
        'password' => 'CorrectPassword123!',
        'g-recaptcha-response' => 'dummy-response',
    ])->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);
});
