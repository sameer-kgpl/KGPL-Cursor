from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import pandas as pd
import os
from datetime import datetime
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///recruitment_portal.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Add custom template filter for JSON parsing
@app.template_filter('from_json')
def from_json_filter(value):
    if not value:
        return []
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return []

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'recruiter' or 'candidate'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Candidate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    location = db.Column(db.String(100))
    experience_years = db.Column(db.Integer, default=0)
    current_role = db.Column(db.String(100))
    current_company = db.Column(db.String(100))
    skills = db.Column(db.Text)  # JSON string of skills
    education = db.Column(db.String(200))
    expected_salary = db.Column(db.String(50))
    notice_period = db.Column(db.String(50))
    resume_filename = db.Column(db.String(200))
    summary = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user_type = request.form['user_type']
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists!')
            return redirect(url_for('register'))
        
        user = User(
            email=email,
            password_hash=generate_password_hash(password),
            user_type=user_type
        )
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please login.')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            if user.user_type == 'recruiter':
                return redirect(url_for('recruiter_dashboard'))
            else:
                return redirect(url_for('candidate_profile'))
        else:
            flash('Invalid email or password!')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/recruiter/dashboard')
@login_required
def recruiter_dashboard():
    if current_user.user_type != 'recruiter':
        flash('Access denied!')
        return redirect(url_for('index'))
    
    total_candidates = Candidate.query.count()
    recent_candidates = Candidate.query.order_by(Candidate.created_at.desc()).limit(5).all()
    
    return render_template('recruiter_dashboard.html', 
                         total_candidates=total_candidates,
                         recent_candidates=recent_candidates)

@app.route('/recruiter/search')
@login_required
def search_candidates():
    if current_user.user_type != 'recruiter':
        flash('Access denied!')
        return redirect(url_for('index'))
    
    query = request.args.get('q', '')
    location = request.args.get('location', '')
    experience = request.args.get('experience', '')
    
    candidates_query = Candidate.query
    
    if query:
        candidates_query = candidates_query.filter(
            db.or_(
                Candidate.name.contains(query),
                Candidate.skills.contains(query),
                Candidate.current_role.contains(query),
                Candidate.current_company.contains(query),
                Candidate.education.contains(query)
            )
        )
    
    if location:
        candidates_query = candidates_query.filter(Candidate.location.contains(location))
    
    if experience:
        if experience == '0-2':
            candidates_query = candidates_query.filter(Candidate.experience_years.between(0, 2))
        elif experience == '3-5':
            candidates_query = candidates_query.filter(Candidate.experience_years.between(3, 5))
        elif experience == '6-10':
            candidates_query = candidates_query.filter(Candidate.experience_years.between(6, 10))
        elif experience == '10+':
            candidates_query = candidates_query.filter(Candidate.experience_years >= 10)
    
    candidates = candidates_query.order_by(Candidate.updated_at.desc()).all()
    
    return render_template('search_candidates.html', candidates=candidates, 
                         query=query, location=location, experience=experience)

@app.route('/candidate/<int:id>')
@login_required
def view_candidate(id):
    if current_user.user_type != 'recruiter':
        flash('Access denied!')
        return redirect(url_for('index'))
    
    candidate = Candidate.query.get_or_404(id)
    skills = json.loads(candidate.skills) if candidate.skills else []
    
    return render_template('candidate_detail.html', candidate=candidate, skills=skills)

@app.route('/recruiter/bulk-upload', methods=['GET', 'POST'])
@login_required
def bulk_upload():
    if current_user.user_type != 'recruiter':
        flash('Access denied!')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file selected!')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No file selected!')
            return redirect(request.url)
        
        if file and (file.filename.endswith('.xlsx') or file.filename.endswith('.csv')):
            try:
                if file.filename.endswith('.xlsx'):
                    df = pd.read_excel(file)
                else:
                    df = pd.read_csv(file)
                
                success_count = 0
                error_count = 0
                
                for _, row in df.iterrows():
                    try:
                        # Check if candidate already exists
                        existing = Candidate.query.filter_by(email=row.get('email', '')).first()
                        if existing:
                            error_count += 1
                            continue
                        
                        candidate = Candidate(
                            name=str(row.get('name', '')),
                            email=str(row.get('email', '')),
                            phone=str(row.get('phone', '')),
                            location=str(row.get('location', '')),
                            experience_years=int(row.get('experience_years', 0)),
                            current_role=str(row.get('current_role', '')),
                            current_company=str(row.get('current_company', '')),
                            skills=json.dumps(str(row.get('skills', '')).split(',')),
                            education=str(row.get('education', '')),
                            expected_salary=str(row.get('expected_salary', '')),
                            notice_period=str(row.get('notice_period', '')),
                            summary=str(row.get('summary', ''))
                        )
                        db.session.add(candidate)
                        success_count += 1
                    except Exception as e:
                        error_count += 1
                        continue
                
                db.session.commit()
                flash(f'Upload completed! {success_count} candidates added, {error_count} errors.')
                
            except Exception as e:
                flash(f'Error processing file: {str(e)}')
        else:
            flash('Please upload a valid Excel (.xlsx) or CSV file!')
    
    return render_template('bulk_upload.html')

@app.route('/candidate/profile')
@login_required
def candidate_profile():
    if current_user.user_type != 'candidate':
        flash('Access denied!')
        return redirect(url_for('index'))
    
    candidate = Candidate.query.filter_by(user_id=current_user.id).first()
    skills = json.loads(candidate.skills) if candidate and candidate.skills else []
    
    return render_template('candidate_profile.html', candidate=candidate, skills=skills)

@app.route('/candidate/edit-profile', methods=['GET', 'POST'])
@login_required
def edit_candidate_profile():
    if current_user.user_type != 'candidate':
        flash('Access denied!')
        return redirect(url_for('index'))
    
    candidate = Candidate.query.filter_by(user_id=current_user.id).first()
    
    if request.method == 'POST':
        skills_list = [skill.strip() for skill in request.form['skills'].split(',') if skill.strip()]
        
        if candidate:
            candidate.name = request.form['name']
            candidate.phone = request.form['phone']
            candidate.location = request.form['location']
            candidate.experience_years = int(request.form['experience_years'])
            candidate.current_role = request.form['current_role']
            candidate.current_company = request.form['current_company']
            candidate.skills = json.dumps(skills_list)
            candidate.education = request.form['education']
            candidate.expected_salary = request.form['expected_salary']
            candidate.notice_period = request.form['notice_period']
            candidate.summary = request.form['summary']
            candidate.updated_at = datetime.utcnow()
        else:
            candidate = Candidate(
                user_id=current_user.id,
                name=request.form['name'],
                email=current_user.email,
                phone=request.form['phone'],
                location=request.form['location'],
                experience_years=int(request.form['experience_years']),
                current_role=request.form['current_role'],
                current_company=request.form['current_company'],
                skills=json.dumps(skills_list),
                education=request.form['education'],
                expected_salary=request.form['expected_salary'],
                notice_period=request.form['notice_period'],
                summary=request.form['summary']
            )
            db.session.add(candidate)
        
        db.session.commit()
        flash('Profile updated successfully!')
        return redirect(url_for('candidate_profile'))
    
    skills_str = ', '.join(json.loads(candidate.skills)) if candidate and candidate.skills else ''
    return render_template('edit_candidate_profile.html', candidate=candidate, skills_str=skills_str)

@app.route('/download-template')
@login_required
def download_template():
    if current_user.user_type != 'recruiter':
        flash('Access denied!')
        return redirect(url_for('index'))
    
    # Create sample template
    template_data = {
        'name': ['John Doe', 'Jane Smith'],
        'email': ['john@example.com', 'jane@example.com'],
        'phone': ['9876543210', '9876543211'],
        'location': ['Mumbai', 'Delhi'],
        'experience_years': [3, 5],
        'current_role': ['Software Developer', 'Senior Developer'],
        'current_company': ['Tech Corp', 'Innovation Ltd'],
        'skills': ['Python,Flask,JavaScript', 'React,Node.js,MongoDB'],
        'education': ['B.Tech Computer Science', 'M.Tech Software Engineering'],
        'expected_salary': ['8-12 LPA', '15-20 LPA'],
        'notice_period': ['30 days', 'Immediate'],
        'summary': ['Experienced developer with web technologies', 'Full-stack developer with 5+ years experience']
    }
    
    df = pd.DataFrame(template_data)
    template_path = os.path.join(app.config['UPLOAD_FOLDER'], 'candidate_template.xlsx')
    df.to_excel(template_path, index=False)
    
    return send_file(template_path, as_attachment=True)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Create default admin user if not exists
        admin = User.query.filter_by(email='admin@company.com').first()
        if not admin:
            admin = User(
                email='admin@company.com',
                password_hash=generate_password_hash('admin123'),
                user_type='recruiter'
            )
            db.session.add(admin)
            db.session.commit()
            print("Default admin created: admin@company.com / admin123")
    
    app.run(debug=True, host='0.0.0.0', port=5000)