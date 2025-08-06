#!/usr/bin/env python3
"""
Recruitment Portal - Run Script
Simple script to start the recruitment portal application
"""

from app import app, db
import os

if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Create default admin user if not exists
        from app import User, generate_password_hash
        admin = User.query.filter_by(email='admin@company.com').first()
        if not admin:
            admin = User(
                email='admin@company.com',
                password_hash=generate_password_hash('admin123'),
                user_type='recruiter'
            )
            db.session.add(admin)
            db.session.commit()
            print("✅ Default admin user created!")
            print("📧 Email: admin@company.com")
            print("🔑 Password: admin123")
        else:
            print("ℹ️  Default admin user already exists")
    
    # Start the application
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    print(f"\n🚀 Starting Recruitment Portal...")
    print(f"🌐 Server will be available at: http://localhost:{port}")
    print(f"🔧 Debug mode: {'ON' if debug else 'OFF'}")
    print(f"📁 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print("\n" + "="*50)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )