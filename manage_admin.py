#!/usr/bin/env python3
"""
Admin Management Script for Recruitment Portal
Use this script to create, update, or reset admin user credentials
"""

from app import app, db, User, generate_password_hash
import sys
import getpass

def create_admin():
    """Create a new admin user"""
    print("\n🔧 Create New Admin User")
    print("=" * 30)
    
    email = input("Enter admin email: ").strip()
    if not email:
        print("❌ Email cannot be empty!")
        return
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        print(f"❌ User with email {email} already exists!")
        choice = input("Do you want to update this user? (y/N): ").strip().lower()
        if choice != 'y':
            return
        return update_admin(email)
    
    password = getpass.getpass("Enter password: ")
    confirm_password = getpass.getpass("Confirm password: ")
    
    if password != confirm_password:
        print("❌ Passwords don't match!")
        return
    
    if len(password) < 6:
        print("❌ Password must be at least 6 characters long!")
        return
    
    try:
        admin = User(
            email=email,
            password_hash=generate_password_hash(password),
            user_type='recruiter'
        )
        db.session.add(admin)
        db.session.commit()
        print(f"✅ Admin user created successfully!")
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {'*' * len(password)}")
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.session.rollback()

def update_admin(email=None):
    """Update existing admin user password"""
    print("\n🔄 Update Admin Password")
    print("=" * 25)
    
    if not email:
        email = input("Enter admin email to update: ").strip()
    
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"❌ User with email {email} not found!")
        return
    
    if user.user_type != 'recruiter':
        print(f"❌ User {email} is not a recruiter!")
        return
    
    new_password = getpass.getpass("Enter new password: ")
    confirm_password = getpass.getpass("Confirm new password: ")
    
    if new_password != confirm_password:
        print("❌ Passwords don't match!")
        return
    
    if len(new_password) < 6:
        print("❌ Password must be at least 6 characters long!")
        return
    
    try:
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        print(f"✅ Password updated successfully for {email}!")
    except Exception as e:
        print(f"❌ Error updating password: {e}")
        db.session.rollback()

def list_admins():
    """List all admin users"""
    print("\n👥 Admin Users")
    print("=" * 15)
    
    admins = User.query.filter_by(user_type='recruiter').all()
    if not admins:
        print("❌ No admin users found!")
        return
    
    for i, admin in enumerate(admins, 1):
        print(f"{i}. {admin.email} (ID: {admin.id})")
        print(f"   Created: {admin.created_at.strftime('%Y-%m-%d %H:%M:%S')}")

def delete_admin():
    """Delete an admin user"""
    print("\n🗑️  Delete Admin User")
    print("=" * 20)
    
    email = input("Enter admin email to delete: ").strip()
    
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"❌ User with email {email} not found!")
        return
    
    if user.user_type != 'recruiter':
        print(f"❌ User {email} is not a recruiter!")
        return
    
    # Check if this is the last admin
    admin_count = User.query.filter_by(user_type='recruiter').count()
    if admin_count <= 1:
        print("❌ Cannot delete the last admin user!")
        return
    
    confirm = input(f"Are you sure you want to delete {email}? (y/N): ").strip().lower()
    if confirm != 'y':
        print("❌ Deletion cancelled!")
        return
    
    try:
        db.session.delete(user)
        db.session.commit()
        print(f"✅ Admin user {email} deleted successfully!")
    except Exception as e:
        print(f"❌ Error deleting user: {e}")
        db.session.rollback()

def reset_default_admin():
    """Reset to default admin credentials"""
    print("\n🔄 Reset Default Admin")
    print("=" * 22)
    
    confirm = input("This will create/reset admin@company.com with password 'admin123'. Continue? (y/N): ").strip().lower()
    if confirm != 'y':
        print("❌ Reset cancelled!")
        return
    
    try:
        # Delete existing admin@company.com if exists
        existing = User.query.filter_by(email='admin@company.com').first()
        if existing:
            db.session.delete(existing)
        
        # Create new default admin
        admin = User(
            email='admin@company.com',
            password_hash=generate_password_hash('admin123'),
            user_type='recruiter'
        )
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Default admin reset successfully!")
        print("📧 Email: admin@company.com")
        print("🔑 Password: admin123")
        print("⚠️  Please change this password after login!")
        
    except Exception as e:
        print(f"❌ Error resetting default admin: {e}")
        db.session.rollback()

def main():
    """Main menu"""
    with app.app_context():
        while True:
            print("\n🏢 Recruitment Portal - Admin Management")
            print("=" * 40)
            print("1. Create new admin user")
            print("2. Update admin password")
            print("3. List all admin users")
            print("4. Delete admin user")
            print("5. Reset to default admin")
            print("6. Exit")
            print()
            
            choice = input("Select an option (1-6): ").strip()
            
            if choice == '1':
                create_admin()
            elif choice == '2':
                update_admin()
            elif choice == '3':
                list_admins()
            elif choice == '4':
                delete_admin()
            elif choice == '5':
                reset_default_admin()
            elif choice == '6':
                print("👋 Goodbye!")
                break
            else:
                print("❌ Invalid option! Please select 1-6.")
            
            input("\nPress Enter to continue...")

if __name__ == '__main__':
    # Check if database exists
    try:
        with app.app_context():
            db.create_all()
        main()
    except Exception as e:
        print(f"❌ Database error: {e}")
        print("💡 Make sure to run this script from the project directory.")
        sys.exit(1)