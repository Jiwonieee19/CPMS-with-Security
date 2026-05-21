<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StaffsController;
use App\Http\Controllers\EquipmentsController;
use App\Http\Controllers\BatchesController;
use App\Http\Controllers\ProcessController;
use App\Http\Controllers\LogsController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\WeatherAlertController;
use App\Http\Controllers\WeatherReportController;
use App\Http\Controllers\WeatherDataController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return inertia('LoginPage', [
        'recaptcha_site_key' => config('services.recaptcha.site'),
    ]);
});

// Authentication Routes
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/logout', [AuthController::class, 'logout'])->name('logout');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout.post');
Route::get('/auth/check', [AuthController::class, 'checkAuth'])->name('auth.check');

// Protected Routes - Require Authentication
Route::middleware(['auth.custom'])->group(function () {
    Route::get('/dashboard', function () {
        return inertia('DashboardPage');
    });

    //Route::get('/weather', function () {
      //  return inertia('WeatherPage');
    //});


    Route::get('/weather', [WeatherController::class, 'getWeather'])->name('weather');


    Route::get('/process', function () {
        return inertia('ProcessPage');
    });

    Route::get('/logs', function () {
        $initialTab = request()->query('tab', 'weather');
        return inertia('LogsPage', [
            'initialTab' => $initialTab
        ]);
    });

    Route::get('/inventory', function () {
        return inertia('InventoryPage');
    });

    Route::get('/accounts', function () {
        return inertia('AccountsPage');
    });

    // Staff Routes
    Route::get('/staffs/list', [StaffsController::class, 'index'])->name('staffs.index');
    Route::post('/staffs', [StaffsController::class, 'store'])->name('staffs.store');
    Route::get('/staffs/{id}', [StaffsController::class, 'show'])->name('staffs.show');
    Route::put('/staffs/{id}', [StaffsController::class, 'update'])->name('staffs.update');
    Route::delete('/staffs/{id}', [StaffsController::class, 'destroy'])->name('staffs.destroy');

    // Equipment Routes
    Route::get('/equipments/list', [EquipmentsController::class, 'index'])->name('equipments.index');
    Route::post('/equipments', [EquipmentsController::class, 'store'])->name('equipments.store');
    Route::post('/equipments/{id}/stock-in', [EquipmentsController::class, 'stockIn'])->name('equipments.stockIn');

    Route::post('/batches', [BatchesController::class, 'store'])->name('batches.store');
    Route::get('/batches/list', [BatchesController::class, 'index'])->name('batches.index');
    Route::get('/batches/dried', [BatchesController::class, 'getDried'])->name('batches.dried');
    Route::post('/batches/{id}/grade', [BatchesController::class, 'grade'])->name('batches.grade');
    Route::post('/batches/{id}/pickup', [BatchesController::class, 'pickup'])->name('batches.pickup');

    Route::post('/batches/{id}/proceed', [ProcessController::class, 'proceed'])->name('processes.proceed');
    Route::get('/processes/list', [ProcessController::class, 'index'])->name('processes.index');
    Route::post('/processes/{id}/complete', [ProcessController::class, 'complete'])->name('processes.complete');

    Route::get('/logs/list', [LogsController::class, 'index'])->name('logs.index');
    Route::get('/logs/{id}', [LogsController::class, 'show'])->name('logs.show');

    // Weather Routes
    Route::get('/weather/hourly', [WeatherController::class, 'getHourlyWeather'])->name('weather.hourly');
    Route::get('/weather/current', [WeatherController::class, 'getCurrentWeather'])->name('weather.current');

    // Weather Alert Routes
    Route::post('/weather-alerts/store', [WeatherAlertController::class, 'store'])->name('weather-alerts.store');
    Route::get('/weather-alerts/active', [WeatherAlertController::class, 'getActive'])->name('weather-alerts.active');
    Route::post('/weather-alerts/{id}/deactivate', [WeatherAlertController::class, 'deactivate'])->name('weather-alerts.deactivate');

    // Weather Report Routes
    Route::post('/weather-reports/store', [WeatherReportController::class, 'store'])->name('weather-reports.store');
    Route::get('/weather-reports', [WeatherReportController::class, 'getAll'])->name('weather-reports.all');

    // Weather Data Routes
    Route::post('/weather-data/store', [WeatherDataController::class, 'store'])->name('weather-data.store');
    Route::get('/weather-data/latest', [WeatherDataController::class, 'getLatest'])->name('weather-data.latest');
    Route::get('/weather-data/range', [WeatherDataController::class, 'getByDateRange'])->name('weather-data.range');

    // Dashboard Routes
    Route::get('/dashboard/process-overview', [DashboardController::class, 'getProcessOverview'])->name('dashboard.process-overview');
    Route::get('/dashboard/logs-report', [DashboardController::class, 'getLogsReport'])->name('dashboard.logs-report');
    Route::get('/dashboard/status', [DashboardController::class, 'getStatus'])->name('dashboard.status');
});

// API Routes (with CSRF protection) - Deprecated, use the route above
Route::post('/api/staffs', [StaffsController::class, 'store']);
