# Cacao Processing Management System

A comprehensive web-based management system for cacao processing operations, built with Laravel. This system streamlines batch tracking, equipment management, quality control, and operational monitoring throughout the cacao processing workflow.

## Overview

The Cacao Processing Management System is designed to help cacao processing facilities manage their entire operational lifecycle from raw material intake to final product quality assessment. It provides real-time visibility into batch status, equipment availability, staff assignments, and environmental conditions.

## Key Features

### Batch Management
- Track cacao batches through all processing stages
- Monitor batch inventory levels and status
- Record incoming and outgoing stock transactions
- Transfer batches between different processing locations
- Complete audit trail for traceability

### Equipment Management
- Maintain comprehensive equipment inventory
- Track equipment stock and availability
- Manage equipment transfer records
- Monitor equipment usage and maintenance needs
- Ensure optimal resource allocation

### Quality Control
- Quality grading and assessment system
- Document quality metrics for each batch
- Maintain quality standards across production runs
- Generate quality reports for analysis

### Environmental Monitoring
- Real-time weather data tracking
- Weather alert system for operational planning
- Weather impact analysis on production
- Historical weather records for correlation studies

### Operations & Logistics
- Staff management and assignment tracking
- Process tracking and workflow documentation
- Complete activity logging system
- Stock in/out line management for both batches and equipment
- Detailed operational logs for compliance and auditing

### User Management
- Secure authentication system
- Role-based access control
- User account management
- Audit trails for accountability

## System Requirements

- **PHP**: 8.2 or higher
- **Database**: MySQL, PostgreSQL, or SQLite
- **Composer**: Latest version
- **Node.js**: For asset compilation
- **Laravel**: 11.x

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Cacao-Processing-Management-System
   ```

2. **Install dependencies**
   ```bash
   composer install
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Configure database**
   - Update `.env` with your database credentials

5. **Run migrations**
   ```bash
   php artisan migrate
   ```

6. **Seed sample data (optional)**
   ```bash
   php artisan db:seed
   ```

7. **Build frontend assets**
   ```bash
   npm run build
   ```

8. **Start the application**
   ```bash
   php artisan serve
   ```

## Project Structure

- **`app/Models/`** - Data models for batches, equipment, quality, weather, and staff
- **`app/Http/Controllers/`** - Request handlers and business logic
- **`app/Http/Middleware/`** - Request middleware for authentication and authorization
- **`app/Helpers/`** - Utility functions and helpers
- **`database/migrations/`** - Database schema definitions
- **`database/seeders/`** - Sample data seeders
- **`resources/views/`** - Frontend views and UI components
- **`routes/`** - Application routing

## Core Models

- **Batches** - Cacao batch records
- **Equipments** - Processing equipment inventory
- **Staffs** - Employee/staff records
- **QualityGrading** - Quality assessment data
- **WeatherData** - Environmental conditions
- **Process** - Operational procedures and tracking
- **Logs** - Comprehensive system activity logs
- **BatchInventory** - Batch stock levels
- **EquipmentInventory** - Equipment availability tracking
- **Stock Lines** - Detailed transaction records (in, out, transfer)

## Development

### Running Tests
```bash
./vendor/bin/pest
```

### Database Migrations
```bash
php artisan migrate
php artisan migrate:rollback
```

### Tinker (Debug Console)
```bash
php artisan tinker
```

## Contributing

We welcome contributions to improve the Cacao Processing Management System. Please ensure:
- Code follows PSR-12 standards
- Tests are provided for new features
- Documentation is updated accordingly
- Database migrations are properly versioned

## Support

For issues, questions, or feature requests, please open an issue in the repository or contact the development team.

## License

This project is proprietary software. All rights reserved.

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
