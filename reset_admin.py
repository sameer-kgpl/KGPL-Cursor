#!/usr/bin/env python3
"""
Quick Admin Reset Script
Run this to quickly create or reset admin credentials
"""

from app import app, db, User, generate_password_hash

def reset_admin():
    with app.app_context():
        # Create database tables if they don't exist
        db.create_all()
        
        # Get admin email and password from user
        print("🔧 Quick Admin Reset")
        print("=" * 20)
        
        email = input("Enter admin email (default: admin@company.com): ").strip()
        if not email:
            email = "admin@company.com"
        
        password = input("Enter admin password (default: admin123): ").strip()
        if not password:
            password = "admin123"
        
        try:
            # Delete existing user if exists
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                print(f"🔄 Updating existing user: {email}")
                existing_user.password_hash = generate_password_hash(password)
                existing_user.user_type = 'recruiter'
            else:
                print(f"➕ Creating new admin user: {email}")
                admin = User(
                    email=email,
                    password_hash=generate_password_hash(password),
                    user_type='recruiter'
                )
                db.session.add(admin)
            
            db.session.commit()
            
            print("\n✅ Admin user configured successfully!")
            print(f"📧 Email: {email}")
            print(f"🔑 Password: {password}")
            print(f"🌐 Login at: http://localhost:5000")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.session.rollback()

if __name__ == '__main__':
    reset_admin()