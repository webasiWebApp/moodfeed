pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-18'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }
        
        stage('Install Server Dependencies') {
            steps {
                dir('server') {
                    echo 'Installing server dependencies...'
                    sh 'npm install'
                }
            }
        }
        
        stage('Install Client Dependencies') {
            steps {
                dir('client') {
                    echo 'Installing client dependencies...'
                    sh 'npm install'
                }
            }
        }
        
        stage('Build Client') {
            steps {
                dir('client') {
                    echo 'Building React application...'
                    sh 'npm run build'
                }
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                sh '''
                    # Stop existing Node process
                    pkill -f "node.*server" || true
                    
                    # Copy files to deployment directory
                    sudo mkdir -p /var/www/moodfeed
                    sudo cp -r server/* /var/www/moodfeed/
                    sudo cp -r client/build /var/www/moodfeed/public
                    
                    # Start server in background
                    cd /var/www/moodfeed
                    nohup node index.js > /tmp/server.log 2>&1 &
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
