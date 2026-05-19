import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a_fallback_secret_key_for_dev'
    UPLOAD_FOLDER = 'uploaded_images' 
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024 

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'